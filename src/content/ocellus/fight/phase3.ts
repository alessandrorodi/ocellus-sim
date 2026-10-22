import type { Unit } from "osrs-sdk";
import type { TileMark } from "./effects";
import type { Fight, PhaseScript } from "./Fight";
import { CHAT } from "./Fight";
import { P3, SEQ, SPOT } from "./data";
import type { ATile, Arm, Body, Quadrant } from "./geometry";
import {
  ARMS,
  ARM_DIR,
  CORNERS,
  QUADRANTS,
  QUADRANT_SIGN,
  armBetween,
  armsOf,
  at,
  bodyCentre,
  clockwise,
  covers,
  distanceToBody,
  inRoom,
  quadrantOf,
  quadrantTiles,
  reach,
  same,
  sign,
  stonesOf,
} from "./geometry";
import type { AddKind, Style } from "./units";
import { VoidAdd } from "./units";

type Patch = { tile: ATile; until: number; placed: number };
type Telegraph = { tiles: ATile[]; landsAt: number; colour: number };
type Crossing = { arm: Arm; from: Quadrant; to: Quadrant; bank: ATile; hops: ATile[]; hopping: boolean };

const RIFT_ORDER: readonly AddKind[] = ["rift-buff", "rift-basic", "rift-heal"];
const GOD_NAME = { bandos: "Bandosian", saradomin: "Saradomin", armadyl: "Armadylean", zaros: "Zarosian" } as const;
const GOD_GLOW = { bandos: SPOT.glowBandos, saradomin: SPOT.glowSaradomin, armadyl: SPOT.glowArmadyl, zaros: SPOT.glowZaros } as const;

/** Tiles of the "+" and the middle 5x5 that phase 3 turns into chasm. */
export function chasmTiles(): ATile[] {
  const tiles: ATile[] = [];
  for (let x = -12; x <= 12; x++) {
    for (let z = -12; z <= 12; z++) {
      const t = at(x, z);
      if (!inRoom(t)) continue;
      if (Math.abs(x) <= 1 || Math.abs(z) <= 1 || (Math.abs(x) <= 2 && Math.abs(z) <= 2)) tiles.push(t);
    }
  }
  return tiles;
}

/** The bank tile beside a stone, on the given quadrant's side of the arm. */
function bankBeside(stone: ATile, arm: Arm, q: Quadrant): ATile {
  const { sx, sz } = QUADRANT_SIGN[q];
  return arm === "N" || arm === "S" ? at(2 * sx, stone.z) : at(stone.x, 2 * sz);
}

export class Phase3 implements PhaseScript {
  readonly label = "Phase 3";
  private segment = 0;
  private quadrant: Quadrant = "SE";
  private segmentStart = 0;
  private untether: number | null = null;
  private levitating = false;
  private stationary = false;
  private patches: Patch[] = [];
  private telegraphs: Telegraph[] = [];
  private zone: Body | null = null;
  private zoneGlow = 0;
  private vine: VoidAdd | null = null;
  private rifts: VoidAdd[] = [];
  private riftKind: AddKind | null = null;
  private crossing: Crossing | null = null;
  private lastFlyingMessage = -10;
  private floorFraction: number = P3.hpFloors[0];
  private finished = false;

  constructor(private readonly fight: Fight) {}

  private get boss() {
    const boss = this.fight.boss;
    if (!boss) throw new Error("phase 3 has no boss");
    return boss;
  }

  begin(): void {
    const { fight } = this;
    const direct = fight.options.startPhase === 3;
    const hp = direct ? fight.poolMax : this.fight.boss?.currentStats.hitpoint ?? fight.poolMax;
    const boss = fight.swapBoss("p3", at(-1, -1), hp, fight.poolMax);
    boss.attackable = false;
    boss.faceTile(at(0, 10));
    fight.barColour = "#00d900";
    if (direct) fight.message("Challenge started: Ocellus.", CHAT.game);
    this.breakArena();
    fight.after(P3.jumpToCornerAfter, () => this.startSegment(fight.quadrantOfPlayer() ?? "SE"));
  }

