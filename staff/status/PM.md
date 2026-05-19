# Status: PM

**Текущая веха:** M1 — Технический скелет
**Статус:** IN_PROGRESS
**Последнее обновление:** 2026-05-19
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
- PM/process PR #8 (orchestration dashboard, state machine, communication kit, role self-update rules, PR template) смержен в `main`.
- Recovery PM-сессия 2026-05-19: фактическое состояние подтверждено по GitHub (PR #6 open/mergeable, PR #7 open/mergeable, PR #8 merged, ветка `m1/art-initial` на remote отсутствует).
- PR #9 (PM recovery snapshot) расширен: помимо `staff/status/M1.md` и `staff/status/PM.md` внутри того же PR обновлены `staff/LINKS.md` и `staff/CONTEXT.md`.
- PR #9 смержен Alex'ом (`9c232b1`). При мерже был потерян последний коммит (`11fc8f7`, workflow-policy doc), потому что он был push'нут после инициации мерджа в UI.
- Создана ветка `m1-integration` от `main` (commit `9c232b1`); push'нута на origin.
- PR #6 (Content) и PR #7 (Engineer) ретаргечены base → `m1-integration` через `git_update_pr_base`.
- Конфликты на `staff/status/CONTENT.md` (в PR #6) и `staff/status/ENGINEER.md` (в PR #7) pre-resolved через merge `m1-integration → role-branch` с сохранением role-owned версии (PM не трогал `content/*.json`, `src/`, конфиги и ENGINEER's code).
- Оформлен PM-review APPROVE комментарий на PR #7 (по скопу/anti-scope/types-schema/scene-flow) и retarget-confirm комментарий на PR #6.
- Открыт PR #10 (workflow-policy follow-up): cherry-pick потерянного коммита + retargeting kickoff'ов на `m1-integration`. Готов к мерджу Alex'ом в `main`.

## Что НЕ сделано

- Artist PR `m1/art-initial` не найден.
- QA Acceptance по `staff/handoff/M1-QA-ACCEPT.md` ещё не запущена как финальный gate.
- PR #6 и PR #7 ещё не смержены в `m1-integration` (ждут QA Acceptance APPROVE).
- PR #10 ещё не смержен в `main` (ждёт Alex'а).
- `m1-integration → main` мердж не открыт (будет открыт после M1 gate-close).
- M1 ещё не закрыта в `PLAN.md` и `CHANGELOG.md`.
- `staff/handoff/M1-SUMMARY.md` ещё не создан.

## Блокеры

- Artist scope M1 отсутствует в GitHub. Нужно либо запустить Artist-сессию, либо получить явное решение PM/Заказчика перенести Artist scope из M1.

## PR

- PR #6 — Content MVP: https://github.com/alexbayov/oplot/pull/6
- PR #7 — Engineer bootstrap: https://github.com/alexbayov/oplot/pull/7
- PR #10 — Workflow policy follow-up: https://github.com/alexbayov/oplot/pull/10
