import { CardinalDirection, Region } from "osrs-sdk";
import type { Item, Player } from "osrs-sdk";
import type { DrillConfig } from "./OcellusTimings";
import { OCELLUS_P4 } from "./OcellusTimings";
import { dress } from "./OcellusLoadout";
import { OcellusPlayer } from "./OcellusPlayer";
import type { FightLog, FightSnapshot, TickRow } from "./P4Types";
import { VoidField } from "./entities/P4Views";
import { Ocellus } from "./mobs/Ocellus";
import { voidUnder } from "./p4/floor";
import { CombatStream } from "./p4/roll";

function itemId(item: Item | null | undefined): number | null {
  const id = item?.cacheItemId;
  return typeof id === "number" ? id : null;
}

type Mounted =
  | Readonly<{ kind: "unmounted" }>
  | Readonly<{ kind: "mounted"; ocellus: Ocellus; player: OcellusPlayer; field: VoidField; rows: TickRow[] }>;

export class OcellusRegion extends Region {
  private mounted: Mounted = { kind: "unmounted" };

  constructor(private readonly config: DrillConfig) {
    super();
  }

  override getName(): string {
    return "Ocellus";
  }

  override get width(): number {
    return OCELLUS_P4.geometry.placeholderArena.value.width;
  }

  override get height(): number {
    return OCELLUS_P4.geometry.placeholderArena.value.height;
  }

  override get initialFacing(): CardinalDirection {
    return CardinalDirection.NORTH;
  }

  override drawWorldBackground(context: OffscreenCanvasRenderingContext2D, scale: number): void {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        context.fillStyle = (x + y) % 2 === 0 ? "#4a4339" : "#3f392f";
        context.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  initialiseRegion(): { player: Player } {
    const player: OcellusPlayer = new OcellusPlayer(this, { ...OCELLUS_P4.geometry.playerSpawn.value }, new CombatStream(this.config.seed), (input) => ocellus.recordInput(input));
    const ocellus: Ocellus = new Ocellus(this, this.config, player);
    dress(player, this.config.choices.setup);
    const field = new VoidField(this);
    this.addEntity(field);
    this.addPlayer(player);
    this.addMob(ocellus);
    this.setBoss(ocellus);
    this.mounted = { kind: "mounted", ocellus, player, field, rows: [] };
    return { player };
  }

  /** Unit constructors and Region.reset's setStats pass write SDK default stats, so P4 entry is applied after both. */
  override reset(startWorld = true): { player: Player } {
    const result = super.reset(false);
    if (this.mounted.kind === "mounted") this.mounted.ocellus.enterP4();
    if (startWorld) this.world.startTicking();
    return result;
  }

  override postTick(): void {
    if (this.mounted.kind === "unmounted") return;
    const row = this.mounted.ocellus.completeTick();
    if (!row) return;
    this.mounted.rows.push(row);
    this.mounted.field.show(voidUnder(row.phase));
  }

  snapshot(): FightSnapshot | null {
    if (this.mounted.kind === "unmounted") return null;
    const { ocellus, player } = this.mounted;
    const { weapon, offhand, helmet, chest, legs, gloves, cape, necklace, feet, ring, ammo } = player.equipment;
    return {
      run: ocellus.runState(),
      boss: { npcId: OCELLUS_P4.boss.npcId.value, hp: ocellus.currentStats.hitpoint, maxHp: ocellus.stats.hitpoint, visible: ocellus.visible(), defence: ocellus.currentStats.defence },
      player: {
        equipped: {
          weapon: itemId(weapon),
          offhand: itemId(offhand),
          helmet: itemId(helmet),
          chest: itemId(chest),
          legs: itemId(legs),
          gloves: itemId(gloves),
          cape: itemId(cape),
          necklace: itemId(necklace),
          feet: itemId(feet),
          ring: itemId(ring),
          ammo: itemId(ammo),
        },
        inventory: player.inventory.map(itemId),
        specialEnergy: player.currentStats.specialAttack,
      },
    };
  }

  fightLog(): FightLog {
    const rows = this.mounted.kind === "mounted" ? [...this.mounted.rows] : [];
    return { header: { seed: this.config.seed, choices: this.config.choices }, rows };
  }
}
