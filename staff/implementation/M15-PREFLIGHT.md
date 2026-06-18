# M15 — Weapon Lifecycle · PREFLIGHT (общий на веху)

> Источник истины: `docs/ROADMAP.md` карточка **M15 (🔜 next)**.
> Статус: PREFLIGHT — ждём GO Алекса. **Код не пишется до GO.**

## 1. Веха в одном абзаце
Замкнуть жизненный цикл крафтового оружия: собрал → износил → **починил** (а
не выбросил) → когда чинить больше невыгодно → **разобрал с реальной ценой** →
а при экипировке видишь **дельту статов** и решаешь осознанно. Сейчас цикл
обрывается на поломке: `durability_current ≤ 0` → инстанс молча unequip-ается в
`craft_knife` и навсегда лежит мёртвым грузом в `crafted_weapons[]` (документ.
долг **C6**, `durability.ts:63`). Разбор бесплатный 1:1 (нет фрикции), а equip-
swap слепой (статы не сравнить).

## 2. DoD вехи (из ROADMAP)
- Сломанное оружие можно **починить** (Арсенал/верстак).
- Разбор имеет **стоимость / частичный возврат** (не бесплатный undo).
- В Арсенале видна **дельта статов** при equip-swap.
- `vitest` зелёный (baseline **429** → +новые), `tsc`/`eslint`/`build` чисто.

## 3. Схема / SAVE
**NO SAVE bump.** Все три PR мутируют только существующие поля
(`durability_current`, `durability_max`, `crafted_weapons[]`, `baseStash`,
`baseResources.metal`) — ни одного нового поля в персисте. Подтверждено grep'ом:
M15 не трогает `SAVE_VERSION` (=8). Это важно для миграционной дисциплины: M15
безопасно идёт перед M16 (который бьёт v8→v9).

## 4. Декомпозиция по швам (locked PR-size discipline)
Три независимо тестируемые вертикали ⇒ **3 PR под этим общим preflight**:

| PR | Шов | Слой | Headline |
|----|-----|------|----------|
| **M15-PR1** | REPAIR | `systems/repair.ts` (new) + balance + scene | Закрывает C6 — главный |
| **M15-PR2** | Disasm-economy | `systems/craftedWeapons.ts` + balance + scene | Фрикция разбора |
| **M15-PR3** | Arsenal stat-delta | `systems/craftedWeapons.ts` (pure helper) + scene | Сравнение при equip |

**Sequencing (обязательно):** все три PR правят `CraftedWeaponsScene.ts` →
параллелить нельзя (конфликт по одному файлу). Идём **PR1 → PR2 → PR3**, каждый
следующий ребейзится на merge предыдущего. Порядок PR1-first неоспорим (C6 =
реальный dead-end-баг). PR2/PR3 — полировка, порядок между ними гибкий, дефолт
econ→compare.

## 5. Общие инварианты / гарды (на все 3 PR)
- **systems pure / scenes Phaser:** вся логика (repair-gate, refund-rate, stat-
  delta) — чистые функции в `src/systems/*`, покрыты unit; сцена только рендерит
  и применяет ровно нужные поля state. Зеркало `attemptAssembly` / `disassembleInstance`.
- **Immutable:** хелперы возвращают новые объекты/массивы, вход не мутируется
  (стиль `assembleWeapon`/`disassembleInstance`).
- **Energy/resource gate = atomic:** «ресурс списан ⟺ действие произошло»
  (инвариант `attemptAssembly`). Discriminated union `ok | no_resource | invalid`.
- **Persist:** `void saveToCloud()` после применения, как в `equip`/`disassemble`.
- **Каталог durability-exempt:** repair применим ТОЛЬКО к crafted `WeaponInstance`
  (та же асимметрия, что durability — `durability.ts` шапка). На `equipped_weapon`
  kind=catalog кнопки repair нет.
- **Тесты:** `src/systems/__tests__/*.test.ts` юнит; сцена — smoke. Бить по
  знаку/инвариантам где возможно, не по конкретным балансовым числам.

