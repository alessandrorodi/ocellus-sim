import { CacheRenderModel, CacheRenderReferences, Mob, Projectile } from "osrs-sdk";
import type { Model, Region, UnitBonuses } from "osrs-sdk";
import type { DrillConfig } from "../OcellusTimings";
import { OCELLUS_P4 } from "../OcellusTimings";
import type { OcellusPlayer } from "../OcellusPlayer";
import type {
  Beat,
  FightEvent,
  HitReceipt,
  IncomingStyle,
  InputObservation,
  Phase,
  PlayerObservation,
  RunEnd,
  RunState,
  Tick,
  TickRow,
  Tile,
  VoidKind,
} from "../P4Types";
import { after, tick, worldTick } from "../P4Types";
import { VOID_MASKS, floorRule } from "../p4/floor";
import { orbTile, reach } from "../p4/orb";
import { rollInt } from "../p4/roll";
import type { Moment } from "../p4/schedule";
import { Schedule } from "../p4/schedule";

type RowDraft = Omit<TickRow, "playerAtPostTick" | "bossHp" | "combatDraws"> & Readonly<{ bossHpAtBossStep: number; drawsAtBossStep: number }>;

type Run =
  | Readonly<{ kind: "waiting"; inputs: readonly InputObservation[] }>
  | Readonly<{ kind: "stepping"; draft: RowDraft }>
  | Readonly<{ kind: "killed"; draft: RowDraft }>
  | Readonly<{ kind: "between"; last: Readonly<{ tick: Tick; phase: Phase }>; inputs: readonly InputObservation[] }>
  | Readonly<{ kind: "ended"; at: Tick; reason: RunEnd; phase: Phase }>;

type Orb =
  | Readonly<{ kind: "drained"; void: VoidKind; credit: number }>
  | Readonly<{ kind: "dormant"; void: VoidKind; credit: number; tile: Tile }>
  | Readonly<{ kind: "available"; void: VoidKind; credit: number; tile: Tile }>
  | Readonly<{ kind: "claimed"; void: VoidKind; credit: number; tile: Tile; returnsAt: Tick }>
  | Readonly<{ kind: "expired"; void: VoidKind; credit: number; tile: Tile }>;

function incomingStyle(attackStyle: string): IncomingStyle {
  switch (attackStyle) {
    case "stab":
    case "slash":
    case "crush":
      return "melee";
    case "range":
      return "ranged";
    case "magic":
      return "magic";
    default:
      return "typeless";
  }
}

class P4Hit extends Projectile {
  constructor(
    boss: Ocellus,
    private readonly player: OcellusPlayer,
    private readonly amount: (beforeHp: number) => number,
    private readonly settle: (receipt: HitReceipt) => void,
  ) {
    super(null, 0, boss, player, "typeless", { setDelay: 1, visuals: { hidden: true } });
  }

  override beforeHit(): void {
    super.beforeHit();
    const beforeHp = this.player.currentStats.hitpoint;
    const requested = this.amount(beforeHp);
    this.damage = Math.min(requested, beforeHp);
    this.settle({ requested, applied: this.damage, beforeHp, afterHp: beforeHp - this.damage, prayer: this.player.protection });
  }
}

function phaseEvents(last: Phase | null, now: Phase, at: Tick): FightEvent[] {
  const events: FightEvent[] = [];
  if (last?.stage !== now.stage) events.push({ kind: "stage-entered", at, stage: now.stage });
  if (now.overhead !== null && last?.overhead !== now.overhead) events.push({ kind: "overhead-switched", at, overhead: now.overhead });
  if (last?.boss !== now.boss) events.push({ kind: "boss-state-changed", at, state: now.boss });
  return events;
}

export class Ocellus extends Mob {
  private readonly schedule: Schedule;
  private run: Run = { kind: "waiting", inputs: [] };
  private orbs: readonly Orb[] = [];

  constructor(region: Region, private readonly config: DrillConfig, private readonly target: OcellusPlayer) {
    super(region, OCELLUS_P4.geometry.bossAnchor.value);
    this.schedule = Schedule.compile(config.seed, config.choices);
  }

