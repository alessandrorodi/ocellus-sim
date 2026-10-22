import { InvisibleMovementBlocker, Region, Sound, SoundCache, cacheSound } from "osrs-sdk";
import type { Item, Player } from "osrs-sdk";
import type { DrillConfig } from "./OcellusTimings";
import { OCELLUS_P4 } from "./OcellusTimings";
import { dress } from "./OcellusLoadout";
import { OcellusPlayer } from "./OcellusPlayer";
import type { FightEvent, FightLog, FightSnapshot, SoundId, Tile, TickRow, VoidKind } from "./P4Types";
import { BossLook, ExplosionViews, FloorHole, FragmentFlash, OrbView, PlayerLook, VoidField } from "./entities/P4Views";
import { Brazier, Walkway } from "./entities/Scenery";
import { Ocellus } from "./mobs/Ocellus";
import { BRAZIERS, PLATFORM, WALKWAY, voidUnder } from "./p4/floor";
import { CombatStream } from "./p4/roll";

const GRID = PLATFORM.extent();

function itemId(item: Item | null | undefined): number | null {
  const id = item?.cacheItemId;
  return typeof id === "number" ? id : null;
}

type Views = Readonly<{
  field: VoidField;
  holes: readonly FloorHole[];
  orbs: Readonly<Record<VoidKind, OrbView>>;
  fragment: FragmentFlash;
  explosions: ExplosionViews;
  boss: BossLook;
  player: PlayerLook;
  chat: string[];
}>;

const { sounds, soundPlayback } = OCELLUS_P4.presentation;

function playCue(id: SoundId, at: Tile, delayMs = 0): void {
  const { volume, range, retain } = soundPlayback.value;
  SoundCache.play(new Sound(cacheSound(id), volume, delayMs, { location: at, range, retain }));
}

type Mounted =
  | Readonly<{ kind: "unmounted" }>
  | Readonly<{ kind: "mounted"; ocellus: Ocellus; player: OcellusPlayer; views: Views; rows: TickRow[] }>;

function present(event: FightEvent, views: Views, player: Tile): void {
  switch (event.kind) {
    case "lifeforce-told":
      views.fragment.tell(player);
      views.chat.push(OCELLUS_P4.lifeforce.tellChat.value);
      return;
    case "orb-spawned":
      views.orbs[event.void].spawn(event.void, event.tile);
      return;
    case "orb-matured":
      views.orbs[event.void].mature();
      return;
    case "orb-returned":
      views.orbs[event.void].leave();
      views.fragment.regain(player);
      return;
    case "orb-expired":
      views.orbs[event.void].leave();
      return;
    case "explosion-series-started":
      playCue(sounds.explosionSeriesStart.value, player);
      return;
    case "explosion-marked":
      views.explosions.mark(event.void, event.pulse, event.tile);
      playCue(sounds.explosionMark.value, player);
      return;
    case "explosion-resolved":
      views.explosions.detonate(event.void, event.pulse);
      return;
    case "stage-entered":
      views.boss.enter(event.stage);
      if (event.stage === "outer-void") playCue(sounds.flood.value, player);
      return;
    case "special-told":
      views.boss.tell(event.variant);
      return;
    case "special-sounded":
      playCue(sounds[event.cue.sound].value, player, event.cue.delayMs);
      return;
    case "boss-shouted":
      playCue(sounds.endShout.value, player);
      return;
    case "boss-landing-started":
      views.boss.land();
      return;
    case "rift-destroyed":
      views.chat.push(OCELLUS_P4.rifts.killChat.value);
      return;
    case "rift-burst":
      views.player.riftBurst();
      return;
    case "overhead-switched":
    case "boss-state-changed":
    case "player-hit-judged":
    case "floor-hit":
    case "hole-hit":
    case "lifeforce-drained":
    case "boss-healed":
    case "special-hit":
    case "rift-spawned":
    case "run-ended":
      return;
    default: {
      const unhandled: never = event;
      return unhandled;
    }
  }
}

export class OcellusRegion extends Region {
  private mounted: Mounted = { kind: "unmounted" };

  constructor(private readonly config: DrillConfig) {
    super();
  }

  override getName(): string {
    return "Ocellus";
  }

  override get width(): number {
    return GRID.width;
  }

  override get height(): number {
    return GRID.height;
  }

