# Ocellus Simulator

A free practice simulator for **Ocellus**, the final boss of The Fractured Archive (Raid 4), covering **all four phases**
in one fight, with the game's own models, animations, effects and sounds.

This is a fork of [ArchiveOcellusTrainer](https://github.com/Julian-Dasilva/ArchiveOcellusTrainer) by Julian-Dasilva,
which drills phase 4. It keeps that drill (`?mode=p4drill`) and adds phases 1 to 3, the transitions between them, and the
interface around the fight. It is built on [osrs-sdk](https://github.com/OldSchoolSDK/osrs-sdk), the engine behind
[colosim.com](https://colosim.com) (Sol Heredit) and [infernotrainer.com](https://www.infernotrainer.com).

**Status:** playable start to finish. Timings come from a tick-exact analysis of six recorded fights; some damage
numbers and a few rules are still unknown and are marked as such in [docs/SOURCES.md](docs/SOURCES.md).

## The fight

| Phase | What happens | What to do |
|---|---|---|
| **1 · Corners** (2,500 HP, teal bar) | He walks corner to corner under Protect from Melee, firing fire (ranged) or water (magic) volleys every 5 ticks. At each corner, 7 crack lines grow toward him, then he explodes. At 66% and 25% he teleports to the middle for four beats of diagonal cracks and a final strike. | Pray Missiles or Magic; the prayer is checked when the shot lands. Stand on closing cracks, or each one feeds his yellow meter and heals him; a full meter turns "Death... awaits..." into "Embrace... annihilation...". Be 3+ tiles away when he explodes. |
| **2 · The Blade** (5,250 HP pool, green bar) | A fixed 131-tick script. 24 portals make a "+" wall. Three rounds: lit (purple) portals fire across their rows every 5 ticks, the orange gaps mark the safe 2x2, then pools and an orange escape portal before all twelve fire. | Attack The Blade; stand on the crossing of the gaps; take the floor portal to the next quadrant. |
| **3 · Quadrants** | The "+" becomes chasms crossed by stepping stones. Three segments, each ending with the destruction of your quadrant: melee triples and the shadow slash, spins, void bombs, "Your panic... is futile...", the Void Vine, "Insolence...", rifts, Untether, then Obliteration. | Protect from Melee for the swings, then step out of the slash. Turn your overhead **off** when he starts to spin (or "You've been injured and can't use protection prayers!"), then Protect from Melee for the saw blades. Break the vine. For Untether, stand inside the purple zone for the eruption and step out before the slam. Jump the stones before the quadrant falls. |
| **4 · Last quadrant** | A 60-tick loop: inner void + Deflect Melee, a wind that halves your HP, six personal explosions, a hybrid attack under Soul Split, then outer void + Deflect Range and the same again. | Range from outside the 5x5, then melee inside it. Take your lifeforce orb back. Step a tile each time an explosion marks you. Match the hybrid's tell. |

The sidebar lets you start at any phase, scale his HP for 1-5 raiders, switch between the ranged and melee setups,
highlight danger tiles, show community tile markers, and practise without dying. Sound is on by default.

## Development

Requires Node 22 and Git Bash on Windows.

```sh
npm ci
scripts/install-beta-sdk.sh   # beta osrs-sdk packages, installed without saving; rerun after any npm ci
npm run assets -- --cache-dir <openrs2 cache dir> --reader-path <osrscachereader checkout>
npm start                     # http://127.0.0.1:8002
```

`npm run assets` downloads OpenRS2 cache 2746 (213 MB, once) and extracts every model, animation, effect and sound the
fight uses into `public/osrs-assets/`, which is never committed. The cache reader is
[Julian-Dasilva/osrscachereader](https://github.com/Julian-Dasilva/osrscachereader) at `8ba9131`.
`scripts/patch-sdk-assets.mjs` fixes the beta asset tool on Windows and lets it skip sounds the cache does not ship.

Useful URL parameters: `phase=1..4`, `party=1..5`, `setup=ranged|melee`, `seed=<n>`, `tiles=0|1`, `markers=0|1`,
`vine=0|1`, `practice=0|1`, and `mode=p4drill` for the original phase 4 drill. The browser console exposes
`__ocellus` (`state()`, `pray("magic")`, `walk(x, z)`, `click(x, z)`, `bossHp(0.5)`, `speed(ms)`) for testing.

### Code map

```
src/content/ocellus/fight/
  data.ts         every id, timing and damage range, with its source
  geometry.ts     arena coordinates (x east, z north from the middle) and the octagonal room
  Fight.ts        the director: tick scheduler, hits checked against prayer on landing, floor, chat
  phase1.ts .. phase4.ts   one script per phase
  arena.ts        the room: engraved floor, cliffs, stepping stones, censers, torches
  effects.ts      cache spotanims on tiles, danger-tile overlay, void floor
  portals.ts      phase 2's portal flames
  units.ts        Ocellus's bodies, the vine and rifts, the player
  bossBar.ts      the game's teal-then-green boss bar with the phase 1 meter
src/FightApp.tsx  the page: HUD, chatbox, sidebar, result panel
```

## Deploy

The site is a static `dist/`. With the assets extracted and the [Vercel CLI](https://vercel.com/docs/cli) logged in:

```sh
npm run deploy
```

## Credit

Created using intellectual property belonging to Jagex Limited under the terms of Jagex's Fan Content Policy. This
content is not endorsed by or affiliated with Jagex.

Game models are extracted from the game cache at build time; none are stored in this repository. Phase 4 and the trainer
scaffolding come from Julian-Dasilva's ArchiveOcellusTrainer. Fight timings come from MRobertEvers' RSProx analysis and
the OSRS Wiki; see [docs/SOURCES.md](docs/SOURCES.md).

## Licence

GPL-3.0, as the upstream trainer and osrs-sdk. See [LICENSE](LICENSE).
