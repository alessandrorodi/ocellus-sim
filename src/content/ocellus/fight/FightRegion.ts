import { CardinalDirection, CollisionType, Entity, LineOfSightMask, Region, SoundCache, cacheSound } from "osrs-sdk";
import type { Model, Player } from "osrs-sdk";
import { EmptyModel } from "osrs-sdk";
import { ArenaFloor } from "./arena";
import { SOUND } from "./data";
import { TileMarks, VoidFloor } from "./effects";
import type { FightOptions, PhaseScript, StartPhase } from "./Fight";
import { Fight } from "./Fight";
import { GRID, at } from "./geometry";
import { Phase1 } from "./phase1";
import { Phase2 } from "./phase2";
import { Phase3 } from "./phase3";
import { Phase4 } from "./phase4";
import { FightPlayer } from "./units";

/** Steps the fight at the very start of each game tick, before NPCs act, as the server's scripts do. */
class FightClock extends Entity {
  constructor(region: Region, private readonly fight: Fight) {
    super(region, { x: 0, y: 0 });
  }

  override get collisionType(): CollisionType {
    return CollisionType.NONE;
  }

  override get lineOfSight(): LineOfSightMask {
    return LineOfSightMask.NONE;
  }

  override get size(): number {
    return 1;
  }

  override tick(): void {
    if (this.region.world.getReadyTimer > 0) return;
    if (!this.fight.started) this.fight.start();
    else this.fight.step();
  }

  override draw(): void {}

  protected override create3dModel(): Model {
    return EmptyModel.forRenderable(this);
  }
}

export function makePhase(n: StartPhase, fight: Fight): PhaseScript {
  switch (n) {
    case 1:
      return new Phase1(fight);
    case 2:
      return new Phase2(fight);
    case 3:
      return new Phase3(fight);
    case 4:
      return new Phase4(fight);
    default: {
      const unhandled: never = n;
      return unhandled;
    }
  }
}

export class FightRegion extends Region {
  fight: Fight | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(private options: FightOptions, private readonly dressPlayer: (player: Player) => void) {
    super();
  }

  override getName(): string {
    return "Ocellus";
  }

  /** You walk in from the south, facing him. */
  override get initialFacing(): CardinalDirection {
    return CardinalDirection.NORTH;
  }

  override get width(): number {
    return GRID;
  }

  override get height(): number {
    return GRID;
  }

  override drawDefaultFloor(): boolean {
    return false;
  }

  override drawWorldBackground(context: OffscreenCanvasRenderingContext2D, scale: number): void {
    context.fillStyle = "#07060b";
    context.fillRect(0, 0, GRID * scale, GRID * scale);
  }

  setOptions(options: FightOptions): void {
    this.options = options;
  }

  initialiseRegion(): { player: Player } {
    const spawn = this.options.startPhase === 1 ? at(0, -9) : this.options.startPhase === 4 ? at(4, -2) : at(5, -3);
    const player = new FightPlayer(this, spawn);
    this.dressPlayer(player);
    const fight = new Fight(this, this.options, player, makePhase);
    this.fight = fight;
    this.addEntity(new ArenaFloor(this, () => fight.floorState()));
    this.addEntity(new VoidFloor(this, () => fight.voidTiles()));
    this.addEntity(new TileMarks(this, () => fight.marks()));
    this.addEntity(new FightClock(this, fight));
    this.addPlayer(player);
    Object.values(SOUND).flat().forEach((id) => SoundCache.preload(cacheSound(id)));
    this.listeners.forEach((listener) => listener());
    return { player };
  }

  override onGameOver(): void {
    this.fight?.lose("death");
    this.world.stopTicking();
  }

  onFightChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