  override drawWorldBackground(context: OffscreenCanvasRenderingContext2D, scale: number): void {
    for (const { x, y } of PLATFORM.tiles()) {
      context.fillStyle = (x + y) % 2 === 0 ? "#4a4339" : "#3f392f";
      context.fillRect(x * scale, y * scale, scale, scale);
    }
    context.fillStyle = OCELLUS_P4.geometry.walkway.value.top;
    for (const { x, y } of WALKWAY.tiles()) context.fillRect(x * scale, y * scale, scale, scale);
  }

  initialiseRegion(): { player: Player } {
    const player: OcellusPlayer = new OcellusPlayer(
      this,
      { ...OCELLUS_P4.geometry.playerSpawn.value },
      new CombatStream(this.config.seed),
      (input) => ocellus.recordInput(input),
      () => ocellus.settlePlayerHits(),
    );
    const ocellus: Ocellus = new Ocellus(this, this.config, player);
    dress(player, this.config.choices.setup);
    Object.values(sounds).forEach((sound) => SoundCache.preload(cacheSound(sound.value)));
    const views: Views = {
      field: new VoidField(this),
      holes: ocellus.holes.tiles().map((at) => new FloorHole(this, at)),
      orbs: { "inner-void": new OrbView(this), "outer-void": new OrbView(this) },
      fragment: new FragmentFlash(this),
      explosions: new ExplosionViews(this),
      boss: new BossLook(ocellus),
      player: new PlayerLook(player),
      chat: [],
    };
    [views.field, ...views.holes, views.orbs["inner-void"], views.orbs["outer-void"], views.fragment].forEach((view) => this.addEntity(view));
    [new Walkway(this), ...BRAZIERS.tiles().map((at) => new Brazier(this, at))].forEach((scenery) => this.addEntity(scenery));
    for (const edge of PLATFORM.surround().tiles()) this.addEntity(new InvisibleMovementBlocker(this, { ...edge }));
    this.addPlayer(player);
    this.addMob(ocellus);
    this.setBoss(ocellus);
    this.mounted = { kind: "mounted", ocellus, player, views, rows: [] };
    return { player };
  }

  /** Unit constructors and Region.reset's setStats pass write SDK default stats, so P4 entry is applied after both. */
  override reset(startWorld = true): { player: Player } {
    const result = super.reset(false);
    if (this.mounted.kind === "mounted") this.mounted.ocellus.enterP4();
    if (startWorld) this.world.startTicking();
    return result;
  }

  override postTick(): void {
    if (this.mounted.kind === "unmounted") return;
    const row = this.mounted.ocellus.completeTick();
    if (!row) return;
    this.mounted.rows.push(row);
    const { views } = this.mounted;
    const floor = voidUnder(row.phase);
    views.field.show(floor);
    views.holes.forEach((hole) => hole.cover(floor));
    row.events.forEach((event) => present(event, views, row.playerAtPostTick.tile));
  }

  snapshot(): FightSnapshot | null {
    if (this.mounted.kind === "unmounted") return null;
    const { ocellus, player } = this.mounted;
    const { weapon, offhand, helmet, chest, legs, gloves, cape, necklace, feet, ring, ammo } = player.equipment;
    return {
      run: ocellus.runState(),
      boss: { npcId: OCELLUS_P4.boss.npcId.value, hp: ocellus.currentStats.hitpoint, maxHp: ocellus.stats.hitpoint, visible: ocellus.visible(), defence: ocellus.currentStats.defence },
      player: {
        equipped: {
          weapon: itemId(weapon),
          offhand: itemId(offhand),
          helmet: itemId(helmet),
          chest: itemId(chest),
          legs: itemId(legs),
          gloves: itemId(gloves),
          cape: itemId(cape),
          necklace: itemId(necklace),
          feet: itemId(feet),
          ring: itemId(ring),
          ammo: itemId(ammo),
        },
        inventory: player.inventory.map(itemId),
        specialEnergy: player.currentStats.specialAttack,
      },
    };
  }

  chat(): readonly string[] {
    return this.mounted.kind === "mounted" ? [...this.mounted.views.chat] : [];
  }

  fightLog(): FightLog {
    const rows = this.mounted.kind === "mounted" ? [...this.mounted.rows] : [];
    return { header: { seed: this.config.seed, choices: this.config.choices }, rows };
  }
}
