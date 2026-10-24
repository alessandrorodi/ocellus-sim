import type { Unit } from "osrs-sdk";
import type { TileMark } from "./effects";
import type { Fight, PhaseScript } from "./Fight";
import { CHAT } from "./Fight";
import type { BossOverhead } from "./data";
import { P3, P4, SEQ, SOUND, SPOT, VOID_LOC } from "./data";
import type { ATile, Body, Quadrant } from "./geometry";
import { ARMS, CORNERS, QUADRANTS, at, bodyCentre, covers, distanceToBody, quadrantTiles, reach, same, stonesOf } from "./geometry";
import type { GroundSpot } from "./effects";
import { LocField } from "./locs";
import type { Style } from "./units";
import { VoidAdd } from "./units";

type Variant = "magic" | "ranged" | "melee";
type OrbKind = "inner" | "outer";
type Orb = { kind: OrbKind; tile: ATile; credit: number; readyAt: number; expiresAt: number; state: "dormant" | "ready" | "gone"; spot: GroundSpot | null };

const TELL: Readonly<Record<Variant, number>> = { magic: SPOT.hybridMagic, ranged: SPOT.hybridRanged, melee: SPOT.hybridMelee };
const CUES: Readonly<Record<Variant, readonly Readonly<{ sound: number; after: number; delayMs: number }>[]>> = {
  melee: [
    { sound: SOUND.meleeTell, after: 0, delayMs: 60 },
    { sound: SOUND.meleeHit, after: 5, delayMs: 60 },
  ],
  ranged: [
    { sound: SOUND.rangedBeforeHit, after: 4, delayMs: 240 },
    { sound: SOUND.rangedHit, after: 5, delayMs: 60 },
  ],
  magic: [{ sound: SOUND.magicWindUp, after: 2, delayMs: 120 }],
};

export class Phase4 implements PhaseScript {
  readonly label = "Phase 4";
  private quadrant: Quadrant = "SE";
  private firstCycle = 0;
  private orbs: Orb[] = [];
  private explosionMarks: { tile: ATile; landsAt: number }[] = [];
  private rifts: VoidAdd[] = [];
  private pending: Map<number, Variant> = new Map();
  private void: "inner" | "outer" | null = null;
  /** Where you stepped into his ring once the outer void came: the melee-phase orb forms across from it. [M] 15:40 */
  private entry: ATile | null = null;
  private dead = false;

  constructor(private readonly fight: Fight) {}

  private get boss() {
    const boss = this.fight.boss;
    if (!boss) throw new Error("phase 4 has no boss");
    return boss;
  }

  begin(): void {
    const { fight } = this;
    const direct = fight.options.startPhase === 4;
    if (direct) {
      // Straight to the last quadrant: the south-east one, as the reference footage and the P4 trainer measured it.
      this.quadrant = "SE";
      fight.setFloor(quadrantTiles("SE").filter((t) => Math.abs(t.x) > 2 || Math.abs(t.z) > 2));
      for (const q of QUADRANTS) if (q !== "SE") fight.destroyed.add(q);
      fight.setStones(ARMS.flatMap((arm) => stonesOf(arm)));
      fight.swapBoss("p3", CORNERS.SE, Math.round(fight.poolMax * 0.25), fight.poolMax);
      fight.message("Challenge started: Ocellus.", CHAT.game);
    } else {
      this.quadrant = QUADRANTS.find((q) => !fight.destroyed.has(q)) ?? "SE";
    }
    fight.barColour = "#00d900";
    const boss = this.boss;
    boss.teleport(CORNERS[this.quadrant]);
    boss.hidden = true;
    boss.attackable = false;
    boss.pose = null;
    fight.setOverhead(null);
    fight.after(P4.hiddenFor, () => {
      boss.hidden = false;
      boss.attackable = true;
      boss.face(fight.player);
    });
    fight.after(P4.shoutAt, () => fight.say("End...", 3));
    this.firstCycle = fight.tick + P4.firstCycleAt;
    if (fight.lingeringVoids.length > 0) {
      fight.region.addEntity(
        new LocField(fight.region, () =>
          fight.lingeringVoids.map((v) => ({ key: `bomb:${v.placed}:${v.tile.x},${v.tile.z}`, tile: v.tile, models: VOID_LOC.bomb.models })),
        ),
      );
    }
  }

  private body(): Body {
    return { sw: this.boss.tile, size: 3 };
  }

  /** His 3x3 and the tiles touching it: the safe square while the outer void is up. */
  private ring(): Body {
    return { sw: at(this.boss.tile.x - 1, this.boss.tile.z - 1), size: 5 };
  }

