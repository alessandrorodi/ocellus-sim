import type { TwistedBow } from "osrs-sdk";
import type { Cycle, Mechanic, Seed, Special, TickSpan, Tile, TransitionKind, VoidKind } from "./P4Types";
import { cycle, seed, span, tile } from "./P4Types";

type Basis = "footage-repeated" | "footage-once" | "spec-confirmed" | "spec-single" | "inferred" | "assumption";
type Scale = "unscaled" | "team-4" | "team-5" | "team-4-and-5";

const VODS = {
  V1: { streamer: "Molgoatkirby", url: "https://www.twitch.tv/videos/2906214879", tickPrefix: "G", clipTickAtP4Zero: 25 },
  V2: { streamer: "Molgoatkirby", url: "https://www.twitch.tv/videos/2906214879", tickPrefix: "k", clipTickAtP4Zero: 40 },
} as const;
type Vod = keyof typeof VODS;

type Source =
  | Readonly<{ kind: "vod"; vod: Vod; at: string }>
  | Readonly<{ kind: "wiki"; page: string; oldid: number | null }>
  | Readonly<{ kind: "cache"; build: 2746; record: string }>
  | Readonly<{ kind: "owner"; date: "2026-10-21"; topic: string }>;

type Evidence = Readonly<{
  status: "unverified";
  basis: Basis;
  scale: Scale;
  note: string;
  sources: readonly [Source, ...Source[]];
}>;

type Selected<T> = Readonly<{ kind: "selected"; value: T; evidence: Evidence }>;

function selected<T>(value: T, basis: Basis, scale: Scale, note: string, first: Source, ...rest: Source[]): Selected<T> {
  return { kind: "selected", value, evidence: { status: "unverified", basis, scale, note, sources: [first, ...rest] } };
}

type Options = Readonly<Record<string, Selected<unknown>>>;
type Choice<O extends Options> = Readonly<{ default: keyof O & string; options: Readonly<O> }>;
function choice<O extends Options>(defaultKey: keyof O & string, options: O): Choice<O> {
  return { default: defaultKey, options };
}

const vod = (which: Vod, at: string): Source => ({ kind: "vod", vod: which, at });
const wiki = (page: string, oldid: number | null): Source => ({ kind: "wiki", page, oldid });
const cache = (record: string): Source => ({ kind: "cache", build: 2746, record });
const owner = (topic: string): Source => ({ kind: "owner", date: "2026-10-21", topic });
const STRATEGIES = wiki("https://oldschool.runescape.wiki/w/The_Fractured_Archive/Strategies", 15378365);
const BOSS_PAGE = wiki("https://oldschool.runescape.wiki/w/Ocellus", 15378404);
const SOLO_SCALE = wiki("https://secure.runescape.com/m=news/the-fractured-archive---everything-you-need-to-know?oldschool=1", null);

type BossRecipe = Readonly<{
  npcId: Selected<number>;
  size: Selected<number>;
  combatLevel: Selected<number>;
  stats: Selected<Readonly<{ attack: number; strength: number; defence: number; range: number; magic: number }>>;
  defenceBonuses: Selected<Readonly<{ stab: number; slash: number; crush: number; magic: number; range: number }>>;
}>;

type LeadInRecipe = Readonly<{
  hiddenFor: Selected<TickSpan>;
  presentFor: Selected<TickSpan>;
  shout: Selected<Readonly<{ text: string; at: TickSpan; lasts: TickSpan }>>;
}>;

type DamageRange = Readonly<{ min: number; max: number }>;
type FloorDamage = Readonly<{ afterOnset: TickSpan; perTick: DamageRange }>;

export type VoidRecipe<K extends VoidKind> = Readonly<{
  kind: K;
  duration: Selected<TickSpan>;
  orbMaturesAfterHit: Selected<TickSpan>;
  floorDamage: Selected<FloorDamage>;
}>;

export type TransitionRecipe<K extends TransitionKind> = Readonly<{
  kind: K;
  duration: Selected<TickSpan>;
  tellAfterStart: Selected<TickSpan>;
  hitAfterStart: Selected<TickSpan>;
  soulSplitAfterTell: Selected<TickSpan>;
}>;

type CycleRecipe = readonly [
  VoidRecipe<"inner-void">,
  TransitionRecipe<"after-inner">,
  VoidRecipe<"outer-void">,
  TransitionRecipe<"after-outer">,
];

type OverheadByStage = Readonly<{
  "inner-void": Selected<"deflect-melee">;
  "outer-void": Selected<"deflect-range">;
  transition: Selected<"soul-split">;
}>;

