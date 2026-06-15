# M13 PR-6b-2 — Craft UI + `validateAssemblyParts` (Model C) — PREFLIGHT

> **Base:** main `9ef54de` (post 6b-1 durability-wire).
> **Автор брифа:** Viktor (QA-роль). Сборку делает Ross/Alex, PR с preflight-summary в OP, я QA 1:1.
> **Контракт Model C заморожен в прошлом раунде** — здесь только его приземление в код + UI. Ни нового контента, ни save-schema-изменений.

---

## 0. Что 6b-2, что НЕТ

**В scope:** чистая `validateAssemblyParts` + `assembleWeapon` бросает reason-код → craft UI свободной сборки (Model C, family-gated) → consume партов из `baseStash` → push в `crafted_weapons` → equip → `saveToCloud()`.

**OUT (anti-scope, НЕ трогать):**
- **energy / Верстак-gate / Генератор** = 6b-3 (energy-ресурса ещё нет в `balance.ts` — gate `energy ≥ ASSEMBLE_ENERGY_COST` приедет в 6b-3 вместе с генератором). В 6b-2 мастерская открывается свободно.
- **durability-wire** — уже на main (6b-1), не трогаем.
- **repair UI** (долг C6 — починка сломанных инстансов) — отдельный PR.
- **save-schema** — `crafted_weapons`/`equipped_weapon` уже персистятся (6b-1). НЕТ нового персист-поля → **НЕТ `SAVE_VERSION` bump, НЕТ миграции**. (Save-safety 5-точек НЕ триггерится — но flow мутирует персист-стейт и ОБЯЗАН звать `saveToCloud()`.)
- `recipes.json` / `items.json` — не трогать. `recipes.json` сейчас пуст (0), recipe-grid в CraftScene = мёртвый контент; его не оживляем.

---

## 1. Verified codebase facts (vs `9ef54de`)

- `systems/weaponAssembly.ts`: `assembleWeapon(parts: ComponentItem[], id): WeaponInstance` — **pure, сейчас БЕЗ валидации**. Сумма stats per-key, floor `damage_min≥0`, `damage_max≥damage_min`, freeze-on-assembly. `WeaponInstance` тип живёт здесь. `nextWeaponInstanceId(rng)` — генератор id.
- `state/GameState.ts`: `player.crafted_weapons: WeaponInstance[]`, `player.equipped_weapon: EquippedWeapon|null` (default `{kind:"catalog", id:"craft_knife"}`). Хелперы стеков: `removeFromStack(stacks,id,count)`, `addToStack`, `countInStacks`. Компоненты лежат в `GameState.baseStash` (`InventoryStack[]`).
- **68 component-итемов** (`content/items.json`, `kind:"component"`, `fits:"weapon"`, `stats:{damage_min?,damage_max?,durability_max?}`): **60 family-партов** (15 семейств × frame/receiver/barrel/slide/bolt/magazine/stock/…) + **8 универсальных `mod_*`** (глушители/оптика/штык/маг-расширитель).
- `scenes/CraftScene.ts`: recipe-grid + фильтр-табы «Всё / 🔨 Крафт / 🎯 Сборка». «Сборка» сейчас фильтрует `recipe_type:"assemble"` = **0 рецептов** → таб пустой. Естественный вход для нового ассемблера.
- `scenes/SortieRunScene.ts:113 snapshotHero()`: equip-resolve. Crafted → `crafted_weapons.find(id)`, читает FROZEN `inst.stats`, broken/missing → fallback 4/7. (Потребитель сборки — уже готов, его НЕ трогаем.)
- `scenes/InventoryScene.ts:346`: уже есть паттерн equip каталожного оружия (`equipped_weapon = {kind:"catalog", id}`). Crafted-equip = новое в 6b-2.
- `systems/locale.ts`: `t(key:string):string`, `ruRegistry: Record<string,string>`. Добавляем 3 ключа под reason-коды.
- `systems/cloudSave.ts`: `saveToCloud()`. Round-trip `crafted_weapons`/`equipped_weapon` уже зелёный (6b-1 тесты).

