# Status: QA

**Текущая веха:** M2 — Playable MVP
**Последнее действие:** §4 formula sanity завершён
**Статус:** IN_PROGRESS
**Дата:** 2026-05-19
**Текущий шаг:** §5 anti-scope checks

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

Статус: PASS_WITH_NOTE.

Среда:
- `npm run dev -- --host 127.0.0.1`, Vite at `http://127.0.0.1:5173/`.
- Desktop Chrome.
- Screen recording evidence: `/home/ubuntu/oplot_m2_runtime_smoke.mp4` (local evidence file, not committed).

Проверено:
- App open <5 сек; CDP console check after reload: JS exceptions не обнаружены. Зафиксирован один non-blocking 404 resource error, вероятно favicon/static resource.
- `BaseScene`: HP, weapon, armor, stash and 3 buttons visible.
- `MapScene`: единственная зона Forest/Лес visible, `Войти` works.
- `SortieScene`: depth selection visible, depth 1 starts combat.
- `CombatScene`: hero/enemy HP, `Атака`, `Укрытие`, `Аптечка`, `Отступить` visible; attack/cover advance turns; marauder flee + wild dog attack path verified.
- `LootScene`: loot list visible; `Взять всё`, `Следующий бой`, `Возврат на базу` visible; take-all and return to base work.
- Return to `BaseScene`: HP persisted/restored according to scene flow; stash weight updated after loot return.
- `InventoryScene`: base stash stacks and per-stack weights visible.
- `CraftScene`: all 5 recipes visible; after resource seeding via runtime dev shortcut `O`, `Бинт` craft succeeds and updates status to `Создано: Бинт`.
- Defeat path: by repeatedly using `Укрытие`, hero HP reaches defeat and app returns to `BaseScene`; stash/HP state updates without crash.

Note: overload-return block was not forced by temporary file edits because QA constraints forbid modifying Engineer code/docs in this branch. It will be covered by formula/code review sections.

### §4 Formula sanity vs GDD

Статус: CHANGES_REQUESTED.

Проверено на Engineer branch `m2/gameplay`:
- `src/systems/combat.ts`: `calcHeroInitiative` matches GDD §2/§3 (`base_speed - (cur_weight / max_weight) * 50`, overweight → 0).
- `src/systems/combat.ts`: `applyAttack` matches GDD §2 / `balance.md` (weapon roll, 0.85..1.15 multiplier, defense subtraction, min damage floor 1).
- `src/systems/weight.ts`: `applyLootLoss` matches GDD §3 / `balance.md` defeat rule (`totalWeight * 0.5`, drop heaviest units first).
- `src/systems/craft.ts`: `canCraft` matches GDD §4 (`have >= ingredient.count` for every ingredient).

Blocking mismatch:
- `return_time_s` formula from GDD §1/§3 and `balance.md` is not implemented/used in runtime code. `src/state/balance.ts` defines `BASE_RETURN_TIME_S` and `WEIGHT_PENALTY_FACTOR`, but `rg "return_time|BASE_RETURN_TIME|WEIGHT_PENALTY" src/` finds no formula usage beyond constants. `LootScene.endSortie()` returns directly to `BaseScene` without `ReturnScene`/return duration.

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

- §4 blocker: `return_time_s` formula from GDD/balance is not implemented/used in runtime code; `LootScene` returns directly to `BaseScene`.

## Blockers

- Engineer PR #15 needs changes for missing `return_time_s` formula/runtime return duration, unless PM explicitly de-scopes ReturnScene/return time from M2 acceptance.

## Recovery

- Role: QA Acceptance Critic
- Milestone: M2 Playable MVP
- Branch: `qa/m2-acceptance`
- Current section: §5 anti-scope checks
- Done sections: §1 build/static PASS; §2 M1 regression diff PASS; §3 runtime smoke PASS_WITH_NOTE; §4 formula sanity CHANGES_REQUESTED
- Next concrete step: run anti-scope checks for radio/perks/SDK/third-party UI libs
- Engineer PR: #15 (`m2/gameplay` → `m2-integration`)
- Findings: §1 PASS; §2 no M1 baseline diff; §3 smoke flow works; §4 `return_time_s` missing; Vite chunk-size warning and one resource 404 are non-blocking
- Blockers: missing `return_time_s` runtime implementation unless de-scoped by PM

## PR / Process

- QA-report branch: `qa/m2-acceptance` (base = `m2-integration`).
- This QA session updates only `staff/status/QA.md`.
- No Engineer code/content/assets/docs changes are allowed in this branch.
