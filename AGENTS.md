# AGENTS.md

## Rules
- Use Node 22.
- Follow the osrs-sdk patterns: `Mob` subclasses for bosses, `Entity` subclasses for ground hazards, a `Region` subclass for the arena, Jest with the SDK's `TestRegion`/`TestNpc`.
- Keep every boss timing and count in one data file, labelled unverified, with a wiki source per value.
- Never commit extracted cache assets or models. `public/osrs-assets/` is generated at build time.
- Keep the project free: no ads, donations or paid features. Keep the credit line in the README and the app. Keep "RuneScape" and "Jagex" out of names.
- Prove each change with the repository's verification skill before calling it done.
- The verification recipe is `.claude/skills/verify-archive-ocellus/` (`scripts/verify.sh` runs it).
