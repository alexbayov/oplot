# Status: PM

**Текущая веха:** M1 — Технический скелет
**Статус:** IN_PROGRESS
**Последнее обновление:** 2026-05-18
**Текущий gate:** `M1_PARALLEL_PRODUCTION_IN_PROGRESS`

## Что сделано

- M0 process skeleton создан и смержен в main.
- M1 kickoff/handoff briefs подготовлены и смержены через PR #1.
- Game Designer PR #2 смержен.
- QA Spec Review PR #3 выявил блокеры и был смержен как история ревью.
- GD QA-fix PR #4 смержен.
- QA Spec re-review PR #5 смержен с verdict `APPROVE`.
- Content PR #6 создан, открыт, mergeable, PM review approve оставлен в PR-комментарии.
- Engineer PR #7 создан, открыт, mergeable, runtime navigation test приложен в PR-комментарии.
- Создан единый dashboard `staff/status/M1.md`.
- Добавлена orchestration state machine `staff/STATE_MACHINE.md`.

## Что НЕ сделано

- Artist PR `m1/art-initial` не найден.
- QA Acceptance по `staff/handoff/M1-QA-ACCEPT.md` ещё не запущена как финальный gate.
- PR #6 и PR #7 ещё не смержены.
- M1 ещё не закрыта в `PLAN.md` и `CHANGELOG.md`.
- `staff/handoff/M1-SUMMARY.md` ещё не создан.

## Блокеры

- Artist scope M1 отсутствует в GitHub. Нужно либо запустить Artist-сессию, либо получить явное решение PM/Заказчика перенести Artist scope из M1.

## PR

- PR #6 — Content MVP: https://github.com/alexbayov/oplot/pull/6
- PR #7 — Engineer bootstrap: https://github.com/alexbayov/oplot/pull/7
