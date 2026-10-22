import type { Unit } from "osrs-sdk";
import type { TileMark } from "./effects";
import type { Fight, PhaseScript } from "./Fight";
import { CHAT } from "./Fight";
import { P2, SEQ, SOUND, SPOT } from "./data";
import type { ATile, Arm, Quadrant } from "./geometry";
import { ARM_DIR, MIDDLE, QUADRANT_SIGN, TileSet, at, armsOf, clockwise, inRoom, key, quadrantOf, same, sideOf } from "./geometry";
import type { PortalLook, PortalTile } from "./portals";
import { PortalCross } from "./portals";
import type { Style } from "./units";
import { Emitter } from "./units";

const PORTALS_PER_ARM = 6;

type Portal = Readonly<{ arm: Arm; index: number; tiles: readonly [ATile, ATile]; emitter: Emitter }>;

type Round = {
  q: Quadrant;
  start: number;
  gaps: Map<Arm, number>;
  lit: boolean;
  allLit: boolean;
  pools: ATile[];
  safePortal: ATile | null;
  escaped: boolean;
};

/** The two tiles of portal `index` (0 nearest the middle) on an arm: the "+" runs along x = 0 and z = 0. */
function portalTiles(arm: Arm, index: number): readonly [ATile, ATile] {
  const { dx, dz } = ARM_DIR[arm];
  const n = 2 * index + 1;
  return [at(dx * n, dz * n), at(dx * (n + 1), dz * (n + 1))];
}

/** Tiles a portal fires across: its two rows (N/S arms) or columns (E/W arms), into the quadrant. */
function firedTiles(portal: Portal, q: Quadrant): ATile[] {
  const { sx, sz } = QUADRANT_SIGN[q];
  const tiles: ATile[] = [];
  for (const origin of portal.tiles) {
    for (let k = 1; k <= 13; k++) {
      const t = portal.arm === "N" || portal.arm === "S" ? at(origin.x + sx * k, origin.z) : at(origin.x, origin.z + sz * k);
      if (inRoom(t)) tiles.push(t);
    }
  }
  return tiles;
}

export class Phase2 implements PhaseScript {
  readonly label = "Phase 2";
  private start = 0;
  private portals: Portal[] = [];
  private round: Round | null = null;
  private roundsRun = 0;
  private firstQuadrant: Quadrant | null = null;
  private walls = new TileSet();
  private cross: PortalCross | null = null;
  private ended = false;

  constructor(private readonly fight: Fight) {}

  private get boss() {
    const boss = this.fight.boss;
    if (!boss) throw new Error("phase 2 has no boss");
    return boss;
  }

  begin(): void {
    const { fight } = this;
    this.start = fight.tick;
    fight.barColour = "#00d900";
    const boss = fight.swapBoss("blade", MIDDLE, fight.poolMax, fight.poolMax);
    boss.attackable = false;
    boss.faceTile(at(0, 10));
    boss.playAnimation(SEQ.p2Transformation);
    boss.addSpotAnim({ id: SPOT.p1ToP2, channel: "transform" });
    if (fight.options.startPhase === 2) fight.message("Challenge started: Ocellus.", CHAT.game);
    fight.after(P2.portalsAt, () => this.raisePortals());
    fight.after(P2.bladeAt, () => {
      fight.say("Your time... comes...", 4);
      boss.attackable = true;
      fight.message("The Blade can now be attacked.", CHAT.purple);
    });
    P2.rounds.forEach((at) => fight.after(at, () => this.startRound()));
    fight.after(P2.enough, () => this.enough());
    fight.after(P2.enough + 1, () => {
      fight.sound(SOUND.swordDropBoom, MIDDLE);
      fight.spot(at(0, 0), SPOT.swordDropExplosion, { maxTicks: 6 });
    });
    fight.after(P2.p3At, () => {
      this.boss.playAnimation(SEQ.p2ToP3Part2);
      this.teardown();
      fight.enterPhase(3);
    });
    for (let t = 3; t < P2.enough; t += 3) fight.after(t, () => fight.spot(at(0, 0), SPOT.swordRepair, { maxTicks: 3 }));
  }

  private raisePortals(): void {
    const { fight } = this;
    this.portals = [];
    for (const arm of ["N", "E", "S", "W"] as const) {
      for (let index = 0; index < PORTALS_PER_ARM; index++) {
        const tiles = portalTiles(arm, index);
        const emitter = new Emitter(fight.region, tiles[0]);
        fight.region.addMob(emitter);
        this.portals.push({ arm, index, tiles, emitter });
        tiles.forEach((t) => this.walls.add(t));
      }
    }
    fight.setBlocked(this.walls.tiles());
    // Anyone caught on the line steps off it, into the quadrant they leaned towards.
    const here = fight.playerTile;
    if (this.walls.has(here)) {
      const { sx, sz } = QUADRANT_SIGN[sideOf(here)];
      fight.player.hop(at(here.x === 0 ? sx : here.x, here.z === 0 ? sz : here.z));
    }
    this.cross = new PortalCross(fight.region, () => this.portalLooks());
    fight.region.addEntity(this.cross);
  }

