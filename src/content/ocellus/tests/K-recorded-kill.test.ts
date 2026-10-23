import { Settings, TrainerInstance, Viewport } from "osrs-sdk";
import type { Range } from "../fight/data";
import { P3, P4, SEQ, SPOT } from "../fight/data";
import type { SpotOptions } from "../fight/effects";
import type { FightOptions, HitSpec } from "../fight/Fight";
import { FightRegion } from "../fight/FightRegion";
import type { ATile, Body } from "../fight/geometry";
import { at, covers, distanceToBody } from "../fight/geometry";
import { BossForm } from "../fight/units";

/**
 * Phases 3 and 4 against a RuneLite fight log of a spectated 8-raider kill, 2026-10-23 ([K] in docs/SOURCES.md).
 * Ticks in the comments are the log's.
 */

type Hit = Readonly<{ tick: number; style: HitSpec["style"] | null }>;

const SWING = SEQ.p3MeleeBasic;
const SLASH = SEQ.p3MeleeSlash;
const PANIC = SEQ.p3ProjectileAll;

describe("phase 3 and 4 follow the recorded kill [K]", () => {
  let restore: (() => void)[] = [];
  afterEach(() => {
    jest.restoreAllMocks();
    restore.forEach((r) => r());
    restore = [];
  });

  /** A fight that records his animations, shouts, hits on you and chat by tick. */
  function recorded(startPhase: 3 | 4) {
    Settings.readFromStorage();
    const options: FightOptions = { seed: 1, party: 1, startPhase, hazardTiles: true, videoMarkers: false, skipMarkers: false, soloVine: true, invincible: true };
    const region = new FightRegion(options, () => undefined);
    const trainer = new TrainerInstance(region, { force2d: true });
    trainer.mount(document.createElement("canvas"), document.createElement("div"));
    region.world.getReadyTimer = 0;
    Viewport.viewport.resize(800, 600);
    const fight = region.fight;
    if (!fight) throw new Error("the region built no fight");
    restore.push(() => trainer.dispose());

    const anims: (readonly [number, number])[] = [];
    const shouts: (readonly [number, string])[] = [];
    const hits: Hit[] = [];
    const messages: (readonly [number, string])[] = [];
    jest.spyOn(BossForm.prototype, "playAnimation").mockImplementation((id: number) => {
      anims.push([fight.tick, id]);
      return Promise.resolve();
    });
    const say = fight.say.bind(fight);
    jest.spyOn(fight, "say").mockImplementation((text: string, ticks?: number) => {
      shouts.push([fight.tick, text]);
      say(text, ticks);
    });
    const hit = fight.hit.bind(fight);
    jest.spyOn(fight, "hit").mockImplementation((spec: HitSpec) => {
      hits.push({ tick: fight.tick, style: spec.style ?? null });
      hit(spec);
    });
    const message = fight.message.bind(fight);
    jest.spyOn(fight, "message").mockImplementation((text: string, colour?: string) => {
      messages.push([fight.tick, text]);
      message(text, colour);
    });
    const spots: (readonly [number, number, ATile])[] = [];
    const spot = fight.spot.bind(fight);
    jest.spyOn(fight, "spot").mockImplementation((tile: ATile, id: number, options?: SpotOptions) => {
      spots.push([fight.tick, id, tile]);
      return spot(tile, id, options);
    });

    const boss = () => {
      if (!fight.boss) throw new Error("no boss");
      return fight.boss;
    };
    const body = (): Body => ({ sw: boss().tile, size: 3 });
    /** One tick: the fight steps at its start, then you act; anything done after it is where you end the tick. */
    const tick = () => region.world.tickWorld();
    const tickTo = (t: number, each: () => void = () => undefined) => {
      while (fight.tick < t) {
        tick();
        each();
      }
    };
    /** Stand beside his 3x3, square on, so every swing reaches you. */
    const stayInReach = () => {
      const b = boss();
      if (b.hidden || distanceToBody(body(), fight.playerTile) === 1) return;
      const sw = b.tile;
      const sides: ATile[] = [at(sw.x - 1, sw.z + 1), at(sw.x + 3, sw.z + 1), at(sw.x + 1, sw.z - 1), at(sw.x + 1, sw.z + 3)];
      const side = sides.find((t) => fight.isWalkable(t));
      if (side) fight.player.hop(side);
    };
    const from = (start: number, kinds: readonly number[]) => anims.filter(([t, id]) => t >= start && kinds.includes(id)).map(([t, id]) => [t - start, id]);
    /** His HP at a whole-number percentage of the pool. */
    const bossAt = (percent: number) => (boss().currentStats.hitpoint = Math.ceil((fight.poolMax * percent) / 100));
    const said = (text: string, start: number) => shouts.filter(([, s]) => s === text).map(([t]) => t - start);
    return { fight, boss, body, tick, tickTo, stayInReach, anims, shouts, hits, messages, spots, from, bossAt, said };
  }

  /** Phase 3 begins on tick 0 and he lands in his first corner P3.jumpToCornerAfter later: the segment start S. */
  const S = P3.jumpToCornerAfter;

  test("the first quadrant: two sets, the spin, two sets, Untether, and the quadrant falls 31 ticks on", () => {
    const f = recorded(3);
    f.tickTo(S + 50, f.stayInReach);
    // 76% as his second special comes, as in both kills (t528 and t304): Untether.
    f.bossAt(76);
    f.tickTo(S + 52, f.stayInReach);
    // His HP reaches the floor during Untether, as in [K] (75% at t541, U+11).
    f.tickTo(S + 53 + 11);
    f.bossAt(75);
    f.tickTo(S + 96);
    const kinds = [SWING, SLASH, PANIC, SEQ.p3PrayerIn, SEQ.p3PrayerLoop, SEQ.p3PrayerOut, SEQ.p3UnleashIn, SEQ.p3UnleashOut, SEQ.p3QuadrantDestroyIn, SEQ.p3UnleashOut90];
    // [K] from S = t477: 481 484 487 | 491 494 497 | spin 501, end 506 | 510 513 516 | 520 523 526 | Untether 530,
    // slam 559, "Run..." 561, 572.
    expect(f.from(S, kinds)).toEqual([
      [4, SWING], [7, SWING], [10, SLASH],
      [14, SWING], [17, SWING], [20, SLASH],
      [24, SEQ.p3PrayerIn], [29, SEQ.p3PrayerOut],
      [33, SWING], [36, SWING], [39, SLASH],
      [43, SWING], [46, SWING], [49, SLASH],
      [53, SEQ.p3UnleashIn], [82, SEQ.p3UnleashOut], [84, SEQ.p3QuadrantDestroyIn], [95, SEQ.p3UnleashOut90],
    ]);
    expect(f.said("Untether...", S)).toEqual([53]);
  });

  test("far from the floor, his second special is Insolence: bands land 5, 10 and 15 on, swings 20 on", () => {
    const f = recorded(3);
    const I = S + 53;
    const bands: number[] = [];
    const roll = f.fight.rng.roll.bind(f.fight.rng);
    jest.spyOn(f.fight.rng, "roll").mockImplementation((damage: Range) => {
      if (damage === P3.insolenceDamage) bands.push(f.fight.tick - I);
      return roll(damage);
    });
    f.tickTo(I + 21, f.stayInReach);
    expect(f.said("Insolence...", I)).toEqual([0]);
    expect(f.from(I, [SEQ.p3SuperiorSlash, SWING, SEQ.p3UnleashIn])).toEqual([[2, SEQ.p3SuperiorSlash], [7, SEQ.p3SuperiorSlash], [12, SEQ.p3SuperiorSlash], [20, SWING]]);
    // Standing beside him you are in each band toward you.
    expect(bands).toEqual([5, 10, 15]);
  });

  test("the specials carry on across quadrants: a floor reached mid-spin drops it on the last cut, and Insolence opens the next", () => {
    const f = recorded(3);
    const P = S + 24;
    f.tickTo(P + 2, f.stayInReach);
    f.bossAt(75);
    f.tickTo(P + 6, f.stayInReach);
    // [K] kill 2: the floor on t452, three ticks into the spin; "Obliteration..." with the last cut on t457.
    expect(f.from(P, [SEQ.p3PrayerOut, SEQ.p3QuadrantDestroyIn])).toEqual([[5, SEQ.p3PrayerOut], [5, SEQ.p3QuadrantDestroyIn]]);
    // He lands in the next quadrant 17 ticks after it falls; after a spin comes the other special: Insolence, as
    // kill 2's third quadrant opened.
    const S2 = P + 5 + P3.untether.nextSegment - P3.untether.obliteration;
    f.tickTo(S2 + 26, f.stayInReach);
    expect(f.said("Insolence...", S2)).toEqual([24]);
    expect(f.from(S2, [SEQ.p3PrayerIn])).toEqual([]);
  });

  test("the vine: shouted with his first move after a quadrant's opening spin, rooting you 3 ticks later", () => {
    const f = recorded(3);
    f.tickTo(S + 37, f.stayInReach);
    // [K] kill 2: the shout with the swing on t285 (spin end + 4), the vine on t288.
    const shout = f.shouts.filter(([, s]) => s === "The void... will take you..." || s === "Await... the void...").map(([t]) => t - S);
    expect(shout).toEqual([33]);
    expect(f.messages.filter(([, m]) => m === "You've been rooted in place!").map(([t]) => t - S)).toEqual([36]);
  });

  test("swings land on the animation tick, the shadow slash the tick after its own", () => {
    const f = recorded(3);
    f.tickTo(S + 12, f.stayInReach);
    const melee = f.hits.filter((h) => h.style === "melee").map((h) => h.tick - S);
    expect(melee).toEqual([4, 7]);
    // Standing beside him, square on, you are in the band toward you: it lands on S+11.
    expect(f.hits.filter((h) => h.style === null).map((h) => h.tick - S)).toContain(11);
  });

  test("a panic shot takes the first swing's place and the chain runs 3 ticks late", () => {
    const f = recorded(3);
    f.tickTo(S + 3, f.stayInReach);
    // Out of his reach (another quadrant) as his first move comes.
    f.fight.player.hop(at(8, 8));
    f.tickTo(S + 4);
    f.tickTo(S + 28, f.stayInReach);
    // [K]'s second quadrant from S = t578: panic 582, 588, slash 591 | 595 598 601 | spin 605.
    expect(f.from(S, [SWING, SLASH, PANIC, SEQ.p3PrayerIn])).toEqual([
      [4, PANIC], [10, SWING], [13, SLASH],
      [17, SWING], [20, SWING], [23, SLASH],
      [27, SEQ.p3PrayerIn],
    ]);
    expect(f.hits.filter((h) => h.style === "magic").map((h) => h.tick - S)).toEqual([4]);
  });

  test("the spin: each saw cuts on its loop animation, 5 + 3i in; an overhead up the tick before is severed", () => {
    const f = recorded(3);
    // Two quadrants down: three saws, as in [K]'s third quadrant.
    f.fight.destroyed.add("NW");
    f.fight.destroyed.add("NE");
    f.tickTo(S + 24, f.stayInReach);
    const P = S + 24;
    f.tickTo(P + 3, f.stayInReach);
    f.fight.player.prayerController.findPrayerByName("Protect from Melee").toggle(f.fight.player);
    f.tickTo(P + 16, f.stayInReach);
    // [K] from P = t715: loop 720, end 726, swing 730.
    expect(f.from(P, [SEQ.p3PrayerIn, SEQ.p3PrayerLoop, SEQ.p3PrayerOut, SWING])).toEqual([
      [0, SEQ.p3PrayerIn], [5, SEQ.p3PrayerLoop], [8, SEQ.p3PrayerLoop], [11, SEQ.p3PrayerOut], [15, SWING],
    ]);
    const severed = f.messages.filter(([, text]) => text.includes("severing your prayer")).map(([t]) => t - P);
    expect(severed[0]).toBe(4);
    expect(f.hits.filter((h) => h.style === "melee" && h.tick > P && h.tick < P + 12).map((h) => h.tick - P)).toEqual([5, 8, 11]);
  });

  describe("Untether: under his 3x3 by U+28, one tile out on U+29", () => {
    const U = S + 53;
    /** Where you end each tick from U+27 to U+29 (and wait until then): under him or one tile out. */
    function untether(plan: Readonly<Record<27 | 28 | 29, "under" | "out">>) {
      const f = recorded(3);
      f.tickTo(U - 3, f.stayInReach);
      f.bossAt(76);
      f.tickTo(U - 1, f.stayInReach);
      f.tickTo(U + 1);
      const under = at(f.boss().tile.x + 1, f.boss().tile.z + 2);
      const out = at(f.boss().tile.x + 1, f.boss().tile.z + 3);
      // Off the bombs' voids by his side, onto clean floor.
      f.fight.player.hop(plan[27] === "under" ? under : out);
      for (const t of [27, 28, 29] as const) {
        f.tickTo(U + t);
        f.fight.player.hop(plan[t] === "under" ? under : out);
        expect(covers(f.body(), f.fight.playerTile)).toBe(plan[t] === "under");
      }
      f.tickTo(U + 31);
      return { typeless: f.hits.filter((h) => h.style === null && h.tick > U + 20).map((h) => h.tick - U), magic: f.hits.filter((h) => h.style === "magic").map((h) => h.tick - U), f };
    }

    test("the magic lands 10, 14, 18 and 22 ticks in", () => {
      // Each shot is queued 2 ticks before it lands.
      expect(untether({ 27: "under", 28: "under", 29: "out" }).magic).toEqual([8, 12, 16, 20]);
    });

    test("under by the end of 28 and out at the end of 29: nothing", () => {
      expect(untether({ 27: "under", 28: "under", 29: "out" }).typeless).toEqual([]);
    });

    test("out at the end of 28: the slam on 29", () => {
      expect(untether({ 27: "under", 28: "out", 29: "out" }).typeless).toEqual([29]);
    });

    test("still under at the end of 29: the aftershock on 30", () => {
      expect(untether({ 27: "under", 28: "under", 29: "under" }).typeless).toEqual([30]);
    });

    test("outside the whole time: only the slam, no eruption hit", () => {
      expect(untether({ 27: "out", 28: "out", 29: "out" }).typeless).toEqual([29]);
    });
  });

  test("a quadrant at its HP floor falls the tick after the set's slash, without Untether", () => {
    const f = recorded(3);
    f.tickTo(S + 8, f.stayInReach);
    f.boss().currentStats.hitpoint = Math.ceil(f.fight.poolMax * P3.hpFloors[0]);
    f.tickTo(S + 14, f.stayInReach);
    // [K]'s second quadrant: floor reached on t671 between swing 670 and slash 673; "Obliteration..." on 674.
    expect(f.from(S, [SWING, SLASH, SEQ.p3QuadrantDestroyIn])).toEqual([[4, SWING], [7, SWING], [10, SLASH], [11, SEQ.p3QuadrantDestroyIn]]);
  });

  test("between moves, a quadrant at its HP floor falls the next tick", () => {
    const f = recorded(3);
    f.tickTo(S + 11, f.stayInReach);
    f.boss().currentStats.hitpoint = Math.ceil(f.fight.poolMax * P3.hpFloors[0]);
    f.tickTo(S + 14, f.stayInReach);
    // [K]'s third quadrant: slash 786, floor 788, "Run..." 789.
    expect(f.from(S, [SWING, SLASH, SEQ.p3QuadrantDestroyIn])).toEqual([[4, SWING], [7, SWING], [10, SLASH], [12, SEQ.p3QuadrantDestroyIn]]);
  });

  test("phase 4: \"End...\" 1 tick in and his first Deflect 4 ticks in", () => {
    const f = recorded(4);
    f.tickTo(8);
    expect(f.shouts.filter(([, text]) => text === "End...").map(([t]) => t)).toEqual([1]);
    expect(f.anims.filter(([, id]) => id === SEQ.p3DeflectIn).map(([t]) => t)).toEqual([4]);
  });

  test("phase 4: the orbs are ready 16 and 42 ticks into the cycle, and taking one heals on that tick", () => {
    const f = recorded(4);
    const D = P4.firstCycleAt;
    // Wait on each orb's tile from the tick it shows.
    for (const [shows, id] of [[D + P4.winds[0] + 1, SPOT.soulFragmentSpawn12], [D + P4.winds[1] + 1, SPOT.soulFragmentSpawn6]] as const) {
      f.tickTo(shows);
      const orb = f.spots.find(([t, spot]) => t === shows && spot === id);
      if (!orb) throw new Error(`no orb shown on ${shows}`);
      f.fight.player.hop(orb[2]);
    }
    f.tickTo(D + 44);
    // [K] kill 2, both cycles: the first 4314 (the lifeforce back) on raiders at D+16 and D+42, with the heal.
    expect(f.messages.filter(([, m]) => m.startsWith("You reclaim your lifeforce")).map(([t]) => t - D)).toEqual([16, 42]);
  });
});
