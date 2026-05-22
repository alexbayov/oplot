# Status: Content Designer

**Текущая веха:** M5 (Боссы и инстансы)
**Статус:** IN_PROGRESS
**Последнее обновление:** 2026-05-22

## Что сделано

### M5 content — 4 JSON файла, ветка `m5/content` → PR в `m5-integration`

> Источник правды: `docs/balance.md` §M5 (boss stats, boss-drop, T3 items, T3 recipes, gas zones, daily cool-down, warehouse depth 3).
> JSON-схемы: `docs/GDD.md` §6.2 (Mob + boss fields), §6.1 (Item), §6.3 (Recipe), §6.4 (Zone + M5 gas/daily/boss extensions), §9 (boss spec).
> Уникальность: `docs/content-brief.md` (минимум 2 из 4 критериев у каждого нового item/mob).

- **`content/mobs.json`** — 8 → **11 мобов** (+3 M5 boss по `balance.md` §M5.1 / GDD §9.2):
  - `forest_alpha_mutant` (mutant, boss, forest L5, HP=300, dmg 20–30, def=6, speed=85, xp=150, `behavior_id: berserker_low_hp`, `phase_2_behavior_id: pack_bonus_when_paired`, `phase_threshold: 0.5`, `boss_drop_id: mutated_gland`).
  - `warehouse_drone_prime` (mech, boss, warehouse L5, HP=350, dmg 25–35, def=8, speed=80, xp=200, `behavior_id: armor_piercing_ranged`, `phase_2_behavior_id: defensive_cover`, `phase_threshold: 0.5`, `boss_drop_id: prime_circuit`).
  - `city_guard_captain` (human, boss, city L6, HP=400, dmg 22–32, def=10, speed=90, xp=250, `behavior_id: defensive_cover`, `phase_2_behavior_id: ranged_keep_distance`, `phase_threshold: 0.5`, `boss_drop_id: captain_insignia`).
  - Все 3 boss loot_table: guaranteed boss_drop (chance=1.0, qty=1) + regular loot (chance 0.3–0.5).
  - M1+M3 mobs **НЕ изменены** (8 regular, role не задан = regular).

- **`content/items.json`** — 29 → **35 items** (+3 boss-drop resources + 3 T3 items по `balance.md` §M5.2 + §M5.4):
  - 3 boss-drop resources T2: `mutated_gland` (forest, weight 1), `prime_circuit` (warehouse, weight 1), `captain_insignia` (city, weight 1).
  - 1 T3 melee: `composite_blade` (damage 24–32, attack_speed 85, noise low, weight 3).
  - 1 T3 ranged: `prime_shotgun` (damage 27–37, attack_speed 65, noise high, weight 4, `ammo_id: ammo_rifle`, `ammo_per_shot: 1`).
  - 1 T3 armor: `captain_armor` (defense 12, vs_melee_bonus 0, weight 5).
  - У каждого нового item — уникальные `description_ru` + `flavor_ru`.
  - M1+M3 items **НЕ изменены**.

- **`content/recipes.json`** — 15 → **18 рецептов** (+3 T3 recipes по `balance.md` §M5.3):
  - `recipe_composite_blade`: `crowbar`×1 + `mutated_gland`×2 + `scrap`×5 → `composite_blade`×1, tier=3.
  - `recipe_prime_shotgun`: `pipe_rifle`×1 + `prime_circuit`×2 + `scrap`×6 → `prime_shotgun`×1, tier=3.
  - `recipe_captain_armor`: `tactical_vest`×1 + `captain_insignia`×2 + `leather`×4 → `captain_armor`×1, tier=3.
  - Все tier=3, `craft_time_s=0`, `unlock_condition=null`.
  - Каждый T3 рецепт: T2 base item (потребляется) + boss-drop ×2 + общие ресурсы.
  - M1+M3 recipes **НЕ изменены**.

