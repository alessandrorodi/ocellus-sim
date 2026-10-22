import { Projectile, Settings, TrainerInstance, Viewport } from "osrs-sdk";
import type { Mob, Player, Unit } from "osrs-sdk";
import { paintedFills } from "../../../../test/paintedTiles";
import { OcellusRegion } from "../js/OcellusRegion";
import type { DrillSelection } from "../js/OcellusTimings";
import { OCELLUS_P4, resolveDrill } from "../js/OcellusTimings";
import type { FightEvent, Style, TickRow } from "../js/P4Types";
import { seed } from "../js/P4Types";

export type DrillOptions = Readonly<{ seed?: number; selection?: DrillSelection; keepGetReady?: boolean }>;
export type At = Readonly<{ x: number; y: number }>;

export const SPAWN_ON_FLOOD: At = OCELLUS_P4.geometry.playerSpawn.value;
export const UNDER_BOSS: At = { x: 5, y: 5 };
export const RING_NORTH: At = { x: 5, y: 3 };
export const FLOOD_NORTH_OF_RING: At = { x: 5, y: 2 };

type ProtectionPrayer = "Protect from Magic" | "Protect from Range" | "Protect from Melee";
const PROTECTS_FROM: Readonly<Record<Style, ProtectionPrayer>> = { magic: "Protect from Magic", ranged: "Protect from Range", melee: "Protect from Melee" };

const inNearSquare = ({ x, y }: At) => x >= 3 && x <= 7 && y >= 3 && y <= 7;
const onPlatform = ({ x, y }: At) => OCELLUS_P4.geometry.platform.value[y]?.[x] === "#";

function besideOnSameFloor(home: At, insideSquare: boolean): At {
  const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: home.x + dx, y: home.y + dy }));
  return sides.find((side) => onPlatform(side) && inNearSquare(side) === insideSquare) ?? home;
}

export function startDrill(options: DrillOptions = {}) {
  Settings.readFromStorage();
  const region = new OcellusRegion(resolveDrill({ seed: seed(options.seed ?? 1), selection: options.selection }));
  const trainer = new TrainerInstance(region, { force2d: true });
  trainer.mount(document.createElement("canvas"), document.createElement("div"));
  // The SDK counts GET READY down only in its browser loop, never in tickWorld.
  if (!options.keepGetReady) region.world.getReadyTimer = 0;
  Viewport.viewport.resize(800, 600);

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
  const pray = (name: ProtectionPrayer | "Piety") => player().prayerController.findPrayerByName(name).toggle(player());
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
          if (event.kind === "special-told" && row.playerAtPostTick.prayer !== event.style) pray(PROTECTS_FROM[event.style]);
          if (event.kind === "orb-spawned") goHome(event.tile);
          if (event.kind !== "stage-entered") continue;
          if (event.stage === "outer-void") goHome(RING_NORTH);
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
    drawnHoles(): readonly At[] {
      const { rim } = OCELLUS_P4.floor.look.value;
      return paintedFills((context) => region.entities.forEach((entity) => entity.draw(0, context)))
        .filter((fill) => fill.style === rim)
        .map((fill) => ({ x: Math.floor(fill.x / Settings.tileSize), y: Math.floor(fill.y / Settings.tileSize) }))
        .sort((a, b) => a.x - b.x || a.y - b.y);
    },
    walkTo,
    pray,
    hit(from: Unit, to: Unit, damage: number, style: "typeless" | "slash" | "range" = "typeless", delay = 1) {
      to.addProjectile(new Projectile(null, damage, from, to, style, { setDelay: delay }));
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