type LifeforceRecipe = Readonly<{ tellAfterOnset: Selected<TickSpan>; hitAfterOnset: Selected<TickSpan> }>;
type OrbRecipe = Readonly<{ lastHealAfterHit: Selected<TickSpan> }>;
type ExplosionRecipe = Readonly<{
  firstMarkAfterHit: TickSpan;
  count: number;
  period: TickSpan;
  impactAfterMark: TickSpan;
  damage: DamageRange;
}>;

export type SpecialSelection =
  | Readonly<{ kind: "random-uniform" }>
  | Readonly<{ kind: "rotation"; order: readonly [Special, ...Special[]] }>
  | Readonly<{ kind: "replay"; order: readonly [Special, ...Special[]] }>;

type UnclaimedOrbRule = Readonly<{ kind: "heals-boss"; afterHit: TickSpan }> | Readonly<{ kind: "off" }>;
type BossHealRecipe = Readonly<{ soulSplitAfterHit: Selected<TickSpan> }>;
type RiftRecipe = Readonly<{ spawnBeforeOnset: Selected<TickSpan>; chargeAfterSpawn: Selected<TickSpan> }>;

type GeometryRecipe = Readonly<{
  placeholderArena: Selected<Readonly<{ width: number; height: number }>>;
  bossAnchor: Selected<Tile>;
  playerSpawn: Selected<Tile>;
}>;

export type Focus = Readonly<{ kind: "full-fight" }> | Readonly<{ kind: "drill"; mechanics: readonly [Mechanic, ...Mechanic[]] }>;

type BossPose =
  | "idle"
  | "walk"
  | "deflectIn"
  | "deflectLoop"
  | "deflectOut"
  | "silentDeflectIn"
  | "silentDeflectLoop"
  | "silentDeflectOut"
  | "soulFragmentStart"
  | "soulFragmentEnd"
  | "prayerIn"
  | "prayerLoop"
  | "prayerOut"
  | "meleeHybrid"
  | "meleePrayer"
  | "unleashIn"
  | "unleashLoop"
  | "unleashOut";

type PresentationRecipe = Readonly<{ bossPoses: Readonly<Record<BossPose, Selected<number>>> }>;

type StyleBonuses = Readonly<{ stab: number; slash: number; crush: number; magic: number; range: number }>;
export type ItemStats = Readonly<{
  attack: StyleBonuses;
  defence: StyleBonuses;
  other: Readonly<{ meleeStrength: number; rangedStrength: number; magicDamage: number; prayer: number }>;
}>;
type TrainerItem = Readonly<{ itemId: Selected<number>; stats: Selected<ItemStats> }>;

export const GEAR_SLOTS = ["weapon", "helmet", "chest", "legs", "gloves", "cape", "necklace", "feet", "ring", "ammo"] as const;
export type GearSlot = (typeof GEAR_SLOTS)[number];
export type GearKeys = Readonly<{
  weapon: "twistedBow" | "scytheOfVitur" | "tonalzticsOfRalos";
  helmet: "voidRangerHelm" | "inquisitorsGreatHelm";
  chest: "eliteVoidTop" | "inquisitorsHauberk";
  legs: "eliteVoidRobe" | "inquisitorsPlateskirt";
  gloves: "voidKnightGloves" | "ferociousGloves";
  cape: "dizanasQuiver" | "infernalCape";
  necklace: "necklaceOfAnguish" | "amuletOfTorture";
  feet: "pegasianBoots" | "primordialBoots";
  ring: "venatorRing" | "ultorRing";
  ammo: "dragonArrows";
}>;
export type Setup = Readonly<{ [S in GearSlot]: GearKeys[S] }>;
export type TrainerItemKey =
  | "voidRangerHelm"
  | "eliteVoidTop"
  | "eliteVoidRobe"
  | "voidKnightGloves"
  | "inquisitorsGreatHelm"
  | "inquisitorsHauberk"
  | "inquisitorsPlateskirt"
  | "tonalzticsOfRalos";
type InquisitorPiece = "inquisitorsGreatHelm" | "inquisitorsHauberk" | "inquisitorsPlateskirt";
type RangedStrengthPrayer = "Sharp Eye" | "Hawk Eye" | "Eagle Eye" | "Deadeye" | "Rigour";
export type StanceSpeeds<T extends number = TickSpan> = Readonly<{ rapidSpeed: T; otherSpeed: T }>;

