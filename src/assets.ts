import type { CacheAssets } from "osrs-sdk/asset-manifest";
import { OCELLUS_P4 } from "./content/ocellus/js/OcellusTimings";

const { boss, gear, presentation, lifeforceOrb } = OCELLUS_P4;

export const ARCHIVE_OCELLUS_ASSETS = {
  npcs: {
    ocellus: {
      id: boss.npcId.value,
      animations: Object.fromEntries(Object.entries(presentation.bossPoses).map(([pose, sequence]) => [pose, sequence.value])),
    },
  },
  items: Object.fromEntries(Object.entries(gear.items).map(([key, item]) => [key, { id: item.itemId.value }])),
  spotAnims: Object.fromEntries(Object.entries(lifeforceOrb.look).map(([visual, spotAnim]) => [visual, { id: spotAnim.value }])),
} as const satisfies CacheAssets;
