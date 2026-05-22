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
| Текущий gate (M4 — done, gate-close pending) | `staff/status/M4.md` |
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

## Текущий snapshot (M4 — done, gate-close pending)

_Last reconciled with GitHub: 2026-05-22 (m4-integration HEAD = `4a04678` — all M4 PR merged)._

- **Веха M4 — Перки и прогрессия: DONE.** Все 4 role PR merged в `m4-integration` (#32 GD + #34 GD fix + #33 QA Spec + #35 Artist + #36 Content + #37 Engineer + #38 QA Acceptance). 128/128 vitest, build clean, QA APPROVE.
- **Активная ветка:** `m4-integration` (gate-close PR `m4-integration → main` pending).
- **Следующие шаги (PM):** merge gate-close PR `m4-integration → main` → M4 closed → M5 kickoff (Боссы и инстансы).
- **Текущий gate:** `M4_DONE` (gate-close pending).
- Скоуп/DoD — `staff/status/M4.md`. Anti-scope: skill tree (M5+), активные ability (M5+), боссы (M5), полная радио-логика (M6), Yandex SDK (M8).

## Закрытые вехи

- **M4 — Перки и прогрессия:** закрыта 2026-05-22 gate-close pending (`m4-integration → main`). Полный summary — `staff/handoff/M4-SUMMARY.md`.
- **M3 — Расширение мира:** закрыта 2026-05-21 gate-close PR #30 (`m3-integration → main`). Полный summary — `staff/handoff/M3-SUMMARY.md`.
- **M2 — Играбельный MVP:** закрыта 2026-05-20 gate-close PR #19 (`m2-integration → main`). Полный summary — `staff/handoff/M2-SUMMARY.md`.
- **M1 — Технический скелет:** закрыта 2026-05-19 gate-close PR #12 (`m1-integration → main`). Полный summary — `staff/handoff/M1-SUMMARY.md`.
