import {
  AttackStyle,
  AttackStyleTypes,
  Chest,
  Helmet,
  ImageLoader,
  ItemName,
  Legs,
  MasoriBodyF,
  MasoriChapsF,
  MasoriMaskF,
  mergeProjectileOptions,
  NecklaceOfRupture,
  Projectile,
  RangedWeapon,
  ScytheOfVitur,
  TwistedBow,
  Unit,
  ZaryteVambraces,
} from "osrs-sdk";
import type { AttackBonuses, ProjectileOptions, UnitBonuses, UnitEquipment, Weapon } from "osrs-sdk";
import type { StanceSpeeds, TrainerItemKey } from "../OcellusTimings";
import { OCELLUS_P4 } from "../OcellusTimings";
import { itemIconFile } from "../../../../assets";

const { gear } = OCELLUS_P4;

// Menus and the combat tab read names only from the SDK's closed ItemName enum, so the trainer's items join it.
declare module "osrs-sdk/lib/src/sdk/ItemName" {
  enum ItemName {
    INQUISITORS_GREAT_HELM = "Inquisitor's great helm",
    INQUISITORS_HAUBERK = "Inquisitor's hauberk",
    INQUISITORS_PLATESKIRT = "Inquisitor's plateskirt",
    TONALZTICS_OF_RALOS = "Tonalztics of Ralos",
  }
}

Object.assign(ItemName, {
  INQUISITORS_GREAT_HELM: "Inquisitor's great helm",
  INQUISITORS_HAUBERK: "Inquisitor's hauberk",
  INQUISITORS_PLATESKIRT: "Inquisitor's plateskirt",
  TONALZTICS_OF_RALOS: "Tonalztics of Ralos",
} as const satisfies { readonly [K in keyof typeof ItemName]?: `${(typeof ItemName)[K]}` });

function bonuses(key: TrainerItemKey): UnitBonuses {
  const { attack, defence, other } = gear.items[key].stats.value;
  return { attack: { ...attack }, defence: { ...defence }, other: { ...other }, targetSpecific: { undead: 0, slayer: 0 } };
}

function inventoryIcon(itemId: number): HTMLImageElement {
  return ImageLoader.createImage(`osrs-assets/${itemIconFile(itemId)}`);
}

export class InquisitorsGreatHelm extends Helmet {
  override inventorySprite = inventoryIcon(this.cacheItemId);
  override get itemName(): ItemName {
    return ItemName.INQUISITORS_GREAT_HELM;
  }
  override get cacheItemId(): number {
    return gear.items.inquisitorsGreatHelm.itemId.value;
  }
  override setStats(): void {
    this.bonuses = bonuses("inquisitorsGreatHelm");
  }
}

export class InquisitorsHauberk extends Chest {
  override inventorySprite = inventoryIcon(this.cacheItemId);
  override get itemName(): ItemName {
    return ItemName.INQUISITORS_HAUBERK;
  }
  override get cacheItemId(): number {
    return gear.items.inquisitorsHauberk.itemId.value;
  }
  override setStats(): void {
    this.bonuses = bonuses("inquisitorsHauberk");
  }
}

export class InquisitorsPlateskirt extends Legs {
  override inventorySprite = inventoryIcon(this.cacheItemId);
  override get itemName(): ItemName {
    return ItemName.INQUISITORS_PLATESKIRT;
  }
  override get cacheItemId(): number {
    return gear.items.inquisitorsPlateskirt.itemId.value;
  }
  override setStats(): void {
    this.bonuses = bonuses("inquisitorsPlateskirt");
  }
}

export class OcellusNecklaceOfRupture extends NecklaceOfRupture {
  override get cacheItemId(): number {
    return gear.sdkCacheIds.necklaceOfRupture.value;
  }
}

export class OcellusMasoriMaskF extends MasoriMaskF {
  override inventorySprite = inventoryIcon(this.cacheItemId);
}

export class OcellusMasoriBodyF extends MasoriBodyF {
  override inventorySprite = inventoryIcon(this.cacheItemId);
}

export class OcellusMasoriChapsF extends MasoriChapsF {
  override inventorySprite = inventoryIcon(this.cacheItemId);
}

export class OcellusZaryteVambraces extends ZaryteVambraces {
  override inventorySprite = inventoryIcon(this.cacheItemId);
}

function stanceSpeed<T extends number>(weapon: Weapon, { rapidSpeed, otherSpeed }: StanceSpeeds<T>): T {
  return weapon.attackStyle() === AttackStyle.RAPID ? rapidSpeed : otherSpeed;
}

function rangedBonuses(weapon: Weapon, bonuses: AttackBonuses): AttackBonuses {
  return { ...bonuses, isAccurate: weapon.attackStyle() === AttackStyle.ACCURATE };
}

export class OcellusTwistedBow extends TwistedBow {
  override get attackSpeed(): TwistedBow["attackSpeed"] {
    return stanceSpeed(this, gear.twistedBow.value);
  }

  override attack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    return super.attack(from, to, rangedBonuses(this, bonuses), options);
  }
}

