# M13 PR-6b-3 — Energy resource + Generator + Verstak-gate — PREFLIGHT

> **Base:** main `a54d946` (post 6b-2 craft-UI merge, SAVE_VERSION = 7).
> **Автор брифа:** Ross. Сборку делает Ross, PR с preflight-summary в OP; Viktor QA 1:1 + мерж.
> **Контракт 6b-3 — закрывает gap'ы, оставленные 6b-2 §0:** energy в `BaseResources` (новое поле), генератор как 3-е building (consumes fuel → energy), Verstak-gate на `assembleFromStash` (UI-level, не pure). Save bump v7→v8 с 5-точечной safety + Trap-B object/array merge.

---

## §0 Что 6b-3, что НЕТ

**В scope:**
1. `BaseResources += energy: number` (default 0, неограничен сверху, как food/water/metal/fuel).
2. Новое building `generator` в `BuildingId` (literal union) → 3-е здание в `createDefaultBuildings()` + HOTSPOT в `BaseScene`.
3. `accrueOffline` тикает 3-е здание: `accrueGenerator` дренит `fuel` → накапливает `energy` напрямую в `baseResources.energy` (НЕ в buffer, как у bunk — выход = ресурс). Detail в §6.
4. Verstak-gate: `WeaponAssemblyScene.tryAssemble` проверяет `baseResources.energy ≥ ASSEMBLE_ENERGY_COST` ДО `assembleFromStash`. На успех — после consume партов вычитает energy и пишет save. Кнопка «Собрать» disabled когда не хватает energy (inline-помощь под кнопкой).
5. SAVE_VERSION 7→8, `migrateV7ToV8`: object-merge энергии в существующий `baseResources` + ensure-by-id для `generator` в существующих `buildings` (5-точечная save-safety).
6. Тесты: validation/flow/migration + offlineProgression (генератор) + cloudSave round-trip (energy + generator).