  enterP4(): void {
    const maxHp = this.config.choices.bossMaxHp.option.value;
    this.stats = { ...OCELLUS_P4.boss.stats.value, hitpoint: maxHp };
    this.currentStats = { ...this.stats, hitpoint: Math.floor(maxHp * this.config.choices.entryHpFraction.option.value) };
  }

  override mobName(): string {
    return "Ocellus";
  }

  override get combatLevel(): number {
    return OCELLUS_P4.boss.combatLevel.value;
  }

  override get size(): number {
    return OCELLUS_P4.boss.size.value;
  }

  override get bonuses(): UnitBonuses {
    return {
      attack: { stab: 0, slash: 0, crush: 0, magic: 0, range: 0 },
      defence: OCELLUS_P4.boss.defenceBonuses.value,
      other: { meleeStrength: 0, rangedStrength: 0, magicDamage: 0, prayer: 0 },
    };
  }

  override create3dModel(): Model {
    return CacheRenderModel.forRenderable(this, CacheRenderReferences.npc(OCELLUS_P4.boss.npcId.value));
  }

  override visible(): boolean {
    return super.visible() && this.phase().boss !== "hidden";
  }

  override canBeAttacked(): boolean {
    return this.phase().boss !== "hidden";
  }

  override movementStep(): void {}

  override attackIfPossible(): void {}

  override queueStep(): void {
    const run = this.run;
    switch (run.kind) {
      case "waiting":
        this.step(this.schedule.at(tick(0)), null, run.inputs);
        return;
      case "between":
        this.step(this.schedule.at(tick(run.last.tick + 1)), run.last.phase, run.inputs);
        return;
      case "stepping":
      case "killed":
      case "ended":
        super.queueStep();
        return;
      default: {
        const unhandled: never = run;
        return unhandled;
      }
    }
  }

  recordInput(input: InputObservation): void {
    const run = this.run;
    switch (run.kind) {
      case "waiting":
      case "between":
        this.run = { ...run, inputs: [...run.inputs, input] };
        return;
      case "stepping":
      case "killed":
        this.run = { ...run, draft: { ...run.draft, inputs: [...run.draft.inputs, input] } };
        return;
      case "ended":
        return;
      default: {
        const unhandled: never = run;
        return unhandled;
      }
    }
  }

  completeTick(): TickRow | null {
    const run = this.run;
    switch (run.kind) {
      case "waiting":
      case "between":
      case "ended":
        return null;
      case "stepping":
      case "killed": {
        const { bossHpAtBossStep, drawsAtBossStep, ...draft } = run.draft;
        const playerAtPostTick = this.target.observe();
        const died = run.kind === "stepping" && playerAtPostTick.hp <= 0;
        const events: readonly FightEvent[] = died ? [...draft.events, { kind: "run-ended", at: draft.tick, reason: "death" }] : draft.events;
        const row: TickRow = {
          ...draft,
          playerAtPostTick,
          events,
          bossHp: { atBossStep: bossHpAtBossStep, atPostTick: this.currentStats.hitpoint },
          combatDraws: this.target.combatDraws - drawsAtBossStep,
        };
        const reason: RunEnd | null = run.kind === "killed" ? "kill" : died ? "death" : null;
        if (reason === null) this.claimOrbs(row.tick, playerAtPostTick.tile);
        this.run = reason === null
          ? { kind: "between", last: { tick: row.tick, phase: row.phase }, inputs: [] }
          : { kind: "ended", at: row.tick, reason, phase: row.phase };
        return row;
      }
      default: {
        const unhandled: never = run;
        return unhandled;
      }
    }
  }

  runState(): RunState {
    const run = this.run;
    switch (run.kind) {
      case "waiting":
        return { kind: "waiting" };
      case "stepping":
      case "killed":
        return { kind: "running", tick: run.draft.tick, phase: run.draft.phase };
      case "between":
        return { kind: "running", tick: run.last.tick, phase: run.last.phase };
      case "ended":
        return { kind: "ended", at: run.at, reason: run.reason };
      default: {
        const unhandled: never = run;
        return unhandled;
      }
    }
  }