  private teardown(): void {
    for (const portal of this.portals) portal.emitter.dying = 0;
    this.portals = [];
    if (this.cross) this.cross.dying = 0;
    this.cross = null;
    this.round = null;
    this.fight.setBlocked([]);
  }

  private startRound(): void {
    const { fight } = this;
    const here = quadrantOf(fight.playerTile) ?? sideOf(fight.playerTile);
    const q = this.firstQuadrant === null ? here : clockwise(this.firstQuadrant, this.roundsRun);
    if (this.firstQuadrant === null) this.firstQuadrant = q;
    this.roundsRun++;
    const round: Round = { q, start: fight.tick, gaps: new Map(), lit: false, allLit: false, pools: [], safePortal: null, escaped: false };
    this.round = round;
    const lastRound = this.roundsRun === P2.rounds.length;
    for (let k = 0; k < P2.lightTimes; k++) {
      const lightAt = k * P2.lightEvery;
      if (lastRound && P2.rounds[2] + lightAt >= P2.enough) break;
      const light = () => this.light(round);
      if (lightAt === 0) light();
      else fight.after(lightAt, light);
      fight.after(lightAt + P2.fireAfterLight, () => this.fire(round, false));
    }
    if (lastRound) return;
    fight.after(P2.poolsAt, () => this.spawnPools(round));
    fight.after(P2.allLitAt, () => {
      round.allLit = true;
      round.lit = true;
    });
    fight.after(P2.safePortalAt, () => this.openSafePortal(round));
    fight.after(P2.safePortalAt + 1, () => {
      this.boss.addSpotAnim({ id: SPOT.swordDischarge, channel: "discharge" });
      fight.sound(SOUND.swordDischarge, MIDDLE);
    });
    fight.after(P2.safePortalAt + 2, () => fight.sound(SOUND.swordDropBoom, MIDDLE));
    fight.after(P2.allFireAt, () => this.fire(round, true));
  }

  /** Ten of the twelve portals light, a gap on each arm; the gaps' rows and columns cross on the safe 2x2. */
  private light(round: Round): void {
    const { rng } = this.fight;
    for (const arm of armsOf(round.q)) {
      const previous = round.gaps.get(arm);
      const next = previous === undefined ? rng.int(0, PORTALS_PER_ARM - 1) : Math.max(0, Math.min(PORTALS_PER_ARM - 1, previous + rng.int(-2, 2)));
      round.gaps.set(arm, next);
    }
    round.lit = true;
  }

  private litPortals(round: Round): Portal[] {
    const [a, b] = armsOf(round.q);
    return this.portals.filter((p) => (p.arm === a || p.arm === b) && (round.allLit || round.gaps.get(p.arm) !== p.index));
  }

  private fire(round: Round, crossfire: boolean): void {
    if (this.round !== round || !round.lit) return;
    const { fight } = this;
    const lit = this.litPortals(round);
    const here = fight.playerTile;
    let lines = 0;
    for (const portal of lit) {
      const tiles = firedTiles(portal, round.q);
      for (const origin of portal.tiles) {
        const far = tiles.filter((t) => (portal.arm === "N" || portal.arm === "S" ? t.z === origin.z : t.x === origin.x)).pop();
        if (far) fight.shoot(portal.emitter, far, 2, { spotAnim: { id: SPOT.portalProjectile }, startCycleOffset: 0, endCycleOffset: 6 * 12, verticalOffset: 0.2 });
      }
      for (const origin of portal.tiles) {
        const onRow = portal.arm === "N" || portal.arm === "S" ? here.z === origin.z : here.x === origin.x;
        if (onRow && tiles.some((t) => same(t, here))) lines++;
      }
    }
    for (let i = 0; i < lines; i++) fight.hit({ amount: () => fight.rng.roll(P2.lineDamage) });
    round.lit = false;
    if (crossfire) {
      this.round = null;
      round.pools = [];
      round.safePortal = null;
    }
  }

  private spawnPools(round: Round): void {
    const { fight } = this;
    const candidates = fight.isFloor(at(0, 0)) ? this.quadrantTiles(round.q) : [];
    round.pools = fight.rng.shuffle(candidates).slice(0, P2.poolCount);
    for (const tile of round.pools) fight.spot(tile, SPOT.p2Pool, { loopTicks: P2.allFireAt - P2.poolsAt, maxTicks: P2.allFireAt - P2.poolsAt + 1 });
  }

