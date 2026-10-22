/**
 * Every id, timing and damage range the full fight uses, in one place.
 *
 * Sources (see docs/SOURCES.md):
 *  [R] RSProx tick analysis of six recorded fights, MRobertEvers/oldschool-clientc
 *      docs/rsprox-analysis/guthixian_archive/ocellus_plan.md (2026-10-21)
 *  [W] OSRS Wiki, Ocellus and The Fractured Archive/Strategies (2026-10-21)
 *  [G] RuneLite gameval AnimationID / SpotanimID / NpcID (cache 241)
 *  [V] ShadowStalkerTM, "Duo The Fractured Archive | OSRS Raid 4", youtube.com/watch?v=HAgq_qg0OIY (12:17 kill)
 * Ticks are 600 ms game ticks unless marked cc (20 ms client cycles).
 */

export type Range = Readonly<{ min: number; max: number }>;
const range = (min: number, max: number): Range => ({ min, max });

/** [G] NpcID */
export const NPC = {
  hoodedFigure: 16673,
  p1: 16674,
  p2: 16675,
  blade: 16676,
  p3: 16677,
  riftBasic: 16678,
  riftHeal: 16679,
  riftBuff: 16680,
  vine: 16681,
} as const;

/** [G] AnimationID (seq) */
export const SEQ = {
  p1Idle: 14804,
  p1Walk: 14805,
  p1VolleyStart: 14806,
  p1VolleyEnd: 14807,
  p1Charge: 14809,
  p1Expend: 14810,
  p1Explode: 14811,
  p1TeleportOut: 14812,
  p1TeleportIn: 14813,
  p1Transformation: 14814,
  p2Transformation: 14837,
  p2Idle: 14839,
  p2ToP3Part1: 14878,
  p2ToP3Part2: 14881,
  p3Idle: 14840,
  p3IdleHigh: 14841,
  p3MeleeBasic: 14842,
  p3MeleeHybrid: 14844,
  p3MeleePrayer: 14845,
  p3MeleeSlash: 14846,
  p3SuperiorSlash: 14848,
  p3Walk: 14849,
  p3ProjectileAll: 14851,
  p3SoulFragmentStart: 14855,
  p3SoulFragmentEnd: 14856,
  p3UnleashIn: 14857,
  p3UnleashLoop: 14858,
  p3QuadrantDestroyIn: 14859,
  p3QuadrantDestroyLoop: 14860,
  p3UnleashOut: 14861,
  p3UnleashOut90: 14862,
  p3DeflectIn: 14863,
  p3DeflectLoop: 14864,
  p3DeflectOut: 14865,
  p3PrayerIn: 14869,
  p3PrayerLoop: 14870,
  p3PrayerOut: 14871,
  p3Death: 14872,
} as const;

/**
 * [G] ObjectID tfa_ocellus_quadrant_wall_inactive (62684) and _active (62685), phase 2's portals. Read from cache 2746:
 * one model each, both looping seq 14830 (vfx_ocellus_p2_portal_idle), 2x1 tiles.
 */
export const PORTAL = {
  inactiveModel: 62758,
  activeModel: 62757,
  idle: 14830,
} as const;

/**
 * [G] ObjectID phase 3's floor hazards, read from cache 2746 (each a 1x1 loc with a type 10 and a type 22 model):
 * tfa_ocellus_void_degen_bomb "Void" (62701), _void_degen_aoe "Debris" (62702), _aoe_insolence_1 "Cracks" (62703).
 */
export const VOID_LOC = {
  bomb: { models: [62507, 62508], idle: 14891 },
  aoe: { models: [62687, 62688], idle: 14936 },
  insolence: { models: [62682, 62683], idle: 14930 },
} as const;
export type VoidLocKind = keyof typeof VOID_LOC;