---

## 6. M15-PR1 — REPAIR (закрывает C6)

### 6.1 Что делаем
Сломанный (и, по решению D2, изношенный) crafted-инстанс можно починить за
ресурс: `durability_current → durability_max`. После починки `isBroken` →
false ⇒ `canEquipInstance` снова true ⇒ инстанс возвращается в строй.

### 6.2 Файлы
- **NEW `src/systems/repair.ts`** — чистый хелпер (зеркало `assemblyFlow.ts`):
  ```ts
  export const repairCost = (inst: WeaponInstance): number;
  export type RepairAttemptResult =
    | { kind: "ok"; instance: WeaponInstance; metal_spent: number }
    | { kind: "no_resource"; required: number; available: number }
    | { kind: "not_broken" }      // целое чинить нечего (см. D2)
    | { kind: "not_found" };      // defensive (рассинхрон UI/state)
  export const attemptRepair = (
    inst: WeaponInstance | undefined,
    metal_available: number,
  ): RepairAttemptResult;
  ```
- **`src/state/balance.ts`** — `METAL_PER_DURABILITY_POINT = 1` (+ комментарий
  «тюнится свободно после playtest, тест бьёт по знаку/пропорции»).
- **`src/scenes/CraftedWeaponsScene.ts`** — на сломанной карточке заменить мёртвый
  текст «Нельзя (сломано)» (стр. ~187) на кнопку **«Починить (N металла)»**;
  при нехватке металла — disabled-вид + подсказка стоимости. Apply-метод
  `repairInstance(id)`: `attemptRepair` → при `ok` записать обновлённый инстанс в
  `crafted_weapons[]` (immutable replace по индексу, как `applyPerEncounterDurabilityHit`),
  списать `baseResources.metal -= metal_spent`, `saveToCloud()`, тост
  «Починено: N/N · −M металла».
- **Tests:** NEW `src/systems/__tests__/repair.test.ts` (cost-формула,
  ok/no_resource/not_broken/not_found, immutability) + smoke в `craftedWeapons`-сцене
  если есть scene-harness (проверить паттерн соседних smoke-тестов).

### 6.3 Решения
- **D1 — Cost-модель: пропорционально починке, ресурс = металл.**
  `repairCost = ceil((durability_max − durability_current) × METAL_PER_DURABILITY_POINT)`.
  Полностью сломанное (0/10) = 10 металла; лёгкий износ (8/10) = 2. *Почему металл,
  а не энергия:* сборка уже гейтится энергией (`ASSEMBLE_ENERGY_COST`); вешать на
  энергию ещё и repair — передавить один ресурс. У металла сейчас мало стоков —
  repair даёт ему экономический смысл. Тематически металл = лом на латание.
  ⚠ **DF1 — на подтверждение Алекса (design/balance fork).**
- **D2 — Когда доступен repair: при `durability_current < durability_max`** (не
  только при поломке). Сломанное — главный кейс, но top-up изношенного дешевле
  кодом (одна ветка) и логичнее для игрока. `not_broken` = «уже full». Альтернатива
  (только broken) — уже PR1; флагую как мелкий design-выбор.
- **D3 — Lifecycle decay (опционально):** каждый repair снижает `durability_max`
  на `REPAIR_MAX_DECAY` (напр. 1). Тогда оружие чинится конечное число раз, и в
  какой-то момент разобрать выгоднее, чем чинить — это и есть «жизненный цикл»,
  смыкающий PR1↔PR2 в реальную петлю. Schema-neutral (`durability_max` уже в
  персисте). ⚠ **DF1b — design call Алекса.** *Рекомендация:* включить лёгкий
  decay=1 (делает веху осмысленной петлёй). *Дефолт если Алекс молчит:* decay=0
  (чистый restore) — проще, decay добавим отдельным микро-твиком позже.

