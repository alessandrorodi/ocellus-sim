import { Player, Random } from "osrs-sdk";
import type { Location, Region } from "osrs-sdk";
import type { InputObservation, PlayerObservation, Style } from "./P4Types";
import { tile } from "./P4Types";
import type { CombatStream } from "./p4/roll";

export class OcellusPlayer extends Player {
  constructor(region: Region, location: Location, private readonly combat: CombatStream, private readonly report: (input: InputObservation) => void) {
    super(region, location);
  }

  get combatDraws(): number {
    return this.combat.draws;
  }

  get protection(): Style | null {
    if (this.prayerController.matchFeature("melee")) return "melee";
    if (this.prayerController.matchFeature("range")) return "ranged";
    if (this.prayerController.matchFeature("magic")) return "magic";
    return null;
  }

  observe(): PlayerObservation {
    return { tile: tile(this.location.x, this.location.y), hp: this.currentStats.hitpoint, prayer: this.protection };
  }

  override moveTo(x: number, y: number): void {
    super.moveTo(x, y);
    this.report({ kind: "walk-ordered", destination: tile(x, y) });
  }

  override pretick(): void {
    const before = this.protection;
    super.pretick();
    const after = this.protection;
    if (after !== before) this.report({ kind: "prayer-published", prayer: after });
  }

  override attackStep(): void {
    const previous = Random.randomFn;
    Random.setRandom(() => this.combat.next());
    try {
      super.attackStep();
    } finally {
      Random.setRandom(previous);
    }
  }
}