  private breakArena(): void {
    const { fight } = this;
    const chasm = chasmTiles();
    fight.removeFloor(chasm);
    const stones = ARMS.flatMap((arm) => stonesOf(arm));
    fight.setStones(stones);
    for (const arm of ARMS) {
      const { dx, dz } = ARM_DIR[arm];
      [3, 6, 9, 12].forEach((n, i) => fight.spot(at(dx * n, dz * n), SPOT.collapsingExplosion[i], { delay: i * 15, maxTicks: 5 }));
    }
    const here = fight.playerTile;
    if (!fight.isWalkable(here)) {
      const q = quadrantOf(here) ?? sideQuadrant(here);
      const { sx, sz } = QUADRANT_SIGN[q];
      fight.player.hop(at(Math.abs(here.x) < 3 ? 3 * sx : here.x, Math.abs(here.z) < 3 ? 3 * sz : here.z));
    }
  }

  // ---- segments ---------------------------------------------------------------------------------------------------

  private startSegment(q: Quadrant): void {
    const { fight } = this;
    if (this.fight.destroyed.has(q)) q = QUADRANTS.find((other) => !fight.destroyed.has(other)) ?? q;
    this.quadrant = q;
    this.segmentStart = fight.tick;
    this.floorFraction = P3.hpFloors[this.segment];
    this.levitating = false;
    this.stationary = false;
    this.zone = null;
    const boss = this.boss;
    boss.teleport(CORNERS[q]);
    boss.attackable = true;
    boss.pose = null;
    fight.setOverhead(null);
    boss.face(fight.player);
    const plan = this.segment === 0 ? P3.first : P3.later;
    for (const t of plan.triples) this.at(t, () => this.triple());
    for (const t of plan.spins) this.at(t, () => this.spin());
    for (const t of plan.volleys) this.at(t, () => this.panic());
    for (const t of plan.bombs) this.at(t, () => this.bombs());
    for (const t of plan.rifts) this.at(t, () => this.spawnRift());
    this.at(plan.vine, () => this.spawnVine());
    if (plan.insolence !== null) {
      const start = plan.insolence;
      this.at(start, () => this.fight.say("Insolence...", 3));
      for (let i = 0; i < P3.insolenceSlashes; i++) this.at(start + i * P3.insolenceEvery, () => this.superiorSlash());
    }
    if (this.segment > 0 && this.riftKind === null) this.riftKind = fight.rng.pick(RIFT_ORDER);
    else if (this.segment > 1 && this.riftKind !== null) this.riftKind = RIFT_ORDER[(RIFT_ORDER.indexOf(this.riftKind) + 1) % RIFT_ORDER.length];
    this.untether = this.segmentStart + plan.untether;
    this.at(plan.untether, () => this.startUntether());
  }

  /** Schedule relative to the segment's start. */
  private at(offset: number, run: () => void): void {
    const delay = this.segmentStart + offset - this.fight.tick;
    this.fight.after(Math.max(1, delay), run);
  }

  private body(): Body {
    return { sw: this.boss.tile, size: 3 };
  }

  private inMelee(): boolean {
    const here = this.fight.playerTile;
    const body = this.body();
    if (distanceToBody(body, here) !== 1) return false;
    // Not diagonally off a corner.
    const insideX = here.x >= body.sw.x && here.x <= body.sw.x + 2;
    const insideZ = here.z >= body.sw.z && here.z <= body.sw.z + 2;
    return insideX || insideZ;
  }

  private triple(): void {
    if (this.levitating) return;
    const { fight } = this;
    const boss = this.boss;
    const swing = () => {
      if (this.levitating) return;
      boss.playAnimation(SEQ.p3MeleeBasic);
      boss.face(fight.player);
      if (!this.inMelee()) return;
      fight.hit({ style: "melee", amount: (prayer) => fight.rng.roll(prayer === "melee" ? P3.basicHitProtected : P3.basicHitUnprotected) });
    };
    swing();
    fight.after(3, swing);
    fight.after(P3.slashAfter - 2, () => {
      if (this.levitating) return;
      const line = this.slashLine();
      this.telegraphs.push({ tiles: line, landsAt: fight.tick + 2, colour: 0x2a0a3a });
    });
    fight.after(P3.slashAfter, () => {
      if (this.levitating) return;
      const pending = this.telegraphs.find((t) => t.landsAt === fight.tick && t.colour === 0x2a0a3a);
      const line = pending?.tiles ?? this.slashLine();
      this.telegraphs = this.telegraphs.filter((t) => t !== pending);
      boss.playAnimation(SEQ.p3MeleeSlash);
      line.forEach((tile, i) => fight.spot(tile, SPOT.shadowSlash, { delay: i * 2, maxTicks: 3 }));
      if (line.some((t) => same(t, fight.playerTile))) fight.hit({ amount: () => fight.rng.roll(P3.slashDamage) });
    });
  }

