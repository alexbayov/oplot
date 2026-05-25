# Handoff — QA Acceptance M7

QA Acceptance is the final independent critic for M7 before PM merges role PRs.

## Preconditions

- GD M7 amendment merged.
- QA Spec M7 APPROVE merged.
- Content `m7/content`, Engineer `m7/polish`, Artist `m7/audio` PRs Ready.

## Gate 0 — integration preview

Create local test branch from `m7-integration` and octopus-merge all 3 production PR branches. If conflicts are architectural or ambiguous, return CHANGES_REQUESTED; do not guess.

## Gate 1 — static

Run:

- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run test` — exact **176/176** expected
- `npm run build`
- Asset budget check: JS ≤2 MB, M7 audio add ≤80 KB, project assets ≤730 KB

## Gate 2 — runtime smoke

Manual Chrome smoke covering 40+ points:

- M2 core loop: base → sortie → combat → loot → return → craft.
- M3 multi-zone navigation and unlocks.
- M4 XP/level/perks/level-up UI.
- M5 bosses/daily/gas/T3 regressions.
- M6 radio truth/trap/ambiguous/trust/ambush.
- M7 9-zone visibility, mute/volume toggle, 10 SFX triggers fail-soft, 16 tween visual hooks.

## Gate 3 — spec / anti-scope

Exact counts: zones=9, items=80, recipes=42, SFX registry=10, SFX files=10, tween events=16, vitest=176. Anti-scope grep clean for new mobs/bosses/T4, music/voice, SDK/cloud/ads/IAP, UI redesign, skill tree, modular weapons, faction reputation.

## Verdict

Write only `staff/status/QA.md` section `# M7 Acceptance` with APPROVE or CHANGES_REQUESTED, Gate 0–3 results, blockers, non-blocking notes, commands, and recovery state.
