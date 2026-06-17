# M14 PR-2 — Crafted Weapons Manager (Arsenal) — PREFLIGHT

> Vertical: «закрыть craft-loop» (опции A+B Алекса). Этот PR = **A** (manager).
> **B** (disassembly) — следующим PR'ом, кнопка «Разобрать» фолдится в карточку
> инстанса отсюда. **C** (energy visibility) отложен — base-loop, не craft.
> Base: `0c92ba4` (main, M14-PR1 merged).

## §0. Scope
**В scope:** UI для `crafted_weapons[]`, который сейчас копится без экрана
(`InventoryScene.ts:~332` явно «crafted-инстансы вне scope этого экрана»).
Игрок собирает оружие → auto-equip переключается на новое → старые инстансы
лежат мёртвым грузом, посмотреть/переключиться нельзя. PR даёт:
- список собранных инстансов (имя, урон, прочность cur/max, кол-во частей);
- **equip-swap** между инстансами (и обратно — переэкипировать любой);
- **inspect** — разбор статов + список частей инстанса.

**НЕ в scope:** disassembly (PR-3/B), repair (отдельный C6-долг), generator/energy
visibility (C), любые изменения каталога/баланса/save-схемы. Manager — crafted-only;
catalog-оружие остаётся под cycler'ом в `InventoryScene` (не дублируем).

## §1. Verified codebase facts (vs `0c92ba4`)
1. `PlayerState.crafted_weapons: WeaponInstance[]` (state/types.ts:132) уже в схеме
   и в save (cloudSave snapshot whitelist `crafted_weapons`, cloudSave.ts:342;
   restore `?? []`, :219). **Save-схему трогать не нужно.**
2. `WeaponInstance` (weaponAssembly.ts): `{ id, name_ru, slot:"action",
   stats:{damage_min,damage_max}, durability_max, durability_current, parts:string[] }`.
   Stats FROZEN при сборке — не пересчитываются на load.
3. `EquippedWeapon = {kind:"catalog"|"crafted"; id} | null` (types.ts:20). Assemble
   уже ставит `{kind:"crafted", id}` (WeaponAssemblyScene tryAssemble:437-440) +
   `saveToCloud()`.
4. `InventoryScene` weapon-слот циклит ТОЛЬКО catalog-стволы из стеша; crafted вне
   scope (комментарий + `currentEquippedWeaponId = kind==="catalog" ? id : null`).
   → если экипирован crafted, слот «Оружие» сейчас пуст. Это та дыра, что закрываем.
5. `isBroken(weapon)` (durability.ts:45) — predicate. Сломанный инстанс остаётся в
   `crafted_weapons` (repair-долг C6), но snapshotHero авто-unequip-ает его →
   bare-hands fallback. durability_current мутируется в durability.ts (не здесь).
6. Сцены регистрируются в `main.ts` массив `scene:[...]`. Subscene открывается
   `BaseScene.openSubscene(key)` = `scene.start(key)`. Кнопка возврата:
   `createButton(this, H-50, "Назад", cb)` → `scene.start(parent)`.
7. Re-render паттерн: `scene.restart({...initData})` + `init(data)` читает (как
   WeaponAssemblyScene `pickedIds`). UI-лейблы inline-RU; `t()` только для reason-кодов.
8. Хелперы UI: `createTitle`, `createButton`, `createSmallButton`, `createHpBar`
   (durability-бар можно нарисовать им же) в sceneUi.ts.

## §2. Решения — НУЖЕН твой ✓ (мои каллы по нерешённым к коду деталям)

**D1 — Placement = НОВАЯ сцена `CraftedWeaponsScene` (титул «Арсенал»), вход кнопкой
из `InventoryScene`** рядом со слотом «Оружие»: `Собранное оружие (N) ▸`.
*Почему:* прямо закрывает дыру §1.4 («вне scope этого экрана» → теперь есть экран,
со ссылкой ровно оттуда); equip — это inventory-mental-model. *Альт (отклонён):*
секцией внутри InventoryScene — сцена уже плотная (грид+вес+тултипы+2 cycler'а),
карточки инстансов её перегрузят; вход из CraftScene — верстак про сборку, не
про управление снаряжением.

**D2 — Карточка инстанса:** `name_ru`, `Урон: min–max`, durability-бар +
`Прочность: cur/max`, `Частей: N`. Бейдж `ЭКИПИРОВАН` если
`equipped_weapon.kind==="crafted" && .id===inst.id`; бейдж `СЛОМАНО` если `isBroken`.
Кнопка `Экипировать` на не-экипированных и не-сломанных.

**D3 — Equip-семантика:** тап `Экипировать` → `equipped_weapon={kind:"crafted",id}`
→ `saveToCloud()` → `scene.restart()` (перерисовка бейджей). *Сломанный —
кнопка disabled* (snapshotHero всё равно авто-unequip-нет → иначе trap «экипировал,
а в бой с голыми руками»). Catalog-оружие здесь не показываем/не трогаем —
остаётся под cycler'ом InventoryScene (кросс-экранно: экипировав crafted, слот
«Оружие» в Inventory покажет пусто — приемлемо, manager = канон crafted).

