# M14 PR-3 — Weapon Disassembly («Разобрать») — PREFLIGHT

> Vertical «закрыть craft-loop», часть **B**. Зеркало сборки: WeaponInstance →
> части обратно на склад. Кнопка «Разобрать» фолдится в detail-панель «Арсенала»
> (CraftedWeaponsScene, M14-PR2). **C** (energy/generator visibility) отложен.
> Base: `099476a` (main, M14-PR2 merged).

## §0. Scope
**В scope:** разбор собранного оружия из «Арсенала». Игрок выбирает инстанс →
detail-панель → «Разобрать» → части (`instance.parts`) возвращаются в `baseStash`
по 1 каждой, инстанс удаляется из `crafted_weapons[]`. Закрывает обратную ветку
craft-loop: до сих пор инстанс можно было только собрать/экипировать, «выйти» из
сборки (вернуть детали в оборот) — нельзя; сломанные инстансы копились мёртвым
грузом без возможности рекавери частей.

**НЕ в scope:** repair (отдельный C6-долг — чинить durability, не разбирать),
energy refund/cost за разбор (D2 — энергию не трогаем), generator/energy visibility
(C), любые правки каталога/баланса/save-схемы/ассемблера. Disassembly — чистое
зеркало consume-ветки `assembleFromStash`, плюс auto-unequip.

## §1. Verified codebase facts (vs `099476a`)
1. **Consume-флоу сборки** (`assemblyFlow.ts`): `assembleFromStash(parts, stash, rng)`
   делает `removeFromStack(stash, part.id, 1)` по каждой части → `nextStash`.
   Зеркало разбора = `addToStack(stash, partId, 1)` по каждой `instance.parts`.
2. **Stash-хелперы** (`GameState.ts:170-213`, все pure, возвращают новый массив):
   `addToStack(stacks, id, count)` — мёрджит в существующий стэк или пушит новый;
   `removeFromStack` — вычитает, дропает стэк при count≤0; `countInStacks` — сумма.
   `baseStash: InventoryStack[]`, `InventoryStack = {item_id, count}` (types.ts:38).
3. **`WeaponInstance.parts: string[]`** (weaponAssembly.ts) — id-ы частей, хранятся
   именно «для display и **disassembly**» (комментарий в типе). Это и есть источник
   возврата. Stats/durability инстанса при разборе не нужны (части — каталожные
   шаблоны, per-part durability в стеше не трекается).
4. **`crafted_weapons: WeaponInstance[]`** (types.ts:132) в схеме + cloudSave
   whitelist (cloudSave.ts:342), restore `?? []`. Удаление инстанса = `filter` по id.
   **Save-схему трогать не нужно.**
5. **Auto-unequip канон**: `applyPerEncounterDurabilityHit` (durability.ts:88-99) при
   поломке экипированного crafted сбрасывает `equipped_weapon = {kind:"catalog",
   id: HERO_START_WEAPON_ID}` (= `craft_knife`, balance.ts:25, тот же дефолт что у
   `createDefaultPlayer`, GameState.ts:35). Разбор экипированного инстанса должен
   падать в ТОТ ЖЕ канонический дефолт (не null — null = bare-hands 4/7).
6. **`EquippedWeapon = {kind:"catalog"|"crafted"; id} | null`** (types.ts:20).
   Проверка «разбираем экипированный» = `eq?.kind==="crafted" && eq.id===instanceId`.
7. **CraftedWeaponsScene** (M14-PR2): detail-панель рендерится для `selected` инстанса
   (`renderDetailPanel`), re-render через `scene.restart({selectedId})`, `init(data)`
   читает. equip-handler мутирует state + `saveToCloud()` + restart. Тот же паттерн
   переиспользуем для disassemble + confirm-state.
8. **Round-trip**: assemble удаляет части (стэк может схлопнуться в 0 → выпасть из
   массива), disassemble добавляет (может создать новый стэк в конце). Массивы
   структурно разойдутся, но `countInStacks` по каждому id совпадёт — тест сверяет
   counts, НЕ массив целиком.

