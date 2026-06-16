# M14 PR-1 — Craft-UI polish (family-switch + stat-preview) — PREFLIGHT

> **Base:** main `24d3814` (merge PR-193, M14 handoff в репо). `SAVE_VERSION=8`, ~343 теста.
> **Автор:** Viktor (dev-роль). QA + merge --no-ff — Alex.
> **Шаблон:** `staff/implementation/M13-PR6b-2-CRAFT-UI-PREFLIGHT.md` (тот же UI-слой `WeaponAssemblyScene`).
> **Скоуп решён в Slack:** F1 (фильтры по family) + F3 (preview статов через `assembleWeapon`-call), без F2.

---

## §0. Scope

**В scope:**
- **F1 — переключение семейства inline.** Ряд family-табов в `renderPartSelector`, чтобы менять активное семейство без round-trip «Назад → picker».
- **F3 — preview статов до сборки.** `damage_min–damage_max` + `durability_max` под выбором партов, считается через санкционированный `assembleWeapon`-call на кандидате (не персистится, стеш/энергию не трогает). Интерпретация инварианта подтверждена Алексом: hypothetical `WeaponInstance` через тот же путь что и реальная сборка → инвариант «stats только после `assembleWeapon`» не нарушается.

**OUT (anti-scope, НЕ трогать):**
- **F2 (локализация reason-кодов)** — уже на main (#191, `locale.ts` → `assembly_invalid_*`, читается через `t()`). Снято со скоупа.
- **Slot-таксономия** — roadmap PR4, отдельная вертикаль.
- **Балансовые правки** damage/durability — roadmap PR2.
- **Disassembly UI / новые парты-моды** — вне M14-PR1.
- **`SAVE_VERSION` / миграция** — preview и family-switch НЕ персистят ничего. **НЕТ bump, НЕТ миграции.**
- **`items.json` / `docs/redesign/`** — не трогаем (idempotency intact).
- **energy-gate / генератор** — логика `attemptAssembly`/`ASSEMBLE_ENERGY_COST` не меняется. Preview — независимый read-путь, gate остаётся только на действии «Собрать».

---

## §1. Verified codebase facts (vs `24d3814`)

1. **Family-gate УЖЕ существует.** `WeaponAssemblyScene.create()` (L54-58): `selectedFamily === null` → `renderFamilyPicker` (L81, грид семейств у которых есть парты), иначе → `renderPartSelector` (L140, парты семейства + универсальные `mod_*`). «Фильтр по family» как буквальная фича частично уже есть; реальный gap — чтобы сменить семейство, нужно «Назад» (L60-65) → весь picker заново. F1 закрывает именно этот round-trip (→ D1).
2. **Каждый toggle карточки уже делает `scene.restart({family, pickedIds})`** (L273-276) → сцена ре-рендерится целиком на любое изменение выбора. Значит preview НЕ требует нового реактивного state — он пересчитывается «бесплатно» на каждом ре-рендере внутри `renderPartSelector` (→ архитектурный fit F3).
3. **`assembleWeapon` THROWS `AssemblyError`** первой строкой (weaponAssembly.ts L70-71) на invalid parts. Preview через `assembleWeapon` ОБЯЗАН ловить throw. Достижимые из UI invalid-состояния: `empty_parts` (ничего не выбрано) и `no_structural_part` (выбраны только `mod_*` / не-структурные). `duplicate_part` из UI **недостижим** — выбор это `Set<id>` (L40), каждый id максимум раз (→ D3).
4. **`assembleWeapon` чистый и НЕ потребляет стеш** — consume живёт в `assembleFromStash` (assemblyFlow.ts). Вызов `assembleWeapon(picked, sentinelId)` трогает ноль persist-state. Это ровно подтверждает GO-интерпретацию F3: preview = read через единственный санкционированный аккумулятор, без дублирующей preview-суммы и без кеша поверх `ComponentItem`.
5. **Сцена использует inline-русские строки для статических лейблов** («Сборка оружия», «Выберите семейство», «Собрать»). `t()` зарезервирован под динамический reason-code/registry. → лейблы preview («Урон» / «Прочность») — inline-RU, **`locale.ts` не трогаем** (→ D5).
6. **`selectedPartIds` плюмбится через `init`/`restart`** (PR #191 P1 fix, L26-28, L45). `tryAssemble` уже считает `picked = visibleParts.filter(...)` (L303). Preview переиспользует тот же `picked`-набор.
7. **Family-switch несёт риск химеры.** Текущий «Назад → picker» делает `scene.start("WeaponAssemblyScene")` БЕЗ `pickedIds` (L62) → выбор очищается. Если inline-таб сменит семейство, сохранив `pickedIds`, игрок соберёт `pm_frame` + `akm_barrel` (межсемейная химера), которую family-gate как раз и блокирует. → family-switch ОБЯЗАН сбросить не-универсальный выбор (→ D2, guard G4).

---

## §2. Решения — НУЖЕН твой ✓ (мои каллы по нерешённым к коду деталям)

**D1 — F1 = inline family-табы в `renderPartSelector`.**
Ряд табов сверху селектора (текущее семейство акцентом), тап → переключение без «Назад → picker». `renderFamilyPicker` остаётся как entry при `selectedFamily===null`.
*Альтернатива:* оставить только picker + добавить таб «Все парты» (показ всех семейств в одном гриде) — но это ломает family-gate (химера) и противоречит §1.7. Отвергнута.
*Default: ✅ inline-табы. Если ты под «фильтром» имел в виду другое (напр. фильтр по slot/tier) — скажи, пересоберу.*

**D2 — Смена семейства через таб СБРАСЫВАЕТ выбор.**
Тап по family-табу → `scene.restart({family: newFam})` без `pickedIds` (выбор очищается). Сохранять универсальные `mod_*` через семейства — заманчиво, но усложняет инвариант и edge-кейсы; M14-PR1 держим простым.
*Default: ✅ сброс выбора при смене семейства (закрывает риск химеры §1.7). Альт — «сохранять только `mod_*`» — скажи если хочешь.*

**D3 — Preview через `assembleWeapon` + try/catch.**
`previewAssembly(parts)` (pure, в assemblyFlow.ts) зовёт `assembleWeapon(parts, PREVIEW_ID)`; на `AssemblyError` → `{ ok:false, reason }`, на успех → `{ ok:true, stats, durability_max }`. UI: `ok` → «Урон: {min}–{max}  •  Прочность: {dur}»; `empty_parts` → пусто/«выберите детали»; `no_structural_part` → «нужна основа (рамка/ствольная коробка)».
*Default: ✅ pure-хелпер + try/catch, тонкий рендер поверх.*

**D4 — Preview независим от energy-gate.**
Preview показывает статы даже при `energy < cost` (игрок видит «что получит», прежде чем копить энергию). Gate остаётся только на кнопке «Собрать» (без изменений).
*Default: ✅ preview не гейтится энергией.*

**D5 — Лейблы preview inline-RU, `locale.ts` не трогаем.**
Соответствует существующему стилю сцены (§1.5). `t()` — только reason-коды.
*Default: ✅ inline-RU.*

**D6 — Pure-хелперы для тестируемости (инвариант «systems pure / scenes Phaser»).**
- `previewAssembly(parts)` → assemblyFlow.ts (unit-тест без Phaser).
- `availableFamilies(parts: ComponentItem[]): string[]` → assemblyValidation.ts (sorted, unique, без `universal`); `renderFamilyPicker`/family-табы читают его вместо inline-группировки (L82-94). Делает family-список unit-тестируемым.
*Default: ✅ оба хелпера pure + покрыты юнитами; сцена — тонкий рендер.*

**D7 — `previewAssembly` не мутирует ничего.**
Использует sentinel id `"__preview__"`, результат выбрасывается. Не зовёт `assembleFromStash`/`removeFromStack`/`saveToCloud`. Гарантия конструкцией, не дисциплиной.
*Default: ✅.*

---

## §3. File-by-file diff plan

- **`src/systems/assemblyValidation.ts`** — `+ availableFamilies(parts): string[]` (pure; `weaponFamily` per парт, drop `universal`, unique+sort). Существующие экспорты без правок.
- **`src/systems/assemblyFlow.ts`** — `+ previewAssembly(parts): { ok:true; stats:{damage_min;damage_max}; durability_max } | { ok:false; reason: AssemblyInvalidReason }` (зовёт `assembleWeapon(parts,"__preview__")`, ловит `AssemblyError`). `assembleFromStash`/`attemptAssembly` без изменений.
- **`src/scenes/WeaponAssemblyScene.ts`** —
  - `renderPartSelector`: + ряд family-табов сверху (через `availableFamilies(componentStash)`), тап → `scene.restart({family})` (D2, сброс выбора);
  - + preview-панель (через `previewAssembly(picked)`) над кнопкой «Собрать» (~y между универсальным гридом и кнопкой);
  - `renderFamilyPicker`: перевести inline-группировку на `availableFamilies` (косметика, поведение 1:1).
  - `tryAssemble`/энергия-gate — без изменений.
- **`src/systems/__tests__/previewAssembly.test.ts`** (new) — см. §4.
- **`src/systems/__tests__/assemblyValidation.test.ts`** — + кейсы `availableFamilies` (fold-in в существующий файл).

*Не меняются:* `weaponAssembly.ts`, `locale.ts`, `cloudSave.ts`, `items.json`, save-схема, `CraftScene.ts` (entry уже репойнтит на `WeaponAssemblyScene`, L183-184).

---

## §4. Test plan (без Phaser)

`previewAssembly`:
1. `[]` → `{ok:false, "empty_parts"}`.
2. только `mod_*` → `{ok:false, "no_structural_part"}`.
3. `[pm_frame, pm_slide]` → `ok`, `stats` = поэлементная сумма, `durability_max` = сумма вкладов.
4. `[akm_receiver, akm_barrel]` → `ok` (структурный через receiver).
5. Additive-инвариант: `stats.damage_min === Σ parts.damage_min` (после floor ≥0), `damage_max ≥ damage_min` (клапм из weaponAssembly L88-90).
6. Чистота: входной массив не мутирован; повторный вызов даёт тот же результат (нет персиста/стеш-эффектов).

`availableFamilies`:
7. mix семейств + `mod_*` → `universal` исключён, sorted, unique.
8. только `mod_*` → `[]`.
9. дубли парт-id одного семейства → семейство один раз.

*Регресс:* существующие `weaponAssembly.test.ts` / `assemblyValidation.test.ts` / `attemptAssembly.smoke.test.ts` проходят БЕЗ правок (поведение этих путей не менялось).

*Phaser-слой (family-табы + preview-рендер)* — code-review по существующему `scene.restart`-паттерну (как (c) в attemptAssembly.smoke). Pure-хелперы несут логику.

---

## §5. Guards / инварианты для QA (1:1)

- **G1.** `assembleWeapon` поведение не изменено — всё ещё throws `AssemblyError`; его тесты зелёные без правок.
- **G2.** `previewAssembly` НЕ мутирует стеш/state/энергию и НЕ персистит (sentinel id, результат выброшен). Нет дублирующей preview-суммы — статы только через `assembleWeapon` (инвариант «один санкционированный путь»).
- **G3.** Preview корректно деградирует на invalid-выборе (empty / no_structural) — на экране подсказка, не сырой reason и не краш.
- **G4.** Family-switch табом сбрасывает не-универсальный выбор → межсемейную химеру (`pm_frame`+`akm_barrel`) собрать по-прежнему нельзя; family-gate цел.
- **G5.** `validateAssemblyParts` остаётся ровно 3 reason-кода (не добавлен 4-й).
- **G6.** Scope чистый: НЕТ `SAVE_VERSION` bump, `items.json`/`locale.ts`/`docs/redesign` не тронуты, energy-gate без изменений.
- **Билд-гейты:** `tsc --noEmit` 0 · `eslint src/` 0 · `vitest` всё зелёное (+ ~9 новых) · `npm run build` ✓.
