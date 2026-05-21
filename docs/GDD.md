# Game Design Document — «Оплот»

> Этот документ — **единственный источник правды** по игровым механикам.
> Если чего-то нет здесь — этого нет в игре.
> Все числа — в [`balance.md`](./balance.md).

## High Concept

Одиночка выживает в заброшенном городе после техногенной катастрофы. Core loop: вылазки за ресурсами → пошаговый бой → лут с системой веса → крафт экипировки → развитие базы (Оплот).

> **Long-term vision (вне скоупа M1–M2):** модульная экипировка, перки, мульти-зоны, радио и доверие, мини-боссы. На M1–M2 крафт ограничен 5 рецептами и нерасширяемой экипировкой (см. §4 и §7.2). Подробности — в заглушках §11+ внизу документа.

## Платформа и ограничения

- Яндекс.Игры (HTML5)
- Mobile-first (портрет 375x667+)
- Bundle < 5 MB
- Phaser 3 + TypeScript + Vite

## Скоуп текущей версии GDD

Этот документ покрывает **только M1–M2 (MVP)**. Все более поздние системы (радио, перки, модульная броня, боссы, монетизация) остаются заглушками и заполняются на своих вехах. Любая фича вне M1–M2-скоупа описанных секций — это scope creep, который блокирует QA.

---

## Системы

> Формат каждой секции — см. `staff/roles/GAME_DESIGNER.md`:
> Описание → Flow → Формулы (ссылки на `balance.md`) → Edge-cases → Связь с другими системами.

---

### 1. Core Loop (Вылазка) — MVP, M1–M2

#### Описание

Core loop игры — это замкнутый цикл «база → вылазка → бой → лут → возврат → крафт». Игрок управляет одним героем (Одиночкой), который выходит из своего Оплота (база) в зону, проходит серию пошаговых боёв, собирает лут с учётом ограничения по весу и возвращается на базу, чтобы скрафтить новую экипировку. На MVP доступна **одна зона — Лес** с тремя уровнями глубины. Глубже = больше ресурсов и опасности, но обратная дорога длиннее.

Цель loop'а на MVP — дать игроку прочувствовать ключевое напряжение игры: **вес = жадность vs выживание**. Чем больше ты тащишь, тем медленнее ты в бою и тем медленнее возврат.

#### Flow

```
[BaseScene: Оплот]
    │ кнопка «Вылазка»
    ▼
[MapScene: выбор зоны]
    │ в MVP доступна только зона "forest"
    ▼
[SortieScene: выбор глубины 1 / 2 / 3]
    │ player_level >= min_player_level требуется для глубины 2 и 3
    ▼
[CombatScene: бой 1 — 1..3 моба]
    │ победа → следующий бой; поражение → -50% лута → BaseScene
    ▼
[CombatScene: бой 2..N — серия боёв этого depth]
    │ кол-во боёв на depth: 2 (для depth=1), 3 (depth=2), 4 (depth=3)
    ▼
[LootScene: экран лута]
    │ игрок выбирает что забрать; учитывается вес
    ▼
[ReturnScene: возврат на базу]
    │ длительность возврата зависит от веса (см. формулы)
    ▼
[BaseScene → CraftScene → InventoryScene → ...]
```

#### Формулы

