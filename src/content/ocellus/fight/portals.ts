import * as THREE from "three";
import { CollisionType, Entity, LineOfSightMask, Settings } from "osrs-sdk";
import type { Location3, Model, Region } from "osrs-sdk";
import type { ATile } from "./geometry";
import { key, toSdk } from "./geometry";

export type PortalLook = "inactive" | "lit" | "safe";
export type PortalTile = Readonly<{ tile: ATile; look: PortalLook }>;

const COLOURS: Readonly<Record<PortalLook, number>> = {
  inactive: 0xff9a2e,
  lit: 0xb455ff,
  safe: 0xffb347,
};

/** A soft flame-shaped glow, drawn once and tinted per portal. */
function flameTexture(): THREE.CanvasTexture {
  const w = 64;
  const h = 128;
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(w / 2, h * 0.62, 2, w / 2, h * 0.62, w / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.85)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(w / 2, 2);
    ctx.bezierCurveTo(w * 0.95, h * 0.35, w * 0.98, h * 0.75, w / 2, h - 4);
    ctx.bezierCurveTo(w * 0.02, h * 0.75, w * 0.05, h * 0.35, w / 2, 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

class PortalModel implements Model {
  private readonly group = new THREE.Group();
  private readonly texture = flameTexture();
  private readonly sprites = new Map<string, THREE.Sprite>();
  private time = 0;

  constructor(private readonly portals: () => readonly PortalTile[]) {}

  draw(scene: THREE.Scene, clockDelta: number, tickPercent: number, location: Location3, angleRadians: number, pitchRadians: number, visible: boolean): void {
    if (this.group.parent !== scene) scene.add(this.group);
    this.time += clockDelta;
    const wanted = new Set<string>();
    for (const { tile, look } of this.portals()) {
      const k = key(tile);
      wanted.add(k);
      let sprite = this.sprites.get(k);
      if (!sprite) {
        sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        const s = toSdk(tile);
        sprite.position.set(s.x + 0.5, -0.5 + 0.55, s.y - 0.5);
        this.sprites.set(k, sprite);
        this.group.add(sprite);
      }
      const flicker = 1 + 0.08 * Math.sin(this.time * 7 + tile.x * 1.7 + tile.z * 2.3);
      sprite.scale.set(0.75 * flicker, 1.25 * flicker, 1);
      sprite.material.color.setHex(COLOURS[look]);
      sprite.material.opacity = look === "lit" ? 1 : 0.85;
    }
    for (const [k, sprite] of this.sprites) {
      if (wanted.has(k)) continue;
      this.group.remove(sprite);
      sprite.material.dispose();
      this.sprites.delete(k);
    }
    this.group.visible = visible;
  }

  destroy(scene: THREE.Scene): void {
    scene.remove(this.group);
    this.sprites.forEach((sprite) => sprite.material.dispose());
    this.texture.dispose();
  }

  getWorldPosition(): THREE.Vector3 {
    return new THREE.Vector3();
  }

  async preload(): Promise<void> {}
}

/** Phase 2's "+" of portals: orange while idle or a gap, purple while lit to fire. */
export class PortalCross extends Entity {
  constructor(region: Region, private readonly portals: () => readonly PortalTile[]) {
    super(region, { x: 0, y: 0 });
  }

  override get collisionType(): CollisionType {
    return CollisionType.NONE;
  }

  override get lineOfSight(): LineOfSightMask {
    return LineOfSightMask.NONE;
  }

  override get size(): number {
    return 1;
  }

  override draw(tickPercent: number, context: OffscreenCanvasRenderingContext2D): void {
    const scale = Settings.tileSize;
    for (const { tile, look } of this.portals()) {
      const s = toSdk(tile);
      context.fillStyle = `#${COLOURS[look].toString(16).padStart(6, "0")}`;
      context.fillRect((s.x + 0.2) * scale, (s.y + 0.2) * scale, scale * 0.6, scale * 0.6);
    }
  }

  protected override create3dModel(): Model {
    return new PortalModel(this.portals);
  }
}