  /** A short line of smoke from his middle toward his target, P3.slashLength tiles past his body. */
  private slashLine(): ATile[] {
    const centre = bodyCentre(this.body());
    const here = this.fight.playerTile;
    const dx = sign(Math.round(here.x - centre.x));
    const dz = sign(Math.round(here.z - centre.z));
    const step = dx === 0 && dz === 0 ? { dx: 0, dz: 1 } : { dx, dz };
    const tiles: ATile[] = [];
    for (let k = 2; k <= 1 + P3.slashLength; k++) {
      const t = at(Math.round(centre.x) + step.dx * k, Math.round(centre.z) + step.dz * k);
      if (this.fight.isFloor(t)) tiles.push(t);
    }
    return tiles;
  }

  /** The charged blade: an overhead on at its start injures you; Protect from Melee blocks the saw blades. */
  private spin(): void {
    if (this.levitating) return;
    const { fight } = this;
    const boss = this.boss;
    this.stationary = true;
    boss.playAnimation(SEQ.p3PrayerIn);
    boss.addSpotAnim({ id: SPOT.meleePrayerIn, channel: "spin" });
    fight.after(1, () => {
      if (fight.player.protection !== null) {
        fight.player.prayerController.disableProtectionPrayersForTicks(P3.untether.prayerDisableTicks);
        fight.message("You've been injured and can't use protection prayers!", CHAT.red);
      }
    });
    const loops = this.fight.destroyed.size;
    for (let i = 0; i <= loops; i++) {
      const last = i === loops;
      fight.after(3 + 3 * i, () => {
        boss.playAnimation(last ? SEQ.p3PrayerOut : SEQ.p3PrayerLoop);
        boss.addSpotAnim({ id: last ? SPOT.meleePrayerOut : SPOT.meleePrayer, channel: "spin" });
      });
      fight.after(5 + 3 * i, () => {
        if (reach(fight.playerTile, this.boss.tile) > 8) return;
        fight.hit({ style: "melee", amount: (prayer) => (prayer === "melee" ? 0 : fight.rng.roll(P3.spinDamage)) });
        if (last) this.stationary = false;
      });
    }
  }

  /** "Your panic... is futile...": a magic shot that leaves a void patch where it lands. */
  private panic(): void {
    if (this.levitating) return;
    const { fight } = this;
    const boss = this.boss;
    fight.say("Your panic... is futile...", 3);
    boss.playAnimation(SEQ.p3ProjectileAll);
    boss.addSpotAnim({ id: SPOT.magicOnBoss, channel: "magic" });
    fight.hit({
      from: boss,
      style: "magic",
      delay: 2,
      amount: fight.prayable("magic", P3.volleyDamage),
      visuals: { spotAnim: { id: SPOT.magicProjectile }, startCycleOffset: 45, endCycleOffset: 60, verticalOffset: 1 },
      onLand: () => {
        fight.player.addSpotAnim({ id: SPOT.magicImpact, channel: "impact" });
        this.addPatch(fight.playerTile, fight.rng.roll(P3.patchLasts));
      },
    });
  }

