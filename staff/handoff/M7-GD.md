# Handoff — Game Designer M7

## Preconditions

- `m7-integration` exists from `main` HEAD `859a652` after M6 gate-close PR #57.
- M6 baseline: 3 zones, 11 mobs, 35 items, 18 recipes, 6 radio signals, 164 tests, assets 456 KB.

## Deliverables

Add to `docs/GDD.md` §11.M7 and `docs/balance.md` §M7. Do not implement code/content/assets.

### GDD §11.M7 must include

- M7 scope: balance tuning + polish + content expansion.
- 9-zone model: 3 existing + 6 new, using existing mob pool only.
- 80-item taxonomy: 35 existing + 45 new; no T4.
- Recipe policy: 18 existing + 24 new = 42 total.
- Audio policy: exactly 10 short UI SFX, no music/voice; Settings mute/volume.
- Animation policy: exactly 16 Phaser tween events, visual only.
- Smoke regression outline for M2–M6.

### balance.md §M7 must include

- Before/after tuning table for M2–M6 balance numbers.
- Per-zone table for exactly 9 zones: id, unlock, risk/reward, mob pool, item pool, return/drop multipliers.
- Count table: zones 3→9, items 35→80, recipes 18→42, tests 164→176.
- SFX table: 10 trigger ids + recommended volume.
- Tween table: 16 event ids + scene targets.

## Anti-scope

Explicitly reject new mobs/bosses/T4, music/voice, SDK/cloud/ads/IAP, UI redesign, skill tree, modular weapons, faction reputation.

## Acceptance

Only `docs/GDD.md`, `docs/balance.md`, `staff/status/GAME_DESIGNER.md`. Exact numbers must match `staff/status/M7.md`. Draft PR early with Recovery block.
