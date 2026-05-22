# Status: Engineer

**Текущая веха:** M5
**Статус:** DONE_PENDING_QA_REVIEW
**Последнее обновление:** 2026-05-22

## Что сделано (M5)

- Ветка `m5/world` создана от `m5-integration`, PR `m5/world → m5-integration` — Draft → Ready.
- Все 4 проверки зелёные локально: `npm run typecheck` ✅, `npm run lint` ✅, `npm run test` ✅ (**148/148**, было 128 в M4), `npm run build` ✅ (~1520 kB, под лимитом 2 MB).
- Архитектурное правило соблюдено: все gameplay-формулы и AI — в Phaser-free `src/systems/*`, сцены только рендерят state и зовут системы.

### Phaser-free системы (новые/модифицированные M5)

- `src/systems/mobAI.ts` — `MobRuntimeState` += `phase: 1|2`, `phase_transition_done: boolean`. Новая функция `computePhaseTransition(mob, runtimeState)` → `{ newPhase, newBehaviorId }`. `chooseMobActionV2` вызывает `computePhaseTransition` перед выбором действия; при смене фазы — flip state + use `newBehaviorId`. Regular mobs (role undefined или "regular") — phase=1 always, transition no-op.
- `src/systems/dailyInstance.ts` (NEW) — `canEnterDailyInstance(progress, zone, now): boolean` (boss_id check + cooldown), `markDailyCompleted(progress, zoneId, now): void`.
- `src/systems/gasZone.ts` (NEW) — `computeGasDamage(zone, depth, player): number` (is_gas + !gas_mask → damage), `playerHasGasMask(player): boolean` (armor slot + backpack check).
- `src/systems/mobRole.ts` (NEW) — `initBossFight(mob): { isBoss, runtimeState, guaranteedLoot }`, `getBossGuaranteedDrops(mob): InventoryStack[]` (chance >= 1.0 entries).
- `src/systems/craft.ts` — `canCraftWithBossDrop(recipe, inventory): CraftCheck` — для tier=3 рецептов проверяет `boss_drop_ingredient` в инвентаре.
- `src/systems/xp.ts` — `computeOverkillPopups(levelBefore, levelAfter): number` — количество popups для overkill level-up.

### Сцены (модифицированные)

- `src/scenes/CombatScene.ts` — `MobInstance` += `isBoss`, `_phase2PopupShown`. Boss spawn → HUD overlay "Босс: name" + "Фаза 1/2". Gas damage tick в startRound. Boss guaranteed drops в victory loot. LevelUpScene launch с `levelBefore`/`levelAfter`.
- `src/scenes/MapScene.ts` — daily instance кнопка "Дейли: <zone>" для зон с boss_id (visible only if canEnter). Disabled с перезарядкой если cooldown.
- `src/scenes/ReturnScene.ts` — `markDailyCompleted` после успешного возврата из boss zone.
- `src/scenes/CraftScene.ts` — T3 recipes используют `canCraftWithBossDrop`; tooltip "Требуется: <boss_drop_id>" при отсутствии.
- `src/scenes/LevelUpScene.ts` — overkill queue: `popupQueue` из `computeOverkillPopups`; N popups sequentially.

### Types & state

- `src/types/mob.ts` — `Mob` += `phase_threshold?: number`, `phase_2_behavior_id?: string`.
- `src/types/zone.ts` — `Zone` += `daily_reset_hours?: number`, `gas_damage_per_turn?: number`. `ZoneLevel` += `is_gas?: boolean`.
- `src/types/recipe.ts` — `Recipe` += `boss_drop_ingredient?: string`.
- `src/state/types.ts` — `GameProgress` += `daily_completed: Record<string, number>`.
- `src/state/GameState.ts` — `createDefaultProgress` += `daily_completed: {}`.

### Тесты (vitest)

| Файл | Кол-во | Δ | Покрытие |
|---|---|---|---|
| `mobAI.test.ts` | 21 | +5 | boss starts phase 1, transitions at threshold, idempotent, phase 2 uses behavior, regular no transition |
| `dailyInstance.test.ts` (NEW) | 3 | +3 | no boss_id → false, cooldown → false, cooldown expired → true |
| `gasZone.test.ts` (NEW) | 3 | +3 | no gas → 0, gas without mask → damage, gas with mask → 0 |
| `mobRole.test.ts` (NEW) | 3 | +3 | boss init phase 1, regular no boss init, boss guaranteed drops |
| `craft.test.ts` | 13 | +3 | T3 no boss-drop → fail, T3 with boss-drop → ok, T3 no boss_drop_ingredient → base canCraft |
| `xp.test.ts` | 27 | +3 | single level-up → 1 popup, double → 2, triple → 3 |

Итог: **148 vitest passed** (128 baseline M4 + 20 M5). 0 failed. Regression PASS.

## Блокеры

- Нет.

## PR

- `m5/world → m5-integration` — Ready for review.
