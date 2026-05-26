# Таблицы баланса — «Оплот»

> Все числа игры живут здесь. GDD описывает «как работает», balance.md — «какие числа».
> Формат: таблицы + формулы. Никакого прозаического описания.
> Скоуп: **MVP, M1–M2.** Любая фича вне M1–M2 — заглушка, без чисел.

---

## Общие константы

| Параметр | Значение | Комментарий |
|---|---|---|
| `MAX_WEIGHT_KG` | 30 | Базовая грузоподъёмность героя (см. §Hero ниже) |
| `MAX_LEVEL` | 5 | Потолок прокачки в MVP |
| `INVENTORY_SLOTS` | ∞ (по весу) | В MVP нет ограничения по слотам, только по весу |
| `BASE_RETURN_TIME_S` | 30 | Базовое время возврата с вылазки без нагрузки, в секундах |
| `WEIGHT_PENALTY_FACTOR` | 1.0 | Множитель штрафа времени возврата от веса (см. формулы) |
| `LOOT_LOSS_ON_DEFEAT` | 0.5 | Доля веса лута вылазки, теряемого при поражении |
| `COVER_DEFENSE_BONUS_PCT` | 0.5 | +50% к броне на 1 ход от действия «Укрытие» |
| `DAMAGE_ROLL_MIN` | 0.85 | Нижняя граница общего разброса урона |
| `DAMAGE_ROLL_MAX` | 1.15 | Верхняя граница общего разброса урона |
| `MIN_DAMAGE_FLOOR` | 1 | Минимальный урон по любому попаданию |

---

## Hero (стартовые статы)

| Параметр | Значение | Комментарий |
|---|---|---|
| `hero.hp_max` | 100 | Полное здоровье на старте |
| `hero.energy_max` | 50 | Резерв (UI/M2), на M1 не расходуется в бою |
| `hero.base_speed` | 100 | База `initiative` героя |
| `hero.max_weight_kg` | 30 | = `MAX_WEIGHT_KG` |
| `hero.start_level` | 1 | Стартовый уровень |
| `hero.start_xp` | 0 | Стартовый XP |
| `hero.start_weapon` | `knife` | В руке на старте |
| `hero.start_armor` | `cloth_jacket` | Надето на старте |
| `hero.start_inventory` | `bandage` x2 | Стартовый рюкзак |

---

## Мобы (MVP)

