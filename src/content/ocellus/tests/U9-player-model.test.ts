import type { Model } from "osrs-sdk";
import { CacheRenderModel, Settings, TrainerInstance } from "osrs-sdk";
import { SPOT } from "../fight/data";
import { FightRegion } from "../fight/FightRegion";
import { PLAYER_SPOTS } from "../fight/units";

/** The spotanims a model was built to load (its options are private in the SDK, hence the bracket access). */
function spotsOf(model: Model): readonly number[] | undefined {
  if (!(model instanceof CacheRenderModel)) throw new Error("not a cache model");
  return model["options"].spotAnims;
}

describe("U9 player model", () => {
  test("builds meshes for the player's spotanims only, and adds one the first time it is attached", () => {
    Settings.readFromStorage();
    const options = { seed: 1, party: 1, startPhase: 1, hazardTiles: true, videoMarkers: false, skipMarkers: false, patternMarkers: false, soloVine: true, invincible: true } as const;
    const region = new FightRegion(options, () => {});
    const trainer = new TrainerInstance(region, { force2d: true });
    trainer.mount(document.createElement("canvas"), document.createElement("div"));
    if (!region.fight) throw new Error("the region built no fight");
    const player = region.fight.player;

    expect(spotsOf(player.create3dModel())).toEqual(PLAYER_SPOTS);
    player.addSpotAnim({ id: SPOT.p1Charge, channel: "test" });
    expect(spotsOf(player.create3dModel())).toEqual([...PLAYER_SPOTS, SPOT.p1Charge]);
    trainer.dispose();
  });
});
