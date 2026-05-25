# Status: Engineer

**Текущая веха:** M6
**Статус:** READY_FOR_REVIEW
**Последнее обновление:** 2026-05-25

## Что сделано (M6)

Ветка `m6/radio` от `m6-integration`. PR: `m6/radio → m6-integration`.

Все 4 проверки зелёные:
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ (**164/164**, 152 baseline M5 + 12 M6)
- `npm run build` ✅

### Types/state

- `src/types/radio.ts` — M6 schema: `RadioSignalType` (`"truth" | "trap" | "ambiguous"`), `RadioReward` (`{ item_id: string; count: number }`), `RadioTrustImpact` (`{ respond: number; ignore: number }`), `RadioSignal` += `type`, `zone_id`, `reward`, `trap_mob_id`, `trust_impact`, `chosen_option`, `resolved`.
- `src/state/types.ts` — `GameProgress` += `radio_trust: number`.
- `src/state/GameState.ts` — `createDefaultProgress` init `radio_trust: 0`.

### Phaser-free radio system

- `src/systems/radio.ts`:
  - `activeSignals(signals)` — фильтр `!resolved && expires_after_sorties > 0`.
  - `resolveRadioChoice(signals, signalId, option, trust, baseStash, validItemIds, validMobIds)` — typed `RadioResolveResult` с `status: ResolveStatus` (`OK | ALREADY_RESOLVED | REWARD_SKIPPED | AMBUSH_SKIPPED`), `trustBefore`, `trustAfter`, `rewardAdded`, `ambushMobId`. Trust clamp [-5, +5]. No-op если уже resolved.
  - `tickRadioOnReturn(signals, trust)` — декремент expiry, авто-resolve при 0, возвращает новый trust (с учётом trust_impact.ignore).
  - Без `any`, без console.log, типизированные fail-safe статусы.

### Сцены

- `src/scenes/RadioScene.ts` — M6: отображение trust, type/zone/deadline, outcome summary (trust + reward + ambush), ambush → injection в `GameState.currentSortie` → `CombatScene`.
- `src/scenes/ReturnScene.ts` — `tickRadioOnReturn` с trust return.
- `src/scenes/CombatScene.ts` — `tickRadioOnReturn` импортирован, вызывается в `endSortie` (включая defeat).

### Тесты (vitest)

| Файл | Кол-во | Δ | Покрытие |
|---|---|---|---|
| `radio.test.ts` | 21 | +12 | trust clamp, truth respond/ignore, trap respond/ignore, ambiguous mixed, already resolved, expiry tick, activeSignals, missing reward/trap fail-safe, double resolve, empty list, two-signal tick |

Итог: **164 vitest passed** (152 baseline M5 + 12 M6). 0 failed. M5 regression PASS.

## PR

- `m6/radio → m6-integration` — Ready for review.