type GearRecipe = Readonly<{
  items: Readonly<Record<TrainerItemKey, TrainerItem>>;
  twistedBow: Selected<StanceSpeeds<TwistedBow["attackSpeed"]>>;
  ralos: Selected<StanceSpeeds & Readonly<{ range: number; longrangeRange: number; hits: number; hitMaxFraction: number }>>;
  division: Selected<Readonly<{ energy: number; accuracyFactor: number; defenceDrainOfMagic: number }>>;
  eliteVoid: Selected<Readonly<{ accuracy: number; damage: number }>>;
  inquisitorCrushPerMille: Selected<Readonly<Record<InquisitorPiece, number>>>;
  rangedStrengthPrayers: Selected<Readonly<Record<RangedStrengthPrayer, number>>>;
  scytheStance: Selected<"jab">;
  specialWeapon: Selected<GearKeys["weapon"]>;
}>;

const BOSS: BossRecipe = {
  npcId: selected(16677, "inferred", "unscaled", "tfa_ocellus_p3, the only combat form after phase 2; live level 1601 differs from cache 1197 (C7)", cache("npc 16677"), BOSS_PAGE),
  size: selected(3, "spec-confirmed", "unscaled", "3x3 marker in both clips", cache("npc 16677 size"), vod("V1", "G29"), vod("V2", "k44")),
  combatLevel: selected(1601, "footage-repeated", "unscaled", "hover text Attack Ocellus (level-1601)", vod("V1", "frame 3317"), vod("V2", "k44")),
  stats: selected({ attack: 325, strength: 250, defence: 250, range: 300, magic: 300 }, "spec-confirmed", "unscaled", "may predate the 11:00 UTC hotfix (C7)", cache("npc 16677 stats [325, 250, 250, 5250, 300, 300]")),
  defenceBonuses: selected({ stab: 150, slash: 100, crush: 30, magic: 200, range: 0 }, "spec-confirmed", "unscaled", "params 5 to 8; the decode has no ranged defence param, taken as 0 (inferred)", cache("npc 16677 params 5, 6, 7, 8")),
};

const LEAD_IN: LeadInRecipe = {
  hiddenFor: selected(span(4), "footage-repeated", "team-4-and-5", "boss model gone from t = 0, back on the main platform at t = 4", vod("V1", "G25 to G29"), vod("V2", "k40 to k44")),
  presentFor: selected(span(4), "footage-repeated", "team-4-and-5", "present from t = 4 but no splats until the first inner void at t = 8", vod("V1", "G29 to G33, first hit G35"), vod("V2", "k44 to k48, first splats k48")),
  shout: selected({ text: "End...", at: span(5), lasts: span(3) }, "footage-repeated", "team-4-and-5", "overhead text from t = 5 for 3 ticks", vod("V1", "G30 to G32"), vod("V2", "k45 to k47")),
};

const INNER_VOID: VoidRecipe<"inner-void"> = {
  kind: "inner-void",
  duration: selected(span(22), "footage-repeated", "team-4-and-5", "inner void visible 22 ticks", vod("V1", "G33-G54, G93-G114, G153-G174"), vod("V2", "k48-k69, k108-k129, k168-k189, k228-k249")),
  orbMaturesAfterHit: selected(span(12), "footage-repeated", "team-4-and-5", "orb glows teal 12 ticks after the hit", vod("V1", "G49"), vod("V2", "k64"), cache("spotanim 4311 soul_fragment_spawn_12_ticks")),
  floorDamage: selected({ afterOnset: span(5), perTick: { min: 9, max: 11 } }, "assumption", "team-5", "no capture shows a player inside the inner void past one tick; reuses the outer rule", vod("V2", "k48 to k49")),
};

const AFTER_INNER: TransitionRecipe<"after-inner"> = {
  kind: "after-inner",
  duration: selected(span(9), "footage-repeated", "team-4-and-5", "inner void clears at S+22, outer forms at S+31", vod("V1", "G55-G63"), vod("V2", "k70-k78")),
  tellAfterStart: selected(span(2), "footage-repeated", "team-4-and-5", "transition attack 1 starts at S+24", vod("V1", "G57, G117, G177"), vod("V2", "k72, k132, k192, k252")),
  hitAfterStart: selected(span(7), "footage-repeated", "team-4-and-5", "transition attack 1 damage at S+29", vod("V1", "G62, G122, G182"), vod("V2", "k77, k137, k197, k257")),
  soulSplitAfterTell: selected(span(1), "footage-repeated", "team-4-and-5", "Soul Split at S+25; Deflect Melee still up at S+24", vod("V1", "frames 2741-2777, 4901-4937"), vod("V2", "k73")),
};