function inquisitorFactor(equipment: UnitEquipment): number {
  const perMille = gear.inquisitorCrushPerMille.value;
  const worn =
    (equipment.helmet instanceof InquisitorsGreatHelm ? perMille.inquisitorsGreatHelm : 0) +
    (equipment.chest instanceof InquisitorsHauberk ? perMille.inquisitorsHauberk : 0) +
    (equipment.legs instanceof InquisitorsPlateskirt ? perMille.inquisitorsPlateskirt : 0);
  return 1 + worn / 1000;
}

const WEAPON_SKIPS_HIT = -1;

/** The SDK scythe sends both extra hits to its target when no other mob stands in the arc, so hits past the target's size are skipped before they roll. */
export class OcellusScythe extends ScytheOfVitur {
  private readonly hitsThisSwing = new Map<Unit, number>();

  /** The SDK rolls every melee attack as slash; Jab rolls crush, and only crush earns Inquisitor's bonus. */
  override attack(from: Unit, to: Unit, bonuses: AttackBonuses): boolean {
    this.hitsThisSwing.clear();
    if (this.attackStyle() !== AttackStyle.AGGRESSIVECRUSH) return super.attack(from, to, bonuses);
    const gearMeleeMultiplier = (bonuses.gearMeleeMultiplier ?? 1) * inquisitorFactor(from.equipment);
    return super.attack(from, to, { ...bonuses, attackStyle: "crush", gearMeleeMultiplier });
  }

  override rollDamage(from: Unit, to: Unit, bonuses: AttackBonuses): void {
    const hits = this.hitsThisSwing.get(to) ?? 0;
    if (hits >= Math.min(to.size, gear.scytheMaxHitsOnOneTarget.value)) {
      this.damage = WEAPON_SKIPS_HIT;
      return;
    }
    this.hitsThisSwing.set(to, hits + 1);
    super.rollDamage(from, to, bonuses);
  }
}

function drained(defence: number, target: Unit): number {
  return Math.max(0, defence - Math.floor(target.currentStats.magic * gear.division.value.defenceDrainOfMagic));
}

function rollingAgainst<T>(target: Unit, defence: number, roll: () => T): T {
  const landed = target.currentStats.defence;
  target.currentStats.defence = defence;
  try {
    return roll();
  } finally {
    target.currentStats.defence = landed;
  }
}

class DivisionGlaive extends Projectile {
  override beforeHit(): void {
    super.beforeHit();
    if (this.damage > 0 && this.to instanceof Unit) this.to.currentStats.defence = drained(this.to.currentStats.defence, this.to);
  }
}

export class TonalzticsOfRalos extends RangedWeapon {
  override inventorySprite = inventoryIcon(this.cacheItemId);
  override get itemName(): ItemName {
    return ItemName.TONALZTICS_OF_RALOS;
  }

  override get cacheItemId(): number {
    return gear.items.tonalzticsOfRalos.itemId.value;
  }

  override setStats(): void {
    this.bonuses = bonuses("tonalzticsOfRalos");
  }

  override attackStyles(): AttackStyle[] {
    return [AttackStyle.ACCURATE, AttackStyle.RAPID, AttackStyle.LONGRANGE];
  }

  override attackStyleCategory(): AttackStyleTypes {
    return AttackStyleTypes.THROWN;
  }

  override defaultStyle(): AttackStyle {
    return AttackStyle.RAPID;
  }

  override get attackSpeed(): number {
    return stanceSpeed(this, gear.ralos.value);
  }

  override get attackRange(): number {
    const { range, longrangeRange } = gear.ralos.value;
    return this.attackStyle() === AttackStyle.LONGRANGE ? longrangeRange : range;
  }

  override attack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    return this.throwBoth(from, to, bonuses, options);
  }

  override _maxHit(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    return Math.floor(super._maxHit(from, to, bonuses) * gear.ralos.value.hitMaxFraction);
  }

  override _accuracyMultiplier(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    return bonuses.isSpecialAttack ? gear.division.value.accuracyFactor : 1;
  }

  override hasSpecialAttack(): boolean {
    return true;
  }

  override specialAttackDrain(): number {
    return gear.division.value.energy;
  }

  override specialAttack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    return this.throwBoth(from, to, { ...bonuses, isSpecialAttack: true }, options);
  }

  override registerProjectile(from: Unit, to: Unit, bonuses: AttackBonuses, options: ProjectileOptions = {}): void {
    if (!bonuses.isSpecialAttack) return super.registerProjectile(from, to, bonuses, options);
    const own = { sound: this.attackSound ?? undefined, hitSound: this.attackLandingSound ?? undefined, visuals: { model: this.projectileModel ?? undefined } };
    to.addProjectile(new DivisionGlaive(this, this.damage, from, to, "range", mergeProjectileOptions(own, this.projectileOptions, options)));
  }

  /** The SDK rolls both glaives as they are thrown, so the second rolls against the Defence the first glaive's drain will leave once it lands. */
  private throwBoth(from: Unit, to: Unit, bonuses: AttackBonuses, options: ProjectileOptions): boolean {
    let defence = to.currentStats.defence;
    let thrown = false;
    for (let hit = 0; hit < gear.ralos.value.hits; hit++) {
      if (!rollingAgainst(to, defence, () => super.attack(from, to, rangedBonuses(this, bonuses), options))) return thrown;
      thrown = true;
      if (bonuses.isSpecialAttack && this.damage > 0) defence = drained(defence, to);
    }
    return thrown;
  }
}
