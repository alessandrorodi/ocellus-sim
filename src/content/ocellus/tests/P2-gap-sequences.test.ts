import { Settings, TrainerInstance, Viewport } from "osrs-sdk";
import type { GapSequence } from "../fight/data";
import { P2 } from "../fight/data";
import type { FightOptions } from "../fight/Fight";
import { FightRegion } from "../fight/FightRegion";
import type { Arm } from "../fight/geometry";
import { key, sideOf } from "../fight/geometry";
import { PATTERN_COLOUR, patternTiles } from "../fight/pattern";
import { Phase2 } from "../fight/phase2";

/** Phase 2's gaps follow the recorded sequences, rounds in the recorded order ([R] in docs/SOURCES.md). */

type Round = { sequence: GapSequence; gaps: Map<Arm, number> };
type Lit = { round: Round & { q: string }; ns: number; ew: number; safe: Set<string> };

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
    const options: FightOptions = { seed, party: 1, startPhase: 2, hazardTiles: true, videoMarkers: false, skipMarkers: false, patternMarkers: false, soloVine: true, invincible: true };
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
      // The tiles the danger overlay paints safe (green) while this wave is lit.
      const marks = (this as Phase2).marks();
      const safe = new Set(marks.filter((m) => m.colour === 0x2bff73).map((m) => key(m.tile)));
      waves.push({ round: round as Round & { q: string }, ns: gap(["N", "S"]) + 1, ew: gap(["E", "W"]) + 1, safe });
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

  it("numbers each wave's safe spot: the pattern tile for the lit wave is a safe tile", () => {
    const tiles = patternTiles();
    for (const seed of [1, 2, 3]) {
      const waves = lit(seed);
      const count = new Map<Round, number>();
      for (const wave of waves) {
        const n = (count.get(wave.round) ?? 0) + 1;
        count.set(wave.round, n);
        const marked = tiles.filter((t) => t.colour === PATTERN_COLOUR[wave.round.sequence] && t.label.split("/").includes(String(n)) && sideOf(t.tile) === wave.round.q);
        expect(marked).toHaveLength(1);
        expect(wave.safe.has(key(marked[0].tile))).toBe(true);
      }
    }
  });
});
