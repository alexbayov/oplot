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
| Текущий gate (M5 — kickoff phase) | `staff/status/M5.md` |
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

## Текущий snapshot (M5 — kickoff phase)

_Last reconciled with GitHub: 2026-05-22 (main HEAD = `723ed1c` Merge PR #39: M4 gate-close + `bf4729d` Alex's «pm: add M5 kickoff prompt» PM-process commit; `m5-integration` создана от `723ed1c`)._

- **Веха M5 — Боссы и инстансы (kickoff phase):** PM открыл `m5-integration` от `main` HEAD `723ed1c` и Draft PR #40 `pm/m5-kickoff → m5-integration` — M5 dashboard (`staff/status/M5.md`) + 6 kickoff (`staff/kickoff/M5-*.md`) + 6 handoff (`staff/handoff/M5-*.md`) + обновление PLAN / CONTEXT / LINKS / STATE_MACHINE / CHANGELOG.
- **Активная ветка:** `m5-integration` (long-lived до M5 gate-close).
- **Следующие шаги (PM):** flip Draft → Ready, self-merge в `m5-integration` (по продолжению M3+M4-делегации Alex'а) → запустить GD M5 amendment в новой Devin-сессии (`staff/kickoff/M5-GD.md`).
- **Текущий gate:** `M5_PREPARED → GD_IN_PROGRESS_PENDING` (после merge kickoff PR — `M5_PREPARED → GD_IN_PROGRESS`).
- Скоуп/роли/DoD — `staff/status/M5.md`. Anti-scope явный: модульное оружие (M5+ подсистема), полная радио-логика (M6), Yandex SDK (M8), skill tree (M5+ refactor path), PvP, boss-cinematics (M7 polish), доп. AI behaviors (переиспользуются M3-5 + phase swap).

## Закрытые вехи

- **M4 — Перки и прогрессия:** закрыта 2026-05-22 gate-close PR #39 (`m4-integration → main`, PM merge по делегации Alex'а). Полный summary — `staff/handoff/M4-SUMMARY.md`. Итоги: 11 scenes, 128 vitest, 1.5 MB build, ~259 KB assets, 8 перков + veteran_conditioning fallback, XP-curve L1-10, ProgressionScene + LevelUpScene.
- **M3 — Расширение мира:** закрыта 2026-05-21 gate-close PR #30 (`m3-integration → main`). Полный summary — `staff/handoff/M3-SUMMARY.md`.
- **M2 — Играбельный MVP:** закрыта 2026-05-20 gate-close PR #19 (`m2-integration → main`). Полный summary — `staff/handoff/M2-SUMMARY.md`.
- **M1 — Технический скелет:** закрыта 2026-05-19 gate-close PR #12 (`m1-integration → main`). Полный summary — `staff/handoff/M1-SUMMARY.md`.
