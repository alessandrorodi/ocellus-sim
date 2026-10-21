import * as THREE from "three";
import { CollisionType, Entity, GROUND_OVERLAY_Y, LineOfSightMask, Settings } from "osrs-sdk";
import type { Location3, Model, Region } from "osrs-sdk";
import { OCELLUS_P4 } from "../OcellusTimings";
import type { VoidKind } from "../P4Types";
import type { TileMask } from "../p4/floor";
import { VOID_MASKS } from "../p4/floor";

const LOOK = OCELLUS_P4.floor.look.value;
const RIM_DEPTH = 0.18;
const RIM_HEIGHT = 0.15;
const STAR_TILES = 4;
const STAR_PX_PER_TILE = 32;

type Point = Readonly<{ x: number; z: number }>;
type Edge = Readonly<{ from: Point; to: Point; inward: Point }>;

/** Tile (x, y) spans world x to x + 1 and z from y - 1 to y; lower y is north. */
function rimEdges(mask: TileMask): readonly Edge[] {
  return mask.border().map(({ at: { x, y }, side }): Edge => {
    switch (side) {
      case "north":
        return { from: { x, z: y - 1 }, to: { x: x + 1, z: y - 1 }, inward: { x: 0, z: 1 } };
      case "south":
        return { from: { x, z: y }, to: { x: x + 1, z: y }, inward: { x: 0, z: -1 } };
      case "west":
        return { from: { x, z: y - 1 }, to: { x, z: y }, inward: { x: 1, z: 0 } };
      case "east":
        return { from: { x: x + 1, z: y - 1 }, to: { x: x + 1, z: y }, inward: { x: -1, z: 0 } };
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