const OUTER_VOID: VoidRecipe<"outer-void"> = {
  kind: "outer-void",
  duration: selected(span(20), "footage-repeated", "team-4-and-5", "outer void visible 20 ticks", vod("V1", "G64-G83, G124-G143"), vod("V2", "k79-k98, k139-k158, k199-k218")),
  orbMaturesAfterHit: selected(span(6), "footage-repeated", "team-4-and-5", "outer orb first glows 5 to 6 ticks after the hit", vod("V1", "G74"), vod("V2", "k88, k149"), cache("spotanim 4309 soul_fragment_spawn_6_ticks")),
  floorDamage: selected({ afterOnset: span(5), perTick: { min: 9, max: 11 } }, "footage-once", "team-5", "standing on the flood from its onset, first damage at S+36; amounts 11, 9, 9, 9, 10, 11", vod("V2", "k199 to k204"), vod("V2", "k92-k97")),
};

const AFTER_OUTER: TransitionRecipe<"after-outer"> = {
  kind: "after-outer",
  duration: selected(span(9), "footage-repeated", "team-4-and-5", "outer void clears at S+51, next inner at S+60", vod("V1", "G84-G92"), vod("V2", "k99-k107")),
  tellAfterStart: selected(span(1), "footage-repeated", "team-4-and-5", "transition attack 2 starts at S+52; one of five onsets came a tick late (k161), damage tick unchanged", vod("V1", "G85, G145"), vod("V2", "k100, k220")),
  hitAfterStart: selected(span(6), "footage-repeated", "team-4-and-5", "transition attack 2 damage at S+57", vod("V1", "G90, G150"), vod("V2", "k105, k165, k225")),
  soulSplitAfterTell: selected(span(1), "footage-once", "team-4", "Soul Split at S+53", vod("V1", "frames 3749-3785")),
};

const CYCLE: CycleRecipe = [INNER_VOID, AFTER_INNER, OUTER_VOID, AFTER_OUTER];

const OVERHEADS: OverheadByStage = {
  "inner-void": selected("deflect-melee", "footage-once", "team-5", "icon at S+12 and S+23; raised at the rise per the wiki order, the switch tick was not in frame (Q9)", vod("V2", "k60, k71"), STRATEGIES),
  "outer-void": selected("deflect-range", "footage-once", "team-5", "icon with the flood from S+31", vod("V2", "k79, k80, k90"), STRATEGIES),
  transition: selected("soul-split", "footage-repeated", "team-4-and-5", "white star after each transition tell", vod("V1", "frames 2777, 3785, 4937"), vod("V2", "k73")),
};

const LIFEFORCE: LifeforceRecipe = {
  tellAfterOnset: selected(span(3), "footage-repeated", "team-4-and-5", "teal swirl and chat line", vod("V1", "G36, G127"), vod("V2", "k51")),
  hitAfterOnset: selected(span(4), "footage-repeated", "team-4-and-5", "hit 4 ticks after each void forms", vod("V1", "G37, G68, G97, G128, G157, G188"), vod("V2", "k52, k83, k112, k143, k172, k203")),
};

const ORB: OrbRecipe = {
  lastHealAfterHit: selected(span(18), "footage-once", "team-4", "latest observed heal; a lower bound on expiry", vod("V1", "G175")),
};

const BOSS_HEALS: BossHealRecipe = {
  soulSplitAfterHit: selected(span(2), "footage-repeated", "team-4-and-5", "boss heals by wrong-prayer damage only: +50 and +43 while protected players took 7 and 6", vod("V1", "G62 then G64"), vod("V2", "k137 then k139")),
};

const RIFTS: RiftRecipe = {
  spawnBeforeOnset: selected(span(1), "footage-repeated", "team-4-and-5", "rifts one tick before the next inner void", vod("V1", "G152"), vod("V2", "k107, k167, k227")),
  chargeAfterSpawn: selected(span(11), "inferred", "team-5", "unexplained 14 on the streamer 11 ticks after rifts appear", vod("V2", "k107 to k118, k167 to k178")),
};

const GEOMETRY: GeometryRecipe = {
  placeholderArena: selected({ width: 20, height: 20 }, "assumption", "unscaled", "cache 2746 has no XTEA keys for the raid, so the real quadrant is unavailable", cache("region keys absent")),
  bossAnchor: selected(tile(9, 6), "assumption", "unscaled", "footprint x 9-11, y 4-6 keeps the spawn tile and the walk check clear of the boss", owner("placeholder arena layout")),
  playerSpawn: selected(tile(10, 10), "assumption", "unscaled", "spawn used by the walk test and the verify click", owner("placeholder arena layout")),
};

const pose = (id: number, name: string, basis: Basis, note: string): Selected<number> =>
  selected(id, basis, "unscaled", note, cache(`seq ${id} ${name}`));