  /** One void bomb on each standing quadrant; it drops two ticks later and leaves a patch. */
  private bombs(): void {
    const { fight } = this;
    for (const q of QUADRANTS) {
      if (fight.destroyed.has(q)) continue;
      const tiles = quadrantTiles(q).filter((t) => fight.isWalkable(t) && !covers(this.body(), t));
      if (tiles.length === 0) continue;
      const tile = q === quadrantOf(fight.playerTile) && fight.rng.chance(0.5) ? fight.playerTile : fight.rng.pick(tiles);
      fight.spot(tile, SPOT.bombSpawn, { height: 2, maxTicks: 2 });
      fight.spot(tile, SPOT.bombIdle, { height: 2, loopTicks: 1, maxTicks: 2 });
      this.telegraphs.push({ tiles: [tile], landsAt: fight.tick + P3.bombDropAfter, colour: 0x8a2be2 });
      fight.after(P3.bombDropAfter, () => {
        fight.spot(tile, SPOT.bombDrop, { maxTicks: 3 });
        fight.spot(tile, SPOT.bombImpact, { maxTicks: 3 });
        if (same(fight.playerTile, tile)) fight.hit({ amount: () => fight.rng.roll(P3.bombDamage) });
        this.addPatch(tile, 30);
      });
    }
  }

  private addPatch(tile: ATile, lasts: number): void {
    if (!this.fight.isFloor(tile)) return;
    this.patches.push({ tile, until: this.fight.tick + lasts, placed: this.fight.tick });
    this.syncPatches();
  }

  private syncPatches(): void {
    this.fight.setVoidLayer("patches", this.patches.map((p) => p.tile));
  }

  private spawnVine(): void {
    if (this.levitating) return;
    const { fight } = this;
    fight.say(fight.rng.chance(0.5) ? "The void... will take you..." : "Await... the void...", 4);
    const tile = fight.playerTile;
    const vine = new VoidAdd(fight.region, tile, "vine", () => this.vineBroken());
    vine.currentStats.hitpoint = P3.vineHp;
    vine.attackable = fight.options.soloVine;
    fight.region.addMob(vine);
    this.vine = vine;
    fight.player.freeze(P3.vineBreakWithin + 1);
    fight.player.addSpotAnim({ id: SPOT.entangleStart, channel: "vine" });
    fight.after(1, () => fight.player.addSpotAnim({ id: SPOT.entangleIdle, channel: "vine" }));
    fight.message("A void vine entangles you!", CHAT.purple);
    fight.after(P3.vineBreakWithin, () => {
      if (this.vine !== vine || vine.killed) return;
      fight.hit({ amount: () => fight.rng.roll(P3.vineDamage) });
      this.releaseVine();
    });
  }

  private vineBroken(): void {
    this.fight.message("You break free of the vine.", CHAT.green);
    this.releaseVine();
  }

  private releaseVine(): void {
    const vine = this.vine;
    if (!vine) return;
    this.vine = null;
    vine.remove();
    this.fight.player.frozen = 0;
    this.fight.player.addSpotAnim({ id: SPOT.entangleEnd, channel: "vine" });
  }

  /** "Insolence...": three 4-wide bands, each toward where you stand when he winds up. */
  private superiorSlash(): void {
    const { fight } = this;
    const boss = this.boss;
    const centre = bodyCentre(this.body());
    const here = fight.playerTile;
    let ux = here.x - centre.x;
    let uz = here.z - centre.z;
    const length = Math.hypot(ux, uz) || 1;
    ux /= length;
    uz /= length;
    const band: ATile[] = [];
    for (let x = -12; x <= 12; x++) {
      for (let z = -12; z <= 12; z++) {
        const t = at(x, z);
        if (!fight.isFloor(t)) continue;
        const rx = x - centre.x;
        const rz = z - centre.z;
        const along = rx * ux + rz * uz;
        const across = Math.abs(rx * -uz + rz * ux);
        if (along >= 1.5 && along <= 13 && across <= P3.insolenceWidth / 2) band.push(t);
      }
    }
    boss.playAnimation(SEQ.p3SuperiorSlash);
    boss.face(fight.player);
    this.telegraphs.push({ tiles: band, landsAt: fight.tick + 2, colour: 0x5a0a0a });
    fight.after(2, () => {
      const middle = band.filter((t, i) => i % 3 === 0);
      middle.forEach((t, i) => fight.spot(t, SPOT.superiorSlash, { delay: i, maxTicks: 3 }));
      if (band.some((t) => same(t, fight.playerTile))) fight.hit({ amount: () => fight.rng.roll(P3.insolenceDamage) });
      const sorted = [...band].sort((a, b) => reach(a, this.boss.tile) - reach(b, this.boss.tile));
      [0.2, 0.5, 0.85].forEach((f) => {
        const t = sorted[Math.floor(f * (sorted.length - 1))];
        if (t) this.addPatch(t, P3.insolenceDebrisLasts);
      });
    });
  }

