---
name: verify-archive-ocellus
description: Verify Archive Ocellus Trainer, a browser trainer built on osrs-sdk, by building it, running Jest, extracting cache assets and driving the real app in headless Chrome through the agent-browser CLI. Use before calling any change to the trainer done, and to prove a mapped feature still works.
---

# Verify Archive Ocellus Trainer

The trainer is a web page: a three.js canvas (`#world`) with the osrs-sdk HUD around it. A user loads the page, sees the arena, their player and Ocellus (NPC 16677), clicks floor tiles to walk, switches gear from the inventory, and plays the phase 4 cycle, stepping in and out of the 5x5 under the boss as the void floor changes, stepping around the floor holes, stepping off each explosion mark, praying against each transition attack, attacking around the boss's curse overheads and killing void rifts before they burst. A setup selector, a focus selector, a seed field and a Restart button sit at the bottom left. A run without a typed seed draws a fresh one and shows it in the seed field. There is no backend. `scripts/verify.sh` runs every stage below and prints `PASS <stage>` or `FAIL <stage>`. It exits non-zero when any stage fails.

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

Read-only. It passes when the recorded PID is alive with its recorded start time, that PID owns the port, `/` loads completely with the title `Archive Ocellus Trainer`, and `/osrs-assets/manifest.json` loads completely and contains `npc-16677`. It also warns when HEAD or tracked files changed since launch; webpack has reloaded them, but the recorded revision no longer names what you are driving. Run it first whenever anything looks wrong, and never drive an instance this checkout did not start.

## Drive

Use a named agent-browser session so you never touch another agent's browser:

```sh
export AGENT_BROWSER_SESSION=archive-ocellus-$(date -u +%Y%m%dT%H%M%SZ)
agent-browser set viewport 1280 800
agent-browser open "http://127.0.0.1:8002/?seed=1&specialSelection=replay-v2"
agent-browser wait --fn "window.__archiveOcellusProbe?.snapshot().tick >= 8" --timeout 90000
```

Drive with real input only: page loads, `agent-browser mouse move/down/up` on the canvas, and visible elements by CSS id. The canvas has no accessible children, so tiles are reached by pixel position relative to `agent-browser get box "#world"`. The camera centres on the player and faces south, so screen left is east and screen up is south. At a 1280x800 viewport, the point `WALK_CLICK_LEFT_PX` (160) left of and `WALK_CLICK_UP_PX` (50) above the canvas centre is a floor tile; from the spawn tile (5, 1) the player walks to `WALK_TARGET_TILE` (8, 3). The three constants sit together at the top of `scripts/verify.sh`. The `browser` stage fails when the click resolves to any other tile, so a changed viewport, camera or default setting shows up as a failure. It does not pass silently.

Restart and the `Focus` selector reload with a fresh seed unless the seed box was typed in. A recipe that checks a seeded run after either one first types the box's own value back with `agent-browser fill "#seed" <the value of #seed>`, as `keep_seed` in `scripts/verify.sh` does.