const PRESENTATION: PresentationRecipe = {
  bossPoses: {
    idle: pose(14840, "phase3_idle", "spec-confirmed", "boss stand animation"),
    walk: pose(14849, "phase3_walk", "spec-confirmed", "boss walk animation"),
    deflectIn: pose(14863, "phase3_deflect_in", "inferred", "rise into the inner void, 2 ticks; name and the wiki's rise"),
    deflectLoop: pose(14864, "phase3_deflect_loop", "inferred", "hover over the inner void, 2-tick loop"),
    deflectOut: pose(14865, "phase3_deflect_out", "inferred", "landing as the inner void clears, 4 ticks"),
    silentDeflectIn: pose(14866, "silent deflect in", "inferred", "outer-void Deflect candidate, 2 ticks"),
    silentDeflectLoop: pose(14867, "silent deflect loop", "inferred", "outer-void Deflect candidate, 2-tick loop"),
    silentDeflectOut: pose(14868, "silent deflect out", "inferred", "outer-void Deflect candidate, 4 ticks"),
    soulFragmentStart: pose(14855, "phase3_soul_fragment_start", "inferred", "lifeforce cast, 3 ticks; 3 + 1 ticks matches the tell-to-hit gap"),
    soulFragmentEnd: pose(14856, "phase3_soul_fragment_end", "inferred", "lifeforce cast end, 1 tick"),
    prayerIn: pose(14869, "phase3_prayer_in", "inferred", "overhead switch, 5.6 ticks"),
    prayerLoop: pose(14870, "phase3_prayer_loop", "inferred", "overhead switch loop, 3 ticks"),
    prayerOut: pose(14871, "phase3_prayer_out", "inferred", "overhead switch end, 1.5 ticks"),
    meleeHybrid: pose(14844, "phase3_melee_hybrid", "inferred", "transition attack candidate with magic and ranged spotanim variants, 7 ticks"),
    meleePrayer: pose(14845, "phase3_melee_prayer", "inferred", "transition attack candidate, 3 ticks"),
    unleashIn: pose(14857, "phase3_unleash_in", "inferred", "transition attack candidate, 2 ticks"),
    unleashLoop: pose(14858, "phase3_unleash_loop", "inferred", "transition attack candidate, 2-tick loop"),
    unleashOut: pose(14861, "phase3_unleash_out", "inferred", "transition attack candidate, 4 ticks"),
  },
};

const OSRS_WIKI = "https://oldschool.runescape.wiki/w/";
const MAX_RANGED_HIT = wiki(`${OSRS_WIKI}Maximum_ranged_hit`, 15199053);
const RANGED_ACCURACY = wiki(`${OSRS_WIKI}Damage_per_second/Ranged`, 14906132);
const VOID_SET = wiki(`${OSRS_WIKI}Void_Knight_equipment`, 15363192);
const INQUISITOR_SET = wiki(`${OSRS_WIKI}Inquisitor%27s_armour`, null);
const TWISTED_BOW_PAGE = wiki(`${OSRS_WIKI}Twisted_bow`, 15363157);
const RALOS_PAGE = wiki(`${OSRS_WIKI}Tonalztics_of_ralos`, 15368852);
const SCYTHE_PAGE = wiki(`${OSRS_WIKI}Scythe_of_Vitur`, 15372833);

type Five = readonly [stab: number, slash: number, crush: number, magic: number, range: number];
const stats = (attack: Five, defence: Five, other: readonly [meleeStrength: number, rangedStrength: number, magicDamage: number, prayer: number]): ItemStats => ({
  attack: { stab: attack[0], slash: attack[1], crush: attack[2], magic: attack[3], range: attack[4] },
  defence: { stab: defence[0], slash: defence[1], crush: defence[2], magic: defence[3], range: defence[4] },
  other: { meleeStrength: other[0], rangedStrength: other[1], magicDamage: other[2], prayer: other[3] },
});
const item = (itemId: number, page: string, oldid: number, itemStats: ItemStats): TrainerItem => ({
  itemId: selected(itemId, "spec-single", "unscaled", "infobox item id", wiki(`${OSRS_WIKI}${page}`, oldid)),
  stats: selected(itemStats, "spec-single", "unscaled", "infobox combat bonuses", wiki(`${OSRS_WIKI}${page}`, oldid)),
});