  private spawnRift(): void {
    const { fight } = this;
    const kind = this.riftKind ?? "rift-basic";
    const tiles = quadrantTiles(this.quadrant).filter((t) => fight.isWalkable(t) && distanceToBody(this.body(), t) >= 2);
    if (tiles.length === 0) return;
    const tile = fight.rng.pick(tiles);
    const rift = new VoidAdd(fight.region, tile, kind, (add) => this.riftKilled(add));
    fight.region.addMob(rift);
    this.rifts.push(rift);
    const spawnSpot = kind === "rift-heal" ? SPOT.healingFlare : null;
    if (kind === "rift-heal" && spawnSpot !== null) {
      for (let t = P3.healRiftEvery; t <= P3.riftLasts; t += P3.healRiftEvery) {
        fight.after(t, () => {
          if (rift.killed || !this.rifts.includes(rift)) return;
          fight.shoot(rift, bodyCentreTile(this.body()), 1, { spotAnim: { id: SPOT.healingFlare }, startCycleOffset: 0, endCycleOffset: 30, verticalOffset: 0.5 });
          const blocked = lineBetween(tile, bodyCentreTile(this.body())).some((t) => same(t, fight.playerTile));
          if (!blocked) fight.healBoss(fight.rng.pick(P3.healRiftHeal));
        });
      }
    }
    fight.after(P3.riftLasts, () => {
      if (!rift.killed) rift.remove();
      this.rifts = this.rifts.filter((r) => r !== rift);
    });
  }

  private riftKilled(add: VoidAdd): void {
    const { fight } = this;
    this.rifts = this.rifts.filter((r) => r !== add);
    if (add.kind === "rift-heal") return;
    const name = add.kind === "rift-buff" ? "void augmenter" : "void rift";
    fight.message(`Destroying the ${name} empowers you!`, CHAT.purple);
    fight.player.addSpotAnim({ id: add.kind === "rift-buff" ? SPOT.glowZaros : SPOT.glowArmadyl, channel: "empower" });
    this.boss.grantMaxDamageRollsOnNextIncomingAttack();
  }

  // ---- Untether and the quadrant's end ------------------------------------------------------------------------------

  private startUntether(): void {
    const { fight } = this;
    const boss = this.boss;
    const q = this.quadrant;
    this.levitating = true;
    this.stationary = true;
    if (this.vine) this.releaseVine();
    fight.say("Untether...", 3);
    boss.teleport(CORNERS[q]);
    boss.face(null);
    boss.faceTile(at(0, 0));
    boss.playAnimation(SEQ.p3UnleashIn);
    fight.setOverhead("protect-melee");
    this.zone = { sw: { x: CORNERS[q].x - 1, z: CORNERS[q].z - 1 }, size: 5 };
    const u = P3.untether;
    fight.after(2, () => (boss.pose = SEQ.p3UnleashLoop));
    for (const t of u.pools) fight.after(t, () => this.untetherPools());
    fight.after(u.unleashVfx, () => boss.addSpotAnim({ id: SPOT.unleashOnBoss, channel: "unleash" }));
    fight.after(u.erupt - 2, () => (this.zoneGlow = 1));
    fight.after(u.erupt, () => {
      const rotation = { NE: 2, NW: 1, SW: 0, SE: 3 }[q];
      fight.spot(bodyCentreTile(this.body()), SPOT.unleashArena[rotation], { maxTicks: 6 });
      const here = fight.playerTile;
      if (quadrantOf(here) === q && this.zone && !covers(this.zone, here)) fight.hit({ amount: () => fight.rng.roll(u.eruptDamage) });
    });
    fight.after(u.slam - 2, () => (this.zoneGlow = 2));
    fight.after(u.slam, () => {
      boss.pose = null;
      boss.playAnimation(SEQ.p3UnleashOut);
      this.zoneGlow = 0;
      const zone = this.zone;
      if (zone && covers(zone, fight.playerTile)) {
        fight.hit({ amount: () => fight.rng.roll(u.slamDamage) });
        fight.after(1, () => {
          if (covers(zone, fight.playerTile)) fight.hit({ amount: () => fight.rng.roll(u.slamAfterDamage) });
        });
      }
      this.zone = null;
    });
    fight.after(u.obliteration, () => this.obliterate(q));
  }

