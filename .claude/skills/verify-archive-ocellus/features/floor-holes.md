# Floor holes

The P4 platform carries five or six black holes with a purple rim, drawn from cache model 62508 with its idle sequence 14891. They lie on their tiles from P4 tick 0 to the end of the run and never move. A run picks its layout from its seed, among the measured layouts that keep the player spawn and both rift tiles clear. Today only `v1-turn` qualifies, so every seed lays holes on (1, 5), (1, 6), (2, 8), (2, 9), (4, 9) and (8, 5). The outer flood hides the holes while it is drawn, from P4 tick 39 to 58. A hole is walkable, and a player who starts a tick on one takes 9 to 11 that tick, whether or not the flood hides it. The damage is an assumption, because no capture shows anyone on a hole.

## Sub-features

- `hole-layout` puts the holes on the tiles of the layout that the fight log header names in `choices.floorHoleLayout`. `floorHoleLayout=v1-mirror`, `j1-mirror` or `j1-turn` in the URL replaces the seed's draw.
- `hole-drawn` draws each hole on its tile from P4 tick 0.
- `hole-under-flood` hides every hole while the outer flood is drawn and shows it again when the flood clears.
- `hole-hit` lands a `hole-hit` row on each tick that the player starts on a hole, with amounts from the seeded `holeDamage` stream. No row lands on a tick that starts beside a hole.
- `hole-harmless` lands no `hole-hit` when the URL has `floorHoleDamage=harmless`.
- `hole-focus` lays holes in the full fight and the `Floor holes` drill only.

## How to get to it (user POV)

- Open `http://127.0.0.1:8002/` and look north-east and north-west of the 5x5 for the black holes.
- Walk onto a hole and stand there: a red hitsplat lands every tick.
- Pick `Floor holes` in the `Focus` selector to practise with the holes alone.
- Add `floorHoleDamage=harmless` to the URL to walk over the holes without damage.

## Driving it with agent-browser

Preconditions:

- The baseline preconditions in the index hold. The camera has not been turned since the page loaded.

- **See the holes.** Run `agent-browser open "http://127.0.0.1:8002/?seed=1&focus=floor-holes"` and wait until `snapshot().ticking` is `true` and `snapshot().tick` is at least 8. Wait 1200 ms and screenshot `holes-drawn.png`. The screen shows five black holes with purple rims around the player, one left of the 5x5 and four right of it, and a sixth behind the boss. The script counts pixels no brighter than 30 in any channel in a 17-pixel box around each listed hole and each listed free tile. `HOLE_PIXELS` gives each box's offset from the canvas centre for (8, 5), (1, 5), (1, 6), (2, 8) and (2, 9), and `HOLE_FREE_PIXELS` gives the boxes for (2, 5) and (2, 6), which are `j1-mirror` holes. One run measured 95, 93, 83, 68 and 61% dark in the hole boxes and 0% in both free boxes.
- **See the flood hide them.** On the same page, screenshot `holes-flood.png` 300 ms after P4 tick 45. Every hole box shows the flood's starfield, and one run measured 0% dark in each.
- **Stand on a hole.** On the same page, click `HOLE_CLICK_LEFT_PX` (128) left of and `HOLE_CLICK_UP_PX` (95) above the canvas centre, which walks the player from spawn to (8, 5). Wait until `log()` has three `hole-hit` events and screenshot `hole-hit.png`, which shows red hitsplats over the player on the flood. One run took 9, 10, 10 and 11 at P4 ticks 48 to 51 on (8, 5), after ticks 0 to 47 on spawn and (6, 3) with no hit.
- **Scripted.** `scripts/verify.sh browser` runs these steps after the seed recipe and records `holesDrawnOnLayout`, `holesHiddenUnderFlood` and `holeHitsStandingOnIt` in `observed.json`, with the measurements under `observed.holes`. The first needs the header's layout to be `v1-turn` with its six tiles, every hole box at least `HOLE_MIN_DARK_SHARE` (30%) dark and every free box at most `HOLE_MAX_DARK_SHARE` (5%). The second needs every hole box at most 5% dark under the flood. The third needs exactly one `hole-hit` on each row that starts on a hole tile and none on any other row, at least one row off the holes, at least `HOLE_HITS` (3) hits, all on (8, 5), and each amount from 9 to 11.

## Gotchas

- The boss stands in front of (4, 9) from the spawn camera, so no box is checked there.
- The `Floor holes` drill draws the flood but does not let it hit, so every hit on the page is a hole's. In the full fight a hole under a damaging flood hits as well as the flood.
- The boxes assume the camera the page loads with, centred on spawn and facing south. A turned camera moves every hole off its box.
- Without `seed=1` the layout is the same today, but the hit amounts differ.
