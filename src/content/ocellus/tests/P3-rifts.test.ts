import { Settings, TrainerInstance, Viewport } from "osrs-sdk";
import { P3, RIFT_SEQ } from "../fight/data";
import type { FightOptions } from "../fight/Fight";
import { FightRegion } from "../fight/FightRegion";
import { VoidAdd } from "../fight/units";

/** Phase 3's rifts take shape under their own animations, and a Void Siphon heals its killer. */

describe("phase 3's rifts", () => {
  let restore: (() => void)[] = [];
  afterEach(() => {
    jest.restoreAllMocks();
    restore.forEach((r) => r());
    restore = [];
  });

  /** Run phase 3, dropping his HP so the quadrants fall, until a rift is up. */
  function firstRift(seed: number): { region: FightRegion; rift: VoidAdd } {
    Settings.readFromStorage();
    const options: FightOptions = { seed, party: 1, startPhase: 3, hazardTiles: true, videoMarkers: false, skipMarkers: false, patternMarkers: false, soloVine: true, invincible: true };
    const region = new FightRegion(options, () => {});
    const trainer = new TrainerInstance(region, { force2d: true });
    trainer.mount(document.createElement("canvas"), document.createElement("div"));
    region.world.getReadyTimer = 0;
    Viewport.viewport.resize(800, 600);
    restore.push(() => trainer.dispose());
    for (let i = 0; i < 600; i++) {
      region.world.tickWorld();
      const boss = region.fight?.boss;
      if (i === 20 && boss) boss.currentStats.hitpoint = Math.round(boss.stats.hitpoint * 0.7);
      const rift = region.mobs.find((mob): mob is VoidAdd => mob instanceof VoidAdd && mob.kind !== "vine" && !mob.killed);
      if (rift) return { region, rift };
    }
    throw new Error(`no rift by tick 600 on seed ${seed}`);
  }

  it("stands, walks and despawns on its own sequences", () => {
    const kinds = new Set<string>();
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const { rift } = firstRift(seed);
      if (rift.kind === "vine") throw new Error("a vine");
      kinds.add(rift.kind);
      expect([rift.idlePoseId, rift.walkingPoseId, rift.deathAnimationId]).toEqual([RIFT_SEQ[rift.kind].idle, RIFT_SEQ[rift.kind].idle, RIFT_SEQ[rift.kind].despawn]);
    }
    expect(kinds.size).toBeGreaterThan(1);
  });

  it("a Void Siphon heals its killer 22", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      const { region, rift } = firstRift(seed);
      const fight = region.fight;
      if (rift.kind !== "rift-heal" || !fight) continue;
      const heal = jest.spyOn(fight, "healPlayer");
      rift.currentStats.hitpoint = 0;
      for (let i = 0; i < 3; i++) region.world.tickWorld();
      expect(heal.mock.calls).toContainEqual([P3.siphonHeal]);
      return;
    }
    throw new Error("no seed spawned a Void Siphon first");
  });
});
