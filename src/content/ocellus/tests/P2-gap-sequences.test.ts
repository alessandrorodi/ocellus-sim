import { Settings, TrainerInstance, Viewport } from "osrs-sdk";
import type { GapSequence } from "../fight/data";
import { P2 } from "../fight/data";
import type { FightOptions } from "../fight/Fight";
import { FightRegion } from "../fight/FightRegion";
import type { Arm } from "../fight/geometry";
import { Phase2 } from "../fight/phase2";

/** Phase 2's gaps follow the recorded sequences, rounds in the recorded order ([R] in docs/SOURCES.md). */

type Round = { sequence: GapSequence; gaps: Map<Arm, number> };
type Lit = { round: Round; ns: number; ew: number };

const proto = Phase2.prototype as unknown as { light(round: Round): void };
const light = proto.light;

describe("phase 2's portal gaps", () => {
  let restore: (() => void)[] = [];
  afterEach(() => {
    jest.restoreAllMocks();
    restore.forEach((r) => r());
    restore = [];
  });

  /** Every wave a seed lights: its round and the (north/south, east/west) gaps, 1 out nearest the middle. */
  function lit(seed: number): Lit[] {
    Settings.readFromStorage();
    const options: FightOptions = { seed, party: 1, startPhase: 2, hazardTiles: true, videoMarkers: false, skipMarkers: false, soloVine: true, invincible: true };
    const region = new FightRegion(options, () => {});
    const trainer = new TrainerInstance(region, { force2d: true });
    trainer.mount(document.createElement("canvas"), document.createElement("div"));
    region.world.getReadyTimer = 0;
    Viewport.viewport.resize(800, 600);
    restore.push(() => trainer.dispose());

    jest.restoreAllMocks();
    const waves: Lit[] = [];
    jest.spyOn(proto, "light").mockImplementation(function (this: unknown, round: Round) {
      light.call(this, round);
      const gap = (arms: Arm[]) => [...round.gaps].find(([arm]) => arms.includes(arm))?.[1] ?? NaN;
      waves.push({ round, ns: gap(["N", "S"]) + 1, ew: gap(["E", "W"]) + 1 });
    });
    for (let i = 0; i < P2.p3At + 5; i++) region.world.tickWorld();
    return waves;
  }

  it("lights each round's recorded sequence, in order after a random first", () => {
    const firsts = new Set<GapSequence>();
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const waves = lit(seed);
      const rounds = [...new Set(waves.map((w) => w.round))];
      expect(rounds).toHaveLength(3);
      firsts.add(rounds[0].sequence);
      const start = P2.gapOrder.indexOf(rounds[0].sequence);
      rounds.forEach((round, i) => {
        expect(round.sequence).toBe(P2.gapOrder[(start + i) % P2.gapOrder.length]);
        const got = waves.filter((w) => w.round === round).map((w) => [w.ns, w.ew]);
        const expected = P2.gapSequences[round.sequence].map(([ns, ew]) => [ns, ew]);
        // The last round is cut short by "This... is enough...".
        expect(got).toEqual(i < 2 ? expected : expected.slice(0, got.length));
      });
    }
    expect(firsts.size).toBeGreaterThan(1);
  });
});