**D4 — Inspect = инлайн detail-панель** по тапу на карточку:
`scene.restart({selectedId})` → раскрывает разбор частей (резолв `name_ru` частей
из `GameState.data.items` по `inst.parts`) + полные статы + прочность.
*Альт (отклонён):* модалка/тултип — restart-параметр паттерн уже принят (PR-6b-2
pickedIds), проще и тестируемо (selection — чистая функция).

**D5 — Пустое состояние:** нет инстансов → «Нет собранного оружия» + кнопка
`К верстаку` → `scene.start("WeaponAssemblyScene")`.

**D6 — Порядок списка:** экипированный первым, далее новые→старые (reverse
insertion). Чистый сорт-хелпер, unit-тест.

**D7 — Pure-хелперы в новом `src/systems/craftedWeapons.ts`** (инвариант «systems
pure / scenes Phaser»): `sortInstancesForDisplay(instances, equippedCraftedId)` и
`canEquipInstance(inst)` (= `!isBroken(inst)`, реэкспорт-обёртка над durability).
Форматирование статов — inline-RU в сцене. Хелперы unit-тестируются, сцена — нет.

**D8 — Без `SAVE_VERSION` bump; без правок `items.json`/`locale.ts`/`balance.ts`/
`weaponAssembly.ts`/`durability.ts`** (только import `isBroken` read-only). A НЕ
добавляет/не удаляет инстансы (это B) — только читает список + мутирует
`equipped_weapon`.

## §3. File-by-file diff plan
- **NEW `src/systems/craftedWeapons.ts`** — pure: `sortInstancesForDisplay`,
  `canEquipInstance`.
- **NEW `src/systems/__tests__/craftedWeapons.test.ts`** — sort (equipped-first,
  newest order, нет equipped, пустой), canEquip (broken→false, целый→true).
- **NEW `src/scenes/CraftedWeaponsScene.ts`** — `init({selectedId?})`; `create()`:
  титул, список карточек (D2) через sorted-хелпер, equip-handler (D3),
  inspect-detail (D4), пустое состояние (D5), `Назад → InventoryScene`.
- **`src/main.ts`** — `import` + регистрация `CraftedWeaponsScene` в `scene:[...]`.
- **`src/scenes/InventoryScene.ts`** — аддитивно: кнопка `Собранное оружие (N) ▸`
  рядом со слотом «Оружие» → `scene.start("CraftedWeaponsScene")`. Существующий
  catalog-cycler и грид не трогаем.

## §4. Test plan (без Phaser)
`craftedWeapons.test.ts`:
- `sortInstancesForDisplay`: экипированный всплывает первым; остальные newest→oldest;
  equippedId=null → чистый newest→oldest; `[]` → `[]`; equippedId не из списка →
  игнор (всё по дате).
- `canEquipInstance`: `durability_current>0` → true; `=0` (broken) → false.
Сцена — Phaser → unit-тестов нет, smoke + ручной QA.

## §5. Guards / инварианты для QA (1:1)
- **G1** `equipped_weapon` мутируется ТОЛЬКО в equip-handler, ставит
  `{kind:"crafted",id}`, никогда catalog; другие поля state не трогаются.
- **G2** Сломанный (`isBroken`) инстанс НЕ экипируется (кнопка disabled) — нет
  trap «экипировал сломанное → snapshotHero молча сбросил в голые руки».
- **G3** НЕТ `SAVE_VERSION` bump; cloudSave whitelist не меняется; `crafted_weapons`
  в manager'е read-only (add/remove — это B).
- **G4** `saveToCloud()` зовётся после equip (паритет персистентности с assemble).
- **G5** Scope чист: `git diff` не трогает `items.json`/`locale.ts`/`balance.ts`/
  `weaponAssembly.ts`/`durability.ts` (последний — import `isBroken` read-only).
- **G6** Правка `InventoryScene` аддитивна (только кнопка-вход); catalog-cycler,
  грид стеша, веса, тултипы — без изменений.