- **`content/zones.json`** — 3 zone modified (M5 fields added):
  - `forest`: `boss_id: "forest_alpha_mutant"`, `daily_reset_hours: 24`. No gas.
  - `warehouse`: `boss_id: "warehouse_drone_prime"`, `daily_reset_hours: 24`, `is_gas: true`, `gas_damage_per_turn: 5`; depth 2 `is_gas: true`; **new depth 3** (enemy_count [2,3], resource_count [3,5], min_player_level 5, is_gas=true).
  - `city`: `boss_id: "city_guard_captain"`, `daily_reset_hours: 24`, `is_gas: true`, `gas_damage_per_turn: 8`; depth 2+3 `is_gas: true`.
  - Существующие M1+M3 zone fields (id, name, unlock_condition, return_time_multiplier, resources, mobs, unique_resources, levels enemies/resources/enemy_count/resource_count/min_player_level) **НЕ изменены**.

### Cross-ref валидация

- ✓ Каждый `mobs[].boss_drop_id` exists в `items[].id`.
- ✓ Каждый `recipes[].ingredients[].item_id` exists в `items[].id`.
- ✓ Каждый `recipes[].output_item_id` (result_id) exists в `items[].id`.
- ✓ Каждый `zones[].boss_id` exists в `mobs[].id` И тот mob имеет `role: "boss"`.
- ✓ Каждый `zones[].levels[].enemies[]` exists в `mobs[].id`.
- ✓ Boss stats (HP, damage_min/max, defense, base_speed, xp_reward) совпадают с `balance.md` §M5.1 — без расхождений.
- ✓ Счётчики: mobs=11, items=35, recipes=18 — точно по DoD M5.

### M3 content expansion — DONE