  private openSafePortal(round: Round): void {
    const { fight } = this;
    const tile = round.pools.length > 0 ? fight.rng.pick(round.pools) : fight.rng.pick(this.quadrantTiles(round.q));
    round.safePortal = tile;
    fight.spot(tile, SPOT.safePortalSpawn, { maxTicks: 2 });
    fight.after(1, () => fight.spot(tile, SPOT.safePortalIdle, { loopTicks: P2.safePortalUntil - P2.safePortalAt - 1, maxTicks: P2.safePortalUntil - P2.safePortalAt }));
    fight.after(P2.safePortalUntil - P2.safePortalAt + 1, () => fight.spot(tile, SPOT.safePortalDespawn, { maxTicks: 3 }));
  }

  private quadrantTiles(q: Quadrant): ATile[] {
    const { sx, sz } = QUADRANT_SIGN[q];
    const tiles: ATile[] = [];
    for (let x = 1; x <= 12; x++) {
      for (let z = 1; z <= 12; z++) {
        const t = at(x * sx, z * sz);
        if (inRoom(t) && this.fight.isWalkable(t) && !(Math.abs(t.x) <= 1 && Math.abs(t.z) <= 1)) tiles.push(t);
      }
    }
    return tiles;
  }

  step(): void {
    const round = this.round;
    if (!round || this.ended) return;
    const { fight } = this;
    const offset = fight.tick - round.start;
    const here = fight.playerTile;
    if (round.safePortal && !round.escaped && offset >= P2.safePortalAt + 1 && offset <= P2.safePortalUntil && same(here, round.safePortal)) {
      round.escaped = true;
      const next = clockwise(round.q);
      const landing = fight.rng.pick(this.quadrantTiles(next));
      fight.player.hop(landing);
      fight.player.addSpotAnim({ id: SPOT.safePortalDespawn, channel: "portal" });
      return;
    }
    if (round.pools.length > 0 && offset > P2.poolsAt && offset < P2.allFireAt) {
      const onPool = round.pools.some((p) => same(p, here)) && !(round.safePortal && same(round.safePortal, here));
      if (onPool) fight.hit({ amount: () => fight.rng.roll(P2.poolDamage) });
    }
  }

  private enough(): void {
    const { fight } = this;
    this.ended = true;
    this.round = null;
    const boss = this.boss;
    boss.attackable = false;
    if (fight.player.aggro === boss) fight.player.setAggro(null);
    fight.say("This... is enough...", 4);
    boss.playAnimation(SEQ.p2ToP3Part1);
    boss.addSpotAnim({ id: SPOT.p2ToP3ArmGlow, channel: "arm-glow" });
    boss.addSpotAnim({ id: SPOT.p2ToP3Arm, channel: "arm" });
    fight.spot(at(0, 0), SPOT.swordDrop, { maxTicks: 6 });
    fight.sound(SOUND.swordDischarge, MIDDLE);
  }

  private portalLooks(): PortalTile[] {
    const round = this.round;
    const litKeys = new Set<string>();
    if (round && round.lit) for (const p of this.litPortals(round)) p.tiles.forEach((t) => litKeys.add(key(t)));
    const out: PortalTile[] = [];
    for (const portal of this.portals) {
      for (const tile of portal.tiles) {
        const look: PortalLook = litKeys.has(key(tile)) ? "lit" : "inactive";
        out.push({ tile, look });
      }
    }
    return out;
  }

  marks(): readonly TileMark[] {
    const round = this.round;
    if (!round) return [];
    const marks: TileMark[] = [];
    if (round.lit) {
      const hits = new Map<string, number>();
      const tiles = new Map<string, ATile>();
      for (const portal of this.litPortals(round)) {
        for (const t of firedTiles(portal, round.q)) {
          hits.set(key(t), (hits.get(key(t)) ?? 0) + 1);
          tiles.set(key(t), t);
        }
      }
      for (const [k, count] of hits) {
        const tile = tiles.get(k);
        if (tile && this.fight.isWalkable(tile)) marks.push({ tile, colour: 0x9b3cff, opacity: count > 1 ? 0.32 : 0.18, inset: 0.05 });
      }
      for (const tile of this.quadrantTiles(round.q)) {
        if (!hits.has(key(tile))) marks.push({ tile, colour: 0x2bff73, opacity: 0.3, inset: 0.08 });
      }
    }
    for (const tile of round.pools) marks.push({ tile, colour: 0xd02020, opacity: 0.25, inset: 0.12 });
    if (round.safePortal) marks.push({ tile: round.safePortal, colour: 0xffa020, opacity: 0.55, inset: 0.02 });
    return marks;
  }

  hpFloor(): number {
    return Math.ceil(this.fight.poolMax * 0.75);
  }

  allowsDeath(): boolean {
    return false;
  }

  acceptsAttack(_style: Style): boolean {
    return true;
  }

  playerAttacking(_target: Unit, _style: Style): boolean {
    return true;
  }

  interceptWalk(_to: ATile): boolean {
    return false;
  }

  meter(): number | null {
    return null;
  }

  onBossHit(): void {}
}
