# Void floor

The floor turns to void twice in each 60-tick cycle. The inner void covers the 5x5 under and around Ocellus from P4 tick 8 to 29. The outer void floods everything else from 39 to 58. Both draw as starry near-black tiles inside a glowing purple rim in the default 3D view. A player who starts a tick on void takes 9 to 11 damage that tick: on the flood from 44, five ticks after it forms, and on the inner square from 10 by default. The 5x5 stays safe during the flood, including the tiles under the boss. Void blocks neither walking nor line of sight, so a Twisted Bow shot from the flood lands on the boss.

## Sub-features

- `void-inner` draws the 5x5 as void from P4 tick 8 and clears it at 30.
- `void-flood` draws every tile outside the 5x5 as void from 39 and clears it at 59.
- `void-flood-damage` lands a `floor-hit` row on each tick from 44 that the player starts on the flood, with amounts from the seeded `floorDamage` stream, until the flood clears or the player dies.
- `void-ring-safe` lands no `floor-hit` while the player starts each tick inside the 5x5 during the flood.
- `void-walkable` lets the player walk across the flood into the 5x5.
- `void-ranged-sight` lets the ranged setup fire the Twisted Bow from a flood tile outside the 5x5, across the flood, and land the arrow on the boss.
- `void-inner-choice` selects the inner void's rule with `innerVoidFloor`: `one-tick-grace` (default, damage from 10), `outer-rule` (from 13) or `harmless`.

## How to get to it (user POV)

- Open `http://127.0.0.1:8002/` and stand still: the flood reaches the spawn tile and its damage starts at P4 tick 44.
- Walk into the 5x5 before P4 tick 44 to stand in the safe ring.
- Stay on the flood past tick 44 and click the boss: the bow fires from where you stand and the floor keeps hitting you until you walk in.
- Pick `Void floor` in the `Focus` selector and press `Restart` to practise the floor alone.
- Add `innerVoidFloor=outer-rule` or `innerVoidFloor=harmless` to the URL for the other inner-void rules.

## Driving it with agent-browser

Preconditions:

- The baseline preconditions in the index hold, with the page opened at `http://127.0.0.1:8002/?seed=1&specialSelection=replay-v2` and the walk check done, so the player stands on (13, 11).

- **Shoot across the flood, then walk in.** The page's default setup is ranged, so the player holds the Twisted Bow. Wait for P4 tick 44 with `>= 44`, when the flood starts to damage. Compute the canvas centre from `agent-browser get box "#world"` and click `BOSS_CLICK_LEFT_PX` (130) left of and `BOSS_CLICK_UP_PX` (160) above it with `mouse move/down/up`. That pixel is the boss's robe while the camera is centred on (13, 11). Wait until a `log()` row from tick 44 on has `combatDraws` above 0, which is the tick the bow fires. Then click `RING_CLICK_LEFT_PX` (55) left of and `RING_CLICK_UP_PX` (90) above the centre, which walks the player to the ring tile (12, 7). Wait for tick 52 and run `agent-browser screenshot "$PWD/.verify/<run>/flood-ring.png"`. The screenshot shows the starry flood around the lit 5x5 and the player in the ring beside the boss. With `seed=1`, the bow fires at tick 45 from (13, 11), the tick a `floor-hit` lands on that tile. The arrow crosses the flood and lands at 48 as a `player-hit-judged` event with style `ranged`, outcome `passed` and `requested` 57, and boss HP falls from 1355 to 1298 on that row. From 44 to 58, a `floor-hit` lands on exactly the ticks the player starts outside the 5x5, and none lands once the player stands on (12, 7). One run had hits from 44 to 46 on (13, 11) and at 47 on (13, 9), with the player on (12, 7) from 48. The walk-in tick moves by one between runs, with the click's place in the tick.
- **Stand on the flood.** After the focus check, run `agent-browser select "#focus" void-floor` and `agent-browser click "#restart"`. Wait until `focus=void-floor` is in the URL, then wait for P4 tick 12 and screenshot `void-inner.png`. It shows the starry 5x5 with its purple rim under the boss while the player stands south of it. Wait for tick 45 and screenshot `void-flood.png`. It shows the flood under the player with red hitsplats. Wait until `snapshot().fight.run.kind` is `ended`. The `floor-hit` rows in `log()` are `[[44,9],[45,11],[46,10],[47,11],[48,10],[49,9],[50,9],[51,10],[52,9],[53,10],[54,1]]` as `[at, receipt.applied]`, all on (10, 10), and `run-ended` is `[[54,"death"]]`.
- **Pixels.** The script counts screenshot pixels within 10 of the void colour `#1e2529` in each channel. `before.png`, taken before any void, has under 0.3%. `void-inner.png` has between 0.6% and 10%. `void-flood.png` and `flood-ring.png` each have over 20%. Frames with the void drawn measured about 1.3% and 50%. A floor mesh facing away from the camera measured 0.1%.
- **Scripted.** `scripts/verify.sh browser` runs both steps and records `rangedShotFromTheFlood`, `rangedShotLanded`, `ringSparedInFlood`, `floodHitsStandingStill`, `noVoidBeforeTheFight`, `innerVoidDrawn` and `floodDrawn` in `observed.json`. The shot's launch tick, tile and landing are under `observed.floodShot`, each flood tick's start tile and floor hit under `observed.floodRows`, and the measured shares under `observed.voidPixelShare`. The checks expect the launch on the walk target (13, 11), outside the 5x5, on a tick the floor hits it, and a passed ranged landing after it whose damage is the row's boss HP loss. They pin neither the launch tick, which moves with the click's place in the tick, nor the damage, whose rolls the loadout tests own.

## Gotchas

- Click the ring tile only after the bow fires. A floor click before the attack cancels it, and `rangedShotFromTheFlood` then fails.
- The player takes four or five floor hits before reaching the ring, about 40 to 50 of 99 HP. A ring click several ticks late can let the flood kill the player before tick 70.
- The melee setup is not driven across the flood. Its scythe reaches the boss only from the ring, so it would show the same walk across void tiles that the ring click already shows.
- Without `seed=1` the floor amounts differ. The tick numbers and the safe tiles do not.
- The standing-still page ends at P4 tick 54 with the player dead. Wait on `run.kind`, not `run.tick`, because an ended run has no current tick.
