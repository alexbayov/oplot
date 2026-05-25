# Kickoff: Engineer — Веха M8a

Ты — **Engineer** на M8a (Platform & Persistence) проекта «Оплот».

Repo: https://github.com/alexbayov/oplot
Brief: `staff/handoff/M8a-ENG.md`
Base branch: `m8a-integration`

## When

Start only after GD M8a amendment merged AND QA Spec M8a verdict APPROVE merged. На M8a нет Content / Artist — ты единственная role-сессия после QA Spec.

## Context

- M7 закрыта (`main` HEAD `2399b7b`, см. `staff/handoff/M7-SUMMARY.md`).
- M8 split: **M8a — Platform & Persistence** (этот gate); M8b — Monetization (отложен).
- `staff/status/M8a.md` содержит scope/anti-scope/DoD.
- M7 baseline: 176/176 vitest, JS 1.49 MB, 524 KB assets.

## Do this

1. Checkout `m8a-integration`. Read: `staff/status/M8a.md`, `staff/handoff/M8a-ENG.md`, approved `docs/GDD.md` §13a, `docs/balance.md` §M8a (если есть), `src/scenes/*`, `src/systems/*` (особенно audio из M7), `src/types/*`, `index.html`, `tests/*`, `staff/handoff/M7-SUMMARY.md`.
2. Baseline check: `npm install`, `npm run typecheck`, `npm run lint`, `npm run test` (expect 176), `npm run build` (expect ~1.49 MB).
3. Напиши план (5–7 пунктов): platform wrapper, cloudSave, locale, mobile-first (viewport + safe-area + audio unlock + portrait), settings persistence, тесты, статус.
4. Send Alex: «План готов, жду апрува PM».
5. После PM approve: branch `m8a/platform`, ранний scaffold commit + push + Draft PR `m8a/platform → m8a-integration` с Recovery block.
6. Реализуй по handoff:
   - `src/systems/platform.ts` — async `initPlatform()`, fail-soft на 4 failure modes, типизированный wrapper без `any`.
   - `src/systems/cloudSave.ts` — serialize/deserialize всего GameState, save/load через `player.setData/getData`, throttle `MIN_CLOUD_SAVE_INTERVAL_S`, conflict policy "remote newer wins by `saved_at`", fail-soft no-op при platform unavailable.
   - `src/systems/locale.ts` — `t(key)` RU registry.
   - `src/utils/audioUnlock.ts` — one-shot listener на pointerdown/touchstart resume AudioContext, интеграция с M7 audio.
   - `index.html` — viewport meta + Yandex SDK script tag.
   - BootScene/SettingsScene/CombatScene/ReturnScene/CraftScene — hooks на throttled `saveToCloud` на critical triggers + cloud load на boot.
   - Game container CSS safe-area-inset.
   - `touchstart preventDefault` на Phaser canvas.
   - Portrait orientation declared.
7. Тесты ~14 новых → target **~190/190 vitest PASS** (точное число залочено QA Spec'ом):
   - `tests/cloudSave.test.ts` (serialize round-trip, conflict, throttle, no-op).
   - `tests/platform.test.ts` (fail-soft на 4 failure modes, mock-based).
   - `tests/locale.test.ts` (t() registry).
   - `tests/audioUnlock.test.ts` (first gesture, idempotent).
8. Final self-check: `typecheck` / `lint` / `test` / `build` все зелёные; vitest на ~190; JS ≤ 2 MB; в `src/` нет `setAds` / `getPayments` / `getLeaderboards` / `getAchievements`; gameplay формулы Phaser-free, scenes вызывают helpers/systems.
9. Update only `staff/status/ENGINEER.md`: M8a, DONE_PENDING_REVIEW, commands run, test count, build size, recovery note.
10. Ready PR + Send Alex: «PR &lt;ссылка&gt;, готов к ревью PM».

## Forbidden

No `content/*.json`, `assets/*`, `docs/*`, чужие staff. No ads/IAP/leaderboards/achievements (M8b). No telemetry / analytics / backend / external HTTP кроме Yandex SDK script tag. No новых mobs/bosses/zones/items/recipes/perks/radio/SFX/tweens. No новых combat/craft/radio/progression механик. No music/voice. No UI redesign. No третьих сторонних UI/audio/SDK libs (npm). No `any` / lazy type escapes / `getattr`-style runtime access. No self-merge. No PAT в URL/echo/print.
