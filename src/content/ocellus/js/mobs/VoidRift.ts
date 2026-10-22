import { CacheRenderModel, CacheRenderReferences, Mob } from "osrs-sdk";
import type { Model, Region, UnitBonuses } from "osrs-sdk";
import { OCELLUS_P4 } from "../OcellusTimings";
import type { Tile } from "../P4Types";

const RIFT = OCELLUS_P4.rifts;

export class VoidRift extends Mob {
  private detonated = false;

  constructor(region: Region, at: Tile) {
    super(region, { x: at.x, y: at.y });
    this.playAnimation(RIFT.poses.spawn.value);
  }

  /** Unit's constructor calls setStats before subclass fields exist, so the stats come from module data. */
  override setStats(): void {
    this.stats = { ...RIFT.stats.value };
    this.currentStats = { ...RIFT.stats.value };
  }

  override mobName(): string {
    return RIFT.name.value;
  }

  override get combatLevel(): number {
    return RIFT.combatLevel.value;
  }

  override get size(): number {
    return RIFT.size.value;
  }

  override get bonuses(): UnitBonuses {
    return {
      attack: { stab: 0, slash: 0, crush: 0, magic: 0, range: 0 },
      defence: RIFT.defenceBonuses.value,
      other: { meleeStrength: 0, rangedStrength: 0, magicDamage: 0, prayer: 0 },
    };
  }

  override get idlePoseId(): number {
    return RIFT.poses.idle.value;
  }

  override get walkingPoseId(): number {
    return RIFT.poses.idle.value;
  }

  override get deathAnimationId(): number | null {
    return this.detonated ? null : RIFT.poses.despawn.value;
  }

  override movementStep(): void {}

  override attackIfPossible(): void {}

  override create3dModel(): Model {
    return CacheRenderModel.forRenderable(this, CacheRenderReferences.npc(RIFT.npcId.value));
  }

  /** Unit.dead() starts a death sequence a tick after the death, so the detonation plays here on the burst tick and dead() plays none. */
  detonate(): void {
    this.detonated = true;
    this.dead();
    this.playAnimation(RIFT.poses.detonate.value);
  }
}
