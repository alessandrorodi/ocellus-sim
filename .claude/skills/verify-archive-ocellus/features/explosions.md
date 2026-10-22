# Personal explosions

Five ticks after each lifeforce hit, Ocellus marks the tile the player starts that tick on, and marks again every 2 ticks, 6 times by default. A ring of dark purple shards stands on each marked tile. A tick later the explosion goes off there: the shards flare out and fade, and a player who starts that tick on the marked tile takes 16. The mark captures the tile before the player moves, so a player who moves during the mark tick leaves it behind, and a step first taken on the impact tick is too late. Standing under the boss gives no cover. Two sounds set the rhythm players step to: synth 12638 starts each series two ticks after the lifeforce hit, and synth 12537 plays on every mark.

## Sub-features

- `explosion-series-start` logs `explosion-series-started` at P4 tick 14 (inner void) and 45 (outer void), two ticks after each lifeforce hit, and plays 12638 on the player's tile.
- `explosion-mark` logs `explosion-marked` at P4 tick 17, 19, 21, 23, 25 and 27 (inner void) and 48 to 58 (outer void), with the tile the player started that tick on, and places the shards on that tile and plays 12537 on the player's tile.
- `explosion-impact` logs `explosion-resolved` a tick after each mark. The outcome is `hit` with a 16 receipt when the player starts the impact tick on the marked tile, and `avoided` otherwise. The shards flare and fade either way.
- `explosion-under-boss` records `underBoss: true` when the marked tile is under the boss. Such a mark still hits.
- `explosion-choices` select the series with `explosions`: `v2-tell-then-six` (default, marks from hit + 5, 17 to 27, in step with sound 12537), `wiki-six` (marks from hit + 3, 15 to 25) or `v2-seven` (marks from hit + 3 with a seventh at 27).

## How to get to it (user POV)

- Open `http://127.0.0.1:8002/` and stand still after the lifeforce hit at P4 tick 12. Shards appear under the player at 17 and a 16 lands at 18.
- Click a neighbouring tile on each mark tick, or keep walking, and every mark is left behind.
- Tick **Area sounds** at the bottom left to hear 12638 and 12537. Both sound checkboxes start off.
- Pick `Explosions` in the `Focus` selector and press `Restart` to practise the explosions alone.
- Add `explosions=wiki-six` or `explosions=v2-seven` to the URL for the other readings of the footage.

## Driving it with agent-browser

Preconditions:

- The baseline preconditions in the index hold, the lifeforce-orb recipe has run, and the page shows its skipped-orb run with the seed field at 1 and the default ranged setup.
- A click must reach the page between two game ticks. `agent-browser batch` runs a `wait --fn` on the P4 tick and the `mouse move/down/up` that follow it in one call, which lands the click on the next tick. Separate CLI calls can miss it.

