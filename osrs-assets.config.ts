import { defineConfig } from "osrs-sdk-assets";
import { ARCHIVE_OCELLUS_ASSETS, ARCHIVE_OCELLUS_OVERRIDES } from "./src/assets";
import { FIGHT_ASSETS } from "./src/content/ocellus/fight/assets";

export default defineConfig({
  cache: { openrs2: 2746 },
  assets: {
    npcs: { ...ARCHIVE_OCELLUS_ASSETS.npcs, ...FIGHT_ASSETS.npcs },
    items: ARCHIVE_OCELLUS_ASSETS.items,
    spotAnims: { ...ARCHIVE_OCELLUS_ASSETS.spotAnims, ...FIGHT_ASSETS.spotAnims },
    sounds: { ...ARCHIVE_OCELLUS_ASSETS.sounds, ...FIGHT_ASSETS.sounds },
  },
  overrides: ARCHIVE_OCELLUS_OVERRIDES,
  outDir: "./public/osrs-assets",
});
