import type { Focus, ResolvedChoices, SpecialSelection, TransitionRecipe, VoidRecipe } from "../OcellusTimings";
import { OCELLUS_P4 } from "../OcellusTimings";
import type { Beat, Cycle, Mechanic, Phase, Seed, Special, Tick, TransitionKind, VoidKind } from "../P4Types";
import { cycle, ordinal, tick } from "../P4Types";
import { floorRule } from "./floor";
import { roll } from "./roll";

export type Moment = Readonly<{ tick: Tick; phase: Phase; beats: readonly Beat[] }>;

type BeatAt = (cycleNumber: Cycle, cycleStart: Tick) => Beat | null;
type Slot = Readonly<{ phase: (cycleNumber: Cycle) => Phase; beats: readonly BeatAt[] }>;

const VARIANTS: readonly Special[] = ["vortex", "spike-disk", "black-disk"];

function specialFor(selection: SpecialSelection, nth: number, seed: Seed, hitAt: Tick): Special {
  const uniform = (): Special => VARIANTS[Math.floor(roll(seed, "specialVariant", hitAt, 0) * VARIANTS.length)];
  switch (selection.kind) {
    case "random-uniform":
      return uniform();
    case "rotation":
      return selection.order[nth % selection.order.length];
    case "replay":
      return nth < selection.order.length ? selection.order[nth] : uniform();
    default: {
      const unhandled: never = selection;
      return unhandled;
    }
  }
}

function mechanicOf(beat: Beat): Mechanic | null {
  switch (beat.kind) {
    case "boss-shouts":
      return null;
    case "lifeforce-tell":
    case "lifeforce-hit":
    case "orb-spawns":
    case "orb-matures":
    case "orb-expires":
    case "unclaimed-orb-heals":
      return "lifeforce-orb";
    case "explosion-series-starts":
    case "explosion-mark":
    case "explosion-impact":
      return "explosions";
    case "floor-damage":
      return "void-floor";
    case "special-tell":
    case "special-hit":
    case "soul-split-heal":
      return "transition-attacks";
    case "rifts-spawn":
    case "rift-charge-ends":
      return "rifts";
    default: {
      const unhandled: never = beat;
      return unhandled;
    }
  }
}

function acts(focus: Focus, beat: Beat): boolean {
  const mechanic = mechanicOf(beat);
  return mechanic === null || focus.kind === "full-fight" || focus.mechanics.includes(mechanic);
}

export class Schedule {
  private constructor(
    private readonly leadIn: readonly Moment[],
    private readonly slots: readonly Slot[],
    private readonly focus: Focus,
  ) {}

