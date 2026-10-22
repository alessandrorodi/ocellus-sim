import type { DrillSelection } from "../js/OcellusTimings";
import type { At } from "./drill";
import { FLOOD_NORTH_OF_RING, RING_NORTH, SPAWN_ON_FLOOD, UNDER_BOSS, startDrill } from "./drill";

const VOID_FLOOR = { focus: "void-floor" } as const;

function innerVoidHits(selection: DrillSelection, leaveAfter: number) {
  const drill = startDrill({ selection: { ...VOID_FLOOR, ...selection } });
  drill.walkTo(RING_NORTH);
  drill.tickTo(leaveAfter);
  drill.walkTo(SPAWN_ON_FLOOD);
  drill.tickTo(38);
  const observed = [drill.row(8).playerAtBossStep.tile, drill.events("floor-hit").map((e) => [e.at, e.receipt.applied])];
  drill.dispose();
  return observed;
}

describe("U2 void floor", () => {
  test("standing on the outer flood takes 9 to 11 a tick from S+36 until it kills the player", () => {
    const drill = startDrill({ selection: VOID_FLOOR });
    drill.tickTo(60);
    const hits = drill.events("floor-hit");
    expect(hits[0]).toEqual({ kind: "floor-hit", at: 44, void: "outer-void", tile: { x: 5, y: 1 }, receipt: { requested: 9, applied: 9, beforeHp: 99, afterHp: 90, prayer: null } });
    expect(hits.map((e) => [e.at, e.receipt.requested, e.receipt.applied, e.receipt.afterHp])).toEqual([
      [44, 9, 9, 90], [45, 11, 11, 79], [46, 10, 10, 69], [47, 11, 11, 58], [48, 10, 10, 48], [49, 9, 9, 39],
      [50, 9, 9, 30], [51, 10, 10, 20], [52, 9, 9, 11], [53, 10, 10, 1], [54, 10, 1, 0],
    ]);
    expect(drill.events("run-ended").map((e) => [e.at, e.reason])).toEqual([[54, "death"]]);
    drill.dispose();
  });

  test("the inner void hits a player on any tile of the 5x5 and the flood a player on any other platform tile", () => {
    const voidByTile = [
      "............",
      "..oooooooooo",
      ".ooooooooooo",
      ".ooiiiiiooo.",
      ".ooiiiiioo..",
      ".ooiiiiio...",
      ".ooiiiii....",
      ".ooiiiii....",
      ".oooooo.....",
      ".ooooo......",
      ".oooo.......",
      ".ooo........",
    ];
    const voidHitting = (at: At) => {
      const drill = startDrill({ selection: VOID_FLOOR });
      drill.walkTo(at);
      drill.tickTo(44);
      const stood = drill.row(10).playerAtBossStep.tile;
      const voids = new Set(drill.events("floor-hit").map((e) => e.void));
      drill.dispose();
      if (stood.x !== at.x || stood.y !== at.y) return "x";
      return voids.size !== 1 ? String(voids.size) : voids.has("inner-void") ? "i" : "o";
    };
    const observed = voidByTile.map((row, y) => [...row].map((cell, x) => (cell === "." ? "." : voidHitting({ x, y }))).join(""));
    expect(observed).toEqual(voidByTile);
  });

  test("the outer void spares the 5x5, under the boss and on its ring, but not the next tile out", () => {
    const hitsOn = (at: At) => {
      const drill = startDrill({ selection: VOID_FLOOR });
      drill.tickTo(30);
      drill.walkTo(at);
      drill.tickTo(58);
      const observed = [drill.row(44).playerAtBossStep.tile, drill.events("floor-hit").map((e) => e.at)];
      drill.dispose();
      return observed;
    };
    expect([hitsOn(UNDER_BOSS), hitsOn(RING_NORTH), hitsOn(FLOOD_NORTH_OF_RING)]).toEqual([
      [{ x: 5, y: 5 }, []],
      [{ x: 5, y: 3 }, []],
      [{ x: 5, y: 2 }, [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54]],
    ]);
  });

  test("the floor reads the tile the player starts the tick on, not the one it ends on", () => {
    const drill = startDrill({ selection: VOID_FLOOR });
    drill.tickTo(30);
    drill.walkTo(FLOOD_NORTH_OF_RING);
    drill.tickTo(43);
    drill.walkTo(RING_NORTH);
    drill.tickTo(50);
    expect(drill.events("floor-hit").map((e) => [e.at, e.tile, e.receipt.applied])).toEqual([[44, { x: 5, y: 2 }, 9]]);
    expect(drill.row(44).playerAtPostTick.tile).toEqual({ x: 5, y: 3 });
    drill.dispose();
  });

  test.each([
    { option: "one-tick-grace (default)", selection: {}, lastSafeExit: 8, firstHit: [10, 11] },
    { option: "outer-rule", selection: { innerVoidFloor: "outer-rule" }, lastSafeExit: 11, firstHit: [13, 10] },
  ] as const)("under $option a player on the 5x5 when it forms must order the step off by tick $lastSafeExit", ({ selection, lastSafeExit, firstHit }) => {
    expect([innerVoidHits(selection, lastSafeExit), innerVoidHits(selection, lastSafeExit + 1)]).toEqual([
      [{ x: 5, y: 3 }, []],
      [{ x: 5, y: 3 }, [firstHit]],
    ]);
  });

  test("the harmless option spares a player that the default rule hits", () => {
    expect([innerVoidHits({}, 10), innerVoidHits({ innerVoidFloor: "harmless" }, 10)]).toEqual([
      [{ x: 5, y: 3 }, [[10, 11], [11, 11]]],
      [{ x: 5, y: 3 }, []],
    ]);
  });

  test("the inner void stops hitting the tick it clears", () => {
    const drill = startDrill({ selection: VOID_FLOOR });
    drill.tickTo(26);
    drill.walkTo(RING_NORTH);
    drill.tickTo(44);
    expect(drill.events("floor-hit").map((e) => [e.at, e.void, e.tile, e.receipt.applied])).toEqual([
      [28, "inner-void", { x: 5, y: 3 }, 9],
      [29, "inner-void", { x: 5, y: 3 }, 11],
    ]);
    expect(drill.row(30).playerAtBossStep.tile).toEqual({ x: 5, y: 3 });
    drill.dispose();
  });
});
