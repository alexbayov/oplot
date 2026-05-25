# Handoff — QA Spec M7

QA Spec verifies GD M7 amendment before production starts.

## Checklists

1. **Scope/counts:** exact zones=9, items=80, recipes=42, SFX=10, tweens=16, tests=176; no `~`/`≥` for DoD.
2. **Balance:** `balance.md` §M7 has before/after tuning table for M2–M6; no new mechanics disguised as tuning.
3. **Content readiness:** 6 new zones use existing mobs; 45 items and 24 recipes have enough data for Content.
4. **SFX policy:** 10 events, registry schema, path/trigger/volume, no music/voice.
5. **Animation policy:** 16 tween events, visual only, scene targets clear.
6. **Smoke regression:** covers M2 core loop, M3 zones, M4 progression/perks, M5 boss/daily/gas/T3, M6 radio.
7. **Anti-scope/recovery:** no forbidden scope, GD PR only edits GD-owned files, Recovery block/status present.

## Verdict

Write only `staff/status/QA.md` section `# M7 Spec Review` with verdict APPROVE or CHANGES_REQUESTED, checklist results, blockers, non-blocking follow-ups.
