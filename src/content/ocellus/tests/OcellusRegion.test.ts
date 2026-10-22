import { startDrill } from "./drill";
import type { At } from "./drill";

const NON_LETHAL = { focus: "lifeforce-orb" } as const;

describe("Ocellus arena", () => {
  test("the player spawns two tiles north of the 5x5, the boss's 3x3 stands on x 4-6, y 4-6, and a walk runs two tiles a tick", () => {
    const drill = startDrill({ selection: NON_LETHAL });
    const boss = drill.boss();
    expect([drill.player().location, boss.location, boss.size]).toEqual([{ x: 5, y: 1 }, { x: 4, y: 6 }, 3]);

    drill.walkTo({ x: 9, y: 1 });
    drill.region.world.tickWorld();
    const afterOne = { ...drill.player().location };
    drill.region.world.tickWorld();
    expect([afterOne, drill.player().location]).toEqual([{ x: 7, y: 1 }, { x: 9, y: 1 }]);
    drill.dispose();
  });

  test("the player can stand on exactly the measured platform floor and on no tile around it", () => {
    const drill = startDrill({ selection: NON_LETHAL });
    const standsOn = (to: At) => {
      drill.walkTo(to);
      for (let moved = true; moved; ) {
        const { x, y } = drill.player().location;
        drill.region.world.tickWorld();
        moved = drill.player().location.x !== x || drill.player().location.y !== y;
      }
      return drill.player().location.x === to.x && drill.player().location.y === to.y;
    };
    const rows: string[] = [];
    for (let y = -1; y <= 12; y++) {
      let row = "";
      for (let x = -1; x <= 12; x++) row += standsOn({ x, y }) ? "#" : ".";
      rows.push(row);
    }
    expect(rows).toEqual([
      "..............",
      "....#.........",
      "...##########.",
      "..###########.",
      "..##########..",
      "..#########...",
      "..########....",
      "..#######.....",
      "..#######.....",
      "..##..........",
      "..###.........",
      "..####........",
      "..###.........",
      "..............",
    ]);
    drill.dispose();
  });

  test("a walk past the edge, or onto the tile beside it, stops on the floor tile nearest the order", () => {
    const stopsAt = (to: At) => {
      const drill = startDrill({ selection: NON_LETHAL });
      drill.walkTo(to);
      drill.region.world.tickWorld(6);
      const at = { ...drill.player().location };
      drill.dispose();
      return at;
    };
    expect([stopsAt({ x: 15, y: 1 }), stopsAt({ x: 12, y: 1 }), stopsAt({ x: 5, y: -3 })]).toEqual([
      { x: 11, y: 1 },
      { x: 11, y: 1 },
      { x: 3, y: 0 },
    ]);
  });

  test("a walk between floor tiles goes around the platform's cut-outs instead of across them", () => {
    const drill = startDrill({ selection: NON_LETHAL });
    drill.walkTo({ x: 4, y: 10 });
    drill.region.world.tickWorld(6);
    drill.walkTo({ x: 7, y: 7 });
    const trail: At[] = [];
    for (let tick = 0; tick < 6; tick++) {
      drill.region.world.tickWorld();
      trail.push({ ...drill.player().location });
    }
    expect(trail).toEqual([{ x: 2, y: 9 }, { x: 2, y: 7 }, { x: 4, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 7, y: 7 }]);
    drill.dispose();
  });
});