- **Sound on.** Before choosing the focus, turn on the SDK's sound and area sound the way a returning player's saved settings would: read the JSON in `localStorage` key `osrs-sdk:settings` (`{"version":1,"values":{...}}`), set `values.playsAudio` and `values.playsAreaAudio` to `true`, and write it back with `agent-browser eval`. The reload reads it. After P4 tick 0, wrap `AudioBufferSourceNode.prototype.start` with `agent-browser eval` so each start records the P4 tick, how far into that tick it came, the buffer's length and sample rate, and the audio context's state.
- **Dodge on mark ticks.** Run `agent-browser select "#focus" explosions`, then wait until `focus=explosions` is in the URL. Compute the canvas centre from `agent-browser get box "#world"`. In one batch, wait for P4 tick 16 with `>= 16` and click `DODGE_CLICK_SIDE_PX` (110) right of and `STEP_CLICK_DOWN_PX` (25) below the centre. That pixel is the tile two west of the player on its row, because the camera faces south. In the next batch wait for tick 17, wait `MARKER_SHOT_DELAY_MS` (450), and screenshot `explosion-left.png`. It shows the shards on (5, 1) and the player on (3, 1). Repeat the batch click after ticks 18, 20, 22, 24 and 26, alternating left and right. `log()` shows a `walk-ordered` input in rows 17, 19, 21, 23, 25 and 27, the first mark on (5, 1), and `avoided` at 18, 20, 22, 24, 26 and 28.
- **Late step.** In one batch, wait for tick 48, click the tile two west, wait 200 and screenshot `explosion-standing.png`. The click lands on tick 49, the impact tick. The screenshot shows the shards on the player, who has not moved yet. `log()` shows the mark at 48 on the tile the player stood on, no input in row 48, the step in row 49, and `explosion-resolved` at 49 as a hit on that tile with receipt `{requested 16, applied 16, beforeHp 99, afterHp 83, prayer null}`, while row 49 ends with the player elsewhere.
- **Hear the sounds.** Wait for tick 59. The recorded starts at 22050 Hz with 14332 samples (synth 12638) fall at ticks 14 and 45, and those with 8820 samples (synth 12537) at 17 to 27 and 48 to 58, every 2 ticks. Each runs on a `running` context. Other starts, such as the player's hit sound, have another rate. Set both sound settings back to `false` before the next page.
- **Camp under the boss.** Run `agent-browser open "http://127.0.0.1:8002/?seed=1&focus=explosions"`. In one batch, wait for P4 tick 0 and click `UNDER_BOSS_CLICK_UP_PX` (120) above the centre. The boss is hidden until tick 4, so the click walks the player to (5, 6) instead of attacking. Screenshot `explosion-under.png` 450 ms after tick 17. It shows the player's tile outline inside the boss's footprint. The boss model hides the shards. Wait for tick 29. `log()` shows every inner `explosion-resolved` at 18 to 28 on (5, 6) with `underBoss: true` and a hit, leaving 83, 67, 51, 35, 19 and 3 HP.
- **Pixels.** The script counts pixels within 12 of the shard colour `#5e317b` in a box from 40% to 60% of the width and 45% to 60% of the height, which holds the player's tile. A larger box also caught the 5x5's rim and the boss's blades, which sit near the player on the measured platform. In `explosion-left.png` they are at least 0.1% of the box and their mean column lies at least 1% of the width left of the centre (measured 0.96% at 1.7% and 2.1% left). In `explosion-standing.png` they are at least 0.1% and within 1.6% of the centre (measured 0.52% to 0.57% at 0.6% and 0.7% left). With the camera settled on the player the shards would sit about 8.6% left; with no camera movement they would sit at the centre.
- **Scripted.** `scripts/verify.sh browser` runs these steps after the lifeforce-orb recipe and records `explosionsDodgedOnMarkTicks`, `lateStepHitOnMarkedTile`, `campingUnderBossHit`, `explosionSoundsOnSchedule` and `markerStaysOnCapturedTile` in `observed.json`, with the measured shards under `observed.explosions.shards` and the heard sounds under `observed.explosions.sounds`.

## Gotchas

- Reacting to the shards is too late by design. The shards appear when the mark tick has already captured the tile, and a click after that moves the player on the impact tick. Click before the mark tick, as the rhythm of every 2 ticks allows.
- The camera follows the player with a short lag. Screenshots taken right after a dodge show the shards closer to the centre than they settle. 450 ms after the mark tick they sat 22 to 27 px, under half a tile, left of the centre in the last runs, while the player was drawn right of it.
- The dodges drift because the camera lags: runs stepped to (3, 1), (6, 1), (2, 1), (6, 1) and (2, 1). The north band runs from x 2 to 11, so the drift stays on floor.
- A left-click under the boss attacks him once he is drawn. Walk under him while he is hidden (P4 ticks 0 to 3), or through the context menu.
- Under `focus=explosions` the floor deals no damage, so camping under the boss in the inner void costs only the explosions. In the full fight the inner void floor would also hit.
- The `scripts/verify.sh browser` order runs this recipe before the loadout recipe, which opens its own page.
- Headless Chrome starts the audio context `running`, so this sound check does not test the resume on the first click. The [timing cues](./timing-cues.md) recipe does, in a session that starts each context suspended.
- The buffer lengths come from the SDK's own synthesizer run on cache 2746. A different cache or synthesizer can change them.
- The look is a footage-coloured placeholder. The spec's cache candidate, spotanims 4299 to 4302, renders a white disc and a white flash, so the data file records it as rejected.
