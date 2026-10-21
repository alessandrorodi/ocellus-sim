import type { OrbFloor, ResolvedChoices } from "../OcellusTimings";
import { OCELLUS_P4 } from "../OcellusTimings";
import type { Seed, Tick, Tile, VoidKind } from "../P4Types";
import { FOOTPRINT, PLATFORM, VOID_MASKS } from "./floor";
import { roll } from "./roll";

const { orbDistance, innerOrbFloor } = OCELLUS_P4.lifeforceOrb;

export function reach(a: Tile, b: Tile): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function orbFloor(kind: VoidKind, choices: ResolvedChoices): OrbFloor {
  switch (kind) {
    case "inner-void":
      return innerOrbFloor.value;
    case "outer-void":
      return choices.outerOrbTile.option.value;
    default: {
      const unhandled: never = kind;
      return unhandled;
    }
  }
}

export function orbTile(seed: Seed, at: Tick, player: Tile, kind: VoidKind, choices: ResolvedChoices): Tile {
  const { min, max } = orbDistance.value;
  const safeOnly = orbFloor(kind, choices) === "safe-floor";
  const allowed = PLATFORM.tiles().filter(
    (candidate) => !FOOTPRINT.contains(candidate) && !(safeOnly && VOID_MASKS[kind].contains(candidate)) && reach(candidate, player) >= min,
  );
  const nearest = Math.min(...allowed.map((candidate) => reach(candidate, player)));
  const candidates = allowed.filter((candidate) => reach(candidate, player) <= Math.max(max, nearest)).sort((a, b) => a.y - b.y || a.x - b.x);
  return candidates[Math.floor(roll(seed, "orbTile", at, 0) * candidates.length)];
}