const GEAR: GearRecipe = {
  items: {
    voidRangerHelm: item(11664, "Void_ranger_helm", 15260468, stats([0, 0, 0, 0, 0], [6, 6, 6, 6, 6], [0, 0, 0, 0])),
    eliteVoidTop: item(13072, "Elite_void_top", 15260476, stats([0, 0, 0, 0, 0], [45, 45, 45, 45, 45], [0, 0, 0, 3])),
    eliteVoidRobe: item(13073, "Elite_void_robe", 15260481, stats([0, 0, 0, 0, 0], [30, 30, 30, 30, 30], [0, 0, 0, 3])),
    voidKnightGloves: item(8842, "Void_knight_gloves", 15304461, stats([0, 0, 0, 0, 0], [6, 6, 6, 4, 6], [0, 0, 0, 0])),
    inquisitorsGreatHelm: item(24419, "Inquisitor%27s_great_helm", 15352822, stats([0, 0, 10, -5, -5], [19, 10, 21, 0, 12], [6, 0, 0, 1])),
    inquisitorsHauberk: item(24420, "Inquisitor%27s_hauberk", 15352823, stats([0, 0, 16, -11, -10], [67, 55, 71, 0, 35], [4, 0, 0, 2])),
    inquisitorsPlateskirt: item(24421, "Inquisitor%27s_plateskirt", 15352824, stats([0, 0, 12, -9, -5], [42, 30, 49, 0, 22], [2, 0, 0, 2])),
    tonalzticsOfRalos: item(28922, "Tonalztics_of_ralos", 15368852, stats([0, 0, 0, 0, 115], [0, 0, 0, 0, 0], [0, 55, 0, 2])),
  },
  twistedBow: selected({ rapidSpeed: 5, otherSpeed: 6 }, "spec-single", "unscaled", "attack speed by stance: 5 ticks on Rapid, 6 on Accurate and Longrange", TWISTED_BOW_PAGE),
  ralos: selected({ rapidSpeed: span(6), otherSpeed: span(7), range: 7, longrangeRange: 9, hits: 2, hitMaxFraction: 0.75 }, "spec-single", "unscaled", "charged, one-handed thrown: two independent hits, each 0 to 75% of the max ranged hit", RALOS_PAGE),
  division: selected({ energy: 50, accuracyFactor: 1.5, defenceDrainOfMagic: 0.125 }, "spec-single", "unscaled", "+50% accuracy; each hit that deals damage lowers Defence by 12.5% of Magic (10% before 2026-07-22) and, on NPCs, before the second roll; the drain applies as each glaive lands, so a hit the target rejects drains nothing (inferred); rounding not stated, floored (inferred)", RALOS_PAGE),
  eliteVoid: selected({ accuracy: 1.1, damage: 1.125 }, "spec-single", "unscaled", "void ranger helm, gloves, elite top and robe; each factor is floored on the effective ranged level it scales, accuracy and strength", VOID_SET, MAX_RANGED_HIT, RANGED_ACCURACY),
  inquisitorCrushPerMille: selected({ inquisitorsGreatHelm: 5, inquisitorsHauberk: 10, inquisitorsPlateskirt: 10 }, "spec-single", "unscaled", "crush accuracy and damage per piece; the 2026-07-22 update moved the 1% set bonus onto the hauberk and plateskirt", wiki(`${OSRS_WIKI}Inquisitor%27s_hauberk`, 15352823), wiki(`${OSRS_WIKI}Inquisitor%27s_plateskirt`, 15352824), INQUISITOR_SET),
  rangedStrengthPrayers: selected({ "Sharp Eye": 1.05, "Hawk Eye": 1.1, "Eagle Eye": 1.15, Deadeye: 1.18, Rigour: 1.23 }, "spec-single", "unscaled", "prayer bonus to effective ranged strength", MAX_RANGED_HIT),
  scytheStance: selected("jab", "spec-single", "unscaled", "Jab is the scythe's crush style; the owner wants the Scythe setup on crush", SCYTHE_PAGE, owner("melee setup")),
  specialWeapon: selected("tonalzticsOfRalos", "assumption", "unscaled", "owner: players tend to use Ralos to spec the boss", owner("special attack weapon")),
};

const PRACTICE = owner("practice one mechanic at a time; a drill option, not game data");
const drill = (first: Mechanic, ...rest: Mechanic[]): Selected<Focus> =>
  selected<Focus>({ kind: "drill", mechanics: [first, ...rest] }, "assumption", "unscaled", "the cycle runs in full; only these mechanics act", PRACTICE);

