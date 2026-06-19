# M17-PR1 Preflight — buildings production tick

## Scope

Schema-neutral PR. `SAVE_VERSION` stays `9`; the existing schema-neutral guard already asserts this in `src/state/__tests__/migrations.test.ts:411-412`.

## Code-grounded seams

- Balance constants for bunk healing currently live next to offline progression constants in `src/state/balance.ts:47-61`; M17 bed constants fit in the same single-source module.
- Generator accrual already exists as a pure helper in `src/systems/offlineProgression.ts:181-218` and writes energy directly to `baseResources.energy`.
- `accrueOffline` currently applies fixed-order generator/garden/bunk dispatch in `src/systems/offlineProgression.ts:292-299`; M17 adds bed healing to this dispatcher without changing save shape.
- Existing generator zero-regression coverage lives in `src/systems/__tests__/offlineProgression.test.ts:204-277`, including direct energy output and no-generator no-op.

## Auto-GO defaults selected

- D1: bed heals `+0.5 HP/hour` when `baseResources.energy >= 0.1`; workshop remains passive in this PR.
- D2: add `BED_HP_PER_HOUR`, `BED_ENERGY_GATE`, and `OFFLINE_ACCUMULATION_CAP_HOURS` in `src/state/balance.ts`.
- D3: expose pure `accrueBed(state, elapsedHours, balance)`; it returns next state and does not mutate input.
- D4: keep `accrueOffline` as the common dispatcher. For compatibility with existing timestamp callers, it accepts the existing `(state, savedAtMs, nowMs)` form and an M17 `(state, elapsedHours)` form.

## Invariants

- SAVE-DISCIPLINE: no schema bump, no migration changes; guard remains `SAVE_VERSION === 9`.
- M15 loop untouched: durability, repair decay, and disassembly are not read or written.
- Generator zero-regression is protected by an unchanged existing behavior test plus a cloned before/after assertion.