> Источник правды: `docs/balance.md` §M3 (PM-decision 2026-05-21 — ровно 14 новых items, итого 29; PR #21 merged, QA Spec APPROVE PR #22; PR #24 DoD-align).
> JSON-схемы: `docs/GDD.md` §6.1 (Item), §6.2 (Mob), §6.3 (Recipe), §6.4.M3 (Zone), §10.M3.1 (RadioSignal).
> Уникальность: `docs/content-brief.md` (минимум 2 из 4 критериев у каждого нового item/mob).

- **`content/mobs.json`** — 3 → **8 мобов** (+5 новых M3 по `balance.md` §M3 / GDD §5.4):
  - `looter_sniper` (human, warehouse L2, HP=22, dmg 9–13, def=1, speed=95, xp=14, `behavior_id: ranged_keep_distance`).
  - `armored_guard` (human, warehouse L2, HP=35, dmg 7–10, def=4, speed=75, xp=18, `behavior_id: defensive_cover`).
  - `fanatic_berserker` (human, city L3, HP=40, dmg 8–12, def=2, speed=100, xp=22, `behavior_id: berserker_low_hp`).
  - `pack_rat` (mutant, city L3, HP=15, dmg 6–9, def=0, speed=110, xp=9, `behavior_id: pack_bonus_when_paired`).
  - `relic_drone` (mech, warehouse+city bridge L3, HP=28, dmg 8–11, def=5, speed=90, xp=20, `behavior_id: armor_piercing_ranged`).
  - Все drop_table ссылаются на существующие/новые items.

- **`content/items.json`** — 15 → **29 items** (+14 новых M3 по `balance.md` §M3):
  - 4 zone-exclusive ресурса T1: `electronics` / `oil` (warehouse, weight 1), `medical_supplies` / `circuitry` (city, weight 0.5).
  - 2 T2-оружия: `pipe_rifle` (weapon_ranged, dmg 14–20, attack_speed 70, noise high, `ammo_id: ammo_rifle`), `crowbar` (weapon_melee, dmg 7–11, attack_speed 90, noise low).
  - 3 T2-брони: `tactical_vest` (def 4, vs_melee_bonus 0, 3 kg), `helmet` (def 2, 1 kg), `gas_mask` (def 1, 0.5 kg — lore stub для M5 газовых зон).
  - 5 T2-расходников: `large_medkit` (heal 80), `energy_drink` (initiative_boost 20), `emp_grenade` (mech_disable 1), `smoke_bomb` (cover_boost 50), `ammo_rifle` (ammo_refill для `pipe_rifle`).
  - У каждого нового item — уникальные `description_ru` + `flavor_ru` в тональности «жёсткий реализм + чёрный юмор» (`docs/content-brief.md`).

- **`content/recipes.json`** — 5 → **15 рецептов** (+10 новых M3 по `balance.md` §M3):
  - `recipe_pipe_rifle`, `recipe_crowbar`, `recipe_tactical_vest`, `recipe_helmet`, `recipe_large_medkit`, `recipe_energy_drink`, `recipe_gas_mask`, `recipe_emp_grenade`, `recipe_smoke_bomb`, `recipe_ammo_rifle`.
  - Все T2, `craft_time_s=0`, `unlock_condition=null`.
  - 8 из 10 рецептов используют минимум 1 zone-exclusive ресурс (правило «крафт мотивирует исследовать зоны»). Исключения — `recipe_helmet` и `recipe_ammo_rifle` (намеренно low-bar T2-крафты на старте M3 без необходимости открывать новые зоны).

- **`content/zones.json`** — 1 → **3 зоны** (+2 новых M3 по `balance.md` §M3 / GDD §6.4.M3):
  - `warehouse` (level 2, `return_time_multiplier: 1.2`, `unlock_condition: "forest_depth_2_completed"`, `unique_resources: [electronics, oil]`, 2 глубины).
  - `city` (level 3, `return_time_multiplier: 1.5`, `unlock_condition: "any_warehouse_sortie_completed"`, `unique_resources: [medical_supplies, circuitry]`, 3 глубины).
  - **`forest` НЕ тронут** — `return_time_multiplier` НЕ задан → fallback на default 1.0 (backward-compat с M1/M2 vitest на `computeReturnTime` без 3-го аргумента).

- **`content/radio.json`** — `[]` → **3 dummy сигнала** по GDD §10.M3.1 (UI-stub):
  - `radio_001_caravan` (from caravan, expires_after_sorties=4).
  - `radio_002_sos` (from unknown, expires_after_sorties=3).
  - `radio_003_weather_chat` (from survivor_group_a, expires_after_sorties=5).
  - У всех ровно 2 опции (`respond` / `ignore`), `dismissed: false`.
  - **Anti-scope §10.M3 строго:** НЕТ полей `reward`, `trap_mob_id`, `trust_impact`, `type`, `zone` (всё это в M6).

### Валидация перед PR

Локальный кросс-реф валидатор (`/home/ubuntu/validate_content.py`, не коммитится) — все проверки пройдены:

- **Счётчики:** items=29, mobs=8, recipes=15, zones=3, radio=3 — точно по DoD M3.
- **Уникальные `id`** в каждом файле.
- **M1 сохранён:** все 15 items / 3 mobs / 5 recipes / forest zone присутствуют без изменений. `forest` НЕ имеет `return_time_multiplier` — fallback 1.0.
- **Кросс-рефы:** `recipes[*].result_id` / `recipes[*].ingredients[*].item_id` / `items[*].recipe_id` / `mobs[*].drop_table[*].item_id` / `weapon_ranged.ammo_id` / `zones[*].resources` / `zones[*].unique_resources` / `zones[*].mobs` / `zones[*].levels[*].enemies` / `zones[*].levels[*].resources` — все валидны.
- **Сверка чисел с `docs/balance.md` §M3:** mobs / items / item stats / recipes / zones — без расхождений.
- **Уникальность ресурсов между зонами:** zone-exclusive не пересекаются (`electronics`/`oil` только в warehouse; `medical_supplies`/`circuitry` только в city).
- **Уникальность `description_ru` / `flavor_ru`** у всех items и mobs.
- **Anti-scope радио:** ни в одном из 3 сигналов нет полей M6 (`reward`, `trap_mob_id`, `trust_impact`, `type`, `zone`).

`npm install && npm run typecheck && npm run test` — зелёные:
- typecheck: ok (tsc --noEmit без ошибок).
- vitest: 49/49 passed (combat / craft / loot / weight).

### M1 content MVP — историческая справка (ветка `m1/content-mvp`)

Сделано в предыдущей сессии и смержено в `main` (затем интегрировано в `m3-integration`):

- `content/items.json` — 15 items M1, `content/mobs.json` — 3 mobs M1 (`marauder` HP=18 после QA-fix #4 / `wild_dog` / `mutant`), `content/recipes.json` — 5 recipes M1 (`recipe_pistol` / `recipe_leather_vest` / `recipe_bandage` / `recipe_medkit` / `recipe_ammo_pistol`), `content/zones.json` — 1 зона `forest` с 3 глубинами.

## Что НЕ сделано / НЕ трогал

- `docs/*` — НЕ трогаю (зона Game Designer). По FORBIDDEN брифинга `staff/handoff/M3-CONTENT.md`.
- `src/*`, `assets/*`, `public/*` — НЕ трогаю (зоны Engineer / Artist).
- `staff/handoff/*`, `staff/roles/*`, `staff/prompts/*`, `staff/kickoff/*`, `staff/decisions/*`, `staff/status/*` (кроме `CONTENT.md`) — PM-owned, не трогаю.
- M1-контент (`marauder` / `wild_dog` / `mutant`, 15 M1 items, 5 M1 recipes, `forest` zone) — НЕ изменял. `git diff m3-integration...m3/content -- content/` показывает только additions в массивах + добавление `return_time_multiplier` ТОЛЬКО для warehouse/city.
- Радио M6-поля (`reward` / `trap_mob_id` / `trust_impact` / `type` / `zone`) — НЕ добавлял (anti-scope §10.M3).

## Замечания / решения

- **Item count = 14 (PM-decision 2026-05-21, документировано в `staff/decisions/CHANGELOG.md`):** `balance.md` §M3 фиксирует ровно 14 новых items (4 + 2 + 3 + 5). Итог 29, не 30. Не выдумывал 15-й item.
- **`gas_mask`:** наименее полезен механически на M3 (defense=1, vs_melee_bonus=0), но **lore stub для M5** — будущие газовые зоны потребуют `gas_mask` для входа без штрафа. На M3 — просто T2-armor с низкой полезностью, но нужен для нарративной целостности (см. `balance.md` §M3).
- **`helmet` без head-slot:** на M3 hero держит **один armor-slot** (как M1/M2). `helmet` — альтернативная T2-броня (вместо `tactical_vest`), мульти-слот ввёдётся в M5 GD-амендментом.
- **Recovery commit `0824db6`:** первый коммит этой сессии (`b9a215f`) случайно откатил PR #23 и PR #24 правки в `staff/decisions/CHANGELOG.md`, `staff/handoff/M3-CONTENT.md`, `staff/kickoff/M3-CONTENT.md`, `staff/status/M3.md` (PM-owned файлы). Recovery commit `0824db6` восстанавливает их к состоянию origin/m3-integration HEAD. Content-файлы (mobs/items/recipes/zones/radio) этим не затронуты.

## Блокеры

- Нет.

## PR

- **`m3/content` → `m3-integration`:** PR #25 (https://github.com/alexbayov/oplot/pull/25) — Ready, ожидает PM-review + QA Acceptance.
- **`m1/content-mvp` → `main`:** PR не создан в текущей сессии — мир ушёл вперёд: и `main`, и `m3-integration` уже содержат M3-спеку, и нет смысла открывать M1-PR. M1-контент исторически зафиксирован в этом файле выше.
