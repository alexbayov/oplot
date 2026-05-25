# Kickoff: QA Acceptance — Веха M8a

Ты — **QA Engineer (Acceptance)** на M8a проекта «Оплот».

Repo: https://github.com/alexbayov/oplot
Brief: `staff/handoff/M8a-QA-ACCEPT.md`
Base branch: `m8a-integration`

## When

Start after Engineer M8a PR `m8a/platform → m8a-integration` Ready. Preconditions: GD M8a amendment merged, QA Spec M8a APPROVE merged, Engineer PR not Draft.

## Context

- M7 закрыта (`main` HEAD `2399b7b`, см. `staff/handoff/M7-SUMMARY.md`).
- M8a = Platform & Persistence (Yandex SDK + cloud save + mobile-first viewport + locale RU + settings migration).
- На M8a одна role-PR (Engineer); Content/Artist не участвуют.
- `staff/status/M8a.md` содержит scope/anti-scope/DoD.

## Do this — 3-Gate acceptance (с локальным merge dry-run)

1. Checkout `m8a-integration` локально, pull latest.
2. Создай локально `qa/m8a-acceptance-test` от `m8a-integration`.
3. **Gate 0 — Merge dry-run.** Merge Engineer PR `m8a/platform` локально. Conflicts должны быть 0 (нет parallel Content/Artist). Зафиксируй net delta: файлы, +/− LOC.
4. **Gate 1 — Static checks.** На локальном `qa/m8a-acceptance-test`:
   - `npm install`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
   - Vitest count = QA-Spec-locked target (M7 176 + M8a additions; ожидается ~190).
   - JS bundle ≤ 2 MB (M7 baseline 1.49 MB; M8a delta ~10–50 KB).
   - `assets/` без новых файлов.
5. **Gate 2 — Runtime smoke.**
   - **M2–M7 regression:** core loop (Base→Map→Sortie→Combat→Loot→Return→Inventory→Craft), 9 zones unlock chain, 3 boss + daily-instance cooldown, radio 6 signals + trust clamp [−5,+5], perks level-up + veteran fallback, 10 SFX trigger + mute/volume, 16 tweens visual-only.
   - **M8a new flows:**
     - SDK init в production-like env (Yandex sandbox/harness) succeeds; `LoadingAPI.ready()` fires после Boot.
     - SDK fail-soft в чистом браузере без сети / SDK script blocked: игра стартует идентично M7, no `console.error`, no `throw`.
     - Cloud save round-trip: sortie + craft → reload → resume (level/xp/perks/inventory/baseStash/radio_trust/settings все восстановлены).
     - Conflict policy: remote-newer wins (manual injection); local-newer wins.
     - Throttle: rapid settings toggles ≤ 1 save в `MIN_CLOUD_SAVE_INTERVAL_S`.
     - Settings: mute/volume survive reload via cloud.
     - Mobile viewport: Chrome mobile-emulator (iPhone 14 portrait + Pixel 7 portrait) — safe-area visible, no double-tap zoom, audio unlocks on first touch.
     - Locale: все user-facing strings RU; `t()` registry no missing keys для exercised paths.
6. **Gate 3 — Spec/anti-scope compliance.**
   - GDD §13a fully populated; matches `staff/status/M8a.md` Scope.
   - Anti-scope grep (PASS = 0 hits в `src/`, `content/`):
     - `setAds` / `showFullscreenAdv` / `showRewardedVideo` — no ads.
     - `getPayments` / `purchase` — no IAP.
     - `getLeaderboards` / `setScore` — no leaderboards.
     - `getAchievements` — no achievements.
     - `content/*.json` diffs empty (no новых mob/zone/item/recipe/perk/radio).
     - `content/sfx.json` / `assets/audio/` — no music/voice/ambience filenames.
   - Snapshot size: actual cloud save ≤ 200 KB Yandex quota.
7. Write verdict only в `staff/status/QA.md`, append section `# M8a Acceptance`: APPROVE или CHANGES_REQUESTED, Gate 0–3 results, blockers, non-blocking notes, commands, recovery state.
8. Open PR `qa/m8a-acceptance-test → m8a-integration` changing only `staff/status/QA.md` (не толкай test-merge коммит как role-PR).
9. Send Alex: «QA Acceptance M8a verdict &lt;APPROVE|CHANGES_REQUESTED&gt;, PR &lt;ссылка&gt;».

## Forbidden

- No `src/`, `content/`, `assets/`, `docs/` changes в QA PR.
- No self-merge role-PR.
- No PAT в URL/echo/print.
- No APPROVE если хоть один Gate blocker.
- No skipping любого Gate item.

## QA fix cherry-pick pattern (M6 lesson)

Если Gate 2/3 находит runtime bug fixable ≤ 10 LOC, можно применить fix локально на `qa/m8a-acceptance-test` для верификации, но **PM** cherry-pick'нет его в `m8a/platform` (Engineer's role-PR) до merge. QA не self-merge test branch как role-PR.