/** [G] SpotanimID */
export const SPOT = {
  fireOnBoss: 4231,
  fireProjectile: 4232,
  fireImpact: 4233,
  waterOnBoss: 4228,
  waterProjectile: 4229,
  waterImpact: 4230,
  expendProjectile: 4234,
  strikeProjectile: 4235,
  crackStraightStart: [4236, 4237, 4238, 4239],
  crackStraight: [4240, 4242, 4244, 4246],
  crackStraightEnd: [4241, 4243, 4245, 4247],
  crackDiagonalStart: [4248, 4249, 4250, 4251],
  crackDiagonal: [4252, 4254, 4256, 4258],
  crackDiagonalEnd: [4253, 4255, 4257, 4259],
  p1Charge: 4260,
  p1ExplodeOnBoss: 4261,
  p1ExplodeFloor: [4262, 4263, 4264, 4265],
  p1TeleportOut: 4266,
  p1TeleportIn: 4267,
  p1ToP2: 4268,
  portalProjectile: 4269,
  p2Pool: 4270,
  safePortalSpawn: 4271,
  safePortalIdle: 4272,
  safePortalDespawn: 4273,
  death: 4274,
  deathSkirt: 4275,
  deathCrack: 4276,
  swordIdle: 4278,
  swordIdle2: 4279,
  swordDrop: 4280,
  swordRootFire: 4281,
  p2ToP3Arm: 4282,
  p2ToP3ArmGlow: 4283,
  entangleStart: 4290,
  entangleIdle: 4291,
  entangleEnd: 4292,
  magicImpact: 4293,
  magicOnBoss: 4294,
  magicProjectile: 4297,
  bombIdle: 4299,
  bombImpact: 4300,
  bombDrop: 4301,
  bombSpawn: 4302,
  healingFlare: 4303,
  swordRepair: 4304,
  swordDischarge: 4305,
  soulFragmentSpawn6: 4309,
  soulFragmentIdle: 4310,
  soulFragmentSpawn12: 4311,
  soulFragmentDespawn: 4312,
  soulFragmentPlayer: 4313,
  soulFragmentRegain: 4314,
  levitating: 4316,
  unleashArena: [4317, 4318, 4319, 4320],
  unleashOnBoss: 4321,
  deflectWind: 4322,
  slashDegen: 4323,
  meleePrayerIn: 4325,
  meleePrayer: 4326,
  meleePrayerOut: 4327,
  hybridMelee: 4328,
  hybridMagic: 4329,
  hybridRanged: 4330,
  collapseIn: 4331,
  collapseLoop: 4332,
  collapseOut1: 4333,
  collapseOut2: 4334,
  shadowSlash: 4335,
  superiorSlash: 4336,
  voidChainExplosion: 4339,
  voidChainTelegraph: 4340,
  glowZaros: 4341,
  glowBandos: 4342,
  glowSaradomin: 4343,
  glowArmadyl: 4344,
  fallingDebris: 4346,
  debrisIdle: 4347,
  swordDropExplosion: 4388,
  collapsingExplosion: [4390, 4391, 4392, 4393],
} as const;

/** Sounds the server sends on its own (the rest ride on the seqs and spotanims above). */
export const SOUND = {
  crackClosed: [12512, 12513],
  swordDischarge: 4428,
  swordDropBoom: 444,
  heal: 5281,
  explosionSeriesStart: 12638,
  explosionMark: 12537,
  meleeTell: 12572,
  meleeHit: 12567,
  rangedBeforeHit: 12555,
  rangedHit: 12556,
  magicWindUp: 12554,
} as const;

/**
 * The 21 October hotfix: Defence reduction stops at 60% of his level (phase 1: 129 of 215, phase 3: 150 of 250);
 * The Blade has no floor. [W] Out Today news and The Fractured Archive/Strategies, via ArchiveOcellusTrainer #17;
 * rounding up is inferred.
 */
export const LOWEST_DEFENCE_FRACTION = 0.6;

/** [R] RAID_PLAN.md: HP = base x multiplier, rounded to 10. Solo uses the duo scale. */
export const PARTY_SCALE: Readonly<Record<number, number>> = { 1: 1, 2: 1, 3: 1.45, 4: 1.87, 5: 2.29 };
export const scaledHp = (base: number, party: number): number => Math.round((base * (PARTY_SCALE[party] ?? 1)) / 10) * 10;

