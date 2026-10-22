# Lifeforce orb

Four ticks after each void forms, Ocellus takes half the player's current HP, rounded down, whatever prayer is on. A teal swirl plays on the player a tick before the hit. On the hit tick an orb starts to form 2 to 5 tiles away, off the void and never under the boss. Its four chimes count down to the glow, and the dark orb shows a tick or two after the hit. Every tile of the measured platform is within 4 tiles of safe floor, so the orb always lands within 5. It glows teal once it is ready, 12 ticks after an inner hit or 6 after an outer one. A player who ends a tick on the ready orb gets back exactly the HP that hit took, the tick after, even above 99. An inner orb nobody takes vanishes 18 ticks after the hit. An outer one does the same, and the next tick it heals the boss by the HP it held.

## Sub-features

- `lifeforce-tell` logs `lifeforce-told` at P4 tick 11 (and 42) and plays spotanim 4313 on the player's tile.
- `lifeforce-hit` logs `lifeforce-drained` at 12 (and 43) with a receipt of `floor(HP / 2)`, through any protection prayer.
- `orb-dormant` logs `orb-spawned` on the hit tick, 12 (and 43), and plays spotanim 4311 (inner) or 4309 (outer) on the orb's tile. Their frame sounds are the orb's four chimes, checked in the [timing cues](./timing-cues.md) recipe.
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

- **Collect the inner orb.** Run `agent-browser select "#focus" lifeforce-orb`, then wait until `focus=lifeforce-orb` is in the URL. Wait for P4 tick 12 with `>= 12` and screenshot `orb-hit.png`. It shows a red 49 on the player and the HP orb at 50. Leave the player on spawn (5, 1). Wait for tick 20 and take six screenshots back to back, `orb-dormant-1.png` to `orb-dormant-6.png`. They show the dark orb on (9, 4) with a thin teal rim that pulses. Wait for tick 24 and take six more, `orb-glow-1.png` to `orb-glow-6.png`. They show a teal swirl around the orb that dims in about one frame of four. Then compute the canvas centre from `agent-browser get box "#world"` and click `ORB_CLICK_RIGHT_PX` (-195, so 195 left) and `ORB_CLICK_UP_PX` (78) above it with `mouse move/down/up`. With the camera centred on spawn, that pixel is tile (9, 4), where seed 1 puts the orb. When measured, (-235, -78), (-162, -78), (-180, -90) and (-190, -63) each clicked (9, 4), while (-155, -73) clicked (8, 4) and (-180, -56) clicked (9, 3). `snapshot().destination` is (9, 4). Wait for tick 30. `log()` shows `lifeforce-told` at 11, a 49 `lifeforce-drained` at 12, `orb-spawned` at 12 on (9, 4) with credit 49, `orb-matured` at 24, the player on (9, 4) two ticks after the click took effect, and one `orb-returned` the tick after the player reached it, with receipt `{requested 49, applied 49, beforeHp 50, afterHp 99}`.
- **Skip the orbs.** Run `agent-browser open "http://127.0.0.1:8002/?seed=1&focus=lifeforce-orb"` and do nothing. Wait for tick 63 and screenshot `orb-skip.png`. The boss bar reads 1380 / 5420. `log()` shows `orb-expired` for the inner orb at 30 and the outer orb at 61, no `orb-returned`, and one `boss-healed` at 62 with cause `unclaimed-orb` and receipt `{requested 25, applied 25, beforeHp 1355, afterHp 1380}`.
- **Pixels.** The script counts teal pixels, where green is at least 120 and exceeds red by 60 and blue exceeds red by 30. It counts them only inside `ORB_BOX`, from 60 px left to 50 px right and from 75 px above to 5 px below the orb's click pixel, so the player, the HUD and the FPS meter never count. The highest glow frame must beat the highest dormant frame by at least 3 percentage points of that box. On (9, 4), 7 tiles from the player, a drawn glow peaked at 8.39% against a dormant peak of 1.32%. With the glow removed, every glow frame read 0% against a dormant peak of 1.56%, because the spawn animation starts on the hit tick and ends before tick 24. The bar sits between the two. The glow's dim frames fall to 2.29%, level with the dormant rim, so a single frame cannot tell the two apart. On (3, 2), 3 tiles away, the glow peaked at 12.27% against 0.27%.
- **Scripted.** `scripts/verify.sh browser` runs both steps and records `orbToldAndDrained`, `orbSpawnedDormant`, `orbClickTargetedOrb`, `orbGlowsOnSchedule`, `orbReturnedTickAfterArrival`, `orbGlowDrawn` and `skippedOrbHealsBoss` in `observed.json`, with the measured shares under `observed.orb.tealShare`.

## Gotchas

- Keep the player on spawn until the glow frames are taken. The camera follows the player, so a move shifts the orb out of `ORB_BOX` and aims the click at another tile, and a player standing on the orb hides its glow.
- The inner orb expires at tick 30. The click after the glow frames lands about tick 25 and the run to (9, 4) takes two ticks, which leaves about two ticks to spare.
- A click takes effect on the next game tick. Read `destination` after waiting, not straight after `mouse up`.
- HP above 99 needs a heal between the hit and the return. The trainer has no food, so the browser run returns to 99. The SDK regenerates 1 HP at P4 tick 199, which the Jest test `a return can pass max HP` uses to reach 100.
- Without `seed=1` the orb lands on another tile and the click constants miss it. The ticks do not change.
- The tell's swirl (4313) is short. A screenshot on the tick it starts can miss it; about 350 ms later it shows.
