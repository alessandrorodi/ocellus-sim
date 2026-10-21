# Credit line

The bottom-left corner of the game view always shows the Jagex Fan Content Policy credit. The trainer must keep it visible for as long as it uses cache assets.

## Sub-features

- `credit-text` shows the exact credit sentence from the README.
- `credit-visible` keeps the credit visible over the canvas without blocking clicks on it.

## How to get to it (user POV)

- Open the trainer and look at the bottom-left corner.

## Driving it with agent-browser

Preconditions:

- The baseline preconditions in the index hold.

- **Text.** Read the credit. Run `agent-browser --json get text "#credit_line"`. `data.text` is exactly `Created using intellectual property belonging to Jagex Limited under the terms of Jagex's Fan Content Policy. This content is not endorsed by or affiliated with Jagex.`
- **Visible.** Run `agent-browser --json is visible "#credit_line"`. `data.visible` is `true`.
- **Proof.** Take a screenshot with an absolute path. The credit appears in white text at the bottom left.
- **Scripted.** `scripts/verify.sh browser` checks the text and the visibility before it clicks.

## Gotchas

- The credit is a DOM element over the canvas, not canvas text, so `get text` reads it directly.
- It uses `pointer-events: none`. A click on it reaches the floor underneath, which is intended.