Числа — в [`balance.md` §Core Loop](./balance.md#core-loop).

```
return_time_s = base_return_time * (1 + (cur_weight / max_weight) * weight_penalty_factor)
loot_loss_on_defeat = 0.5   # доля выбрасываемого веса лута при поражении (правило в §3)
```

#### Edge-cases

- **Перегруз (`cur_weight > max_weight`):** игрок не может покинуть LootScene, пока не выбросит вес ниже max. UI блокирует кнопку «Возврат».
- **Поражение героя (HP = 0):** герой просыпается на базе с **50% потерей лута, набранного в этой вылазке** (см. §3 — правило отбрасывания). Экипировка героя (оружие, броня) НЕ теряется в MVP. Прогресс XP за убитых до поражения мобов **сохраняется**.
- **Игрок прерывает вылазку:** после любого боя на LootScene есть кнопка «Возврат на базу». Лут не теряется, оставшиеся бои на этой глубине пропускаются.
- **Минимальный уровень depth:** depth=2 требует `player_level >= 3`, depth=3 — `>= 5`. Если уровень ниже — UI кнопки заблокирован.

#### Связь с другими системами

- **§2 Бой:** Core loop передаёт `CombatScene` массив мобов из `zones.json[depth].enemies` + `enemy_count`.
- **§3 Инвентарь и вес:** `cur_weight` влияет на `return_time_s` и на инициативу в бою (см. §2).
- **§4 Крафт:** Лут — единственный источник ресурсов для крафта.
- **§5 Мобы:** Конкретные дроп-таблицы и поведение определяют, какие ресурсы и сколько игрок может вынести.

---

### 2. Боевая система — MVP, M1–M2

#### Описание

Бой — **пошаговый, полу-автоматический**. На каждом ходу действуют сначала те юниты, у кого выше `initiative`, потом по убыванию. Игрок управляет одним героем; враги действуют по фиксированному AI-поведению (см. §5). Действий у игрока 3, никаких комбо или способностей в MVP. Цель MVP-боя — научить игрока тратить ходы между атакой, защитой и лечением.

Доступны два типа оружия: **ближний бой** (`knife`) и **стрелковый** (`makeshift_pistol`). У ближнего нет расходников и нет шума; у стрелкового — патроны и шум.

#### Flow

```
[бой стартует]
    │ Phaser CombatScene получает: [hero, mob1, mob2, ...]
    ▼
[расчёт initiative для всех юнитов]
    │ initiative = base_speed - (cur_weight / max_weight) * 50  (только герой)
    │ у мобов initiative = базовый base_speed (вес не считаем)
    ▼
[turn order: сортировка по убыванию initiative]
    ▼
[раунд]
    │ для каждого юнита в turn order:
    │     если герой → ждём ввода игрока (Атака / Укрытие / Аптечка)
    │     если моб   → AI-действие (см. §5)
    ▼
[конец раунда → проверка победы / поражения]
    │ все мобы мертвы → LootScene
    │ HP героя ≤ 0     → поражение, -50% лута, BaseScene
    │ иначе            → следующий раунд (turn order пересчитывается, если веса изменились)
```

#### Действия игрока (MVP)

| Действие | Что делает | Расходник | Шум |
|---|---|---|---|
| **Атака** | Использует активное оружие. Урон по формуле ниже. | у стрелкового — 1 `ammo_pistol` | нож = низкий, пистолет = средний |
| **Укрытие** | +50% защиты до конца следующего хода героя. Не складывается. | нет | нет |
| **Аптечка** | Расходует 1 `bandage` или `medkit` из инвентаря, восстанавливает HP. | да | нет |

В MVP «Бежать из боя» НЕТ. Все бои до победы или поражения.

#### Формулы

Числа — в [`balance.md` §Combat / §Weapons / §Armor / §Hero](./balance.md#combat). Базовая логика:

```
# Атака
weapon_damage_base = random_uniform(damage_min, damage_max)
roll = random_uniform(0.85, 1.15)
final_damage = max(1, weapon_damage_base * roll - target.armor_value)

# "+50% защиты" от Укрытия:
# на 1 ход target.armor_value += target.armor_value * 0.5

# Инициатива (только герой; вес штрафует)
initiative_hero = hero.base_speed - (cur_weight / max_weight) * 50
initiative_mob  = mob.base_speed

# Перегруз
if cur_weight > max_weight:
    initiative_hero = 0
```

Это канон. Любые комбинации rng — только два указанных броска: первый по диапазону `[damage_min, damage_max]`, второй — общий разброс `[0.85, 1.15]`.

#### Edge-cases

- **`final_damage < 1`:** минимум 1 урон любым ударом, проходящим попадание (в MVP промахов нет).
- **`max_weight = 0`:** деление на ноль исключено — `max_weight` константа из `balance.md`, всегда > 0.
- **Закончились патроны у стрелкового:** действие «Атака» с пистолетом блокируется в UI, остаётся только нож (если есть в инвентаре), Укрытие, Аптечка.
- **Закончились расходники-аптечки:** действие «Аптечка» блокируется в UI.
- **Урон превышает HP моба:** моб мёртв, лишний урон не «переливается» на следующего.
- **Два моба с одинаковой initiative:** AI-моб ходит первым в порядке возрастания индекса в массиве (детерминированно).
- **Эффект «Укрытие» во время хода моба:** эффект применяется, как только активирован, и держится до конца **следующего** хода героя. После следующего хода героя — снимается.

#### Связь с другими системами

- **§3 Инвентарь и вес:** `cur_weight / max_weight` напрямую штрафует `initiative_hero`.
- **§4 Крафт:** Все аптечки и большая часть оружия — крафт.
- **§5 Мобы:** AI-поведение и числовые статы определяют сложность.
- **Лут (§1 Core Loop):** Победа в бою открывает доступ к LootScene.

---

### 3. Инвентарь и вес — MVP, M1–M2

#### Описание

У героя один рюкзак с ограничением по весу — **30 кг на старте M1**. Каждый предмет имеет вес в килограммах (`weight_kg`). Перегруз (>100% от max_weight) штрафует инициативу до нуля и блокирует возврат с вылазки, пока игрок не выбросит лишнее. Вес — главная экономика принятия решений: «забрать тяжёлый, но ценный лут» vs «оставить место под бой и возврат».

В MVP **нет слотов в общем смысле** (нет «10 ячеек» как в Diablo). Есть только сумма по весу. Сортировка инвентаря и отображение — задача UI (§Engineer на M2).

#### Flow

```
[после боя → LootScene]
    │ показывается список выпавших предметов (loot pool)
    │ для каждого — кнопка «Взять» (если по весу не превышает max)
    ▼
[игрок выбирает что взять]
    │ при попытке взять предмет, делающий weight > max:
    │     UI показывает "Перегруз" и блокирует кнопку «Взять»
    ▼
[кнопка «Возврат»]
    │ доступна только если weight ≤ max
    ▼
[ReturnScene → BaseScene → InventoryScene]
    │ полный список того, что в рюкзаке
```

#### Формулы

Числа — в [`balance.md` §Hero / §Resources / §Weight](./balance.md#weight).

```
cur_weight = Σ (item.weight_kg * item.count for item in inventory)
max_weight = HERO_MAX_WEIGHT_KG_BASE        # 30 в MVP, см. balance.md
overweight = cur_weight > max_weight

# Штраф инициативы
initiative_hero = base_speed - (cur_weight / max_weight) * 50
if overweight: initiative_hero = 0

# Скорость возврата
return_time_s = BASE_RETURN_TIME_S * (1 + (cur_weight / max_weight) * WEIGHT_PENALTY_FACTOR)
```

#### Правило отбрасывания при поражении (loot loss 50%)

При поражении героя в бою (HP = 0) автоматически выкидывается **50% веса собранного в этой вылазке лута**. Выбрасывание идёт сверху вниз по убыванию веса предмета (тяжёлое падает первым), пока выкинутый вес не достигнет ≥ 50% веса лута вылазки. Экипировка, надетая до вылазки (оружие в руке, броня), **не считается лутом вылазки** и не теряется в MVP.

Пример: герой собрал 10 кг лута (`wood` x3 = 6 кг + `cloth` x4 = 4 кг). После поражения: выкидывается 5 кг или больше. Сначала падает `wood` x2 = 4 кг (всё ещё < 5 кг), затем `wood` x1 = 2 кг (итого 6 кг ≥ 5). Итог: остался `cloth` x4.

#### Edge-cases

- **`max_weight = 0`:** конструкция запрещена — `HERO_MAX_WEIGHT_KG_BASE` — константа > 0 (см. `balance.md`).
- **Предмет в одном экземпляре весит больше max_weight:** игрок не может его поднять. UI блокирует кнопку. На MVP такого предмета нет, но формула это покрывает.
- **Стак ресурсов:** один и тот же `item.id` суммируется в `count`. Вес считается как `count * weight_kg`.
- **Расходование расходника в бою:** уменьшает `count` (если 0 — предмет уходит из инвентаря). `cur_weight` пересчитывается; инициатива на следующем раунде учитывает новый вес.
- **Возврат без боя (если игрок прерывает вылазку из LootScene):** работает то же правило веса — нельзя уйти с перегрузом.

#### Связь с другими системами

- **§2 Бой:** Инициатива зависит от веса; перегруз = 0 инициативы.
- **§1 Core Loop:** Время возврата зависит от веса.
- **§4 Крафт:** Все ингредиенты — это предметы инвентаря.
- **§5 Мобы:** Их дроп — основной источник пополнения инвентаря.

---

### 4. Крафт (базовый) — MVP, M1–M2

#### Описание

Крафт происходит **только на базе**, в Мастерской. На MVP доступно 5 рецептов (см. §«Канон M1» ниже). Все рецепты разблокированы с начала игры (поле `unlock_condition = null`). Крафт — **мгновенный**: игрок выбирает рецепт, тратятся ингредиенты, в инвентарь сразу попадает результат. Никаких таймеров, очков энергии, шансов на провал, модулей — это всё M3+.

Крафт — единственный способ получить:
- `makeshift_pistol` (нельзя найти в лесу — у мародёров может выпасть только редкий патрон, не само оружие);
- `leather_vest` (нельзя найти, только крафт);
- `bandage` (единственный источник);
- `medkit` (вторичный крафт из бинтов);
- `ammo_pistol` (можно изредка дропнуть с мародёра, основной источник — крафт).

#### Flow

```
[BaseScene → кнопка «Мастерская»]
    │
    ▼
[CraftScene]
    │ показывается список 5 рецептов
    │ для каждого — доступен/недоступен по наличию ингредиентов
    ▼
[игрок выбирает рецепт]
    │ если хватает ингредиентов:
    │     - списываются ингредиенты (по count)
    │     - в инвентарь добавляется result_id × result_count
    │ если не хватает: UI показывает чего не хватает, кнопка заблокирована
    ▼
[остаёмся в CraftScene, можно крафтить ещё]
```

> **M2 deferred:** механика «склад на базе vs рюкзак» (отдельный сторэдж с условно бесконечным весом) формально уходит на M2. На M1 предполагается, что игрок физически на базе и крафт не блокируется весом, потому что результат идёт в логический «инвентарь базы» (для целей MVP — единый список с рюкзаком вылазки). Это уточнение для Engineer / QA.

#### Формулы

Числа — в [`balance.md` §Recipes](./balance.md#recipes).

```
# Проверка возможности крафта
can_craft(recipe, inventory) =
    ∀ ingredient ∈ recipe.ingredients:
        inventory.count(ingredient.item_id) >= ingredient.count

# Применение
apply_craft(recipe, inventory):
    for ing in recipe.ingredients:
        inventory.remove(ing.item_id, ing.count)
    inventory.add(recipe.result_id, recipe.result_count)
```

#### Edge-cases

- **Нет ингредиентов:** UI блокирует кнопку, показывает «не хватает: cloth x2».
- **Крафт того, что и так в инвентаре (стакаемый):** просто увеличивает `count`. Например, крафт ещё одного `bandage` при наличии 2 шт даёт 3.
- **Крафт нестакаемого (оружие, броня):** в MVP считаем, что у героя может быть несколько экземпляров одного и того же оружия (например, 2 пистолета). Активно только то, что надето; остальное лежит как обычный предмет с тем же `id`. Стак работает как `count`.
- **Перегруз после крафта:** результат всё равно зачисляется, потому что игрок в мастерской на базе (а не в вылазке). См. M2 deferred выше.

#### Связь с другими системами

- **§3 Инвентарь и вес:** Крафт читает и пишет инвентарь.
- **§«Канон M1»:** Источник правды по 5 рецептам и id ресурсов.
- **§1 Core Loop:** Крафт — единственная причина возвращаться на базу с тяжёлым лутом.

---

### 5. Мобы (MVP) — M1–M2

#### Описание

В MVP три моба: **Мародёр**, **Дикий пёс**, **Мутант**. Каждый механически уникален не только числами, но и поведением. Цель MVP — показать три тактических архетипа: «обычный человек», «быстрый зверь», «медленный танк».

| ID | name_ru | type | Архетип / Поведение |
|---|---|---|---|
| `marauder` | Мародёр | `human` | Слабый человеческий противник. Низкий HP — убивается ножом за 3–4 удара (см. `balance.md` §Мобы: HP=18, defense=1). При HP<30% переходит в `flee` (попытка убежать — в MVP трактуется как «пропускает ход и теряет 5% инициативы», в M3+ — реальный escape). |
| `wild_dog` | Дикий пёс | `animal` | Высокая инициатива (атакует первым). Слабый к ближнему бою — `cloth_jacket` против `wild_dog` даёт условный +1 к фактической защите (см. balance.md, поле `armor.vs_melee_bonus`). Без расходников. |
| `mutant` | Мутант | `mutant` | Медленный, толстый, бьёт больно. Высокий HP, низкая инициатива, высокий разброс урона. Без особого поведения, просто бьёт ближайшего. |

#### Flow поведения (AI)

```
[ход мобa в CombatScene]
    │
    ▼
[выбор действия по типу]
    │ marauder:
    │   if hp / hp_max < 0.3 → action = "flee" (skip turn, log "Мародёр пытается убежать")
    │   else                  → action = "attack" (цель: герой)
    │ wild_dog:
    │   всегда action = "attack" (цель: герой), приоритет
    │ mutant:
    │   всегда action = "attack" (цель: герой)
    ▼
[выполнение action]
    │ если attack: формула урона из §2, target = герой
    │ если flee:   пропуск хода, инициатива моба -5% на след. раунд
```

В MVP мобы атакуют ТОЛЬКО героя (single-target). Нет AoE, нет приоритета по броне, нет групп-баффов.

#### Формулы

Числа — в [`balance.md` §Mobs](./balance.md#mobs). Урон считается по той же формуле, что и для героя:

```
mob_damage_roll = random_uniform(mob.damage_min, mob.damage_max)
roll = random_uniform(0.85, 1.15)
final_damage = max(1, mob_damage_roll * roll - hero_total_armor)
```

`hero_total_armor` = сумма `defense` всех надетых брони + бонус Укрытия (если активно).

#### Edge-cases

- **Несколько мобов в раунде:** действуют в порядке убывания `base_speed`. При равенстве — в порядке индекса в массиве (детерминированно).
- **Мародёр после `flee` со штрафом инициативы:** на следующем раунде его инициатива пересчитана с -5%. В MVP мобы НЕ пьют аптечки, поэтому HP не восстанавливается; мародёр после `flee` обычно убивается героем со следующего хода.
- **Мутант + Дикий пёс в одном бою:** Дикий пёс почти всегда ходит первым, мутант — последним. Это намеренный геймплей-выбор: пёс должен ужалить, мутант — додавить.

#### Связь с другими системами

- **§«Канон M1» / дроп-таблицы:** что и с какой вероятностью падает.
- **§2 Бой:** мобы — основной поставщик ходов AI.
- **§1 Core Loop:** количество и состав мобов на каждой глубине задаёт `zones.json[depth].enemies` и `enemy_count`.

---

#### 5.4. Мобы M3 (5 новых типов)

> **Скоуп:** добавление к §5. M1 mobs (`marauder`, `wild_dog`, `mutant`) **НЕ изменяются** — ни числами, ни поведением. Все числа новых мобов — в [`balance.md` §M3](./balance.md#m3-расширение-мира).
>
> **Anti-scope §5.4:** перки (M4), боссы / multi-stage / phase changes (M5), полная radio-логика (M6), модули оружия (M5+), реальные звуки/анимации (M7), Yandex SDK (M8), позиционная механика боя / distance / range (M2 combat — positionless, см. implementation hints ниже).

##### 5.4.0. Принципы дизайна 5 новых AI-паттернов

Каждый новый моб **механически уникален** (не клон M1 marauder/wild_dog/mutant по поведению):

| # | id | name_ru | type | behavior_id | Архетип |
|---|---|---|---|---|---|
| 1 | `looter_sniper` | Мародёр-снайпер | `human` | `ranged_keep_distance` | Снайпер: ranged-only, штраф в melee |
| 2 | `armored_guard` | Бронированный охранник | `human` | `defensive_cover` | Защитник: каждый 2-й ход — Укрытие (+50% defense) |
| 3 | `fanatic_berserker` | Фанатик-берсерк | `human` | `berserker_low_hp` | Берсерк: при HP<50% damage ×2, base_speed −30 |
| 4 | `pack_rat` | Стайная крыса-мутант | `mutant` | `pack_bonus_when_paired` | Стая: +50% damage если ≥2 живых `pack_rat` в бою |
| 5 | `relic_drone` | Реликтовый дрон | `mech` (новый, §6.2) | `armor_piercing_ranged` | Мех: ranged, игнорирует `armor.defense` цели |

**Реестр уникальности относительно M1 (3 архетипа):**
- M1 `marauder` (flee при low HP) ≠ M3 `fanatic_berserker` (наоборот: low HP → агрессивнее).
- M1 `wild_dog` (high initiative first strike) ≠ M3 `pack_rat` (initiative обычная, но координация в паре).
- M1 `mutant` (slow tank, plain attack) ≠ M3 `armored_guard` (defensive cycle), `looter_sniper` (ranged), `relic_drone` (armor pierce).

##### 5.4.1. `looter_sniper` — Мародёр-снайпер (Склад)

| Поле | Значение |
|---|---|
| `id` | `looter_sniper` |
| `name_ru` | Мародёр-снайпер |
| `type` | `human` |
| `zone` | `warehouse` |
| `behavior_id` | `ranged_keep_distance` |
| `behavior` (legacy enum, §6.2) | `aggressive` |

**Архетип.** Бывший охотник, окопавшийся среди стеллажей Склада. Стреляет издалека, в ближнем бою растерян и неэффективен.

**AI flow.**
```
[ход looter_sniper]
  если у hero текущее оружие.type == "weapon_melee":
    action = "attack", damage_modifier = 0.5  ; в melee он плохо стреляет
  иначе (hero вооружён ranged или безоружен):
    action = "attack", damage_modifier = 1.0  ; нормальный ranged-урон
```

**Боевой сценарий (что видит игрок на CombatScene).** В turn order looter_sniper обычно ходит во 2-й половине раунда. Если игрок с ножом — мобу выпадает 4-7 damage вместо 9-13. Если у игрока в руках `makeshift_pistol` или `pipe_rifle` — полный 9-13.

**Дроп.** См. [`balance.md` §M3 Drop-tables](./balance.md#m3-drop-tables).

**Implementation hint (Engineer).**
> Это **damage modifier, не позиционная механика**. M2 combat **positionless** — у Engineer'а нет понятия distance/position. Реализация: при расчёте урона `looter_sniper` проверь `hero.equipped_weapon.type`. Если `== "weapon_melee"`, умножь mob damage на 0.5. Один if, ~3 LOC.

---

##### 5.4.2. `armored_guard` — Бронированный охранник (Склад)

| Поле | Значение |
|---|---|
| `id` | `armored_guard` |
| `name_ru` | Бронированный охранник |
| `type` | `human` |
| `zone` | `warehouse` |
| `behavior_id` | `defensive_cover` |
| `behavior` (legacy enum, §6.2) | `defensive` |

**Архетип.** Бывший корпоративный охранник в потрёпанном тактическом снаряжении. Не бьёт сильно, но трудно пробивается. Каждый второй ход — переходит в позицию укрытия и бронируется ещё больше.

**AI flow.**
```
[ход armored_guard]
  if (turn_count_for_this_mob % 2) == 0:           ; чётный его ход (0, 2, 4, ...)
    action = "attack"
    cover_active_next_round = false
  else:                                            ; нечётный (1, 3, 5, ...)
    action = "cover"                               ; skip turn, повысить defense
    cover_active_next_round = true                 ; следующая входящая атака против этого моба считается с COVER_DEFENSE_BONUS_PCT=0.5 поверх defense
```

**Боевой сценарий.** Игрок видит лог: «Охранник атакует — 6 damage» (раунд 1), затем «Охранник занял укрытие» (раунд 2 — пропуск хода). На раунде 2 атаки игрока против `armored_guard` считаются с `coverActive=true` → его `total_defense += 0.5 × base_defense`. На раунде 3 он снова бьёт. И так циклически.

**Дроп.** См. [`balance.md` §M3 Drop-tables](./balance.md#m3-drop-tables).

**Implementation hint (Engineer).**
> `computeDefense(armor, coverActive: boolean, attackerType)` **уже принимает `coverActive: boolean`** (см. `src/systems/combat.ts:47-56`, M2). Никакой новой механики не нужно — на каждом 2-м ходу моба сетим `coverActive=true` на следующую атаку против него; в остальные ходы — `false`. ~5 LOC: счётчик `mob.turn_count`, mod 2, флаг на ровный/нечётный ход. Используется existing M2 cover-механика.

---

##### 5.4.3. `fanatic_berserker` — Фанатик-берсерк (Город)

| Поле | Значение |
|---|---|
| `id` | `fanatic_berserker` |
| `name_ru` | Фанатик-берсерк |
| `type` | `human` |
| `zone` | `city` |
| `behavior_id` | `berserker_low_hp` |
| `behavior` (legacy enum, §6.2) | `aggressive` |

**Архетип.** Член культа «Последнего огня», обкуренный и фанатично злой. Чем ближе к смерти — тем безумнее бьёт, но менее точен (теряет инициативу). Анти-`marauder`: тот при low HP убегает, этот — наоборот.

**AI flow.**
```
[ход fanatic_berserker]
  if (mob.hp / mob.hp_max) < 0.5 and not mob._berserk_triggered:
    mob.damage_min *= 2
    mob.damage_max *= 2
    mob.base_speed -= 30                           ; перерасчёт инициативы со след. раунда
    mob._berserk_triggered = true                  ; чтобы не баффать повторно
  action = "attack"                                ; всегда атакует героя
```

**Боевой сценарий.** На полном HP бьёт 8-12. Когда игрок сбивает его HP ниже 50% (например, до 19/40), лог: «Фанатик орёт и бросается в атаку! +Урон, −Инициатива». Следующая атака — 16-24 damage. Тактический выбор: либо добить до 50% (опасно — он на ходу), либо позволить ему перейти в берсерк и затем добить за 1-2 хода (он медленнее).

**Дроп.** См. [`balance.md` §M3 Drop-tables](./balance.md#m3-drop-tables).

**Implementation hint (Engineer).**
> Trigger однократный (`mob._berserk_triggered = true` после первого срабатывания). Чистая ветка в начале хода моба. `base_speed -= 30` пересчитывает initiative со следующего раунда — это бесплатно, потому что initiative сортируется каждый раунд по `mob.base_speed`. ~6 LOC.

---

##### 5.4.4. `pack_rat` — Стайная крыса-мутант (Город)

| Поле | Значение |
|---|---|
| `id` | `pack_rat` |
| `name_ru` | Стайная крыса-мутант |
| `type` | `mutant` |
| `zone` | `city` |
| `behavior_id` | `pack_bonus_when_paired` |
| `behavior` (legacy enum, §6.2) | `aggressive` |

**Архетип.** Гибрид крысы и чего-то похуже из городской канализации. По одной — неприятная, но не страшная. В паре — кошмар: координируются на запах. **В одиночку — обычный aggressive; в паре — +50% damage обоим.**

**AI flow.**
```
[ход pack_rat]
  let pack_alive = enemies.filter(e => e.id === "pack_rat" && e.hp > 0).length
  if pack_alive >= 2:
    damage_multiplier = 1.5                        ; синергия стаи
  else:
    damage_multiplier = 1.0
  action = "attack", damage = roll(damage_min, damage_max) * damage_multiplier
```

**Боевой сценарий.** Если в бою 2 `pack_rat` живы (типичный случай — Город `enemy_count [2,3]`), игрок видит «Стайные крысы движутся в координации, атакуют сильнее». Damage за одну атаку: 9-13 вместо 6-9. Тактический выбор: сфокусироваться и быстро убить одну (чтобы вторая стала обычной), либо равномерно бить и страдать от +50% обоих.

**Дроп.** См. [`balance.md` §M3 Drop-tables](./balance.md#m3-drop-tables).

**Implementation hint (Engineer).**
> **Минимальная координация — без runtime-state.** При расчёте damage этого моба: `if enemies.filter(e => e.id === 'pack_rat' && e.hp > 0).length >= 2: damage *= 1.5`. Чистый query по живым врагам — никаких новых полей в `Mob`, никакой синхронизации между мобами в раунде. ~4 LOC.

---

##### 5.4.5. `relic_drone` — Реликтовый дрон (Склад + Город, bridge)

| Поле | Значение |
|---|---|
| `id` | `relic_drone` |
| `name_ru` | Реликтовый дрон |
| `type` | **`mech`** (новый enum, §6.2) |
| `zone` | `warehouse` И `city` (cross-zone bridge — единственный, появляется в обеих новых зонах) |
| `behavior_id` | `armor_piercing_ranged` |
| `behavior` (legacy enum, §6.2) | `aggressive` |

**Архетип.** Полуразряженный военный дрон-разведчик из довоенных запасов корпорации. Жужжит. Стреляет тонкими лазерными импульсами, которые **пробивают любую броню**. Танковать его бессмысленно — нужно прятаться или лечиться.

**AI flow.**
```
[ход relic_drone]
  action = "attack"
  ; при расчёте урона: hero_total_defense больше НЕ включает hero.equipped_armor.defense
  ; vs_melee_bonus также НЕ применяется (он только против melee-атакёров; relic_drone — ranged + не "animal")
  final_damage = max(MIN_DAMAGE_FLOOR, mob_damage * roll - cover_bonus_only)
```

**Боевой сценарий.** На герое надет `leather_vest` (defense=3) + `cloth_jacket` (defense=1). Против обычного моба total_defense = 4. Против `relic_drone` total_defense = 0 (армор игнорируется). Игрок видит «Дрон пробивает броню!» — единственная защита: действие «Укрытие» (`COVER_DEFENSE_BONUS_PCT = 0.5` от base defense — но base=0 от armor против drone, так что эффект минимальный) или просто лечение.

**Дроп.** См. [`balance.md` §M3 Drop-tables](./balance.md#m3-drop-tables). Дроп `electronics` и `circuitry` — единственный «легитимный» источник вне zone-loot.

**Implementation hint (Engineer).**
> **Это damage modifier, не позиционная механика.** При вычислении урона `relic_drone` по герою: используй формулу §2, но `target_total_defense` пересчитай **без** `Σ armor.defense`. Конкретно: `target_total_defense = (cover_active ? COVER_DEFENSE_BONUS_PCT * 0 : 0) = 0`. Эффективно — `final_damage = max(MIN_DAMAGE_FLOOR, mob_damage * roll)`.
>
> **`mech` enum hard-checks:** `combat.ts:51 attackerType === "animal"` — `relic_drone` не «animal» → `vs_melee_bonus` НЕ применяется. Это **поведение по умолчанию**, никаких изменений в `computeDefense` не нужно. См. §6.2 mech enum note.

---

##### 5.4.6. Сводная таблица AI-паттернов

| behavior_id | Триггер | Эффект | Состояние |
|---|---|---|---|
| `ranged_keep_distance` | hero.weapon.type == "weapon_melee" | damage × 0.5 | stateless |
| `defensive_cover` | turn_count % 2 == 1 | coverActive=true на след. атаку, skip turn | counter в mob |
| `berserker_low_hp` | mob.hp / hp_max < 0.5 (single-shot) | damage × 2, base_speed −30 | flag `_berserk_triggered` |
| `pack_bonus_when_paired` | enemies.filter(...).length ≥ 2 | damage × 1.5 | stateless query |
| `armor_piercing_ranged` | (всегда) | ignore armor.defense | stateless |

##### 5.4.7. Connection / Edge-cases

- **Mixed wave (старый + новый моб в одном бою):** все правила применяются независимо. Например, в Городе depth 3 могут спавниться `pack_rat × 2` + `mutant × 1` + `relic_drone × 1` — каждый ходит по своему `behavior_id`, AI друг с другом не общаются (кроме query enemies для `pack_bonus_when_paired`).
- **`relic_drone` дроп `electronics`/`circuitry`:** zone-exclusive ресурсы Склада (`electronics`) и Города (`circuitry`) — единственный способ получить эти ресурсы помимо zone-loot из §6.4.M3.
- **`fanatic_berserker` после берсерка не возвращается в норму:** даже если игрок отлечит его (что в M3 невозможно — мобы НЕ хилятся), `_berserk_triggered` остаётся true. Безвозвратный bаff.
- **`pack_rat` solo (один остался живым):** теряет +50% damage сразу же со следующего хода. Тактический поинт: фокус-файр работает.

#### Связь §5.4 с другими системами

- **§2 Бой:** все 5 новых behaviors используют **существующую** combat-формулу из §2; правки касаются только `attack` action и damage-расчёта моба, никаких новых action-типов не вводится (только `defensive_cover` skip+cover, но cover-механика уже в §2).
- **§6.4.M3 Новые зоны:** конкретные комбинации мобов в `enemies[]` per depth задаёт зона.
- **§7 Радио (M3 stub):** не связано — радио на M3 не имеет combat-эффектов.
- **`balance.md` §M3:** все числа (HP, damage, defense, base_speed, xp) — там. Этот раздел описывает **только поведение**, не значения.

---

### 6. JSON-схемы (TypeScript-интерфейсы) — MVP, M1–M2

> **Источник правды по полям — `docs/content-brief.md`.**
> Этот раздел дублирует и уточняет схемы для Engineer и Content Designer.
> Если поле не описано здесь — оно недопустимо в MVP.

Все идентификаторы — `snake_case`, английский (`forest`, `wild_dog`, `cloth_jacket`). Все display-строки — на русском, в полях с суффиксом `_ru`.

#### 6.1. `Item`

```typescript
type ItemType =
  | "resource"
  | "weapon_melee"
  | "weapon_ranged"
  | "armor"
  | "consumable";
// "module", "misc" — НЕ в MVP. См. content-brief.md.

type ItemTier = 1 | 2 | 3 | 4 | 5;

interface ItemBase {
  id: string;              // snake_case, уникален в items.json
  name_ru: string;         // отображаемое имя
  type: ItemType;
  tier: ItemTier;          // в MVP все = 1
  zone_origin: string;     // id зоны (или "universal")
  weight_kg: number;       // > 0; для расходников может быть 0.3..0.5
  description_ru: string;  // 1–2 предложения: что и зачем
  flavor_ru: string;       // 1 строка атмосферы (граффити, заметка, цитата)
  recipe_id: string | null;// если предмет крафтится — id рецепта; иначе null
  stats: ItemStats;        // зависит от type, см. ниже
}

// Discriminated union по type:
type Item =
  | (ItemBase & { type: "resource";       stats: ResourceStats })
  | (ItemBase & { type: "weapon_melee";   stats: WeaponMeleeStats })
  | (ItemBase & { type: "weapon_ranged";  stats: WeaponRangedStats })
  | (ItemBase & { type: "armor";          stats: ArmorStats })
  | (ItemBase & { type: "consumable";     stats: ConsumableStats });

interface ResourceStats {
  // ресурсы не имеют боевых статов; объект остаётся пустым {} для расширения в M3+
}

interface WeaponMeleeStats {
  damage_min: number;
  damage_max: number;
  attack_speed: number;          // условные единицы; в MVP справочно
  noise: "low" | "medium" | "high";
}

interface WeaponRangedStats {
  damage_min: number;
  damage_max: number;
  attack_speed: number;
  noise: "low" | "medium" | "high";
  ammo_id: string;               // id расходника, например "ammo_pistol"
  ammo_per_shot: number;         // обычно 1
}

interface ArmorStats {
  defense: number;               // вычитается из урона
  evasion_bonus_pct?: number;    // в долях, например 0.05 (5%) — не используется в MVP
  vs_melee_bonus?: number;       // доп. защита против melee-атак. В M1 применяется ТОЛЬКО когда атакует моб с type = "animal" (wild_dog) — единственный melee-атакёр MVP (атакует укусом/когтями без оружия). Marauder и mutant в M1 НЕ считаются melee-атакёрами для целей этого бонуса. В M2+ условие переключится на отдельное поле `Mob.attack_kind`.
}

interface ConsumableStats {
  effect_type: "heal" | "ammo_refill";
  effect_value: number;          // HP для heal, выстрелов для ammo_refill
  charges: number;               // в MVP = 1 (на использование, не на стак — стак идёт через count)
}
```

#### 6.2. `Mob`

```typescript
type MobType = "human" | "animal" | "mutant" | "boss" | "mech";
// "boss" — НЕ в MVP, оставлено для совместимости со схемой content-brief.
// "mech" — ДОБАВЛЕНО в M3 для `relic_drone` (см. §5.4.5). Forward-compat only:
//   * Ни одно существующее поведение / hard-check НЕ модифицируется.
//   * В частности, `combat.ts` проверка `attackerType === "animal"` (см. M2 implementation)
//     для `vs_melee_bonus` к `mech` не относится — `mech` НЕ триггерит этот бонус.
//   * M1 mobs (`marauder`, `wild_dog`, `mutant`) и их числа в `balance.md` — без изменений.

type MobBehavior = "aggressive" | "defensive" | "passive" | "ambush";
// MVP использует только "aggressive" (с поведенческой особенностью у marauder — flee при low HP).
// M3: новые мобы используют `aggressive` или `defensive` (см. §5.4 сводная таблица AI-паттернов).
// Тонкое поведение (snipe / pack / berserk / armor-pierce) ВЫРАЖЕНО через поле `behavior_id` ниже,
// а не через расширение этого enum'а (lite расширение — minimize schema churn).

interface DropEntry {
  item_id: string;               // должен существовать в items.json
  chance: number;                // 0..1
  count_min?: number;            // по умолчанию 1
  count_max?: number;            // по умолчанию = count_min
}

interface Mob {
  id: string;                    // snake_case
  name_ru: string;
  type: MobType;
  zone: string;                  // id зоны
  level: number;                 // рекомендуемый уровень глубины
  hp: number;
  damage_min: number;
  damage_max: number;
  defense: number;
  base_speed: number;            // = initiative моба
  xp_reward: number;
  behavior: MobBehavior;
  behavior_id?: string;          // M3+: уникальный ID AI-паттерна (см. §5.4.6 сводная таблица).
                                 //   Для M1 mobs (marauder/wild_dog/mutant) поле отсутствует —
                                 //   Engineer fallback на классический switch по `id`.
                                 //   Для M3 mobs — обязательно, Engineer делает switch по `behavior_id`.
                                 //   Допустимые значения M3: "ranged_keep_distance" | "defensive_cover"
                                 //     | "berserker_low_hp" | "pack_bonus_when_paired" | "armor_piercing_ranged".
                                 //   M4+ — расширяется по мере добавления новых паттернов.
  description_ru: string;
  flavor_ru: string;
  drop_table: DropEntry[];
}
```

> **Уточнение к `content-brief.md`:** content-brief.md описывает поле `damage` как одно число. Канон GDD M1 расширяет его до `damage_min` / `damage_max`, чтобы соответствовать формуле боя §2. Content Designer обязан использовать `damage_min` / `damage_max`.
>
> **M3 schema extensions (см. §5.4):**
> - `MobType` enum получил значение `"mech"` (forward-compat: M1 mobs не затрагиваются).
> - `Mob.behavior_id?: string` — опциональное поле для уникального AI-паттерна. Для M1 mobs **не задаётся** (Engineer fallback на existing M2 hard-checks по `id`). Для M3 mobs (5 шт.) — обязательное (один из 5 enum-string значений §5.4.6).

#### 6.3. `Recipe`

```typescript
interface RecipeIngredient {
  item_id: string;               // должен существовать в items.json
  count: number;                 // > 0
}

interface Recipe {
  id: string;                    // формат "recipe_<result_id>"
  result_id: string;             // должен существовать в items.json
  result_count: number;          // > 0
  ingredients: RecipeIngredient[];
  tier: ItemTier;                // в MVP все = 1
  unlock_condition: string | null; // в MVP все = null (разблокировано с начала)
  craft_time_s: number;          // в MVP = 0 (мгновенно)
}
```

#### 6.4. `Zone`

```typescript
interface ZoneLevel {
  depth: 1 | 2 | 3;              // в MVP — только Лес 1..3
  enemies: string[];             // id мобов из mobs.json
  enemy_count: [number, number]; // [min, max] кол-во мобов за серию боёв
  resources: string[];           // id ресурсов из items.json
  resource_count: [number, number]; // [min, max] суммарно за глубину
  min_player_level: number;      // требуется для входа на глубину
}

interface Zone {
  id: string;                    // snake_case ("forest")
  name_ru: string;
  level: number;                 // рекомендуемый уровень игрока для входа в зону
  description_ru: string;
  resources: string[];           // все ресурсы, доступные в зоне (агрегат)
  mobs: string[];                // все мобы зоны (агрегат)
  boss_id: string | null;        // в MVP всегда null
  unique_resources: string[];    // ресурсы, добываемые ТОЛЬКО в этой зоне
  levels: ZoneLevel[];           // 3 объекта для MVP-зоны "forest"
  unlock_condition: string;      // "start" для forest в MVP; M3 расширяет (см. §6.4.M3)
  return_time_multiplier?: number; // M3+: множитель к BASE_RETURN_TIME_S (см. §6.4.M3).
                                   //   Optional, default 1.0. Engineer читает `zone.return_time_multiplier ?? 1.0`.
                                   //   `forest` поле НЕ задаёт → default=1.0 → M1/M2 поведение математически no-op.
}
```

> **Уточнение к `content-brief.md`:** content-brief.md описывает зону как плоский объект (`resources`, `mobs`, `boss_id`, `unique_resources`). Канон GDD M1 добавляет массив `levels[]` для механики 3-х глубин Леса (§1). Поле `unique_resources` сохраняется ради совместимости; в MVP при одной зоне оно равно полному списку `resources`.
>
> **M3 schema extensions (см. §6.4.M3):**
> - `Zone.return_time_multiplier?: number` — optional, default 1.0. Engineer применяет в расширенной формуле `return_time_s = BASE_RETURN_TIME_S * (zone.return_time_multiplier ?? 1.0) * (1 + (cur_weight / max_weight) * WEIGHT_PENALTY_FACTOR)`. `forest` поле НЕ задаёт → M1/M2 числа `balance.md` не меняются.
> - `Zone.unlock_condition` теперь принимает богаче строки: `"start"` (forest), `"forest_depth_2_completed"` (warehouse), `"any_warehouse_sortie_completed"` (city). Engineer переводит строки в boolean-флаги в `GameState.progress` (см. §6.4.M3 implementation hint).
> - `ZoneLevel.depth` сужение `1 | 2 | 3` — для warehouse/city допустимы `1 | 2` или `1 | 2 | 3` соответственно (см. §6.4.M3). Тип расширяется до `1 | 2 | 3`, что уже соответствует существующему union (no change to schema).

#### 6.4.M3. Новые зоны M3 (Склад + Город)

> **Скоуп:** добавление к §6.4. Зона `forest` и её 3 глубины **НЕ изменяются**. Все числа — в [`balance.md` §M3](./balance.md#m3-расширение-мира).
>
> **Anti-scope §6.4.M3:** перки (M4), боссы (M5), модули оружия (M5+), реальные транспортные/маршрутные системы (M5+), Yandex SDK (M8), позиционная механика боя (M5+).

##### 6.4.M3.0. Сводная таблица новых зон

| id | name_ru | depths | unlock_condition | return_time_multiplier | Mobs (новые + bridge с Леса) | Zone-exclusive resources |
|---|---|---|---|---|---|---|
| `warehouse` | Склад | 2 (depth 1, 2) | `forest_depth_2_completed` | **1.2** | `looter_sniper`, `armored_guard`, `relic_drone`, +`marauder` (bridge) | `electronics`, `oil` |
| `city` | Город | 3 (depth 1, 2, 3) | `any_warehouse_sortie_completed` | **1.5** | `fanatic_berserker`, `pack_rat`, `relic_drone`, +`mutant` (bridge) | `medical_supplies`, `circuitry` |

##### 6.4.M3.1. Зона `warehouse` — Склад

| Поле | Значение |
|---|---|
| `id` | `warehouse` |
| `name_ru` | Склад |
| `level` | 2 (рекомендуемый уровень игрока на старте — выше Леса) |
| `description_ru` | «Заброшенный логистический терминал на промзоне. Стеллажи до потолка, ржавая техника, разбросанная упаковка. Мародёры обустроились здесь как у себя дома; чуют любого пришлого.» |
| `unlock_condition` | `"forest_depth_2_completed"` — открывается после успешного завершения хотя бы одной вылазки в Лес depth 2 (флаг в `GameState.progress.forest_depth_2_completed`). |
| `return_time_multiplier` | **1.2** (на 20% дольше базового возврата — Склад дальше от Оплота, чем Лес). |
| `mobs` (агрегат) | `marauder, looter_sniper, armored_guard, relic_drone` |
| `unique_resources` | `electronics`, `oil` |
| `resources` (агрегат) | `wood, scrap, cloth, electronics, oil, gunpowder, leather` |
| `boss_id` | `null` (M3 без боссов) |

**Глубины Склада.**

| depth | enemies | enemy_count | resources | resource_count | min_player_level | fights_per_depth |
|---|---|---|---|---|---|---|
| 1 | `marauder`, `looter_sniper` | [1, 2] | `scrap`, `cloth`, `electronics`, `oil` | [2, 4] | 2 | 2 |
| 2 | `looter_sniper`, `armored_guard`, `relic_drone` | [2, 3] | `scrap`, `electronics`, `oil`, `gunpowder`, `leather` | [3, 5] | 3 | 3 |

**Атмосфера / нарратив.** Игрок впервые встречает ranged-атакующего противника (`looter_sniper`), бронированного противника (`armored_guard`) и mech-противника (`relic_drone`). Открывает доступ к `electronics` и `oil` — двум новым ресурсам, которые нужны для T2-крафта (см. balance.md §M3 recipes).

**Тактический урок зоны (player-side learning).** «Не все противники бьют одинаково. Нож против снайпера — плохой выбор. Броня против дрона — бесполезна.»

##### 6.4.M3.2. Зона `city` — Город

| Поле | Значение |
|---|---|
| `id` | `city` |
| `name_ru` | Город |
| `level` | 3 (рекомендуемый уровень игрока — выше Склада) |
| `description_ru` | «Руины делового квартала. Пустые витрины, проваленные перекрытия, выжженные офисы. Здесь живут культы и стаи мутантов; нормальные люди давно ушли.» |
| `unlock_condition` | `"any_warehouse_sortie_completed"` — открывается после хотя бы одной успешной вылазки в `warehouse` (флаг в `GameState.progress.any_warehouse_sortie_completed`). |
| `return_time_multiplier` | **1.5** (на 50% дольше базового — Город дальше всех от Оплота, центр карты). |
| `mobs` (агрегат) | `mutant, fanatic_berserker, pack_rat, relic_drone` |
| `unique_resources` | `medical_supplies`, `circuitry` |
| `resources` (агрегат) | `scrap, cloth, food, water, medical_supplies, circuitry, gunpowder, leather` |
| `boss_id` | `null` (M3 без боссов) |

**Глубины Города.**

| depth | enemies | enemy_count | resources | resource_count | min_player_level | fights_per_depth |
|---|---|---|---|---|---|---|
| 1 | `mutant`, `pack_rat` | [2, 3] | `scrap`, `cloth`, `food`, `medical_supplies` | [2, 4] | 3 | 2 |
| 2 | `pack_rat`, `fanatic_berserker`, `relic_drone` | [2, 4] | `medical_supplies`, `circuitry`, `gunpowder` | [3, 5] | 4 | 3 |
| 3 | `fanatic_berserker`, `relic_drone`, `mutant` | [3, 5] | `medical_supplies`, `circuitry`, `leather`, `water` | [4, 7] | 5 | 4 |

**Атмосфера / нарратив.** Самая опасная зона M3. Здесь два уникальных City-моба (`fanatic_berserker`, `pack_rat`) + cross-zone bridge `relic_drone`. Открывает доступ к `medical_supplies` и `circuitry` — ключевые ресурсы для T2-расходников и кибер-инвентаря.

**Тактический урок зоны.** «Скорость убийства имеет значение. Берсерка надо завалить до 50% HP, иначе он удвоит урон. Стайных крыс надо разделять. Дрон обходит броню — нужно укрытие и аптечки.»

##### 6.4.M3.3. `unlock_condition` strings — implementation hint (Engineer)

> Минимальная имплементация — без полной системы квестов. Engineer хранит булевы флаги в `GameState.progress`:
>
> ```typescript
> interface GameProgress {
>   forest_depth_2_completed: boolean;        // true после первой успешной вылазки на forest depth=2
>   any_warehouse_sortie_completed: boolean;  // true после любой успешной вылазки в warehouse
>   // M4+: расширяется по мере добавления новых unlock-условий
> }
> ```
>
> **Триггеры (где сетим флаги):**
> - `forest_depth_2_completed`: в `ReturnScene.onComplete()`, если `currentSortie.zone === "forest" && currentSortie.depth === 2 && currentSortie.victory === true`.
> - `any_warehouse_sortie_completed`: в `ReturnScene.onComplete()`, если `currentSortie.zone === "warehouse" && currentSortie.victory === true`.
>
> **Проверка в `MapScene`:** для каждой зоны вычислить `unlocked = evaluateUnlockCondition(zone.unlock_condition, GameState.progress)`, где `evaluateUnlockCondition` — простой switch по строкам:
>
> ```typescript
> function evaluateUnlockCondition(cond: string, progress: GameProgress): boolean {
>   switch (cond) {
>     case "start": return true;
>     case "forest_depth_2_completed": return progress.forest_depth_2_completed;
>     case "any_warehouse_sortie_completed": return progress.any_warehouse_sortie_completed;
>     default: return false; // unknown condition → locked, soft-warn в console
>   }
> }
> ```
>
> Заблокированная зона в `MapScene` показывается серой кнопкой с подсказкой «Откроется после: <читаемое условие>».

##### 6.4.M3.4. `return_time_multiplier` — implementation hint (Engineer)

> Расширенная формула из `balance.md` §Формулы:
>
> ```
> return_time_s = BASE_RETURN_TIME_S
>               * (zone.return_time_multiplier ?? 1.0)
>               * (1 + (cur_weight / max_weight) * WEIGHT_PENALTY_FACTOR)
> ```
>
> **Обратная совместимость:**
> - `forest` в `content/zones.json` поле `return_time_multiplier` **не задаёт** → `?? 1.0` → формула эквивалентна M1/M2 версии.
> - `warehouse` → 1.2, `city` → 1.5.
>
> **Где менять:** `src/systems/weight.ts` функция `computeReturnTime` получает третий опциональный параметр `zoneMultiplier: number = 1.0`. Caller в `ReturnScene` передаёт `currentSortie.zone.return_time_multiplier ?? 1.0`. Vitest тесты M2 не сломаются (тесты вызывают `computeReturnTime(curWeight, maxWeight)` без 3-го аргумента → default 1.0 → старое поведение). Добавь ≥2 новых vitest на warehouse=1.2 и city=1.5 (см. M3-ENG handoff §5).

##### 6.4.M3.5. Zone-exclusive ресурсы — нарратив + механика

| Ресурс | Зона | Назначение |
|---|---|---|
| `electronics` | warehouse | Крафт T2-брони, T2-расходников (см. balance.md §M3 recipes) |
| `oil` | warehouse | Крафт T2-оружия, T2-расходников |
| `medical_supplies` | city | Крафт T2-аптечек и расходников лечения |
| `circuitry` | city | Крафт `gas_mask` (заглушка для M5 газовых зон) и `emp_grenade` (counter `relic_drone`) |

**Правило (из `content-brief.md`):** ни один из этих ресурсов **не должен** появляться в drop-tables или resource-pools других зон. `relic_drone` — единственное исключение для `electronics` и `circuitry` (см. §5.4.5): дрон может быть найден в обеих новых зонах и оба ресурса дропает. Это **намеренное** дизайн-решение, чтобы дать игроку альтернативный путь добычи (опасный — через мех-бой, не через лут зоны).

##### 6.4.M3.6. Связь §6.4.M3 с другими системами

- **§5.4 Мобы M3:** mob-rosters per zone задают, какие AI игрок встречает в каждой глубине.
- **§1 Core Loop:** `enemy_count`, `resource_count`, `min_player_level`, `fights_per_depth` — стандартные поля `ZoneLevel`, использует ту же логику что и forest M1.
- **`balance.md` §M3:** все числа (depth-config + return_time_multiplier + recipes использующие zone-exclusive ресурсы) — там.
- **`content/zones.json`:** Content Designer заполнит JSON по этой таблице. Cross-refs всех `enemies[*]` и `resources[*]` проверяются на этапе Content PR.
- **§7 Радио (M3 stub):** не связано напрямую. Polный radio (M6) может вводить per-zone сигналы с засадами, но это вне M3 anti-scope.

---

## Канон M1 — items / recipes / drops

> Это единая истина для Content Designer'a, Engineer'a и QA на M1.
> Любое расхождение в `content/items.json`, `content/recipes.json`, `content/mobs.json`, `content/zones.json` с этой таблицей — баг Content'а.

### 7.1. Канонические 15 предметов (`content/items.json`)

| # | id | name_ru | type | tier | zone_origin | weight_kg | recipe_id |
|---|---|---|---|---|---|---|---|
| 1 | `wood` | Дерево | resource | 1 | forest | 2 | null |
| 2 | `scrap` | Металлолом | resource | 1 | forest | 3 | null |
| 3 | `cloth` | Ткань | resource | 1 | forest | 1 | null |
| 4 | `food` | Консервы | resource | 1 | forest | 1 | null |
| 5 | `water` | Вода | resource | 1 | forest | 1 | null |
| 6 | `gunpowder` | Порох | resource | 1 | forest | 1 | null |
| 7 | `leather` | Кожа | resource | 1 | forest | 2 | null |
| 8 | `rope` | Верёвка | resource | 1 | forest | 1 | null |
| 9 | `knife` | Нож | weapon_melee | 1 | universal | 0.5 | null |
| 10 | `makeshift_pistol` | Самодельный пистолет | weapon_ranged | 1 | universal | 1.5 | `recipe_pistol` |
| 11 | `cloth_jacket` | Тканевая куртка | armor | 1 | universal | 1 | null |
| 12 | `leather_vest` | Кожаный жилет | armor | 1 | universal | 2.5 | `recipe_leather_vest` |
| 13 | `bandage` | Бинт | consumable | 1 | universal | 0.3 | `recipe_bandage` |
| 14 | `medkit` | Аптечка | consumable | 1 | universal | 0.5 | `recipe_medkit` |
| 15 | `ammo_pistol` | Патроны (пистолет) | consumable | 1 | universal | 0.5 | `recipe_ammo_pistol` |

Все боевые числа — в [`balance.md`](./balance.md). Content Designer заполняет `description_ru`, `flavor_ru`, `stats` строго по этим id и числам из balance.md.

### 7.2. Канонические 5 рецептов (`content/recipes.json`)

Каждый `result_id` ∈ items roster (7.1). Каждый `item_id` в `ingredients` ∈ items roster (7.1).

| id | result_id | result_count | ingredients | tier | craft_time_s | unlock_condition |
|---|---|---|---|---|---|---|
| `recipe_pistol` | `makeshift_pistol` | 1 | `scrap` x5, `wood` x2, `gunpowder` x3 | 1 | 0 | null |
| `recipe_leather_vest` | `leather_vest` | 1 | `leather` x3, `cloth` x2, `rope` x1 | 1 | 0 | null |
| `recipe_bandage` | `bandage` | 1 | `cloth` x3 | 1 | 0 | null |
| `recipe_medkit` | `medkit` | 1 | `bandage` x2, `cloth` x2 | 1 | 0 | null |
| `recipe_ammo_pistol` | `ammo_pistol` | 5 | `gunpowder` x2, `scrap` x1 | 1 | 0 | null |

### 7.3. Канонические дроп-таблицы мобов (`content/mobs.json`)

Все `item_id` ∈ items roster (7.1).

| Моб | drop_table |
|---|---|
| `marauder` | `cloth` @ 0.60 (count 1–2); `food` @ 0.40 (count 1); `ammo_pistol` @ 0.15 (count 1, редкий) |
| `wild_dog` | `leather` @ 0.70 (count 1); `food` @ 0.20 (count 1, редкий) |
| `mutant` | `scrap` @ 0.50 (count 1–2); `gunpowder` @ 0.30 (count 1); `leather` @ 0.10 (count 1, редкий — остатки кожаных сапог) |

### 7.4. Канон M1-зоны (`content/zones.json`)

| Поле | Значение |
|---|---|
| id | `forest` |
| name_ru | Лес |
| level | 1 |
| description_ru | «Густой лес на окраине города. Относительно безопасен, но мародёры уже добрались сюда.» |
| resources (агрегат) | `wood, scrap, cloth, food, water, gunpowder, leather, rope` |
| mobs (агрегат) | `marauder, wild_dog, mutant` |
| boss_id | null |
| unique_resources | `wood, scrap, cloth, food, water, gunpowder, leather, rope` (все 8 — одна зона в MVP) |
| unlock_condition | `start` |

3 уровня глубины (`levels[]`):

| depth | enemies | enemy_count | resources | resource_count | min_player_level |
|---|---|---|---|---|---|
| 1 | `marauder, wild_dog` | [1, 2] | `wood, cloth, food, rope` | [2, 4] | 1 |
| 2 | `marauder, wild_dog, mutant` | [2, 3] | `wood, leather, water, scrap` | [3, 5] | 3 |
| 3 | `mutant, marauder` | [2, 4] | `wood, leather, gunpowder, scrap` | [4, 6] | 5 |

---

## Отклонения от `staff/handoff/M1-GD.md` (для PM / QA)

Конфликты между `staff/handoff/M1-GD.md` и `staff/handoff/M1-CONTENT.md` обнаружены до начала работы и согласованы PM в kickoff-сессии. Канонические решения зафиксированы в §«Канон M1» (выше).

### C1. Дроп Мутанта: «Хим.реагент» / «Катализатор»

- **Было в `staff/handoff/M1-GD.md`:** `Мутант` — дроп «Хим.реагент», редкий «Катализатор 5%».
- **Проблема:** «Хим.реагент» и «Катализатор» не входят в 8 канонических ресурсов из `staff/handoff/M1-CONTENT.md` (`wood, scrap, cloth, food, water, gunpowder, leather, rope`). Добавление новых ресурсов превысило бы лимит 15 предметов.
- **Канон M1:** Мутант дропает `scrap` (0.50, обломки химзащиты) + `gunpowder` (0.30, старые боеприпасы) + редкий `leather` (0.10, остатки сапог). См. §7.3.

### C2. Рецепт `recipe_medkit`: «Медикаменты»

- **Было в `staff/handoff/M1-GD.md`:** `Аптечка = Бинт x2 + Медикаменты x1`.
- **Проблема:** ресурса «Медикаменты» нет в 8 канонических ресурсах M1-CONTENT. Добавление 9-го ресурса превысило бы лимит 15 предметов и поломало бы roster Content'а.
- **Канон M1:** `recipe_medkit = bandage x2 + cloth x2`. Нарратив: бинты + чистая ткань для тугой повязки. См. §7.2.

### C3. Рецепты `recipe_club` / `recipe_shiv`: предметы «Дубинка» / «Заточка»

- **Было в `staff/handoff/M1-GD.md`:** 2 из 5 рецептов — `Дубинка = Дерево x3 + Верёвка x1` и `Заточка = Металлолом x2`.
- **Проблема:** `club` / `shiv` не входят в 15 канонических предметов из `staff/handoff/M1-CONTENT.md` (там только 2 оружия: `knife`, `makeshift_pistol`). Добавление двух новых предметов превысило бы лимит 15.
- **Канон M1:** заменены на `recipe_leather_vest` (даёт `leather_vest`, уже в roster'е) и `recipe_ammo_pistol` (даёт `ammo_pistol`, уже в roster'е). См. §7.2. Это сохраняет 5 рецептов из handoff и при этом обеспечивает покрытие всех 4 крафтовых предметов (`makeshift_pistol`, `leather_vest`, `bandage`, `medkit`) + источник патронов.

### Технические уточнения схем (не отклонения)

- **`Mob.damage` → `damage_min` / `damage_max`.** `content-brief.md` описывает `Mob.damage` как одно число. GDD M1 §6.2 расширяет до пары min/max ради соответствия формуле боя §2.
- **`Zone.levels[]` добавлено.** `content-brief.md` описывает Zone без массива `levels[]`. M1 требует 3 глубины у `forest` — поле добавлено в §6.4 поверх базовой формы content-brief.

---

## Заглушки для будущих вех

> Заполняются на соответствующих вехах. На M1 — НЕ трогать.

### 7. Зоны и карта (M3) — DONE

> Заполнено в M3 GD-amendment. Содержимое переехало в **§6.4.M3 «Новые зоны M3»** (Склад + Город, unlock_condition, return_time_multiplier, zone-exclusive resources, depths config). См. также `balance.md` §M3.

### 8. Перки и прогрессия (M4)

> **Скоуп M4:** flat pool из 8 пассивных перков, XP за убийство мобов, level-up popup с выбором 1 из 3 случайных невзятых перков.
>
> **Anti-scope M4:** skill tree (поинты + ноды + prereq'и), `tier`, `cost` и расширенная экономика перков — это **M5+ refactor path**. Активные ability / cooldowns — M5+. Боссы и T3 — M5. Полная радио-логика — M6. Yandex SDK / persistence / leaderboard — M8. На M4 прогрессия хранится только в session memory.

#### Описание

M4 добавляет лёгкую RPG-прогрессию к уже работающему loop'у: игрок получает XP за победы в бою, повышает уровень и на каждом level-up выбирает 1 пассивный перк из 3 случайных вариантов. Перки — одноразовые: взятый `perk.id` больше не появляется в выборе.

В M4 нет дерева навыков и очков перков. Это сознательно плоская система, чтобы Engineer / Content могли быстро провалидировать базовый pacing: «убиваю мобов → вижу рост уровня → выбираю понятный пассивный бонус».

#### XP-источники

| Источник | M4 rule |
|---|---|
| Убийство моба | `xp_gained = mob.xp_reward * xp_gain_multiplier` |
| Успешный return на базу | 0 XP на M4 |
| Craft | 0 XP на M4 |
| Поднятие лута | 0 XP на M4 |
| Exploration / unlock зоны | 0 XP на M4 |

Единственный источник XP на M4 — kill mob. Return / craft / loot / exploration XP остаются M5+ refactor path, если playtest покажет, что combat-only pacing слишком узкий.

#### XP-curve

Числа — в [`balance.md` §M4](./balance.md#m4--прогрессия).

```
xp_to_next(level) = round(40 * level^1.5)
xp_required(level) = sum(xp_to_next(k) for k in 1..level-1)
level_up: current_total_xp >= xp_required(current_level + 1)
```

`level` стартует с 1. M4 балансируется вокруг уровней 1–10; технический cap для M4 — 10, если Engineer'у нужен верхний guard. После level 10 XP может продолжать копиться в session memory, но новых M4-перков уже не добавляется.

#### Level-up flow

```
[CombatScene: моб умер]
    │ add XP: mob.xp_reward * xp_gain_multiplier
    ▼
[ProgressionSystem]
    │ while total_xp >= threshold(next_level):
    │   level += 1
    │   enqueue LevelUpReward
    ▼
[LevelUpScene overlay]
    │ берёт первый reward из queue
    │ показывает 3 случайных perk'а из невзятых
    ▼
[игрок выбирает 1]
    │ GameState.player.perks[] += perk.id
    │ применяются пассивные stat modifiers
    ▼
[если queue не пуста → следующий popup; иначе возврат в исходную сцену]
```

Правила:

- **Overkill XP carry over.** XP сверх порога не сгорает. Если один kill даёт сразу несколько уровней, `LevelUpScene` показывает popup'ы очередью: один выбор перка на каждый полученный уровень.
- **Пул выбора:** максимум 3 случайных невзятых перка. Если невзятых осталось 1–2, показываются все оставшиеся без добора дублями.
- **Все 8 перков взяты:** уровень всё равно повышается и XP сохраняется, но JSON-перк не предлагается. Вместо popup выбора `LevelUpScene` автоматически применяет hardcoded fallback `veteran_conditioning`: `+10 hp_max`. Это **не** запись в `content/perks.json` и **не** девятый перк; Content на M4 пишет ровно 8 перков из `balance.md` §M4, а QA считает pool size = 8 + 1 hardcoded fallback.
- **Поражение после убийств:** XP за уже убитых мобов сохраняется, как зафиксировано в §1 edge-case.
- **Повторы перков:** запрещены. На M4 нет stackable perks.

#### Перки M4

Все 8 перков пассивные и применяются сразу после выбора. `percentage` тип зарезервирован в схеме для future-compatible контента, но M4 таблица использует только `additive` и `multiplicative`.

| id | Эффект |
|---|---|
| `tough_skin` | + max HP |
| `sharp_blade` | множитель damage |
| `lean_pack` | снижает weight penalty multiplier |
| `lucky_scavenger` | множитель loot quantity |
| `keen_eye` | additive crit chance |
| `reinforced_plates` | множитель armor efficiency |
| `quick_hands` | снижает crafting time multiplier |
| `fast_learner` | множитель XP gain |

`keen_eye` добавляет `+0.05` к baseline crit chance. Если baseline crit chance в runtime равен 0, это даёт первые 5% crit; если Engineer позже задаст baseline 5–10%, перк станет 10–15% total crit chance без изменения схемы.

### 9. Боссы и инстансы (M5)
<!-- GD заполнит на M5: мини-боссы, дейли-инстансы, чертежи T3+ -->

### 10. Радио и доверие (M6) — заглушка структуры (M3)

> **Полная логика** (сигналы с ветвлениями, засады, награды, фракционные репутации, шкала доверия) — **M6**.
> **На M3** заполнено только **§10.M3 «Структура радио (M3 UI-stub)»** ниже — JSON-схема `RadioSignal` + UI-flow + anti-scope. Это нужно, чтобы Content мог наполнить 2-3 dummy-сигнала, а Engineer — реализовать RadioScene как UI-заглушку.

#### 10.M3. Структура радио — M3 UI-stub

> **Скоуп M3:** UI-заглушка. Игрок может зайти в RadioScene с базы, увидеть список сигналов, выбрать сигнал, нажать одну из 2 кнопок — сигнал помечается dismissed и пропадает из списка. **Никаких реальных последствий** (rewards/ambush/faction changes). Это сознательное упрощение M3 — чтобы протестировать UI-поток и форму данных до того как M6 добавит полную игровую логику.
>
> **Anti-scope §10.M3:** rewards (M6), ambush / trap_mob_id (M6), trust scale / faction reputation (M6), branching outcomes (M6), per-zone signal triggers (M6), таймеры реального времени между сигналами (M6+).

##### 10.M3.1. JSON-схема `RadioSignal`

```typescript
type RadioSignalOptionId = "respond" | "ignore";   // ровно 2 опции на M3

interface RadioSignalOption {
  id: RadioSignalOptionId;
  label_ru: string;                                // "Откликнуться" | "Игнорировать"
}

interface RadioSignal {
  id: string;                                      // snake_case, формат "radio_NNN" или "radio_<theme>"
  from: string;                                    // отправитель: "unknown" | "survivor_group_a" | "caravan" | ... (свободная строка)
  subject: string;                                 // краткий заголовок (1 строка для списка)
  body_ru: string;                                 // 2-4 предложения текста сигнала
  options: RadioSignalOption[];                    // ровно 2 элемента: [{id: "respond", label_ru: "Откликнуться"}, {id: "ignore", label_ru: "Игнорировать"}]
  expires_after_sorties: number;                   // > 0; счётчик уменьшается после каждой завершённой вылазки. При 0 → авто-dismissed.
  dismissed: boolean;                              // M3: устанавливается в true после клика на любую из 2 кнопок. По умолчанию false.
                                                   // M6 расширит до выбора: { responded: boolean, ignored: boolean, expired: boolean, chosen_option: RadioSignalOptionId | null }
}
```

> **M3 → M6 миграция (для PM / GD будущего):** `dismissed: boolean` — это **намеренное упрощение M3**. В M6 поле заменится / расширится до choice-history (какая опция была выбрана, последствия применены ли). На M3 Engineer хранит только булев флаг — этого достаточно для UI-флоу.

> **Поля content-brief.md, относящиеся к M6 (НЕ использовать в M3 stub):** `type` (truth/trap/ambiguous), `zone`, `reward`, `trap_mob_id`, `trust_impact`. В M3 RadioSignal этих полей **нет**. Content на M3 заполняет ТОЛЬКО поля из §10.M3.1 выше. Когда М6 наступит, GD сделает амендмент к §10 и Content добавит недостающие поля к существующим сигналам + новые сигналы.

##### 10.M3.2. UI-flow (M3)

```
[BaseScene]
    │ кнопка «Радио» (рядом с «Вылазка» / «Инвентарь» / «Крафт»)
    ▼
[RadioScene: список активных сигналов]
    │ active = signals.filter(s => !s.dismissed && s.expires_after_sorties > 0)
    │ если active пустой → текст «Эфир пуст», кнопка «Назад» → BaseScene
    │ иначе → список карточек (subject + from)
    ▼ клик по карточке
[RadioScene: детали сигнала]
    │ показывается body_ru
    │ две кнопки: «Откликнуться» и «Игнорировать»
    ▼ клик по любой из 2 кнопок
[RadioScene: dismiss]
    │ signal.dismissed = true (persisted в GameState)
    │ NO rewards / NO ambush / NO faction changes (M6)
    │ возврат в список активных сигналов (или «Эфир пуст», если был последним)
    ▼ кнопка «Назад»
[BaseScene]
```

##### 10.M3.3. Таймер `expires_after_sorties`

> **M3 minimal-impl:** счётчик уменьшается **только** при `ReturnScene.onComplete()` (успешный возврат с любой вылазки). НЕ уменьшается при поражении (на спорный случай оставим — M6 может изменить).
>
> ```typescript
> // в ReturnScene.onComplete():
> for (const sig of GameState.data.radioSignals) {
>   if (!sig.dismissed && sig.expires_after_sorties > 0) {
>     sig.expires_after_sorties -= 1;
>     if (sig.expires_after_sorties === 0) sig.dismissed = true;  // авто-протух
>   }
> }
> ```
>
> Это **5 LOC в ReturnScene** + поле `radioSignals` в `GameState.data` (Engineer добавляет в `BootScene` грузя `content/radio.json`).

##### 10.M3.4. Anti-scope §10.M3 (что НЕ делает Engineer на M3)

- **Rewards:** игнорирование сигнала или отклик не дают предметов / xp.
- **Ambush / trap_mob_id:** отклик не запускает спец-вылазку.
- **Trust / reputation:** отклик не меняет шкалу доверия (её нет в M3 GameState).
- **Branching outcomes:** обе кнопки делают одно и то же — `dismissed = true`. Player choice сейчас семантический (для нарратива), не механический.
- **Per-zone signal triggers:** все сигналы доступны сразу, нет привязки «открой Город → появится новый сигнал».
- **Real-time timers:** счётчик `expires_after_sorties` уменьшается в дискретных тиках (one per sortie return), не в real-time.

##### 10.M3.5. Что готовят другие роли на M3 (cross-refs)

| Роль | Артефакт | Где |
|---|---|---|
| Content Designer | 2-3 dummy-сигнала | `content/radio.json` (файл уже существует как `[]`) |
| Engineer | `RadioScene` + `BootScene` load + `GameState.data.radioSignals` + `expires_after_sorties` decrement | `src/scenes/RadioScene.ts` (новый), `src/scenes/BootScene.ts`, `src/state/GameState.ts`, `src/types/radio.ts` (новый) |
| Artist | UI-элементы RadioScene (карточка сигнала, кнопка «Радио» на BaseScene) | `assets/ui/` (если нужно — на усмотрение Artist M3) |

##### 10.M3.6. Связь §10.M3 с другими системами

- **§1 Core Loop:** RadioScene вызывается с BaseScene; `expires_after_sorties` декрементится в ReturnScene.
- **§5.4 / §6.4.M3:** не связано — radio сейчас НЕ влияет на бой / мобов / зоны.
- **§6 JSON-схемы:** см. §10.M3.1.
- **M6 эволюция:** этот stub будет расширен амендментом M6 GD: добавятся поля content-brief (`type`, `zone`, `reward`, `trap_mob_id`, `trust_impact`), полная UI-логика последствий, шкала доверия в `GameState.trust`.

### 11. Модульное оружие и броня (M5+)
<!-- GD заполнит на M5+: модули, слоты, уникальные статы из компонентов -->

### 12. Монетизация (M8)
<!-- GD заполнит на M8: реклама, IAP, Yandex SDK интеграция -->