export const OCELLUS_P4 = {
  vods: VODS,
  boss: BOSS,
  leadIn: LEAD_IN,
  cycle: CYCLE,
  overheads: OVERHEADS,
  lifeforce: LIFEFORCE,
  orb: ORB,
  bossHeals: BOSS_HEALS,
  rifts: RIFTS,
  geometry: GEOMETRY,
  presentation: PRESENTATION,
  gear: GEAR,
  choices: {
    setup: choice("ranged", {
      ranged: selected<Setup>(
        { weapon: "twistedBow", helmet: "voidRangerHelm", chest: "eliteVoidTop", legs: "eliteVoidRobe", gloves: "voidKnightGloves", cape: "dizanasQuiver", necklace: "necklaceOfAnguish", feet: "pegasianBoots", ring: "venatorRing", ammo: "dragonArrows" },
        "assumption", "unscaled", "owner-named full elite void with void gloves, ranger helm and Twisted Bow; arrows, cape, neck, feet and ring are SDK items (assumption); the default because the first void's Deflect Melee leaves ranged open",
        owner("ranged setup"),
      ),
      melee: selected<Setup>(
        { weapon: "scytheOfVitur", helmet: "inquisitorsGreatHelm", chest: "inquisitorsHauberk", legs: "inquisitorsPlateskirt", gloves: "ferociousGloves", cape: "infernalCape", necklace: "amuletOfTorture", feet: "primordialBoots", ring: "ultorRing", ammo: "dragonArrows" },
        "assumption", "unscaled", "owner-named Inquisitor's armour with the Scythe of Vitur on crush; gloves, cape, neck, feet and ring are SDK items (assumption)",
        owner("melee setup"),
      ),
    }),
    bossMaxHp: choice("footage-fit", {
      "footage-fit": selected(5420, "inferred", "team-4-and-5", "9820 at 4 and 12020 at 5 is 2200 per player plus 1020, at the 2-player scale solo uses", vod("V1", "HUD 9820"), vod("V2", "HUD 12020"), SOLO_SCALE),
      cache: selected(5250, "spec-confirmed", "unscaled", "cache hitpoints; matched neither team bar", cache("npc 16677 stats")),
    }),
    entryHpFraction: choice("quarter", {
      quarter: selected(0.25, "inferred", "team-4-and-5", "halfway between the two observations", vod("V1", "2445 / 9820"), vod("V2", "3118 / 12020")),
      "v1-observed": selected(0.249, "footage-once", "team-4", "V1 entry bar", vod("V1", "3:53:54")),
      "v2-observed": selected(0.259, "footage-once", "team-5", "V2 entry bar", vod("V2", "5:20:18")),
    }),
    explosions: choice("wiki-six", {
      "wiki-six": selected<ExplosionRecipe>({ firstMarkAfterHit: span(3), count: 6, period: span(2), impactAfterMark: span(1), damage: { min: 16, max: 16 } }, "spec-single", "unscaled", "six marks every 2 ticks, damage a tick later; first mark from k55; 16 from one teammate splat (inferred)", STRATEGIES, vod("V2", "k55-k65, k62")),
      "v2-seven": selected<ExplosionRecipe>({ firstMarkAfterHit: span(3), count: 7, period: span(2), impactAfterMark: span(1), damage: { min: 16, max: 16 } }, "footage-once", "team-5", "bursts on every odd tick k55 to k67 (C4)", vod("V2", "k55-k67")),
      "v2-tell-then-six": selected<ExplosionRecipe>({ firstMarkAfterHit: span(5), count: 6, period: span(2), impactAfterMark: span(1), damage: { min: 16, max: 16 } }, "inferred", "team-5", "k55 read as a tell, marks k57 to k67 (C4)", vod("V2", "k55-k67")),
    }),
    specialSelection: choice("random-uniform", {
      "random-uniform": selected<SpecialSelection>({ kind: "random-uniform" }, "inferred", "unscaled", "V1 repeats melee, so no fixed rotation explains both clips (C3)", vod("V1", "G62, G90"), vod("V2", "k77-k257")),
      "rotation-magic-ranged-melee": selected<SpecialSelection>({ kind: "rotation", order: ["vortex", "spike-disk", "black-disk"] }, "footage-once", "team-5", "V2 strict rotation over 7 attacks", vod("V2", "k77, k105, k137, k165, k197, k225, k257")),
      "replay-v1": selected<SpecialSelection>({ kind: "replay", order: ["black-disk", "black-disk", "spike-disk", "black-disk", "spike-disk"] }, "footage-once", "team-4", "melee, melee, ranged; the last two only look like melee and ranged (Q1)", vod("V1", "G62, G90, G122, G150, G182")),
      "replay-v2": selected<SpecialSelection>({ kind: "replay", order: ["vortex", "spike-disk", "black-disk", "vortex", "spike-disk", "black-disk", "vortex"] }, "footage-once", "team-5", "as V2 ran it", vod("V2", "k77, k105, k137, k165, k197, k225, k257")),
    }),
    orbSpawnAfterHit: choice("next-tick", {
      "next-tick": selected(span(1), "footage-once", "team-5", "dark orb on the tick after the hit, per-tick frames", vod("V2", "k53")),
      "two-ticks": selected(span(2), "footage-once", "team-4", "orb first seen 2 ticks after the hit", vod("V1", "G39")),
    }),
    unclaimedOuterOrb: choice("heals-boss", {
      "heals-boss": selected<UnclaimedOrbRule>({ kind: "heals-boss", afterHit: span(19) }, "inferred", "team-4-and-5", "three heals 19 ticks after an outer hit; +51 equals a teammate's 51 (C17)", vod("V1", "G147"), vod("V2", "k102, k222")),
      off: selected<UnclaimedOrbRule>({ kind: "off" }, "assumption", "unscaled", "the mechanism is inferred only", vod("V1", "G147")),
    }),
    riftFirstCycle: choice("cycle-2", {
      "cycle-2": selected<Cycle>(cycle(2), "footage-repeated", "team-5", "rifts before every inner void after the first (C5)", vod("V2", "k107, k167, k227"), STRATEGIES),
      "cycle-3": selected<Cycle>(cycle(3), "footage-once", "team-4", "none in view before cycle 2, two before cycle 3", vod("V1", "G90-G95, G152")),
    }),
    focus: choice("full-fight", {
      "full-fight": selected<Focus>({ kind: "full-fight" }, "assumption", "unscaled", "every mechanic acts", PRACTICE),
      "void-floor": drill("void-floor"),
      "lifeforce-orb": drill("lifeforce-orb"),
      explosions: drill("explosions"),
      "transition-attacks": drill("transition-attacks"),
      rifts: drill("rifts"),
    }),
  },
} as const;