  static compile(seed: Seed, choices: ResolvedChoices): Schedule {
    const { leadIn, cycle: stages, overheads, lifeforce, orb, bossHeals, rifts, explosion: explosionCues } = OCELLUS_P4;
    const hidden = leadIn.hiddenFor.value;
    const leadInLength = hidden + leadIn.presentFor.value;
    const shout = leadIn.shout.value;
    if (shout.at >= leadInLength) throw new RangeError(`lead-in shout at ${shout.at} is outside the ${leadInLength}-tick lead-in`);
    const leadInTable = Array.from({ length: leadInLength }, (_, t): Moment => ({
      tick: tick(t),
      phase: { stage: "lead-in", boss: t < hidden ? "hidden" : "present-invulnerable", overhead: null },
      beats: t === shout.at ? [{ kind: "boss-shouts", text: shout.text, lasts: shout.lasts }] : [],
    }));

    const [inner, afterInner, outer, afterOuter] = stages;
    const afterInnerStart = inner.duration.value;
    const outerStart = afterInnerStart + afterInner.duration.value;
    const afterOuterStart = outerStart + outer.duration.value;
    const length = afterOuterStart + afterOuter.duration.value;
    const beats: BeatAt[][] = Array.from({ length }, () => []);
    const put = (offset: number, label: string, beat: BeatAt) => {
      if (offset < 0 || offset >= length) throw new RangeError(`${label} at cycle offset ${offset} is outside the ${length}-tick cycle`);
      beats[offset].push(beat);
    };
    const inside = (offset: number, duration: number, label: string) => {
      if (offset >= duration) throw new RangeError(`${label} at ${offset} is outside its ${duration}-tick stage`);
    };

    const explosions = choices.explosions.option.value;
    const unclaimed = choices.unclaimedOuterOrb.option.value;
    const voidBeats = (recipe: VoidRecipe<VoidKind>, start: number) => {
      const { kind } = recipe;
      inside(lifeforce.hitAfterOnset.value, recipe.duration.value, `${kind} lifeforce hit`);
      const hit = start + lifeforce.hitAfterOnset.value;
      put(start + lifeforce.tellAfterOnset.value, `${kind} lifeforce tell`, () => ({ kind: "lifeforce-tell", void: kind }));
      put(hit, `${kind} lifeforce hit`, () => ({ kind: "lifeforce-hit", void: kind }));
      put(hit + choices.orbSpawnAfterHit.option.value, `${kind} orb spawn`, () => ({ kind: "orb-spawns", void: kind }));
      put(hit + recipe.orbMaturesAfterHit.value, `${kind} orb maturity`, () => ({ kind: "orb-matures", void: kind }));
      put(hit + orb.lastHealAfterHit.value, `${kind} orb expiry`, () => ({ kind: "orb-expires", void: kind }));
      if (kind === "outer-void" && unclaimed.kind === "heals-boss") {
        if (unclaimed.afterHit <= orb.lastHealAfterHit.value) throw new RangeError(`an unclaimed outer orb must heal the boss after its last pickup at hit + ${orb.lastHealAfterHit.value}, not at hit + ${unclaimed.afterHit}`);
        put(hit + unclaimed.afterHit, "unclaimed outer orb heal", () => ({ kind: "unclaimed-orb-heals" }));
      }
      put(hit + explosionCues.seriesStartsAfterHit.value, `${kind} explosion series start`, () => ({ kind: "explosion-series-starts", void: kind }));
      for (let pulse = 0; pulse < explosions.count; pulse++) {
        const mark = hit + explosions.firstMarkAfterHit + pulse * explosions.period;
        put(mark, `${kind} explosion mark ${pulse}`, () => ({ kind: "explosion-mark", void: kind, pulse }));
        put(mark + explosions.impactAfterMark, `${kind} explosion impact ${pulse}`, () => ({ kind: "explosion-impact", void: kind, pulse }));
      }
      const floor = floorRule(kind, choices);
      if (floor.kind === "damages") {
        inside(floor.afterOnset, recipe.duration.value, `${kind} floor damage onset`);
        for (let offset = floor.afterOnset; offset < recipe.duration.value; offset++) {
          put(start + offset, `${kind} floor damage`, () => ({ kind: "floor-damage", void: kind }));
        }
      }
    };

    const selection = choices.specialSelection.option.value;
    const transitionBeats = (recipe: TransitionRecipe<TransitionKind>, start: number) => {
      const { kind, duration, tellAfterStart, hitAfterStart, soulSplitAfterTell } = recipe;
      inside(tellAfterStart.value + soulSplitAfterTell.value, duration.value, `${kind} Soul Split`);
      inside(hitAfterStart.value, duration.value, `${kind} transition hit`);
      const nth = (c: Cycle) => ordinal(2 * (c - 1) + (kind === "after-inner" ? 0 : 1));
      const variant = (c: Cycle, cycleStart: Tick) => specialFor(selection, nth(c), seed, tick(cycleStart + start + hitAfterStart.value));
      put(start + tellAfterStart.value, `${kind} transition tell`, (c, s) => ({ kind: "special-tell", ordinal: nth(c), variant: variant(c, s) }));
      put(start + hitAfterStart.value, `${kind} transition hit`, (c, s) => ({ kind: "special-hit", ordinal: nth(c), variant: variant(c, s) }));
      put(start + hitAfterStart.value + bossHeals.soulSplitAfterHit.value, `${kind} Soul Split heal`, (c) => ({ kind: "soul-split-heal", ordinal: nth(c) }));
    };

    voidBeats(inner, 0);
    transitionBeats(afterInner, afterInnerStart);
    voidBeats(outer, outerStart);
    transitionBeats(afterOuter, afterOuterStart);

    const firstRiftCycle = choices.riftFirstCycle.option.value;
    if (firstRiftCycle < 2) throw new RangeError(`rifts cannot spawn before cycle 1 starts (first rift cycle ${firstRiftCycle})`);
    const riftSpawn = length - rifts.spawnBeforeOnset.value;
    put(riftSpawn, "rift spawn", (c) => (c + 1 >= firstRiftCycle ? { kind: "rifts-spawn", forCycle: cycle(c + 1) } : null));
    put(riftSpawn + rifts.chargeAfterSpawn.value - length, "rift charge", (c) => (c >= firstRiftCycle ? { kind: "rift-charge-ends", forCycle: c } : null));

    const switchAt = (recipe: TransitionRecipe<TransitionKind>) => recipe.tellAfterStart.value + recipe.soulSplitAfterTell.value;
    const phaseAt = (offset: number) => (c: Cycle): Phase => {
      if (offset < afterInnerStart) {
        return { stage: "inner-void", cycle: c, boss: "present-damageable", overhead: overheads["inner-void"].value };
      }
      if (offset < outerStart) {
        const deflecting = offset - afterInnerStart < switchAt(afterInner);
        return { stage: "after-inner", cycle: c, boss: "present-damageable", overhead: deflecting ? overheads["inner-void"].value : overheads.transition.value };
      }
      if (offset < afterOuterStart) {
        return { stage: "outer-void", cycle: c, boss: "present-damageable", overhead: overheads["outer-void"].value };
      }
      const deflecting = offset - afterOuterStart < switchAt(afterOuter);
      return { stage: "after-outer", cycle: c, boss: "present-damageable", overhead: deflecting ? overheads["outer-void"].value : overheads.transition.value };
    };

    const slots = beats.map((slotBeats, offset): Slot => ({ phase: phaseAt(offset), beats: slotBeats }));
    return new Schedule(leadInTable, slots, choices.focus.option.value);
  }

  at(t: Tick): Moment {
    if (t < this.leadIn.length) return this.leadIn[t];
    const sinceFirstVoid = t - this.leadIn.length;
    const offset = sinceFirstVoid % this.slots.length;
    const cycleNumber = cycle(Math.floor(sinceFirstVoid / this.slots.length) + 1);
    const cycleStart = tick(t - offset);
    const slot = this.slots[offset];
    const beats = slot.beats.flatMap((beat) => beat(cycleNumber, cycleStart) ?? []).filter((beat) => acts(this.focus, beat));
    return { tick: t, phase: slot.phase(cycleNumber), beats };
  }
}