  /** Phase 3's voids left on this quadrant hurt as they did there. */
  private lingeringDamage(): void {
    const { fight } = this;
    const here = fight.playerTile;
    const v = fight.lingeringVoids.find((l) => same(l.tile, here));
    if (v && (fight.tick - v.placed) % 2 === 0) fight.hit({ amount: () => fight.rng.roll(P3.patchDamage) });
  }

  private inner(): ATile[] {
    const sw = this.boss.tile;
    const tiles: ATile[] = [];
    for (let x = -1; x <= 3; x++) for (let z = -1; z <= 3; z++) {
      const t = at(sw.x + x, sw.z + z);
      if (this.fight.isFloor(t)) tiles.push(t);
    }
    return tiles;
  }

  private outer(): ATile[] {
    const square: Body = { sw: at(this.boss.tile.x - 1, this.boss.tile.z - 1), size: 5 };
    return quadrantTiles(this.quadrant).filter((t) => this.fight.isFloor(t) && !covers(square, t));
  }

  private cycleOffset(): Readonly<{ offset: number; cycle: number }> | null {
    const since = this.fight.tick - this.firstCycle;
    if (since < 0) return null;
    return { offset: since % P4.cycle, cycle: Math.floor(since / P4.cycle) + 1 };
  }

  step(): void {
    if (this.dead) return;
    const now = this.cycleOffset();
    const { fight } = this;
    this.resolveExplosions();
    this.stepOrbs(now?.offset ?? -1);
    this.lingeringDamage();
    if (!now) return;
    const { offset: o, cycle } = now;
    if (o === P4.outerVoid.from) this.entry = null;
    if (this.void === "outer" && this.entry === null && covers(this.ring(), fight.playerTile)) this.entry = fight.playerTile;
    const boss = this.boss;
    this.applyOverhead(o);
    switch (o) {
      case 0:
        this.setVoid("inner");
        boss.playAnimation(SEQ.p3DeflectIn);
        boss.addSpotAnim({ id: SPOT.levitating, channel: "levitate" });
        break;
      case 2:
        boss.pose = SEQ.p3DeflectLoop;
        break;
      case 21:
        boss.pose = null;
        boss.playAnimation(SEQ.p3DeflectOut);
        break;
      case 22:
        this.setVoid(null);
        break;
      case 31:
        this.setVoid("outer");
        break;
      case 51:
        this.setVoid(null);
        break;
      case 59:
        this.spawnRifts(Math.min(4, cycle + 1));
        break;
      default:
        break;
    }
    P4.winds.forEach((w, i) => {
      if (o === w - 1) {
        boss.playAnimation(SEQ.p3SoulFragmentStart);
        fight.player.addSpotAnim({ id: SPOT.soulFragmentPlayer, channel: "fragment" });
        fight.message("Ocellus manipulates your lifeforce!", CHAT.purple);
      }
      if (o === w) this.wind(i === 0 ? "inner" : "outer");
      if (o === w + 2) {
        fight.player.addSpotAnim({ id: SPOT.voidChainTelegraph, channel: "telegraph" });
        fight.sound(SOUND.explosionSeriesStart);
      }
    });
    for (const marks of P4.explosionMarks) {
      if (marks.some((mark) => mark === o)) {
        const tile = fight.playerTile;
        this.explosionMarks.push({ tile, landsAt: fight.tick + 1 });
        fight.spot(tile, SPOT.voidChainExplosion, { maxTicks: 3 });
        fight.sound(SOUND.explosionMark);
      }
    }
    P4.hybrids.forEach((h) => {
      if (o === h) this.tellHybrid(h);
      if (o === h + P4.hybridHitAfter) this.hitHybrid(h);
    });
    this.floorDamage(o);
  }

  private applyOverhead(o: number): void {
    let overhead: BossOverhead | null = null;
    for (const window of P4.overheads) if (o >= window.from && o < window.to) overhead = window.overhead;
    this.fight.setOverhead(overhead);
  }

  private setVoid(kind: "inner" | "outer" | null): void {
    this.void = kind;
    this.fight.setVoidLayer("p4", kind === "inner" ? this.inner() : kind === "outer" ? this.outer() : null);
  }

  private floorDamage(o: number): void {
    const { fight } = this;
    const here = fight.playerTile;
    const inInner = this.void === "inner" && o >= P4.innerVoid.from + P4.floorGraceInner && this.inner().some((t) => same(t, here));
    const inOuter = this.void === "outer" && o >= P4.outerVoid.from + P4.floorGraceOuter && this.outer().some((t) => same(t, here));
    if (inInner || inOuter) fight.hit({ amount: () => fight.rng.roll(P4.floorDamage) });
  }

