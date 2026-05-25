# Project Context — Oplot

> Короткая память проекта для любой новой Devin-сессии. Если нужно больше деталей, переходи по `staff/LINKS.md`.

## Что это

«Оплот» — mobile-first HTML5 survival RPG для Яндекс.Игр.

- Stack target: Phaser 3 + TypeScript + Vite + Yandex Games SDK.
- Core fantasy: вылазки за ресурсами, вес как риск/жадность, крафт, пошаговый бой, развитие оплота.
- Текущая рабочая модель: мульти-сессионная команда под управлением PM/оркестратора.

## Источники правды

| Что | Файл |
|---|---|
| Процесс и роли | `staff/TEAM.md`, `staff/PROCESS.md`, `staff/ORCHESTRATION.md` |
| Текущий gate (M6 — kickoff) | `staff/status/M6.md`, `staff/handoff/M5-SUMMARY.md` |
| Завершённая веха M4 | `staff/status/M4.md`, `staff/handoff/M4-SUMMARY.md` |
| Завершённая веха M3 | `staff/status/M3.md`, `staff/handoff/M3-SUMMARY.md` |
| Завершённая веха M2 | `staff/status/M2.md`, `staff/handoff/M2-SUMMARY.md` |
| Завершённая веха M1 | `staff/status/M1.md`, `staff/handoff/M1-SUMMARY.md` |
| State machine | `staff/STATE_MACHINE.md` |
| План вех | `staff/PLAN.md` |
| Механики | `docs/GDD.md` |
| Числа и баланс | `docs/balance.md` |
| Контент | `content/*.json` |
| Визуальный стиль | `docs/style-guide.md`, `assets/` |

## Главные правила

- Роль работает только в своей зоне ответственности.
- Роль обновляет только свой `staff/status/{ROLE}.md` и PR recovery block.
- PM обновляет `staff/status/M{N}.md`, `PLAN.md`, `CHANGELOG.md` и общий статус.
- QA всегда отдельная сессия от той роли, которую проверяет.
- PR не self-merge. Мерджит PM после нужного gate.

## Текущий snapshot (M6 — kickoff)

_Last reconciled with GitHub: 2026-05-25 (`main` HEAD `0af8ad4` after M5 gate-close PR #47; `m6-integration` created from that HEAD; PM kickoff Draft PR #48 open)._

- **Веха M6 — Радио и доверие:** PM kickoff in progress. Draft PR #48 `pm/m6-kickoff → m6-integration` содержит M6 dashboard scaffold; дальше PM дописывает 6 kickoff + 6 handoff + dashboards update.
- **Активная ветка:** `m6-integration` (long-lived до M6 gate-close).
- **Следующие шаги (PM):** завершить PR #48 → self-merge в `m6-integration` → передать Alex'у GD M6 prompt для отдельной Devin-сессии.
- **Текущий gate:** `M6_PREPARED → PM_KICKOFF_IN_PROGRESS`.
- Скоуп/роли/DoD — `staff/status/M6.md`. Anti-scope явный: Yandex SDK/Cloud Saves/Leaderboard/IAP (M8), новые зоны/мобы/боссы/T4, модульное оружие, skill tree/active abilities, faction-specific reputation, real-time timers, новые combat mechanics, voice/audio.

## Закрытые вехи

- **M5 — Боссы и инстансы:** закрыта 2026-05-25 gate-close PR #47 (`m5-integration → main`, PM merge по делегации Alex'а). Полный summary — `staff/handoff/M5-SUMMARY.md`. Итоги: 3 босса, boss drops, T3 craft, daily instances, gas zones, MobRole runtime, 152 vitest, 1.48 MB build, 412 KB assets.
- **M4 — Перки и прогрессия:** закрыта 2026-05-22 gate-close PR #39 (`m4-integration → main`, PM merge по делегации Alex'а). Полный summary — `staff/handoff/M4-SUMMARY.md`. Итоги: 11 scenes, 128 vitest, 1.5 MB build, ~259 KB assets, 8 перков + veteran_conditioning fallback, XP-curve L1-10, ProgressionScene + LevelUpScene.
- **M3 — Расширение мира:** закрыта 2026-05-21 gate-close PR #30 (`m3-integration → main`). Полный summary — `staff/handoff/M3-SUMMARY.md`.
- **M2 — Играбельный MVP:** закрыта 2026-05-20 gate-close PR #19 (`m2-integration → main`). Полный summary — `staff/handoff/M2-SUMMARY.md`.
- **M1 — Технический скелет:** закрыта 2026-05-19 gate-close PR #12 (`m1-integration → main`). Полный summary — `staff/handoff/M1-SUMMARY.md`.
