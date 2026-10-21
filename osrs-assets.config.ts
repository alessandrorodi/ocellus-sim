import { defineConfig } from "osrs-sdk-assets";
import { ARCHIVE_OCELLUS_ASSETS } from "./src/assets";

export default defineConfig({
  cache: { openrs2: 2746 },
  assets: ARCHIVE_OCELLUS_ASSETS,
  outDir: "./public/osrs-assets",
});
