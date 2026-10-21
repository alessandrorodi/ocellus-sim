import { CACHE_ASSETS } from "osrs-sdk";
import type { Loadout } from "osrs-sdk";

// The SDK draws the player only from equipped item models.
export const ocellusLoadout: Loadout = {
  name: "Placeholder melee",
  equipment: {
    weapon: CACHE_ASSETS.items.scytheOfVitur.id,
    offhand: null,
    helmet: CACHE_ASSETS.items.torvaFullHelm.id,
    necklace: CACHE_ASSETS.items.amuletOfTorture.id,
    cape: CACHE_ASSETS.items.infernalCape.id,
    ammo: null,
    chest: CACHE_ASSETS.items.torvaPlatebody.id,
    legs: CACHE_ASSETS.items.torvaPlatelegs.id,
    feet: CACHE_ASSETS.items.primordialBoots.id,
    gloves: CACHE_ASSETS.items.ferociousGloves.id,
    ring: CACHE_ASSETS.items.ultorRing.id,
  },
  inventory: Array(28).fill(null),
};
