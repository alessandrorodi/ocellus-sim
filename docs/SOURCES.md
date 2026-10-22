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

## Open questions (nobody has data yet)

- "Embrace... annihilation...": the real damage and the meter level that triggers it. The sim fires one more strike
  shot per 24 meter, as [R]'s engine guesses.
- What Deflect Melee / Deflect Range send back.
- The Void Rift and Void Augmenter "empower" buff.
- Whether phase 3's quadrant destruction is timed or HP-driven. The sim times it and holds his HP at the 75 / 50 / 25%
  floors until each quadrant falls.
- Which hit disables protection prayers. The footage shows the message during Untether; the sim puts it on the
  Untether hits.