  private untetherPools(): void {
    const { fight } = this;
    const tiles = quadrantTiles(this.quadrant).filter((t) => fight.isWalkable(t) && !(this.zone && covers(this.zone, t)));
    const pools = fight.rng.shuffle(tiles).slice(0, fight.rng.int(10, 15));
    for (const tile of pools) fight.spot(tile, SPOT.p2Pool, { maxTicks: 4 });
    this.telegraphs.push({ tiles: pools, landsAt: fight.tick + 2, colour: 0xd02020 });
    fight.after(2, () => {
      if (pools.some((t) => same(t, fight.playerTile))) fight.hit({ amount: () => fight.rng.int(20, 30) });
    });
  }

  private obliterate(q: Quadrant): void {
    const { fight } = this;
    const boss = this.boss;
    const u = P3.untether;
    fight.say(fight.rng.chance(0.5) ? "Obliteration..." : "Run... It matters not...", 4);
    boss.playAnimation(SEQ.p3QuadrantDestroyIn);
    boss.addSpotAnim({ id: SPOT.collapseIn, channel: "collapse" });
    fight.setCrumbling([q]);
    fight.message("The quadrant begins to collapse! Jump across the stones!", CHAT.red);
    fight.after(2, () => {
      boss.pose = SEQ.p3QuadrantDestroyLoop;
      boss.addSpotAnim({ id: SPOT.collapseLoop, channel: "collapse" });
    });
    const tiles = quadrantTiles(q);
    for (let t = 2; t < u.gone - u.obliteration; t += 2) {
      fight.after(t, () => {
        for (let i = 0; i < 4; i++) fight.spot(fight.rng.pick(tiles), fight.rng.pick(SPOT.collapsingExplosion), { maxTicks: 5 });
      });
    }
    fight.after(u.escapeLine - u.obliteration, () => {
      fight.say(fight.rng.chance(0.5) ? "You can't... escape... the end..." : "This end... comes...", 3);
      boss.playAnimation(SEQ.p3UnleashOut90);
      boss.addSpotAnim({ id: SPOT.collapseOut1, channel: "collapse" });
    });
    fight.after(u.gone - u.obliteration, () => {
      const here = fight.playerTile;
      const onIt = quadrantOf(here) === q && !this.crossing?.hopping;
      fight.removeFloor(tiles);
      fight.destroyed.add(q);
      fight.setCrumbling([]);
      this.patches = this.patches.filter((p) => quadrantOf(p.tile) !== q);
      this.syncPatches();
      boss.pose = null;
      boss.hidden = true;
      boss.attackable = false;
      if (onIt) {
        fight.message("The void consumes you.", CHAT.red);
        fight.hit({ amount: () => 255 });
      }
      this.segment++;
      if (this.segment < P3.hpFloors.length) this.floorFraction = P3.hpFloors[this.segment];
    });
    fight.after(u.nextSegment - u.obliteration, () => {
      this.levitating = false;
      boss.hidden = false;
      if (this.segment >= 3) {
        this.finished = true;
        fight.enterPhase(4);
        return;
      }
      const here = quadrantOf(fight.playerTile);
      this.startSegment(here && !fight.destroyed.has(here) ? here : this.nearestStanding(q));
    });
  }

  private nearestStanding(from: Quadrant): Quadrant {
    for (const step of [-1, 1, 2]) {
      const q = clockwise(from, step);
      if (!this.fight.destroyed.has(q)) return q;
    }
    return from;
  }

  // ---- per tick ---------------------------------------------------------------------------------------------------

  step(): void {
    const { fight } = this;
    this.telegraphs = this.telegraphs.filter((t) => t.landsAt >= fight.tick);
    const before = this.patches.length;
    this.patches = this.patches.filter((p) => p.until > fight.tick);
    if (this.patches.length !== before) this.syncPatches();
    const here = fight.playerTile;
    const patch = this.patches.find((p) => same(p.tile, here));
    if (patch && (fight.tick - patch.placed) % 2 === 0) fight.hit({ amount: () => fight.rng.roll(P3.patchDamage) });
    this.stepCrossing();
    if (!this.levitating && !this.stationary) this.chase();
  }

