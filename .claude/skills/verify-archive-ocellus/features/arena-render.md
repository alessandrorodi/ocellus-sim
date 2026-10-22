# Arena render

Opening the trainer loads cache assets, counts down GET READY, and shows the measured P4 platform as a checkered floor with black beyond its edges and a raised walkway along its diagonal edge. The player stands on its north band facing south toward the boss, inside the standard game HUD.

## Sub-features

- `arena-load` loads the page and reaches the ticking state without page errors.
- `arena-floor` draws the 80 floor tiles of the measured 12x12 platform (`#` in `geometry.platform` in `OcellusTimings.ts`) as a checkerboard.
- `arena-walkway` draws the brazier walkway (`w` and `b` in the same rows) as a raised olive curb with a light face toward the floor, and hangs the cache's Zarosian Censer (model 62440) over the `b` tile. The walkway is scenery: a click on it walks the player to the nearest floor tile.
- `arena-player` draws the player model, in the selected setup's gear (ranged by default), on spawn tile (5, 1).
- `arena-hud` shows the minimap orbs, inventory tabs and inventory panel.

## How to get to it (user POV)

- Open `http://127.0.0.1:8002/` in a browser.

## Driving it with agent-browser

Preconditions:

- The baseline preconditions in the index hold, except that the page has not been opened yet.

- **Load.** Open the page. Run `agent-browser open http://127.0.0.1:8002/`. The title is `Archive Ocellus Trainer`.
- **Ticking.** Wait for the countdown to finish. Run `agent-browser wait --fn "window.__archiveOcellusProbe?.snapshot().tick >= 8" --timeout 90000`. The command exits 0.
- **Spawn state.** Read the state. Run `agent-browser --json eval "window.__archiveOcellusProbe.snapshot()"`. `data.result.player` is `{"x":5,"y":1}` and `data.result.ticking` is `true`.
- **Proof.** Capture the screen. Run `agent-browser screenshot "$PWD/.verify/<run>/arena.png"`. The screenshot shows the checkered platform with black beyond its edges, the stepped olive walkway on the left running up past the boss, the censer hanging on its chain beside the boss, the player in Masori armour with the Twisted Bow at the centre, the boss ahead on his 3x3, and the HUD at the right edge.
- **No errors.** Run `agent-browser --json errors`. `data.errors` is `[]`.

## Gotchas

- Headless Chrome renders WebGL in software. The FPS counter at the top left can drop to around 35; this is not a regression.
- Tiles off the platform and the walkway are black. `drawWorldBackground` paints only platform and walkway tiles, and the default 3D floor plane takes its texture from it.
- The walkway's top renders exactly `#6b6c40` (`geometry.walkway.top`) because it uses an unlit material, so a pixel count of that colour shows whether it is drawn.
- The player model is built only from equipped items. A player with no loadout is invisible except for the health bar.
- `agent-browser screenshot` with a relative path saves into agent-browser's own temporary directory. Pass an absolute path.
