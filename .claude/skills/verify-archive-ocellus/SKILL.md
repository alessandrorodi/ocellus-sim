---
name: verify-archive-ocellus
description: Verify Archive Ocellus Trainer, a browser trainer built on osrs-sdk, by building it, running Jest, extracting cache assets and driving the real app in headless Chrome through the agent-browser CLI. Use before calling any change to the trainer done, and to prove a mapped feature still works.
---

# Verify Archive Ocellus Trainer

The trainer is a web page: a three.js canvas (`#world`) with the osrs-sdk HUD around it. A user loads the page, sees the arena, their player and Ocellus (NPC 16677), clicks floor tiles to walk, switches gear from the inventory, and plays the phase 4 cycle, stepping in and out of the 5x5 under the boss as the void floor changes and stepping off each explosion mark. A setup selector, a focus selector, a seed field and a Restart button sit at the bottom left. There is no backend. `scripts/verify.sh` runs every stage below and prints `PASS <stage>` or `FAIL <stage>`. It exits non-zero when any stage fails.

```sh
source ~/osrs-sims/env.sh            # Node 22 on this machine; elsewhere use any Node 22
scripts/verify.sh                    # build types test assets browser
scripts/verify.sh test browser       # any subset, in the order given
```

Run it from the repository root or a worktree. A passing run prints five `PASS` lines and ends with `verify: stop: PID <n> is gone; evidence kept in <dir>`.

## Preconditions

- Node 22 and `agent-browser` 0.34 or later on `PATH`.
- Dependencies: the script runs `npm ci` and `scripts/install-beta-sdk.sh` itself when `osrs-sdk-react` is missing. It installs prebuilt packs from `OSRS_SDK_PACKS` (default `~/osrs-sims/packs` when that directory exists). Otherwise it builds the packs from the osrs-sdk commit pinned in the install script. Any later `npm ci` removes the beta SDK again.
- Assets: `OSRS_CACHE_DIR` (default `~/osrs-sims/cache/openrs2`) holds OpenRS2 cache 2746. `OSRS_CACHE_READER` (default `~/osrs-sims/osrscachereader`) is an osrscachereader checkout with `npm ci` done, on the branch that fixes `EntityOpsDecoder.decodeSubOp`. Without that fix the Fractured Archive NPCs crash extraction.

## Launch

The `browser` stage launches, checks, drives and stops its own instance. To drive a mapped feature by hand, start an instance yourself:

```sh
scripts/verify.sh serve      # webpack dev server on 127.0.0.1:8002
```

It refuses ports 8000 and 8001, which belong to other trainers, and refuses any port that already has a listener. It records the PID, the process start time, the port, the git revision and the evidence directory in `.verify/current-server`. Ready means `/` answers HTTP 200 and `server.log` contains `compiled successfully`. Set `VERIFY_PORT` for another port. One checkout holds one recorded instance at a time; a second worktree has its own `.verify/`.

## Doctor

```sh
scripts/verify.sh doctor
```

Read-only. It passes when the recorded PID is alive with its recorded start time, that PID owns the port, `/` has the title `Archive Ocellus Trainer`, and `/osrs-assets/manifest.json` contains `npc-16677`. It also warns when HEAD or tracked files changed since launch; webpack has reloaded them, but the recorded revision no longer names what you are driving. Run it first whenever anything looks wrong, and never drive an instance this checkout did not start.

## Drive

Use a named agent-browser session so you never touch another agent's browser:

```sh
export AGENT_BROWSER_SESSION=archive-ocellus-$(date -u +%Y%m%dT%H%M%SZ)
agent-browser set viewport 1280 800
agent-browser open "http://127.0.0.1:8002/?seed=1&specialSelection=replay-v2"
agent-browser wait --fn "window.__archiveOcellusProbe?.snapshot().tick >= 8" --timeout 90000
```

Drive with real input only: page loads, `agent-browser mouse move/down/up` on the canvas, and visible elements by CSS id. The canvas has no accessible children, so tiles are reached by pixel position relative to `agent-browser get box "#world"`. The camera centres on the player. At a 1280x800 viewport, the point `WALK_CLICK_RIGHT_PX` (160) right of and `WALK_CLICK_DOWN_PX` (50) below the canvas centre is a floor tile; from the spawn tile (10, 10) the player walks to `WALK_TARGET_TILE` (13, 11). The three constants sit together at the top of `scripts/verify.sh`. The `browser` stage fails when the click resolves to any other tile, so a changed viewport, camera or default setting shows up as a failure. It does not pass silently.