type Choices = typeof OCELLUS_P4.choices;
type ChoiceName = keyof Choices;
type OptionsOf<K extends ChoiceName> = Choices[K]["options"];
type OptionKey<K extends ChoiceName> = keyof OptionsOf<K> & string;
export type DrillSelection = { readonly [K in ChoiceName]?: OptionKey<K> };
const CHOICES: { readonly [K in ChoiceName]: Readonly<{ default: OptionKey<K>; options: OptionsOf<K> }> } = OCELLUS_P4.choices;

class ResolvedChoice<K extends ChoiceName> {
  readonly #name: K;
  readonly option: OptionsOf<K>[OptionKey<K>];

  constructor(name: K, readonly key: OptionKey<K>) {
    this.#name = name;
    this.option = CHOICES[name].options[key];
  }
}
export type ResolvedChoices = { readonly [K in ChoiceName]: ResolvedChoice<K> };

type DrillRequest = Readonly<{ seed: Seed; selection?: DrillSelection }>;
export type DrillConfig = Readonly<{ seed: Seed; choices: ResolvedChoices }>;
type ParsedDrill = Readonly<{ config: DrillConfig; rejected: readonly string[] }>;

function hasKey<O extends object>(record: O, key: string): key is keyof O & string {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function resolveChoices(lookup: (name: ChoiceName) => string | undefined, rejected: string[]): ResolvedChoices {
  const pick = <K extends ChoiceName>(name: K): ResolvedChoice<K> => {
    const raw = lookup(name);
    const { default: fallback, options } = CHOICES[name];
    if (raw !== undefined && hasKey(options, raw)) return new ResolvedChoice(name, raw);
    if (raw !== undefined) rejected.push(`${name}=${raw}`);
    return new ResolvedChoice(name, fallback);
  };
  return {
    setup: pick("setup"),
    bossMaxHp: pick("bossMaxHp"),
    entryHpFraction: pick("entryHpFraction"),
    explosions: pick("explosions"),
    specialSelection: pick("specialSelection"),
    orbSpawnAfterHit: pick("orbSpawnAfterHit"),
    unclaimedOuterOrb: pick("unclaimedOuterOrb"),
    riftFirstCycle: pick("riftFirstCycle"),
    focus: pick("focus"),
  };
}

function isChoiceName(name: string): name is ChoiceName {
  return hasKey(OCELLUS_P4.choices, name);
}

export function resolveDrill(request: DrillRequest): DrillConfig {
  const selection: Readonly<Record<string, string | undefined>> = request.selection ?? {};
  return { seed: request.seed, choices: resolveChoices((name) => selection[name], []) };
}

export function parseDrillRequest(url: URL, freshSeed: () => number): ParsedDrill {
  const rejected: string[] = [];
  for (const [key, value] of url.searchParams) {
    if (key !== "seed" && !isChoiceName(key)) rejected.push(`${key}=${value}`);
  }
  const choices = resolveChoices((name) => url.searchParams.get(name) ?? undefined, rejected);
  const raw = url.searchParams.get("seed");
  const parsed = raw !== null && /^\d{1,10}$/.test(raw) && Number(raw) <= 0xffffffff ? Number(raw) : null;
  if (raw !== null && parsed === null) rejected.push(`seed=${raw}`);
  return { config: { seed: seed(parsed ?? freshSeed()), choices }, rejected };
}
