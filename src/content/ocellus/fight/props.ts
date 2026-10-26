import { CacheRenderModel, CacheRenderReferences, CollisionType, Entity, LineOfSightMask } from "osrs-sdk";
import type { Model, Region } from "osrs-sdk";
import type { CenserLook, FloorState } from "./arena";
import { BRAZIERS, PROP } from "./data";
import type { ATile, Arm, Quadrant } from "./geometry";
import { ARMS, CENSERS, QUADRANTS, STONE_STEPS, at, quadrantOf, same, stonesOf, toSdk } from "./geometry";

/** How a prop looks this frame: hidden, or shown in a pose (a seq id, or none for a still model). */
export type PropLook = Readonly<{ kind: "hidden" }> | Readonly<{ kind: "shown"; pose: number | null }>;

const HIDDEN: PropLook = { kind: "hidden" };
const still = (shown: boolean): PropLook => (shown ? { kind: "shown", pose: null } : HIDDEN);

/** One piece of the room's scenery on one tile, drawn from its cache model in the loc's own rotation. */
class RoomProp extends Entity {
  constructor(
    region: Region,
    tile: ATile,
    private readonly model: number,
    private readonly rotation: number,
    private readonly look: () => PropLook,
  ) {
    const s = toSdk(tile);
    super(region, { x: s.x, y: s.y });
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

  /** Scenery: no Player/NPC outline. */
  override get drawOutline(): boolean {
    return false;
  }

  override visible(): boolean {
    return this.look().kind === "shown";
  }

  override get animationIndex(): number {
    const look = this.look();
    return look.kind === "shown" && look.pose !== null ? look.pose : -1;
  }

  /** A loc's rotation r, as the SDK draws a model: it adds a quarter turn meant for actors, so take it back off. */
  override getPerceivedRotation(): number {
    return (-(this.rotation + 1) * Math.PI) / 2;
  }

  override draw(): void {}

  protected override create3dModel(): Model {
    // Scenery: no effects attach to it, so skip building a mesh for every spotanim in the bundle.
    return CacheRenderModel.forRenderable(this, CacheRenderReferences.model(this.model), { spotAnims: [] });
  }
}

const CENSER_MODEL: Readonly<Record<CenserLook["god"], number>> = {
  bandos: PROP.censer.bandos,
  armadyl: PROP.censer.armadyl,
  zaros: PROP.censer.zaros,
  saradomin: PROP.censer.saradomin,
};

/** Stones 4 and 10 out are the "outer" Gaps, turned for their arm; 7 out is the middle one. */
function gapModel(arm: Arm, step: (typeof STONE_STEPS)[number]): number {
  if (step === 7) return PROP.gap.middle;
  return arm === "N" || arm === "S" ? PROP.gap.northSouth : PROP.gap.eastWest;
}

/** [R] does not record the stones' spawn rotations: the south and west arms mirroring the north and east is a guess. */
const GAP_ROTATION: Readonly<Record<Arm, number>> = { N: 0, E: 0, S: 2, W: 2 };

function standing(state: FloorState, quadrant: Quadrant | null): boolean {
  return quadrant === null || !state.destroyed.includes(quadrant);
}

/**
 * The room's cache scenery, in place of drawn stand-ins: the four braziers from the map square, the god censers
 * (ready, lighting, then spent), and the stepping stones while the fight has them up.
 */
export function roomProps(region: Region, state: () => FloorState, tick: () => number): readonly Entity[] {
  const braziers = BRAZIERS.flatMap(({ x, z, stand, flame }) => {
    const tile = at(x, z);
    const quadrant = quadrantOf(at(Math.sign(x) * 2, Math.sign(z) * 2));
    const shown = () => still(standing(state(), quadrant));
    return [
      new RoomProp(region, tile, PROP.brazier.stand, stand, shown),
      new RoomProp(region, tile, PROP.brazier.flame, flame, () => (standing(state(), quadrant) ? { kind: "shown", pose: PROP.brazier.flameIdle } : HIDDEN)),
    ];
  });
  const censers = QUADRANTS.map((quadrant) => {
    const { tile, god } = CENSERS[quadrant];
    const look = (): PropLook => {
      const now = state();
      const censer = now.censers.find((candidate) => same(candidate.tile, tile));
      if (!censer || !standing(now, quadrant)) return HIDDEN;
      if (censer.litAt === null) return { kind: "shown", pose: PROP.censer.ready };
      return { kind: "shown", pose: tick() - censer.litAt < PROP.censer.spentAfter ? PROP.censer.activate : PROP.censer.spent };
    };
    // Their spawn rotation is not recorded either; the censers are close to round.
    return new RoomProp(region, tile, CENSER_MODEL[god], 0, look);
  });
  const stones = ARMS.flatMap((arm) =>
    stonesOf(arm).map((tile, i) => new RoomProp(region, tile, gapModel(arm, STONE_STEPS[i]), GAP_ROTATION[arm], () => still(state().stones.some((stone) => same(stone, tile))))),
  );
  return [...braziers, ...censers, ...stones];
}
