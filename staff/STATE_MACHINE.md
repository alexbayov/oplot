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
| `QA_ACCEPT_APPROVED` | `PM_MERGE_IN_PROGRESS` | PM начал merge role PR |
| `PM_MERGE_IN_PROGRESS` | `M{N}_DONE` | Все PR merged, status/changelog/summary обновлены |

## Обязательные проверки перед gate

### Перед `ROLE_PRS_READY`

- Engineer PR существует.
- Content PR существует.
- Artist PR существует **или** в `staff/status/M{N}.md` зафиксировано явное PM/Customer-решение перенести Artist scope.
- Каждый PR содержит role, milestone, changed files, checks, recovery note.

### Перед `QA_ACCEPT_APPROVED`

- QA Acceptance читала интеграционное состояние всех обязательных PR.
- Для Engineer прошли `npm run build`, `npm run lint`, `npm run typecheck`.
- Для Content прошла JSON/reference validation.
- Для Artist проверены размеры, формат и бюджет ассетов.
- Проверен anti-scope.

### Перед `M{N}_DONE`

- Все approved PR merged.
- `staff/status/M{N}.md` обновлён.
- `staff/status/*.md` синхронизированы с фактом.
- `staff/decisions/CHANGELOG.md` обновлён.
- Создан `staff/handoff/M{N}-SUMMARY.md`.
- PM подготовил следующий gate или явно остановил проект.

## Текущее состояние M1

См. `staff/status/M1.md`.
