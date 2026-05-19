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
| Текущий gate M1 | `staff/status/M1.md` |
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

## Текущий M1 snapshot

_Last reconciled with GitHub: 2026-05-19._

- GD spec: approved.
- **Integration branch:** `m1-integration` (от `main`, 2026-05-19). Все role PR M1 таргетятся в `m1-integration`; финал `m1-integration → main` делает Alex/Заказчик на gate-close. См. `staff/decisions/DECISIONS.md` «2026-05-19».
- Content PR: #6, open, base = `m1-integration`, PM APPROVE, конфликт pre-resolved; ждёт QA Acceptance.
- Engineer PR: #7, open, base = `m1-integration`, PM APPROVE, конфликт pre-resolved; ждёт QA Acceptance.
- Artist PR: missing. PM-решение 2026-05-19: scope NOT deferred — лончим Artist-сессию (branch `m1/art-initial`, base = `m1-integration`).
- Process dashboard PR: #8, merged into `main`.
- PM recovery snapshot PR: #9, merged into `main`.
- Workflow-policy follow-up PR: #10, merged into `main` — фиксирует integration-branch policy в процесс-доках и в kickoff'ах.
