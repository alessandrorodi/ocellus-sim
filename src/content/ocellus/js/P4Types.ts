import type { GearSlot, ResolvedChoices } from "./OcellusTimings";

declare const brand: unique symbol;
type Brand<B extends string> = number & { readonly [brand]: B };
type Unbranded = number & { readonly [brand]?: never };

/** P4 tick t. 0 is the first tick with the boss model gone. */
export type Tick = Brand<"Tick">;
export type TickSpan = Brand<"TickSpan">;
export type WorldTick = Brand<"WorldTick">;
export type Cycle = Brand<"Cycle">;
export type Ordinal = Brand<"Ordinal">;
export type Seed = Brand<"Seed">;
export type TileX = Brand<"TileX">;
export type TileY = Brand<"TileY">;
export type Tile = Readonly<{ x: TileX; y: TileY }>;

const isCount = (n: number): boolean => Number.isInteger(n) && n >= 0;
const isTick = (n: Unbranded): n is Unbranded & Tick => isCount(n);
const isTickSpan = (n: Unbranded): n is Unbranded & TickSpan => isCount(n);
const isWorldTick = (n: Unbranded): n is Unbranded & WorldTick => isCount(n);
const isCycle = (n: Unbranded): n is Unbranded & Cycle => isCount(n) && n >= 1;
const isOrdinal = (n: Unbranded): n is Unbranded & Ordinal => isCount(n);
const isSeed = (n: Unbranded): n is Unbranded & Seed => isCount(n) && n <= 0xffffffff;
const isTileX = (n: Unbranded): n is Unbranded & TileX => Number.isInteger(n);
const isTileY = (n: Unbranded): n is Unbranded & TileY => Number.isInteger(n);

export function tick(n: Unbranded): Tick {
  if (!isTick(n)) throw new RangeError(`not a P4 tick: ${n}`);
  return n;
}
export function span(n: Unbranded): TickSpan {
  if (!isTickSpan(n)) throw new RangeError(`not a tick span: ${n}`);
  return n;
}
export function worldTick(n: Unbranded): WorldTick {
  if (!isWorldTick(n)) throw new RangeError(`not a world tick: ${n}`);
  return n;
}
export function cycle(n: Unbranded): Cycle {
  if (!isCycle(n)) throw new RangeError(`not a cycle: ${n}`);
  return n;
}
export function ordinal(n: Unbranded): Ordinal {
  if (!isOrdinal(n)) throw new RangeError(`not a transition attack ordinal: ${n}`);
  return n;
}
export function seed(n: Unbranded): Seed {
  if (!isSeed(n)) throw new RangeError(`not a 32-bit seed: ${n}`);
  return n;
}
export function tile(x: Unbranded, y: Unbranded): Tile {
  if (!isTileX(x) || !isTileY(y)) throw new RangeError(`not a tile: ${x}, ${y}`);
  return { x, y };
}
export function after(start: Tick, offset: TickSpan): Tick {
  return tick(start + offset);
}

export type Phase =
  | Readonly<{ stage: "lead-in"; boss: "hidden" | "present-invulnerable"; overhead: null }>
  | Readonly<{ stage: "inner-void"; cycle: Cycle; boss: "present-damageable"; overhead: "deflect-melee" }>
  | Readonly<{ stage: "after-inner"; cycle: Cycle; boss: "present-damageable"; overhead: "deflect-melee" | "soul-split" }>
  | Readonly<{ stage: "outer-void"; cycle: Cycle; boss: "present-damageable"; overhead: "deflect-range" }>
  | Readonly<{ stage: "after-outer"; cycle: Cycle; boss: "present-damageable"; overhead: "deflect-range" | "soul-split" }>;
export type Stage = Phase["stage"];
export type VoidKind = "inner-void" | "outer-void";
export type TransitionKind = "after-inner" | "after-outer";
export type BossState = Phase["boss"];
export type BossOverhead = NonNullable<Phase["overhead"]>;

