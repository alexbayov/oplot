# Status: Engineer

**Текущая веха:** M2
**Статус:** IN_PROGRESS
**Последнее обновление:** 2026-05-19

## Что сделано (M2)

- Создана ветка `m2/gameplay` от `m2-integration` и запушена в origin.
- Baseline `m2-integration`: `npm install`, `npm run typecheck`, `npm run lint`, `npm run build` — зелёные.
- План 8–15 пунктов составлен и апрувлен PM (см. чат сессии).
- Скелет M2:
  - `src/state/balance.ts` — все константы из `docs/balance.md` (HP, max_weight, BASE_RETURN_TIME_S, WEIGHT_PENALTY_FACTOR, LOOT_LOSS_ON_DEFEAT, COVER, DAMAGE_ROLL, XP-формула, marauder flee).
  - `src/state/types.ts` — `PlayerState`, `SortieState`, `InventoryStack`, `ContentData`, `GameStateShape`.
  - `src/state/GameState.ts` — singleton с hero defaults (HP=100, max_weight=30, knife, cloth_jacket, baseStash = bandage×2), helpers `addToStack` / `removeFromStack` / `countInStacks`.

## Что НЕ сделано (M2)

- Чистые системы (`src/systems/combat.ts`, `weight.ts`, `craft.ts`, `loot.ts`) — следующий шаг.
- Сцены: BootScene остаётся stub; Base/Map/Sortie/Combat/Inventory/Craft/LootScene — следующие шаги.
- vitest unit tests.
- Runtime smoke в Chrome.

## Следующий конкретный шаг

`src/systems/weight.ts` — `computeWeight`, `canAddItem`, `applyLootLoss` + commit + push, затем `combat.ts` → `loot.ts` → `craft.ts` → сцены → тесты.

## Блокеры

- Нет.

## Дев-чит (для QA awareness, в prod-сборке отсутствует)

- `O` на BaseScene — добавляет `cloth × 10` в `baseStash` (для перегруза). Под `import.meta.env.DEV`.

## PR

- Draft PR `m2/gameplay → m2-integration` — будет открыт сразу после первого commit (skeleton GameState + balance.ts).
