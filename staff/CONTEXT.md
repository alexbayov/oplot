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
| Текущий gate (актуальная веха) | `staff/status/M2.md` |
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

## Текущий M2 snapshot

_Last reconciled with GitHub: 2026-05-19 (M2 kickoff)._

- **Активная веха:** M2 — Играбельный MVP. См. `staff/status/M2.md`.
- **Integration branch:** `m2-integration` (от `main`, 2026-05-19, commit `1244c5f`). Все role PR M2 таргетятся в `m2-integration`. На M2 gate-close PM открывает PR `m2-integration → main`, который мерджит Alex/Заказчик.
- **Активные роли M2:** Engineer (главная работа M2). Content/Artist/GD на M2 не запускаются (см. anti-scope в `staff/status/M2.md`).
- **QA Acceptance** возвращается формальной сессией на M2 (на M1 она была заменена PM-integration smoke — это разовое решение, см. `staff/decisions/DECISIONS.md` 2026-05-19).

## Закрытая веха M1

- M1 «Технический скелет» закрыта 2026-05-19 gate-close PR #12 (`m1-integration → main`).
- Полный summary — `staff/handoff/M1-SUMMARY.md`.
- M1 PR-реестр (merged): #6 Content, #7 Engineer, #11 Artist, #13 QA Acceptance — все в `m1-integration`; #8/#9/#10/#12 — в `main`.
