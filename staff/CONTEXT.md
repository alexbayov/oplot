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
| Текущий gate (M2 закрывается) | `staff/status/M2.md` |
| M2 summary (итог) | `staff/handoff/M2-SUMMARY.md` |
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

## Текущий snapshot (M2 закрывается)

_Last reconciled with GitHub: 2026-05-20 (M2_DONE; gate-close pending Alex)._

- **Веха M2 — Играбельный MVP:** закрыта по PM-стороне 2026-05-20. PM merges всех 4 role/PM PR в `m2-integration` завершены (PR #15 Engineer, #16 PM status sync, #17 QA Acceptance APPROVED, pm/m2-finalize). Жду Alex'а для merge gate-close PR `m2-integration → main`.
- Полный summary — `staff/handoff/M2-SUMMARY.md`.
- **Активная ветка:** `m2-integration`. После gate-close merge в `main` стартует M3.

## Закрытая веха M1

- M1 «Технический скелет» закрыта 2026-05-19 gate-close PR #12 (`m1-integration → main`).
- Полный summary — `staff/handoff/M1-SUMMARY.md`.
- M1 PR-реестр (merged): #6 Content, #7 Engineer, #11 Artist, #13 QA Acceptance — все в `m1-integration`; #8/#9/#10/#12 — в `main`.
