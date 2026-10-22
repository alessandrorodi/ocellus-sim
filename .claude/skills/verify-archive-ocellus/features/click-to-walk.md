# Click to walk

Left-clicking a floor tile outlines that tile, and the player runs to it at two tiles per game tick. A click past the platform's edge, or on the raised brazier walkway, walks the player to the floor tile nearest the click, and the player stays there.

## Sub-features

- `walk-click` sets the destination to the clicked floor tile.
- `walk-arrive` moves the player to the destination over the following ticks.
- `walk-camera` keeps the camera centred on the player while it moves.
- `walk-edge` stops the player on the platform's edge when the click lands off the platform.
- `walk-walkway` stops the player on the floor beside the walkway when the click lands on the walkway.
- `walk-corner` reaches (3, 8) and (4, 9) in the south pocket beside the 5x5's corner, where the old rows had a hole and left (4, 10) jutting out.

## How to get to it (user POV)

- Left-click any floor tile in the game view.
- Left-click the black beyond the platform's edge.

## Driving it with agent-browser

Preconditions:

- The baseline preconditions in the index hold, on a fresh page load.
- The player is on spawn tile (5, 1).

- **Before.** Record the state and the screen. Run `agent-browser --json eval "window.__archiveOcellusProbe.snapshot()"` and `agent-browser screenshot "$PWD/.verify/<run>/before.png"`. `player` and `destination` are both `{"x":5,"y":1}`.
- **Click.** Click `WALK_CLICK_LEFT_PX` (160) left of and `WALK_CLICK_UP_PX` (50) above the canvas centre. Get the centre from `agent-browser --json get box "#world"`, then run `agent-browser mouse move <cx-160> <cy-50>`, `agent-browser mouse down left` and `agent-browser mouse up left`. The clicked tile gets a white outline.
- **Arrive.** Wait for the walk to finish. Run `agent-browser wait --fn "(() => { const s = window.__archiveOcellusProbe.snapshot(); return s.player.x === s.destination.x && s.player.y === s.destination.y && s.player.x !== 5; })()" --timeout 15000`. The command exits 0.
- **After.** Record the state and the screen. Run the same `eval` and `agent-browser screenshot "$PWD/.verify/<run>/after.png"`. `player` and `destination` are both `WALK_TARGET_TILE`, `{"x":8,"y":3}`, at a 1280x800 viewport, and `tick` is higher than before. Compare against that literal tile, not against `destination`: both come from the trainer, so a click on the wrong tile still has `player` equal to `destination`.
- **Edge.** With the player on (8, 3), click `EDGE_CLICK_DOWN_PX` (160) below the canvas centre. The click orders `EDGE_ORDER_TILE` (8, 0), which is off the platform, and the player stops on `EDGE_STOP_TILE` (8, 1). Wait until `snapshot().player` is `{"x":8,"y":1}` and read the state. Wait `EDGE_HOLD_TICKS` (3) more ticks and read it again, then run `agent-browser screenshot "$PWD/.verify/<run>/edge.png"`. Both reads put the player on (8, 1), and the last `walk-ordered` input in `log()` is (8, 0). The screenshot shows the player on the platform's north edge and the clicked tile outlined in the black beyond it.
- **Walkway.** Open `?seed=1&focus=transition-attacks` and wait for tick 8. From spawn, click `WALKWAY_CLICK_LEFT_PX` (400) left of the canvas centre. The click orders `WALKWAY_ORDER_TILE` (13, 2), on the walkway, and the player stops on `WALKWAY_STOP_TILE` (11, 2) and stays there `EDGE_HOLD_TICKS` more ticks. The screenshot shows the olive walkway on the left.
- **Corner.** Open `?seed=2&focus=transition-attacks` and wait for tick 8. From spawn, click 60 right of and 155 above the canvas centre; the player stands on (3, 8). Reload, and from spawn click 40 right of and 170 above the centre; the player stands on (4, 9). For a view like the owner's screenshot, reload, click 150 right of and 20 above the centre to stand on (2, 2), and drag the middle button 95 px left.
- **Scripted.** `scripts/verify.sh browser` runs this recipe and writes `observed.json` with each check, including `edgeClickOrderedOffThePlatform`, `stoppedAtTheEdge`, `walkwayClickStaysOnFloor`, `walkwayDrawn` and `cornerFilled`.

## Gotchas

- The camera faces south, so screen left is east and screen up is south.
- `agent-browser click "#world"` clicks the canvas centre, which is the tile just south of the player. Use `mouse` with an offset.
- A click on a tile right beside the edge does not walk onto it. That tile holds a movement blocker, so the SDK orders a nearby open tile and the player walks to the floor tile nearest that order.
- Wait for tick 8 before clicking so the proof starts after the GET READY countdown.
- The world ticks every 600 ms. Wait for the arrival condition, not a fixed sleep.
- Click each corner tile from spawn on a fresh page. A second click from (3, 8) lands on a different tile depending on how far the trailing camera has caught up.
- The rendered model trails the logical tile by up to one tick. Wait about one second after arrival before the after screenshot.
