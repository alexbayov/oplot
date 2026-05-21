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
| Текущий gate (M3 — done pending gate-close) | `staff/status/M3.md`, `staff/handoff/M3-SUMMARY.md` |
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

## Текущий snapshot (M3 — done pending gate-close)

_Last reconciled with GitHub: 2026-05-21 (m3-integration HEAD = `aaf2ae5` Merge PR #28: qa(M3 acceptance) — APPROVE)._

- **Веха M3 — Расширение мира (фактически закрыта в `m3-integration`, ждёт gate-close):** все 9 M3 PR смержены — spec phase #20/#21/#22 (kickoff + GDD amendment §5.4/§6.2/§6.4.M3/§10.M3 + balance §M3 + QA Spec APPROVE) + PM align #23/#24 + parallel production #25/#26/#27 (Content +5 mobs/+14 items/+10 recipes/+2 zones/+3 radio signals; Engineer multi-zone + 5 mob AI + RadioScene stub + 89/89 vitest; Artist 5 sprites + 14 icons + 2 backgrounds + radio_icon, 129.8 KB) + QA Acceptance #28 APPROVE на octopus-merge 3 role-PR + PM finalize #29 (этот PR). **Следующий шаг — gate-close PR `m3-integration → main`, мерджит Alex**.
- **Активная ветка:** `m3-integration` (до gate-close). После gate-close — `main` с обновлённым M3 и приготовление к M4.
- Скоуп/роли/DoD — `staff/status/M3.md`. Фактическое summary — `staff/handoff/M3-SUMMARY.md`. Текущий gate — `M3_DONE_PENDING_GATE_CLOSE`.

## Закрытые вехи

- **M2 — Играбельный MVP:** закрыта 2026-05-20 gate-close PR #19 (`m2-integration → main`). Полный summary — `staff/handoff/M2-SUMMARY.md`.
- **M1 — Технический скелет:** закрыта 2026-05-19 gate-close PR #12 (`m1-integration → main`). Полный summary — `staff/handoff/M1-SUMMARY.md`.