## §2. Decisions

**D1 — Где живёт pure-хелпер.** `disassembleInstance` добавляю в
`src/systems/craftedWeapons.ts` (домен «Арсенал»-менеджера, рядом с
`sortInstancesForDisplay`/`canEquipInstance`). *Почему не assemblyFlow.ts:* тот файл —
verstak-orchestrator (consume + energy-gate сборки), а разбор — операция
manager-экрана. Альтернатива (новый `disassembly.ts`) отвергнута: один хелпер на ~25
строк не тянет на отдельный модуль.

**D2 — Энергия: не трогаем (ни cost, ни refund).** Разбор не списывает и не
возвращает энергию. *Почему:* энергия сборки = уже потраченный «труд»; ценность
разбора — возврат деталей, а не refund. *Альтернатива* (partial energy refund)
отвергнута: нет balance-спеки, это scope creep в чистый MVP-mirror.

**D3 — Сломанные разбираются (в отличие от equip).** «Разобрать» доступна на любом
инстансе, включая `isBroken`. *Почему:* рекавери частей из сломанного оружия — ровно
тот кейс, который B закрывает (сломанный иначе мёртвый груз). Контраст с M14-PR2: там
equip на сломанном disabled (две тихие подмены); здесь — наоборот, главный сценарий.

**D4 — Auto-unequip → канонический `craft_knife`.** Если разбираем текущий
экипированный crafted-инстанс → `equipped_weapon = {kind:"catalog",
id: HERO_START_WEAPON_ID}`, точное зеркало durability-reset (§1.5). НЕ `null`
(bare-hands хуже по UX), НЕ «следующий инстанс» (неявная магия). Тост уведомляет.

**D5 — Двухшаговое подтверждение (destructive guard).** Разбор необратим (инстанс +
его frozen-статы + накопленный durability-урон исчезают; назад — только заново
собрать). Первый клик «Разобрать» → кнопка превращается в «Точно разобрать?» (accent
red) + «Отмена»; разбор только по второму клику. Состояние через
`scene.restart({selectedId, confirmDisassemble:true})`, `init` читает. *Альтернатива*
(мгновенный разбор) отвергнута — слишком легко снести инстанс случайным тапом.

**D6 — Кнопка в detail-панели, не на карточке.** «Разобрать» рендерится в правой
detail-панели выбранного инстанса (inspect-then-act). *Почему:* карточки остаются
чистыми; разбор — осознанное действие после осмотра частей/прочности. Совпадает с
ранее согласованным «фолдится в карточку инстанса» (detail = расширение карточки).

**D7 — Без `SAVE_VERSION` bump.** Мутируем только существующие поля схемы
(`crafted_weapons`, `baseStash`, `equipped_weapon`). `saveToCloud()` после. Новых
персист-форм нет.

**D8 — Пустой список после разбора последнего.** `scene.restart` → `create` видит
`crafted_weapons.length===0` → existing empty-state «Нет собранного оружия» +
«К верстаку». `selectedId` устаревает → уже резолвится против списка (no-op).

## §3. File-by-file plan
1. **EDIT `src/systems/craftedWeapons.ts`** — `disassembleInstance(instanceId,
   crafted_weapons, baseStash, equipped_weapon): DisassembleResult`. Pure: находит
   инстанс по id (не найден → no-op, возвращает входы); `addToStack` по каждой
   `parts`; `filter` инстанс из crafted; auto-unequip если был экипирован (D4).
   Возвращает `{crafted_weapons, baseStash, equipped_weapon, returned_parts,
   was_equipped}`. Новые импорты: `addToStack` (GameState), `HERO_START_WEAPON_ID`
   (balance), типы `EquippedWeapon`/`InventoryStack`.