  private wind(kind: OrbKind): void {
    const { fight } = this;
    fight.player.addSpotAnim({ id: SPOT.deflectWind, channel: "wind" });
    fight.hit({
      amount: () => Math.floor(fight.player.currentStats.hitpoint / 2),
      onLand: (applied) => this.spawnOrb(kind, applied),
    });
  }

  private spawnOrb(kind: OrbKind, credit: number): void {
    const { fight } = this;
    const body = this.body();
    const square: Body = { sw: at(body.sw.x - 1, body.sw.z - 1), size: 5 };
    const candidates = quadrantTiles(this.quadrant).filter((t) => {
      if (!fight.isFloor(t) || covers(body, t)) return false;
      const d = distanceToBody(body, t);
      return kind === "inner" ? d >= 2 && d <= 5 && !covers(square, t) : d === 1;
    });
    if (candidates.length === 0) return;
    const tile = kind === "outer" ? this.across(candidates, this.entry ?? fight.playerTile) : fight.rng.pick(candidates);
    const readyAfter = P4.orbReadyAfterWind[kind === "inner" ? 0 : 1];
    // The orb shows a tick after the wind and glows when ready.
    fight.after(1, () => {
      const spot = fight.spot(tile, kind === "inner" ? SPOT.soulFragmentSpawn12 : SPOT.soulFragmentSpawn6, { maxTicks: readyAfter + 1 });
      const orb: Orb = { kind, tile, credit, readyAt: fight.tick + readyAfter - 1, expiresAt: fight.tick + readyAfter - 1 + P4.orbExpiresAfterReady, state: "dormant", spot };
      this.orbs = [...this.orbs.filter((o) => o.kind !== kind), orb];
    });
  }

  /** The candidate nearest the point straight across his body from `from`. */
  private across(candidates: ATile[], from: ATile): ATile {
    const centre = bodyCentre(this.body());
    const target = { x: 2 * centre.x - from.x, z: 2 * centre.z - from.z };
    const distance = (t: ATile) => Math.hypot(t.x - target.x, t.z - target.z);
    const best = Math.min(...candidates.map(distance));
    return this.fight.rng.pick(candidates.filter((t) => distance(t) - best < 0.01));
  }

  private stepOrbs(_o: number): void {
    const { fight } = this;
    for (const orb of this.orbs) {
      if (orb.state === "gone") continue;
      if (orb.state === "dormant" && fight.tick >= orb.readyAt) {
        orb.state = "ready";
        orb.spot?.stop();
        orb.spot = fight.spot(orb.tile, SPOT.soulFragmentIdle, { loopTicks: P4.orbExpiresAfterReady, maxTicks: P4.orbExpiresAfterReady + 1 });
      }
      if (orb.state === "ready" && same(fight.playerTile, orb.tile)) {
        const bonus = fight.tick === orb.readyAt ? P4.orbFirstTickBonus : 0;
        orb.state = "gone";
        orb.spot?.stop();
        fight.spot(orb.tile, SPOT.soulFragmentDespawn, { maxTicks: 3 });
        // The heal and the regain spotanim come on the pickup tick. [K]
        const amount = orb.credit + bonus;
        fight.healPlayer(amount, true);
        fight.player.addSpotAnim({ id: SPOT.soulFragmentRegain, channel: "fragment" });
        fight.message(`You reclaim your lifeforce (+${amount}).`, CHAT.green);
        continue;
      }
      if (fight.tick >= orb.expiresAt) {
        orb.state = "gone";
        orb.spot?.stop();
        fight.spot(orb.tile, SPOT.soulFragmentDespawn, { maxTicks: 3 });
        if (orb.credit > 0) {
          fight.healBoss(orb.credit);
          fight.sound(SOUND.heal, this.boss.tile);
          fight.message("Ocellus absorbs your unclaimed lifeforce.", CHAT.red);
        }
      }
    }
    this.orbs = this.orbs.filter((o) => o.state !== "gone");
  }

  private resolveExplosions(): void {
    const { fight } = this;
    const due = this.explosionMarks.filter((m) => m.landsAt <= fight.tick);
    this.explosionMarks = this.explosionMarks.filter((m) => m.landsAt > fight.tick);
    for (const mark of due) {
      const here = fight.playerTile;
      if (same(mark.tile, here)) fight.hit({ amount: () => fight.rng.roll(P4.explosionDamage) });
      // Dodged by a tile: the attack timer resets, so this tick can attack. Move, attack, move: 2-tick. [M] 12:50
      else if (reach(mark.tile, here) <= P4.explosionResetReach) fight.player.attackDelay = Math.min(fight.player.attackDelay, 1);
    }
  }

