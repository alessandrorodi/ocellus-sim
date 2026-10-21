import { CacheRenderModel, CacheRenderReferences, Mob } from "osrs-sdk";
import type { Model, Region, UnitBonuses } from "osrs-sdk";
import type { DrillConfig } from "../OcellusTimings";
import { OCELLUS_P4 } from "../OcellusTimings";
import type { OcellusPlayer } from "../OcellusPlayer";
import type { Beat, FightEvent, IncomingStyle, InputObservation, Phase, RunEnd, RunState, Tick, TickRow } from "../P4Types";
import { tick, worldTick } from "../P4Types";
import type { Moment } from "../p4/schedule";
import { Schedule } from "../p4/schedule";

type RowDraft = Omit<TickRow, "playerAtPostTick" | "bossHp" | "combatDraws"> & Readonly<{ bossHpAtBossStep: number; drawsAtBossStep: number }>;

type Run =
  | Readonly<{ kind: "waiting"; inputs: readonly InputObservation[] }>
  | Readonly<{ kind: "stepping"; draft: RowDraft }>
  | Readonly<{ kind: "killed"; draft: RowDraft }>
  | Readonly<{ kind: "between"; last: Readonly<{ tick: Tick; phase: Phase }>; inputs: readonly InputObservation[] }>
  | Readonly<{ kind: "ended"; at: Tick; reason: RunEnd; phase: Phase }>;

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
    const reactions = moment.beats.flatMap((beat) => this.react(beat, moment.tick) ?? []);
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

  private react(beat: Beat, at: Tick): FightEvent | null {
    switch (beat.kind) {
      case "boss-shouts":
        this.setOverheadText(beat.text);
        this.overheadTextTimer = beat.lasts;
        return { kind: "boss-shouted", at, text: beat.text };
      case "lifeforce-tell":
      case "lifeforce-hit":
      case "orb-spawns":
      case "orb-matures":
      case "orb-expires":
      case "unclaimed-orb-heals":
      case "explosion-mark":
      case "explosion-impact":
      case "floor-damage":
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
}