Development builds expose a verification probe, `window.__archiveOcellusProbe`. `snapshot()` returns a fresh copy of `{ ticking, tick, player, destination, fight, rejected }`: `tick` is the SDK world tick, `fight` is `{ run, boss, player }` with the P4 tick and phase in `run`, the boss's HP and Defence in `boss` and, in `boss.visible`, whether the renderer draws the boss model, and the worn and carried item ids and the special energy in `player`. `rejected` lists URL options the drill ignored. `log()` returns the fight log: a header with the seed and every resolved choice, and one row per boss step with its phase, beats, inputs and events. Each row samples the player and the boss HP twice. `playerAtBossStep` and `bossHp.atBossStep` are read when the boss steps, after prayers publish and before hits land. `playerAtPostTick` and `bossHp.atPostTick` are read in the region's `postTick`, after every unit has moved. The probe has no setters. Use it to record state the UI does not show. Never use it, `eval`, or SDK internals to change state; a proof that mutates the world through code proves nothing about the user path. Production builds (`npm run build`) do not contain the handle.

Per-feature recipes are in [features/README.md](features/README.md).

## Evidence

Each run writes to `.verify/<UTC timestamp>/` (gitignored; override with `VERIFY_DIR`):

| File | Content |
| --- | --- |
| `summary.txt` | One `PASS`/`FAIL` line per stage |
| `build.log`, `types.log`, `test.log`, `jest.json`, `assets.log` | Stage output; `jest.json` holds the executed test count |
| `server.log`, `server.pid` | Dev server output; PID, start time, port and revision |
| `warm-up.png` | A blank page; a new browser's first screenshot takes about 10 s, so it is taken before the trainer opens |
| `hidden.json`, `hidden.png` | Screenshot, then state, after the boss's first P4 step; the check needs P4 tick 3 or earlier with the model hidden |
| `before.json`, `before.png` | State and screenshot after load, before any input |
| `click.json` | Canvas pixel that was clicked |
| `after.json`, `after.png` | State and screenshot after the walk |
| `console.log`, `page-errors.json` | Browser console and uncaught page errors of the first page |
| `boss.png` | The default 3D view once the boss is present (P4 tick 12 or later) |
| `cycle-ring-click.json` | Canvas pixel of the click at P4 tick 39 that walks the player into the ring before the flood |
| `cycle-snapshot.json`, `cycle.json` | Probe snapshot and fight log once P4 tick 70 has run |
| `focus.json`, `focus.png` | Fight log and screen after the focus control reloaded the drill on `transition-attacks` |
| `focus-console.log`, `focus-page-errors.json` | Console and page errors of the reloaded page |
| `void-inner.png`, `void-flood.png`, `void-floor.json` | The `void-floor` drill reloaded with the player standing on spawn: the inner square at P4 tick 12, the flood at 45, and the fight log once the flood has killed the player |
| `void-console.log`, `void-page-errors.json` | Console and page errors of the `void-floor` page |
| `attack-click.json`, `ring-click.json`, `flood-ring.png`, `void-shot.json` | The `void-floor` drill reloaded with the player walked to (13, 11): canvas pixels of the boss click from the flood at P4 tick 44 and of the ring click after the bow fires, the screen at tick 52 with the player in the safe ring, and the fight log at tick 58 |
| `void-shot-console.log`, `void-shot-page-errors.json` | Console and page errors of the reloaded `void-floor` page |
| `orb-hit.png`, `orb-dormant-1.png` to `orb-dormant-6.png`, `orb-glow-1.png` to `orb-glow-6.png`, `orb-click.json`, `orb.json` | The `lifeforce-orb` drill with the player on spawn: the screen at the lifeforce hit, six frames of the dormant orb from P4 tick 20, six of the glowing orb from tick 24, the click on the orb's tile after them with the pixel and the snapshot it set, and the fight log once the HP came back |
| `orb-skip.png`, `orb-skip.json` | The same drill reloaded with no input: the screen and fight log at tick 63, after the unclaimed outer orb healed the boss |
| `orb-console.log`, `orb-page-errors.json`, `orb-skip-console.log`, `orb-skip-page-errors.json` | Console and page errors of both orb pages |
| `explosion-left.png`, `explosion-standing.png`, `explosions.json`, `explosion-audio.json` | The `explosions` drill with sound and area sound saved on: the shards left on their tile 450 ms after the first dodge, the shards under the player before the late step, the fight log at P4 tick 59, and every audio buffer start with its P4 tick, length, sample rate and context state |
| `explosion-under.png`, `explosions-under.json` | The same drill reloaded with the player walked under the hidden boss: the screen at the first mark and the fight log after the inner series |
| `explosion-console.log`, `explosion-page-errors.json`, `explosion-under-console.log`, `explosion-under-page-errors.json` | Console and page errors of both explosion pages |
| `loadout-before.json`, `loadout-ranged.png` | Fight snapshot and screen of `?seed=1&setup=ranged` with the inventory tab open |
| `loadout-after.json`, `loadout-melee.png` | Snapshot and screen after clicking the nine switches |
| `loadout-spec.json`, `loadout-spec.png` | Snapshot and screen after Division on the boss |
| `loadout-console.log`, `loadout-page-errors.json` | Console and page errors of the loadout page |
| `loadout-selector.json`, `loadout-selector-page-errors.json` | Snapshot and page errors after the setup control reloaded the drill on `melee` |
| `observed.json` | Lead-in, before and after state, the cycle's stage, overhead and transition attack ticks, the focused beats, the bow shot across the flood, the floor hits, the void pixel shares, the orb events and teal shares, the explosion dodges, late step, under-boss hits, sounds and shard positions, the worn setups, special energy and boss Defence, and each check's result |
| `cleanup.log` | Confirmation that the recorded PID stopped |