  private tellHybrid(slot: number): void {
    const { fight } = this;
    const boss = this.boss;
    const variant: Variant = fight.rng.pick(["magic", "ranged", "melee"]);
    this.pending.set(slot, variant);
    boss.playAnimation(SEQ.p3MeleeHybrid);
    boss.addSpotAnim({ id: TELL[variant], channel: "transition-tell", recolor: { 4: 0x020203 } });
    for (const cue of CUES[variant]) {
      if (cue.after === 0) fight.sound(cue.sound, boss.tile, cue.delayMs);
      else fight.after(cue.after, () => fight.sound(cue.sound, boss.tile, cue.delayMs));
    }
  }

  private hitHybrid(slot: number): void {
    const { fight } = this;
    const variant = this.pending.get(slot) ?? "magic";
    this.pending.delete(slot);
    fight.hit({
      amount: (prayer) => fight.rng.roll(prayer === variant ? P4.hybridProtected : P4.hybridUnprotected),
      onLand: (applied) => {
        if (applied >= P4.hybridUnprotected.min) fight.after(2, () => fight.healBoss(applied));
      },
    });
  }

  private spawnRifts(count: number): void {
    const { fight } = this;
    const tiles = quadrantTiles(this.quadrant).filter((t) => fight.isFloor(t) && distanceToBody(this.body(), t) >= 2);
    for (const tile of fight.rng.shuffle(tiles).slice(0, count)) {
      const rift = new VoidAdd(fight.region, tile, "rift-basic", () => {
        this.rifts = this.rifts.filter((r) => r !== rift);
        fight.message("Destroying the void rift empowers you!", CHAT.purple);
        this.boss.grantMaxDamageRollsOnNextIncomingAttack();
      });
      fight.region.addMob(rift);
      this.rifts.push(rift);
      // Left alive, it detonates 30 ticks on and hits you. [K]
      fight.after(P3.riftDetonatesAfter, () => {
        if (rift.killed || !this.rifts.includes(rift)) return;
        this.rifts = this.rifts.filter((r) => r !== rift);
        rift.remove();
        fight.spot(tile, SPOT.voidChainExplosion, { maxTicks: 3 });
        for (const amount of P4.riftDetonationHits) fight.hit({ amount: () => amount });
      });
    }
  }

  // ---- PhaseScript ------------------------------------------------------------------------------------------------

  onBossHit(): void {
    const boss = this.fight.boss;
    if (this.dead || !boss || boss.currentStats.hitpoint > 0) return;
    this.dead = true;
    this.setVoid(null);
    this.fight.setOverhead(null);
    boss.pose = null;
    boss.playAnimation(SEQ.p3Death);
    boss.addSpotAnim({ id: SPOT.death, channel: "death" });
    boss.addSpotAnim({ id: SPOT.deathSkirt, channel: "death-skirt" });
    boss.addSpotAnim({ id: SPOT.deathCrack, channel: "death-crack" });
    this.rifts.forEach((r) => r.remove());
    this.fight.win();
  }

  hpFloor(): number {
    return 0;
  }

  allowsDeath(): boolean {
    return this.dead;
  }

  acceptsAttack(style: Style): boolean {
    const overhead = this.fight.boss?.overhead ?? null;
    if (overhead === "deflect-melee") return style !== "melee";
    if (overhead === "deflect-range") return style === "melee";
    return true;
  }

  incomingDamageFactor(): number {
    const now = this.cycleOffset();
    if (!now) return 1;
    const exploding = P4.explosionMarks.some((marks) => now.offset >= marks[0] && now.offset <= marks[marks.length - 1] + 1);
    return exploding ? 0.5 : 1;
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

  marks(): readonly TileMark[] {
    const marks: TileMark[] = [];
    for (const m of this.explosionMarks) marks.push({ tile: m.tile, colour: 0x5e317b, opacity: 0.55, inset: 0.05 });
    for (const orb of this.orbs) marks.push({ tile: orb.tile, colour: orb.state === "ready" ? 0x7cecb2 : 0x20251e, opacity: 0.45, inset: 0.15 });
    if (this.void === null) {
      const now = this.cycleOffset();
      if (now && now.offset >= 27 && now.offset < 31) {
        const square: Body = { sw: at(this.boss.tile.x - 1, this.boss.tile.z - 1), size: 5 };
        for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) {
          const tile = at(square.sw.x + x, square.sw.z + z);
          if (this.fight.isFloor(tile) && !covers(this.body(), tile)) marks.push({ tile, colour: 0x2bff73, opacity: 0.22, inset: 0.08 });
        }
      }
    }
    return marks;
  }
}

