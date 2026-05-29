# ADR-001 — Three-Class Item Model

> Status: Accepted · Date: 2026-05-28 · Authors: Zo (GD), Alex (PM)
> Replaces: M1 flat 5-weapon-types модель

## Контекст

К M11 у нас было 80 предметов в `items.json` с одним `type` полем ("weapon_melee" / "weapon_ranged" / "armor" / "consumable" / "resource"). 22 нужных «реальных» ствола (ПМ/ТТ/АКМ/...) не помещались в эту плоскую модель: они требовали калибр, ёмкость магазина, прочность, парты, моды, пары "реальное / generic" имя.

Попытка добавить ещё 200+ предметов в плоской модели создавала бы сильную мешанину: парты, моды, рецепты, расходники — всё в одном пространстве ID без типизации намерения.

## Решение

Введён **гибридный формат** в `src/types/items.ts`:

- **Legacy fields** (сохранены для backward compat): `id, name_ru, type, tier, weight_kg, description_ru, stats`
- **M11 fields** (новые, опциональные): `item_class, caliber, magazineSize, durability, parts, mods, fits_weapons, name_real_ru, name_generic_ru, recipe_type, is_mod`

`item_class` принимает 5 значений:
- `craft` — самоделы (Заточка, Поджига), всегда работают, низкий тир
- `drop` — реальные стволы (ПМ, АКМ), нужны парты+ammo, средний-высокий тир
- `modification` — моды (ПБС-1, ПСО-1), модифицируют drop оружие
- `part` — части drop-оружия (pm_frame, ak74_barrel), нужны для сборки
- `broken_craft` — сломанный craft, разбирается на верстаке (30% возврат)

Доступ — через **`ItemRegistry`** (`src/state/ItemRegistry.ts`), который:
- Принимает legacy ИЛИ M11 item на входе
- Адаптирует legacy → M11 shape для всех потребителей
- Сохраняет старые сейвы и старый код (combat, loot, craft) работающим

## Альтернативы

| Опция | Почему отвергли |
|---|---|
| **Чистый M11 переезд** (rewrite всех 80 items) | Сломал бы пользовательские сейвы из M1-M10; нужна была бы тяжёлая мажорная миграция |
| **Отдельный «items_m11.json»** (две системы рядом) | Дублирование, сложно поддерживать cross-references из mob.drops, recipes |
| **Сохранить плоскую модель, parts как обычные resources** | Парты теряют смысл без `fits_weapons` поля; сборка превращается в обычный рецепт без типизации |

## Последствия

### Положительные
- 187 предметов умещаются в одной системе с чёткой типизацией намерения
- Save migration v1→v2 покрыта `migrateSave()` в `cloudSave.ts` с 4 unit-тестами
- Новые разработчики/Devin понимают модель из одного файла (`src/types/items.ts`)
- M12 (Combat Overhaul) может опираться на стабильный фасад без оглядки на legacy

### Отрицательные / Технический долг
- **6 pre-existing lint errors** в `src/systems/encounters.ts` (non-null-assertion) остаются — добавлены до M11 и не блокируют. Фикс в отдельной QoL вехе.
- **`flare_pistol`, `sledgehammer`, `circuitry`** в migration map указаны под другими ID (typos) — пометки для следующего content drop.
- 35 рецептов из M1-M9 без поля `recipe_type` — UI фильтр в M11.0c использует fallback "craft". Следующий content drop должен проставить явно.
- Legacy `mob.drop_table` рядом с новым `mob.drops` — bridge в `loot.ts` нормально работает, но один из двух форматов нужно будет deprecate когда все 11 мобов будут на новом.

## Связано

- Спека: [`docs/redesign/m11/M11.0-weapons.md`](../redesign/m11/M11.0-weapons.md)
- Резолвед вопросы: [`docs/redesign/m11/M11.0-questions-resolved.md`](../redesign/m11/M11.0-questions-resolved.md)
- Engineer handoff: [`staff/handoff/M11.0a-ENG.md`](../../staff/handoff/M11.0a-ENG.md)
- QA verdict: PR #94 (APPROVE), PR #98 (Round 1), PR #102 (Round 2)
- Wire-up: PR #97 (M11.0b)
- Content: PR #95 (107 items, 29 recipes)
- Drops: PR #99 (M11.0e)
- UI: PR #100 (M11.0c filter tabs)
