# Archive Ocellus Trainer verification map

This directory is the maintained source for verifying what a user of the trainer can see and do. Read this index before driving the app, then use the matching feature file as the recipe. Add a file here when a mechanic ships, and change the file when its user path changes.

## Baseline preconditions

- `scripts/verify.sh serve` has started the trainer at `http://127.0.0.1:8002/`, and `scripts/verify.sh doctor` passes.
- `public/osrs-assets/manifest.json` contains `npc-16677` and `npc-16678` from cache `openrs2:2746`, and `public/osrs-assets/sprites/` holds the head icons.
- `AGENT_BROWSER_SESSION` names a session that belongs to this run.
- The viewport is 1280x800 (`agent-browser set viewport 1280 800`).
- The page has loaded fresh, and `window.__archiveOcellusProbe.snapshot().tick` has reached 8, past the 6-tick GET READY countdown.

## Driving conventions

- Start every recipe from a fresh page load unless its preconditions say otherwise.
- Use real input: `agent-browser open`, `mouse move/down/up`, and CSS ids of visible elements.
- Read world state only through `window.__archiveOcellusProbe.snapshot()` and `window.__archiveOcellusProbe.log()`. Both are read-only and exist only in development builds.
- Never change state through `eval`, the snapshot handle or SDK globals.
- Pixel positions are relative to `agent-browser get box "#world"`.

## Proof and skip reporting

- Capture the user action and the resulting state: a snapshot and a screenshot before the action, the action itself, then a snapshot and a screenshot after it.
- Save console output (`agent-browser console`) and page errors (`agent-browser --json errors`). An uncaught page error fails the proof.
- Record the feature ID and the entry point with every artifact.
- Report an unreachable path with the command you tried and the precondition that was not met.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then has exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with agent-browser` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and an observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

## Features

- [Arena render](./arena-render.md) covers page load, the floor, the player model and the HUD.
- [Click to walk](./click-to-walk.md) covers walking the player to a clicked floor tile and stopping at the platform's edge.
- [Credit line](./credit-line.md) covers the Fan Content Policy credit that must stay visible.
- [Seed per run](./seed.md) covers the fresh seed for each run, the seed box, and replaying a typed seed.
- [P4 cycle](./p4-cycle.md) covers the boss, the lead-in, the 60-tick cycle's stages and overheads, the fight log and the drill focus control.
- [Loadouts](./loadouts.md) covers the ranged and melee setups, inventory switches, Ralos's Division special attack and the setup control.
- [Void floor](./void-floor.md) covers the inner square and outer flood, their damage, the safe 5x5 and how both draw in 3D.
- [Lifeforce orb](./lifeforce-orb.md) covers the lifeforce tell and hit, the orb from spawn to glow, its return, its expiry and the boss heal from an unclaimed outer orb.
- [Supplies and key bindings](./supplies-and-keybinds.md) covers item names in menus, the carried brews, restores and boost potions, drinking them, and binding the side-panel tabs to keys.
- [Personal explosions](./explosions.md) covers the marks on the player's tile, the hit a tick later, dodging on mark ticks, the late step, standing under the boss and how the shards draw.
- [Transition attack](./transition-attack.md) covers the boss's rise and landing, the three tells, the styled hit and the protection prayer judged when it lands.
- [Overheads, heals and rifts](./overheads-rifts.md) covers the boss's curse icons, deflected player hits, the Soul Split heal, and void rifts from spawn to kill or burst, with the kill line in the chat.
