# Status: Content Designer

**Текущая веха:** M1 (Технический скелет)
**Статус:** DONE_PENDING_REVIEW
**Последнее обновление:** 2026-05-18

## Что сделано

### M1 content MVP — 4 JSON файла, ветка `m1/content-mvp`

- **`content/items.json`** — 15 предметов по канону `docs/GDD.md` §7.1 / `docs/content-brief.md`:
  - 8 ресурсов: `wood`, `scrap`, `cloth`, `food`, `water`, `gunpowder`, `leather`, `rope` (все `zone_origin: forest`, `stats: {}`, `tier: 1`).
  - 1 melee-оружие: `knife` (damage 4–7, attack_speed 100, noise low).
  - 1 ranged-оружие: `makeshift_pistol` (damage 9–14, attack_speed 80, noise medium, ammo_id `ammo_pistol`, ammo_per_shot 1).
  - 2 брони: `cloth_jacket` (defense 1, vs_melee_bonus 1), `leather_vest` (defense 3, vs_melee_bonus 0).
  - 3 расходника: `bandage` (heal 15), `medkit` (heal 40), `ammo_pistol` (ammo_refill 1).
  - Каждый item получил уникальные `description_ru` и `flavor_ru` в тональности «жёсткий реализм + чёрный юмор» из `docs/content-brief.md`.
- **`content/mobs.json`** — 3 моба по канону `docs/GDD.md` §6.2 / §7.3 / `docs/balance.md` §Мобы:
  - `marauder` HP=18, dmg 5–8, def=1, speed=90, xp=10 (после QA-fix #4 — «слабый» моб, 3–4 удара ножом, flee при HP<30%).
  - `wild_dog` HP=20, dmg 8–12, def=0, speed=120, xp=8 (единственный melee-атакёр в M1; против него работает `vs_melee_bonus`).
  - `mutant` HP=60, dmg 10–15, def=3, speed=70, xp=25 (танк глубин 2–3).
  - Все `drop_table[]` ссылаются на существующие `item_id` из items.json.
- **`content/recipes.json`** — 5 рецептов по канону `docs/GDD.md` §7.2 / `docs/balance.md` §Рецепты (после явного APPROVE PM по канону GDD vs. устаревшей таблице M1-CONTENT.md):
  - `recipe_pistol`, `recipe_leather_vest`, `recipe_bandage`, `recipe_medkit`, `recipe_ammo_pistol`.
  - `tier=1`, `craft_time_s=0`, `unlock_condition=null` у всех.
  - `result_id` и все `ingredients[*].item_id` присутствуют в items.json.
- **`content/zones.json`** — 1 зона `forest` по канону `docs/GDD.md` §6.4 / §7.4:
  - `levels[]` ровно 3 объекта (depth 1/2/3) с разными `enemies`, `enemy_count`, `resources`, `resource_count`, `min_player_level`.
  - `boss_id: null`, `unlock_condition: "start"`, `unique_resources` = все 8 ресурсов (одна зона в MVP).

### Валидация перед PR
Локальный скрипт прошёл без ошибок:
- JSON parse: ok
- Счётчики: items=15, mobs=3, recipes=5, zones=1 (точные лимиты M1)
- Уникальные `id` внутри каждого файла
- Перекрёстные ссылки: `recipes[*].result_id` / `recipes[*].ingredients[*].item_id` / `items[*].recipe_id` / `mobs[*].drop_table[*].item_id` / `weapon_ranged.ammo_id` / `zones[*].resources` / `zones[*].mobs` / `zones[*].levels[*].enemies` / `zones[*].levels[*].resources` — все валидны
- Сверка чисел с `docs/balance.md`: мобы / оружие / броня / расходники / ресурсы — без расхождений
- Уникальность `description_ru` и `flavor_ru` у всех 15 предметов

## Что НЕ сделано
- `content/radio.json` — НЕ трогаю (радио = M4, в M1 файл остаётся пустым `[]` по anti-scope).
- Engineer-код (`src/`), ассеты (`assets/`), `public/` — не зона Content Designer'a.
- Документация (`docs/*`), брифинги/роли/промпты/чужие статусы (`staff/handoff/*`, `staff/roles/*`, `staff/prompts/*`, `staff/status/*` кроме `CONTENT.md`) — не трогаю по FORBIDDEN из `staff/handoff/M1-CONTENT.md`.

## Замечания / решения
- **Рецепты:** в `staff/handoff/M1-CONTENT.md` всё ещё указаны устаревшие `recipe_club` / `recipe_shiv` / «Медикаменты», которые не входят в канонические 15 предметов / 8 ресурсов. PM явно подтвердил (kickoff M1 Content): брать канон из `docs/GDD.md` §7.2 / `docs/balance.md`. Сделано по канону.
- **`recipe_pistol` vs `recipe_makeshift_pistol`:** GDD §6.3 описывает формат `recipe_<result_id>`, но канон §7.2 фиксирует именно `recipe_pistol`. §7.2 — «единая истина». Следую §7.2.
- **`Mob.damage_min`/`damage_max`:** `docs/content-brief.md` описывает `Mob.damage` одним числом; канон `docs/GDD.md` §6.2 расширяет до пары min/max ради формулы боя §2. Использовал min/max.

## Блокеры
- Нет.

## PR
- `m1/content-mvp` → `main`: ссылка добавится после `git push`/`git_create_pr`.
