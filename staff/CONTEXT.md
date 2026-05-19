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

_Last reconciled with GitHub: 2026-05-19 (M1 gate-close)._

- GD spec: approved.
- **Integration branch:** `m1-integration` (от `main`, 2026-05-19). Все role PR M1 смержены в `m1-integration` PM-ом. Финальный `m1-integration → main` мерджит Alex/Заказчик на gate-close PR. См. `staff/decisions/DECISIONS.md` «2026-05-19».
- Content PR #6: merged в `m1-integration`.
- Engineer PR #7: merged в `m1-integration`. Runtime smoke OK.
- Artist PR #11: merged в `m1-integration`. 10 placeholder-ассетов, 81.3 КБ / 300 КБ.
- Process dashboard PR #8: merged в `main`.
- PM recovery snapshot PR #9: merged в `main`.
- Workflow-policy follow-up PR #10: merged в `main`.
- M1 summary: `staff/handoff/M1-SUMMARY.md`.
- Gate-close PR `m1-integration → main`: open, ждёт мерджа Alex'а. После мерджа M1 закрыта, PM создаёт `m2-integration`.