> Дроп-таблицы — в [`GDD.md` §7.3](./GDD.md#73-канонические-дроп-таблицы-мобов-contentmobsjson). Здесь — только числа.

| id | name_ru | type | hp | damage_min | damage_max | defense | base_speed | xp_reward | behavior | zone | level |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `marauder` | Мародёр | human | 18 | 5 | 8 | 1 | 90 | 18 | aggressive (`flee` при HP<30%) | forest | 1 |
| `wild_dog` | Дикий пёс | animal | 20 | 8 | 12 | 0 | 120 | 14 | aggressive | forest | 1 |
| `mutant` | Мутант | mutant | 60 | 10 | 15 | 3 | 70 | 45 | aggressive | forest | 2 |

> **TODO Content M4:** обновить `content/mobs.json` `xp_reward` для M1 mobs до этих значений (`marauder=18`, `wild_dog=14`, `mutant=45`) в M4 Content PR. Это синхронизация с §M4 XP-curve, не изменение HP/damage/AI.

---

## Оружие (MVP)

| id | name_ru | type | tier | damage_min | damage_max | attack_speed | weight_kg | noise | zone_origin | ammo_id | ammo_per_shot |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `knife` | Нож | weapon_melee | 1 | 4 | 7 | 100 | 0.5 | low | universal | — | — |
| `makeshift_pistol` | Самодельный пистолет | weapon_ranged | 1 | 9 | 14 | 80 | 1.5 | medium | universal | `ammo_pistol` | 1 |

---

## Броня (MVP)

| id | name_ru | type | tier | defense | vs_melee_bonus | weight_kg | zone_origin |
|---|---|---|---|---|---|---|---|
| `cloth_jacket` | Тканевая куртка | armor | 1 | 1 | 1 (против `animal`) | 1 | universal |
| `leather_vest` | Кожаный жилет | armor | 1 | 3 | 0 | 2.5 | universal |

> `vs_melee_bonus` — бонус к `defense` против melee-атак. В M1 melee-атаку (укус/коготь без оружия) проводит только моб с `type = "animal"` — это `wild_dog`. Marauder и mutant в M1 НЕ классифицируются как melee-атакёры для целей этого бонуса (см. также GDD §6 ArmorStats). Эффект: +1 к `defense` в момент расчёта урона.

---

## Ресурсы (MVP, 8 шт.)

| id | name_ru | tier | weight_kg | zone_origin | Назначение в рецептах |
|---|---|---|---|---|---|
| `wood` | Дерево | 1 | 2 | forest | `recipe_pistol` |
| `scrap` | Металлолом | 1 | 3 | forest | `recipe_pistol`, `recipe_ammo_pistol` |
| `cloth` | Ткань | 1 | 1 | forest | `recipe_leather_vest`, `recipe_bandage`, `recipe_medkit` |
| `food` | Консервы | 1 | 1 | forest | (M2 — еда; на M1 — только лут) |
| `water` | Вода | 1 | 1 | forest | (M2 — питьё; на M1 — только лут) |
| `gunpowder` | Порох | 1 | 1 | forest | `recipe_pistol`, `recipe_ammo_pistol` |
| `leather` | Кожа | 1 | 2 | forest | `recipe_leather_vest` |
| `rope` | Верёвка | 1 | 1 | forest | `recipe_leather_vest` |

---

## Расходники (MVP, 3 шт.)

| id | name_ru | type | tier | weight_kg | effect_type | effect_value | charges | zone_origin |
|---|---|---|---|---|---|---|---|---|
| `bandage` | Бинт | consumable | 1 | 0.3 | heal | 15 | 1 | universal |
| `medkit` | Аптечка | consumable | 1 | 0.5 | heal | 40 | 1 | universal |
| `ammo_pistol` | Патроны (пистолет) | consumable | 1 | 0.5 | ammo_refill | 1 | 1 | universal |

> `ammo_pistol` — один «заряд» = 1 выстрел `makeshift_pistol`. Стак до 99 в одной ячейке `count`.

---

## Рецепты (MVP, 5 шт.)

> Все `result_id` и `ingredient.item_id` ∈ 15 канонических предметов (см. [`GDD.md` §7.1](./GDD.md#71-канонические-15-предметов-contentitemsjson)).

| id | result_id | result_count | ingredients | tier | craft_time_s | unlock_condition |
|---|---|---|---|---|---|---|
| `recipe_pistol` | `makeshift_pistol` | 1 | `scrap` x5, `wood` x2, `gunpowder` x3 | 1 | 0 | null |
| `recipe_leather_vest` | `leather_vest` | 1 | `leather` x3, `cloth` x2, `rope` x1 | 1 | 0 | null |
| `recipe_bandage` | `bandage` | 1 | `cloth` x3 | 1 | 0 | null |
| `recipe_medkit` | `medkit` | 1 | `bandage` x2, `cloth` x2 | 1 | 0 | null |
| `recipe_ammo_pistol` | `ammo_pistol` | 5 | `gunpowder` x2, `scrap` x1 | 1 | 0 | null |

---

## XP-таблица (MVP)

Таблица ниже — **канон M1**. Формула приведена рядом и точно воспроизводит числа таблицы.

| level | xp_required (накопительно) | xp_to_next |
|---|---|---|
| 1 | 0 | 50 |
| 2 | 50 | 100 |
| 3 | 150 | 200 |
| 4 | 350 | 350 |
| 5 | 700 | — (потолок M1) |

Формула (точно совпадает с таблицей):

```
xp_to_next(level) = 25 * level^2 - 25 * level + 50
# эквивалентно: инкременты 50, +50, +100, +150 — арифметическая прогрессия с шагом 50
```

Сверка формулы с таблицей:

| level | 25 * level^2 - 25 * level + 50 | xp_to_next (таблица) |
|---|---|---|
| 1 | 25 - 25 + 50 = 50 | 50 |
| 2 | 100 - 50 + 50 = 100 | 100 |
| 3 | 225 - 75 + 50 = 200 | 200 |
| 4 | 400 - 100 + 50 = 350 | 350 |

На M3+ эта же формула является source-of-truth для Engineer'а и при расширении `MAX_LEVEL` выше 5.

Ориентир: чтобы достичь 5 уровня, нужно 700 XP. Это эквивалент: ~70 мародёров (10 XP) или ~28 мутантов (25 XP) или смешанной популяции.

---

## Зоны (MVP)

> Структура levels[] — в [`GDD.md` §7.4](./GDD.md#74-канон-m1-зоны-contentzonesjson). Здесь — числа.

| id | name_ru | level | boss_id | mobs (агрегат) | resources (агрегат) | unlock_condition |
|---|---|---|---|---|---|---|
| `forest` | Лес | 1 | null | `marauder, wild_dog, mutant` | `wood, scrap, cloth, food, water, gunpowder, leather, rope` | `start` |

Глубины:

| depth | enemy_count | resource_count | min_player_level | fights_per_depth |
|---|---|---|---|---|
| 1 | [1, 2] | [2, 4] | 1 | 2 |
| 2 | [2, 3] | [3, 5] | 3 | 3 |
| 3 | [2, 4] | [4, 6] | 5 | 4 |

---

## Формулы

```
# Урон (атака любой стороны)
weapon_damage_base = random_uniform(damage_min, damage_max)
roll               = random_uniform(DAMAGE_ROLL_MIN, DAMAGE_ROLL_MAX)   # 0.85..1.15
final_damage       = max(MIN_DAMAGE_FLOOR, weapon_damage_base * roll - target_total_defense)

# Защита цели
target_total_defense = Σ armor.defense (надетой брони)
                     + Σ armor.vs_melee_bonus (если source — melee-атакёр; в M1 это эквивалентно source.type == "animal", единственный melee-атакёр M1 — wild_dog)
                     + (cover_active ? COVER_DEFENSE_BONUS_PCT * target_total_defense_base : 0)

# Инициатива
initiative_hero = hero.base_speed - (cur_weight / max_weight) * 50
initiative_mob  = mob.base_speed
if cur_weight > max_weight: initiative_hero = 0

# Вес инвентаря
cur_weight = Σ (item.weight_kg * item.count for item in inventory)
overweight = cur_weight > max_weight

# Время возврата
return_time_s = BASE_RETURN_TIME_S * (1 + (cur_weight / max_weight) * WEIGHT_PENALTY_FACTOR)

# Поражение героя
on_defeat:
    drop_weight_target = sum(loot_run.weight_kg) * LOOT_LOSS_ON_DEFEAT
    drop items в порядке убывания weight_kg, пока сумма выкинутого >= drop_weight_target

# XP (формула точно совпадает с XP-таблицей выше)
xp_to_next(level)  = 25 * level^2 - 25 * level + 50
xp_required(level) = sum(xp_to_next(k) for k in 1..level-1)
level_up: cur_xp >= xp_required(level + 1) → level += 1
```

---

## Скоуп (что НЕ в balance.md M1)

Эти числа сознательно не заданы в M1; они появятся на своих вехах:

- Перки, дерево перков, бонусы перков — **M4**.
- Модули оружия / брони и их статы — **M5+**.
- Числа боссов и мини-боссов — **M5**.
- ~~Числа второй и далее зоны (`warehouse`, `city`)~~ — **DONE в §M3 ниже**.
- Радио-события, шкала доверия, награды/штрафы радио — **M6**.
- IAP, реклама, Yandex SDK rewards — **M8**.

---

## M3 — Расширение мира

> **Скоуп:** добавление чисел для M3 GD-amendment (5 новых мобов + 2 новые зоны + 10 новых рецептов + расширение формулы возврата). M1/M2 числа выше (mobs, items, weapons, armor, consumables, recipes, XP, forest zone, формулы) **НЕ изменяются**.
>
> Спека механик — в [`docs/GDD.md` §5.4 / §6.4.M3 / §10.M3](./GDD.md#54-мобы-m3-5-новых-типов).
>
> **Anti-scope §M3:** перки (M4), боссы (M5), полная radio-логика (M6), модули оружия (M5+), Yandex SDK (M8).

### M3 — Мобы (5 новых)

> Дроп-таблицы — [см. §M3 Drop-tables ниже](#m3-drop-tables). `behavior_id` и AI-описание — в [GDD §5.4](./GDD.md#54-мобы-m3-5-новых-типов).

| id | name_ru | type | hp | damage_min | damage_max | defense | base_speed | xp_reward | behavior | behavior_id | zone | level |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `looter_sniper` | Мародёр-снайпер | human | 22 | 9 | 13 | 1 | 95 | 28 | aggressive | `ranged_keep_distance` | warehouse | 2 |
| `armored_guard` | Бронированный охранник | human | 35 | 7 | 10 | 4 | 75 | 36 | defensive | `defensive_cover` | warehouse | 2 |
| `fanatic_berserker` | Фанатик-берсерк | human | 40 | 8 | 12 | 2 | 100 | 42 | aggressive | `berserker_low_hp` | city | 3 |
| `pack_rat` | Стайная крыса-мутант | mutant | 15 | 6 | 9 | 0 | 110 | 22 | aggressive | `pack_bonus_when_paired` | city | 3 |
| `relic_drone` | Реликтовый дрон | mech | 28 | 8 | 11 | 5 | 90 | 50 | aggressive | `armor_piercing_ranged` | warehouse,city (bridge) | 3 |

> **TODO Content M4:** обновить `content/mobs.json` `xp_reward` для M3 mobs до этих значений (`looter_sniper=28`, `armored_guard=36`, `fanatic_berserker=42`, `pack_rat=22`, `relic_drone=50`) в M4 Content PR. Это синхронизация с §M4 XP-curve, не изменение HP/damage/AI/drop-tables.

**Модификаторы AI (повтор §5.4 для быстрой справки Engineer'у — числа здесь):**

| behavior_id | Эффект (числовой) |
|---|---|
| `ranged_keep_distance` | Если `hero.equipped_weapon.type === "weapon_melee"`: `damage × 0.5`. Иначе: `× 1.0`. |
| `defensive_cover` | На каждом нечётном ходу моба (`turn_count % 2 == 1`): action="cover", `coverActive=true` на след. атаку против моба. `COVER_DEFENSE_BONUS_PCT = 0.5` (existing M1/M2 константа) применяется к его `total_defense`. |
| `berserker_low_hp` | Single-shot trigger: при первом ходе с `hp / hp_max < 0.5` → `damage_min *= 2`, `damage_max *= 2`, `base_speed -= 30`. Флаг `_berserk_triggered=true`. |
| `pack_bonus_when_paired` | Каждый ход: если `enemies.filter(e => e.id === "pack_rat" && e.hp > 0).length >= 2` → `damage *= 1.5`. Иначе `× 1.0`. |
| `armor_piercing_ranged` | При расчёте урона по hero: `target_total_defense` исключает `Σ armor.defense` (но `vs_melee_bonus` всё равно не применяется — `mech` не "animal"). Effectively `final_damage = max(MIN_DAMAGE_FLOOR, mob_damage * roll - cover_only)`. |

<a id="m3-drop-tables"></a>
### M3 — Drop-tables (новые мобы)

> Все `item_id` ∈ items roster (M1 §7.1 + M3 новые items, см. §M3 Recipes ниже). Cross-refs проверяются на Content PR.

| Моб | drop_table |
|---|---|
| `looter_sniper` | `cloth` @ 0.50 (count 1–2); `ammo_pistol` @ 0.40 (count 1–2); `scrap` @ 0.30 (count 1); `ammo_rifle` @ 0.20 (count 1, редкий) |
| `armored_guard` | `scrap` @ 0.70 (count 1–2); `leather` @ 0.40 (count 1); `electronics` @ 0.25 (count 1, zone-exclusive); `gunpowder` @ 0.20 (count 1) |
| `fanatic_berserker` | `cloth` @ 0.50 (count 1–2); `medical_supplies` @ 0.35 (count 1, zone-exclusive); `food` @ 0.20 (count 1); `bandage` @ 0.15 (count 1) |
| `pack_rat` | `leather` @ 0.60 (count 1); `food` @ 0.30 (count 1, редкий — то, что они едят); `circuitry` @ 0.10 (count 1, очень редко — кто-то носил импланты) |
| `relic_drone` | `electronics` @ 0.65 (count 1–2, zone-exclusive Склада); `circuitry` @ 0.40 (count 1–2, zone-exclusive Города); `scrap` @ 0.30 (count 1); `oil` @ 0.20 (count 1, zone-exclusive Склада) |

> **Дизайн-нота про `relic_drone`:** дрон — единственный mob-источник `electronics`, `circuitry`, `oil` помимо zone-loot. Это **намеренно** даёт игроку второй путь добычи (опасный — через мех-бой) и оправдывает cross-zone bridge характер моба (см. GDD §5.4.5).

### M3 — Зоны (Склад + Город)

> Структура levels[] — в [GDD §6.4.M3](./GDD.md#64m3-новые-зоны-m3-склад--город). Здесь — числа.

| id | name_ru | level | boss_id | mobs (агрегат) | resources (агрегат) | unique_resources | unlock_condition | return_time_multiplier |
|---|---|---|---|---|---|---|---|---|
| `warehouse` | Склад | 2 | null | `marauder, looter_sniper, armored_guard, relic_drone` | `wood, scrap, cloth, electronics, oil, gunpowder, leather` | `electronics, oil` | `forest_depth_2_completed` | **1.2** |
| `city` | Город | 3 | null | `mutant, fanatic_berserker, pack_rat, relic_drone` | `scrap, cloth, food, water, medical_supplies, circuitry, gunpowder, leather` | `medical_supplies, circuitry` | `any_warehouse_sortie_completed` | **1.5** |

**Глубины Склада:**

| depth | enemy_count | resource_count | min_player_level | fights_per_depth |
|---|---|---|---|---|
| 1 | [1, 2] | [2, 4] | 2 | 2 |
| 2 | [2, 3] | [3, 5] | 3 | 3 |

**Глубины Города:**

| depth | enemy_count | resource_count | min_player_level | fights_per_depth |
|---|---|---|---|---|
| 1 | [2, 3] | [2, 4] | 3 | 2 |
| 2 | [2, 4] | [3, 5] | 4 | 3 |
| 3 | [3, 5] | [4, 7] | 5 | 4 |

> **Замечание о `min_player_level`.** Поле сохранено для совместимости с §M1 формой `ZoneLevel`. На M3 XP-система потолок = 5 (см. §XP-таблица). Engineer проверяет `player.level >= min_player_level` точно так же, как в M1. Никаких новых уровней XP не вводится.

### M3 — Расширенная формула `return_time_s`

> **Совместимость с M1/M2:** `forest` зона **не задаёт** `return_time_multiplier` в `content/zones.json` → fallback на default 1.0 → формула эквивалентна M1/M2 версии. Все M2 vitest на `computeReturnTime(curWeight, maxWeight)` без 3-го аргумента остаются зелёными.

```
# M3 расширение существующей формулы (см. §Формулы M1/M2)
zone_multiplier = zone.return_time_multiplier ?? 1.0       # default 1.0 если поле отсутствует
return_time_s = BASE_RETURN_TIME_S
              * zone_multiplier
              * (1 + (cur_weight / max_weight) * WEIGHT_PENALTY_FACTOR)

# Конкретные multipliers:
# forest    → 1.0  (поле НЕ задано в content/zones.json → fallback default)
# warehouse → 1.2  (на 20% дольше — Склад дальше Леса)
# city      → 1.5  (на 50% дольше — Город дальше всех от Оплота)
```

**Примеры (полный рюкзак 30/30 kg):**

| Зона | zone_mult | base | weight term | return_time_s |
|---|---|---|---|---|
| forest | 1.0 | 30 | (1 + 1.0 × 1.0) = 2.0 | 60.0 с (= M1/M2 точное значение) |
| warehouse | 1.2 | 30 | 2.0 | 72.0 с |
| city | 1.5 | 30 | 2.0 | 90.0 с |

**Примеры (пустой рюкзак 0/30 kg):**

| Зона | zone_mult | base | weight term | return_time_s |
|---|---|---|---|---|
| forest | 1.0 | 30 | (1 + 0 × 1.0) = 1.0 | 30.0 с (= M1/M2) |
| warehouse | 1.2 | 30 | 1.0 | 36.0 с |
| city | 1.5 | 30 | 1.0 | 45.0 с |

### M3 — Новые items (для recipes ниже)

> Числовая часть (`weight_kg`, статы) — обязательная. Content Designer заполняет `description_ru` / `flavor_ru` по правилам [content-brief.md](./content-brief.md). Cross-refs всех `id` проверяются на Content PR.
>
> **Tiers:** все новые items — T2 кроме zone-exclusive ресурсов (T1).

#### Zone-exclusive ресурсы (T1, 4 шт.)

| id | name_ru | tier | weight_kg | zone_origin | Назначение |
|---|---|---|---|---|---|
| `electronics` | Электроника | 1 | 1 | warehouse | `recipe_tactical_vest`, `recipe_emp_grenade` |
| `oil` | Машинное масло | 1 | 1 | warehouse | `recipe_pipe_rifle`, `recipe_crowbar`, `recipe_smoke_bomb` |
| `medical_supplies` | Медикаменты | 1 | 0.5 | city | `recipe_large_medkit`, `recipe_energy_drink` |
| `circuitry` | Микросхемы | 1 | 0.5 | city | `recipe_gas_mask`, `recipe_emp_grenade` |

#### Новое T2-оружие (2 шт.)

| id | name_ru | type | tier | damage_min | damage_max | attack_speed | weight_kg | noise | zone_origin | ammo_id | ammo_per_shot |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `pipe_rifle` | Самопальная винтовка | weapon_ranged | 2 | 14 | 20 | 70 | 2.5 | high | universal | `ammo_rifle` | 1 |
| `crowbar` | Монтировка | weapon_melee | 2 | 7 | 11 | 90 | 2.0 | low | universal | — | — |

> **Уникальность `pipe_rifle` vs `makeshift_pistol`:** другой ammo_id (`ammo_rifle`), сильнее урон (14-20 vs 9-14), медленнее attack_speed, шумнее (`high` vs `medium`), тяжелее (2.5 vs 1.5). Tactical niche — anti-tank против `armored_guard` и `mutant`. Механически уникален (правила content-brief.md).

> **Уникальность `crowbar` vs `knife`:** сильнее урон (7-11 vs 4-7), но медленнее (90 vs 100 attack_speed) и тяжелее (2.0 vs 0.5). Tactical niche — против `armored_guard` (бьёт сквозь defense=4 надёжнее, чем нож).

#### Новая T2-броня (3 шт.)

| id | name_ru | type | tier | defense | vs_melee_bonus | weight_kg | zone_origin |
|---|---|---|---|---|---|---|---|
| `tactical_vest` | Тактический жилет | armor | 2 | 4 | 0 | 3.0 | universal |
| `helmet` | Шлем | armor | 2 | 2 | 0 | 1.0 | universal |
| `gas_mask` | Противогаз | armor | 2 | 1 | 0 | 0.5 | universal |

> **Уникальность `tactical_vest` vs `leather_vest`:** сильнее (4 vs 3 defense), но тяжелее (3.0 vs 2.5). Tactical niche — основной T2 ап. Требует `electronics` (warehouse-exclusive) для крафта.
>
> **Уникальность `helmet`:** **новый слот** (голова). На M3 Engineer держит **один armor-slot** в hero (как M1/M2). Слот `helmet` — в M5 (модули). На M3 `helmet` рассматривается как **альтернативная T2-броня** (вместо `tactical_vest`), без выделенного head-слота. **Это намеренное упрощение M3** — в M5 GD-амендмент введёт мульти-слот броню.
>
> **Уникальность `gas_mask`:** наименее полезен механически на M3 (defense=1), но **lore stub для M5**: будущие газовые зоны потребуют `gas_mask` для входа без штрафа. На M3 — просто T2-armor с низкой полезностью, но нужен для нарративной целостности.

#### Новые T2-расходники (5 шт.)

| id | name_ru | type | tier | weight_kg | effect_type | effect_value | charges | zone_origin |
|---|---|---|---|---|---|---|---|---|
| `large_medkit` | Большая аптечка | consumable | 2 | 0.8 | heal | 80 | 1 | universal |
| `energy_drink` | Энергетик | consumable | 2 | 0.3 | initiative_boost | 20 | 1 | universal |
| `emp_grenade` | ЭМИ-граната | consumable | 2 | 0.5 | mech_disable | 1 | 1 | universal |
| `smoke_bomb` | Дымовая шашка | consumable | 2 | 0.3 | cover_boost | 50 | 1 | universal |
| `ammo_rifle` | Патроны (винтовка) | consumable | 2 | 0.5 | ammo_refill | 1 | 1 | universal |

> **`effect_type` enum extensions (M3, optional в `ItemBase.stats`):**
> - `heal` (M1 — `bandage`, `medkit`): `effect_value` — сколько HP восстанавливается.
> - `ammo_refill` (M1 — `ammo_pistol`): `effect_value=1` — заряжает 1 патрон в соответствующее оружие (`ammo_id` равенство).
> - `initiative_boost` (**M3 новый**): `effect_value=20` — +20 к hero.base_speed на 1 бой (1 combat). Эффект сбрасывается после `endSortie`.
> - `mech_disable` (**M3 новый**): применяется в бою на цели типа `mech`. Эффект — `mob.skip_next_turn = true` на 1 ход. Не работает на не-mech типах (no-op).
> - `cover_boost` (**M3 новый**): `effect_value=50` — `coverActive=true` на 1 свой ход + `COVER_DEFENSE_BONUS_PCT * 1.0` (вместо обычного 0.5) — двойное укрытие, дороже.
>
> **Implementation hint (Engineer):** все 3 новых effect_type — это **расширения** existing M2 consumable logic. Не нужно новых state-полей в Hero (initiative_boost — temp variable в combat session; mech_disable — поле на target mob; cover_boost — переиспользует coverActive). ~15 LOC суммарно.

<a id="m3-recipes"></a>
### M3 — Recipes (10 новых)

> Все `result_id` и `ingredient.item_id` ∈ existing M1 items (§7.1) + new M3 items (выше). Каждый рецепт использует **минимум 1 zone-exclusive ресурс** — правило «крафт мотивирует исследовать зоны» (см. handoff M3-CONTENT.md).

| id | result_id | result_count | ingredients | tier | craft_time_s | unlock_condition |
|---|---|---|---|---|---|---|
| `recipe_pipe_rifle` | `pipe_rifle` | 1 | `scrap` x5, `wood` x3, `gunpowder` x2, `oil` x1 | 2 | 0 | null |
| `recipe_crowbar` | `crowbar` | 1 | `scrap` x4, `oil` x1 | 2 | 0 | null |
| `recipe_tactical_vest` | `tactical_vest` | 1 | `leather` x3, `cloth` x3, `electronics` x1 | 2 | 0 | null |
| `recipe_helmet` | `helmet` | 1 | `scrap` x3, `leather` x2, `cloth` x1 | 2 | 0 | null |
| `recipe_large_medkit` | `large_medkit` | 1 | `medkit` x2, `medical_supplies` x1 | 2 | 0 | null |
| `recipe_energy_drink` | `energy_drink` | 2 | `water` x2, `medical_supplies` x1 | 2 | 0 | null |
| `recipe_gas_mask` | `gas_mask` | 1 | `cloth` x3, `circuitry` x1, `rope` x1 | 2 | 0 | null |
| `recipe_emp_grenade` | `emp_grenade` | 1 | `gunpowder` x2, `electronics` x2, `circuitry` x1 | 2 | 0 | null |
| `recipe_smoke_bomb` | `smoke_bomb` | 2 | `cloth` x2, `gunpowder` x1, `oil` x1 | 2 | 0 | null |
| `recipe_ammo_rifle` | `ammo_rifle` | 5 | `gunpowder` x3, `scrap` x1 | 2 | 0 | null |

> **Покрытие zone-exclusive ресурсов:**
> - `electronics` (warehouse) → `recipe_tactical_vest`, `recipe_emp_grenade` (2 рецепта)
> - `oil` (warehouse) → `recipe_pipe_rifle`, `recipe_crowbar`, `recipe_smoke_bomb` (3 рецепта)
> - `medical_supplies` (city) → `recipe_large_medkit`, `recipe_energy_drink` (2 рецепта)
> - `circuitry` (city) → `recipe_gas_mask`, `recipe_emp_grenade` (2 рецепта)
>
> `recipe_helmet` и `recipe_ammo_rifle` — **не** требуют zone-exclusive (helmet — стартовый T2 анти-melee, доступен сразу при сборе scrap/leather/cloth в любой зоне; ammo_rifle — обвязка для `pipe_rifle`, без zone-привязки). Это **намеренное** исключение из правила — даёт игроку «низкоуровневые» T2-крафты на старте M3 без необходимости сначала открывать новые зоны.

### M3 — Структура радио (см. GDD §10.M3)

> Числовые поля `RadioSignal` — только `expires_after_sorties` (см. JSON-схема §10.M3.1 GDD). Никаких числовых rewards, damage, trust на M3.
>
> Content Designer задаёт `expires_after_sorties` на свой выбор (рекомендация: 2-4 для dummy-сигналов M3). На M6 GD-амендмент введёт балансные правила.

### M3 — Скоуп (что НЕ в balance.md M3)

Эти числа сознательно не заданы на M3; они появятся на своих вехах:

- Перки и их бонусы — **M4** (см. GDD §8 placeholder).
- Боссы / мини-боссы / T3 чертежи / дейли-инстансы — **M5** (см. GDD §9 placeholder).
- Модули оружия / брони (head-slot, accessory slots, runes) — **M5+** (см. GDD §12 placeholder).
- Радио: rewards, ambush damage, trust scale, faction reputation — **M6** (см. GDD §10 placeholder).
- IAP, реклама, Yandex SDK rewards — **M8** (см. GDD §13 placeholder).
- Газовые зоны (требующие `gas_mask`) — **M5** (`gas_mask` на M3 — lore stub).

---

## M4 — Прогрессия

> **Скоуп:** XP за убийство мобов, XP-curve 1–10, 8 пассивных перков flat pool.
>
> **Anti-scope §M4:** skill tree / points / nodes / prereq / tier / cost — M5+ refactor path. Активные ability / cooldowns — M5+. Боссы / T3 — M5. Полная радио — M6. Yandex SDK / persistence — M8.
>
> Спека механик — в [`docs/GDD.md` §8](./GDD.md#8-перки-и-прогрессия-m4) и [`docs/GDD.md` §6.5](./GDD.md#65-perk).

### M4 — XP-curve

Формула:

```
xp_to_next(level) = round(40 * level^1.5)
xp_required(level) = sum(xp_to_next(k) for k in 1..level-1)
```

| Level | XP required from 0 | XP to next |
|---|---:|---:|
| 1 | 0 | 40 |
| 2 | 40 | 113 |
| 3 | 153 | 208 |
| 4 | 361 | 320 |
| 5 | 681 | 447 |
| 6 | 1128 | 588 |
| 7 | 1716 | 741 |
| 8 | 2457 | 905 |
| 9 | 3362 | 1080 |
| 10 | 4442 | — |

### M4 — Mob XP rewards

| id | name_ru | zone | level | xp_reward |
|---|---|---|---:|---:|
| `marauder` | Мародёр | forest | 1 | 18 |
| `wild_dog` | Дикий пёс | forest | 1 | 14 |
| `mutant` | Мутант | forest | 2 | 45 |
| `looter_sniper` | Мародёр-снайпер | warehouse | 2 | 28 |
| `armored_guard` | Бронированный охранник | warehouse | 2 | 36 |
| `fanatic_berserker` | Фанатик-берсерк | city | 3 | 42 |
| `pack_rat` | Стайная крыса-мутант | city | 3 | 22 |
| `relic_drone` | Реликтовый дрон | warehouse, city | 3 | 50 |

### M4 — Perks

| Perk id | Name | type | stat | value |
|---|---|---|---|---:|
| `tough_skin` | Закалённая кожа | additive | `hp_max` | 15 |
| `sharp_blade` | Острое лезвие | multiplicative | `damage` | 1.15 |
| `lean_pack` | Лёгкая сумка | multiplicative | `weight_penalty_multiplier` | 0.85 |
| `lucky_scavenger` | Удачливый сборщик | multiplicative | `loot_quantity_multiplier` | 1.20 |
| `keen_eye` | Острый глаз | additive | `crit_chance` | 0.05 |
| `reinforced_plates` | Усиленные пластины | multiplicative | `armor_efficiency` | 1.15 |
| `quick_hands` | Быстрые руки | multiplicative | `crafting_speed_multiplier` | 0.90 |
| `fast_learner` | Быстрая обучаемость | multiplicative | `xp_gain_multiplier` | 1.15 |

### M4 — Fallback after all perks

| Fallback id | Source | Effect | Notes |
|---|---|---|---|
| `veteran_conditioning` | hardcoded `LevelUpScene` fallback | `hp_max +10` | НЕ JSON-перк; НЕ добавлять в `content/perks.json`. Pool size для Content/QA = 8 perks + 1 hardcoded fallback. |

---

## M5 — Боссы и инстансы

> **Скоуп:** 3 босса (1/зона, depth 3, 2-фазный AI), дейли-инстанс (24ч cool-down), газовые зоны (warehouse/city depth 2-3), 3 T3 чертежа (boss-drop → T3 craft), warehouse depth 3.
>
> **Anti-scope §M5:** модульное оружие / брони-слоты (M5+ отдельная подсистема), полная радио-логика (M6), Yandex SDK (M8), skill tree / prereq / tier / cost / cooldown (M5+ refactor), PvP, boss-cinematics (M7), дополнительные AI behaviors (переиспользуются M3 §5.4: `ranged_keep_distance`, `defensive_cover`, `berserker_low_hp`, `pack_bonus_when_paired`, `armor_piercing_ranged`), дейли-instance reward rotation / weekly events, minion spawn, active abilities / cooldowns.
>
> Спека механик — в [`docs/GDD.md` §9](./GDD.md#9-боссы-и-инстансы-m5) и [`docs/GDD.md` §6.2 / §6.4](./GDD.md#62-mob) (schema extensions).
>
> **M1/M2/M3/M4 числа выше НЕ изменяются.**

### M5 — Boss stats (3 босса)

| id | name_ru | type | hp | damage_min | damage_max | defense | base_speed | xp_reward | behavior_id (phase 1) | phase_2_behavior_id | phase_threshold | boss_drop_id | zone | level |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `forest_alpha_mutant` | Альфа-мутант | mutant | 300 | 20 | 30 | 6 | 85 | 150 | `berserker_low_hp` | `pack_bonus_when_paired` | 0.5 | `mutated_gland` | forest | 5 |
| `warehouse_drone_prime` | Прайм-дрон | mech | 350 | 25 | 35 | 8 | 80 | 200 | `armor_piercing_ranged` | `defensive_cover` | 0.5 | `prime_circuit` | warehouse | 5 |
| `city_guard_captain` | Капитан охраны | human | 400 | 22 | 32 | 10 | 90 | 250 | `defensive_cover` | `ranged_keep_distance` | 0.5 | `captain_insignia` | city | 6 |

**Boss behaviour effect summary (переиспользуются §5.4 behaviours):**

| boss | phase 1 effect | phase 2 effect |
|---|---|---|
| `forest_alpha_mutant` | `berserker_low_hp`: при HP<50% → damage ×2, base_speed −30 (single-shot trigger) | `pack_bonus_when_paired`: проверка ≥2 alive same-id mobs → нет → ×1.0. Berserker damage ×2 persist из phase 1. |
| `warehouse_drone_prime` | `armor_piercing_ranged`: игнорирует hero armor.defense | `defensive_cover`: каждый нечётный ход — cover (+50% defense), skip attack |
| `city_guard_captain` | `defensive_cover`: каждый нечётный ход — cover (+50% defense), skip attack | `ranged_keep_distance`: если hero weapon_melee → boss damage ×0.5 |

**Sanity check vs M3 regular mobs:**
- Boss HP: 300–400 vs M3 max HP 40 (fanatic_berserker) → boss ×7.5–10.0 × regular.
- Boss damage: 20–35 vs M3 max damage 13 (looter_sniper) → boss ×1.5–2.7 × regular.
- Boss defense: 6–10 vs M3 max defense 5 (relic_drone) → boss ×1.2–2.0 × regular.
- Boss XP: 150–250 vs M3 max XP 50 (relic_drone) → boss ×3.0–5.0 × regular.

### M5 — Boss-drop resources (3 ресурса)

> Каждый boss-drop — type=resource, weight_kg=1, tier=2. Используется как ингредиент для T3 recipe (см. §M5.3).

| id | name_ru | type | tier | weight_kg | zone_origin | Назначение |
|---|---|---|---|---|---|---|
| `mutated_gland` | Мутировавшая железа | resource | 2 | 1 | forest | `recipe_composite_blade` |
| `prime_circuit` | Прайм-схема | resource | 2 | 1 | warehouse | `recipe_prime_shotgun` |
| `captain_insignia` | Знак капитана | resource | 2 | 1 | city | `recipe_captain_armor` |

### M5 — T3 recipes (3 рецепта)

> Каждый T3 recipe: T2 base item (потребляется) + boss-drop × 2 + общие ресурсы. tier=3, craft_time_s=0, unlock_condition=null.

| id | result_id | result_count | ingredients | tier | craft_time_s | unlock_condition |
|---|---|---|---|---|---|---|
| `recipe_composite_blade` | `composite_blade` | 1 | `crowbar` x1, `mutated_gland` x2, `scrap` x5 | 3 | 0 | null |
| `recipe_prime_shotgun` | `prime_shotgun` | 1 | `pipe_rifle` x1, `prime_circuit` x2, `scrap` x6 | 3 | 0 | null |
| `recipe_captain_armor` | `captain_armor` | 1 | `tactical_vest` x1, `captain_insignia` x2, `leather` x4 | 3 | 0 | null |

> **Покрытие boss-drop ресурсов:**
> - `mutated_gland` (forest) → `recipe_composite_blade` (1 рецепт)
> - `prime_circuit` (warehouse) → `recipe_prime_shotgun` (1 рецепт)
> - `captain_insignia` (city) → `recipe_captain_armor` (1 рецепт)
>
> Каждый boss-drop используется ровно в 1 рецепте (1:1 mapping зона→boss→T3).

### M5 — T3 item stats (3 предмета)

#### T3-оружие (2 шт.)

| id | name_ru | type | tier | damage_min | damage_max | attack_speed | weight_kg | noise | zone_origin | ammo_id | ammo_per_shot |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `composite_blade` | Композитный клинок | weapon_melee | 3 | 24 | 32 | 85 | 3 | low | universal | — | — |
| `prime_shotgun` | Прайм-дробовик | weapon_ranged | 3 | 27 | 37 | 65 | 4 | high | universal | `ammo_rifle` | 1 |

> **Уникальность `composite_blade` vs `crowbar` (T2):** damage 24-32 vs 7-11 (×3.4), attack_speed 85 vs 90 (slightly slower), weight 3 vs 2 (heavier). Tactical niche — лучший melee в игре, один удар ≈ 25% HP мутанта.
>
> **Уникальность `prime_shotgun` vs `pipe_rifle` (T2):** damage 27-37 vs 14-20 (×1.9), attack_speed 65 vs 70 (slower), weight 4 vs 2.5 (heavier), noise high vs high (same). Tactical niche — лучший ranged в игре, медленный но разрушительный.

#### T3-броня (1 шт.)

| id | name_ru | type | tier | defense | vs_melee_bonus | weight_kg | zone_origin |
|---|---|---|---|---|---|---|---|
| `captain_armor` | Броня капитана | armor | 3 | 12 | 0 | 5 | universal |

> **Уникальность `captain_armor` vs `tactical_vest` (T2):** defense 12 vs 4 (×3.0), weight 5 vs 3 (heavier). Tactical niche — лучшая броня в игре, значительно снижает урон боссов и regular мобов.

### M5 — Gas zone damage

| zone_id | depth | is_gas | gas_damage_per_turn |
|---|---|---|---|
| `forest` | 1, 2, 3 | false | — |
| `warehouse` | 1 | false | — |
| `warehouse` | 2, 3 | true | 5 |
| `city` | 1 | false | — |
| `city` | 2, 3 | true | 8 |

> Gas damage per turn — целое число HP, вычитается каждый раунд боя после хода мобов (если hero НЕ имеет `gas_mask` в armor-slot или inventory). `gas_mask` полностью отменяет урон (damage → 0).
>
> **Sanity check:** warehouse gas 5 HP/turn × 4 rounds (depth 3 fights_per_depth) = 20 HP потеряно на gas alone. City gas 8 HP/turn × 4 rounds = 32 HP. С hero HP=100 (+ perks), gas без защиты — значительный, но не фатальный штраф. С gas_mask → 0.

### M5 — Дейли cool-down

| Параметр | Значение | Комментарий |
|---|---|---|
| `daily_reset_hours` | 24 | Для всех 3 зон. Cool-down с момента предыдущего дейли-kill (timestamp ms). |

> Формула: `canEnterDaily = (Date.now() - lastKillTimestamp) >= daily_reset_hours * 3600 * 1000`.
> Дейли skip depth 1-2, игрок попадает сразу на depth 3 → bossfight → guaranteed boss-drop.

### M5 — Warehouse depth 3 (новая глубина)

> До M3 warehouse имел только depth 1-2. На M5 добавляется depth 3 для boss placement.

| depth | enemy_count | resource_count | min_player_level | fights_per_depth | is_gas |
|---|---|---|---|---|---|
| 1 | [1, 2] | [2, 4] | 2 | 2 | false |
| 2 | [2, 3] | [3, 5] | 3 | 3 | true |
| 3 | [2, 3] | [3, 5] | 5 | 3 | true |

> Depth 3 enemy_count [2, 3] — включает `warehouse_drone_prime` (boss) + 1-2 regular мобов из зоны. Boss всегда спавнится на depth 3.

### M5 — Скоуп (что НЕ в balance.md M5)

Эти числа сознательно не заданы на M5; они появятся на своих вехах:

- Модульное оружие / брони-слоты (head-slot, accessory, runes) — **M5+** (см. GDD §12 placeholder).
- Полная радио-логика (rewards, ambush damage, trust scale, faction reputation) — **M6** (см. GDD §10.M6).
- Yandex SDK / IAP / реклама — **M8** (см. GDD §13 placeholder).
- Skill tree / поинты / prereq / tier / cost / cooldown — **M5+ refactor path**.
- Boss-cinematics / animated phase transition — **M7 polish**.
- Дейли-instance reward rotation / weekly events — M5 daily = 24h cool-down + boss-drop, без вариативности.
- Minion spawn / sub-boss в bossfight — **M5+**.
- Active abilities / cooldowns — **M5+ refactor path**.

---

## M6 — Радио и доверие

### M6.1 — Шкала доверия

| Параметр | Значение |
|---|---|
| `GameState.progress.radio_trust` | integer, init = `0` |
| Clamp range | `[−5, +5]` |
| Clamp formula | `Math.max(-5, Math.min(5, radio_trust + impact))` |
| Impact timing | Ровно 1 раз при выборе опции (`respond` или `ignore`) |
| Expired without choice | Auto-resolve с `chosen_option = null`, impact = `trust_impact.ignore` |

### M6.2 — Trust impact matrix по типу сигнала

| Signal type | `respond` trust | `ignore` trust |
|---|---:|---:|
| `truth` | +2 | −1 |
| `trap` | −2 | +1 |
| `ambiguous` | per-signal (см. §M6.3) | per-signal (см. §M6.3) |

> **Note:** truth и trap имеют фиксированные trust impacts. Ambiguous — **exact per-signal row** в §M6.3 ниже (нет единого «mixed» значения).

### M6.3 — 6 сигнальных архетипов (exact rows)

| # | id suggestion | type | zone_id | from | subject | reward | trap_mob_id | expires_after_sorties | trust: respond | trust: ignore |
|---|---|---|---|---|---|---|---|---:|---:|---:|
| 1 | `radio_supply_drop` | truth | forest | caravan | Караван: сброс припасов | `{item_id: "bandage", count: 2}` | null | 4 | +2 | −1 |
| 2 | `radio_drone_cache` | truth | warehouse | relic_drone | Дрон: координаты схрона | `{item_id: "electronics", count: 2}` | null | 5 | +2 | −1 |
| 3 | `radio_distress_trap` | trap | forest | unknown | SOS: раненые у просеки | null | `marauder` | 3 | −2 | +1 |
| 4 | `radio_medical_ambush` | trap | city | survivor_group_a | Медикаменты в старом госпитале | null | `fanatic_berserker` | 4 | −2 | +1 |
| 5 | `radio_shady_deal` | ambiguous | warehouse | unknown | Подозрительный груз в контейнере | `{item_id: "scrap", count: 3}` | `looter_sniper` | 4 | +1 | −1 |
| 6 | `radio_partial_sos` | ambiguous | city | survivor_group_a | Частичный SOS: обрывки информации | `{item_id: "medical_supplies", count: 1}` | `pack_rat` | 3 | +1 | 0 |

> **Ambiguous trust values exact per row:** `radio_shady_deal` respond=+1, ignore=−1; `radio_partial_sos` respond=+1, ignore=0. Никаких «mixed» формулировок — каждая строка имеет конкретные целые числа.

### M6.4 — Sanity checks

| Check | Result |
|---|---|
| All `reward.item_id` ∈ items.json | ✓ bandage, electronics, scrap, medical_supplies — M1/M3 existing items |
| All `trap_mob_id` ∈ mobs.json, role≠boss | ✓ marauder, fanatic_berserker, looter_sniper, pack_rat — regular mobs |
| Reward counts sane (≤3) | ✓ max count = 3 (scrap) |
| Ambush mobs zone-consistent | ✓ marauder∈forest, fanatic_berserker∈city, looter_sniper∈warehouse, pack_rat∈city |
| `expires_after_sorties` range 3-5 | ✓ min=3, max=5 |
| Trust impact ∈ {−2, −1, 0, +1, +2} | ✓ |
| 6 signals: 2 truth + 2 trap + 2 ambiguous | ✓ |
| No T4 / new items / new mobs / boss mobs | ✓ |
| M3 dummy migration | Content M6 replaces 3 dummies with 6 canonical signals |

### M6.5 — Ambush detail

Ambush запускает бой с 1 mob указанным в `trap_mob_id`:
- Бой через существующий CombatScene (no new mechanics).
- Mob stats = из `content/mobs.json` (regular mob values).
- После боя: loot от mob + возврат в RadioScene/BaseScene.
- Ambush не создаёт sortie context — Engineer реализует как single-encounter state.

### M6.6 — Скоуп (что НЕ в balance.md M6)

- Yandex SDK / Cloud Saves / Leaderboard / IAP / rewarded ads — **M8**.
- Новые зоны / мобы / боссы / T4 gear — **не M6**.
- Модульное оружие / брони-слоты / runes — **M5+**.
- Skill tree / active abilities / cooldowns — **не M6**.
- Faction-specific reputation — **M7+** (M6 global trust only).
- Real-time/background timers — **не M6** (sortie-based expiry only).
- Новые combat mechanics — **не M6** (ambush uses existing CombatScene).
- Voice/audio/sound — **M7 polish**.

---

## M7 — Полировка, баланс и расширение контента

> Скоуп: балансный тюнинг M2–M6, 6 новых зон, 45 новых предметов, 24 новых рецепта, 10 UI SFX, 16 визуальных tween'ов, smoke regression.

### M7.1 — Balance Tuning Pass (Before/After M2–M6)

**Hero baseline**

| Параметр | M6 | M7 | Δ |
|---|---|---|---|
| `hero.hp_max` | 100 | 100 | 0 |
| `hero.base_speed` | 100 | 105 | +5 |
| `hero.max_weight_kg` | 30 | 32 | +2 |
| `hero.start_level` | 1 | 1 | 0 |

**Mob stat fine-tune (8 regular + 3 boss)**

| id | name_ru | xp_reward M6 | xp_reward M7 | damage_min M6 | damage_min M7 | damage_max M6 | damage_max M7 |
|---|---|---|---|---|---|---|---|
| `marauder` | Мародёр | 18 | 18 | 5 | 5 | 8 | 8 |
| `wild_dog` | Дикий пёс | 14 | 14 | 8 | 8 | 12 | 12 |
| `mutant` | Мутант | 45 | 45 | 10 | 10 | 15 | 15 |
| `looter_sniper` | Мародёр-снайпер | 28 | 28 | 9 | 9 | 13 | 13 |
| `armored_guard` | Бронированный охранник | 36 | 36 | 7 | 7 | 10 | 10 |
| `fanatic_berserker` | Фанатик-берсерк | 42 | 42 | 8 | 8 | 12 | 12 |
| `pack_rat` | Стайная крыса-мутант | 22 | 22 | 6 | 6 | 9 | 9 |
| `relic_drone` | Реликтовый дрон | 50 | 50 | 8 | 8 | 11 | 11 |
| `forest_alpha_mutant` | Альфа-мутант | 150 | 150 | 20 | 20 | 30 | 30 |
| `warehouse_drone_prime` | Прайм-дрон | 200 | 200 | 25 | 25 | 35 | 35 |
| `city_guard_captain` | Капитан охраны | 250 | 250 | 22 | 22 | 32 | 32 |

> M7 tuning pass сохраняет все M2–M6 числа; таблица — верификация before/after для smoke regression.

**Weapon / Armor gap T1→T2→T3**

| Type | Tier | Benchmark (damage_avg / defense) | Gap vs lower tier |
|---|---|---|---|
| Melee | T1 (`knife` 4-7) | 5.5 | — |
| Melee | T2 (`crowbar` 7-11) | 9.0 | ×1.6 vs T1 |
| Melee | T3 (`composite_blade` 24-32) | 28.0 | ×3.1 vs T2 |
| Ranged | T1 (`makeshift_pistol` 9-14) | 11.5 | — |
| Ranged | T2 (`pipe_rifle` 14-20) | 17.0 | ×1.5 vs T1 |
| Ranged | T3 (`prime_shotgun` 27-37) | 32.0 | ×1.9 vs T2 |
| Armor | T1 (`cloth_jacket` def 1) | 1 | — |
| Armor | T2 (`tactical_vest` def 4) | 4 | ×4.0 vs T1 |
| Armor | T3 (`captain_armor` def 12) | 12 | ×3.0 vs T2 |

**Economy & Return tuning (multipliers for 9 zones)**

| id | return_mult M7 | drop_mult M7 |
|---|---|---|
| `forest` | 1.0 | 1.0 |
| `suburbs` | 1.0 | 0.9 |
| `school` | 1.1 | 1.0 |
| `warehouse` | 1.2 | 1.0 |
| `factory` | 1.3 | 1.1 |
| `hospital` | 1.3 | 1.0 |
| `city` | 1.5 | 1.0 |
| `metro` | 1.6 | 1.1 |
| `power_plant` | 1.8 | 1.2 |

**Perk & Progression sanity check**

Все 8 перков M4 и fallback `veteran_conditioning` остаются валидными при 9-зонной экономике. Никаких изменений значений perk'ов на M7.

---

### M7.2 — 9-Zone Master Table

| id | unlock_condition | risk_rating | mob_pool | item_pool (resources) | return_mult | drop_mult |
|---|---|---|---|---|---|---|
| `forest` | `start` | 1 | `marauder`, `wild_dog`, `mutant` | `wood`, `scrap`, `cloth`, `food`, `water`, `gunpowder`, `leather`, `rope` | 1.0 | 1.0 |
| `suburbs` | `any_forest_sortie_completed` | 1 | `marauder`, `wild_dog`, `pack_rat` | `wood`, `scrap`, `cloth`, `food`, `water`, `gunpowder`, `leather`, `rope`, `suburban_scrap`, `garden_seed` | 1.0 | 0.9 |
| `school` | `suburbs_sortie_completed` | 2 | `marauder`, `looter_sniper`, `pack_rat` | `wood`, `scrap`, `cloth`, `food`, `water`, `gunpowder`, `leather`, `rope`, `school_book`, `broken_tablet` | 1.1 | 1.0 |
| `warehouse` | `forest_depth_2_completed` | 2 | `marauder`, `looter_sniper`, `armored_guard`, `relic_drone` | `wood`, `scrap`, `cloth`, `electronics`, `oil`, `gunpowder`, `leather` | 1.2 | 1.0 |
| `factory` | `warehouse_boss_defeated` | 3 | `mutant`, `armored_guard`, `relic_drone` | `scrap`, `cloth`, `food`, `water`, `gunpowder`, `leather`, `machine_part`, `industrial_cable` | 1.3 | 1.1 |
| `hospital` | `factory_sortie_completed` | 3 | `mutant`, `fanatic_berserker`, `pack_rat` | `scrap`, `cloth`, `food`, `water`, `gunpowder`, `leather`, `hospital_supply`, `sterile_wrap` | 1.3 | 1.0 |
| `city` | `any_warehouse_sortie_completed` | 4 | `mutant`, `fanatic_berserker`, `pack_rat`, `relic_drone` | `scrap`, `cloth`, `food`, `water`, `medical_supplies`, `circuitry`, `gunpowder`, `leather` | 1.5 | 1.0 |
| `metro` | `city_boss_defeated` | 4 | `looter_sniper`, `armored_guard`, `fanatic_berserker`, `relic_drone` | `scrap`, `cloth`, `food`, `water`, `gunpowder`, `leather`, `metro_token`, `rail_shard` | 1.6 | 1.1 |
| `power_plant` | `metro_sortie_completed` | 5 | `mutant`, `armored_guard`, `fanatic_berserker`, `relic_drone` | `scrap`, `cloth`, `gunpowder`, `leather`, `reactor_ash`, `copper_coil` | 1.8 | 1.2 |

> Боссы (`forest_alpha_mutant`, `warehouse_drone_prime`, `city_guard_captain`) остаются в `forest`, `warehouse`, `city` depth 3 и дейли-инстансах.

**Depth config — новые зоны**

`suburbs`:

| depth | enemy_count | resource_count | min_player_level | fights_per_depth |
|---|---|---|---|---|
| 1 | [1, 2] | [2, 4] | 1 | 2 |
| 2 | [2, 3] | [3, 5] | 2 | 3 |
| 3 | [2, 4] | [4, 6] | 3 | 4 |

`school`:

| depth | enemy_count | resource_count | min_player_level | fights_per_depth |
|---|---|---|---|---|
| 1 | [1, 2] | [2, 4] | 1 | 2 |
| 2 | [2, 3] | [3, 5] | 2 | 3 |
| 3 | [2, 4] | [4, 6] | 3 | 4 |

`factory`:

| depth | enemy_count | resource_count | min_player_level | fights_per_depth |
|---|---|---|---|---|
| 1 | [1, 2] | [2, 4] | 2 | 2 |
| 2 | [2, 3] | [3, 5] | 3 | 3 |
| 3 | [2, 4] | [4, 6] | 4 | 4 |

`hospital`:

| depth | enemy_count | resource_count | min_player_level | fights_per_depth |
|---|---|---|---|---|
| 1 | [1, 2] | [2, 4] | 2 | 2 |
| 2 | [2, 3] | [3, 5] | 3 | 3 |
| 3 | [2, 4] | [4, 6] | 4 | 4 |

`metro`:

| depth | enemy_count | resource_count | min_player_level | fights_per_depth |
|---|---|---|---|---|
| 1 | [2, 3] | [2, 4] | 3 | 2 |
| 2 | [2, 4] | [3, 5] | 4 | 3 |
| 3 | [3, 5] | [4, 7] | 5 | 4 |

`power_plant`:

| depth | enemy_count | resource_count | min_player_level | fights_per_depth |
|---|---|---|---|---|
| 1 | [2, 3] | [2, 4] | 4 | 2 |
| 2 | [2, 4] | [3, 5] | 5 | 3 |
| 3 | [3, 5] | [4, 7] | 6 | 4 |

---

### M7.3 — 80-Item Taxonomy (45 New)

**Item delta table (45 rows)**

| id | name_ru | type | tier | zone_origin | weight_kg | recipe_id | notes |
|---|---|---|---|---|---|---|---|
| `suburban_scrap` | Пригородный лом | resource | 1 | suburbs | 2.0 | null | Новый T1 ресурс |
| `garden_seed` | Семена из грядки | resource | 1 | suburbs | 0.5 | null | Новый T1 ресурс |
| `school_book` | Учебник | resource | 1 | school | 1.0 | null | Новый T1 ресурс |
| `broken_tablet` | Разбитый планшет | resource | 1 | school | 0.5 | null | Новый T1 ресурс |
| `machine_part` | Деталь станка | resource | 1 | factory | 3.0 | null | Новый T1 ресурс |
| `industrial_cable` | Кабель заводской | resource | 1 | factory | 2.0 | null | Новый T1 ресурс |
| `hospital_supply` | Медицинский набор | resource | 1 | hospital | 0.5 | null | Новый T1 ресурс |
| `sterile_wrap` | Стерильная плёнка | resource | 1 | hospital | 0.3 | null | Новый T1 ресурс |
| `metro_token` | Жетон метро | resource | 1 | metro | 0.1 | null | Новый T1 ресурс |
| `rail_shard` | Осколок рельса | resource | 1 | metro | 1.5 | null | Новый T1 ресурс |
| `reactor_ash` | Зола реактора | resource | 1 | power_plant | 1.0 | null | Новый T1 ресурс |
| `copper_coil` | Медная катушка | resource | 1 | power_plant | 1.5 | null | Новый T1 ресурс |
| `shiv` | Заточка | weapon_melee | 2 | universal | 0.3 | `recipe_shiv` | Лёгкий T2 melee |
| `machete` | Мачете | weapon_melee | 2 | universal | 1.5 | `recipe_machete` | Средний T2 melee |
| `sledgehammer` | Кувалда | weapon_melee | 2 | universal | 3.5 | `recipe_sledgehammer` | Тяжёлый T2 melee |
| `crossbow` | Арбалет | weapon_ranged | 2 | universal | 2.0 | `recipe_crossbow` | Тихий T2 ranged |
| `hunting_rifle` | Охотничья винтовка | weapon_ranged | 2 | universal | 3.0 | `recipe_hunting_rifle` | Мощный T2 ranged |
| `spear` | Копьё | weapon_melee | 2 | universal | 2.0 | null | Loot-only T2 melee |
| `flare_pistol` | Ракетница | weapon_ranged | 2 | universal | 1.0 | null | Loot-only T2 ranged |
| `cleaver` | Тесак | weapon_melee | 2 | universal | 1.2 | null | Loot-only T2 melee |
| `sawed_off` | Обрез | weapon_ranged | 2 | universal | 2.0 | null | Loot-only T2 ranged |
| `riot_shield` | Щит полицейский | armor | 2 | universal | 4.0 | `recipe_riot_shield` | Тяжёлый T2 armor |
| `scout_mask` | Маска разведчика | armor | 2 | universal | 0.3 | `recipe_scout_mask` | Лёгкий T2 armor |
| `padded_coat` | Стёганка | armor | 2 | universal | 2.0 | `recipe_padded_coat` | Средний T2 armor |
| `ballistic_vest` | Бронежилет | armor | 2 | universal | 3.5 | `recipe_ballistic_vest` | Высокий def T2 |
| `medical_gown` | Халат хирурга | armor | 2 | universal | 0.5 | `recipe_medical_gown` | Лёгкий T2 armor |
| `insulated_vest` | Изолированный жилет | armor | 2 | universal | 2.5 | `recipe_insulated_vest` | Средний T2 armor |
| `metal_helm` | Стальной шлем | armor | 2 | universal | 1.5 | `recipe_metal_helm` | Голова T2 armor |
| `reinforced_gloves` | Усиленные перчатки | armor | 2 | universal | 0.3 | null | Loot-only T2 armor |
| `tactical_pants` | Тактические штаны | armor | 2 | universal | 1.2 | null | Loot-only T2 armor |
| `heal_salve` | Целительная мазь | consumable | 2 | universal | 0.4 | `recipe_heal_salve` | Heal 30 |
| `stimpack` | Стимулятор | consumable | 2 | universal | 0.6 | `recipe_stimpack` | Heal 65 |
| `adrenaline_shot` | Адреналин | consumable | 2 | universal | 0.3 | `recipe_adrenaline_shot` | Initiative +30 |
| `tear_gas` | Слезоточивый газ | consumable | 2 | universal | 0.4 | `recipe_tear_gas` | Cover boost 75 |
| `ammo_bolt` | Болты | consumable | 2 | universal | 0.3 | `recipe_ammo_bolt` | Ammo refill 1 |
| `ammo_flare` | Ракеты | consumable | 2 | universal | 0.4 | `recipe_ammo_flare` | Ammo refill 1 |
| `electrolyte` | Электролит | consumable | 2 | universal | 0.2 | `recipe_electrolyte` | Initiative +15 |
| `speed_drug` | Ускоритель | consumable | 2 | universal | 0.4 | `recipe_speed_drug` | Initiative +45 |
| `decoy_flare` | Ложная ракета | consumable | 2 | universal | 0.3 | `recipe_decoy_flare` | Cover boost 30 |
| `pulse_grenade` | Импульсная граната | consumable | 2 | universal | 0.5 | `recipe_pulse_grenade` | Mech disable 1 |
| `smoke_grenade` | Дымовая граната | consumable | 2 | universal | 0.4 | `recipe_smoke_grenade` | Cover boost 60 |
| `energy_gel` | Энергогель | consumable | 2 | universal | 0.2 | `recipe_energy_gel` | Initiative +25 |
| `ration_bar` | Сухпаёк | consumable | 2 | universal | 0.2 | null | Loot-only heal 20 |
| `healing_patch` | Пластырь | consumable | 2 | universal | 0.2 | null | Loot-only heal 35 |
| `makeshift_grenade` | Самодельная граната | consumable | 2 | universal | 0.4 | null | Loot-only cover 40 |

**Recipe delta table (24 rows)**

| id | result_id | result_count | ingredients | tier | unlock_condition |
|---|---|---|---|---|---|
| `recipe_shiv` | `shiv` | 1 | `suburban_scrap` x2, `rope` x1 | 2 | null |
| `recipe_machete` | `machete` | 1 | `wood` x3, `suburban_scrap` x2, `oil` x1 | 2 | null |
| `recipe_sledgehammer` | `sledgehammer` | 1 | `scrap` x6, `wood` x2, `machine_part` x1 | 2 | null |
| `recipe_crossbow` | `crossbow` | 1 | `wood` x3, `industrial_cable` x2, `rope` x1 | 2 | null |
| `recipe_hunting_rifle` | `hunting_rifle` | 1 | `scrap` x5, `machine_part` x1, `gunpowder` x2 | 2 | null |
| `recipe_riot_shield` | `riot_shield` | 1 | `scrap` x4, `leather` x2, `machine_part` x1 | 2 | null |
| `recipe_scout_mask` | `scout_mask` | 1 | `cloth` x2, `school_book` x1 | 2 | null |
| `recipe_padded_coat` | `padded_coat` | 1 | `cloth` x4, `leather` x2, `garden_seed` x1 | 2 | null |
| `recipe_ballistic_vest` | `ballistic_vest` | 1 | `scrap` x5, `industrial_cable` x2, `electronics` x1 | 2 | null |
| `recipe_medical_gown` | `medical_gown` | 1 | `cloth` x3, `sterile_wrap` x1 | 2 | null |
| `recipe_insulated_vest` | `insulated_vest` | 1 | `scrap` x3, `copper_coil` x2, `cloth` x2 | 2 | null |
| `recipe_metal_helm` | `metal_helm` | 1 | `scrap` x2, `copper_coil` x1 | 2 | null |
| `recipe_heal_salve` | `heal_salve` | 1 | `cloth` x2, `garden_seed` x1 | 2 | null |
| `recipe_stimpack` | `stimpack` | 1 | `medical_supplies` x1, `bandage` x1, `hospital_supply` x1 | 2 | null |
| `recipe_adrenaline_shot` | `adrenaline_shot` | 1 | `medical_supplies` x1, `sterile_wrap` x1 | 2 | null |
| `recipe_tear_gas` | `tear_gas` | 1 | `gunpowder` x2, `industrial_cable` x1, `oil` x1 | 2 | null |
| `recipe_ammo_bolt` | `ammo_bolt` | 5 | `scrap` x1, `rail_shard` x1 | 2 | null |
| `recipe_ammo_flare` | `ammo_flare` | 5 | `gunpowder` x1, `scrap` x1, `school_book` x1 | 2 | null |
| `recipe_electrolyte` | `electrolyte` | 2 | `water` x2, `hospital_supply` x1 | 2 | null |
| `recipe_speed_drug` | `speed_drug` | 1 | `medical_supplies` x1, `reactor_ash` x1 | 2 | null |
| `recipe_decoy_flare` | `decoy_flare` | 1 | `gunpowder` x1, `metro_token` x1, `scrap` x1 | 2 | null |
| `recipe_pulse_grenade` | `pulse_grenade` | 1 | `electronics` x1, `machine_part` x1, `gunpowder` x1 | 2 | null |
| `recipe_smoke_grenade` | `smoke_grenade` | 1 | `cloth` x2, `rail_shard` x1, `gunpowder` x1 | 2 | null |
| `recipe_energy_gel` | `energy_gel` | 1 | `water` x1, `broken_tablet` x1, `medical_supplies` x1 | 2 | null |

**Coverage matrix: новые зонные ресурсы → рецепты**

| Ресурс | Рецепты использующие ресурс |
|---|---|
| `suburban_scrap` | `recipe_shiv`, `recipe_machete` |
| `garden_seed` | `recipe_padded_coat`, `recipe_heal_salve` |
| `school_book` | `recipe_scout_mask`, `recipe_ammo_flare` |
| `broken_tablet` | `recipe_energy_gel` |
| `machine_part` | `recipe_sledgehammer`, `recipe_riot_shield`, `recipe_hunting_rifle`, `recipe_pulse_grenade` |
| `industrial_cable` | `recipe_crossbow`, `recipe_ballistic_vest`, `recipe_tear_gas` |
| `hospital_supply` | `recipe_stimpack`, `recipe_electrolyte` |
| `sterile_wrap` | `recipe_adrenaline_shot`, `recipe_medical_gown` |
| `metro_token` | `recipe_decoy_flare` |
| `rail_shard` | `recipe_smoke_grenade`, `recipe_ammo_bolt` |
| `reactor_ash` | `recipe_speed_drug` |
| `copper_coil` | `recipe_insulated_vest`, `recipe_metal_helm` |

---

### M7.4 — SFX Registry (10)

| trigger_id | scene | event | recommended_volume | max_duration_ms | asset_pattern |
|---|---|---|---|---|---|
| `sfx_hit` | CombatScene | damage dealt / taken | 0.8 | 800 | `sfx_hit_{N}.wav` |
| `sfx_heal` | CombatScene, InventoryScene | heal consumable used | 0.7 | 600 | `sfx_heal_{N}.wav` |
| `sfx_craft` | CraftScene | recipe crafted | 0.6 | 700 | `sfx_craft_{N}.wav` |
| `sfx_loot` | LootScene | item picked up | 0.7 | 500 | `sfx_loot_{N}.wav` |
| `sfx_radio` | RadioScene | signal opened | 0.5 | 900 | `sfx_radio_{N}.wav` |
| `sfx_menu_click` | Any UI | button pressed | 0.4 | 300 | `sfx_click_{N}.wav` |
| `sfx_level_up` | LevelUpScene | level gained | 0.9 | 1000 | `sfx_levelup_{N}.wav` |
| `sfx_boss_phase` | CombatScene | boss phase transition | 0.9 | 1000 | `sfx_bossphase_{N}.wav` |
| `sfx_blocked` | CombatScene | attack blocked by cover | 0.6 | 400 | `sfx_blocked_{N}.wav` |
| `sfx_confirm` | Any UI | positive confirm | 0.5 | 400 | `sfx_confirm_{N}.wav` |

---

### M7.5 — Tween Registry (16)

| event_id | scene_target | trigger_condition | duration_ms | easing | effect |
|---|---|---|---|---|---|
| `tween_damage_flash` | CombatScene | hero takes damage | 200 | Linear | red overlay alpha 0→0.3→0 |
| `tween_hit_shake` | CombatScene | any unit hit | 150 | Elastic.Out | camera offset ±2 px |
| `tween_heal_pulse` | CombatScene | heal applied | 400 | Sine.Out | target scale 1→1.2→1 |
| `tween_loot_bounce` | LootScene | item picked | 300 | Back.Out | icon y -10 px bounce |
| `tween_craft_spin` | CraftScene | craft success | 500 | Cubic.InOut | icon rotation 0→360° |
| `tween_menu_hover` | BaseScene | button hover | 150 | Sine.Out | scale 1→1.05 |
| `tween_level_up_glow` | LevelUpScene | level up | 600 | Sine.InOut | gold glow alpha 0→1→0 |
| `tween_boss_phase_red` | CombatScene | boss phase swap | 400 | Quintic.Out | boss red tint flash |
| `tween_return_walk` | ReturnScene | return start | 1000 | Linear | hero sprite x +20 px |
| `tween_xp_bar_fill` | LevelUpScene | xp added | 300 | Cubic.Out | bar width to target% |
| `tween_radio_static` | RadioScene | signal list open | 250 | Linear | static alpha flicker 0.2→0.8 |
| `tween_gas_warning` | CombatScene | gas tick | 200 | Linear | yellow border alpha 0→0.5→0 |
| `tween_sortie_enter` | SortieScene | depth selected | 400 | Sine.Out | overlay alpha 1→0 |
| `tween_defeat_fade` | CombatScene | hero defeated | 500 | Quadratic.Out | screen fade to black |
| `tween_perk_card_deal` | LevelUpScene | perk shown | 300 | Back.Out | card slide y +50→0 |
| `tween_item_tooltip` | InventoryScene | item hover | 150 | Linear | tooltip alpha 0→1 |

---

### M7.6 — Test & Build Contract

| Gate | Metric | Target |
|---|---|---|
| M7 vitest | PASS | 176/176 |
| M7 build | JS bundle | ≤ 2 MB |
| M7 assets | total assets | ≤ 730 KB |
| M7 audio | SFX files | ≤ 80 KB |

---

### M7.7 — Count Verification

| Entity | M6 Count | M7 Count | Delta | Status |
|---|---|---|---|---|
| zones | 3 | 9 | +6 | ✓ |
| items | 35 | 80 | +45 | ✓ |
| recipes | 18 | 42 | +24 | ✓ |
| SFX | 0 | 10 | +10 | ✓ |
| tweens | 0 | 16 | +16 | ✓ |
| tests | 164 | 176 | +12 | ✓ |

---

## M8a — Платформа и персистентность

> **Скоуп:** throttle/quota константы для cloud-save подсистемы M8a. Все константы связаны с Yandex Games SDK лимитами и fail-soft политикой.
>
> Спека механик — в [`docs/GDD.md` §13a](./GDD.md#13a--платформа-yandex-games-persistence-mobile-first-m8a).

| Параметр | Значение | Комментарий |
|---|---|---|
| `MIN_CLOUD_SAVE_INTERVAL_S` | 10 | Минимальный интервал между cloud-save вызовами (сек). Throttle guard. |
| `YANDEX_PLAYER_DATA_QUOTA_BYTES` | 204800 | ≈200 KB, документированный лимит Yandex player data. |
| `EXPECTED_SNAPSHOT_SIZE_BYTES` | ~2048 | ≈2 KB на один snapshot (GameState). Оценка; запас quota > ×20. |
| `SETTINGS_DEFAULT_MUTE` | false | Default значения при отсутствии remote snapshot. |
| `SETTINGS_DEFAULT_VOLUME` | 1.0 | Default значения при отсутствии remote snapshot. |

**Sanity check:** `EXPECTED_SNAPSHOT_SIZE_BYTES` ~2 KB при quota ~200 KB → запас ×100 даже с метаданными SDK. Schema safe.

---

## §M8b — Монетизация

> Числа rewarded rewards, IAP каталог, ads-remover behaviour. Все параметры для Engineer и QA Acceptance.

### Rewarded Video Rewards

| Parameter | Value | Notes |
|---|---|---|
| `REWARDED_LOOT_MULTIPLIER` | 2.0 | ×2 all resource items in sortie loot |
| `SECOND_CHANCE_HP_FRACTION` | 0.5 | 50% max HP restored |
| `SECOND_CHANCE_MAX_PER_SORTIE` | 1 | One second-chance per sortie |
| `DAILY_RESET_REWARDED_COOLDOWN` | 1 | One per sortie (только если кулдаун > 0) |
| `GAS_REWARDED_AMOUNT` | 1 | +1 gas |
| `GAS_REWARDED_COOLDOWN_S` | 300 | 5 min между rewarded gas refills |

### IAP Catalog (создаётся в Yandex Developer Console)

| ID | Name RU | Type | Price YAN | Reward |
|---|---|---|---|---|
| `disable_ads` | Отключить рекламу | non-consumable | 99 | Все ads → instant/no |
| `starter_pack` | Стартовый набор | consumable | 49 | +5 bandage, +3 scrap, +2 electronics → baseStash |
| `gas_pack` | Бак топлива | consumable | 29 | +3 gas |

**Consume flow (consumable):** reward FIRST, `consumePurchase(token)` SECOND.

**Unprocessed check (boot):** `getPurchases()` → foreach consumable → reward → consume. Mandatory per Yandex moderation §1.13.1.

### Ads-Remover Behaviour

При `disable_ads` purchased:

| Component | Without disable_ads | With disable_ads |
|---|---|---|
| Rewarded trigger button | Show ad → onRewarded → reward | Instant reward, text changes |
| Interstitial | Show between ReturnScene → BaseScene | Skip, instant transition |
| Sticky banner | Show/hide per scene | Always hidden |

`ads_removed` флаг хранится в рантайме; не в cloud-save (восстанавливается из `getPurchases()` при каждом boot).
