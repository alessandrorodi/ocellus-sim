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
  spotAnims: Object.fromEntries([
    ...Object.entries(lifeforceOrb.look).map(([visual, spotAnim]) => [visual, { id: spotAnim.value }]),
    ...Object.entries(presentation.transitionTells).map(([variant, spotAnim]) => [`${variant.replace(/-(.)/g, (_, letter: string) => letter.toUpperCase())}Tell`, { id: spotAnim.value }]),
  ]),
  sounds: Object.fromEntries(Object.entries(presentation.sounds).map(([cue, sound]) => [cue, { id: sound.value }])),
} as const satisfies CacheAssets;

export const ARCHIVE_OCELLUS_OVERRIDES = {
  items: Object.fromEntries(Object.entries(gear.sdkCacheIds).map(([key, id]) => [key, { id: id.value }])),
} as const satisfies CacheAssets;
