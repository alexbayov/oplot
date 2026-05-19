# Status: QA

**Текущая веха:** M2 — Playable MVP
**Последнее действие:** §2 M1 regression diff пройден
**Статус:** IN_PROGRESS
**Дата:** 2026-05-19
**Текущий шаг:** §3 runtime smoke

## Текущий gate

QA Acceptance по M2 выполняется на ветке `qa/m2-acceptance` от `m2-integration`.

Объект проверки: Engineer PR #15 (`m2/gameplay` → `m2-integration`).

## Acceptance report — M2 Engineer PR #15

### §1 Build/static checks

Статус: PASS.

Проверено на ветке `m2/gameplay` после `npm install`:
- `npm install` — PASS, 0 vulnerabilities.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm run test` — PASS: 4 files / 46 tests passed.
- `npm run build` — PASS.

Примечание: Vite показал предупреждение о chunk > 500 kB (`dist/assets/index-*.js` ~1.5 MB). Это не blocker для M2, потому что build успешен, а предупреждение вызвано Phaser bundle.

### §2 M1 regression diff

Статус: PASS.

Команды:
- `git diff --stat m2-integration...m2/gameplay -- content/ assets/ docs/ src/types/`
- `git diff --name-status m2-integration...m2/gameplay -- content/ assets/ docs/ src/types/`

Результат: output пустой. Engineer PR #15 не меняет M1 baseline areas `content/`, `assets/`, `docs/`, `src/types/`; регрессий M1 в scoped diff не обнаружено.

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
- Current section: §3 runtime smoke
- Done sections: §1 build/static PASS; §2 M1 regression diff PASS
- Next concrete step: start dev server, record desktop Chrome smoke for Base → vylazka → zone select → combat → loot → return → inventory + craft
- Engineer PR: #15 (`m2/gameplay` → `m2-integration`)
- Findings: §1 PASS; §2 no M1 baseline diff; Vite chunk-size warning is non-blocking
- Blockers: none

## PR / Process

- QA-report branch: `qa/m2-acceptance` (base = `m2-integration`).
- This QA session updates only `staff/status/QA.md`.
- No Engineer code/content/assets/docs changes are allowed in this branch.
