import { Projectile, Settings, TrainerInstance } from "osrs-sdk";
import type { Mob, Player, Unit } from "osrs-sdk";
import { OcellusRegion } from "../js/OcellusRegion";
import type { DrillSelection } from "../js/OcellusTimings";
import { resolveDrill } from "../js/OcellusTimings";
import type { FightEvent, TickRow } from "../js/P4Types";
import { seed } from "../js/P4Types";

export type DrillOptions = Readonly<{ seed?: number; selection?: DrillSelection; keepGetReady?: boolean }>;

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
  const ended = () => region.snapshot()?.run.kind === "ended";
  const lastTick = () => {
    const all = rows();
    return all.length === 0 ? -1 : all[all.length - 1].tick;
  };

  return {
    region,
    player,
    boss,
    rows,
    tickTo(t: number) {
      for (let guard = 0; !ended() && lastTick() < t; guard++) {
        if (guard > t + 20) throw new Error(`the boss never reached P4 tick ${t}`);
        region.world.tickWorld();
      }
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
    walkTo(x: number, y: number) {
      player().moveTo(x, y);
    },
    pray(name: "Protect from Magic" | "Protect from Range" | "Protect from Melee") {
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
