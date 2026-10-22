import * as THREE from "three";
import { CacheRenderInstancedModel, CacheRenderReferences, CollisionType, Entity, GROUND_OVERLAY_Y, LineOfSightMask, Settings } from "osrs-sdk";
import type { Location3, Model, Region, Renderable, Unit } from "osrs-sdk";
import { spriteFile } from "../../../../assets";
import { OCELLUS_P4 } from "../OcellusTimings";
import type { BossOverhead, Special, Stage, Tile, VoidKind } from "../P4Types";
import type { Side, TileMask } from "../p4/floor";
import { VOID_MASKS } from "../p4/floor";

const LOOK = OCELLUS_P4.floor.look.value;
const RIM_DEPTH = 0.18;
const RIM_HEIGHT = 0.15;
const STAR_TILES = 4;
const STAR_PX_PER_TILE = 32;

type Point = Readonly<{ x: number; z: number }>;
type Edge = Readonly<{ at: Tile; side: Side; from: Point; to: Point; inward: Point }>;

/** Tile (x, y) spans world x to x + 1 and z from y - 1 to y; lower y is north. */
export function rimEdges(mask: TileMask): readonly Edge[] {
  return mask.border().map(({ at, side }): Edge => {
    const { x, y } = at;
    switch (side) {
      case "north":
        return { at, side, from: { x, z: y - 1 }, to: { x: x + 1, z: y - 1 }, inward: { x: 0, z: 1 } };
      case "south":
        return { at, side, from: { x, z: y }, to: { x: x + 1, z: y }, inward: { x: 0, z: -1 } };
      case "west":
        return { at, side, from: { x, z: y - 1 }, to: { x, z: y }, inward: { x: 1, z: 0 } };
      case "east":
        return { at, side, from: { x: x + 1, z: y - 1 }, to: { x: x + 1, z: y }, inward: { x: -1, z: 0 } };
      default: {
        const unhandled: never = side;
        return unhandled;
      }
    }
  });
}

