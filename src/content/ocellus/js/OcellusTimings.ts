import type { TwistedBow } from "osrs-sdk";
import type { Cycle, Mechanic, Seed, SoundId, Special, Style, TickSpan, Tile, TransitionKind, VoidKind } from "./P4Types";
import { cycle, seed, soundId, span, tile } from "./P4Types";

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

export type DamageRange = Readonly<{ min: number; max: number }>;

export type VoidRecipe<K extends VoidKind> = Readonly<{
  kind: K;
  duration: Selected<TickSpan>;
  orbMaturesAfterHit: Selected<TickSpan>;
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

export type UnclaimedOrbRule = Readonly<{ kind: "heals-boss"; afterHit: TickSpan }> | Readonly<{ kind: "off" }>;
type SpecialRecipe = Readonly<{
  styles: Readonly<{ "black-disk": Selected<"melee">; "spike-disk": Selected<"ranged">; vortex: Selected<"magic"> }>;
  protectedDamage: Selected<DamageRange>;
  unprotectedDamage: Selected<DamageRange>;
  cues: Readonly<Record<Style, readonly Selected<TransitionCue>[]>>;
}>;
export type SpecialStyle<V extends Special> = SpecialRecipe["styles"][V]["value"];
type BossHealRecipe = Readonly<{ soulSplitAfterHit: Selected<TickSpan> }>;
type RiftRecipe = Readonly<{ spawnBeforeOnset: Selected<TickSpan>; chargeAfterSpawn: Selected<TickSpan> }>;

type GeometryRecipe = Readonly<{
  platform: Selected<readonly string[]>;
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

export type TransitionSound = "meleeTell" | "meleeHit" | "rangedBeforeHit" | "rangedHit" | "magicWindUp";
export type TransitionCue = Readonly<{ sound: TransitionSound; afterTell: TickSpan; delayMs: number }>;
type CueSound = "explosionSeriesStart" | "explosionMark" | TransitionSound;
type SoundPlayback = Readonly<{ volume: number; range: number; retain: number }>;

type PresentationRecipe = Readonly<{
  bossPoses: Readonly<Record<BossPose, Selected<number>>>;
  sounds: Readonly<Record<CueSound, Selected<SoundId>>>;
  soundPlayback: Selected<SoundPlayback>;
  landingBeforeInnerClears: Selected<TickSpan>;
  transitionTells: Readonly<Record<Special, Selected<number>>>;
  tellCentre: Selected<Readonly<{ faceColour: number; rgb: number }>>;
}>;

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
  necklace: "necklaceOfRupture" | "amuletOfRancour";
  feet: "avernicTreadsMax";
  ring: "venatorRing" | "ultorRing";
  ammo: "dragonArrows";
}>;
export type Setup = Readonly<{ [S in GearSlot]: GearKeys[S] }>;
export type SupplyKey = "superCombatPotion" | "bastionPotion" | "saradominBrew" | "superRestore";
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
  sdkCacheIds: Readonly<{ necklaceOfRupture: Selected<number> }>;
  supplies: Selected<readonly SupplyKey[]>;
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

const cue = (sound: TransitionSound, afterTell: number, delayMs: number, note: string, first: Source, ...rest: Source[]): Selected<TransitionCue> =>
  selected({ sound, afterTell: span(afterTell), delayMs }, "footage-repeated", "team-4-and-5", note, first, ...rest);

const SPECIAL: SpecialRecipe = {
  styles: {
    "black-disk": selected("melee", "footage-repeated", "team-4-and-5", "Kirby on Protect from Melee takes 7 and a teammate 50; the streamer on Magic takes 43 while four others take 6", vod("V1", "G62, G90"), vod("V2", "k137")),
    "spike-disk": selected("ranged", "footage-repeated", "team-4-and-5", "players on Protect from Missiles take 7, 5 and 9", vod("V1", "G122"), vod("V2", "k105, k197")),
    vortex: selected("magic", "footage-repeated", "team-5", "players on Protect from Magic take 7 twice", vod("V2", "k77, k165")),
  },
  protectedDamage: selected({ min: 5, max: 9 }, "footage-repeated", "team-4-and-5", "7, 6, 7, 6, 9 on Kirby and 7, 5, 7, 9 on the streamer under the matching prayer; the solo carry-over is inferred", vod("V1", "G62, G90, G122, G150, G182"), vod("V2", "k77, k105, k165, k197")),
  unprotectedDamage: selected({ min: 43, max: 50 }, "footage-repeated", "team-4-and-5", "50 on a teammate whose prayer is not seen, 43 on the streamer under the wrong prayer; the solo carry-over is inferred", vod("V1", "G62"), vod("V2", "k137")),
  cues: {
    melee: [
      cue("meleeTell", 0, 60, "tell + 0.1 in all 5 melee attacks; 0.1 tick is 60 ms", vod("V1", "3:54:32.45, t60.1")),
      cue("meleeHit", 5, 60, "tell + 5.1, on the hit tick, in all 5 melee attacks", vod("V1", "3:54:18.66, t37.1")),
    ],
    ranged: [
      cue("rangedBeforeHit", 4, 240, "tell + 4.4, the median of 4.4, 4.4 and 4.6 in 3 of 4 ranged attacks, about 0.6 tick before the hit; the fourth was at tell + 0.9; 0.4 tick is 240 ms", vod("V1", "3:54:54.23, t96.4"), vod("V2", "5:20:58.27, t64.6")),
      cue("rangedHit", 5, 60, "tell + 5.1, on the hit tick, in 3 of 4 ranged attacks", vod("V1", "t97.1, t157.1"), vod("V2", "t65.3")),
    ],
    magic: [
      cue("magicWindUp", 2, 120, "tell + 2.2, the median of 0.7, 2.2 and 2.3 in 3 of 3 magic attacks; 0.2 tick is 120 ms. The magic hit's 12553 is spotanim 4329's own frame sound", vod("V2", "5:20:39.13, t32.7"), vod("V2", "t122.3, t214.2")),
    ],
  },
};

const BOSS_HEALS: BossHealRecipe = {
  soulSplitAfterHit: selected(span(2), "footage-repeated", "team-4-and-5", "boss heals by wrong-prayer damage only: +50 and +43 while protected players took 7 and 6", vod("V1", "G62 then G64"), vod("V2", "k137 then k139")),
};

const RIFTS: RiftRecipe = {
  spawnBeforeOnset: selected(span(1), "footage-repeated", "team-4-and-5", "rifts one tick before the next inner void", vod("V1", "G152"), vod("V2", "k107, k167, k227")),
  chargeAfterSpawn: selected(span(11), "inferred", "team-5", "unexplained 14 on the streamer 11 ticks after rifts appear", vod("V2", "k107 to k118, k167 to k178")),
};

const FLOOD_FRAMES = vod("V2", "k86, k95, k142, k156, k205, k212, k262, k269");
const V1_FLOOD_FRAMES = vod("V1", "G66, G126, G130");

const GEOMETRY: GeometryRecipe = {
  platform: selected(
    [
      "..?#........",
      ".?##########",
      ".###########",
      ".##########.",
      ".#########..",
      ".########?..",
      "?#######....",
      ".#######....",
      "?##?........",
      "?###........",
      "?####.......",
      ".###?.......",
    ],
    "footage-repeated",
    "team-5",
    "row y = 0 first, x = 0 leftmost; # is floor the outer void covers or the 5x5, . is not floor, ? is a ragged-edge tile fewer than two frames classified (±1 tile) and is left blocked; the flood draws this shape in all four V2 floods, and V1 draws it turned 270 degrees or mirrored east-west; cache 2746 has no XTEA keys for the raid",
    FLOOD_FRAMES,
    V1_FLOOD_FRAMES,
    cache("region keys absent"),
  ),
  bossAnchor: selected(tile(4, 6), "footage-repeated", "team-4-and-5", "south-west tile of the boss's 3x3 at x 4-6, y 4-6, centred in the 5x5 at x 3-7, y 3-7; the cyan 3x3 marker sits inside the purple 5x5 rim in every fitted frame", FLOOD_FRAMES, V1_FLOOD_FRAMES),
  playerSpawn: selected(tile(5, 1), "inferred", "team-4-and-5", "two tiles north of the 5x5, where players wait through the first inner void; no clip pins one tile", vod("V2", "k49 to k52"), vod("V1", "G33")),
};

type FloorDamage = Readonly<{ kind: "damages"; afterOnset: TickSpan; perTick: DamageRange }>;
export type FloorRule = FloorDamage | Readonly<{ kind: "harmless" }>;
export type FloorShape = "near-square" | "platform-minus-near-square";

type FloorRecipe = Readonly<{
  squareSide: Selected<number>;
  shapes: Readonly<{ "inner-void": Selected<"near-square">; "outer-void": Selected<"platform-minus-near-square"> }>;
  outerDamage: Selected<FloorDamage>;
  look: Selected<Readonly<{ void: string; stars: string; rim: string }>>;
}>;

const FLOOD_PER_TICK: DamageRange = { min: 9, max: 11 };

const FLOOR: FloorRecipe = {
  squareSide: selected(5, "footage-repeated", "team-4-and-5", "the boss's 3x3 plus a 1-tile ring", vod("V1", "frame 4325"), vod("V2", "k86"), STRATEGIES),
  shapes: {
    "inner-void": selected("near-square", "footage-repeated", "team-4-and-5", "the 5x5 under and around the boss", vod("V1", "G33, G93, G153"), vod("V2", "k48, k108, k168, k228"), STRATEGIES),
    "outer-void": selected("platform-minus-near-square", "footage-repeated", "team-4-and-5", "all floor but the 5x5; floor the client leaves undrawn is not safe (C16), and the platform leaves out V2's undrawn strip north of it", vod("V1", "G64"), vod("V2", "k86, k93-k97"), STRATEGIES),
  },
  outerDamage: selected({ kind: "damages", afterOnset: span(5), perTick: FLOOD_PER_TICK }, "footage-once", "team-5", "standing on the flood from its onset, first damage at S+36; amounts 11, 9, 9, 9, 10, 11", vod("V2", "k199 to k204"), vod("V2", "k92-k97")),
  look: selected({ void: "#1e2529", stars: "#babcc2", rim: "#9f48bd" }, "footage-repeated", "team-4", "starry near-black tiles inside a glowing purple rim; median colours of each in two frames", vod("V1", "G33, frame 1877"), vod("V1", "G64, frame 2993")),
};

const INNER_VOID_FLOOR = choice("one-tick-grace", {
  "one-tick-grace": selected<FloorRule>({ kind: "damages", afterOnset: span(2), perTick: FLOOD_PER_TICK }, "inferred", "team-5", "inside at S+0 and off by S+1 took no splat; the floor reads the tile a tick starts on, so S+2 is the earliest onset that capture allows; amounts copy the flood", vod("V2", "k48 to k49"), STRATEGIES),
  "outer-rule": selected<FloorRule>({ kind: "damages", afterOnset: span(5), perTick: FLOOD_PER_TICK }, "assumption", "team-5", "the flood's S+5 onset; no capture shows a player inside past one tick", vod("V2", "k48 to k49")),
  harmless: selected<FloorRule>({ kind: "harmless" }, "assumption", "unscaled", "no capture shows inner-void damage", vod("V2", "k48 to k49")),
});

export type OrbFloor = "safe-floor" | "any-floor";
type OrbVisual = "innerSpawn" | "outerSpawn" | "idle" | "despawn" | "tell" | "regain";

type LifeforceOrbRecipe = Readonly<{
  drainDivisor: Selected<number>;
  orbDistance: Selected<Readonly<{ min: number; max: number }>>;
  innerOrbFloor: Selected<"safe-floor">;
  returnAfterStep: Selected<TickSpan>;
  look: Readonly<Record<OrbVisual, Selected<number>>>;
  marker: Selected<Readonly<{ dormant: string; ready: string }>>;
}>;

const spotAnim = (id: number, name: string, basis: Basis, note: string): Selected<number> =>
  selected(id, basis, "unscaled", note, cache(`spotanim ${id} ${name}`));

const LIFEFORCE_ORB: LifeforceOrbRecipe = {
  drainDivisor: selected(2, "footage-repeated", "team-4-and-5", "every player loses floor(current HP / 2); no overhead prayer reduces it", vod("V1", "G37 through Protect from Magic, G68 through Melee"), vod("V2", "k52 through Magic, k112 through Missiles"), STRATEGIES),
  orbDistance: selected({ min: 2, max: 5 }, "footage-repeated", "team-4-and-5", "a dark orb 2 to 5 tiles from its player, never under the boss; with no allowed floor that close, the nearest allowed tiles, because the wiki puts the orb on a safe tile and no capture shows a player that far from one (inferred)", vod("V1", "G39"), vod("V2", "k53"), STRATEGIES),
  innerOrbFloor: selected("safe-floor", "footage-repeated", "team-4-and-5", "inner orbs appear off the void", vod("V1", "G39"), vod("V2", "k53")),
  returnAfterStep: selected(span(1), "footage-repeated", "team-4-and-5", "returns exactly the HP that hit took, the tick after the player steps on the orb, and can pass max HP (58 to 114)", vod("V2", "k67 then k68, k95 then k96"), vod("V1", "G51, G79")),
  look: {
    innerSpawn: spotAnim(4311, "vfx_ocellus_soul_fragment_spawn_12_ticks", "inferred", "inner orb from spawn to glow; 364 client cycles, about 12 ticks"),
    outerSpawn: spotAnim(4309, "vfx_ocellus_soul_fragment_spawn_6_ticks", "inferred", "outer orb from spawn to glow; 182 client cycles, about 6 ticks"),
    idle: spotAnim(4310, "soul_fragment_idle", "inferred", "the glowing orb, looped"),
    despawn: spotAnim(4312, "soul_fragment_despawn", "inferred", "the orb leaving its tile"),
    tell: spotAnim(4313, "soul_fragment_player_idle", "assumption", "played on the player at the lifeforce tell, where the footage shows a teal swirl; the spec pairs it with the pickup"),
    regain: spotAnim(4314, "soul_fragment_player_regain", "inferred", "the fragment returning to the player"),
  },
  marker: selected({ dormant: "#20251e", ready: "#7cecb2" }, "footage-repeated", "team-5", "the 2D orb: median of the darkest fifth of the new orb and the brightest fifth of the glowing one", vod("V2", "k53"), vod("V2", "k64")),
};

type ExplosionCueRecipe = Readonly<{ seriesStartsAfterHit: Selected<TickSpan>; shards: Selected<string> }>;

const EXPLOSION: ExplosionCueRecipe = {
  seriesStartsAfterHit: selected(span(2), "footage-repeated", "team-4-and-5", "sound 12638 two ticks after the lifeforce hit, before the first mark of every option; what the server marks with it is inferred", vod("V1", "3:54:04.77, t14"), vod("V2", "5:20:27.89, t14")),
  shards: selected(
    "#5e317b",
    "footage-repeated",
    "team-5",
    "dark purple shards stand around the player's tile on each mark tick; median colour of the shards on four mark ticks. The spec's cache candidate, spotanims 4299 to 4302 (model 62509), renders a white disc and a white flash, which the footage does not show",
    vod("V2", "k57, k59, k61, k65"),
    STRATEGIES,
  ),
};

const sound = (id: number, note: string, first: Source, ...rest: Source[]): Selected<SoundId> =>
  selected(soundId(id), "footage-repeated", "team-4-and-5", note, first, ...rest, cache(`synth ${id}`));

const pose = (id: number, name: string, basis: Basis, note: string): Selected<number> =>
  selected(id, basis, "unscaled", note, cache(`seq ${id} ${name}`));

const PRESENTATION: PresentationRecipe = {
  bossPoses: {
    idle: pose(14840, "phase3_idle", "spec-confirmed", "boss stand animation"),
    walk: pose(14849, "phase3_walk", "spec-confirmed", "boss walk animation"),
    deflectIn: pose(14863, "phase3_deflect_in", "inferred", "rise as the inner void forms, 2 ticks; name and the wiki's rise"),
    deflectLoop: pose(14864, "phase3_deflect_loop", "inferred", "hover high over the inner void, 2-tick loop, as V2 shows from k49 to k69"),
    deflectOut: pose(14865, "phase3_deflect_out", "inferred", "landing as the inner void clears, 4 ticks; the boss is on the ground again by S+23 (k71)"),
    silentDeflectIn: pose(14866, "silent deflect in", "inferred", "outer-void Deflect candidate, 2 ticks"),
    silentDeflectLoop: pose(14867, "silent deflect loop", "inferred", "outer-void Deflect candidate, 2-tick loop"),
    silentDeflectOut: pose(14868, "silent deflect out", "inferred", "outer-void Deflect candidate, 4 ticks"),
    soulFragmentStart: pose(14855, "phase3_soul_fragment_start", "inferred", "lifeforce cast, 3 ticks; 3 + 1 ticks matches the tell-to-hit gap"),
    soulFragmentEnd: pose(14856, "phase3_soul_fragment_end", "inferred", "lifeforce cast end, 1 tick"),
    prayerIn: pose(14869, "phase3_prayer_in", "inferred", "overhead switch, 5.6 ticks"),
    prayerLoop: pose(14870, "phase3_prayer_loop", "inferred", "overhead switch loop, 3 ticks"),
    prayerOut: pose(14871, "phase3_prayer_out", "inferred", "overhead switch end, 1.5 ticks"),
    meleeHybrid: pose(14844, "phase3_melee_hybrid", "inferred", "transition attack cast at each tell, 7 ticks; its melee, magic and ranged spotanims match the three tells"),
    meleePrayer: pose(14845, "phase3_melee_prayer", "inferred", "transition attack candidate, 3 ticks"),
    unleashIn: pose(14857, "phase3_unleash_in", "inferred", "transition attack candidate, 2 ticks"),
    unleashLoop: pose(14858, "phase3_unleash_loop", "inferred", "transition attack candidate, 2-tick loop"),
    unleashOut: pose(14861, "phase3_unleash_out", "inferred", "transition attack candidate, 4 ticks"),
  },
  sounds: {
    explosionSeriesStart: sound(12638, "starts each explosion series, in 5 V1 and 5 V2 voids; no sequence references it, so the server sends it", vod("V1", "3:54:04.77, t14"), vod("V2", "5:20:27.89, t14")),
    explosionMark: sound(12537, "one per explosion mark, six per void every 2 ticks from hit + 5, in 3 V1 and 3 V2 cycles", vod("V1", "3:54:06.58, t17"), vod("V2", "5:20:29.70, t17")),
    meleeTell: sound(12572, "the melee transition tell, in all 5 melee attacks and none of the other 7; no sequence references it, so the server sends it", vod("V1", "3:54:32.45, t60.1")),
    meleeHit: sound(12567, "the melee transition hit, in all 5 melee attacks and none of the other 7; the server sends it", vod("V1", "3:54:18.66, t37.1")),
    rangedBeforeHit: sound(12555, "before the ranged transition hit, in all 4 ranged attacks, scoring at most 0.21 in the other styles; the server sends it", vod("V1", "3:54:54.23, t96.4"), vod("V2", "5:20:58.27, t64.6")),
    rangedHit: sound(12556, "the ranged transition hit, in 3 of 4 ranged attacks; the server sends it", vod("V1", "t97.1, t157.1"), vod("V2", "t65.3")),
    magicWindUp: sound(12554, "the magic transition wind-up, in 3 of 3 magic attacks, scoring at most 0.09 in the other styles; the server sends it", vod("V2", "5:20:39.13, t32.7")),
  },
  soundPlayback: selected({ volume: 0.1, range: 31, retain: 31 }, "inferred", "unscaled", "played as area sounds on the player's tile, so they share the area-sound toggle with the boss; range and retain copy the boss's own frame sounds and volume the SDK's level for them, because the clips cannot show the server's values", cache("seq 14863 frame sound 12613 location 31, retain 31")),
  landingBeforeInnerClears: selected(span(1), "footage-repeated", "team-4-and-5", "the landing's frame sounds 12584, 12587, 12586 and 12585 at S+21.1, S+21.8, S+23.0 and S+23.5 put its start at S+21, a tick before the inner void clears; 12586 is heard in 3 V1 and 3 V2 cycles", vod("V1", "3:54:15.01, t31.0"), vod("V2", "5:20:38.13, t31.0"), cache("seq 14865 frames 3, 25, 61 and 74")),
  transitionTells: {
    vortex: selected(4329, "inferred", "unscaled", "a purple starburst over the footprint, then a purple-rimmed ring about 7 tiles across", cache("spotanim 4329 phase3_melee_hybrid_magic"), vod("V2", "k72 to k78")),
    "spike-disk": selected(4330, "inferred", "unscaled", "a dark disk with purple spikes radiating toward the players", cache("spotanim 4330 phase3_melee_hybrid_ranged"), vod("V2", "k100 to k106")),
    "black-disk": selected(4328, "inferred", "unscaled", "a purple semicircle, then a disk over the footprint", cache("spotanim 4328 phase3_melee_hybrid"), vod("V2", "k132 to k137")),
  },
  tellCentre: selected(
    { faceColour: 4, rgb: 0x020203 },
    "inferred",
    "unscaled",
    "the three tells share model 62698, whose centre is 144 faces of colour 4 textured with 215, a near-black starfield; the SDK draws spotanims without textures, so those faces show their lighting as near white, and recolouring colour 4 to the texture's mean texel draws them black as the footage does. The 296 untextured colour-4 faces were already near black",
    cache("model 62698 faces of colour 4 with texture 215"),
    cache("texture 215 sprite 8803, mean texel #020203"),
    vod("V2", "k72 to k78, k100 to k106, k132 to k137"),
  ),
};

const OSRS_WIKI = "https://oldschool.runescape.wiki/w/";
const MAX_RANGED_HIT = wiki(`${OSRS_WIKI}Maximum_ranged_hit`, 15199053);
const RANGED_ACCURACY = wiki(`${OSRS_WIKI}Damage_per_second/Ranged`, 14906132);
const VOID_SET = wiki(`${OSRS_WIKI}Void_Knight_equipment`, 15363192);
const INQUISITOR_SET = wiki(`${OSRS_WIKI}Inquisitor%27s_armour`, null);
const TWISTED_BOW_PAGE = wiki(`${OSRS_WIKI}Twisted_bow`, 15363157);
const RALOS_PAGE = wiki(`${OSRS_WIKI}Tonalztics_of_ralos`, 15368852);
const SCYTHE_PAGE = wiki(`${OSRS_WIKI}Scythe_of_Vitur`, 15372833);
const RUPTURE_PAGE = wiki(`${OSRS_WIKI}Necklace_of_rupture`, 15264776);
const ANGUISH_PAGE = wiki(`${OSRS_WIKI}Necklace_of_anguish`, 15301384);
const RANCOUR_PAGE = wiki(`${OSRS_WIKI}Amulet_of_rancour`, 15343231);
const TREADS_PAGE = wiki(`${OSRS_WIKI}Avernic_treads_(max)`, 15320239);
const RAID_INVENTORY = wiki(`${OSRS_WIKI}The_Fractured_Archive/Strategies`, 15378756);

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
  sdkCacheIds: {
    necklaceOfRupture: selected(33639, "spec-confirmed", "unscaled", "the SDK's class carries anguish's id 19547 as a stand-in; cache 2746 holds item 33639 with male model 61426", cache("item 33639 maleModel0 61426"), RUPTURE_PAGE),
  },
  supplies: selected<readonly SupplyKey[]>(
    [
      "superCombatPotion", "bastionPotion", "saradominBrew", "superRestore",
      "superCombatPotion", "bastionPotion", "saradominBrew", "superRestore",
      "saradominBrew", "saradominBrew", "saradominBrew", "superRestore",
      "saradominBrew", "saradominBrew", "saradominBrew", "superRestore",
      "saradominBrew", "saradominBrew", "superRestore",
    ],
    "spec-single", "unscaled", "slots 9 to 27 of the wiki's recommended raid inventory, in its order: 2 super combat potions, 2 ranging potions, 10 Saradomin brews and 5 super restores, with no fish; the SDK has no ranging potion, so the Bastion potion stands in, with the same Ranged boost plus a Defence boost (inferred)",
    RAID_INVENTORY, wiki(`${OSRS_WIKI}Ranging_potion`, 15293943), wiki(`${OSRS_WIKI}Bastion_potion`, 15293966),
  ),
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
  special: SPECIAL,
  bossHeals: BOSS_HEALS,
  rifts: RIFTS,
  geometry: GEOMETRY,
  floor: FLOOR,
  lifeforceOrb: LIFEFORCE_ORB,
  explosion: EXPLOSION,
  presentation: PRESENTATION,
  gear: GEAR,
  choices: {
    setup: choice("ranged", {
      ranged: selected<Setup>(
        { weapon: "twistedBow", helmet: "voidRangerHelm", chest: "eliteVoidTop", legs: "eliteVoidRobe", gloves: "voidKnightGloves", cape: "dizanasQuiver", necklace: "necklaceOfRupture", feet: "avernicTreadsMax", ring: "venatorRing", ammo: "dragonArrows" },
        "assumption", "unscaled", "owner-named full elite void with void gloves, ranger helm and Twisted Bow; the owner asked for the best-in-slot ranged necklace, which the wiki names as the Necklace of rupture, and Avernic treads (max) in both setups; arrows, cape and ring are SDK items (assumption); the default because the first void's Deflect Melee leaves ranged open",
        owner("ranged setup"), owner("ranged necklace"), owner("boots"), ANGUISH_PAGE, RUPTURE_PAGE, TREADS_PAGE,
      ),
      melee: selected<Setup>(
        { weapon: "scytheOfVitur", helmet: "inquisitorsGreatHelm", chest: "inquisitorsHauberk", legs: "inquisitorsPlateskirt", gloves: "ferociousGloves", cape: "infernalCape", necklace: "amuletOfRancour", feet: "avernicTreadsMax", ring: "ultorRing", ammo: "dragonArrows" },
        "assumption", "unscaled", "owner-named Inquisitor's armour with the Scythe of Vitur on crush, the Amulet of rancour (the owner's first choice over blood fury; both are in cache 2746) and Avernic treads (max) in both setups; gloves, cape and ring are SDK items (assumption)",
        owner("melee setup"), owner("melee amulet"), owner("boots"), RANCOUR_PAGE, TREADS_PAGE,
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
    explosions: choice("v2-tell-then-six", {
      "wiki-six": selected<ExplosionRecipe>({ firstMarkAfterHit: span(3), count: 6, period: span(2), impactAfterMark: span(1), damage: { min: 16, max: 16 } }, "spec-single", "unscaled", "six marks every 2 ticks, damage a tick later; first mark from k55; 16 from one teammate splat (inferred)", STRATEGIES, vod("V2", "k55-k65, k62")),
      "v2-seven": selected<ExplosionRecipe>({ firstMarkAfterHit: span(3), count: 7, period: span(2), impactAfterMark: span(1), damage: { min: 16, max: 16 } }, "footage-once", "team-5", "bursts on every odd tick k55 to k67 (C4)", vod("V2", "k55-k67")),
      "v2-tell-then-six": selected<ExplosionRecipe>({ firstMarkAfterHit: span(5), count: 6, period: span(2), impactAfterMark: span(1), damage: { min: 16, max: 16 } }, "inferred", "team-4-and-5", "k55 read as a tell, marks k57 to k67 (C4); the default because sound 12537 plays at hit + 5 to hit + 15 in every void of both clips and the marks are taken to sit on it", vod("V2", "k55-k67"), vod("V1", "3:54:06.58, t17"), vod("V2", "5:20:29.70, t17")),
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
    innerVoidFloor: INNER_VOID_FLOOR,
    orbPickupRadius: choice("on-tile", {
      "on-tile": selected(0, "footage-repeated", "team-5", "the streamer stands on the orb tile a tick before each heal (C9)", vod("V2", "k67, k95")),
      adjacent: selected(1, "footage-once", "team-4", "pickups read from an adjacent tile, with about 1 tile of perspective error (C9)", vod("V1", "G51, G135, G175")),
    }),
    outerOrbTile: choice("safe-floor", {
      "safe-floor": selected<OrbFloor>("safe-floor", "footage-repeated", "team-4", "outer orbs on the 5x5 edge, collected without leaving the square", vod("V1", "G74, G79, G128, G135")),
      "any-floor": selected<OrbFloor>("any-floor", "footage-repeated", "team-5", "outer orbs 4 to 6 tiles south-west, outside the 5x5; the streamer crossed the flood for them and took 59 and 49 (F1, F2)", vod("V2", "k88 to k97"), vod("V2", "k149 to k158")),
    }),
    focus: choice("full-fight", {
      "full-fight": selected<Focus>({ kind: "full-fight" }, "assumption", "unscaled", "every mechanic acts", PRACTICE),
      "void-floor": drill("void-floor"),
      "lifeforce-orb": drill("lifeforce-orb"),
      "orb-retrieval": drill("lifeforce-orb", "void-floor"),
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
    innerVoidFloor: pick("innerVoidFloor"),
    orbPickupRadius: pick("orbPickupRadius"),
    outerOrbTile: pick("outerOrbTile"),
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