  private phase(): Phase {
    const run = this.run;
    switch (run.kind) {
      case "waiting":
        return this.schedule.at(tick(0)).phase;
      case "stepping":
      case "killed":
        return run.draft.phase;
      case "between":
        return run.last.phase;
      case "ended":
        return run.phase;
      default: {
        const unhandled: never = run;
        return unhandled;
      }
    }
  }

  private step(moment: Moment, last: Phase | null, inputs: readonly InputObservation[]): void {
    const draft = {
      tick: moment.tick,
      worldTick: worldTick(this.region.world.globalTickCounter),
      phase: moment.phase,
      playerAtBossStep: this.target.observe(),
      inputs,
      bossHpAtBossStep: this.currentStats.hitpoint,
      drawsAtBossStep: this.target.combatDraws,
    };
    const judged = this.judgeLandingHits(moment);
    super.queueStep();
    const logged = [...judged, ...phaseEvents(last, moment.phase, moment.tick)];
    if (this.currentStats.hitpoint <= 0) {
      this.run = { kind: "killed", draft: { ...draft, beats: [], events: [...logged, { kind: "run-ended", at: moment.tick, reason: "kill" }] } };
      return;
    }
    const reactions = moment.beats.flatMap((beat) => this.react(beat, moment.tick, draft.playerAtBossStep) ?? []);
    this.run = { kind: "stepping", draft: { ...draft, beats: moment.beats, events: [...logged, ...reactions] } };
  }

  private judgeLandingHits(moment: Moment): FightEvent[] {
    const damageable = moment.phase.boss === "present-damageable";
    return this.incomingProjectiles
      .filter((projectile) => projectile.remainingDelay === 1 && !projectile.shouldDestroy())
      .map((projectile): FightEvent => {
        const requested = projectile.damage;
        if (!damageable) projectile.damage = 0;
        return { kind: "player-hit-judged", at: moment.tick, style: incomingStyle(projectile.attackStyle), outcome: damageable ? "passed" : "invulnerable", requested };
      });
  }

  private react(beat: Beat, at: Tick, player: PlayerObservation): FightEvent | null {
    switch (beat.kind) {
      case "boss-shouts":
        this.setOverheadText(beat.text);
        this.overheadTextTimer = beat.lasts;
        return { kind: "boss-shouted", at, text: beat.text };
      case "floor-damage":
        this.strikeFloor(beat.void, at, player);
        return null;
      case "lifeforce-tell":
        return { kind: "lifeforce-told", at, void: beat.void };
      case "lifeforce-hit":
        this.drain(beat.void, at);
        return null;
      case "orb-spawns":
        return this.spawnOrb(beat.void, at, player.tile);
      case "orb-matures":
        return this.matureOrb(beat.void, at);
      case "orb-expires":
        return this.expireOrb(beat.void, at);
      case "unclaimed-orb-heals":
        return this.healFromUnclaimedOuterOrb(at);
      case "explosion-mark":
      case "explosion-impact":
      case "special-tell":
      case "special-hit":
      case "soul-split-heal":
      case "rifts-spawn":
      case "rift-charge-ends":
        return null;
      default: {
        const unhandled: never = beat;
        return unhandled;
      }
    }
  }

  private strikeFloor(kind: VoidKind, at: Tick, player: PlayerObservation): void {
    const rule = floorRule(kind, this.config.choices);
    if (rule.kind === "harmless" || !VOID_MASKS[kind].contains(player.tile)) return;
    const requested = rollInt(this.config.seed, "floorDamage", at, rule.perTick, 0);
    const hit = new P4Hit(this, this.target, () => requested, (receipt) => this.recordEvent({ kind: "floor-hit", at, void: kind, tile: player.tile, receipt }));
    this.target.addProjectile(hit);
  }

  private drain(kind: VoidKind, at: Tick): void {
    const divisor = OCELLUS_P4.lifeforceOrb.drainDivisor.value;
    const hit = new P4Hit(this, this.target, (hp) => Math.floor(hp / divisor), (receipt) => {
      this.orbs = [...this.orbs.filter((orb) => orb.void !== kind), { kind: "drained", void: kind, credit: receipt.applied }];
      this.recordEvent({ kind: "lifeforce-drained", at, void: kind, receipt });
    });
    this.target.addProjectile(hit);
  }