function starfield(): THREE.Texture {
  const size = STAR_TILES * STAR_PX_PER_TILE;
  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = LOOK.void;
    context.fillRect(0, 0, size, size);
    context.fillStyle = LOOK.stars;
    let state = 0x2545f491;
    const next = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 2 ** 32;
    };
    for (let star = 0; star < 6 * STAR_TILES * STAR_TILES; star++) {
      context.globalAlpha = 0.35 + 0.65 * next();
      context.fillRect(Math.floor(next() * size), Math.floor(next() * size), next() < 0.2 ? 2 : 1, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function floorGeometry(mask: TileMask): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  for (const { x, y } of mask.tiles()) {
    const corners = [[x, y - 1], [x + 1, y], [x + 1, y - 1], [x, y - 1], [x, y], [x + 1, y]];
    for (const [cx, cz] of corners) {
      positions.push(cx, GROUND_OVERLAY_Y, cz);
      uvs.push(cx / STAR_TILES, cz / STAR_TILES);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  return geometry;
}

type Vertex = readonly [number, number, number];
type Segment = Readonly<{ from: Vertex; to: Vertex }>;

function rimGeometry(mask: TileMask): THREE.BufferGeometry {
  const rim = new THREE.Color(LOOK.rim);
  const positions: number[] = [];
  const colors: number[] = [];
  const lit = (at: Vertex) => {
    positions.push(...at);
    colors.push(rim.r, rim.g, rim.b);
  };
  const dark = (at: Vertex) => {
    positions.push(...at);
    colors.push(0, 0, 0);
  };
  const fadeFromEdge = (edge: Segment, far: Segment) => {
    lit(edge.from);
    lit(edge.to);
    dark(far.to);
    lit(edge.from);
    dark(far.to);
    dark(far.from);
  };
  const floor = GROUND_OVERLAY_Y;
  for (const { from, to, inward } of rimEdges(mask)) {
    const edge: Segment = { from: [from.x, floor, from.z], to: [to.x, floor, to.z] };
    const stripInside: Segment = {
      from: [from.x + inward.x * RIM_DEPTH, floor, from.z + inward.z * RIM_DEPTH],
      to: [to.x + inward.x * RIM_DEPTH, floor, to.z + inward.z * RIM_DEPTH],
    };
    const wallTop: Segment = { from: [from.x, floor + RIM_HEIGHT, from.z], to: [to.x, floor + RIM_HEIGHT, to.z] };
    fadeFromEdge(edge, stripInside);
    fadeFromEdge(edge, wallTop);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

class VoidFloorModel implements Model {
  private readonly group = new THREE.Group();
  private readonly layers = new Map<VoidKind, THREE.Group>();
  private readonly owned: { dispose(): void }[] = [];
  private stars: THREE.Texture | null = null;

  constructor(private readonly showing: () => VoidKind | null) {}

  draw(scene: THREE.Scene, clockDelta: number, tickPercent: number, location: Location3, angleRadians: number, pitchRadians: number, visible: boolean): void {
    if (this.group.parent !== scene) scene.add(this.group);
    const kind = this.showing();
    if (kind !== null && !this.layers.has(kind)) this.layers.set(kind, this.build(VOID_MASKS[kind]));
    this.layers.forEach((layer, layerKind) => {
      layer.visible = visible && layerKind === kind;
    });
  }

  destroy(scene: THREE.Scene): void {
    scene.remove(this.group);
    this.owned.forEach((resource) => resource.dispose());
  }

  getWorldPosition(): THREE.Vector3 {
    return this.group.getWorldPosition(new THREE.Vector3());
  }

  async preload(): Promise<void> {}

  private build(mask: TileMask): THREE.Group {
    if (this.stars === null) {
      this.stars = starfield();
      this.owned.push(this.stars);
    }
    const floorMaterial = new THREE.MeshBasicMaterial({ map: this.stars, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const rimMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const floor = floorGeometry(mask);
    const rim = rimGeometry(mask);
    this.owned.push(floorMaterial, rimMaterial, floor, rim);
    const layer = new THREE.Group();
    layer.add(new THREE.Mesh(floor, floorMaterial), new THREE.Mesh(rim, rimMaterial));
    this.group.add(layer);
    return layer;
  }
}

export class VoidField extends Entity {
  private showing: VoidKind | null = null;

  constructor(region: Region) {
    super(region, { x: 0, y: 0 });
  }

  show(kind: VoidKind | null): void {
    this.showing = kind;
  }

  override get collisionType(): CollisionType {
    return CollisionType.NONE;
  }

  override get lineOfSight(): LineOfSightMask {
    return LineOfSightMask.NONE;
  }

  override draw(tickPercent: number, context: OffscreenCanvasRenderingContext2D): void {
    if (this.showing === null) return;
    const mask = VOID_MASKS[this.showing];
    const scale = Settings.tileSize;
    context.fillStyle = LOOK.void;
    for (const { x, y } of mask.tiles()) context.fillRect(x * scale, y * scale, scale, scale);
    context.strokeStyle = LOOK.rim;
    context.lineWidth = 2;
    context.beginPath();
    for (const { from, to } of rimEdges(mask)) {
      context.moveTo(from.x * scale, (from.z + 1) * scale);
      context.lineTo(to.x * scale, (to.z + 1) * scale);
    }
    context.stroke();
  }

  protected override create3dModel(): Model {
    return new VoidFloorModel(() => this.showing);
  }
}

const ORB_LOOK = OCELLUS_P4.lifeforceOrb.look;
const ORB_MARKER = OCELLUS_P4.lifeforceOrb.marker.value;
const SPAWN_LOOK: Readonly<Record<VoidKind, number>> = { "inner-void": ORB_LOOK.innerSpawn.value, "outer-void": ORB_LOOK.outerSpawn.value };

type Cue = Readonly<{ spotAnim: number; loops: boolean }>;

class Playing {
  ended = false;
  readonly model: CacheRenderInstancedModel;

  constructor(renderable: Renderable, readonly cue: Cue) {
    this.model = CacheRenderInstancedModel.forRenderable(renderable, CacheRenderReferences.spotAnim([{ id: cue.spotAnim }]), {
      onSpotAnimComplete: () => {
        this.ended = true;
      },
    });
  }
}

/** The SDK plays a cache spotanim once, so a looping cue gets a fresh instance each time one ends. */
class SpotAnimModel implements Model {
  private playing: Playing | null = null;

  constructor(private readonly renderable: Renderable, private readonly cue: () => Cue | null) {}

  draw(scene: THREE.Scene, clockDelta: number, tickPercent: number, location: Location3, angleRadians: number, pitchRadians: number, visible: boolean, modelOffsets: Location3[]): void {
    const cue = this.cue();
    if (this.playing !== null && (this.playing.cue !== cue || (this.playing.ended && this.playing.cue.loops))) {
      this.playing.model.destroy(scene);
      this.playing = null;
    }
    if (this.playing === null && cue !== null) this.playing = new Playing(this.renderable, cue);
    this.playing?.model.draw(scene, clockDelta, tickPercent, location, angleRadians, pitchRadians, visible, modelOffsets);
  }

  destroy(scene: THREE.Scene): void {
    this.playing?.model.destroy(scene);
  }

  getWorldPosition(): THREE.Vector3 {
    return this.playing?.model.getWorldPosition() ?? new THREE.Vector3();
  }

  async preload(): Promise<void> {}
}

export class OrbView extends Entity {
  private shown: Readonly<{ cue: Cue; marker: string | null }> | null = null;

  constructor(region: Region) {
    super(region, { x: 0, y: 0 });
  }

  spawn(kind: VoidKind, at: Tile): void {
    this.location = { x: at.x, y: at.y };
    this.shown = { cue: { spotAnim: SPAWN_LOOK[kind], loops: false }, marker: ORB_MARKER.dormant };
  }

  mature(): void {
    this.shown = { cue: { spotAnim: ORB_LOOK.idle.value, loops: true }, marker: ORB_MARKER.ready };
  }

  leave(): void {
    this.shown = { cue: { spotAnim: ORB_LOOK.despawn.value, loops: false }, marker: null };
  }

  override get collisionType(): CollisionType {
    return CollisionType.NONE;
  }

  override get lineOfSight(): LineOfSightMask {
    return LineOfSightMask.NONE;
  }

  override draw(tickPercent: number, context: OffscreenCanvasRenderingContext2D): void {
    if (!this.shown?.marker) return;
    const scale = Settings.tileSize;
    context.fillStyle = this.shown.marker;
    context.beginPath();
    context.arc((this.location.x + 0.5) * scale, (this.location.y + 0.5) * scale, scale / 3, 0, 2 * Math.PI);
    context.fill();
  }

  protected override create3dModel(): Model {
    return new SpotAnimModel(this, () => this.shown?.cue ?? null);
  }
}

const SHARD_COLOUR = OCELLUS_P4.explosion.shards.value;
const SHARDS = 7;
const SHARD_RING = 0.3;
const SHARD_LEAN = 0.12;
const SHARD_HALF_WIDTH = 0.05;
const SHARD_HEIGHT = 0.85;
const SPIN_PER_SECOND = 3;
const TICK_SECONDS = 0.6;

type Blast = "marked" | "detonated";

function shardGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let shard = 0; shard < SHARDS; shard++) {
    const angle = (2 * Math.PI * shard) / SHARDS;
    const [ox, oz] = [Math.cos(angle), Math.sin(angle)];
    const tip = SHARD_RING + SHARD_LEAN;
    positions.push(
      ox * SHARD_RING - oz * SHARD_HALF_WIDTH, 0, oz * SHARD_RING + ox * SHARD_HALF_WIDTH,
      ox * SHARD_RING + oz * SHARD_HALF_WIDTH, 0, oz * SHARD_RING - ox * SHARD_HALF_WIDTH,
      ox * tip, SHARD_HEIGHT, oz * tip,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

class BurstModel implements Model {
  private readonly material = new THREE.MeshBasicMaterial({ color: SHARD_COLOUR, side: THREE.DoubleSide, transparent: true });
  private readonly mesh = new THREE.Mesh(shardGeometry(), this.material);
  private flare = 0;

  constructor(private readonly blast: () => Blast) {}

  draw(scene: THREE.Scene, clockDelta: number, tickPercent: number, location: Location3, angleRadians: number, pitchRadians: number, visible: boolean): void {
    if (this.mesh.parent !== scene) scene.add(this.mesh);
    this.flare = this.blast() === "detonated" ? Math.min(1, this.flare + clockDelta / TICK_SECONDS) : 0;
    this.mesh.visible = visible && this.flare < 1;
    this.mesh.position.set(location.x + 0.5, GROUND_OVERLAY_Y, location.y - 0.5);
    this.mesh.rotation.y += clockDelta * SPIN_PER_SECOND;
    this.mesh.scale.setScalar(1 + this.flare);
    this.material.opacity = 1 - this.flare;
  }

  destroy(scene: THREE.Scene): void {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
  }

  getWorldPosition(): THREE.Vector3 {
    return this.mesh.getWorldPosition(new THREE.Vector3());
  }

  async preload(): Promise<void> {}
}

class ExplosionView extends Entity {
  private blast: Blast = "marked";

  constructor(region: Region, at: Tile) {
    super(region, { x: at.x, y: at.y });
  }

  detonate(): void {
    this.blast = "detonated";
  }

  override tick(): void {
    if (this.blast === "detonated") this.dying = 0;
  }

  override get collisionType(): CollisionType {
    return CollisionType.NONE;
  }

  override get lineOfSight(): LineOfSightMask {
    return LineOfSightMask.NONE;
  }

  override draw(tickPercent: number, context: OffscreenCanvasRenderingContext2D): void {
    if (this.blast !== "marked") return;
    const scale = Settings.tileSize;
    context.fillStyle = SHARD_COLOUR;
    context.fillRect((this.location.x + 0.15) * scale, (this.location.y + 0.15) * scale, 0.7 * scale, 0.7 * scale);
  }

  protected override create3dModel(): Model {
    return new BurstModel(() => this.blast);
  }
}

export class ExplosionViews {
  private readonly live = new Map<string, ExplosionView>();

  constructor(private readonly region: Region) {}

  mark(kind: VoidKind, pulse: number, at: Tile): void {
    const view = new ExplosionView(this.region, at);
    this.region.addEntity(view);
    this.live.set(`${kind}:${pulse}`, view);
  }

  detonate(kind: VoidKind, pulse: number): void {
    this.live.get(`${kind}:${pulse}`)?.detonate();
    this.live.delete(`${kind}:${pulse}`);
  }
}

export class FragmentFlash extends Entity {
  private cue: Cue | null = null;

  constructor(region: Region) {
    super(region, { x: 0, y: 0 });
  }

  tell(at: Tile): void {
    this.play(at, ORB_LOOK.tell.value);
  }

  regain(at: Tile): void {
    this.play(at, ORB_LOOK.regain.value);
  }

  private play(at: Tile, spotAnim: number): void {
    this.location = { x: at.x, y: at.y };
    this.cue = { spotAnim, loops: false };
  }

  override get collisionType(): CollisionType {
    return CollisionType.NONE;
  }

  override get lineOfSight(): LineOfSightMask {
    return LineOfSightMask.NONE;
  }

  override draw(): void {}

  protected override create3dModel(): Model {
    return new SpotAnimModel(this, () => this.cue);
  }
}

const { bossPoses, transitionTells, tellCentre, overheadIcons, overheadIconBelowHpBar } = OCELLUS_P4.presentation;
const OVERHEAD_ICONS = new Map<BossOverhead, HTMLImageElement>();

export function drawOverheadIcon(context: OffscreenCanvasRenderingContext2D, scale: number, overhead: BossOverhead): void {
  let icon = OVERHEAD_ICONS.get(overhead);
  if (!icon) {
    icon = new Image();
    icon.src = `osrs-assets/${spriteFile(overheadIcons[overhead].value)}`;
    OVERHEAD_ICONS.set(overhead, icon);
  }
  if (icon.complete && icon.naturalWidth > 0) context.drawImage(icon, -scale / 2, overheadIconBelowHpBar.value, scale, scale);
}

const HEAL_SPLAT_SLOTS: readonly Readonly<{ x: number; y: number }>[] = [{ x: 0, y: 30 }, { x: -18, y: 20 }, { x: 18, y: 20 }];

/** Drawn like the SDK's own hitsplats, in the slots its damage splats use last. */
export function drawHealSplats(context: OffscreenCanvasRenderingContext2D, image: HTMLImageElement, amounts: readonly number[], verticalOffset: number): void {
  amounts.slice(0, HEAL_SPLAT_SLOTS.length).forEach((amount, slot) => {
    const { x, y } = HEAL_SPLAT_SLOTS[slot];
    context.drawImage(image, x - 11, verticalOffset - y - 1, 24, 23);
    context.font = "16px Stats_11";
    context.textAlign = "center";
    context.fillStyle = "#000000";
    context.fillText(String(amount), x + 1, verticalOffset - y + 16);
    context.fillStyle = "#FFFFFF";
    context.fillText(String(amount), x, verticalOffset - y + 15);
    context.textAlign = "left";
  });
}

export class PlayerLook {
  constructor(private readonly player: Unit) {}

  riftBurst(): void {
    this.player.addSpotAnim({ id: OCELLUS_P4.rifts.burstFlare.value, channel: "rift-burst" });
  }
}

export class BossLook {
  constructor(private readonly boss: Unit) {}

  enter(stage: Stage): void {
    switch (stage) {
      case "inner-void":
        this.boss.playAnimation(bossPoses.deflectIn.value);
        return;
      case "lead-in":
      case "after-inner":
      case "outer-void":
      case "after-outer":
        return;
      default: {
        const unhandled: never = stage;
        return unhandled;
      }
    }
  }

  land(): void {
    this.boss.playAnimation(bossPoses.deflectOut.value);
  }

  tell(variant: Special): void {
    const { faceColour, rgb } = tellCentre.value;
    this.boss.playAnimation(bossPoses.meleeHybrid.value);
    this.boss.addSpotAnim({ id: transitionTells[variant].value, channel: "transition-tell", recolor: { [faceColour]: rgb } });
  }
}