---

## 2. Замороженный контракт (Model C) — приземляем дословно

```ts
// systems/weaponAssembly.ts (или новый systems/assemblyValidation.ts)
export type AssemblyInvalidReason =
  | "empty_parts"
  | "no_structural_part"
  | "duplicate_part";

export type AssemblyValidationResult =
  | { ok: true }
  | { ok: false; reason: AssemblyInvalidReason };

export const validateAssemblyParts =
  (parts: ComponentItem[]): AssemblyValidationResult => { ... };
```

- `assembleWeapon` зовёт `validateAssemblyParts` **первой строкой** и **throws** с reason-кодом, если `!ok` (custom `AssemblyError extends Error` с полем `.reason`). UI ловит и локализует через `t()`.
- `duplicate_part` = **Set-check по `id`** (`new Set(ids).size !== ids.length`) — закрывает stack-эксплойт (5× `pm_frame`). Per-slot капы — отложены в M14/blueprints.
- Ровно **3 reason-кода**, ни больше.

---

## 3. Открытые решения — НУЖЕН ТВОЙ ✓ (это МОИ каллы, не твои замороженные)

Контракт заморожен, но эти ~6 механик контракт не фиксировал к коду. Даю решительный дефолт по каждому — скажи «ок на все» или поправь точечно, прежде чем билдить (неверная догадка = спалённый цикл):

**D1 — Детект структурного парта.** `isStructuralPart(id) = /_(frame|receiver)$/.test(id)`. Покрывает все 15 семейств (3 `_frame`: pm/tt/aps; 12 `_receiver`). `mod_*` структурными не бывают. → `no_structural_part`, если ни одного frame/receiver в `parts`.
*Рек: ✅ так.*

**D2 — Family-gate = UI-only, валидатор НЕ проверяет семейство.** `validateAssemblyParts` остаётся ровно 3 reason-кода (без `mixed_family`) — уважаем замороженный контракт. Химеру блокирует UI: `weaponFamily(id) = id.startsWith("mod_") ? "universal" : id.split("_")[0]`; игрок выбирает семейство → видит парты этого семейства + универсальные `mod_*` → собрать вне семейства физически нельзя.
*Рек: ✅ UI-gate, валидатор 3 reason-кода.*

**D3 — Где живёт UI.** Новая сцена `WeaponAssemblyScene`, вход из таба «🎯 Сборка» в CraftScene (репойнт кнопки таба на запуск ассемблера). Recipe-grid не трогаем (он и так пуст). Альтернатива — инлайн-режим внутри CraftScene (больше диффа в существующий файл).
*Рек: новая сцена (меньше диффа в CraftScene, чистая изоляция). Скажи если хочешь инлайн.*

**D4 — Расход партов.** Сборка снимает по 1 каждого выбранного компонента из `baseStash` (`removeFromStack`). Парты «уходят» в инстанс.
*Рек: ✅ consume on assemble.*

**D5 — Авто-equip после сборки.** Успех → push в `crafted_weapons` + сразу `equipped_weapon = {kind:"crafted", id}` + тост + `saveToCloud()`. Управление несколькими сборками (re-equip) — паттерн уже есть в InventoryScene, расширим позже.
*Рек: авто-equip (эргономика — игрок только что собрал). Скажи если только-в-инвентарь.*

**D6 — `assembleWeapon` throws.** Первой строкой `validateAssemblyParts`; `!ok` → `throw new AssemblyError(reason)`. Существующие happy-path тесты `assembleWeapon` (валидные парты) проходят без правок. Локаль-ключи: `assembly_invalid_empty_parts` / `_no_structural_part` / `_duplicate_part`.
*Рек: ✅.*