  /** He walks after his tank, inside his own quadrant. */
  private chase(): void {
    const boss = this.boss;
    if (boss.hidden || this.inMelee()) return;
    const here = this.fight.playerTile;
    if (quadrantOf(here) !== this.quadrant) return;
    const sw = boss.tile;
    const centre = bodyCentre(this.body());
    const dx = sign(Math.round(here.x - centre.x));
    const dz = sign(Math.round(here.z - centre.z));
    const options = [at(sw.x + dx, sw.z + dz), at(sw.x + dx, sw.z), at(sw.x, sw.z + dz)];
    for (const next of options) {
      if (next.x === sw.x && next.z === sw.z) continue;
      const body: Body = { sw: next, size: 3 };
      if (covers(body, here)) continue;
      let fits = true;
      for (let x = 0; x < 3 && fits; x++) for (let z = 0; z < 3 && fits; z++) {
        const t = at(next.x + x, next.z + z);
        if (!this.fight.isWalkable(t) || quadrantOf(t) !== this.quadrant) fits = false;
      }
      if (fits) {
        boss.stepTo(next);
        return;
      }
    }
  }

  // ---- stepping stones and censers -------------------------------------------------------------------------------

  interceptWalk(to: ATile): boolean {
    const { fight } = this;
    if (this.crossing?.hopping) return true;
    for (const [q, censer] of fight.censers) {
      if (reach(to, censer.tile) <= 1) {
        this.useCenser(q);
        return true;
      }
    }
    const from = quadrantOf(fight.playerTile);
    if (from === null) return false;
    const stoneArm = ARMS.find((arm) => stonesOf(arm).some((s) => same(s, to)));
    let target: Quadrant | null = null;
    let arm: Arm | null = null;
    if (stoneArm) {
      arm = stoneArm;
      const [a, b] = quadrantsOfArm(stoneArm);
      target = from === a ? b : from === b ? a : null;
    } else {
      const dest = quadrantOf(to);
      if (dest && dest !== from) {
        arm = armBetween(from, dest);
        target = arm ? dest : null;
        if (!arm) {
          fight.message("You can't jump that far; cross one chasm at a time.", CHAT.game);
          return true;
        }
      }
    }
    if (!arm || !target) {
      this.crossing = null;
      return false;
    }
    if (fight.destroyed.has(target)) {
      fight.message("There is nothing left over there.", CHAT.game);
      return true;
    }
    const stones = stonesOf(arm);
    const bank = bankBeside(stones[0], arm, from);
    const landing = bankBeside(stones[2], arm, target);
    this.crossing = { arm, from, to: target, bank, hops: [...stones, landing], hopping: false };
    if (same(fight.playerTile, bank)) this.crossing.hopping = true;
    else fight.player.walkDirect(bank);
    return true;
  }

  private stepCrossing(): void {
    const crossing = this.crossing;
    if (!crossing) return;
    const { fight } = this;
    if (!crossing.hopping) {
      if (same(fight.playerTile, crossing.bank)) crossing.hopping = true;
      else if (!fight.player.destinationLocation) this.crossing = null;
      return;
    }
    const next = crossing.hops.shift();
    if (!next) {
      this.crossing = null;
      return;
    }
    fight.player.hop(next);
    fight.player.freeze(1);
    if (crossing.hops.length === 0) this.crossing = null;
  }

  private useCenser(q: Quadrant): void {
    const { fight } = this;
    const censer = fight.censers.get(q);
    if (!censer) return;
    if (censer.lit) {
      fight.message("The censer has already been lit.", CHAT.game);
      return;
    }
    if (quadrantOf(fight.playerTile) !== q) {
      fight.message("You need to be in this quadrant to light its censer.", CHAT.game);
      return;
    }
    fight.lightCenser(q);
    fight.player.addSpotAnim({ id: GOD_GLOW[censer.god], channel: "censer" });
    fight.message(`You light the ${GOD_NAME[censer.god]} censer.`, CHAT.purple);
    switch (censer.god) {
      case "bandos":
      case "armadyl":
        this.boss.grantMaxDamageRollsOnNextIncomingAttack();
        fight.message("Your next hit will be a maximum hit.", CHAT.purple);
        return;
      case "zaros":
        fight.player.currentStats.specialAttack = Math.min(100, fight.player.currentStats.specialAttack + 50);
        return;
      case "saradomin":
        fight.player.currentStats.hitpoint += 50;
        fight.player.currentStats.prayer = Math.min(fight.player.stats.prayer ?? 99, (fight.player.currentStats.prayer ?? 0) + 50);
        return;
      default: {
        const unhandled: never = censer.god;
        return unhandled;
      }
    }
  }