Development builds expose a verification probe, `window.__archiveOcellusProbe`. `snapshot()` returns a fresh copy of `{ ticking, tick, player, destination, fight, rejected, panel, menu, icons }`: `tick` is the SDK world tick, `fight` is `{ run, boss, player }` with the P4 tick and phase in `run`, the boss's HP and Defence in `boss` and, in `boss.visible`, whether the renderer draws the boss model, and the worn and carried item ids and the special energy in `player`. `rejected` lists URL options the drill ignored. `panel` names the open side-panel tab (`INVENTORY`, `PRAYER`, `SETTINGS` and so on, or `null` for a tab with no name) and the keys bound to the inventory, spellbook, prayer, equipment and combat tabs. `menu` lists the lines of the open right-click menu, without `Cancel`, or is `null` when no menu is open. `icons` maps the id of every carried and worn item to the path and decoded size of the sprite the side panel draws for it. `log()` returns the fight log: a header with the seed and every resolved choice, and one row per boss step with its phase, beats, inputs and events. Each row samples the player and the boss HP twice. `playerAtBossStep` and `bossHp.atBossStep` are read when the boss steps, after prayers publish and before hits land. `playerAtPostTick` and `bossHp.atPostTick` are read in the region's `postTick`, after every unit has moved. The probe has no setters. Use it to record state the UI does not show. Never use it, `eval`, or SDK internals to change state; a proof that mutates the world through code proves nothing about the user path. Production builds (`npm run build`) do not contain the handle.

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
| `edge-click.json`, `edge-arrived.json`, `edge.json`, `edge.png` | Canvas pixel of the click past the platform's north edge, the state when the player stops on the edge tile and again 3 ticks later, and the screen with the player on the edge |
| `console.log`, `page-errors.json` | Browser console and uncaught page errors of the first page |
| `boss.png` | The default 3D view once the boss is present (P4 tick 12 or later) |
| `cycle-ring-click.json` | Canvas pixel of the click at P4 tick 39 that walks the player into the ring before the flood |
| `cycle-snapshot.json`, `cycle.json` | Probe snapshot and fight log once P4 tick 70 has run |
| `focus.json`, `focus.png` | Fight log and screen after the focus control reloaded the drill on `transition-attacks` |
| `focus-console.log`, `focus-page-errors.json` | Console and page errors of the reloaded page |
| `void-inner.png`, `void-flood.png`, `void-floor.json` | The `void-floor` drill reloaded with the player standing on spawn: the inner square at P4 tick 12, the flood at 45, and the fight log once the flood has killed the player |
| `void-console.log`, `void-page-errors.json` | Console and page errors of the `void-floor` page |
| `attack-click.json`, `ring-click.json`, `flood-ring.png`, `void-shot.json` | The `void-floor` drill reloaded with the player walked to (8, 3) and stopped on the edge tile (8, 1): canvas pixels of the boss click from the flood at P4 tick 44 and of the ring click after the bow fires, the screen at tick 52 with the player in the safe ring, and the fight log at tick 58 |
| `void-shot-console.log`, `void-shot-page-errors.json` | Console and page errors of the reloaded `void-floor` page |
| `orb-hit.png`, `orb-dormant-1.png` to `orb-dormant-6.png`, `orb-glow-1.png` to `orb-glow-6.png`, `orb-click.json`, `orb.json` | The `lifeforce-orb` drill with the player on spawn: the screen at the lifeforce hit, six frames of the dormant orb from P4 tick 20, six of the glowing orb from tick 24, the click on the orb's tile after them with the pixel and the snapshot it set, and the fight log once the HP came back |
| `orb-skip.png`, `orb-skip.json` | The same drill reloaded with no input: the screen and fight log at tick 63, after the unclaimed outer orb healed the boss |
| `orb-console.log`, `orb-page-errors.json`, `orb-skip-console.log`, `orb-skip-page-errors.json` | Console and page errors of both orb pages |
| `explosion-left.png`, `explosion-standing.png`, `explosions.json`, `explosion-audio.json` | The `explosions` drill with sound and area sound saved on: the shards left on their tile 450 ms after the first dodge, the shards under the player before the late step, the fight log at P4 tick 59, and every audio buffer start with its P4 tick, length, sample rate and context state |
| `explosion-under.png`, `explosions-under.json` | The same drill reloaded with the player walked under the hidden boss: the screen at the first mark and the fight log after the inner series |
| `explosion-console.log`, `explosion-page-errors.json`, `explosion-under-console.log`, `explosion-under-page-errors.json` | Console and page errors of both explosion pages |
| `special-before.png`, `special-vortex.png`, `special.json` | The `transition-attacks` drill on `replay-v2` with Protect from Magic clicked after P4 tick 33: the boss before the tell at 31, the vortex tell at 35, and the fight log through the Soul Split heal tick 39 |
| `special-heal.png`, `special-spike-disk.png`, `special-semicircle.png`, `special-black-disk.png`, `special-late.json`, `special-audio.json` | The same drill reloaded with sound and area sound saved on and Protect from Magic clicked after 37: the Soul Split heal splat at 39, the spike disk tell at 63, the melee semicircle at 93 and black disk at 95, the fight log once the player died at 97, and every audio start with its P4 tick, phase into the tick, length, rate and context state |
| `special-console.log`, `special-page-errors.json`, `special-late-console.log`, `special-late-page-errors.json` | Console and page errors of both transition pages |
| `loadout-before.json`, `loadout-ranged.png`, `icons.json` | Fight snapshot, screen and drawn item sprites of `?seed=1&setup=ranged` with the inventory tab open |
| `equipment-ranged.png` | The equipment tab of the same page before the switches, with the Masori (f) pieces and Zaryte vambraces worn |
| `loadout-after.json`, `loadout-melee.png` | Snapshot and screen after clicking the eight switches |
| `loadout-spec.json`, `loadout-spec.png` | Snapshot and screen after Division on the boss |
| `equipment-melee.png` | The equipment tab after the switches, with the Inquisitor's pieces worn |
| `loadout-console.log`, `loadout-page-errors.json` | Console and page errors of the loadout page |
| `loadout-selector.json`, `loadout-selector-page-errors.json` | Snapshot and page errors after the setup control reloaded the drill on `melee` |
| `supplies-inventory.json`, `item-menu.json`, `item-menu.png`, `item-menu-closed.json` | `?seed=1&setup=ranged` with the inventory tab open: the 28 carried item ids, the right-click menu on Ralos in slot 0 with its screen, and the menu after the cursor moved away |
| `brew-click.json`, `brew-hp.json`, `brew-heal.png` | The P4 tick before the click on the Saradomin brew in slot 11, every row's tick and hitpoints, and the screen with the orb reading 115 and the brew's hover text, which must end inside the canvas |
| `supplies-console.log`, `supplies-page-errors.json` | Console and page errors of the supplies page |
| `keybinds-open.json`, `keybinds.png`, `keybinds-bound.json`, `keybinds-saved.json` | The panel after the `Keybinds` button, its screen (any hover text left on it must end inside the canvas), the panel after binding the inventory tab to F6, and the saved `osrs-sdk:settings` |
| `keybinds-old-key.json`, `keybinds-reloaded.json`, `keybinds-reloaded.png`, `keybinds-restored.json` | After a reload: the panel after F4, after F6 with its screen, and after the inventory key was bound back to F4 |
| `keybinds-console.log`, `keybinds-page-errors.json` | Console and page errors of the key-binding pages |
| `overhead-5.png`, `overhead-31.png`, `overhead-35.png`, `overhead-45.png` | The `rifts` drill, reloaded by Restart with sound and area sound saved on, with the player on spawn: the boss with no overhead in the lead-in, then under Deflect Melee, Soul Split and Deflect Range |
| `overhead-draws.json` | The same page: for each P4 tick, the animation frames drawn and the `sprites/` images drawn into them, which are the boss's overhead icons |
| `rift-spawned.png`, `rift-destroyed.png`, `rift-chat.json`, `rift-burst.png`, `rifts.json`, `rift-audio.json` | The same page: both rifts at P4 tick 68, the north-east rift after the player's bow shot destroyed it, the chat text then, the north-west rift's burst at 78, the fight log after it, and every audio start |
| `hover-out-of-reach.png`, `deflect-blocked.png`, `deflect.json` | The `rifts` drill on the melee setup with the risen boss clicked after P4 tick 12: the player beside the hovering boss with no hitsplat at 20, the blocked hits' 0 splats at 31 after he lands, and the fight log at 46 |
| `rift-console.log`, `rift-page-errors.json`, `deflect-console.log`, `deflect-page-errors.json` | Console and page errors of both rift pages |
| `seed-fresh.png`, `seed.json`, `seed.png` | The page opened without a seed, then Restart, then Restart after typing the first seed: the box, the log's seed and `location.search` of each run, and the screens of the first and last run |
| `seed-console.log`, `seed-page-errors.json` | Console and page errors of the last seed page |
| `holes-drawn.png`, `holes-flood.png`, `hole-click.json`, `hole-hit.png`, `holes.json` | `?seed=1&focus=floor-holes` with the player on spawn: the holes in the lead-in and the flood over them at P4 tick 45, then the click from spawn onto the hole at (8, 5), the screen once three hole hits landed, and the fight log then |
| `holes-console.log`, `holes-page-errors.json` | Console and page errors of the holes page |
| `walkway-click.json`, `walkway-arrived.json`, `walkway.json`, `walkway-log.json`, `walkway.png` | `?seed=1&focus=transition-attacks` with a click on the walkway from spawn: the pixel, the state when the player stops beside it and again 3 ticks later, the fight log with the walk order, and the screen |
| `walkway-console.log`, `walkway-page-errors.json` | Console and page errors of the walkway page |
| `corner-hole.json`, `corner-hole-log.json`, `corner-hole.png`, `corner-nub.json`, `corner-nub-log.json`, `corner-view.png` | `?seed=2&focus=transition-attacks` with a click from spawn onto (3, 8), then a reload and a click onto (4, 9): the state and fight log on each tile, the screen on (3, 8), and a third page's view from (2, 2) with the camera turned toward the walkway, as in the owner's screenshot |
| `corner-console.log`, `corner-page-errors.json`, `corner-view-page-errors.json` | Console and page errors of both corner pages |
| `observed.json` | Lead-in, before and after state, the first two walk orders and the edge stop, the cycle's stage, overhead and transition attack ticks, the focused beats, the bow shot across the flood, the floor hits, the void pixel shares, the orb events and teal shares, the explosion dodges, late step, under-boss hits, sounds and shard positions, the transition hits, tells, tell pixel shares, centre shares and landing and style sounds, the worn setups, special energy and boss Defence, the carried supplies, the item menu, the brew's heal, the open tabs and bound keys, the overhead icon colour shares, the overhead sprites drawn around each void, the melee player's tile and the boss HP while he hovers, the judged melee hits, the Soul Split heals, the rift events, chat text and spawn, kill and burst sounds, the three runs' seeds, the hole layout, each hole box's dark share before and under the flood, each hole page row's start tile and hole hits, the walkway order, stop and pixel share, the corner orders and stops, and each check's result |
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

