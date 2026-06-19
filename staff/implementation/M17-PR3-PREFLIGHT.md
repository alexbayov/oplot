# M17-PR3 Preflight — base resource sink

## Scope

Schema-neutral PR. M17-PR2 is stacked but not merged into `origin/main`; this branch continues the package on top of M17-PR2 so QA can merge in order.

## Code-grounded seams

- Bed healing is currently centralized in `accrueBed` in `src/systems/offlineProgression.ts:246-272`, so energy consumption can stay in the same pure accrual layer.
- `accrueOffline` currently dispatches generator/garden/bunk/bed in `src/systems/offlineProgression.ts:353-356`; M17-PR3 changes this to decay first, then produce.
- Energy and bed balance constants live in `src/state/balance.ts:52-64`; PR3 adds the hourly energy drain next to them.
- Offline tests already cover bed/generator behavior in `src/systems/__tests__/offlineProgression.test.ts:286-357`; PR3 adds resource-sink loop tests there.

## Auto-GO defaults selected

- D1: bed consumes `0.1 energy/hour` during the tick.
- D2: consume first, produce after; if starting energy is zero, bed does not heal in that tick, while generator can still produce energy from fuel.
- D3: expose `accrueDecay(state, hours)` and call it before production in `accrueOffline`.

## Invariants

- SAVE-DISCIPLINE: schema-neutral; no SAVE_VERSION bump or migration edits.
- SINGLE-SOURCE accrual: state mutation stays inside pure `offlineProgression` helpers, not UI scenes.
