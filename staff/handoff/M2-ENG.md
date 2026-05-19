# Handoff: Engineer — Веха M2

> **Роль:** Engineer
> **Веха:** M2 — Играбельный MVP
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m2-integration`
> **Ветка для PR:** `m2/gameplay`
> **PR base:** `m2-integration` (НЕ `main`)

---

## Preconditions

- [x] M1 закрыта (gate-close PR #12 merged в `main` 2026-05-19).
- [x] `m2-integration` создана от `main` PM-ом и push'нута на origin.
- [x] `docs/GDD.md` §1–§6 описывает все M2-механики.
- [x] `docs/balance.md` имеет числа для боя, веса, крафта.
- [x] `content/*.json` содержит canonical content (15 items, 3 mobs, 5 recipes, 1 zone).
- [x] `src/types/` соответствует GDD §6.
- [x] `src/scenes/{Boot,Base,Map,Sortie,Combat,Inventory,Craft}Scene.ts` есть как заглушки.

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/roles/ENGINEER.md` | Твоя роль, зона ответственности, DoD |
| `staff/status/M2.md` | Текущий gate-state M2, скоуп, anti-scope |
| `staff/handoff/M1-SUMMARY.md` | Что унаследовано с M1, какие артефакты не трогаем |
| `docs/GDD.md` §1 | Core loop вылазки (Base → Map → Sortie → Combat → Loot → Return → Base) |
| `docs/GDD.md` §2 | Боевая система: initiative, формула урона, действия, edge-cases |
| `docs/GDD.md` §3 | Инвентарь + вес: формулы веса/инициативы, loot loss 50% |
| `docs/GDD.md` §4 | Крафт: список рецептов, проверка ингредиентов |
| `docs/GDD.md` §5 | AI мобов: marauder/wild_dog/mutant поведение |
| `docs/GDD.md` §6 | JSON-схемы (типы уже в `src/types/`) |
| `docs/balance.md` | Все числа: HERO_MAX_WEIGHT_KG_BASE, BASE_RETURN_TIME_S, WEIGHT_PENALTY_FACTOR, стат-таблицы оружия/брони/мобов |

---

## Твои deliverables (полный M2-флоу)

### 1. Загрузка контента и инициализация состояния

Расширь `BootScene` так, чтобы он:

1. Через `src/utils/loader.ts` параллельно грузил `content/items.json`, `content/mobs.json`, `content/recipes.json`, `content/zones.json`.
2. Грузил placeholder-ассеты M1 (`assets/sprites/hero.png`, item-icons, `assets/backgrounds/forest.png`) — через стандартный `this.load.image(...)` Phaser'а.
3. Валидировал минимально: counts (15/3/5/1) и что все нужные icon-ассеты есть.
4. По окончании загрузки записывал данные в `GameState` (см. п.2) и переводил на `BaseScene`.

### 2. `src/state/GameState.ts` — runtime state

Сделай статический singleton (или namespace `GameState`) с типизированными полями:

```ts
export interface GameState {
  player: PlayerState;             // HP, max HP, текущий рюкзак, equipped weapon/armor
  data: {
    items: Record<string, Item>;
    mobs: Record<string, Mob>;
    recipes: Record<string, Recipe>;
    zones: Record<string, Zone>;
  };
  currentSortie: SortieState | null;  // null когда игрок на базе
  baseStash: InventoryStack[];        // "склад на базе" — отдельная сумма от рюкзака (см. GDD §4 M2 deferred)
}
```

`PlayerState`, `SortieState`, `InventoryStack` опиши рядом в `src/state/types.ts`. **Не трогай `src/types/{item,mob,recipe,zone}.ts`** — они общие для контента.

Стартовые значения: HP = `balance.md §Hero`, max weight = `HERO_MAX_WEIGHT_KG_BASE`, equipped = `knife` (стартовое оружие из GDD §«Канон»), `baseStash = []`, `currentSortie = null`.

### 3. `src/systems/combat.ts`

Реализуй чистые функции (без Phaser dependency):

- `rollDamage(min: number, max: number): number` — равномерный roll.
- `calcInitiative(speed: number, currentWeight: number, maxWeight: number, overweight: boolean): number` — формула из GDD §3.
- `applyAttack(attacker, defender, weaponOrUnarmed): { newHp, damageDealt, blocked }` — учёт `defense`, `vs_melee_bonus` (только если `mob.type === "animal"` per GDD §6.1).
- `resolveTurn(state, action): TurnResult` — оркестратор раунда: расход боеприпасов, расход расходника при «Аптечка», AI ход моба, проверка victory/defeat.
- AI мобов: marauder убегает при HP < 30%, wild_dog атакует первым, mutant просто бьёт. Поведение из GDD §5.

### 4. `src/systems/weight.ts`

- `computeWeight(inventory: InventoryStack[], items: Record<string, Item>): number`.
- `canAddItem(currentWeight, itemId, count, maxWeight, items): boolean` — для UI loot screen.
- `applyLootLoss(inventory, items): InventoryStack[]` — 50% loot loss правило из GDD §3.

### 5. `src/systems/craft.ts`

- `canCraft(recipe, baseStash, items): { ok: boolean; missing: { id: string; need: number; have: number }[] }`.
- `applyCraft(state, recipeId): GameState` — атомарно списать ингредиенты, добавить `result_id × result_count` в `baseStash`.

### 6. `src/systems/loot.ts`

- `generateMobLoot(mob: Mob): InventoryStack[]` — roll по `drop_table`, учёт `chance`, `count_min/max`.
- `generateZoneLoot(zone: Zone, depth: number): InventoryStack[]` — roll resources по `resource_count`.

### 7. Сцены — реализация

Перепиши скелет-сцены из M1 в полнофункциональные экраны:

| Сцена | Что должно работать |
|---|---|
| `BootScene` | Загрузка JSON + ассетов, инициализация GameState, переход на BaseScene. |
| `BaseScene` | Показывает HP игрока, equipped weapon, кнопки «В вылазку», «Мастерская», «Инвентарь». |
| `MapScene` | Показывает список зон из `zones.json` (в MVP — одна `forest`). Кнопка «Войти». |
| `SortieScene` | Стартует вылазку: создаёт `currentSortie` со списком мобов (roll по `zone.depths[0].enemy_count`) и pre-rolled lootPool ресурсов. Кнопка «Бой» → CombatScene. |
| `CombatScene` | Полноценный пошаговый бой по GDD §2: показывает HP игрока + HP моба, кнопки «Атака», «Укрытие», «Аптечка», «Отступить». После победы → LootScene. После поражения → BaseScene с применением loot loss 50%. |
| `LootScene` (новая) | Показывает список выпавших ресурсов + дроп с убитого моба. Для каждого — «Взять» с проверкой `canAddItem`. Кнопка «Возврат» доступна только если `cur_weight ≤ max_weight`. По «Возврат» → BaseScene + перенос рюкзачного содержимого в `baseStash`. |
| `InventoryScene` | Показывает `baseStash` с весом каждого стака, общий вес, equipped. Можно «Надеть» броню / переключить оружие (только из baseStash). Кнопка «Назад». |
| `CraftScene` | Полноценная Мастерская: список 5 рецептов, для каждого — «Скрафтить» (disabled если `canCraft` = false с UI-объяснением чего не хватает). После крафта — атомарный update GameState. |

UI делай минимальным, но **читаемым на mobile-first 360×640**: Phaser-text, прямоугольники-кнопки, item icons из `assets/sprites/items/`. Никаких сторонних UI-библиотек.

### 8. Тесты

Добавь `vitest` юнит-тесты для чистых функций:

```
src/systems/__tests__/combat.test.ts        # rollDamage, calcInitiative, applyAttack edge-cases
src/systems/__tests__/weight.test.ts        # computeWeight, canAddItem, applyLootLoss
src/systems/__tests__/craft.test.ts         # canCraft happy-path + 4 missing-ingredient cases (по одному на recipe)
src/systems/__tests__/loot.test.ts          # generateMobLoot детерминированный с seeded RNG
```

`npm run test` должен проходить.

### 9. Runtime smoke (твой пред-PR self-test)

Локально через `npm run dev`:

1. Открыть приложение в Chrome.
2. Пройти 7-шаговый MVP-flow из `staff/status/M2.md`:
   1. Загрузка < 5 сек (на твоей машине, не на 4G).
   2. BaseScene видна с HP и equipped knife.
   3. В вылазку → MapScene → выбрать Forest → SortieScene → Бой.
   4. CombatScene: убить хотя бы одного моба.
   5. LootScene: взять 3–5 ресурсов; проверить блокировку «Возврат» при искусственном перегрузе (можно временно занизить max_weight в `balance.md`-копии, но к PR верни обратно).
   6. Вернуться на базу → InventoryScene видит лут.
   7. CraftScene: скрафтить `bandage` (если есть `cloth ≥ 3`).
3. Перезапустить и проверить, что после поражения применяется loot loss 50%.

Приложи к PR краткий «runtime test log» с пройденными шагами и любыми отклонениями. Скриншоты не обязательны, но желательны для CombatScene и InventoryScene.

---

## Definition of Done (твой чек-лист перед PR)

- [ ] `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test` — все зелёные.
- [ ] 7-шаговый MVP-flow проходим в Chrome (см. runtime smoke).
- [ ] Все формулы из GDD §2/§3/§4 покрыты кодом и unit-тестами.
- [ ] `src/state/GameState.ts` существует и используется всеми сценами как единый источник истины.
- [ ] Нет регрессии M1: `src/types/`, `content/*.json`, `assets/*`, `docs/*` не меняются.
- [ ] Никаких `any` в коде. Никакого закомментированного «черновика».
- [ ] `.gitignore` без изменений; ничего лишнего в коммите.
- [ ] `staff/status/ENGINEER.md` обновлён под M2.
- [ ] PR-описание содержит scope, anti-scope, runtime test log, recovery block.

---

## FORBIDDEN

- Любые фичи M3+ (перки, модули, новые зоны/мобы, радио, боссы, коммуна).
- Yandex SDK (M8).
- Сторонние UI-библиотеки (только Phaser built-in).
- Анимации, шейдеры, звуки.
- Сторонний RNG / зависимости (`Math.random` + опционально seeded helper в utils — окей).
- Self-merge PR.
- Push в `main` / `m2-integration` напрямую.
- PAT-токен в URL.

---

## Процедура

1. Клонируй репо, `git checkout m2-integration`, `npm install`, проверь зелёный baseline.
2. Прочитай все файлы из таблицы «Контекст».
3. Напиши план → отправь Alex'у блокирующим («План готов, жду апрува PM»).
4. После апрува — `git checkout -b m2/gameplay`.
5. Реализуй по чек-листу выше; коммить логическими порциями (`feat(M2):`, `test(M2):`, `chore(M2):`).
6. Прогнони все `npm` команды.
7. Runtime smoke в Chrome.
8. Открой PR `m2/gameplay → m2-integration` с подробным описанием.
9. Сообщи Alex'у блокирующим: «PR <ссылка>, готов к ревью PM».
10. Жди PM-ревью и затем формальную QA Acceptance-сессию.
