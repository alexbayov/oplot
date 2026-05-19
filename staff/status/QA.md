# Status: QA

**Текущая веха:** M2 — Playable MVP
**Последнее действие:** QA Acceptance стартован для Engineer PR #15
**Статус:** IN_PROGRESS
**Дата:** 2026-05-19
**Текущий шаг:** §1 build/static

## Текущий gate

QA Acceptance по M2 выполняется на ветке `qa/m2-acceptance` от `m2-integration`.

Объект проверки: Engineer PR #15 (`m2/gameplay` → `m2-integration`).

## Acceptance report — M2 Engineer PR #15

### §1 Build/static checks

Статус: pending.

План проверок:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

### §2 M1 regression diff

Статус: pending.

План: проверить diff `m2-integration...m2/gameplay` по `content/`, `assets/`, `docs/`, `src/types/` на регрессии M1.

### §3 Runtime smoke — 7-step MVP flow

Статус: pending.

План: desktop Chrome, `npm run dev -- --host 127.0.0.1`, запись экрана.

Flow:
1. Base screen
2. `В вылазку`
3. Zone select
4. Combat
5. Loot
6. Return
7. Inventory + craft

### §4 Formula sanity vs GDD

Статус: pending.

План: сверить `calcInitiative`, `return_time_s`, `applyAttack`, `applyLootLoss`, `canCraft` против GDD/balance.

### §5 Anti-scope checks

Статус: pending.

План: проверить отсутствие radio/perks/SDK/third-party UI libs outside M2 scope.

### §6 Architecture/readability

Статус: pending.

План: проверить использование `GameState`, чистоту systems, отсутствие `any`.

### §7 Engineer status note

Статус: pending.

План: проверить актуальность `staff/status/ENGINEER.md`; известное stale-состояние отметить как non-blocker, если подтвердится.

## Findings

Пока нет.

## Blockers

Пока нет.

## Recovery

- Role: QA Acceptance Critic
- Milestone: M2 Playable MVP
- Branch: `qa/m2-acceptance`
- Current section: §1 build/static
- Done sections: none
- Next concrete step: read required M2 QA context, then run `npm run typecheck && npm run lint && npm run test && npm run build`
- Engineer PR: #15 (`m2/gameplay` → `m2-integration`)
- Findings: none yet
- Blockers: none

## PR / Process

- QA-report branch: `qa/m2-acceptance` (base = `m2-integration`).
- This QA session updates only `staff/status/QA.md`.
- No Engineer code/content/assets/docs changes are allowed in this branch.