2. **EDIT `src/systems/__tests__/craftedWeapons.test.ts`** — новый describe
   `disassembleInstance` (§4), ~10 тестов, включая round-trip (import
   `assembleFromStash`).
3. **EDIT `src/scenes/CraftedWeaponsScene.ts`** — в `renderDetailPanel`: кнопка
   «Разобрать» под частями (для любого инстанса, в т.ч. broken). Confirm-state через
   `InitData.confirmDisassemble` + `init`. Execute → `disassembleInstance(...)`,
   присвоить `GameState.player.crafted_weapons/equipped_weapon`,
   `GameState.baseStash`, `saveToCloud()`, тост («Разобрано: N частей на склад»),
   `scene.restart({})` (сброс выбора). Отмена → `restart({selectedId})`.

**Scope guard:** ровно 3 файла. НЕ трогаем assemblyFlow.ts/assemblyValidation.ts/
weaponAssembly.ts/durability.ts/items.json/locale.ts/balance.ts/cloudSave.ts/
state/types.ts/main.ts/InventoryScene.ts.

## §4. Test plan (vitest, +~10, baseline 417)
1. возвращает части в пустой склад (новый стэк на каждую часть);
2. мёрджит в существующий стэк (склад уже содержит этот part_id → count += 1);
3. multi-part инстанс → каждая часть +1 (через `countInStacks`);
4. удаляет инстанс из `crafted_weapons` (по id, остальные нетронуты);
5. экипированный crafted разбирается → `equipped_weapon` падает в `{catalog,
   craft_knife}`, `was_equipped===true`;
6. НЕ-экипированный инстанс разбирается → `equipped_weapon` нетронут,
   `was_equipped===false`;
7. экипирован ДРУГОЙ crafted (не тот, что разбираем) → equipped нетронут;
8. catalog-экипировка → equipped нетронут (kind!=="crafted");
9. **сломанный** (`durability_current:0`) инстанс → разбирается, возвращает ВСЕ части;
10. defensive: неизвестный `instanceId` → no-op (входы возвращены, `returned_parts:[]`);
11. **round-trip**: `assembleFromStash(parts, stash)` → `disassembleInstance(inst, …)`
    → `countInStacks` по каждому part_id == исходному (anchor: ловит асимметрию
    add/remove);
12. не мутирует входные массивы (`crafted_weapons`, `baseStash` ref-стабильны).

## §5. QA guards
- **G1** disassemble мутирует РОВНО `{crafted_weapons, baseStash, equipped_weapon}`;
  ни одно другое поле state не трогается.
- **G2** части возвращаются 1:1 с `instance.parts` (count сохранён, без потерь/дублей).
- **G3** auto-unequip срабатывает ТОЛЬКО когда разбираемый инстанс === экипированный
  crafted; падает в канонический `{catalog, HERO_START_WEAPON_ID}` (никогда null,
  никогда другой инстанс).
- **G4** `saveToCloud()` после мутации (паритет с equip/assemble).
- **G5** НЕТ `SAVE_VERSION` bump; нет правок схемы; `git diff` не задевает
  assemblyFlow/weaponAssembly/durability/items.json/locale.ts/balance.ts/cloudSave/
  state-types/main.ts/InventoryScene.
- **G6** destructive action за двухшаговым confirm — одиночный тап не сносит инстанс.
- **G7** broken-инстансы РАЗБИРАЕМЫ (кнопка есть) — сознательный контраст с equip
  (там disabled). Recovery частей — главный кейс.
- **(чеклист-0)** round-trip тест реально падает, если add/remove асимметричны
  (проверить: временно сломать `addToStack` count → тест №11 красный).

## §6. Gates (как в PR-2)
Node 20 (`/tmp/node-v20.18.1-linux-x64`), затем: `npx tsc --noEmit` (0) ·
`npx eslint src/` (0) · `npx vitest run` (~427 = 417 + ~10) · `npm run build` (✓,
chunk-warning = pre-existing Phaser bundle, не регрессия).