**OUT (anti-scope, НЕ трогать):**
- **Repair UI** (поломанный crafted weapon → починка) — отдельный PR.
- **Verstak как BuildingState** — workbench остаётся pure-action hotspot (открытие CraftScene), не несёт `accumulated_output`. Это решение из 6b-2 round Q5 («Pure-gate Верстак»), не пересматриваю.
- **Energy cap** — не делаем; baseResources сейчас все unbounded, не вводим asymmetry без playtest сигнала.
- **Energy на craft рецепты** (нон-assemble) — `recipes.json` пуст, craft-табы внутри CraftScene не трогаем. Energy гейтит только assembleFromStash path.
- **Tariff на per-part energy** — flat per-assembly cost; per-part тариф введём в M14 со slot-таксономией.
- **`HERO_ENERGY_MAX = 50`** в `balance.ts` — мёртвая константа (нет ридеров по grep'у), оставляем как есть в этом PR (не наш scope, отдельный cleanup).

---

## §1 Verified codebase facts (vs `a54d946`)

- **`src/config.ts:34`** — `SAVE_VERSION = 7 as const`.
- **`src/state/types.ts:85`** — `type BuildingId = "garden" | "bunk"` (literal union, exhaustive).
- **`src/state/types.ts:38`** — `interface BaseResources { water; fuel; metal; food }` — НЕТ energy.
- **`src/state/GameState.ts:74`** — `createDefaultBaseResources()` возвращает `{ water:0, fuel:0, metal:0, food:0 }`.
- **`src/state/GameState.ts:83`** — `createDefaultBuildings()` возвращает `[{garden,0}, {bunk,0}]`.
- **`src/scenes/BaseScene.ts:43`** — `HOTSPOTS[]` содержит `workbench` (action: `openSubscene("CraftScene")`), `garden`, `bunk`, плюс stash/radio/kettle/cot/door. Координаты painted-source 1366×768, рендер 1280×720 (~0.937 scale). Свободные зоны для нового hotspot есть — preflight 6c явно сказал «балансировка пиксель-точная = задача редизайна».
- **`src/scenes/BaseScene.ts:466-486 (collectGarden)`** — паттерн «building с buffer-ом, COLLECT в `baseResources.X`». Для генератора этот pattern НЕ нужен — energy идёт сразу в baseResources, как hp у bunk (только без UI-collect).
- **`src/scenes/BaseScene.ts:507-516 (renderGardenBuffer)`** — always-on counter рядом с hotspot. Идиома — для generator аналогично (`⚡ N`).
- **`src/systems/offlineProgression.ts`** — `accrueOffline(state, savedAtMs, nowMs) → {state, summary}`. Pure, ловит rollback/NaN/min/max windows. Внутри fixed-order: `accrueGarden → accrueBunk`. Каждое здание — отдельная функция `accrueX(state, deltaMs)`. AccrualState = `{baseResources, buildings, hp, hp_max}`.
- **`src/systems/cloudSave.ts:13 (CloudSaveSnapshot)`** — `baseResources?: BaseResources`, `buildings?: BuildingState[]`, плюс equipped_weapon/crafted_weapons/hp etc. Optional на уровне snapshot.
- **`src/systems/cloudSave.ts:320 (CLOUD_SAVE_KEYS)`** — whitelist уже содержит `baseResources` и `buildings`. **Новые поля energy / generator НЕ требуют нового key в whitelist** (это nested внутри уже-whitelisted). Drift-guard test (`cloudSave.test.ts:167`) не зафейлит на этом PR.
- **`src/state/migrations.ts`** — последняя миграция `migrateV6ToV7` (stamp-only). Следующая — `migrateV7ToV8`.
- **`src/systems/cloudSave.ts:198`** — `migrated.buildings && migrated.buildings.length > 0 ? migrated.buildings : createDefaultBuildings()`. Length-guard уже стоит как защита от Trap-B варианта-1 (пустой массив). **Но это не защищает от Trap-B варианта-2: массив с `[garden, bunk]` без generator-а**.
- **`src/scenes/WeaponAssemblyScene.ts:251 (tryAssemble)`** — точка где `assembleFromStash` вызывается. Это место для UI-gate'а.
- **`src/scenes/InventoryScene.ts`, `src/scenes/CraftScene.ts`** — ридеры `equipped_weapon`/`baseStash`/`baseResources.food`/etc, не читают `baseResources.energy` нигде (поле не существует). После добавления — UI на InventoryScene для отображения energy опционален; решил НЕ добавлять, energy live только на Verstak path (BaseScene badge + WeaponAssemblyScene inline-counter).
- **Existing test fixtures с building-ids:**
  - `src/state/__tests__/migrations.test.ts:123,143` — `[{garden,12}, {bunk,0}]` фикстуры (migrateV5ToV6 / v6ToV7 проходы).
  - `src/systems/__tests__/cloudSave.test.ts:214` — `expect(ids).toEqual(["bunk", "garden"])` (alpha-сорт-assertion). **Ловушка для PR-6b-3: после добавления generator-а assertion станет `["bunk", "garden", "generator"]` — нужно обновить ОДНОЙ строкой**.

---

## §2 Замороженный контракт (приземляем дословно)

### 2.1 Type-level

```ts
// src/state/types.ts
export interface BaseResources {
  water: number;
  fuel: number;
  metal: number;
  food: number;
  energy: number;            // M13 PR-6b-3 add
}

export type BuildingId = "garden" | "bunk" | "generator";  // PR-6b-3 add
```

### 2.2 Balance (defaults)

```ts
// src/state/balance.ts (M13 PR-6b-3 block)
export const GENERATOR_FUEL_PER_CYCLE = 1;
export const GENERATOR_ENERGY_PER_CYCLE = 1;
export const GENERATOR_CYCLE_MS = 5 * 60 * 1000;   // 5min
export const ASSEMBLE_ENERGY_COST = 5;             // flat per assembleFromStash call
```

### 2.3 Accrual signature (новая функция)

```ts
// src/systems/offlineProgression.ts
const accrueGenerator = (state: AccrualState, deltaMs: number): {
  state: AccrualState;
  energy_added: number;
  fuel_spent: number;
} => { ... };

export interface AccrualSummary {
  // ... existing
  generator_energy_added: number;  // M13 PR-6b-3 add
  generator_fuel_spent: number;    // M13 PR-6b-3 add
}
```

### 2.4 Verstak-gate (UI-level)

`WeaponAssemblyScene.tryAssemble`:
1. Если `baseResources.energy < ASSEMBLE_ENERGY_COST` → inline-сообщение «Не хватает энергии», ранний return. (Кнопка «Собрать» ALSO disabled при недостатке, проверяется в `renderPartSelector`.)
2. Иначе → `assembleFromStash(picked, baseStash, rng)` (без изменений сигнатуры).
3. На успех → `baseResources = consumeBaseResource(baseResources, "energy", ASSEMBLE_ENERGY_COST)` ПОСЛЕ commit'а инстанса (если consume падает после уже-съеденных партов — тот же half-consume bug что 6b-2 атомарность; но `consumeBaseResource` всегда `Math.max(0, ...)`, никогда не throws, так что safe).
4. `saveToCloud()` после энергии-consume.

`assembleFromStash` НЕ трогаем — он остаётся pure-ассемблер партов из стеша. Energy — отдельный концерн на UI-слое (не валидатор партов).

---

## §3 Открытые решения — НУЖЕН ТВОЙ ✓

Дефолты выбраны решительно. Скажи «ок на все» или поправь точечно перед билдом.

**D1 — Где живёт energy-gate?** UI-level (`tryAssemble` в `WeaponAssemblyScene`). Альтернативы: (a) в `assembleFromStash` (pure) — потребовало бы расширить signature `(parts, stash, rng, energy?)` и добавить 4-й reason `not_enough_energy`, что нарушает замороженный 3-reason контракт Model C; (b) на entry hotspot workbench — блокирует и craft-табы CraftScene, что overshoot.
*Рек: ✅ UI-level. Не трогаем 3-reason контракт, не блокируем не-assemble craft.*

**D2 — Throw vs disable+inline для недостатка energy?** Кнопка «Собрать» disabled (greyed) когда `energy < ASSEMBLE_ENERGY_COST`, под кнопкой inline-помощь `Нужно ⚡${ASSEMBLE_ENERGY_COST}, есть ⚡${current}`. Альтернатива — клик → toast «Не хватает энергии». Disabled UX лучше: игрок видит причину до клика, не догадывается тыкая.
*Рек: ✅ disabled + inline.*

**D3 — Per-assemble flat vs per-part тариф?** Flat `ASSEMBLE_ENERGY_COST = 5` за вызов `assembleFromStash`, независимо от количества партов. Per-part тариф (например 1/part) обоснованнее когда есть слот-таксономия (PR M14), сейчас «3 части» vs «8 частей» это в основном UI-выбор, не game-decision.
*Рек: ✅ flat.*

**D4 — Generator model: bunk-style (НЕ garden-style).** Дренит `baseResources.fuel` (1 per cycle) → пишет НАПРЯМУЮ `baseResources.energy` (1 per cycle). 5min cycle. **Mirror'ит койку (food→hp direct), не грядку (water→buffer + tap).** Verstak-gate читает `baseResources.energy`; если энергия копится в `generator.accumulated_output` без UI-collect, она там застревает и gate всегда видит 0 → фича мёртвая на рантайме. Класс P1, юниты не ловят. `accumulated_output` у generator-а остаётся `0` всегда (shape-uniform с bunk).
*Рек: ✅ bunk-model, fuel→`baseResources.energy` direct, без buffer.*

> **Catch caught by Viktor pre-build.** Initial draft рисовал D4 как «симметрию с грядкой» (buffer + tap) одновременно с D8 «нет collect-кнопки». Конфликт: buffer без collect = energy недостижима для Verstak. Reverse на bunk-model до билда.

**D5 — Order accrual?** Fixed `[generator, garden, bunk]`. Generator перед garden потому что generator consumes fuel (свой ресурс), garden consumes water (свой), bunk consumes food (свой) — порядок не имеет реального эффекта на резалт, но fixed-порядок для детерминизма. Generator первый чтобы energy была доступна для UI-показателей сразу после load.
*Рек: ✅ `[generator, garden, bunk]`.*

**D6 — Cap на energy?** Unbounded (как water/fuel/metal/food). Альтернатива — `ENERGY_CAP = 50` чтобы fuel→energy конвертация имела sink. Сейчас sink есть — assembleFromStash. Cap избыточен пока нет playtest сигнала «accumulates too fast».
*Рек: ✅ unbounded.*

**D7 — Generator hotspot coordinates?** Свободная зона около верстака, координаты приближённо `x:380, y:480` (под workbench, рядом, чтобы logical grouping «производство для крафта»). Pixel-perfect — задача редизайна, как preflight 6c явно зафиксировал. Иконка badge: `⚡ ${energy}` always-on counter рядом, по идиоме `🌱 ${buf}/${CAP}` грядки.
*Рек: ✅ приближённо там, badge ⚡N.*

**D8 — Generator action: что делает тап?** Показывает status-toast (`Генератор: производит ⚡1/5мин, потребляет ⛽1/5мин`), без collect-механики (energy уже в baseResources). Mirror'ит `showBunkStatus()` из BaseScene.
*Рек: ✅ status-toast.*

---

## §4 Изменяемые файлы (ожидаемо)

- `src/state/types.ts` — `BaseResources += energy`, `BuildingId += "generator"`.
- `src/state/GameState.ts` — `createDefaultBaseResources()` добавляет `energy:0`; `createDefaultBuildings()` добавляет `{id:"generator", accumulated_output:0}`.
- `src/state/balance.ts` — 4 новых константы (см. §2.2).
- `src/state/migrations.ts` — `migrateV7ToV8`: object-merge energy в существующий baseResources + ensure-by-id для generator в существующих buildings.
- `src/config.ts` — `SAVE_VERSION = 8`.
- `src/systems/offlineProgression.ts` — `accrueGenerator()`, dispatch в `accrueOffline`, AccrualSummary += 2 поля, EMPTY_SUMMARY обновить.
- `src/systems/cloudSave.ts` — `applySnapshot` подцепляет updated baseResources/buildings через миграцию, `CLOUD_SAVE_KEYS` не трогаем (см. §1). Обновить `accrueOffline`-callsite если AccrualState shape поменялся (НЕ меняется — baseResources уже там).
- `src/scenes/BaseScene.ts` — generator HOTSPOT, `renderGeneratorBadge` (mirror garden-badge), `showGeneratorStatus()` toast.
- `src/scenes/WeaponAssemblyScene.ts` — energy-gate в `tryAssemble`, disabled-кнопка + inline-help в `renderPartSelector`, consume энергии после успешного `assembleFromStash`.
- `src/systems/locale.ts` — 2-3 новых ключа: `not_enough_energy_for_assembly`, `generator_status`, `assembly_energy_label`.
- Тесты: см. §7.

---

## §5 5-точечная save-safety + Trap'ы

Чек-лист дисциплины (по образцу 6b-1 / 6c, где Viktor построил эту таблицу):

**Точка 1 — Type на snapshot уровне.** `BaseResources` и `BuildingState` уже типизированы как опциональные в `CloudSaveSnapshot` (через nested типы). Добавление полей — типобезопасно.

**Точка 2 — Whitelist в `CLOUD_SAVE_KEYS`.** `baseResources` и `buildings` уже whitelisted. ✅ Без изменений.

**Точка 3 — `serializeGameState`.** Уже пишет `baseResources` и `buildings` целиком. ✅ Без изменений (новые nested поля поедут автоматически).

**Точка 4 — `applySnapshot` restore.**
- `baseResources`: текущий код `migrated.baseResources ?? createDefaultBaseResources()`. После миграции v7→v8 поле `energy` будет в объекте. **БЕЗ миграции:** v7-сейв читается → migrate-loop проходит v7→v8 (новая миграция, см. ниже) → `baseResources.energy = 0`. Безопасно.
- `buildings`: текущий `migrated.buildings && length>0 ? migrated.buildings : createDefaultBuildings()`. **Trap-B-вариант-2** (см. ниже): v7-сейв имеет `buildings=[garden,bunk]` без generator. Length-guard НЕ срабатывает (length=2>0), возвращается старый массив без generator. **Решается в migrateV7ToV8** через ensure-by-id, applySnapshot не трогаем.

**Точка 5 — Round-trip регресс-тест.** Новый тест: full snapshot с energy + generator → save → getData(whitelist) → load → состояние совпадает. Pattern уже есть для buildings/hp в `cloudSave.test.ts`.

### Trap'ы — критическая секция

**Trap A (carry-over из 6b-1).** Для `equipped_weapon` `null` валиден, `??` ломает. В 6b-3 НЕ применимо (energy/generator не имеют semantic-null). Оставляю как discipline-напоминание.

**Trap B-вариант-1 (carry-over из 6c).** `[] ?? default === []` — пустой массив проходит coalescing. В 6b-3 уже защищено `length > 0` guard'ом для buildings, не применимо к нашей миграции (мы не пишем `[]`).

**🆕 Trap B-вариант-2 (новый, ключевой для этого PR).** `migrated.buildings = [{garden,X}, {bunk,Y}]` — НЕ пустой массив. `?? default` НЕ срабатывает (truthy). Length-guard НЕ срабатывает (length=2). Игрок остаётся без generator-а навсегда. **Фикс — в migrateV7ToV8:**

```ts
const migrateV7ToV8 = (snap: VersionedSnapshot): VersionedSnapshot => {
  return {
    ...snap,
    version: 8,
    baseResources: snap.baseResources
      ? { ...snap.baseResources, energy: snap.baseResources.energy ?? 0 }
      : undefined,
    buildings: snap.buildings
      ? ensureBuildingPresent(snap.buildings, "generator")
      : undefined,
  };
};

const ensureBuildingPresent = (
  buildings: BuildingState[],
  id: BuildingId,
): BuildingState[] =>
  buildings.some((b) => b.id === id)
    ? buildings
    : [...buildings, { id, accumulated_output: 0 }];
```

Идемпотентно: повторный запуск на v8-snap → `ensureBuildingPresent` находит generator, возвращает массив as-is.

**🆕 Trap C — NaN propagation.** Если migration пропущен (баг в migration-loop) и `baseResources.energy === undefined`, тогда:
- Read: `baseResources.energy ≥ ASSEMBLE_ENERGY_COST` → `undefined >= 5 === false`. Безопасно, гейт сработает «нет энергии».
- Consume: `Math.max(0, undefined - 5) === Math.max(0, NaN) === NaN`. **Распространяется на save**, при следующем load fuel/water тоже могут стать NaN если дальше идут операции.

**Фикс — defensive в `consumeBaseResource`/`addBaseResource`:** не меняю signature, но добавлю NaN-guard в чтении внутри `accrueGenerator`: `const energy = baseResources.energy ?? 0`. Регресс-тест: применяю v7-snapshot мимо миграции (синтетический сетап), проверяю что accrueGenerator не пишет NaN.

**🆕 Trap D — BuildingId exhaustive.** Адд `"generator"` в literal union ломает exhaustive checks (если есть). По `grep "BuildingId"` — ни одного `switch`-statement на BuildingId нет (только `findBuilding(.., id)` с per-id константами). ✅ Не ломает. Но `cloudSave.test.ts:214` имеет `expect(ids).toEqual(["bunk", "garden"])` — fail'нет после изменения, обновить на `["bunk", "garden", "generator"]`.

**🆕 Trap E — accrueOffline ALREADY called in applySnapshot.** Сейчас accrue зовётся ВНУТРИ applySnapshot после восстановления buildings/hp/baseResources. После миграции v7→v8 этот код увидит generator в buildings и energy в baseResources, прогонит accrueGenerator. **Важно**: фрешие v8 сейвы (новые игры) тоже получат accrue, но это OK — на новой игре `savedAtMs === Date.now() - epsilon`, delta < MIN_ACCRUAL_WINDOW, no-op. Подтверждение в тесте.

---

## §6 Balance defaults (§2.2 в деталях)

| Параметр | Значение | Обоснование |
|----------|----------|-------------|
| `GENERATOR_FUEL_PER_CYCLE` | 1 | Симметрия с грядкой (water=1/cycle). |
| `GENERATOR_ENERGY_PER_CYCLE` | 1 | 1:1 конверсия fuel→energy, прозрачная экономика. |
| `GENERATOR_CYCLE_MS` | 5 × 60 × 1000 = 5 минут | Между BUNK (10мин) и GARDEN (30мин). Energy «дешевле» собирать чем food, но дороже чем hp-tick. |
| `ASSEMBLE_ENERGY_COST` | 5 | 25 минут генератора = 1 сборка при unlimited fuel. С учётом fuel-input — реально 30-40мин real time за стандартный sortie loop. Тюнится post-playtest. |

**Sanity check loop time:** 8ч offline (max accrual) = 96 cycle * 1 energy = 96 energy = 19 сборок макс. Реалистичный sortie loop = 30-60мин offline + 5-10мин активной игры → 6-12 energy per cycle, 1-2 сборки. Чувствуется правильно: assemble — событие, не grind.

---

## §7 Test plan

**`migrations.test.ts` add:**
- v7-snapshot с `baseResources = {water:5, fuel:3, metal:1, food:2}` (БЕЗ energy) и `buildings=[garden,bunk]` → migrate → `baseResources.energy === 0`, `buildings.length === 3`, generator present с `accumulated_output:0`.
- v7-snapshot с `buildings=[]` (мигрированный v5 пустой) → migrate v7→v8 → `buildings=[]` (НЕ инжектим — пустой массив == «v5 которого мы не знаем», applySnapshot потом подставит createDefaultBuildings()).
- Идемпотентность: `migrate(migrate(v7))` === `migrate(v7)`.
- Идемпотентность: v8-snapshot с generator уже в списке → migrate не дублирует, не мутирует.
- v7-snapshot с `baseResources.energy = 99` (синтетический, не должно быть) → migrate сохраняет 99 (passthrough `?? 0` не срабатывает).

**`offlineProgression.test.ts` add:**
- `accrueGenerator` happy: 10mins delta + 5 fuel → 2 cycles → energy +2, fuel -2.
- input-bounded: 1h delta + 2 fuel → 2 cycles (не 12).
- input-bounded edge: 0 fuel → 0 cycles, energy не меняется.
- accrueOffline order: state.energy ≥ accrueGarden.water нагрузка независимы — фиксированный порядок проверяется одним «определёнка» прогоном.
- AccrualSummary новые поля заполняются.
- NaN-guard: `baseResources.energy === undefined` (синтетический skip-migrate) → accrueGenerator выдаёт `energy_added: 0`, не NaN.

**`cloudSave.test.ts` add:**
- Drift-guard уже зелёный (whitelist без изменений) — не add, но проверить green.
- Round-trip: snapshot с energy=10 + generator с accumulated_output=3 → save → getData(whitelist) → load → state.baseResources.energy === 10, generator есть.
- v7 → v8 в applySnapshot: existing v7 сейв с `[garden,bunk]` → load → buildings=3 (generator появился), energy=0.
- Update: `expect(ids).toEqual(["bunk", "garden", "generator"])` (mline 214).

**`weaponAssemblyScene` (через ваш smoke-harness):**
- Sufficient energy → assemble succeeds, energy decremented, save written.
- Insufficient energy → button disabled, click no-op, inline-help shown.
- Control case: pre-fix коммит (без gate'а в tryAssemble) на том же fixture с energy=0 — должен permit ассемблу. CONTROL-правило по твоей дисциплине: green только если pre-fix fail'нет.

---

## §8 Гейты (что я и Viktor проверим)

1. **3 reason-кода** валидатора без расширения — `assemblyValidation.ts` не трогаем.
2. **Energy gate UI-only** — `assembleFromStash` сигнатура не изменена, pure.
3. **Migration v7→v8** — Trap B-2 закрыт (ensure-by-id) + object-merge для baseResources + idempotent.
4. **NaN-guard в accrueGenerator** — defensive read через `?? 0`.
5. **Round-trip cloudSave** — energy + generator переживают getData/setData.
6. **Drift-guard whitelist** — зелёный без изменений (новые nested поля внутри уже-whitelisted).
7. **Smoke харнесс** — control-проверка на pre-gate коммите (должен fail'нуть), на fixed коммите — pass.

**Билд-гейты:** `tsc --noEmit` 0 · `eslint src/` 0 · `vitest` всё зелёное (+N новых) · `npm run build` ✓.

---

## §9 Questions to confirm (analog Q1–Q6 of 6b preflight)

Не блокеры для билда — заморожу дефолты выше. Но если есть несогласие:

**Q1 — Gate-site.** UI vs pure? Я взял UI per D1. Подтверди или флипни.

**Q2 — Cost.** `ASSEMBLE_ENERGY_COST = 5`. Принимаешь как стартовый, или хочешь другое?

**Q3 — Generator cycle.** 5min between bunk (10) and garden (30). Подтверди.

**Q4 — Inline-help vs toast.** Disabled button + inline help under it, или toast on click? Я взял disabled+inline per D2.

**Q5 — Generator hotspot UX.** Status-toast при тапе, без collect-button. Подтверди.

**Q6 — Save migration shape.** Object-merge для baseResources, ensure-by-id для buildings. Это правильное место для логики (а не в applySnapshot), как ловушка C из preflight 6c. Подтверди.

Viktor: ✅ на все 8 дефолтов с D4 reverse (см. §3 D4). Q1, Q2, Q3, Q4, Q5, Q6 confirmed. Прохождение этого блока в PR-summary OP'а.

---

## §10 Implement checklist — 4 guard'а pre-merge (зафиксировано Viktor)

**G1 — Дефолты в ОБОИХ путях.**
- `createDefaultBaseResources()` += `energy: 0` (новая игра).
- `createDefaultBuildings()` += `{id:"generator", accumulated_output:0}` (новая игра).
- `migrateV7ToV8` пишет energy в `baseResources` + `generator` в `buildings` (старые сейвы).
Без обоих путей — новая игра без генератора либо мигрированный сейв без energy.

**G2 — `migrateV7ToV8` = DATA-FULL, не stamp-only** (в отличие от v6→v7). Точная форма:

```ts
const migrateV7ToV8 = (snap: VersionedSnapshot): VersionedSnapshot => {
  const baseResources = {
    ...createDefaultBaseResources(),
    ...(snap.baseResources ?? {}),
  };
  const buildings = [...(snap.buildings ?? createDefaultBuildings())];
  if (!buildings.some((b) => b.id === "generator")) {
    buildings.push({ id: "generator", accumulated_output: 0 });
  }
  return { ...snap, version: 8, baseResources, buildings };
};
```

Default-first spread в `baseResources` → snap values (water/fuel/metal/food) overwrite дефолты, `energy:0` добивается из дефолта. Ensure-by-id для buildings идемпотентен. **Import `createDefaultBaseResources` / `createDefaultBuildings` в migrations.ts.**

**G3 — Тест-брейк заранее.** `cloudSave.test.ts:214`:
```ts
expect(ids).toEqual(["bunk", "garden"])
// →
expect(ids).toEqual(["bunk", "garden", "generator"])
```
Новый инвариант: даже v5-сейв через v7→v8 chain получает generator. Подтверждение в migrations.test.ts: synthetic v7-snapshot с `[garden, bunk]` → migrate → `[garden, bunk, generator]`.

**G4 — Atomic energy×parts в `tryAssemble`** (порядок строгий, инвариант): _energy списана ⟺ оружие создано_.

```ts
private tryAssemble(visibleParts: ComponentItem[]): void {
  const picked = visibleParts.filter((p) => this.selectedPartIds.has(p.id));

  // (1) Energy pre-check.
  if (GameState.baseResources.energy < ASSEMBLE_ENERGY_COST) {
    this.showError(t("not_enough_energy_for_assembly"));
    return;
  }

  try {
    // (2) Atomic parts consume + assemble. Throws → ничего не съедено.
    const { instance, nextStash } = assembleFromStash(picked, GameState.baseStash, Math.random);

    // (3) Success → commit parts + deduct energy + persist.
    GameState.baseStash = nextStash;
    GameState.player.crafted_weapons = [...GameState.player.crafted_weapons, instance];
    GameState.player.equipped_weapon = { kind: "crafted", id: instance.id };
    GameState.baseResources = consumeBaseResource(
      GameState.baseResources, "energy", ASSEMBLE_ENERGY_COST,
    );
    void saveToCloud();

    this.showToast(`Собрано: ${instance.name_ru}`);
    this.time.delayedCall(900, () => this.scene.start("BaseScene"));
  } catch (e) {
    // assembleFromStash threw → energy НЕ списана. UI показывает причину.
    if (e instanceof AssemblyError) {
      this.showError(t(`assembly_invalid_${e.reason}`));
      return;
    }
    this.showError("Не удалось собрать. Проверьте детали в инвентаре.");
  }
}
```

Кнопка «Собрать» (`renderPartSelector`): disabled когда `baseResources.energy < ASSEMBLE_ENERGY_COST`, inline-help `⚡нужно ${ASSEMBLE_ENERGY_COST}, есть ${current}` под кнопкой.

---

## §11 Smoke harness — adapt для 6b-3

Адаптация Viktor'ова `smoke_assembly.ts` под energy + generator. **Зелёный валиден только если pre-fix падает** (control-правило, как было в 6b-2).

**Ключевые ассерты (зелёный что-то значит):**

- **(a)** После `accrueOffline(state, savedAt-N min, savedAt)` — `state.baseResources.energy` ВЫРОС (не только `generator.accumulated_output`). _Ловит D4×D8 trap._
- **(b)** `state.baseResources.fuel` уменьшился на `cycles × GENERATOR_FUEL_PER_CYCLE`, никогда не уходит в минус (input-bounded).
- **(c)** При `energy < ASSEMBLE_ENERGY_COST`: кнопка «Собрать» disabled, `assembleFromStash` НЕ вызван, partsStash не тронут.
- **(d)** Energy списана ⟺ оружие создано. Все 4 комбинации: (energy ok, parts ok) → assembled+deducted; (energy ok, parts bad) → throws, energy НЕ списана; (energy bad, parts ok) → no assemble, no deduct; (energy bad, parts bad) → gate срабатывает первым.
- **(e)** Migrated v7-сейв с `baseResources={water,fuel,metal,food}` и `buildings=[garden,bunk]` → applySnapshot → `baseResources.energy === 0` и generator в `buildings` с `accumulated_output:0`.

**Control:** для каждого ассерта прогон на pre-fix коммите (или synthetic broken version) — должен fail'нуть. Тот же pre-fix `5af1a17` / fixed `d083054` шаблон что в 6b-2 smoke (12 fail / 18/18 pass).
