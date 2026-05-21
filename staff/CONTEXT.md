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
| Текущий gate (M4 — kickoff phase) | `staff/status/M4.md` |
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

## Текущий snapshot (M4 — kickoff phase)

_Last reconciled with GitHub: 2026-05-21 (main HEAD = `0b1de53` Merge PR #30: M3 gate-close; m4-integration создана от этого commit'а)._

- **Веха M4 — Перки и прогрессия (kickoff phase):** PM открыл интеграционную ветку `m4-integration` от `main` HEAD `0b1de53` и Draft PR `pm/m4-kickoff → m4-integration` (этот PR) — M4 dashboard (`staff/status/M4.md`) + 6 kickoff (`staff/kickoff/M4-*.md`) + 6 handoff (`staff/handoff/M4-*.md`) + обновление PLAN / CONTEXT / LINKS / STATE_MACHINE / CHANGELOG / PM.
- **Активная ветка:** `m4-integration` (long-lived до M4 gate-close).
- **Следующие шаги (PM):** flip Draft → Ready, self-merge в `m4-integration` (по продолжению M3-делегации Alex'а) → запустить GD M4 amendment в новой Devin-сессии (`staff/kickoff/M4-GD.md`).
- **Текущий gate:** `M4_PREPARED → GD_IN_PROGRESS_PENDING` (после merge kickoff PR — `M4_PREPARED → GD_IN_PROGRESS`).
- Скоуп/роли/DoD — `staff/status/M4.md`. Anti-scope явный: skill tree (M5+ refactor), активные ability (M5+), боссы (M5), полная радио-логика (M6), Yandex SDK (M8).

## Закрытые вехи

- **M3 — Расширение мира:** закрыта 2026-05-21 gate-close PR #30 (`m3-integration → main`). Полный summary — `staff/handoff/M3-SUMMARY.md`.
- **M2 — Играбельный MVP:** закрыта 2026-05-20 gate-close PR #19 (`m2-integration → main`). Полный summary — `staff/handoff/M2-SUMMARY.md`.
- **M1 — Технический скелет:** закрыта 2026-05-19 gate-close PR #12 (`m1-integration → main`). Полный summary — `staff/handoff/M1-SUMMARY.md`.
