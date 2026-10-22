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

## Engine

- [osrs-sdk](https://github.com/OldSchoolSDK/osrs-sdk) (GPL-3.0), beta branch `feat/cache-render-bundle` pinned at
  `c7d9693`, the engine behind [colosim.com](https://colosim.com) (Sol Heredit) and
  [infernotrainer.com](https://www.infernotrainer.com).
- [osrscachereader](https://github.com/Julian-Dasilva/osrscachereader) fork pinned at `8ba9131` (a build 241 decoder fix).

| **[O]** | The owner, a player of the fight, checked against [V] | Phase 2's skip, the HP-driven quadrant falls, tendrils that cost nothing in the end | Player knowledge |

## Decisions where the sources disagree or are silent

- **Phase 2 skip.** [R] gives the volley's flight (the tile d out lands at 6d - 6 client cycles; 5 for the
  all-twelve volley) but not how hits are judged. Per [O] each tile is judged on the tick the volley is over it
  (tiles 1-5 the firing tick, 6-10 the next), so running through the wave skips it, as with the Wardens' skulls in
  Tombs of Amascut. That reproduces [J R V's skip](https://www.youtube.com/watch?v=c4PSUxjNUiY): stand 6 out
  diagonally, click 4 out one tick before each volley.
- **Quadrant falls.** [R]'s two fights collapse 31 ticks after Untether with his HP already at the floor. [W], [O]
  and the duo's HP bar ([V], 18:20-18:26, 20:42-20:43, 23:21) say the quadrant falls once his whole-number HP% shows
  75 / 50 / 25 (under 76% and so on), at his next attack. Untether comes once a quadrant; a slow kill loops the
  rest of the rotation.
- **The spin.** Each saw forms a tick before it cuts; an overhead up as it forms is severed ("Ocellus disrupts your
  concentration, severing your prayer!") and locked for 3 ticks ([V] duo 18:53-18:55). Flick: off as it forms, on
  for the cut. One saw per quadrant destroyed, plus one.
- **Shadow slash and Insolence.** A band 3 tiles wide to the platform edge ([V] duo 20:24, Bubba OSRS guide 4:56).
- **Tendrils.** Blocking a closing crack heals you: +16, +9, +13 on the blocker in [V] (13:31-13:35), and Bubba
  OSRS's guide ("it'll heal all of the chip damage"). [R]'s 3-5 every 2 ticks on blockers matches a burn left over
  from the room before ("You have been set alight!"), not the cracks. The sim heals 9-16 a blocked crack.
- **"Your panic... is futile..."** [R] recorded it at fixed ticks; [W] says it is his answer to a tank out of melee
  reach. The sim fires it whenever a swing can't reach you.
- **Defence floor.** [J]: 60% for Ocellus, none for The Blade.
- **Void Augmenter.** [W]: Attack and Strength to 116, Magic and Ranged to 112. The Void Rift's buff is still unknown
  (the sim keeps a max hit on your next attack). NPC 16679 is the Void Siphon ([W]).

## Open questions (nobody has data yet)

- "Embrace... annihilation...": the real damage and the meter level that triggers it. The sim fires one more strike
  shot per 24 meter, as [R]'s engine guesses.
- What Deflect Melee / Deflect Range send back.
- The Void Rift's "empower" buff.
- The censers: [W] reads the Bandosian and Armadylean ones as style-specific max hits; the sim gives any style one.