export type Style = "melee" | "ranged" | "magic";
export type Special = "vortex" | "spike-disk" | "black-disk";
export type Mechanic = "void-floor" | "lifeforce-orb" | "explosions" | "transition-attacks" | "rifts";

export type Beat =
  | Readonly<{ kind: "boss-shouts"; text: string; lasts: TickSpan }>
  | Readonly<{ kind: "lifeforce-tell"; void: VoidKind }>
  | Readonly<{ kind: "lifeforce-hit"; void: VoidKind }>
  | Readonly<{ kind: "orb-spawns"; void: VoidKind }>
  | Readonly<{ kind: "orb-matures"; void: VoidKind }>
  | Readonly<{ kind: "orb-expires"; void: VoidKind }>
  | Readonly<{ kind: "unclaimed-orb-heals" }>
  | Readonly<{ kind: "explosion-mark"; void: VoidKind; pulse: number }>
  | Readonly<{ kind: "explosion-impact"; void: VoidKind; pulse: number }>
  | Readonly<{ kind: "floor-damage"; void: VoidKind }>
  | Readonly<{ kind: "special-tell"; ordinal: Ordinal; variant: Special }>
  | Readonly<{ kind: "special-hit"; ordinal: Ordinal; variant: Special }>
  | Readonly<{ kind: "soul-split-heal"; ordinal: Ordinal }>
  | Readonly<{ kind: "rifts-spawn"; forCycle: Cycle }>
  | Readonly<{ kind: "rift-charge-ends"; forCycle: Cycle }>;

export type IncomingStyle = Style | "typeless";
export type RunEnd = "kill" | "death";

export type FightEvent =
  | Readonly<{ kind: "stage-entered"; at: Tick; stage: Stage }>
  | Readonly<{ kind: "overhead-switched"; at: Tick; overhead: BossOverhead }>
  | Readonly<{ kind: "boss-state-changed"; at: Tick; state: BossState }>
  | Readonly<{ kind: "boss-shouted"; at: Tick; text: string }>
  | Readonly<{ kind: "player-hit-judged"; at: Tick; style: IncomingStyle; outcome: "passed" | "invulnerable"; requested: number }>
  | Readonly<{ kind: "run-ended"; at: Tick; reason: RunEnd }>;

export type PlayerObservation = Readonly<{ tile: Tile; hp: number; prayer: Style | null }>;

export type InputObservation =
  | Readonly<{ kind: "walk-ordered"; destination: Tile }>
  | Readonly<{ kind: "prayer-published"; prayer: Style | null }>;

export type TickRow = Readonly<{
  tick: Tick;
  worldTick: WorldTick;
  phase: Phase;
  beats: readonly Beat[];
  playerAtBossStep: PlayerObservation;
  playerAtPostTick: PlayerObservation;
  bossHp: Readonly<{ atBossStep: number; atPostTick: number }>;
  combatDraws: number;
  inputs: readonly InputObservation[];
  events: readonly FightEvent[];
}>;

export type RunState =
  | Readonly<{ kind: "waiting" }>
  | Readonly<{ kind: "running"; tick: Tick; phase: Phase }>
  | Readonly<{ kind: "ended"; at: Tick; reason: RunEnd }>;

type EquipmentSlot = GearSlot | "offhand";
type LoadoutSnapshot = Readonly<{
  equipped: Readonly<Record<EquipmentSlot, number | null>>;
  inventory: readonly (number | null)[];
  specialEnergy: number;
}>;

export type FightSnapshot = Readonly<{
  run: RunState;
  boss: Readonly<{ npcId: number; hp: number; maxHp: number; visible: boolean; defence: number }>;
  player: LoadoutSnapshot;
}>;

export type FightLog = Readonly<{ header: Readonly<{ seed: Seed; choices: ResolvedChoices }>; rows: readonly TickRow[] }>;
