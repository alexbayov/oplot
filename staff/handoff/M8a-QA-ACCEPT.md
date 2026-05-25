# Handoff — QA Acceptance M8a

QA performs acceptance review on Engineer M8a PR via local octopus-merge (single role-PR on M8a, so the "octopus" is degenerate but the dry-run discipline carries) + 3-Gate evaluation. Verdict APPROVE or CHANGES_REQUESTED. No spec writing, no code, no content.

## Preconditions

- GD M8a amendment merged.
- QA Spec M8a APPROVE merged.
- Engineer M8a PR `m8a/platform → m8a-integration` Ready (not Draft).
- Local clone of `m8a-integration` synced.

## Approach

3-Gate acceptance with local merge dry-run:

### Gate 0 — Merge dry-run

- Local branch `qa/m8a-acceptance-test` from `m8a-integration`.
- Merge Engineer PR locally; report conflicts (expected: 0 since no parallel Content / Artist on M8a).
- Net delta summary: files changed, +/- LOC.

### Gate 1 — Static checks

- `npm install`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` — все PASS.
- Vitest count matches QA-Spec-locked target (M7 176 + M8a additions; expected ~190).
- Bundle: JS ≤ 2 MB (M7 baseline 1.49 MB; M8a delta expected ~10–50 KB for SDK wrapper + cloudSave + locale).
- Project assets unchanged (no new files in `assets/`).

### Gate 2 — Runtime smoke

**M2–M7 regression:**
- Core loop intact: Base → Map → Sortie → Combat → Loot → Return → Inventory → Craft.
- All 9 zones unlock chain progressive (Forest → Suburbs → Warehouse → City → ... → Power Plant).
- All 3 bosses fightable; daily-instance cooldown works.
- Radio system intact: 6 signals resolve, `radio_trust` clamps [−5, +5].
- Perks: level-up popup picks 3 of unused; veteran_conditioning fallback when pool exhausted.
- Audio: 10 SFX trigger correctly; mute + volume work.
- Tweens: 16 events fire visually; gameplay state unaffected.

**M8a new flows:**
- SDK init: in production-like environment (Yandex sandbox or harness with SDK script) succeeds; `LoadingAPI.ready()` fires after Boot.
- SDK fail-soft: in plain browser without network / with SDK script blocked, game still starts identically to M7; no `console.error`, no `throw`.
- Cloud save round-trip: play through one sortie + craft → reload page → game resumes from cloud snapshot (level, xp, perks, inventory, baseStash, radio_trust, settings all restored).
- Conflict policy: simulate "remote newer" (manually inject) → local replaced; simulate "local newer" → remote ignored.
- Throttle: rapid settings toggles do not produce > 1 save inside `MIN_CLOUD_SAVE_INTERVAL_S`.
- Settings persistence: mute / volume survive reload via cloud save.
- Mobile viewport: Chrome mobile-emulator (iPhone 14 portrait + Pixel 7 portrait) — safe-area visible, no double-tap zoom, audio unlocks on first touch.
- Locale: all user-facing strings RU; `t()` registry has no missing keys for paths exercised.

### Gate 3 — Spec / anti-scope compliance

- `docs/GDD.md` §13a fully populated; matches `staff/status/M8a.md` Scope.
- Anti-scope grep (PASS = 0 hits in `src/`, `content/`):
  - `setAds`, `showFullscreenAdv`, `showRewardedVideo` — no ads.
  - `getPayments`, `purchase` (Yandex SDK API) — no IAP.
  - `getLeaderboards`, `setScore` — no leaderboards.
  - `getAchievements`, `achievement` (Yandex SDK API) — no achievements.
  - No new mob/zone/item/recipe/perk/radio entries (`content/*.json` diffs must be empty).
  - No music / voice / ambience filenames in `content/sfx.json` or `assets/audio/`.
- Snapshot size: actual cloud save snapshot ≤ Yandex 200 KB player data quota.

## Output

Write verdict only in `staff/status/QA.md`, append section `# M8a Acceptance`:
- Verdict: APPROVE or CHANGES_REQUESTED.
- Gate 0–3 results.
- Blockers (each must clear before APPROVE).
- Non-blocking notes (recommendations for M8b).
- Commands run.
- Recovery state.

Open PR `qa/m8a-acceptance-test → m8a-integration` changing only `staff/status/QA.md`. Do not merge role-PR or push the test-merge branch.

## Forbidden

- No `src/`, `content/`, `assets/`, `docs/` changes in QA PR.
- No self-merge of role-PR.
- No PAT in URL / echo / print.
- No APPROVE if any Gate blocker exists.
- No skipping any Gate item.

## QA fix cherry-pick pattern (M6 lesson, carry-over)

If Gate 2 / Gate 3 finds a runtime bug fixable by ≤ 10 LOC, QA may apply the fix locally on `qa/m8a-acceptance-test` for verification, but PM will cherry-pick it into `m8a/platform` (Engineer's role-PR) before merge. QA does not self-merge test branch as role-PR.
