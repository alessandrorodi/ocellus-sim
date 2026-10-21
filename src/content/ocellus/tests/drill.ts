import { Projectile, Settings, TrainerInstance } from "osrs-sdk";
import type { Mob, Player, Unit } from "osrs-sdk";
import { OcellusRegion } from "../js/OcellusRegion";
import type { DrillSelection } from "../js/OcellusTimings";
import { OCELLUS_P4, resolveDrill } from "../js/OcellusTimings";
import type { FightEvent, TickRow } from "../js/P4Types";
import { seed } from "../js/P4Types";

export type DrillOptions = Readonly<{ seed?: number; selection?: DrillSelection; keepGetReady?: boolean }>;
export type At = Readonly<{ x: number; y: number }>;

export const SPAWN_ON_FLOOD: At = OCELLUS_P4.geometry.playerSpawn.value;
export const UNDER_BOSS: At = { x: 10, y: 5 };
export const RING_SOUTH: At = { x: 10, y: 7 };
export const FLOOD_SOUTH_OF_RING: At = { x: 10, y: 8 };

const inNearSquare = ({ x, y }: At) => x >= 8 && x <= 12 && y >= 3 && y <= 7;

function besideOnSameFloor(home: At, insideSquare: boolean): At {
  const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: home.x + dx, y: home.y + dy }));
  return sides.find((side) => inNearSquare(side) === insideSquare) ?? home;
}

export function startDrill(options: DrillOptions = {}) {
  Settings.readFromStorage();
  const region = new OcellusRegion(resolveDrill({ seed: seed(options.seed ?? 1), selection: options.selection }));
  const trainer = new TrainerInstance(region, { force2d: true });
  trainer.mount(document.createElement("canvas"), document.createElement("div"));
  // The SDK counts GET READY down only in its browser loop, never in tickWorld.
  if (!options.keepGetReady) region.world.getReadyTimer = 0;

  const rows = (): readonly TickRow[] => region.fightLog().rows;
  const player = (): Player => region.players[0];
  const boss = (): Mob => {
    if (!region.primaryBoss) throw new Error("the region has no boss");
    return region.primaryBoss;
  };
  const walkTo = (to: At) => player().moveTo(to.x, to.y);
  const stepOffMarkedTile = (home: At, side: At) => {
    const at = player().location;
    if (at.x === home.x && at.y === home.y) walkTo(side);
    else if (at.x === side.x && at.y === side.y) walkTo(home);
  };
  const ended = () => region.snapshot()?.run.kind === "ended";
  const lastTick = () => {
    const all = rows();
    return all.length === 0 ? -1 : all[all.length - 1].tick;
  };
  const advance = (t: number, onRow: (row: TickRow) => void) => {
    for (let guard = 0; !ended() && lastTick() < t; guard++) {
      if (guard > t + 20) throw new Error(`the boss never reached P4 tick ${t}`);
      const before = lastTick();
      region.world.tickWorld();
      const all = rows();
      if (lastTick() !== before) onRow(all[all.length - 1]);
    }
  };

  return {
    region,
    player,
    boss,
    rows,
    tickTo(t: number) {
      advance(t, () => undefined);
    },
    playCorrectlyTo(t: number) {
      const focus = region.fightLog().header.choices.focus.option.value;
      const dodging = focus.kind === "full-fight" || focus.mechanics.includes("explosions");
      let home: At = { ...player().location };
      const goHome = (to: At) => {
        home = to;
        walkTo(to);
      };
      advance(t, (row) => {
        for (const event of row.events) {
          if (event.kind === "orb-spawned") goHome(event.tile);
          if (event.kind !== "stage-entered") continue;
          if (event.stage === "outer-void") goHome(RING_SOUTH);
          if (event.stage === "after-outer") goHome(SPAWN_ON_FLOOD);
        }
        const stage = row.phase.stage;
        if (dodging && (stage === "inner-void" || stage === "outer-void")) stepOffMarkedTile(home, besideOnSameFloor(home, stage === "outer-void"));
      });
    },
    row(t: number): TickRow {
      const found = rows().find((row) => row.tick === t);
      if (!found) throw new Error(`no row for P4 tick ${t}`);
      return found;
    },
    events<K extends FightEvent["kind"]>(kind: K) {
      return rows()
        .flatMap((row) => row.events)
        .filter((event): event is Extract<FightEvent, { kind: K }> => event.kind === kind);
    },
    walkTo,
    pray(name: "Protect from Magic" | "Protect from Range" | "Protect from Melee" | "Piety") {
      player().prayerController.findPrayerByName(name).toggle(player());
    },
    hit(from: Unit, to: Unit, damage: number) {
      to.addProjectile(new Projectile(null, damage, from, to, "typeless", { setDelay: 1 }));
    },
    restart() {
      region.reset(false);
      region.world.getReadyTimer = 0;
    },
    dispose() {
      trainer.dispose();
    },
  };
}
