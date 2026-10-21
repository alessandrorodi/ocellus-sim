---
name: verify-archive-ocellus
description: Verify Archive Ocellus Trainer, a browser trainer built on osrs-sdk, by building it, running Jest, extracting cache assets and driving the real app in headless Chrome through the agent-browser CLI. Use before calling any change to the trainer done, and to prove a mapped feature still works.
---

# Verify Archive Ocellus Trainer

The trainer is a web page: a three.js canvas (`#world`) with the osrs-sdk HUD around it. A user loads the page, sees the arena and their player, and clicks floor tiles to walk. There is no backend. `scripts/verify.sh` runs every stage below and prints `PASS <stage>` or `FAIL <stage>`. It exits non-zero when any stage fails.

```sh
source ~/osrs-sims/env.sh            # Node 22 on this machine; elsewhere use any Node 22
scripts/verify.sh                    # build test assets browser
scripts/verify.sh test browser       # any subset, in the order given
```

Run it from the repository root or a worktree. A passing run prints four `PASS` lines and ends with `verify: stop: PID <n> is gone; evidence kept in <dir>`.

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

Read-only. It passes when the recorded PID is alive with its recorded start time, that PID owns the port, `/` has the title `Archive Ocellus Trainer`, and `/osrs-assets/manifest.json` contains `npc-16673`. It also warns when HEAD or tracked files changed since launch; webpack has reloaded them, but the recorded revision no longer names what you are driving. Run it first whenever anything looks wrong, and never drive an instance this checkout did not start.

## Drive

Use a named agent-browser session so you never touch another agent's browser:

```sh
export AGENT_BROWSER_SESSION=archive-ocellus-$(date -u +%Y%m%dT%H%M%SZ)
agent-browser set viewport 1280 800
agent-browser open http://127.0.0.1:8002/
agent-browser wait --fn "window.__archiveOcellus?.snapshot().tick >= 8" --timeout 90000
```

Drive with real input only: page loads, `agent-browser mouse move/down/up` on the canvas, and visible elements by CSS id. The canvas has no accessible children, so tiles are reached by pixel position relative to `agent-browser get box "#world"`. The camera centres on the player. At a 1280x800 viewport, the point 160 px right of and 50 px below the canvas centre is a floor tile; from the spawn tile (10, 10) the player walks to (13, 11). The `browser` stage fails when the click resolves to any other tile, so a changed viewport, camera or default setting shows up as a failure. It does not pass silently.

Development builds expose `window.__archiveOcellus.snapshot()`. It returns a fresh copy of `{ ticking, tick, player, destination }` and has no setters. Use it to record state the UI does not show. Never use it, `eval`, or SDK internals to change state; a proof that mutates the world through code proves nothing about the user path. Production builds (`npm run build`) do not contain the handle.

Per-feature recipes are in [features/README.md](features/README.md).

## Evidence

Each run writes to `.verify/<UTC timestamp>/` (gitignored; override with `VERIFY_DIR`):

| File | Content |
| --- | --- |
| `summary.txt` | One `PASS`/`FAIL` line per stage |
| `build.log`, `test.log`, `jest.json`, `assets.log` | Stage output; `jest.json` holds the executed test count |
| `server.log`, `server.pid` | Dev server output; PID, start time, port and revision |
| `before.json`, `before.png` | State and screenshot after load, before any input |
| `click.json` | Canvas pixel that was clicked |
| `after.json`, `after.png` | State and screenshot after the walk |
| `console.log`, `page-errors.json` | Browser console and uncaught page errors |
| `observed.json` | Before and after state, the expected tile and each check's result |
| `cleanup.log` | Confirmation that the recorded PID stopped |

A browser proof captures the action and the resulting state, not only the last screen. A test count of zero fails the `test` stage. A page error fails the `browser` stage, and so does a failed or empty screenshot, state, console or page-error capture.

## Cleanup

```sh
agent-browser close
scripts/verify.sh stop
```

`stop` signals only the recorded PID, and only while its start time still matches, so a reused PID is never signalled. It waits for the process to exit, confirms the port is free, then removes `.verify/current-server`. It never deletes evidence. Never stop the server by process name or pattern. Run cleanup after every failed attempt too. The `browser` stage does all of this itself, including on Ctrl-C. It stops only an instance it started. When `.verify/current-server` already records an instance, for example one from `scripts/verify.sh serve`, the stage fails and leaves that instance running.

## Helpers

- `scripts/verify.sh [build] [test] [assets] [browser]`: the stages; no argument runs all four.
- `scripts/verify.sh serve | doctor | stop`: a manual instance, as above.
- `scripts/verify.test.sh`: browser-free checks of `verify.sh` itself, with the dev server and agent-browser stubbed. Run it after changing `verify.sh`; CI runs it too.
- `scripts/install-beta-sdk.sh`: installs the beta SDK packages with `--no-save`. CI calls it without `OSRS_SDK_PACKS`, so it builds from the pinned commit.

The `assets` stage skips extraction when `public/osrs-assets/manifest.json` already contains `npc-16673` from `openrs2:2746`. Delete `public/osrs-assets/` to force a rebuild. Extracted assets are never committed.