  tileActions(tile: ATile): readonly Readonly<{ label: string; target: string; run: () => void }>[] {
    const actions: { label: string; target: string; run: () => void }[] = [];
    for (const [q, censer] of this.fight.censers) {
      if (reach(tile, censer.tile) <= 1) actions.push({ label: "Interact", target: `${GOD_NAME[censer.god]} censer`, run: () => this.useCenser(q) });
    }
    if (ARMS.some((arm) => stonesOf(arm).some((s) => same(s, tile)))) {
      actions.push({ label: "Jump", target: "Stepping stone", run: () => this.interceptWalk(tile) });
    }
    return actions;
  }

  // ---- PhaseScript ------------------------------------------------------------------------------------------------

  hpFloor(): number {
    return Math.ceil(this.fight.poolMax * this.floorFraction);
  }

  allowsDeath(): boolean {
    return false;
  }

  acceptsAttack(style: Style): boolean {
    const boss = this.fight.boss;
    if (!boss) return false;
    return !(style === "melee" && boss.overhead === "protect-melee");
  }

  playerAttacking(target: Unit, style: Style): boolean {
    if (target !== this.fight.boss || style !== "melee" || !this.levitating) return true;
    if (this.fight.tick - this.lastFlyingMessage >= 3) {
      this.fight.message("It's flying too high to hit using melee.", CHAT.game);
      this.lastFlyingMessage = this.fight.tick;
    }
    return false;
  }

  meter(): number | null {
    return null;
  }

  onBossHit(): void {}

  marks(): readonly TileMark[] {
    const marks: TileMark[] = [];
    for (const t of this.telegraphs) for (const tile of t.tiles) marks.push({ tile, colour: t.colour === 0x2a0a3a ? 0xb01030 : t.colour, opacity: 0.35, inset: 0.06 });
    if (this.zone) {
      for (let x = 0; x < this.zone.size; x++) {
        for (let z = 0; z < this.zone.size; z++) {
          const tile = at(this.zone.sw.x + x, this.zone.sw.z + z);
          if (this.fight.isFloor(tile)) marks.push({ tile, colour: 0x9f48bd, opacity: this.zoneGlow === 2 ? 0.55 : this.zoneGlow === 1 ? 0.4 : 0.25, inset: 0.03 });
        }
      }
    }
    if (this.crossing) {
      marks.push({ tile: this.crossing.bank, colour: 0x2bff73, opacity: 0.35, inset: 0.1 });
      for (const hop of this.crossing.hops) marks.push({ tile: hop, colour: 0x2bff73, opacity: 0.2, inset: 0.2 });
    }
    return marks;
  }

  get done(): boolean {
    return this.finished;
  }
}

function sideQuadrant(t: ATile): Quadrant {
  if (t.x >= 0) return t.z >= 0 ? "NE" : "SE";
  return t.z >= 0 ? "NW" : "SW";
}

function quadrantsOfArm(arm: Arm): readonly [Quadrant, Quadrant] {
  const found = QUADRANTS.filter((q) => armsOf(q).includes(arm));
  return [found[0], found[1]];
}

function bodyCentreTile(body: Body): ATile {
  const c = bodyCentre(body);
  return at(Math.round(c.x), Math.round(c.z));
}

function lineBetween(a: ATile, b: ATile): ATile[] {
  const tiles: ATile[] = [];
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.z - a.z));
  for (let i = 1; i < steps; i++) tiles.push(at(Math.round(a.x + ((b.x - a.x) * i) / steps), Math.round(a.z + ((b.z - a.z) * i) / steps)));
  return tiles;
}

