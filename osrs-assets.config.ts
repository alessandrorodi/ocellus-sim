import { defineConfig } from "osrs-sdk-assets";
import { ARCHIVE_OCELLUS_ASSETS, ARCHIVE_OCELLUS_OVERRIDES } from "./src/assets";
import { FIGHT_ASSETS, FIGHT_MODELS } from "./src/content/ocellus/fight/assets";
import { SEQ } from "./src/content/ocellus/fight/data";

// Every declared animation is baked into the NPC's payload as vertex frames, so keep only the ones some code plays:
// the phase 4 drill needs these six on Ocellus (npc 16677); the full fight adds its own below.
const DRILL_OCELLUS = {
  id: ARCHIVE_OCELLUS_ASSETS.npcs.ocellus.id,
  animations: {
    idle: SEQ.p3Idle,
    walk: SEQ.p3Walk,
    deflectIn: SEQ.p3DeflectIn,
    deflectLoop: SEQ.p3DeflectLoop,
    deflectOut: SEQ.p3DeflectOut,
    meleeHybrid: SEQ.p3MeleeHybrid,
  },
};

export default defineConfig({
  cache: { openrs2: 2746 },
  assets: {
    npcs: { ocellus: DRILL_OCELLUS, ...FIGHT_ASSETS.npcs },
    // The drill's brazier and floor-hole models as well as the fight's; without them ?mode=p4drill fails to load.
    models: { ...ARCHIVE_OCELLUS_ASSETS.models, ...FIGHT_MODELS },
    items: ARCHIVE_OCELLUS_ASSETS.items,
    spotAnims: { ...ARCHIVE_OCELLUS_ASSETS.spotAnims, ...FIGHT_ASSETS.spotAnims },
    sounds: { ...ARCHIVE_OCELLUS_ASSETS.sounds, ...FIGHT_ASSETS.sounds },
  },
  overrides: ARCHIVE_OCELLUS_OVERRIDES,
  outDir: "./public/osrs-assets",
});
