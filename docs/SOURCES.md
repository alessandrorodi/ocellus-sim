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
| **[K]** | RuneLite fight logs, spectating an 8-raider kill on 2026-10-23 | Every Ocellus anim, floor spotanim and projectile by tick, every raider's hitsplats with the overhead they had up, and raider positions around the Untether slam. Confirmed phase 1, phase 2 and phase 4's cycle; corrected phase 3's chain, the spin, Untether, bombs, Insolence and phase 4's start | Highest for what it logged. One kill, one team; no NPC spawns (rifts, vine) or phase 4 orbs and marks recorded |
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
  sets comes the quadrant's next special: spin then Untether in the first quadrant; spin, Insolence, spin, Untether
  in later ones. A panic shot takes a swing's place and the next move comes 6 ticks after it, so [K]'s second quadrant
  ran 3 ticks late from its first move. The chain reproduces [R]'s timelines, whose later segments have a panic after
  each spin. Bombs, the vine and the rifts stay on the segment's clock ([K]'s bombs came at S+4 through a panic).
- **Quadrant falls.** [R]'s two fights and [K]'s first quadrant collapse 31 ticks after Untether with his HP already
  at the floor. [W], [O] and the duo's HP bar ([V], 18:20-18:26, 20:42-20:43, 23:21) say the quadrant falls once his
  whole-number HP% shows 75 / 50 / 25 (under 76% and so on). [K]'s second and third quadrants never reached Untether:
  his HP held at the floor (51% and 26% on the bar) and the quadrant fell 1 tick after a set's slash, or 1 tick after
  the floor between moves. The sim drops the quadrant on the first tick he is past his current move. Untether comes
  once a quadrant; a slow kill loops the rest of the rotation.
- **The spin.** Saw i cuts 5 + 3i ticks after the spin starts, on the tick his loop animation (the last saw's: the end
  animation) plays ([K]: 20 and 25 on raiders with no overhead, zeros through Protect from Melee). An overhead up on the
  tick before is severed ("Ocellus disrupts your concentration, severing your prayer!") and locked for 3 ticks ([V] duo
  18:53-18:55). Flick: off on 4 + 3i, on for the cut. One saw per quadrant destroyed, plus one; swings again 4 ticks
  after the last cut.
- **Shadow slash and Insolence.** A band 3 tiles wide to the platform edge ([V] duo 20:24, Bubba OSRS guide 4:56).
  The shadow slash lands the tick after its animation; Insolence's superior slashes animate 2, 7 and 12 ticks after
  the shout and each lands 3 after its animation, then swings resume 20 after the shout ([K]).
- **Void bombs' timing.** [K] logs spotanim 4299 over each bomb tile 2 ticks before it drops (4300 and 4301); 4302
  never appears. [R]'s bomb ticks (6 and 9 into the first segment, 6 into later ones) are the drops.
- **Corner cracks.** [R]'s three tendrils, in turn, every 2 ticks, 5 open. Lines run 9 tiles: the duo VOD at 13:09 has
  one from the north-east corner across the middle markers ([V]). Up to three are open at once, so neighbours lie side
  by side (the guide at 0:36 shows two straight ones a tile apart, [M]) and the x-face diagonal and the corner's line
  along his inner row share their first tile, as [R]'s roots put both beside his inner corner.
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
- [K]'s first quadrant had no vine; [R] records one 36 ticks in, which the sim keeps.
