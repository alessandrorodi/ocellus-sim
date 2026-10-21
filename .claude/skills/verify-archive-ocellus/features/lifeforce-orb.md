# Lifeforce orb

Four ticks after each void forms, Ocellus takes half the player's current HP, rounded down, whatever prayer is on. A teal swirl plays on the player a tick before the hit. The next tick a dark orb appears 2 to 5 tiles away, off the void and never under the boss. Every tile of the measured platform is within 4 tiles of safe floor, so the orb always lands within 5. It glows teal once it is ready, 12 ticks after an inner hit or 6 after an outer one. A player who ends a tick on the ready orb gets back exactly the HP that hit took, the tick after, even above 99. An inner orb nobody takes vanishes 18 ticks after the hit. An outer one does the same, and the next tick it heals the boss by the HP it held.

## Sub-features

- `lifeforce-tell` logs `lifeforce-told` at P4 tick 11 (and 42) and plays spotanim 4313 on the player's tile.
- `lifeforce-hit` logs `lifeforce-drained` at 12 (and 43) with a receipt of `floor(HP / 2)`, through any protection prayer.
- `orb-dormant` logs `orb-spawned` at 13 (and 44) and plays spotanim 4311 (inner) or 4309 (outer) on the orb's tile.
- `orb-glow` logs `orb-matured` at 24 (and 49) and loops spotanim 4310.
- `orb-return` logs `orb-returned` the tick after the player ends a tick on a ready orb, writes the HP back without the max-HP cap, and plays 4312 on the orb and 4314 on the player.
- `orb-expiry` logs `orb-expired` at 30 (and 61) and plays 4312.
- `unclaimed-orb-heal` logs `boss-healed` with cause `unclaimed-orb` at 62 when the outer orb was not collected.
- `orb-choices` select the pickup radius with `orbPickupRadius` (`on-tile` or `adjacent`), the outer orb's floor with `outerOrbTile` (`safe-floor` or `any-floor`), and the heal with `unclaimedOuterOrb` (`heals-boss` or `off`).

## How to get to it (user POV)

- Open `http://127.0.0.1:8002/` and watch the HP orb halve at P4 tick 12 and 43 in every cycle.
- Click the orb's tile once it appears and stand on it until it glows. HP comes back the tick after.
- Pick `Lifeforce orb` in the `Focus` selector and press `Restart` to practise the orb alone, or `Orb retrieval` to practise it with the void floor.
- Add `outerOrbTile=any-floor` to the URL to make outer orbs land on the flood, as one VOD shows.

## Driving it with agent-browser

Preconditions:

- The baseline preconditions in the index hold, the void-floor recipe has run, and the page shows its `void-floor` reload with the seed field at 1.
- `public/osrs-assets/manifest.json` lists spotanims 4309 to 4314. `scripts/verify.sh assets` rebuilds the assets when one is missing.

- **Collect the inner orb.** Run `agent-browser select "#focus" lifeforce-orb`, then wait until `focus=lifeforce-orb` is in the URL. Wait for P4 tick 12 with `>= 12` and screenshot `orb-hit.png`. It shows a red 49 on the player and the HP orb at 50. Leave the player on spawn (5, 1). Wait for tick 20 and take six screenshots back to back, `orb-dormant-1.png` to `orb-dormant-6.png`. They show the dark orb on (3, 2) with a thin teal rim that pulses. Wait for tick 24 and take six more, `orb-glow-1.png` to `orb-glow-6.png`. They show a teal swirl around the orb that dims in about one frame of four. Then compute the canvas centre from `agent-browser get box "#world"` and click `ORB_CLICK_RIGHT_PX` (110) right of and `ORB_CLICK_UP_PX` (15) above it with `mouse move/down/up`. With the camera centred on spawn, that pixel is tile (3, 2), where seed 1 puts the orb. `snapshot().destination` is (3, 2). Wait for tick 30. `log()` shows `lifeforce-told` at 11, a 49 `lifeforce-drained` at 12, `orb-spawned` at 13 on (3, 2) with credit 49, `orb-matured` at 24, the player on (3, 2) one tick after the click took effect, and one `orb-returned` the tick after the player reached it, with receipt `{requested 49, applied 49, beforeHp 50, afterHp 99}`.
- **Skip the orbs.** Run `agent-browser open "http://127.0.0.1:8002/?seed=1&focus=lifeforce-orb"` and do nothing. Wait for tick 63 and screenshot `orb-skip.png`. The boss bar reads 1380 / 5420. `log()` shows `orb-expired` for the inner orb at 30 and the outer orb at 61, no `orb-returned`, and one `boss-healed` at 62 with cause `unclaimed-orb` and receipt `{requested 25, applied 25, beforeHp 1355, afterHp 1380}`.
- **Pixels.** The script counts teal pixels, where green is at least 120 and exceeds red by 60 and blue exceeds red by 30. It counts them only inside `ORB_BOX`, from 60 px left to 50 px right and from 75 px above to 5 px below the orb's click pixel, so the player, the HUD and the FPS meter never count. The highest glow frame must beat the highest dormant frame by at least 7 percentage points of that box. A drawn glow peaked at 12.27% against a dormant peak of 0.27% on the measured platform, and at 14.70% against 2.35% before. Its dim frames fall to 2.42%, level with the dormant rim, so a single frame cannot tell the two apart. With the glow removed, the end of the spawn animation still reached 3.99% at ticks 24 and 25.
- **Scripted.** `scripts/verify.sh browser` runs both steps and records `orbToldAndDrained`, `orbSpawnedDormant`, `orbClickTargetedOrb`, `orbGlowsOnSchedule`, `orbReturnedTickAfterArrival`, `orbGlowDrawn` and `skippedOrbHealsBoss` in `observed.json`, with the measured shares under `observed.orb.tealShare`.

## Gotchas

- Keep the player on spawn until the glow frames are taken. The camera follows the player, so a move shifts the orb out of `ORB_BOX` and aims the click at another tile, and a player standing on the orb hides its glow.
- The inner orb expires at tick 30. The click after the glow frames lands about tick 25 and the run to (3, 2) takes one tick, which leaves about three ticks to spare.
- A click takes effect on the next game tick. Read `destination` after waiting, not straight after `mouse up`.
- HP above 99 needs a heal between the hit and the return. The trainer has no food, so the browser run returns to 99. The SDK regenerates 1 HP at P4 tick 199, which the Jest test `a return can pass max HP` uses to reach 100.
- Without `seed=1` the orb lands on another tile and the click constants miss it. The ticks do not change.
- The tell's swirl (4313) is short. A screenshot on the tick it starts can miss it; about 350 ms later it shows.
