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
- Числа второй и далее зоны (`warehouse`, `city`) — **M3**.
- Радио-события, шкала доверия, награды/штрафы радио — **M6**.
- IAP, реклама, Yandex SDK rewards — **M8**.
