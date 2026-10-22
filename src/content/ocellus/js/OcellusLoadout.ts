import {
  AmuletOfRancour,
  AttackStyle,
  AttackStylesController,
  AvernicTreadsMax,
  BastionPotion,
  DizanasQuiver,
  DragonArrows,
  FerociousGloves,
  InfernalCape,
  SaradominBrew,
  SuperCombatPotion,
  SuperRestore,
  UltorRing,
  VenatorRing,
} from "osrs-sdk";
import type { Item, Player, UnitEquipment } from "osrs-sdk";
import type { GearKeys, GearSlot, ResolvedChoices, Setup, SupplyKey } from "./OcellusTimings";
import { GEAR_SLOTS, OCELLUS_P4 } from "./OcellusTimings";
import {
  InquisitorsGreatHelm,
  InquisitorsHauberk,
  InquisitorsPlateskirt,
  OcellusMasoriBodyF,
  OcellusMasoriChapsF,
  OcellusMasoriMaskF,
  OcellusNecklaceOfRupture,
  OcellusScythe,
  OcellusTwistedBow,
  OcellusZaryteVambraces,
  TonalzticsOfRalos,
} from "./gear/OcellusGear";

// The SDK's slot classes share one shape, so a weapon or a chest would type-check as a helmet. Each brand fits one slot only.
declare module "osrs-sdk/lib/src/sdk/gear/Weapon" { interface Weapon { readonly brand?: "weapon" } }
declare module "osrs-sdk/lib/src/sdk/gear/Offhand" { interface Offhand { readonly brand?: "offhand" } }
declare module "osrs-sdk/lib/src/sdk/gear/Helmet" { interface Helmet { readonly brand?: "helmet" } }
declare module "osrs-sdk/lib/src/sdk/gear/Chest" { interface Chest { readonly brand?: "chest" } }
declare module "osrs-sdk/lib/src/sdk/gear/Legs" { interface Legs { readonly brand?: "legs" } }
declare module "osrs-sdk/lib/src/sdk/gear/Gloves" { interface Gloves { readonly brand?: "gloves" } }
declare module "osrs-sdk/lib/src/sdk/gear/Cape" { interface Cape { readonly brand?: "cape" } }
declare module "osrs-sdk/lib/src/sdk/gear/Necklace" { interface Necklace { readonly brand?: "necklace" } }
declare module "osrs-sdk/lib/src/sdk/gear/Feet" { interface Feet { readonly brand?: "feet" } }
declare module "osrs-sdk/lib/src/sdk/gear/Ring" { interface Ring { readonly brand?: "ring" } }
declare module "osrs-sdk/lib/src/sdk/gear/Ammo" { interface Ammo { readonly brand?: "ammo" } }

type SlotItem<S extends GearSlot> = NonNullable<UnitEquipment[S]>;

const ITEMS: { readonly [S in GearSlot]: { readonly [K in GearKeys[S]]: () => SlotItem<S> } } = {
  weapon: { twistedBow: () => new OcellusTwistedBow(), scytheOfVitur: () => new OcellusScythe(), tonalzticsOfRalos: () => new TonalzticsOfRalos() },
  helmet: { masoriMaskF: () => new OcellusMasoriMaskF(), inquisitorsGreatHelm: () => new InquisitorsGreatHelm() },
  chest: { masoriBodyF: () => new OcellusMasoriBodyF(), inquisitorsHauberk: () => new InquisitorsHauberk() },
  legs: { masoriChapsF: () => new OcellusMasoriChapsF(), inquisitorsPlateskirt: () => new InquisitorsPlateskirt() },
  gloves: { zaryteVambraces: () => new OcellusZaryteVambraces(), ferociousGloves: () => new FerociousGloves() },
  cape: { dizanasQuiver: () => new DizanasQuiver(), infernalCape: () => new InfernalCape() },
  necklace: { necklaceOfRupture: () => new OcellusNecklaceOfRupture(), amuletOfRancour: () => new AmuletOfRancour() },
  feet: { avernicTreadsMax: () => new AvernicTreadsMax() },
  ring: { venatorRing: () => new VenatorRing(), ultorRing: () => new UltorRing() },
  ammo: { dragonArrows: () => new DragonArrows() },
};

const SUPPLIES: { readonly [K in SupplyKey]: () => Item } = {
  superCombatPotion: () => new SuperCombatPotion(),
  bastionPotion: () => new BastionPotion(),
  saradominBrew: () => new SaradominBrew(),
  superRestore: () => new SuperRestore(),
};

function create<S extends GearSlot>(slot: S, key: GearKeys[S]): SlotItem<S> {
  return ITEMS[slot][key]();
}

function wear<S extends GearSlot>(equipment: UnitEquipment, slot: S, setup: Setup): void {
  equipment[slot] = create(slot, setup[slot]);
}

const STANCES: Readonly<Record<typeof OCELLUS_P4.gear.scytheStance.value, AttackStyle>> = { jab: AttackStyle.AGGRESSIVECRUSH };

export function dress(player: Player, setup: ResolvedChoices["setup"]): void {
  const worn = setup.option.value;
  for (const slot of GEAR_SLOTS) wear(player.equipment, slot, worn);

  const others = Object.values(OCELLUS_P4.choices.setup.options).filter((option) => option !== setup.option);
  const switches: Item[] = [create("weapon", OCELLUS_P4.gear.specialWeapon.value)];
  for (const other of others) {
    for (const slot of GEAR_SLOTS) {
      if (other.value[slot] !== worn[slot]) switches.push(create(slot, other.value[slot]));
    }
  }
  const supplies = OCELLUS_P4.gear.supplies.value.map((key) => SUPPLIES[key]());
  [...switches, ...supplies].forEach((item, index) => (player.inventory[index] = item));
  player.equipmentChanged();
  AttackStylesController.controller.setWeaponAttackStyle(new OcellusScythe(), STANCES[OCELLUS_P4.gear.scytheStance.value]);
}