**D7 — Порядок проверок в валидаторе (детерминизм).** `empty_parts` → `duplicate_part` → `no_structural_part`. (Фиксируем, чтобы тест и UI-сообщение были предсказуемы при нескольких нарушениях.)
*Рек: ✅ этот порядок.*

**D8 — Чистый оркестратор для тестируемости.** Вынести `assembleFromStash(parts: ComponentItem[], stash: InventoryStack[], rng): { instance: WeaponInstance; nextStash: InventoryStack[] }` — pure, чтобы consume+assemble тестировались без Phaser; сцена остаётся тонким рендером поверх.
*Рек: ✅ pure-оркестратор.*

---

## 4. Изменяемые файлы (ожидаемо)

- `systems/weaponAssembly.ts` (или новый `systems/assemblyValidation.ts`) — `validateAssemblyParts`, `isStructuralPart`, `weaponFamily`, `AssemblyError`; `assembleWeapon` зовёт валидатор/throws.
- `systems/assemblyFlow.ts` (новый, опц.) — pure `assembleFromStash`.
- `scenes/WeaponAssemblyScene.ts` (новый) — UI выбора семейства + партов + кнопка «Собрать».
- `scenes/CraftScene.ts` — репойнт таба «Сборка» на новую сцену (минимальная правка).
- `main.ts` — регистрация сцены.
- `systems/locale.ts` — 3 reason-ключа.
- Тесты: `__tests__/assemblyValidation.test.ts`, `__tests__/assemblyFlow.test.ts`, дополнение `weaponAssembly.test.ts` (throws).

---

## 5. Test plan (фикстуры, без Phaser)

`validateAssemblyParts`:
1. `[]` → `{ok:false, "empty_parts"}`.
2. только `mod_*` (нет frame/receiver) → `"no_structural_part"`.
3. дубль id (`[pm_frame, pm_frame]`) → `"duplicate_part"`.
4. валидно `[pm_frame, pm_slide]` → `{ok:true}`.
5. валидно с модом `[pm_frame, mod_pbs1]` → `ok`.
6. структурный через receiver `[akm_receiver, akm_barrel]` → `ok`.
7. приоритет: `[mod_pbs1, mod_pbs1]` (дубль + нет структуры) → `"duplicate_part"` (порядок D7).

`assembleWeapon`: invalid → throws с `.reason`; valid → инстанс (happy-path как было).

`assembleFromStash`: consume снимает РОВНО по 1 каждого выбранного (не over/under), `nextStash` иммутабелен относительно входа, инстанс попадает в результат; недостающий в стеше парт → не собирает (или throws — уточнить в D-обсуждении).

`isStructuralPart` / `weaponFamily`: юнит на 15 семейств + `mod_*` → `"universal"`.

Round-trip (опираемся на 6b-1): собрал → equip → `saveToCloud` → reload → инстанс и equip живы, durability_current корректен.

---

## 6. Инварианты / гейты (что я проверю на QA 1:1)

1. `validateAssemblyParts` — ровно 3 reason-кода, детерминированный порядок (D7), Set-check на дубли реально блокирует 5×stack.
2. `assembleWeapon` throws reason-код; UI ловит и локализует через `t()` (не сырой код на экране).
3. Consume снимает ровно выбранные парты — без over/under-consume, без мутации входного стеша.
4. Авто-equip + `saveToCloud()` → персист (round-trip зелёный по 6b-1 пути).
5. Family-gate: химеру (pm_frame + akm_barrel) в UI-флоу собрать нельзя; валидатор при этом остаётся 3-reason (не добавлен 4-й).
6. Scope чистый: НЕТ energy/генератора, НЕТ `SAVE_VERSION` bump, `recipes.json`/`items.json` не тронуты.

**Билд-гейты:** `tsc --noEmit` 0 · `eslint src/` 0 · `vitest` всё зелёное (+N новых) · `npm run build` ✓.