A browser proof captures the action and the resulting state, not only the last screen. A test count of zero fails the `test` stage. A page error fails the `browser` stage, and so does a failed or empty screenshot, state, console or page-error capture.

## Cleanup

```sh
agent-browser close
scripts/verify.sh stop
```

`stop` signals only the recorded PID, and only while its start time still matches, so a reused PID is never signalled. It waits for the process to exit, confirms the port is free, then removes `.verify/current-server`. It never deletes evidence. Never stop the server by process name or pattern. Run cleanup after every failed attempt too. The `browser` stage does all of this itself, including on Ctrl-C. It stops only an instance it started. When `.verify/current-server` already records an instance, for example one from `scripts/verify.sh serve`, the stage fails and leaves that instance running.

## Helpers

- `scripts/verify.sh [build] [types] [test] [assets] [browser]`: the stages; no argument runs all five. `types` runs `npm run typecheck`: strict `tsc` over `src` and `test`, then `scripts/check-types.mjs`, which fails on `any`, `as` casts other than `as const`, non-null and definite-assignment `!`, `@ts-` suppression comments in `src`, imports of the fight's internal modules from outside `src/content/ocellus/js`, and test files inside it. Tests live in `src/content/ocellus/tests` and drive the region.
- `scripts/check-types.test.sh`: planted violations and a clean control for `check-types.mjs`. Run it after changing the rule check; CI runs it too.
- `scripts/verify.sh serve | doctor | stop`: a manual instance, as above.
- `scripts/verify.test.sh`: browser-free checks of `verify.sh` itself, with the dev server and agent-browser stubbed. Run it after changing `verify.sh`; CI runs it too.
- `scripts/install-beta-sdk.sh`: installs the beta SDK packages with `--no-save`. CI calls it without `OSRS_SDK_PACKS`, so it builds from the pinned commit.

The `assets` stage skips extraction when `public/osrs-assets/manifest.json` already contains `npc-16677`, a player model for every item the asset config declares and every spotanim it declares, from `openrs2:2746`, and its sound pack holds every sound the config declares. The boss's P4 poses come from the presentation recipe in `OcellusTimings.ts`; a pose added there is extracted on the next rebuild. The trainer's gear item ids come from the gear recipe in the same file, the orb spotanims from its `lifeforceOrb.look`, and the cue sounds from its `presentation.sounds`. Delete `public/osrs-assets/` to force a rebuild. Extracted assets are never committed.