export const P1 = {
  hp: 2500,
  combatLevel: 1121,
  /** Phase 1 holds Protect from Melee while walking. [R] */
  defence: 215,
  defenceBonuses: { stab: 150, slash: 95, crush: 60, magic: 100, range: 135 },
  startWalkAfter: 4,
  volleyEvery: 5,
  /** Shots land 30 -> 95 cc within 4 tiles and 30 -> 125 cc beyond. [R] */
  volleyLand: { near: 3, far: 4, nearWithin: 4 },
  volleyDamage: range(1, 25),
  elementSwitchChance: 14 / 65,
  /** Corner script, from the charge C. [R] */
  linesEvery: 2,
  lineCount: 7,
  lineClosesAfter: 5,
  chargeVfxFrom: 5,
  shoutAt: 15,
  explodeAt: 18,
  blastAt: 19,
  walkOnAt: 21,
  shouts: ["Pointless...", "You... fail...", "Unworthy..."],
  blastRadius: 2,
  blastDamage: range(28, 30),
  /**
   * Standing on a crack as it closes blocks it and heals you: +16, +9, +13 on the blocker in [V] duo 13:31-13:35;
   * "it'll heal all of the chip damage" (Bubba OSRS guide 1:21). [R]'s 3-5 every 2 ticks on blockers matches a burn
   * left over from the room before ("You have been set alight!"), not the cracks.
   */
  blockHeal: range(9, 16),
  meterPerLine: 2,
  healPerLine: 2,
  meterMax: 96,
  /** Middle phase at 66% and a quarter. [R] */
  thresholds: [0.66, 0.25],
  teleportInAfter: 4,
  firstBeatAfter: 8,
  beatEvery: 8,
  beats: 4,
  beatLineLength: 6,
  beatLineCloses: [4, 6],
  beatExplodeAfter: 6,
  strikeShoutAfterLastExplode: 2,
  strikeHeal: range(4, 8),
  strikeHitAfterShout: 3,
  strikeDamage: range(17, 19),
  /** One more shot per 24 of meter (unverified past 10 of 96: never recorded). [R] */
  meterPerExtraShot: 24,
  walkOnAfterShout: 8,
  /** Next corner: anticlockwise 10, clockwise 3, across 6 of 19 recorded. [R] */
  routeWeights: { anticlockwise: 10, clockwise: 3, across: 6 },
  cornerLineLength: 9,
  transformAfterLanding: 3,
  p2After: 7,
} as const;

export const P2 = {
  hp: 5250,
  bladeDefence: 250,
  bladeDefenceBonuses: { stab: 150, slash: 120, crush: 10, magic: 100, range: 110 },
  portalsAt: 2,
  bladeAt: 7,
  rounds: [11, 53, 95],
  enough: 123,
  wallsFall: 127,
  p3At: 131,
  /** Within a round R: [R] */
  lightEvery: 5,
  lightTimes: 6,
  fireAfterLight: 4,
  poolsAt: 28,
  poolCount: 13,
  allLitAt: 31,
  safePortalAt: 33,
  safePortalUntil: 39,
  allFireAt: 40,
  lineDamage: range(19, 25),
  /**
   * A volley lands on the tile d out from its portal at speed x d - speed client cycles (30 to a tick): 6 for the
   * lit portals, 5 for the all-twelve volley. [R] Each tile is judged on the tick the volley is over it, so running
   * through the wave skips it, as with the Wardens' skulls in Tombs of Amascut. [O] J R V's "Ocellus P2 Portal Skip"
   * (youtube c4PSUxjNUiY): stand 6 out diagonally, click 4 out one tick before the volley.
   */
  lineCyclesPerTile: 6,
  crossfireCyclesPerTile: 5,
  poolDamage: range(3, 5),
} as const;