### 6.4 QA guards (PR1)
- `attemptRepair` НЕ трогает металл на любой ветке кроме `ok` (atomic invariant).
- Catalog/null equip — repair недоступен (кнопки нет); тест: helper не вызывается
  на не-crafted.
- После repair `isBroken=false` и `canEquipInstance=true` (round-trip через durability).
- `metal_spent === repairCost(inst_before)`; `baseResources.metal` не уходит в минус
  (gate `no_resource`).
- `tsc`/`eslint`/`vitest`/`build` чисто; baseline 429 не падает.

---

## 7. M15-PR2 — Disassembly economy (фрикция)

### 7.1 Проблема
`disassembleInstance` сейчас возвращает ВСЕ `parts` 1:1 бесплатно — разбор это
бесплатный undo сборки, нет экономического выбора.

### 7.2 Что делаем
Ввести потерю при разборе. Файлы: `systems/craftedWeapons.ts`
(`disassembleInstance` + новый чистый `disassembleRefund(parts) → string[]`),
`balance.ts` (`DISASSEMBLE_REFUND_RATE`), сцена (копия «Части вернутся…» → точное
«Вернётся K из N» + список). Тесты — расширить `craftedWeapons.test.ts`.

### 7.3 Решения
- **DF2 — модель фрикции (на Алекса).** Рекомендация: **refund-rate по числу
  частей**, `K = floor(N × RATE)` (RATE=0.5 дефолт), отбрасываем **mod-части
  первыми** (структурные ценнее, их и возвращаем) — детерминированно, без rng,
  тестируемо. Альтернатива: фикс-cost металла/энергии за разбор (но это дубль
  гейта repair). Refund-rate чище показывает «разбор ≠ полный возврат».
- Schema-neutral. `returned_parts` остаётся, меняется только его наполнение.

### 7.4 QA guards
- `K ≤ N`, `K ≥ 0`; пустой `parts` → `[]`. Детерминизм (нет rng). Сломанный
  разбирается штатно (D3 из M14-PR3 сохраняется). Округление по floor зафиксировано тестом.

---

## 8. M15-PR3 — Arsenal stat-delta (сравнение при equip)

### 8.1 Что делаем
При осмотре инстанса в Арсенале показать дельту его статов против текущего
экипированного. Чистый хелпер `statDelta(candidate, equipped)` в
`systems/craftedWeapons.ts` (unit), рендер в detail-панели сцены (+/− цветом).

### 8.2 Решение
- **D-PR3 — показываем ТОЛЬКО `damage_min/max`.** Code-grounded: в бой (`sortieResolve.ts:197`)
  уходит исключительно `weapon_damage_avg` — ни accuracy, ни weight не влияют ни на
  что до M16. Показывать дельту по нерабочим статам = вводить игрока в заблуждение
  («+5 точности», которые ничего не делают). Когда M16 включит accuracy/weight в
  расчёт — расширим дельту тем же PR. *Не нужно решение Алекса — это следствие кода.*
- Источник «equipped»: если экипирован catalog или null — сравнивать не с чем,
  показываем абсолютные статы кандидата без дельты (guard).

### 8.3 QA guards
- `statDelta` чистый, симметричный знак (cand−equipped). Catalog/null equipped →
  no-delta ветка. Smoke сцены: панель не падает при любом equip-state.

---

## 9. Открытые вопросы Алексу (только design/business, инженерия сведена)
- **DF1 (PR1):** ресурс починки = металл, пропорционально? *(рек. да)*
- **DF1b (PR1):** lifecycle-decay `durability_max` при починке? *(рек. лёгкий decay=1; дефолт 0)*
- **DF2 (PR2):** модель фрикции разбора = refund-rate 0.5, mod-first drop? *(рек. да)*
- DF3 (PR3) — решён кодом (только damage-дельта), подтверждения не требует.

> На GO достаточно: «PR1 go» + ответы по DF1/DF1b (DF2 можно дать к PR2).
> Дальше открываю ветку `victor/m15-pr1-repair` от main HEAD.
