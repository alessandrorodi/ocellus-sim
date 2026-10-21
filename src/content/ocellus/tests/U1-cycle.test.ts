import { Random } from "osrs-sdk";
import { parseDrillRequest } from "../js/OcellusTimings";
import { startDrill } from "./drill";

describe("U1 cycle skeleton", () => {
  test("floor stages, overheads and boss state follow the reconciled schedule as separate tracks", () => {
    const drill = startDrill();
    drill.playCorrectlyTo(128);
    expect(drill.rows().map((row) => row.tick)).toEqual(Array.from({ length: 129 }, (_, t) => t));
    expect(drill.events("stage-entered").map((e) => [e.at, e.stage])).toEqual([
      [0, "lead-in"], [8, "inner-void"], [30, "after-inner"], [39, "outer-void"], [59, "after-outer"],
      [68, "inner-void"], [90, "after-inner"], [99, "outer-void"], [119, "after-outer"], [128, "inner-void"],
    ]);
    expect(drill.events("overhead-switched").map((e) => [e.at, e.overhead])).toEqual([
      [8, "deflect-melee"], [33, "soul-split"], [39, "deflect-range"], [61, "soul-split"],
      [68, "deflect-melee"], [93, "soul-split"], [99, "deflect-range"], [121, "soul-split"], [128, "deflect-melee"],
    ]);
    expect(drill.events("boss-state-changed").map((e) => [e.at, e.state])).toEqual([
      [0, "hidden"], [4, "present-invulnerable"], [8, "present-damageable"],
    ]);
    expect(drill.events("boss-shouted").map((e) => [e.at, e.text])).toEqual([[5, "End..."]]);
    drill.dispose();
  });

  test("the transition attack ordinal runs across cycles and each selection names its variants", () => {
    const hits = (options: Parameters<typeof startDrill>[0]) => {
      const drill = startDrill(options);
      drill.playCorrectlyTo(217);
      const out = drill.rows().flatMap((row) => row.beats.flatMap((b) => (b.kind === "special-hit" ? [[row.tick, b.ordinal, b.variant]] : [])));
      drill.dispose();
      return out;
    };
    expect(hits({ selection: { specialSelection: "replay-v2" } })).toEqual([
      [37, 0, "vortex"], [65, 1, "spike-disk"], [97, 2, "black-disk"], [125, 3, "vortex"], [157, 4, "spike-disk"], [185, 5, "black-disk"], [217, 6, "vortex"],
    ]);
    expect(hits({ seed: 1 })).toEqual([
      [37, 0, "black-disk"], [65, 1, "black-disk"], [97, 2, "spike-disk"], [125, 3, "spike-disk"], [157, 4, "spike-disk"], [185, 5, "vortex"], [217, 6, "black-disk"],
    ]);
    expect(hits({ seed: 2 })).toEqual([
      [37, 0, "vortex"], [65, 1, "spike-disk"], [97, 2, "vortex"], [125, 3, "black-disk"], [157, 4, "black-disk"], [185, 5, "vortex"], [217, 6, "spike-disk"],
    ]);
  });

  test("a focus keeps the whole cycle running but lets only its mechanic's beats act", () => {
    const drill = startDrill({ selection: { focus: "transition-attacks" } });
    drill.tickTo(67);
    expect(drill.rows().flatMap((row) => row.beats.map((b) => [row.tick, b.kind]))).toEqual([
      [5, "boss-shouts"], [32, "special-tell"], [37, "special-hit"], [39, "soul-split-heal"], [60, "special-tell"], [65, "special-hit"], [67, "soul-split-heal"],
    ]);
    expect(drill.events("stage-entered").map((e) => e.at)).toEqual([0, 8, 30, 39, 59]);
    drill.dispose();
  });

  test("GET READY ticks write no row, and the first boss step is P4 tick 0", () => {
    const drill = startDrill({ keepGetReady: true });
    drill.region.world.tickWorld(3);
    expect(drill.rows()).toEqual([]);
    drill.region.world.getReadyTimer = 0;
    drill.tickTo(0);
    expect(drill.rows().map((row) => [row.tick, row.worldTick, row.phase])).toEqual([
      [0, 4, { stage: "lead-in", boss: "hidden", overhead: null }],
    ]);
    drill.dispose();
  });

  test("the boss enters phase 4 at the selected share of the selected max HP", () => {
    const entry = (options: Parameters<typeof startDrill>[0]) => {
      const drill = startDrill(options);
      const boss = drill.region.snapshot()?.boss;
      drill.dispose();
      return boss;
    };
    expect(entry({})).toEqual({ npcId: 16677, hp: 1355, maxHp: 5420, visible: false, defence: 250 });
    expect(entry({ selection: { bossMaxHp: "cache" } })).toEqual({ npcId: 16677, hp: 1312, maxHp: 5250, visible: false, defence: 250 });
    expect(entry({ selection: { entryHpFraction: "v1-observed" } })).toEqual({ npcId: 16677, hp: 1349, maxHp: 5420, visible: false, defence: 250 });
  });

  test("a restart starts a new run: entry HP again and a log from P4 tick 0", () => {
    const drill = startDrill();
    drill.tickTo(7);
    drill.hit(drill.player(), drill.boss(), 20);
    drill.tickTo(9);
    expect(drill.region.snapshot()?.boss.hp).toBe(1335);
    drill.restart();
    drill.tickTo(1);
    expect([drill.region.snapshot()?.boss.hp, drill.rows().map((row) => row.tick)]).toEqual([1355, [0, 1]]);
    drill.dispose();
  });

  test("the boss is hidden through P4 tick 3, drawn and targetable from 4, and takes damage only from 8", () => {
    const drill = startDrill();
    const presence = [0, 1, 2, 3, 4].map((t) => {
      drill.tickTo(t);
      return [drill.region.snapshot()?.boss.visible, drill.boss().canBeAttacked()];
    });
    expect(presence).toEqual([[false, false], [false, false], [false, false], [false, false], [true, true]]);
    drill.tickTo(5);
    drill.hit(drill.player(), drill.boss(), 20);
    drill.tickTo(7);
    drill.hit(drill.player(), drill.boss(), 20);
    drill.tickTo(8);
    expect(drill.events("player-hit-judged").map((e) => [e.at, e.outcome, e.requested])).toEqual([[6, "invulnerable", 20], [8, "passed", 20]]);
    expect([drill.row(6).bossHp, drill.row(8).bossHp]).toEqual([{ atBossStep: 1355, atPostTick: 1355 }, { atBossStep: 1355, atPostTick: 1335 }]);
    drill.dispose();
  });

  test("a lethal hit on the boss ends the run before that tick's beats act", () => {
    const drill = startDrill();
    drill.tickTo(11);
    drill.hit(drill.player(), drill.boss(), 1355);
    drill.tickTo(20);
    expect(drill.events("run-ended").map((e) => [e.at, e.reason])).toEqual([[12, "kill"]]);
    expect(drill.rows().slice(-2).map((row) => [row.tick, row.beats.map((b) => b.kind)])).toEqual([[11, ["lifeforce-tell", "floor-damage"]], [12, []]]);
    expect(drill.region.snapshot()?.run).toEqual({ kind: "ended", at: 12, reason: "kill" });
    drill.dispose();
  });

  test.each([
    {
      at: 8,
      phase: { stage: "inner-void", cycle: 1, boss: "present-damageable", overhead: "deflect-melee" },
      entered: [
        { kind: "stage-entered", at: 8, stage: "inner-void" },
        { kind: "overhead-switched", at: 8, overhead: "deflect-melee" },
        { kind: "boss-state-changed", at: 8, state: "present-damageable" },
      ],
    },
    {
      at: 39,
      phase: { stage: "outer-void", cycle: 1, boss: "present-damageable", overhead: "deflect-range" },
      entered: [
        { kind: "stage-entered", at: 39, stage: "outer-void" },
        { kind: "overhead-switched", at: 39, overhead: "deflect-range" },
      ],
    },
  ])("a lethal hit on phase-change tick $at logs the phase that tick enters and none of its beats", ({ at, phase, entered }) => {
    const drill = startDrill();
    drill.playCorrectlyTo(at - 1);
    drill.hit(drill.player(), drill.boss(), 1355);
    drill.tickTo(at + 2);
    const row = drill.row(at);
    expect([row.phase, row.beats, row.events]).toEqual([
      phase,
      [],
      [
        { kind: "player-hit-judged", at, style: "typeless", outcome: "passed", requested: 1355 },
        ...entered,
        { kind: "run-ended", at, reason: "kill" },
      ],
    ]);
    drill.dispose();
  });

  test("a lethal hit on the player ends the run on the tick it lands", () => {
    const drill = startDrill();
    drill.tickTo(9);
    drill.hit(drill.boss(), drill.player(), 99);
    drill.tickTo(20);
    expect(drill.events("run-ended").map((e) => [e.at, e.reason])).toEqual([[10, "death"]]);
    expect(drill.rows().map((row) => row.tick).slice(-1)).toEqual([10]);
    expect(drill.row(10).playerAtPostTick.hp).toBe(0);
    drill.dispose();
  });

  test("the log records a walk order and a protection prayer on the row they act in", () => {
    const drill = startDrill();
    drill.tickTo(9);
    drill.walkTo({ x: 9, y: 1 });
    drill.tickTo(10);
    drill.pray("Protect from Magic");
    drill.tickTo(11);
    expect([drill.row(10).inputs, drill.row(10).playerAtPostTick.tile]).toEqual([[{ kind: "walk-ordered", destination: { x: 9, y: 1 } }], { x: 7, y: 1 }]);
    expect([drill.row(11).inputs, drill.row(11).playerAtBossStep.prayer]).toEqual([[{ kind: "prayer-published", prayer: "magic" }], "magic"]);
    drill.dispose();
  });

  test("native combat rolls replay from the seed, and the SDK's random source is restored between ticks", () => {
    const fight = (global: number) => {
      Random.setRandom(() => global);
      const drill = startDrill();
      drill.tickTo(8);
      drill.player().setAggro(drill.boss());
      drill.tickTo(40);
      const out = { bossHp: drill.rows().map((row) => row.bossHp.atPostTick), draws: drill.rows().reduce((sum, row) => sum + row.combatDraws, 0), after: Random.get() };
      drill.dispose();
      return out;
    };
    const original = Random.randomFn;
    const [low, high] = [fight(0.25), fight(0.75)];
    Random.setRandom(original);
    expect([low.after, high.after]).toEqual([0.25, 0.75]);
    expect(low.bossHp).toEqual(high.bossHp);
    expect(low.bossHp[low.bossHp.length - 1]).toBeLessThan(1355);
    expect(low.draws).toBeGreaterThan(0);
  });

  test("the URL selects data-file options and lists unknown keys, options and seeds by name", () => {
    const parsed = parseDrillRequest(new URL("http://127.0.0.1:8002/?seed=7&explosions=v2-seven&focus=everything&nope=1"), () => 99);
    expect([parsed.config.seed, parsed.config.choices.explosions.key, parsed.config.choices.focus.key, parsed.rejected]).toEqual([
      7, "v2-seven", "full-fight", ["nope=1", "focus=everything"],
    ]);
    const unseeded = parseDrillRequest(new URL("http://127.0.0.1:8002/?seed=-3"), () => 99);
    expect([unseeded.config.seed, unseeded.rejected]).toEqual([99, ["seed=-3"]]);
  });
});