The `assets` stage regenerates the inventory icons of the trainer's own items and of the SDK items listed in the gear recipe's `sdkIcons` in `public/osrs-assets/item-icons/` on every run; `src/itemIcons/` renders them from each item's inventory model in the same cache. It skips the model extraction when `public/osrs-assets/manifest.json` already contains every NPC, a player model for every item and every spotanim the asset config declares, from `openrs2:2746`, its sound pack holds every sound the config declares, and `scripts/extract-sprites.mjs --check` finds every sprite PNG listed in `src/assets.ts`. The boss's P4 poses and the transition attack tells come from the presentation recipe in `OcellusTimings.ts`; a pose added there is extracted on the next rebuild. The trainer's gear item ids come from the gear recipe in the same file, the orb spotanims from its `lifeforceOrb.look`, the cue sounds from its `presentation.sounds`, the overhead icons from its `presentation.overheadIcons`, and the void rift (NPC 16678), its poses and its burst flare from its `rifts`. The SDK's asset tool has no sprite category, so `npm run assets` ends with `scripts/extract-sprites.mjs`, which writes the head icons from the cache's sprite index to `public/osrs-assets/sprites/`. The stage runs only `npm run assets` before its checks, the same command the hosted build runs, so a sprite that command does not write fails the stage. Delete `public/osrs-assets/` to force a rebuild. Extracted assets are never committed.
