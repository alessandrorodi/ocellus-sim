import type { CacheAssets } from "osrs-sdk/asset-manifest";
import { OCELLUS_P4 } from "./content/ocellus/js/OcellusTimings";

const { boss, presentation } = OCELLUS_P4;

export const ARCHIVE_OCELLUS_ASSETS = {
  npcs: {
    ocellus: {
      id: boss.npcId.value,
      animations: Object.fromEntries(Object.entries(presentation.bossPoses).map(([pose, sequence]) => [pose, sequence.value])),
    },
  },
} as const satisfies CacheAssets;
