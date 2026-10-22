import type { CacheAssets } from "osrs-sdk/asset-manifest";
import { NPC, SEQ, SOUND, SPOT } from "./data";

const p1Seqs = {
  idle: SEQ.p1Idle,
  walk: SEQ.p1Walk,
  volleyStart: SEQ.p1VolleyStart,
  volleyEnd: SEQ.p1VolleyEnd,
  charge: SEQ.p1Charge,
  expend: SEQ.p1Expend,
  explode: SEQ.p1Explode,
  teleportOut: SEQ.p1TeleportOut,
  teleportIn: SEQ.p1TeleportIn,
  transformation: SEQ.p1Transformation,
};

const p3Seqs = {
  idle: SEQ.p3Idle,
  idleHigh: SEQ.p3IdleHigh,
  walk: SEQ.p3Walk,
  meleeBasic: SEQ.p3MeleeBasic,
  meleeHybrid: SEQ.p3MeleeHybrid,
  meleePrayer: SEQ.p3MeleePrayer,
  meleeSlash: SEQ.p3MeleeSlash,
  superiorSlash: SEQ.p3SuperiorSlash,
  projectileAll: SEQ.p3ProjectileAll,
  soulFragmentStart: SEQ.p3SoulFragmentStart,
  soulFragmentEnd: SEQ.p3SoulFragmentEnd,
  unleashIn: SEQ.p3UnleashIn,
  unleashLoop: SEQ.p3UnleashLoop,
  unleashOut: SEQ.p3UnleashOut,
  unleashOut90: SEQ.p3UnleashOut90,
  quadrantDestroyIn: SEQ.p3QuadrantDestroyIn,
  quadrantDestroyLoop: SEQ.p3QuadrantDestroyLoop,
  deflectIn: SEQ.p3DeflectIn,
  deflectLoop: SEQ.p3DeflectLoop,
  deflectOut: SEQ.p3DeflectOut,
  prayerIn: SEQ.p3PrayerIn,
  prayerLoop: SEQ.p3PrayerLoop,
  prayerOut: SEQ.p3PrayerOut,
  death: SEQ.p3Death,
};

function spots(): Record<string, { id: number }> {
  const out: Record<string, { id: number }> = {};
  for (const [name, value] of Object.entries(SPOT)) {
    if (typeof value === "number") out[`fight_${name}`] = { id: value };
    else value.forEach((id, i) => (out[`fight_${name}_${i}`] = { id }));
  }
  return out;
}

function sounds(): Record<string, { id: number }> {
  const out: Record<string, { id: number }> = {};
  for (const [name, value] of Object.entries(SOUND)) {
    if (typeof value === "number") out[`fight_${name}`] = { id: value };
    else value.forEach((id, i) => (out[`fight_${name}_${i}`] = { id }));
  }
  return out;
}

/** Everything the full fight renders or plays, extracted from the cache at build time. */
export const FIGHT_ASSETS = {
  npcs: {
    fightHoodedFigure: { id: NPC.hoodedFigure, animations: p1Seqs },
    fightOcellusP1: { id: NPC.p1, animations: p1Seqs },
    fightOcellusP2: { id: NPC.p2, animations: { idle: SEQ.p2Idle, transformation: SEQ.p2Transformation, toP3Part1: SEQ.p2ToP3Part1, toP3Part2: SEQ.p2ToP3Part2 } },
    fightOcellusP3: { id: NPC.p3, animations: p3Seqs },
    fightVoidRift: { id: NPC.riftBasic, animations: {} },
    fightHealingRift: { id: NPC.riftHeal, animations: {} },
    fightVoidAugmenter: { id: NPC.riftBuff, animations: {} },
    fightVoidVine: { id: NPC.vine, animations: {} },
  },
  spotAnims: spots(),
  sounds: sounds(),
} satisfies CacheAssets;