export const P3 = {
  combatLevel: 1601,
  defence: 250,
  defenceBonuses: { stab: 150, slash: 100, crush: 30, magic: 200, range: 250 },
  jumpToCornerAfter: 6,
  /**
   * Segment timelines from the segment start S. [R] `volleys` are the recorded casts of "Your panic... is futile...";
   * the wiki explains them as his answer to a tank out of his reach, which is how the script fires them now.
   */
  first: {
    triples: [4, 14, 33, 43],
    spins: [24],
    volleys: [] as readonly number[],
    vine: 36,
    insolence: null as number | null,
    rifts: [] as readonly number[],
    bombs: [6, 9],
    untether: 53,
  },
  later: {
    triples: [4, 14, 39, 49, 79, 89, 114, 124],
    spins: [24, 99],
    volleys: [36, 111],
    vine: 39,
    insolence: 59 as number | null,
    rifts: [3, 51, 111],
    bombs: [6],
    untether: 134,
  },
  basicHitProtected: range(1, 7),
  basicHitUnprotected: range(12, 19),
  slashAfter: 6,
  slashDamage: range(25, 28),
  /** The shadow slash and Insolence: 3 tiles wide, to the platform edge. [V] duo 20:24, Bubba OSRS guide 4:56 [W] */
  waveWidth: 3,
  spinLoopEvery: 3,
  spinDamage: range(15, 27),
  /** "Severing your prayer!" locks protection prayers this long: back on 3 ticks later in [V] duo 18:53-18:55. */
  severTicks: 3,
  volleyDamage: range(20, 26),
  patchDamage: range(6, 7),
  patchLasts: range(21, 51),
  bombDropAfter: 2,
  bombDamage: range(6, 11),
  vineHp: 44,
  vineBreakWithin: 14,
  vineDamage: range(50, 55),
  insolenceSlashes: 3,
  insolenceEvery: 5,
  insolenceDamage: range(39, 41),
  insolenceDebrisLasts: 16,
  riftHp: 44,
  riftLasts: 12,
  /** Killing a Void Augmenter: Attack and Strength to 116, Magic and Ranged to 112, from 99s. [W] Void Augmenter */
  augmenterBoost: { melee: 17, rangedMagic: 13 },
  healRiftEvery: 4,
  healRiftHeal: [12, 14],
  /** Untether, from U. [R] [W] */
  untether: {
    pools: [6, 10, 14, 18],
    unleashVfx: 18,
    erupt: 25,
    eruptDamage: range(40, 45),
    slam: 29,
    slamDamage: range(34, 39),
    slamAfterDamage: range(18, 19),
    /** The purple-bordered zone under him: his 3x3 plus two tiles. [W] */
    zoneRing: 2,
    obliteration: 31,
    escapeLine: 42,
    gone: 44,
    nextSegment: 48,
  },
  hpFloors: [0.75, 0.5, 0.25],
  /** A threshold reached between attacks still collapses the quadrant within this many ticks. [V] duo 18:20-18:26 */
  collapseWithin: 10,
  jumpTicks: 2,
} as const;

export const P4 = {
  /** "End..." lead-in, then a 60-tick cycle from D. [R] [T] */
  hiddenFor: 4,
  shoutAt: 5,
  firstCycleAt: 8,
  cycle: 60,
  innerVoid: { from: 0, until: 22 },
  outerVoid: { from: 31, until: 51 },
  winds: [4, 35],
  orbReadyAfterWind: [12, 6],
  orbExpiresAfterReady: 13,
  orbFirstTickBonus: 8,
  explosionMarks: [
    [9, 11, 13, 15, 17, 19],
    [40, 42, 44, 46, 48, 50],
  ],
  explosionDamage: range(14, 16),
  hybrids: [24, 52],
  hybridHitAfter: 5,
  hybridProtected: range(5, 10),
  hybridUnprotected: range(43, 50),
  floorDamage: range(9, 11),
  floorGraceInner: 2,
  floorGraceOuter: 5,
  riftsAt: 59,
  riftCharge: 11,
  riftDamage: range(13, 15),
  /** Overheads: Deflect Melee in the inner void, Soul Split around hybrids, Deflect Range in the outer void. */
  overheads: [
    { from: 0, to: 25, overhead: "deflect-melee" },
    { from: 25, to: 30, overhead: "soul-split" },
    { from: 31, to: 53, overhead: "deflect-range" },
    { from: 53, to: 59, overhead: "soul-split" },
  ],
} as const;

export type BossOverhead = "protect-melee" | "deflect-melee" | "deflect-range" | "soul-split";