  private orb(kind: VoidKind): Orb | null {
    return this.orbs.find((orb) => orb.void === kind) ?? null;
  }

  private replaceOrb(kind: VoidKind, next: Orb | null): void {
    this.orbs = this.orbs.flatMap((orb) => (orb.void !== kind ? [orb] : next === null ? [] : [next]));
  }

  private spawnOrb(kind: VoidKind, at: Tick, player: Tile): FightEvent | null {
    const orb = this.orb(kind);
    if (orb?.kind !== "drained") return null;
    const tile = orbTile(this.config.seed, at, player, kind, this.config.choices);
    this.replaceOrb(kind, { kind: "dormant", void: kind, credit: orb.credit, tile });
    return { kind: "orb-spawned", at, void: kind, tile, credit: orb.credit };
  }

  private matureOrb(kind: VoidKind, at: Tick): FightEvent | null {
    const orb = this.orb(kind);
    if (orb?.kind !== "dormant") return null;
    this.replaceOrb(kind, { ...orb, kind: "available" });
    return { kind: "orb-matured", at, void: kind, tile: orb.tile };
  }

  private expireOrb(kind: VoidKind, at: Tick): FightEvent | null {
    const orb = this.orb(kind);
    if (orb?.kind !== "dormant" && orb?.kind !== "available") return null;
    this.replaceOrb(kind, { kind: "expired", void: kind, credit: orb.credit, tile: orb.tile });
    return { kind: "orb-expired", at, void: kind, tile: orb.tile, credit: orb.credit };
  }

  private healFromUnclaimedOuterOrb(at: Tick): FightEvent | null {
    const orb = this.orb("outer-void");
    if (orb?.kind !== "expired") return null;
    this.replaceOrb("outer-void", null);
    const beforeHp = this.currentStats.hitpoint;
    const afterHp = Math.min(this.stats.hitpoint, beforeHp + orb.credit);
    this.currentStats.hitpoint = afterHp;
    return { kind: "boss-healed", at, cause: { kind: "unclaimed-orb" }, receipt: { requested: orb.credit, applied: afterHp - beforeHp, beforeHp, afterHp } };
  }

  private claimOrbs(at: Tick, player: Tile): void {
    const radius = this.config.choices.orbPickupRadius.option.value;
    const returnsAt = after(at, OCELLUS_P4.lifeforceOrb.returnAfterStep.value);
    this.orbs = this.orbs.map((orb) => (orb.kind === "available" && reach(orb.tile, player) <= radius ? { ...orb, kind: "claimed", returnsAt } : orb));
  }

  /** Runs after the player's hits land and before the SDK latches death, so a return must not reach a player at 0 HP. */
  settlePlayerHits(): void {
    const run = this.run;
    if (run.kind !== "stepping") return;
    const at = run.draft.tick;
    const isDue = (orb: Orb): orb is Extract<Orb, { kind: "claimed" }> => orb.kind === "claimed" && orb.returnsAt === at;
    const due = this.orbs.filter(isDue);
    this.orbs = this.orbs.filter((orb) => !isDue(orb));
    for (const orb of due) {
      const beforeHp = this.target.currentStats.hitpoint;
      if (beforeHp <= 0) continue;
      const afterHp = beforeHp + orb.credit;
      this.target.currentStats.hitpoint = afterHp;
      this.recordEvent({ kind: "orb-returned", at, void: orb.void, tile: orb.tile, receipt: { requested: orb.credit, applied: orb.credit, beforeHp, afterHp } });
    }
  }

  private recordEvent(event: FightEvent): void {
    const run = this.run;
    switch (run.kind) {
      case "stepping":
      case "killed":
        this.run = { ...run, draft: { ...run.draft, events: [...run.draft.events, event] } };
        return;
      case "waiting":
      case "between":
      case "ended":
        return;
      default: {
        const unhandled: never = run;
        return unhandled;
      }
    }
  }
}
