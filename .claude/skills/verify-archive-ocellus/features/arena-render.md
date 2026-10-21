# Arena render

Opening the trainer loads cache assets, counts down GET READY, and shows a checkered placeholder floor with the player standing in its centre, inside the standard game HUD.

## Sub-features

- `arena-load` loads the page and reaches the ticking state without page errors.
- `arena-floor` draws the 20x20 checkered placeholder floor (`placeholderArena` in `OcellusTimings.ts`) around the player.
- `arena-player` draws the player model, in its placeholder melee gear, on spawn tile (10, 10).
- `arena-hud` shows the minimap orbs, inventory tabs and inventory panel.

## How to get to it (user POV)

- Open `http://127.0.0.1:8002/` in a browser.

## Driving it with agent-browser

Preconditions:

- The baseline preconditions in the index hold, except that the page has not been opened yet.

- **Load.** Open the page. Run `agent-browser open http://127.0.0.1:8002/`. The title is `Archive Ocellus Trainer`.
- **Ticking.** Wait for the countdown to finish. Run `agent-browser wait --fn "window.__archiveOcellusProbe?.snapshot().tick >= 8" --timeout 90000`. The command exits 0.
- **Spawn state.** Read the state. Run `agent-browser --json eval "window.__archiveOcellusProbe.snapshot()"`. `data.result.player` is `{"x":10,"y":10}` and `data.result.ticking` is `true`.
- **Proof.** Capture the screen. Run `agent-browser screenshot "$PWD/.verify/<run>/arena.png"`. The screenshot shows the checkered floor, an armoured player with a scythe at the centre, and the HUD at the right edge.
- **No errors.** Run `agent-browser --json errors`. `data.errors` is `[]`.

## Gotchas

- Headless Chrome renders WebGL in software. The FPS counter at the top left can drop to around 35; this is not a regression.
- The floor is black when the region draws no world background; the default 3D floor plane takes its texture from `drawWorldBackground`.
- The player model is built only from equipped items. A player with no loadout is invisible except for the health bar.
- `agent-browser screenshot` with a relative path saves into agent-browser's own temporary directory. Pass an absolute path.
