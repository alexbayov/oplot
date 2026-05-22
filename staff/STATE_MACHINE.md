# Оркестрационная state machine

> Этот файл фиксирует машинно-понятные gate-состояния вехи. Он нужен для восстановления PM-сессии без истории чата.

## M-веха: состояния

```text
M{N}_PREPARED
  → GD_IN_PROGRESS
  → GD_PR_READY
  → QA_SPEC_IN_PROGRESS
  → QA_SPEC_CHANGES_REQUESTED
  → GD_FIX_IN_PROGRESS
  → QA_SPEC_APPROVED
  → PARALLEL_PRODUCTION_IN_PROGRESS
  → ROLE_PRS_READY
  → QA_ACCEPT_IN_PROGRESS
  → QA_ACCEPT_CHANGES_REQUESTED
  → ROLE_FIX_IN_PROGRESS
  → QA_ACCEPT_APPROVED
  → PM_MERGE_IN_PROGRESS
  → M{N}_DONE
```

## Правила переходов

| From | To | Условие |
|---|---|---|
| `M{N}_PREPARED` | `GD_IN_PROGRESS` | PM подготовил `prompts/`, `kickoff/`, `handoff/` |
| `GD_IN_PROGRESS` | `GD_PR_READY` | GD создал PR и обновил `status/GAME_DESIGNER.md` |
| `GD_PR_READY` | `QA_SPEC_IN_PROGRESS` | PM передал GD PR в отдельную QA Spec-сессию |
| `QA_SPEC_IN_PROGRESS` | `QA_SPEC_CHANGES_REQUESTED` | QA нашёл блокеры спеки |
| `QA_SPEC_CHANGES_REQUESTED` | `GD_FIX_IN_PROGRESS` | PM запустил GD fix |
| `GD_FIX_IN_PROGRESS` | `QA_SPEC_IN_PROGRESS` | GD fix PR создан/смёржен и отдан на re-review |
| `QA_SPEC_IN_PROGRESS` | `QA_SPEC_APPROVED` | QA Spec дал `APPROVE` |
| `QA_SPEC_APPROVED` | `PARALLEL_PRODUCTION_IN_PROGRESS` | PM запустил Engineer + Content + Artist |
| `PARALLEL_PRODUCTION_IN_PROGRESS` | `ROLE_PRS_READY` | Все обязательные role PR созданы |
| `ROLE_PRS_READY` | `QA_ACCEPT_IN_PROGRESS` | PM передал все role PR в отдельную QA Acceptance-сессию |
| `QA_ACCEPT_IN_PROGRESS` | `QA_ACCEPT_CHANGES_REQUESTED` | QA Acceptance нашёл блокеры |
| `QA_ACCEPT_CHANGES_REQUESTED` | `ROLE_FIX_IN_PROGRESS` | PM запустил fix по нужной роли |
| `ROLE_FIX_IN_PROGRESS` | `QA_ACCEPT_IN_PROGRESS` | Fix PR готов к повторной QA Acceptance |
| `QA_ACCEPT_IN_PROGRESS` | `QA_ACCEPT_APPROVED` | QA Acceptance дал approve по всем обязательным PR |
| `QA_ACCEPT_APPROVED` | `PM_MERGE_IN_PROGRESS` | PM сам мержит role PR в `m{N}-integration` |
| `PM_MERGE_IN_PROGRESS` | `M{N}_DONE` | Все role PR merged в `m{N}-integration` PM'ом; PR `m{N}-integration → main` мержит Alex/Заказчик; status/changelog/summary обновлены |

## Обязательные проверки перед gate

### Перед `ROLE_PRS_READY`

- Engineer PR существует и таргетится в `m{N}-integration`.
- Content PR существует и таргетится в `m{N}-integration`.
- Artist PR существует и таргетится в `m{N}-integration` **или** в `staff/status/M{N}.md` зафиксировано явное PM/Customer-решение перенести Artist scope.
- Каждый PR содержит role, milestone, changed files, checks, recovery note.

### Перед `QA_ACCEPT_APPROVED`

- QA Acceptance читала интеграционное состояние всех обязательных PR.
- Для Engineer прошли `npm run build`, `npm run lint`, `npm run typecheck`.
- Для Content прошла JSON/reference validation.
- Для Artist проверены размеры, формат и бюджет ассетов.
- Проверен anti-scope.

### Перед `M{N}_DONE`

- Все approved role PR смержены PM'ом в `m{N}-integration`.
- PM открыл PR `m{N}-integration → main` и Alex/Заказчик его смержил.
- `staff/status/M{N}.md` обновлён.
- `staff/status/*.md` синхронизированы с фактом.
- `staff/decisions/CHANGELOG.md` обновлён.
- Создан `staff/handoff/M{N}-SUMMARY.md`.
- PM подготовил следующий gate или явно остановил проект.

## Интеграционная политика (2026-05-19)

На каждой вехе M{N}:

- Создаётся долгоживущая ветка `m{N}-integration` от текущего `main`.
- Все role PR и PM/fix PR работы вехи таргетятся в `m{N}-integration`.
- PM мержит role PR в `m{N}-integration` сам после QA Acceptance approve. Self-merge роли в интеграционную ветку запрещён.
- На gate-close PM открывает PR `m{N}-integration → main`; его мержит Alex/Заказчик.
- `main` принимает только закрытые вехи и межвеховые PM-process PR.
- PR-template recovery block во всех роль-PR должен называть base = `m{N}-integration`.

Обоснование и полный текст решения — `staff/decisions/DECISIONS.md` «2026-05-19 — Integration-ветка на веху; merge в `main` только на gate-close».

## Текущее состояние

- **Активная веха:** M5 — Боссы и инстансы. Gate: `M5_PREPARED` (PM открыл `m5-integration` от `main` HEAD `723ed1c` после M4 gate-close PR #39 merged + Draft PR #40 `pm/m5-kickoff → m5-integration` — M5 dashboards + 6 kickoff + 6 handoff). Подробно — `staff/status/M5.md`.

**Merge-делегация на M5 (continuation M3+M4):** Alex явно делегировал PM gate-close merge в `main` на M3 («гитпат выдам свой если надо — мерж на тебе»); M4 продолжил эту делегацию (gate-close PR #39 merged PM 2026-05-22). M5 продолжает её же: PM сам мерджит и role-PR в `m5-integration` после QA Acceptance APPROVE, и gate-close PR `m5-integration → main`. Если Alex изменит политику для M5 — PM прочитает явное указание в чате и адаптирует.

- **Закрытая веха M4:** см. `staff/status/M4.md` и `staff/handoff/M4-SUMMARY.md` (gate-close PR #39 merged 2026-05-22 PM по делегации Alex'а; `main` HEAD `723ed1c`).
- **Закрытая веха M3:** см. `staff/status/M3.md` и `staff/handoff/M3-SUMMARY.md` (gate-close PR #30 merged 2026-05-21 PM по делегации Alex'а).
- **Закрытая веха M2:** см. `staff/status/M2.md` и `staff/handoff/M2-SUMMARY.md`.
- **Закрытая веха M1:** см. `staff/status/M1.md` и `staff/handoff/M1-SUMMARY.md`.
