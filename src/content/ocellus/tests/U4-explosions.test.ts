import type { At } from "./drill";
import { FLOOD_SOUTH_OF_RING, SPAWN_ON_FLOOD, UNDER_BOSS, startDrill } from "./drill";

const EXPLOSIONS = { focus: "explosions" } as const;
const BESIDE_SPAWN: At = { x: 11, y: 10 };

describe("U4 personal explosions", () => {
  test("the series starts at hit + 2, then a mark every 2 ticks from hit + 5 captures the player's tile, and 16 lands on that tile a tick later", () => {
    const drill = startDrill({ selection: EXPLOSIONS });
    drill.tickTo(46);
    expect(drill.events("explosion-series-started")).toEqual([
      { kind: "explosion-series-started", at: 14, void: "inner-void" },
      { kind: "explosion-series-started", at: 45, void: "outer-void" },
    ]);
    expect(drill.events("explosion-marked").map((e) => [e.at, e.void, e.pulse, e.tile])).toEqual([
      [17, "inner-void", 0, { x: 10, y: 10 }], [19, "inner-void", 1, { x: 10, y: 10 }], [21, "inner-void", 2, { x: 10, y: 10 }],
      [23, "inner-void", 3, { x: 10, y: 10 }], [25, "inner-void", 4, { x: 10, y: 10 }], [27, "inner-void", 5, { x: 10, y: 10 }],
    ]);
    const resolved = drill.events("explosion-resolved");
    expect(resolved[0]).toEqual({
      kind: "explosion-resolved", at: 18, void: "inner-void", pulse: 0, tile: { x: 10, y: 10 }, underBoss: false,
      outcome: { kind: "hit", receipt: { requested: 16, applied: 16, beforeHp: 99, afterHp: 83, prayer: null } },
    });
    expect(resolved.map((e) => [e.at, e.pulse, e.outcome.kind === "hit" ? e.outcome.receipt.afterHp : null])).toEqual([
      [18, 0, 83], [20, 1, 67], [22, 2, 51], [24, 3, 35], [26, 4, 19], [28, 5, 3],
    ]);
    drill.dispose();
  });

  test("a step that moves the player during each mark tick leaves every mark behind", () => {
    const drill = startDrill({ selection: EXPLOSIONS });
    const steps: readonly (readonly [number, At])[] = [[16, BESIDE_SPAWN], [18, SPAWN_ON_FLOOD], [20, BESIDE_SPAWN], [22, SPAWN_ON_FLOOD], [24, BESIDE_SPAWN], [26, SPAWN_ON_FLOOD]];
    for (const [after, to] of steps) {
      drill.tickTo(after);
      drill.walkTo(to);
    }
    drill.tickTo(29);
    expect(drill.events("explosion-marked").map((e) => [e.at, e.tile])).toEqual([
      [17, { x: 10, y: 10 }], [19, { x: 11, y: 10 }], [21, { x: 10, y: 10 }], [23, { x: 11, y: 10 }], [25, { x: 10, y: 10 }], [27, { x: 11, y: 10 }],
    ]);
    expect(drill.events("explosion-resolved").map((e) => [e.at, e.outcome.kind])).toEqual([
      [18, "avoided"], [20, "avoided"], [22, "avoided"], [24, "avoided"], [26, "avoided"], [28, "avoided"],
    ]);
    expect(drill.row(28).playerAtPostTick.hp).toBe(99);
    drill.dispose();
  });

  test("a step first taken on the impact tick is late: the hit lands on the marked tile", () => {
    const drill = startDrill({ selection: EXPLOSIONS });
    drill.tickTo(17);
    drill.walkTo(BESIDE_SPAWN);
    drill.tickTo(18);
    expect(drill.events("explosion-resolved").map((e) => [e.at, e.outcome.kind, e.tile])).toEqual([[18, "hit", { x: 10, y: 10 }]]);
    expect(drill.row(18).playerAtPostTick.tile).toEqual({ x: 11, y: 10 });
    drill.dispose();
  });

  test("standing under the boss gives no cover: stepping under on a mark tick leaves that mark behind, and the next mark under the boss hits", () => {
    const drill = startDrill({ selection: EXPLOSIONS });
    drill.walkTo(FLOOD_SOUTH_OF_RING);
    drill.tickTo(16);
    drill.walkTo(UNDER_BOSS);
    drill.tickTo(20);
    expect(drill.events("explosion-resolved").map((e) => [e.at, e.tile, e.underBoss, e.outcome.kind])).toEqual([
      [18, { x: 10, y: 8 }, false, "avoided"],
      [20, { x: 10, y: 5 }, true, "hit"],
    ]);
    drill.dispose();
  });

  test.each([
    { option: "wiki-six", marks: [15, 17, 19, 21, 23, 25] },
    { option: "v2-seven", marks: [15, 17, 19, 21, 23, 25, 27] },
  ] as const)("the $option option sets the count and the first mark, each mark still lands a tick later, and the series still starts at hit + 2", ({ option, marks }) => {
    const drill = startDrill({ selection: { ...EXPLOSIONS, explosions: option } });
    drill.tickTo(30);
    expect([
      drill.events("explosion-series-started").map((e) => e.at),
      drill.events("explosion-marked").map((e) => e.at),
      drill.events("explosion-resolved").map((e) => e.at),
    ]).toEqual([[14], marks, marks.map((at) => at + 1)]);
    drill.dispose();
  });
});
