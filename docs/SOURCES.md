# Sources

Where every timing, damage number and id in the full-fight simulator comes from. The tags match the comments in
`src/content/ocellus/fight/data.ts`.

| Tag | Source | What it gives | Trust |
|---|---|---|---|
| **[R]** | [ocellus_plan.md](https://github.com/MRobertEvers/oldschool-clientc/blob/HEAD/docs/rsprox-analysis/guthixian_archive/ocellus_plan.md) and [RAID_PLAN.md](https://github.com/MRobertEvers/oldschool-clientc/blob/HEAD/docs/rsprox-analysis/guthixian_archive/RAID_PLAN.md) in MRobertEvers/oldschool-clientc | A tick-exact analysis of six recorded fights (RSProx packet captures of spectated runs, including B0aty's 4-raider run): every phase's timeline, crack geometry, the meter, portal rounds, segment schedules, damage ranges, the HP scaling formula | Highest. Server events to the tick; damage attribution approximate. No licence, so it is linked here, not copied |
| **[T]** | [Julian-Dasilva/ArchiveOcellusTrainer](https://github.com/Julian-Dasilva/ArchiveOcellusTrainer) (GPL-3.0), `src/content/ocellus/js/OcellusTimings.ts` | The phase 4 timings this repo started from, each with its VOD evidence, plus animation, spotanim and sound ids | High for phase 4; it agrees with [R] to the tick |
| **[W]** | OSRS Wiki: [Ocellus](https://oldschool.runescape.wiki/w/Ocellus), [The Fractured Archive/Strategies](https://oldschool.runescape.wiki/w/The_Fractured_Archive/Strategies), [Transcript:Ocellus](https://oldschool.runescape.wiki/w/Transcript:Ocellus) | Stats from the cache, the four-phase strategy guide, dialogue lines, censer effects | Stats confirmed; mechanics prose is community-written and was still changing on release week |
| **[J]** | Jagex news: [The Fractured Archive - Out Today](https://secure.runescape.com/m=news/the-fractured-archive---out-today?oldschool=1) (incl. the 21 Oct hotfix), [Everything You Need To Know](https://secure.runescape.com/m=news/the-fractured-archive---everything-you-need-to-know?oldschool=1) | Defence floor (60%), P3 overhead fix, solo uses the duo scale, no hard mode | Confirmed |
| **[G]** | RuneLite gameval: [AnimationID](https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/gameval/AnimationID.java), [SpotanimID](https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/gameval/SpotanimID.java), [NpcID](https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/gameval/NpcID.java) | Cache ids for every Ocellus seq, spotanim and NPC (cache rev 241) | Confirmed |
| **[V]** | [Duo The Fractured Archive (ShadowStalkerTM)](https://www.youtube.com/watch?v=HAgq_qg0OIY), Ocellus from 12:45 to 25:10 | Visual check of every phase, the teal P1 / green P2+ boss bar, "You've been injured and can't use protection prayers!" during Untether, "Destroying the void rift/augmenter empowers you!", the 12:17 duo kill | Footage, single run |
| **Cache** | OpenRS2 cache [2746](https://archive.openrs2.org/caches/runescape/2746) (OSRS build 241, 2026-10-20) | Models, animations, effects and sounds, extracted at build time by `osrs-sdk-assets`; nothing from the cache is committed | Confirmed. No XTEA keys yet, so the arena map is drawn by hand |
| **[O]** | The owner, a player of the fight, checked against [V] | Phase 2's skip, the HP-driven quadrant falls, tendrils that cost nothing in the end | Player knowledge |
| **[K]** | RuneLite fight logs, spectating two 8-raider kills on 2026-10-23 (kill 1 and kill 2) | Every Ocellus anim, floor spotanim and projectile by tick, every raider's hitsplats with the overhead they had up, and raider positions around the Untether slam. Kill 2 adds spotanims on the boss and every raider, NPC spawns and per-tick overheads through the spin. Confirmed phase 1, phase 2 and phase 4's cycle; corrected phase 1's beat cracks, phase 3's chain and special order, the spin, Untether, bombs, Insolence, the vine, phase 4's start and its orbs | Highest for what it logged. One team; phase 4's orb and explosion tiles never show (no floor graphic) |
| **[M]** | [Molgoatkirby's Ocellus guide](https://www.youtube.com/watch?v=GU8_yiucWtk) (narrated, day 3), with the [tile ragging video](https://www.youtube.com/watch?v=hR71l7hzuKM) and [markers](https://pastebin.com/6D7SEWEm) it links | Void bombs that stay into phase 4, the spin's rubble, magic through Untether, the tick-perfect step out, six attacks between specials, phase 4's 2-tick reset and its orb | Player knowledge, footage |

## Engine

- [osrs-sdk](https://github.com/OldSchoolSDK/osrs-sdk) (GPL-3.0), beta branch `feat/cache-render-bundle` pinned at
  `c7d9693`, the engine behind [colosim.com](https://colosim.com) (Sol Heredit) and
  [infernotrainer.com](https://www.infernotrainer.com).
- [osrscachereader](https://github.com/Julian-Dasilva/osrscachereader) fork pinned at `8ba9131` (a build 241 decoder fix).

## Decisions where the sources disagree or are silent

- **Phase 2 skip.** [R] gives the volley's flight (the tile d out lands at 6d - 6 client cycles; 5 for the
  all-twelve volley) but not how hits are judged. Per [O] each tile is judged on the tick the volley is over it
  (tiles 1-5 the firing tick, 6-10 the next), so running through the wave skips it, as with the Wardens' skulls in
  Tombs of Amascut. That reproduces [J R V's skip](https://www.youtube.com/watch?v=c4PSUxjNUiY): stand 6 out
  diagonally, click 4 out one tick before each volley.
- **Phase 3 is a chain, not a clock.** [R] gives fixed timelines from each segment's start; [K] shows each move timed
  from the one before: swing, swing 3 later, shadow slash 3 later, and the next move 4 after the slash. After two
  sets comes a special. A panic shot takes a swing's place and the next move comes 6 ticks after it, so kill 1's second
  quadrant ran 3 ticks late from its first move. The chain reproduces [R]'s timelines, whose later segments have a
  panic after each spin. Bombs and the rifts stay on the segment's clock (kill 1's bombs came at S+4 through a panic;
  kill 2's rifts at S+3 and S+51, as [R]'s).
- **Phase 3's special order.** It alternates through the whole phase and carries on from quadrant to quadrant: the
  spin, then the other special, which is Untether when his whole-number HP% is within 2 of the quadrant's floor (76%
  and 27% in [K]) and Insolence otherwise (59%, 35%, 61%, 46%). Kill 1 went S U | S I | S I, kill 2 S U | S I S | I S U.
  [R]'s fixed first and later rotations were fast teams' versions of the same order. The sim keeps [V]'s one Untether
  a quadrant.
- **Quadrant falls.** [R]'s two fights and every Untether in [K] collapse 31 ticks after Untether with his HP already
  at the floor. [W], [O] and the duo's HP bar ([V], 18:20-18:26, 20:42-20:43, 23:21) say the quadrant falls once his
  whole-number HP% shows 75 / 50 / 25 (under 76% and so on). Three of [K]'s quadrants never reached Untether: his HP
  held at the floor and the quadrant fell as his current move landed (kill 1: as a set's slash landed, t674, and the
  tick after the floor between moves, t789; kill 2: on the spin's last cut, t457, the floor reached 5 ticks before).
  The sim drops the quadrant on the tick his current move lands, or the next tick he is free.
- **The vine.** [K]: "The void... will take you..." / "Await... the void..." comes with his first move after a spin
  that opens a quadrant (S+33, S+36, S+39 and S+39 in four quadrants: always the spin's last cut + 4), and the vine
  roots that raider where they stand 3 ticks later (4290, then 4291). Kill 1's first quadrant had none; [R] records one.
- **The spin.** Saw i cuts 5 + 3i ticks after the spin starts, on the tick his loop animation (the last saw's: the end
  animation) plays ([K]: 20 and 25 on raiders with no overhead, zeros through Protect from Melee). An overhead up on the
  tick before is severed ("Ocellus disrupts your concentration, severing your prayer!") and locked for 3 ticks ([V] duo
  18:53-18:55). Flick: off on 4 + 3i, on for the cut; kill 2's per-tick overheads show all 8 raiders doing exactly
  that. One saw per quadrant destroyed, plus one; swings again 4 ticks after the last cut.
- **Shadow slash and Insolence.** A band 3 tiles wide to the platform edge ([V] duo 20:24, Bubba OSRS guide 4:56).
  The shadow slash lands the tick after its animation; Insolence's superior slashes animate 2, 7 and 12 ticks after
  the shout and each lands 3 after its animation, then swings resume 20 after the shout ([K]).
- **Void bombs' timing.** [K] logs spotanim 4299 over each bomb tile 2 ticks before it drops (4300 and 4301); 4302
  never appears. [R]'s bomb ticks (6 and 9 into the first segment, 6 into later ones) are the drops.
- **Corner cracks.** [R]'s three tendrils, in turn, every 2 ticks, 5 open. Lines run 9 tiles: the duo VOD at 13:09 has
  one from the north-east corner across the middle markers ([V]). Up to three are open at once, so neighbours lie side
  by side (the guide at 0:36 shows two straight ones a tile apart, [M]) and the x-face diagonal and the corner's line
  along his inner row share their first tile, as [R]'s roots put both beside his inner corner. Each closes 5 ticks on.
- **Middle beats' cracks.** [R] has the second line sent 60 client cycles after the first. [K] kill 2 shows both on the
  beat tick, a quarter turn apart, the first in turn order (the pieces' 0/90/180/270) closing 4 ticks on and the other
  6 (4258 and 4252 at +36, closing at +40 and +42).
- **Tendrils.** Blocking a closing crack heals you: +16, +9, +13 on the blocker in [V] (13:31-13:35), and Bubba
  OSRS's guide ("it'll heal all of the chip damage"). [R]'s 3-5 every 2 ticks on blockers matches a burn left over
  from the room before ("You have been set alight!"), not the cracks. The sim heals 9-16 a blocked crack.
- **"Your panic... is futile..."** [R] recorded it at fixed ticks; [W] says it is his answer to a tank out of melee
  reach. The sim fires it whenever a swing can't reach you. [K]: it lands 2 ticks after the animation on everyone,
  and the next move comes 6 ticks after it instead of 3.
- **Void bombs.** [R] records one per standing quadrant and a void that "stays"; [M] says they fall on everyone
  but the tank, and the community markers sit on the same three edge tiles of all four quadrants, a quarter turn
  apart. The sim drops one over you (solo has no other target, as with the vine) and one on that tile turned into
  each other standing quadrant. The voids last until their quadrant falls, so the last quadrant's carry into phase 4.
- **The spin's rubble.** [R]: over every raider 3 ticks into the first segment's spin and 6 into later ones, falling
  5 ticks on and leaving a void patch; [M]: "slow falling", one step clears it. Its damage is a guess (the bomb's).
- **Untether.** [M]: pray Magic, "he'll mage you constantly". [K]: the magic lands on every raider 10, 14, 18 and 22
  ticks in, with each pool wave after the first (zeros through Protect from Magic, as [R]'s 39 zeros). [M]: "you can
  step under early, but step out is tick perfect". [K]'s positions show how: the slam 29 ticks in hits whoever is not
  under his 3x3 at the end of tick 28 (36 on the one raider outside), and the aftershock on 30 hits whoever is still
  under him at the end of 29 (21 and 41). So be under him by 28 and one tile out on 29. There is no wider zone and
  no hit with the eruption on 25; that was the sim's reading of [W]'s purple border.
- **Phase 4's start.** [K]: "End..." 1 tick into phase 4 and his first Deflect 4 ticks in (not [R] [T]'s 5 and 8),
  with hits on him from 3 ticks in.
- **Phase 4's cycle.** [K] kill 2, from his Deflect: the wind spotanim (4313) on every raider at +3 and +34, the half-HP
  hit at +4 and +35, the explosion telegraph (4340) at +6 and +37, then explosions every 2 ticks from +10 and +41
  (no floor graphic), and hybrid tells at +24 and +52 landing 5 later, all as [R] [T] had them. The first raiders took
  their orbs back (4314, with the heal) at +16 and +42 in both cycles, so the sim readies them then and heals on the
  pickup tick.
- **Phase 4's 2-tick.** [M]: an explosion a tile from you resets your attack timer ("you can attack every two
  ticks"); move the tick a mark goes down and attack the next. The melee-phase orb forms across his body from where
  you stepped into his ring ([M] 15:40).
- **Defence floor.** [J]: 60% for Ocellus, none for The Blade.
- **Void Augmenter.** [W]: Attack and Strength to 116, Magic and Ranged to 112. The Void Rift's buff is still unknown
  (the sim keeps a max hit on your next attack). NPC 16679 is the Void Siphon ([W]).

## Open questions (nobody has data yet)

- "Embrace... annihilation...": the real damage and the meter level that triggers it. The sim fires one more strike
  shot per 24 meter, as [R]'s engine guesses.
- What Deflect Melee / Deflect Range send back.
- The Void Rift's "empower" buff.
- The censers: [W] reads the Bandosian and Armadylean ones as style-specific max hits; the sim gives any style one.
- [K] shows a hit on every raider 1 tick into each spin, all zeros through Protect from Melee. Its unprotected damage
  is unknown, so the sim leaves it out.
- Whether he can Untether twice in a quadrant when his HP stays near the floor; the sim allows one ([V]).
- Where phase 4's orbs and explosion marks sit: no floor graphic in [K]; NPC 16668 is an invisible controller.
