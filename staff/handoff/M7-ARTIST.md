# Handoff — Artist M7

Artist creates first audio asset layer. No code/content/docs beyond Artist status and deterministic generator.

## Preconditions

GD M7 amendment merged and QA Spec M7 APPROVE.

## Deliverables

Exactly 10 short SFX files, using event ids from GD/balance §M7. PM kickoff target names:

1. `ui_click`
2. `ui_blocked`
3. `combat_hit`
4. `combat_heal`
5. `loot_pickup`
6. `craft_success`
7. `radio_signal`
8. `level_up`
9. `boss_phase`
10. `confirm_success`

Recommended path: `assets/audio/<id>.wav` or approved browser-compatible format.

Add one deterministic generator script under `tools/art/` or `tools/audio/`. No ML/GAN/online generators.

## Budget

M7-add ≤80 KB; project assets total ≤730 KB. Report per-file sizes and `du -sk assets` in `staff/status/ARTIST.md`.

## Forbidden

No `src/`, `content/*.json`, `docs/`, чужие staff. No music/voice/long ambience. Do not regenerate M1–M6 assets.
