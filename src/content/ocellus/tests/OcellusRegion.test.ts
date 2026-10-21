import { Settings, TrainerInstance } from "osrs-sdk";
import { OcellusRegion } from "../js/OcellusRegion";
import { resolveDrill } from "../js/OcellusTimings";
import { seed } from "../js/P4Types";

describe("Ocellus arena", () => {
  let trainer: TrainerInstance;

  beforeEach(() => {
    Settings.readFromStorage();
    trainer = new TrainerInstance(new OcellusRegion(resolveDrill({ seed: seed(1) })), { force2d: true });
    trainer.mount(document.createElement("canvas"), document.createElement("div"));
  });

  afterEach(() => trainer.dispose());

  test("the player spawns on the arena, the world ticks, and a walk order reaches its tile", () => {
    const player = trainer.getSnapshot().player;
    expect(player.location).toEqual({ x: 10, y: 10 });

    trainer.world.tickWorld(3);
    expect(trainer.world.globalTickCounter).toBe(3);

    player.moveTo(14, 10);
    trainer.world.tickWorld();
    expect(player.location).toEqual({ x: 12, y: 10 });
    trainer.world.tickWorld();
    expect(player.location).toEqual({ x: 14, y: 10 });
    expect(trainer.world.globalTickCounter).toBe(5);
  });
});
