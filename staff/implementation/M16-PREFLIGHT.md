# M16 — Глубина крафта: accuracy/weight, preview, аффиксы — PREFLIGHT

> **Веха:** M16 (roadmap §«Глубина крафта»). Базовая ветка: `main` @ `3f72bba` (после merge M15-PR3 #200, M15 закрыта).
> **Форма:** ОДИН общий префлайт на 3 PR-а (multi-vertical veha, PR-size contract). PR-ы последовательны.
> **Схема:** **v8→v9 (один bump на всю веху).** Бампит **только PR1**; PR2/PR3 schema-neutral. Второй bump в очередь не кладётся до закрытия M16 (migration discipline, roadmap §138).
> **Автор:** Viktor (dev). Согласование форков — Alex; независимый guard-review — QA.
> **Статус:** черновик на ревью. Кода нет до per-PR GO.

---

## 0. TL;DR решений

- **Аффиксы — crafted-only** (preview-call Alex). Catalog-аффиксы = редактирование контента, не craft-depth → отложены вместе с armor-intrinsic-слоем.
- **accuracy/weight входят в `computeHeroPower` как множители оффенса** (accuracyFactor × weightFactor). Baseline-значения дают factor 1.0 ⇒ **zero combat regression** для legacy-оружия и каталога.
- **Один bump v8→v9 в PR1**, который forward-определяет ВЕСЬ персист-shape M16 на `WeaponInstance` (`stats.accuracy` + `weight_kg` + `affixes: []`). PR3 только заполняет `affixes`, поле уже дефолтнуто миграцией. Это держит «один путь vN→vN+1».
- **Миграция = default-stamp, не derive** (Alex): legacy crafted-инстансы получают `stats.accuracy = ACCURACY_BASELINE`, `weight_kg = 0`, `affixes = []`. Не пересчитываем из parts (freeze-on-assembly дисциплина, C4).
- **Аффиксы НЕ трогают M15-петлю.** Жёсткий whitelist потребителей: `damage / accuracy / weight`. Запрещено: `durability_max`, `durability_current`, repair-decay, disassembly-refund, любой множитель к ним. Любой аффикс, бьющий по петле — отдельный Alex GO.
- **R1 продолжает M15-PR3:** резолвер `weaponDamage.ts` расширяется до полного combat-stat блока; `snapshotHero` И арсенальная дельта зовут ОДИН резолвер.
- **🚩 ЭСКАЛАЦИЯ (см. §7):** под «crafted-weapon-only + combat-surface-only» билд Гриндера теряет carry/loot-идентичность. Нужен product-call.

---

## 1. Что есть сейчас (code-grounded на `3f72bba`)

### 1.1 Бой (`src/systems/sortieResolve.ts`)
- `computeHeroPower(hero, goal)` (`:193`): `base = (hero.weapon_damage_avg + 2) * skillBonus * levelBonus * injuryPenalty`. **Оффенс читает ТОЛЬКО `weapon_damage_avg`.**
- `decideOutcome(heroPower, mobThreat, rng)`: `ratio = heroPower/mobThreat`; `<0.4` → `knocked_out`; `<0.7` → coin(fled/won); иначе `won`.
- Урон по герою: `mobThreatAdjusted * (1 - armor_reduction) * goal.hp_damage_modifier * jitter`.
- ⇒ Два рычага: **оффенс** (`heroPower` → исход) и **дефенс** (`armor_reduction` → потеря hp). accuracy/weight сейчас не входят ни в один.

### 1.2 Снимок героя (`SortieRunScene.snapshotHero`, `:113`)
- После M15-PR3: зовёт `resolveEquippedDamage(eq, items, crafted)` (`systems/weaponDamage.ts`), `weapon_damage_avg = (min+max)/2`. `HeroSnapshot` — рантайм-структура, **НЕ персистится** (строится каждую вылазку) ⇒ её расширение НЕ требует bump.

### 1.3 Сборка (`src/systems/weaponAssembly.ts`)
- `assembleWeapon(parts, id)`: суммирует `part.stats.{damage_min,damage_max,durability_max}`, floor min≥0, clamp max≥min. FROZEN в `WeaponInstance.stats`.
- `WeaponInstance` = `{id, name_ru, slot:"action", stats:{damage_min,damage_max}, durability_max, durability_current, parts:string[]}`. **Веса на инстансе нет.**
- `assembleFromStash` / `attemptAssembly` (`assemblyFlow.ts`) уже принимают `rng` (сейчас — только для `nextWeaponInstanceId`). **Готовый хук для affix-roll в PR3.**

### 1.4 Схема (`src/systems/itemSchema.ts`)
- `componentSchema.stats` = `{damage_min?, damage_max?, durability_max?}` strict optional — **точка расширения под `accuracy`** (комментарий `:79-90` прямо это предвидит: «когда появится accuracy — добавим»).
- `weaponSchema.stats` = `{damage_min?, damage_max?}` optional; `intrinsic_affixes?` (max 3) уже есть.
- `intrinsicAffixSchema` = `{id:string, value:number}` — **готовая форма для random-аффиксов** (тот же `{id,value}`).
- Все предметы несут `tier` 1-5 (`commonItemFields`). `weight_kg` nonnegative обязателен.

### 1.5 Вклад частей (`docs/redesign/M13-OP1-PART-CONTRIBUTIONS.md`)
- 60 non-mod частей мапятся 1:1 в семейства; summed damage == catalog twin. Mod-части (`mod_optic_*`, `mod_tac_grip` = accuracy; `mod_ext_mag_*` = capacity) сейчас `{}` (0) — **«у accuracy нет потребителя в sortieResolve»**. M16-PR1 даёт им потребителя.

### 1.6 Персист + миграции
- `CloudSaveSnapshot.crafted_weapons?: WeaponInstance[]` (`cloudSave.ts:66`) — источник истины frozen-stats.
- `migrations.ts`: чейн `migrateVNToVN+1`, guard `if (version >= SAVE_VERSION) return`, **идемпотентность обязательна**. `migrateV7ToV8` (`:305`) — образец DATA-FULL миграции (default-first spread). `SAVE_VERSION = 8` (`config.ts:34`).
- Тест-паттерн (`migrations.test.ts`): per-version bump + «vN идемпотентен» (`migrated.toEqual(vN)`) + «идемпотентна на любой версии».

### 1.7 Мёртвые поверхности (контекст, НЕ в скоупе M16)
- `getPassiveEffects` (`SkillTree.ts:91`) считает `accuracy_bonus`, `max_weight_kg_bonus`, `damage_mul` и т.д. — но **нигде не потребляется** в sortie-пути (только тест). Это мёртвый pre-pivot слой. M16 НЕ вайрит skill→combat (отдельная веха). Упоминаю, чтобы affix-accuracy не спутали со skill-accuracy.

---

## 2. Целевой combat-контракт (как accuracy/weight входят) — PR1

Модель выбрана за **легибельность** (DoD: «различимы по статам») и **zero-regression** на baseline.

Оффенс-часть `computeHeroPower` меняется так:
```
effectiveDamage = weapon_damage_avg * accuracyFactor * weightFactor
base = (effectiveDamage + 2) * skillBonus * levelBonus * injuryPenalty   // остальное без изменений
```
где
```
accuracyFactor = clamp(1 + (accuracy - ACCURACY_BASELINE) * ACCURACY_TO_POWER, ACC_FACTOR_MIN, ACC_FACTOR_MAX)
weightFactor   = clamp(1 - max(0, weapon_weight - WEIGHT_FREE_KG) * WEIGHT_TO_POWER_PENALTY, WEIGHT_FACTOR_MIN, 1)
```

**Свойства (тестируемые инварианты, не числа):**
- `accuracy == ACCURACY_BASELINE` ⇒ `accuracyFactor == 1.0`.
- `weapon_weight <= WEIGHT_FREE_KG` ⇒ `weightFactor == 1.0`.
- ⇒ legacy-инстанс (default-stamp: accuracy=baseline, weight=0) и любой catalog-ствол (accuracy отсутствует → baseline, weight не входит в combat-вес каталога → 0) дают `effectiveDamage == weapon_damage_avg` ⇒ **бит-в-бит прежний `heroPower`**. Zero regression — отдельный тест.
- accuracy↑ → оффенс↑ (Стрелок); weapon_weight↑ → оффенс↓ (handling-штраф, Танк жертвует оффенсом ради damage/armor).

**Почему именно так (rejected alts):**
- *weight → initiative/speed.* В пивоте нет initiative в `sortieResolve` (есть мёртвый `WEIGHT_INITIATIVE_PENALTY`, не потребляется). Вводить speed-слой = новая механика вне скоупа PR1.
- *weight → +carry only.* Не даёт боевого trade-off Танку; вес тогда чисто инвентарный. Handling-штраф связывает «тяжёлый ствол» с «медленнее бьёт» — легибельно.
- *accuracy → crit/variance.* Вариантность боя в авторесолве абстрактна; crit без боя-по-ходам нечего модифицировать. Множитель к оффенсу — единственная форма с живым потребителем.

Все 5 констант — в `balance.ts`, **тюнятся свободно** после плейтеста (тесты бьют по знаку/инвариантам).

**Combat-вес оружия (`weapon_weight`)** = frozen `WeaponInstance.weight_kg` (сумма `part.weight_kg` на сборке). Для каталога — 0 (не вводим weapon-handling для found-оружия в M16; их identity — вечная прочность). Это НЕ инвентарный вес рюкзака (`max_weight_kg` carry-система, отдельный потребитель в `LootScene/BaseScene`).

---

## 3. PR-разбивка (3 PR, seams не размер; каждый 500-1200 LOC)

### PR1 — Stat-surface + combat consumption + миграция (**schema PR, bump v8→v9**)
**Это единственный PR с bump'ом.** Forward-определяет весь персист-shape M16.

1. **Схема** (`itemSchema.ts`): `componentSchema.stats += accuracy: z.number().int().optional()`; `weaponSchema.stats += accuracy: z.number().int().nonnegative().optional()`. Аддитивно, backward-compat (как слот-енумы).
2. **`WeaponInstance`** (`weaponAssembly.ts`): `stats += accuracy: number`; `+ weight_kg: number` (frozen); `+ affixes: WeaponAffix[]` (тип заведён сейчас, заполняется в PR3; в PR1 всегда `[]`).
3. **`assembleWeapon`**: суммирует `part.stats.accuracy` (как damage); `weight_kg = sum(part.weight_kg)`; `affixes: []`. accuracy floor ≥ 0.
4. **Резолвер** (`weaponDamage.ts`, R1): `resolveEquippedDamage` → расширить/обернуть в `resolveEquippedCombat(eq, items, crafted) → {damage_min, damage_max, accuracy, weight}`. Тот же per-field `typeof==="number"` guard (R2). bare-hands/broken → baseline accuracy + weight 0. **Зовётся `snapshotHero` И арсенальной дельтой.**
5. **`HeroSnapshot`** (`types/sortie.ts`): `+ weapon_accuracy: number`, `+ weapon_weight: number` (рантайм, НЕ персист).
6. **`computeHeroPower`**: модель §2.
7. **Миграция** `migrateV8ToV9` + `SAVE_VERSION=9`. См. §4.
8. **`balance.ts`**: `ACCURACY_BASELINE`, `ACCURACY_TO_POWER`, `ACC_FACTOR_MIN/MAX`, `WEIGHT_FREE_KG`, `WEIGHT_TO_POWER_PENALTY`, `WEIGHT_FACTOR_MIN`.
9. **Тесты:** G1/G2/zero-regression (§4); accuracy/weight суммирование на сборке; computeHeroPower монотонность (acc↑→power↑, weight↑→power↓); резолвер-парити (acc/weight для catalog/crafted/broken/null).

### PR2 — Preview-панель сборки (schema-neutral)
- Чистый `previewAssembly(parts) → {damage_min, damage_max, accuracy, weight_kg, durability_max}` — вынести summation из `assembleWeapon` в общий хелпер (instance НЕ создаётся, stash не трогается). `assembleWeapon` зовёт его же ⇒ preview == результат бит-в-бит.
- UI в `WeaponAssemblyScene`: до commit показывает итоговые статы + (опц.) угаданную стратегию. Без preview — слепой рандом (M13-PIVOT §130).
- Тесты: `previewAssembly == assembleWeapon().stats` инвариант; пустой/частичный набор.

### PR3 — Аффиксы + качество (schema-neutral, `affixes` уже дефолтнуто v9)
- **Affix-registry** (`systems/weaponAffixes.ts`): пул prefix/suffix, каждый = `{id, kind:"prefix"|"suffix", stat: AffixStat, value}`. `AffixStat` ∈ **whitelist `{damage_min, damage_max, accuracy, weight_kg}`** (см. §5 — петля M15 защищена).
- **Roll** в `assembleFromStash`/`attemptAssembly` (rng уже прокинут): 0-2 аффикса, **count по max part tier** в сборке (прокси «качества верстака», см. §6-fork-D). Детерминированно на seeded rng. Frozen в `instance.affixes`.
- **Применение:** аффиксы входят в эффективные combat-статы в резолвере (§4 R1) — `effective = frozen.stats (+) affixes`. Тот же путь для боя и дельты/preview.
- **Gate-тест (DoD):** 3 стратегии Стрелок/Танк/Гриндер собираемы и различимы по статам (см. §7).
- UI: аффиксы в preview (PR2) + Арсенал detail-panel + stat-delta.

---

## 4. Миграция v8→v9 (ФИКСИРУЕТСЯ ЗДЕСЬ, до кода)

**Триггер:** `WeaponInstance` получает персистимые поля (`stats.accuracy`, `weight_kg`, `affixes`) → legacy crafted-инстансы в v8-сейвах их не несут.

**Форма (default-stamp, НЕ derive — Alex):** `migrateV8ToV9(snap)`:
- На КАЖДЫЙ инстанс в `snap.crafted_weapons` (если массив есть):
  - `stats.accuracy = ACCURACY_BASELINE` если отсутствует (default-first spread: `{accuracy: BASE, ...inst.stats}` ⇒ существующее значение побеждает на повторе — идемпотентно).
  - `weight_kg = 0` если отсутствует.
  - `affixes = []` если отсутствует.
- `version = 9`.
- `crafted_weapons` отсутствует / undefined → passthrough (как v6→v7 для equipped_weapon: НЕ инжектим, `applySnapshot` подставит `?? []`).

**Почему baseline/0/[] а не derive:** freeze-on-assembly (C4) — пересчёт из `parts` на load запретён, иначе баланс-патч молча перепишет статы каждого сейв-инстанса. Legacy-оружие получает нейтральные значения ⇒ combat-поведение не меняется (§2 zero-regression). Это сознательная плата: старая сборка не «узнает» свою истинную accuracy/weight, но и не ломается.

**Поля персиста, которые НЕ трогаем:** `equipped_weapon` (catalog/crafted/null — без изменений), `HeroSnapshot` (не персистится).

**Тесты (G1/G2 пара + zero-regression):**
- **G1 (default-stamp):** v8-snap с crafted-инстансом без accuracy/weight_kg/affixes → `migrateSnapshot` → инстанс несёт `accuracy=BASELINE`, `weight_kg=0`, `affixes=[]`, `version=9`. Прочие поля (damage/durability/parts) бит-в-бит.
- **G2 (round-trip + идемпотентность):** v9-snap (уже с полями, в т.ч. непустой `affixes`) → migrate → re-serialize → re-load → стабильно; повторный `migrateSnapshot` ничего не меняет (`toEqual`). Существующий тест «v8 идемпотентен» **переписывается** в «v9 идемпотентен» + добавляется кейс «v8→v9 стампит инстанс».
- **Zero-regression:** default-stamped (legacy) инстанс → `resolveEquippedCombat` даёт accuracyFactor=1, weightFactor=1 → `computeHeroPower` бит-в-бит == pre-M16 на тех же входах.
- **Idempotency на любой версии** (существующий generic-тест) — должен пройти без правок логики.

---

## 5. Защита петли M15 (Alex: аффиксы легко её перверзят)

Петля M15 = `durability → repair (metal, DF1) → max-decay (DF1b) → beyond-repair → disassemble (lossy, DF2) → parts`. Аффиксы её НЕ касаются:

**Hard whitelist потребителей аффиксов:** `damage_min`, `damage_max`, `accuracy`, `weight_kg` (та же combat-поверхность, что PR1 вводит).

**Hard forbid (любой такой аффикс = отдельный Alex GO):**
- `durability_max` / `durability_current` (любой бонус/множитель) — убьёт DF1b decay-конечность.
- repair-стоимость/эффективность (`METAL_PER_DURABILITY_POINT`, `REPAIR_MAX_DECAY`) — «починка без потери max при affix X» убьёт DF1b.
- disassembly-возврат (`DISASSEMBLE_RECOVERY_RATE`, drop-order) — «полнообратимый разбор при affix Y» убьёт DF2.

**Enforcement в коде:** `AffixStat` — узкий union из 4 строк, не свободный string. Любой affix-def вне whitelist не скомпилируется. Тест: реестр аффиксов ⊆ whitelist (структурный, не числовой).

**Power-budget аффиксов** (насколько силён «+accuracy») — тюнинг-константы в реестре, тесты бьют по знаку/структуре. НЕ эскалирую (не M15-петля; общий баланс тюнится после плейтеста).

---

## 6. Прочие форки — решено + обоснование default'а (не эскалирую)

- **A. accuracy — additive scalar на части (как damage), не множитель.** Обоснование: ассемблер уже суммирует аддитивно и коммутативно; множитель порядко-зависим без базы (тот же довод, что отклонил `contribute_mult` в componentSchema). Процент входит на уровне `accuracyFactor` в combat-формуле, не на уровне части.
- **B. weapon combat-weight = frozen sum(part.weight_kg), хранится на инстансе.** Обоснование: freeze-on-assembly; не пересчитываем на load. Каталог-оружие combat-weight=0 (handling-штраф только для crafted — found-стволы и так конечны прочностью? нет — вечны; их trade-off = их и так нет, баланс через accuracy=baseline). Инвентарный carry-вес не трогаем.
- **C. catalog-оружие accuracy.** `weaponSchema.stats.accuracy` optional, в `content/items.json` **не заполняем в M16** (crafted-only). Отсутствует → baseline → factor 1.0. Schema-поле заводим, чтобы не делать второй bump, если в M17+ захотим авторскую accuracy на found-стволах.
- **D. affix roll-count driver = max part tier в сборке** (не «тир верстака» — его нет; verstak = бинарный energy-gate). Маппинг (default, тюнится): tier 1-2 → 0-1 аффикс; tier 3-5 → 0-2. Обоснование: даёт потребителя `part.tier`, не вводит workbench-tier систему (это M17 base-sim). Если M17 введёт тир верстака — заменим драйвер там.
- **E. affix scope = собранное оружие, не часть** (M13-BUILDS §«слой аффиксов»): 1 ролл на сборку, не 4. Убирает «три источника рандома».
- **F. affixes только на crafted, не на equipped catalog** (= Alex preview-call). Каталог-оружие аффиксов не несёт.
- **G. Determinism:** affix-roll на том же seeded `rng`, что `nextWeaponInstanceId`. Порядок: id → affixes (зафиксировать, чтобы save-snapshot тесты были стабильны).

---

## 7. 🚩 ЭСКАЛАЦИЯ — Гриндер vs «crafted-weapon-only + combat-only»

**Проблема.** DoD M16: «три стратегии (Стрелок/Танк/Гриндер) собираемы И различимы по статам». Под двумя твоими рамками вместе:
- crafted-weapon-only аффиксы (catalog/armor-intrinsic отложены),
- whitelist combat-only (damage/accuracy/weight; carry/loot запрещены как economy-adjacent),

— Стрелок и Танк выражаются чисто (Стрелок = light+accurate ствол; Танк = heavy+high-damage ствол + тяжёлая броня). **Гриндер — нет:** его идентичность по `M13-BUILDS.md` = `+carry_kg / +inventory_slots / +scavenge_chance`, и эти аффиксы:
1. живут на **броне** (intrinsic), не на оружии — вне crafted-weapon-only;
2. бьют по **carry/loot-экономике**, не по combat-поверхности.

Под текущими рамками Гриндер в M16 различим только как «дешёвый лёгкий слабый ствол» (низкий damage/weight) — это не его дизайн-identity, а просто «плохой Стрелок».

**Два варианта (code-grounded последствия):**

- **Вариант G-A — Гриндер DoD = armor-intrinsic слой, отложен из M16.** M16 закрывает DoD на 2 из 3 стратегий через оружие; Гриндер помечается «requires armor-affix pass» (новая mini-веха или часть M17 base/content). Последствие: DoD M16 формально ослабляется до «Стрелок/Танк собираемы и различимы; Гриндер — после armor-слоя». Чисто, петля и whitelist не трогаются. **Мой дефолт, если не возразишь.**
- **Вариант G-B — впустить ОДИН carry/loot affix-stat в whitelist** (напр. `loot_quantity` или `carry_kg`) **только для Гриндера**. Последствие: whitelist расширяется на economy-adjacent поверхность; нужен потребитель (`loot_quantity` → `rollLoot` count; `carry_kg` → `max_weight_kg`). Это НЕ петля M15 (durability-metal-disasm), но это general economy → твой explicit call. Риск: power-budget loot-аффикса надо балансить против sortie-экономики; +1 потребитель в `sortieResolve.rollLoot` или в carry-системе.

**Вопрос к тебе:** G-A (отложить Гриндера, чистая M16) или G-B (один loot/carry-stat в whitelist под Гриндера, с твоим budget-надзором)? Всё остальное в префлайте решено дефолтами и эскалации не требует.

---

## 8. Контракт качества (на каждый PR)
- Gates (Node 20): `tsc 0 · eslint 0 · vitest зелёный · build ✓` (chunk-warning = pre-existing Phaser bundle, не регресс).
- PR1 — обязательны G1/G2/zero-regression (§4). PR3 — обязателен 3-strategy gate-тест (§7, форма зависит от G-A/G-B).
- Только PR1 бампит `SAVE_VERSION`. PR2/PR3 — assert `SAVE_VERSION === 9` без изменения (страж от случайного bump).
- R1 (single-source резолвер) сохраняется: бой и арсенал/preview зовут один путь.
- Каждый PR ≤ 1200 LOC по seams; preflight едет с PR1.
