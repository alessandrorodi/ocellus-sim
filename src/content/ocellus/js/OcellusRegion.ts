import { CardinalDirection, Player, Region } from "osrs-sdk";
import type { Location } from "osrs-sdk";
import { ocellusLoadout } from "./OcellusLoadout";

export const ARENA_SIZE = { width: 20, height: 20 } as const;
export const SPAWN_TILE: Readonly<Location> = { x: 10, y: 10 };

export class OcellusRegion extends Region {
  constructor() {
    super([ocellusLoadout]);
  }

  getName() {
    return "Ocellus";
  }

  get width() {
    return ARENA_SIZE.width;
  }

  get height() {
    return ARENA_SIZE.height;
  }

  get initialFacing() {
    return CardinalDirection.NORTH;
  }

  drawWorldBackground(context: OffscreenCanvasRenderingContext2D, scale: number) {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        context.fillStyle = (x + y) % 2 === 0 ? "#4a4339" : "#3f392f";
        context.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  initialiseRegion() {
    const player = new Player(this, { ...SPAWN_TILE });
    this.addPlayer(player);
    return { player };
  }
}
