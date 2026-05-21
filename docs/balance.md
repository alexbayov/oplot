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
| `marauder` | Мародёр | human | 18 | 5 | 8 | 1 | 90 | 10 | aggressive (`flee` при HP<30%) | forest | 1 |
| `wild_dog` | Дикий пёс | animal | 20 | 8 | 12 | 0 | 120 | 8 | aggressive | forest | 1 |
| `mutant` | Мутант | mutant | 60 | 10 | 15 | 3 | 70 | 25 | aggressive | forest | 2 |

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
| `looter_sniper` | Мародёр-снайпер | human | 22 | 9 | 13 | 1 | 95 | 14 | aggressive | `ranged_keep_distance` | warehouse | 2 |
| `armored_guard` | Бронированный охранник | human | 35 | 7 | 10 | 4 | 75 | 18 | defensive | `defensive_cover` | warehouse | 2 |
| `fanatic_berserker` | Фанатик-берсерк | human | 40 | 8 | 12 | 2 | 100 | 22 | aggressive | `berserker_low_hp` | city | 3 |
| `pack_rat` | Стайная крыса-мутант | mutant | 15 | 6 | 9 | 0 | 110 | 9 | aggressive | `pack_bonus_when_paired` | city | 3 |
| `relic_drone` | Реликтовый дрон | mech | 28 | 8 | 11 | 5 | 90 | 20 | aggressive | `armor_piercing_ranged` | warehouse,city (bridge) | 3 |

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
- Модули оружия / брони (head-slot, accessory slots, runes) — **M5+** (см. GDD §11 placeholder).
- Радио: rewards, ambush damage, trust scale, faction reputation — **M6** (см. GDD §10 placeholder).
- IAP, реклама, Yandex SDK rewards — **M8** (см. GDD §12 placeholder).
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
