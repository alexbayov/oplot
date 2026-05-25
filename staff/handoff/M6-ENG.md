# Handoff — Engineer M6 (Радио и доверие)

> Подробный брифинг для Engineer на M6. Ты реализуешь радио outcomes/trust поверх M3 RadioScene stub. Не пишешь контент, ассеты, GDD или balance.

## Preconditions

- GD M6 amendment merged в `m6-integration`.
- QA Spec M6 verdict APPROVE.
- Ты стартуешь параллельно с Content M6 и Artist M6.

## Контекст файлов

**Читать:**
1. `staff/CONTEXT.md`
2. `staff/LINKS.md`
3. `staff/status/M6.md`
4. `staff/handoff/M6-ENG.md`
5. `staff/handoff/M5-SUMMARY.md`
6. `docs/GDD.md` §10.M6
7. `docs/balance.md` §M6
8. `src/types/radio.ts`
9. `src/systems/radio.ts`
10. `src/scenes/RadioScene.ts`
11. `src/state/types.ts`, `src/state/GameState.ts`
12. Existing tests in `src/systems/__tests__/radio.test.ts`.

## Deliverables

### 1. Types/state

- Extend radio types per GDD:
  - `RadioSignalType`
  - `RadioReward`
  - `RadioTrustImpact`
  - `chosen_option`
  - `resolved`
- Add `GameProgress.radio_trust: number`, default `0`.
- Keep M3 compatibility if old `dismissed` appears during migration/load.

### 2. Phaser-free radio system

In `src/systems/radio.ts` or adjacent pure module:

- `clampRadioTrust(value): number`
- `activeSignals(signals)` now filters `!resolved && expires_after_sorties > 0`
- `resolveRadioChoice(...)`:
  - applies trust impact once
  - adds reward descriptor / returns reward application result
  - returns ambush descriptor if trap triggered
  - marks `chosen_option` and `resolved`
  - no-op if already resolved
- `tickRadioOnReturn` preserves sortie-based expiry.

### 3. Reward and ambush integration

- Reward goes to `GameState.baseStash`, not backpack.
- Use existing `addToStack`.
- Ambush uses existing mob id and existing CombatScene/sortie flow or a minimal scoped state descriptor.
- No new combat action types or mechanics.

### 4. RadioScene

- Shows trust value.
- Shows type/zone/deadline if approved by GD.
- Shows detail and two options.
- After choice, displays outcome summary and returns to list.
- Prevents duplicate rewards/trust on reload/reclick.

### 5. Tests

Exact target: 164 vitest total = 152 M5 baseline + 12 M6.

Minimum coverage:
- trust clamp lower/upper
- respond truth reward + trust
- ignore truth
- respond trap ambush + trust
- ignore trap
- ambiguous mixed outcome
- already resolved no-op
- expiry conversion
- activeSignals filter
- missing reward/trap fail-safe
- GameState default trust
- M5 regression still green

### 6. Status

Update only `staff/status/ENGINEER.md` with M6 summary, commands, exact test count, build size.

## Forbidden

- No `content/*.json`, `assets/*`, `docs/*`, чужие `staff/`.
- No new combat mechanics.
- No SDK/persistence/ads.
- No real-time timers.
- No faction-specific reputation.
- No `any`, no lazy `getattr`/equivalent.

## Done

- Draft PR early.
- Checks clean.
- Vitest exact 164.
- Architecture: systems pure, scenes render/call systems.
