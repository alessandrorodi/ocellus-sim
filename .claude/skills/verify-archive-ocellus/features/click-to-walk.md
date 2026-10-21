# Click to walk

Left-clicking a floor tile outlines that tile, and the player runs to it at two tiles per game tick.

## Sub-features

- `walk-click` sets the destination to the clicked floor tile.
- `walk-arrive` moves the player to the destination over the following ticks.
- `walk-camera` keeps the camera centred on the player while it moves.

## How to get to it (user POV)

- Left-click any floor tile in the game view.

## Driving it with agent-browser

Preconditions:

- The baseline preconditions in the index hold, on a fresh page load.
- The player is on spawn tile (10, 10).

- **Before.** Record the state and the screen. Run `agent-browser --json eval "window.__archiveOcellus.snapshot()"` and `agent-browser screenshot "$PWD/.verify/<run>/before.png"`. `player` and `destination` are both `{"x":10,"y":10}`.
- **Click.** Click 160 px right of and 50 px below the canvas centre. Get the centre from `agent-browser --json get box "#world"`, then run `agent-browser mouse move <cx+160> <cy+50>`, `agent-browser mouse down left` and `agent-browser mouse up left`. The clicked tile gets a white outline.
- **Arrive.** Wait for the walk to finish. Run `agent-browser wait --fn "(() => { const s = window.__archiveOcellus.snapshot(); return s.player.x === s.destination.x && s.player.y === s.destination.y && s.player.x !== 10; })()" --timeout 15000`. The command exits 0.
- **After.** Record the state and the screen. Run the same `eval` and `agent-browser screenshot "$PWD/.verify/<run>/after.png"`. `player` and `destination` are both `{"x":13,"y":11}` at a 1280x800 viewport, and `tick` is higher than before. Compare against that literal tile, not against `destination`: both come from the trainer, so a click on the wrong tile still has `player` equal to `destination`.
- **Scripted.** `scripts/verify.sh browser` runs this recipe and writes `observed.json` with each check.

## Gotchas

- `agent-browser click "#world"` clicks the canvas centre, which is the player's own tile. The player does not move. Use `mouse` with an offset.
- Wait for tick 8 before clicking so the proof starts after the GET READY countdown.
- The world ticks every 600 ms. Wait for the arrival condition, not a fixed sleep.
- The rendered model trails the logical tile by up to one tick. Wait about one second after arrival before the after screenshot.
