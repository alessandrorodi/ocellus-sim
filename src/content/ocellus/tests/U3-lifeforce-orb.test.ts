import type { DrillSelection } from "../js/OcellusTimings";
import type { At } from "./drill";
import { RING_SOUTH, startDrill } from "./drill";

const ORB_DRILL = { focus: "lifeforce-orb" } as const;
const INNER_ORB: At = { x: 7, y: 9 };
const BESIDE_INNER_ORB: At = { x: 8, y: 9 };
const OUTER_ORB_FROM_SPAWN: At = { x: 11, y: 7 };
const FLOOD_FAR_SOUTH: At = { x: 10, y: 14 };
const OUTER_ORB_ON_FLOOD: At = { x: 11, y: 11 };

function returnsAfterWalkingAt(orderedAfter: number, selection: DrillSelection = {}) {
  const drill = startDrill({ selection: { ...ORB_DRILL, ...selection } });
  drill.tickTo(orderedAfter);
  drill.walkTo(INNER_ORB);
  drill.tickTo(31);
  const observed = [drill.events("orb-returned").map((e) => e.at), drill.events("orb-expired").map((e) => e.at)];
  drill.dispose();
  return observed;
}

describe("U3 lifeforce hit and orb", () => {
  test("the lifeforce hit takes floor(current HP / 2) through any protection prayer", () => {
    const drill = startDrill({ selection: ORB_DRILL });
    drill.tickTo(10);
    drill.pray("Protect from Magic");
    drill.tickTo(40);
    drill.pray("Protect from Melee");
    drill.tickTo(43);
    expect(drill.events("lifeforce-told").map((e) => [e.at, e.void])).toEqual([[11, "inner-void"], [42, "outer-void"]]);
    expect(drill.events("lifeforce-drained").map((e) => [e.at, e.receipt])).toEqual([
      [12, { requested: 49, applied: 49, beforeHp: 99, afterHp: 50, prayer: "magic" }],
      [43, { requested: 25, applied: 25, beforeHp: 50, afterHp: 25, prayer: "melee" }],
    ]);
    drill.dispose();
  });

  test("the inner orb spawns on (7, 9) at 13 and returns the stolen HP once, the tick after the player stands on it ready", () => {
    const drill = startDrill({ selection: ORB_DRILL });
    drill.tickTo(13);
    expect(drill.events("orb-spawned").map((e) => [e.at, e.void, e.tile, e.credit])).toEqual([[13, "inner-void", { x: 7, y: 9 }, 49]]);
    drill.walkTo(INNER_ORB);
    drill.tickTo(29);
    expect(drill.row(16).playerAtBossStep.tile).toEqual({ x: 7, y: 9 });
    expect(drill.events("orb-matured").map((e) => [e.at, e.tile])).toEqual([[24, { x: 7, y: 9 }]]);
    expect(drill.events("orb-returned").map((e) => [e.at, e.tile, e.receipt])).toEqual([[25, { x: 7, y: 9 }, { requested: 49, applied: 49, beforeHp: 50, afterHp: 99 }]]);
    expect(drill.row(25).playerAtPostTick.hp).toBe(99);
    drill.dispose();
  });

  test("the inner orb's last pickup lands at hit + 18 (30); arriving at the end of 30 is too late", () => {
    expect([returnsAfterWalkingAt(27), returnsAfterWalkingAt(28)]).toEqual([
      [[30], []],
      [[], [30]],
    ]);
  });

  test("the adjacent pickup option returns the orb to a player beside it; the default needs its tile", () => {
    const standBeside = (selection: DrillSelection) => {
      const drill = startDrill({ selection: { ...ORB_DRILL, ...selection } });
      drill.tickTo(13);
      drill.walkTo(BESIDE_INNER_ORB);
      drill.tickTo(31);
      const observed = [drill.events("orb-returned").map((e) => [e.at, e.receipt.afterHp]), drill.events("orb-expired").map((e) => e.at)];
      drill.dispose();
      return observed;
    };
    expect([standBeside({ orbPickupRadius: "adjacent" }), standBeside({})]).toEqual([
      [[[25, 99]], []],
      [[], [30]],
    ]);
  });

  test("an unclaimed outer orb heals the boss by its credit at hit + 19 (62); an unclaimed inner orb or a collected outer orb does not", () => {
    const run = (selection: DrillSelection, collectOuterOrb = false) => {
      const drill = startDrill({ selection: { ...ORB_DRILL, ...selection } });
      drill.tickTo(44);
      if (collectOuterOrb) drill.walkTo(OUTER_ORB_FROM_SPAWN);
      drill.tickTo(63);
      const observed = [
        drill.events("orb-expired").map((e) => [e.at, e.void, e.tile, e.credit]),
        drill.events("boss-healed").map((e) => [e.at, e.cause, e.receipt]),
        drill.row(62).bossHp,
      ];
      drill.dispose();
      return observed;
    };
    const expired = [[30, "inner-void", { x: 7, y: 9 }, 49], [61, "outer-void", { x: 11, y: 7 }, 25]];
    expect([run({}), run({ unclaimedOuterOrb: "off" }), run({}, true)]).toEqual([
      [expired, [[62, { kind: "unclaimed-orb" }, { requested: 25, applied: 25, beforeHp: 1355, afterHp: 1380 }]], { atBossStep: 1355, atPostTick: 1380 }],
      [expired, [], { atBossStep: 1355, atPostTick: 1355 }],
      [[expired[0]], [], { atBossStep: 1355, atPostTick: 1355 }],
    ]);
  });

  test("a return can pass max HP: HP regenerates at 199 between the fourth inner hit and its return", () => {
    const drill = startDrill({ selection: ORB_DRILL });
    drill.playCorrectlyTo(206);
    expect(drill.events("orb-returned").map((e) => [e.at, e.receipt.requested, e.receipt.beforeHp, e.receipt.afterHp])).toEqual([
      [25, 49, 50, 99], [50, 49, 50, 99], [85, 49, 50, 99], [110, 49, 50, 99], [145, 49, 50, 99], [170, 49, 50, 99], [205, 49, 51, 100],
    ]);
    expect(drill.row(205).playerAtPostTick.hp).toBe(100);
    drill.dispose();
  });

  test("under safe-floor a player 7 tiles from the 5x5 gets the outer orb on its nearest edge, not on the flood", () => {
    const drill = startDrill({ selection: { focus: "orb-retrieval", outerOrbTile: "safe-floor" } });
    drill.tickTo(30);
    drill.walkTo(FLOOD_FAR_SOUTH);
    drill.tickTo(44);
    expect(drill.row(44).playerAtBossStep.tile).toEqual({ x: 10, y: 14 });
    expect(drill.events("orb-spawned").filter((e) => e.void === "outer-void").map((e) => [e.at, e.tile, e.credit])).toEqual([[44, { x: 12, y: 7 }, 25]]);
    drill.dispose();
  });

  test("under any-floor the outer orb lands on the flood; a return due on the tick the floor kills the player is skipped", () => {
    const retrieve = (collectInnerOrb: boolean) => {
      const drill = startDrill({ selection: { focus: "orb-retrieval", outerOrbTile: "any-floor" } });
      drill.tickTo(13);
      if (collectInnerOrb) drill.walkTo(INNER_ORB);
      drill.tickTo(30);
      drill.walkTo(RING_SOUTH);
      drill.tickTo(46);
      drill.walkTo(OUTER_ORB_ON_FLOOD);
      drill.tickTo(50);
      const observed = {
        outerOrb: drill.events("orb-spawned").filter((e) => e.void === "outer-void").map((e) => [e.at, e.tile, e.credit]),
        floorHits: drill.events("floor-hit").map((e) => [e.at, e.receipt.applied, e.receipt.afterHp]),
        returned: drill.events("orb-returned").filter((e) => e.void === "outer-void").map((e) => [e.at, e.receipt.beforeHp, e.receipt.afterHp]),
        ended: drill.events("run-ended").map((e) => [e.at, e.reason]),
        hpAt50: drill.row(50).playerAtPostTick.hp,
      };
      drill.dispose();
      return observed;
    };
    expect(retrieve(false)).toEqual({
      outerOrb: [[44, { x: 11, y: 11 }, 25]],
      floorHits: [[48, 10, 15], [49, 9, 6], [50, 6, 0]],
      returned: [],
      ended: [[50, "death"]],
      hpAt50: 0,
    });
    expect(retrieve(true)).toEqual({
      outerOrb: [[44, { x: 11, y: 11 }, 49]],
      floorHits: [[48, 10, 40], [49, 9, 31], [50, 9, 22]],
      returned: [[50, 22, 71]],
      ended: [],
      hpAt50: 71,
    });
  });
});
