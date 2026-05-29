# Game Design Document — «Оплот»

> Этот документ — **единственный источник правды** по игровым механикам.
> Если чего-то нет здесь — этого нет в игре.
> Все числа — в [`balance.md`](./balance.md).

## High Concept

Одиночка выживает в заброшенном городе после техногенной катастрофы. Core loop: вылазки за ресурсами → пошаговый бой → лут с системой веса → крафт экипировки → развитие базы (Оплот).

> **Long-term vision (вне скоупа M1–M2):** модульная экипировка, перки, мульти-зоны, радио и доверие, мини-боссы. На M1–M2 крафт ограничен 5 рецептами и нерасширяемой экипировкой (см. §4 и §7.2). Подробности — в заглушках §12+ внизу документа.

## Платформа и ограничения

- Яндекс.Игры (HTML5)
- Mobile-first, **горизонтальная ориентация (landscape 1280×720)**, масштабирование Phaser `Scale.FIT`. Фактический таргет с веха-редизайна (PR #84) — landscape; портретный режим из ранних версий GDD больше не актуален.
- Bundle: цель — компактная первичная загрузка (<5 сек на 4G). Текущий продакшен-билд: JS ~1.5 MB (gzip ~370 KB) + painted-ассеты (фоны зон — основной вес). Сжатие/lazy-load фонов — открытый release-hardening пункт (см. `staff/PLAN.md` M10-release).
- Phaser 3 + TypeScript + Vite + Yandex Games SDK

## Скоуп текущей версии GDD

Исторически этот документ начинался как MVP-спека (M1–M2). По состоянию на 2026-05 он расширен заглушками и описаниями систем, **фактически выпущенных в `main` вплоть до M10** (зоны, перки, боссы, радио, платформа, монетизация — см. §7–§13). Системы вех **M11/M12 (оружейная система, тиры, дерево навыков, combat overhaul) в `main` вмёржены gate-close-слиянием (combat overhaul требует QA-финализации)**. Любая фича вне описанных секций — scope creep, который блокирует QA.

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
- **§9 Боссы M5:** 3 босса M5 используют те же 5 behavior_id из §5.4.6 в phase 1 и phase 2. Phase swap переключает `mob.behavior_id` runtime (§9.3). Никаких новых AI behaviours на M5 не вводится.

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
                                 //   M5: boss behaviour_id = phase 1 behavior (см. §9.2).
                                 //     После phase transition → runtime swap на phase_2_behavior_id.
  phase_threshold?: number;      // M5+: fraction (0..1). Required для role:"boss". При boss.hp / hp_max
                                 //   < phase_threshold → phase transition (§9.3). Optional для regular
                                 //   mobs (не используется). Default: отсутствует → no phase transition.
  phase_2_behavior_id?: string;  // M5+: ID behaviour из §5.4 для phase 2. Required для role:"boss".
                                 //   Допустимые значения: те же 5 behavior_id из §5.4.6.
                                 //   После phase transition → boss.behavior_id = phase_2_behavior_id.
  boss_drop_id?: string | null;  // M5+: id ресурса в items.json, гарантированно выпадающего при
                                 //   смерти босса (chance=1.0, count=1). Required для role:"boss".
                                 //   Для regular mobs — absent/null (no guaranteed drop).
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
>
> **M5 schema extensions (см. §9):**
> - `Mob.phase_threshold?: number` — optional, required для `role:"boss"`. Fraction (0.5 на M5). Trigger phase transition (§9.3). M1-M4 mobs: поле отсутствует → no phase transition → backward-compat.
> - `Mob.phase_2_behavior_id?: string` — optional, required для `role:"boss"`. Один из 5 behaviour_id §5.4.6. M1-M4 mobs: поле отсутствует → no phase swap → backward-compat.
> - `Mob.boss_drop_id?: string | null` — optional, required для `role:"boss"`. ID ресурса для guaranteed drop. M1-M4 mobs: поле отсутствует → no guaranteed drop → backward-compat.

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
  is_gas?: boolean;              // M5+: флаг газовой глубины. Optional, default false.
                                 //   Если true → на этой глубине gas damage per turn (§9.5).
                                 //   M1-M4 zones: поле отсутствует → no gas damage → backward-compat.
}

interface Zone {
  id: string;                    // snake_case ("forest")
  name_ru: string;
  level: number;                 // рекомендуемый уровень игрока для входа в зону
  description_ru: string;
  resources: string[];           // все ресурсы, доступные в зоне (агрегат)
  mobs: string[];                // все мобы зоны (агрегат)
  boss_id: string | null;        // в MVP всегда null; M5: id босса зоны (см. §9.2)
  unique_resources: string[];    // ресурсы, добываемые ТОЛЬКО в этой зоне
  levels: ZoneLevel[];           // 3 объекта для MVP-зоны "forest"
  unlock_condition: string;      // "start" для forest в MVP; M3 расширяет (см. §6.4.M3)
  return_time_multiplier?: number; // M3+: множитель к BASE_RETURN_TIME_S (см. §6.4.M3).
                                   //   Optional, default 1.0. Engineer читает `zone.return_time_multiplier ?? 1.0`.
                                   //   `forest` поле НЕ задаёт → default=1.0 → M1/M2 поведение математически no-op.
  is_gas?: boolean;              // M5+: флаг газовой зоны (агрегат). Optional, default false.
                                   //   Если true → зона содержит газовые глубины (детали per-depth в levels[].is_gas).
                                   //   Engineer может использовать zone.is_gas для быстрой проверки
                                   //   «зона вообще имеет газ?». Фактический gas damage — per-depth.
                                   //   M1-M4 zones: поле отсутствует → no gas → backward-compat.
  gas_damage_per_turn?: number;  // M5+: HP урона от газа за ход (целое > 0). Required если is_gas=true.
                                   //   Применяется если hero НЕ имеет gas_mask (§9.5).
                                   //   M1-M4 zones: поле отсутствует → no gas damage → backward-compat.
  daily_reset_hours?: number;    // M5+: cool-down дейли-инстанса в часах. Required если boss_id !== null.
                                   //   M5 value: 24 для всех 3 зон (см. §9.4, balance §M5.6).
                                   //   M1-M4 zones: поле отсутствует → no daily → backward-compat.
}
```

> **Уточнение к `content-brief.md`:** content-brief.md описывает зону как плоский объект (`resources`, `mobs`, `boss_id`, `unique_resources`). Канон GDD M1 добавляет массив `levels[]` для механики 3-х глубин Леса (§1). Поле `unique_resources` сохраняется ради совместимости; в MVP при одной зоне оно равно полному списку `resources`.
>
> **M3 schema extensions (см. §6.4.M3):**
> - `Zone.return_time_multiplier?: number` — optional, default 1.0. Engineer применяет в расширенной формуле `return_time_s = BASE_RETURN_TIME_S * (zone.return_time_multiplier ?? 1.0) * (1 + (cur_weight / max_weight) * WEIGHT_PENALTY_FACTOR)`. `forest` поле НЕ задаёт → M1/M2 числа `balance.md` не меняются.
> - `Zone.unlock_condition` теперь принимает богаче строки: `"start"` (forest), `"forest_depth_2_completed"` (warehouse), `"any_warehouse_sortie_completed"` (city). Engineer переводит строки в boolean-флаги в `GameState.progress` (см. §6.4.M3 implementation hint).
> - `ZoneLevel.depth` сужение `1 | 2 | 3` — для warehouse/city допустимы `1 | 2` или `1 | 2 | 3` соответственно (см. §6.4.M3). Тип расширяется до `1 | 2 | 3`, что уже соответствует существующему union (no change to schema).
>
> **M5 schema extensions (см. §9):**
> - `ZoneLevel.is_gas?: boolean` — optional, default false. Флаг газовой глубины. M1-M4: отсутствует → no gas → backward-compat.
> - `Zone.is_gas?: boolean` — optional, default false. Агрегатный флаг «зона содержит газ». Per-depth — в `levels[].is_gas`. M1-M4: отсутствует → no gas → backward-compat.
> - `Zone.gas_damage_per_turn?: number` — optional, required если `is_gas=true`. HP урона от газа за ход. M1-M4: отсутствует → no gas damage → backward-compat.
> - `Zone.daily_reset_hours?: number` — optional, required если `boss_id !== null`. Cool-down дейли-инстанса в часах. M5 value: 24. M1-M4: отсутствует → no daily → backward-compat.
> - `Zone.boss_id` — существующее поле `string | null`. На M5 заполняется id босса зоны (вместо null). Forest/warehouse/city все получают boss_id.

#### 6.5. `Perk`

> **Скоуп §6.5 / M4:** только 8 пассивных перков из flat pool. Схема намеренно малая: Content пишет ровно 8 JSON-объектов, Engineer применяет stat modifier.
>
> **Anti-scope §6.5 / M4:** нет `prereq`, `tier`, `cost`, `cooldown`, active effects, triggered effects и дерева навыков. Эти поля — M5+ refactor path.

```typescript
type PerkModifierType = "additive" | "multiplicative" | "percentage";

type PerkStat =
  | "hp_max"
  | "damage"
  | "weight_penalty_multiplier"
  | "loot_quantity_multiplier"
  | "crit_chance"
  | "armor_efficiency"
  | "crafting_speed_multiplier"
  | "xp_gain_multiplier";

interface Perk {
  id: string;                    // snake_case, уникален в perks.json
  name: string;                  // отображаемое имя
  description: string;           // кратко объясняет числовой эффект
  type: PerkModifierType;        // enum: additive | multiplicative | percentage
  stat: PerkStat;                // ровно один из 8 M4 stat enum выше
  value: number;                 // > 0
}
```

Пример:

```json
{
  "id": "tough_skin",
  "name": "Закалённая кожа",
  "description": "+15 HP к максимальному здоровью.",
  "type": "additive",
  "stat": "hp_max",
  "value": 15
}
```

Валидаторы для Content / QA:

- `id` — snake_case, уникален.
- `type` — строго enum `[additive, multiplicative, percentage]`.
- `stat` — строго enum из 8 значений выше; в M4 каждый stat используется ровно одним перком.
- `value` — `number > 0`.
- Запрещённые поля для M4: `prereq`, `tier`, `cost`, `cooldown`.

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

> **Скоуп §9 / M5:** 3 босса (1/зона, depth 3), 2-фазный AI-бой с phase transition, дейли-инстанс (24ч cool-down), газовые зоны (warehouse/city depth 2-3), 3 T3 чертежа (boss-drop → T3 craft chain), MobRole runtime gating.
>
> **Anti-scope §9 / M5:** модульное оружие / брони-слоты (M5+ отдельная подсистема), полная радио-логика (M6), Yandex SDK (M8), skill tree / prereq / tier / cost / cooldown (M5+ refactor), PvP, boss-cinematics (M7 polish), дополнительные AI behaviors (M5 boss AI переиспользует M3 §5.4 behaviors + phase swap), дейли-instance reward rotation / weekly events.

#### 9.1. Описание

Босс — уникальный моб зоны, размещённый на **глубине 3** (depth=3). Каждый босс имеет `Mob.role = "boss"` и `MobType` из существующего enum (§6.2). Босс появляется **всегда** на depth 3 — CombatScene при инициализации боя на depth 3 спавнит босса вместо (или в дополнение к) обычных мобов.

Ключевые свойства босса:
- **2-фазный бой**: при `boss.hp / boss.hp_max < phase_threshold` происходит **phase transition** — босс меняет `behavior_id` с `phase_1` на `phase_2` (оба из существующих 5 AI-паттернов §5.4). Phase transition — однократный триггер (флаг `phase_transitioned`).
- **Гарантированный boss-drop**: при смерти босса в LootScene добавляется ровно 1 единица ресурса `boss.boss_drop_id` (chance=1.0, count=1) — помимо обычного `drop_table`.
- **Повышенный XP-reward**: `xp_reward` босса значительно выше обычных мобов (см. balance §M5.1).
- **MobRole runtime gating**: CombatScene проверяет `mob.role === "boss"` → инициализирует boss-fight HUD (имя босса, индикатор фазы) + boss-drop guarantee.

На M5 зона `warehouse` получает **depth 3** (до M3 имела только depth 1-2). Зоны `forest` и `city` уже имеют depth 3.

#### 9.2. Boss roster (3 босса)

Каждый босс механически уникален: разные `MobType`, разные пары phase-поведений, разные тактические вызовы. Все behaviour_id взяты из существующих 5 AI-паттернов §5.4 — **никаких новых behaviours не вводится**.

##### 9.2.1. `forest_alpha_mutant` — Альфа-мутант (Лес)

| Поле | Значение |
|---|---|
| `id` | `forest_alpha_mutant` |
| `name_ru` | Альфа-мутант |
| `type` | `mutant` |
| `zone` | `forest` |
| `level` | 5 |
| `behavior_id` (phase 1) | `berserker_low_hp` |
| `phase_2_behavior_id` | `pack_bonus_when_paired` |
| `phase_threshold` | 0.5 |
| `boss_drop_id` | `mutated_gland` |

**Архетип.** Вожак стаи мутантов Леса. Огромный, мощный, теряющий контроль при ранении. В phase 1 — berserker: при HP<50% damage ×2, base_speed −30 (наследует от M3 `fanatic_berserker`, §5.4.3). В phase 2 — pack_bonus_when_paired: проверяет наличие ≥2 живых `forest_alpha_mutant` → в M5 всегда ровно 1 босс → бонус ×1.0 (не активируется). **Однако** эффект berserker (damage ×2, speed −30) от phase 1 сохраняется, т.к. `_berserk_triggered` флаг уже установлен и `damage_min/max` уже удвоены в runtime. Phase 2 механически = «усиленный berserker без pack-бонуса». Pack_bonus_when_paired — forward-compat: в M5+ боссфайт может включать minion-спавн.

**Phase 2 tactical readout:** босс в phase 2 наносит ×2 damage от базового (berserker persist), но медленнее (speed −30). Игрок должен лечиться и добивать.

##### 9.2.2. `warehouse_drone_prime` — Прайм-дрон (Склад)

| Поле | Значение |
|---|---|
| `id` | `warehouse_drone_prime` |
| `name_ru` | Прайм-дрон |
| `type` | `mech` |
| `zone` | `warehouse` |
| `level` | 5 |
| `behavior_id` (phase 1) | `armor_piercing_ranged` |
| `phase_2_behavior_id` | `defensive_cover` |
| `phase_threshold` | 0.5 |
| `boss_drop_id` | `prime_circuit` |

**Архетип.** Тяжёлый военный дрон из довоенных арсеналов, хранящийся на Складе. В phase 1 — armor_piercing_ranged: игнорирует `armor.defense` героя (наследует от M3 `relic_drone`, §5.4.5). В phase 2 — defensive_cover: каждый нечётный ход моба занимает укрытие (+50% defense), пропуская атаку (наследует от M3 `armored_guard`, §5.4.2).

**Phase 2 tactical readout:** босс переключается с чистого оффенса на оборону. На укрыточных ходах его пробить сложно (defense +50%), но он не атакует — игрок может лечиться. На атакующих ходах — по-прежнему больно. Укрытие не игнорирует броню (armor_piercing_ranged сменён на defensive_cover), поэтому в phase 2 броня героя снова работает.

##### 9.2.3. `city_guard_captain` — Капитан охраны (Город)

| Поле | Значение |
|---|---|
| `id` | `city_guard_captain` |
| `name_ru` | Капитан охраны |
| `type` | `human` |
| `zone` | `city` |
| `level` | 6 |
| `behavior_id` (phase 1) | `defensive_cover` |
| `phase_2_behavior_id` | `ranged_keep_distance` |
| `phase_threshold` | 0.5 |
| `boss_drop_id` | `captain_insignia` |

**Архетип.** Последний командир корпоративной охраны, удерживающий периметр Города. Дисциплинированный и тактически гибкий. В phase 1 — defensive_cover: каждый нечётный ход — укрытие, чётный — атака (наследует от M3 `armored_guard`, §5.4.2). В phase 2 — ranged_keep_distance: переключается на ranged-атаку; если у героя melee-оружие — damage ×0.5 (наследует от M3 `looter_sniper`, §5.4.1).

**Phase 2 tactical readout:** босс отказывается от защиты и переходит на дистанционную тактику. Игрок с melee-оружием получает advantage (босс наносит ×0.5 damage), но и сам наносит обычный урон. Игрок с ranged-оружием получает full damage от босса, но бьёт полной мощью. Тактический выбор: в phase 1 босс чередует атаку/укрытие → бить на укрыточных ходах бессмысленно (высокая defense), в phase 2 — ranged duel.

#### 9.3. Flow (2-фазный бой)

```
Sortie reaches depth 3
  → SortieScene инициализирует CombatScene
  → CombatScene спавнит мобов depth 3 + boss (mob.role === "boss")
  → HUD overlay: «Босс: <boss.name_ru> — Фаза 1»
  → boss.behavior_id = phase_1_behavior_id
  → combat loop (standard §2 rules + boss behavior_id)
    → на каждом ходу boss: применяет текущий behavior_id из §5.4
    → после каждой атаки по boss:
      if (boss.hp / boss.hp_max < boss.phase_threshold)
        AND NOT boss._phase_transitioned:
        → computePhaseTransition():
            boss._phase_transitioned = true
            boss.behavior_id = boss.phase_2_behavior_id
            HUD update: «<boss.name_ru> — Фаза 2!»
            // berserker_low_hp special case:
            // если phase_1_behavior_id == "berserker_low_hp"
            //   и _berserk_triggered ещё не установлен:
            //   → trigger berserker effect ПЕРЕД phase swap
            //   (damage ×2, speed −30), затем swap
        → continue combat (boss теперь использует phase_2_behavior_id)
  → boss.hp <= 0:
    → boss dies
    → LootScene: guaranteed drop 1× boss.boss_drop_id
                 + probabilistic drops from boss.drop_table
    → xp_reward начисляется (повышенный, см. balance §M5.1)
    → GameState.progress.<zone>_boss_defeated = true
    → ReturnScene (sortie завершена)
```

**Implementation hint (Engineer).**
> `computePhaseTransition()` — ~10 LOC:
> 1. Проверить `boss._phase_transitioned === false` (флаг на `MobRuntimeState`).
> 2. Если `phase_1_behavior_id === "berserker_low_hp"` и `!boss._berserk_triggered` → триггернуть berserker effect (damage ×2, speed −30, `_berserk_triggered = true`).
> 3. Swap: `boss.behavior_id = boss.phase_2_behavior_id`.
> 4. Set `boss._phase_transitioned = true`.
> 5. HUD update event.
>
> Phase transition происходит **между ходами** — после атаки героя, до следующего хода мобов. Это не прерывает текущий раунд.

#### 9.4. Дейли-инстанс

После первого убийства босса в зоне (`GameState.progress.<zone>_boss_defeated = true`) MapScene показывает кнопку **«Дейли (<zone.name_ru>)»** рядом с обычной кнопкой зоны.

**Flow:**
```
MapScene → кнопка «Дейли (Лес)»
  → canEnterDailyInstance(state, zoneId)?
    → zone.boss_id !== null (у зоны есть босс)
    → state.progress.<zoneId>_boss_defeated === true (босс убит хотя бы раз)
    → cool-down expired (см. ниже)
  → если да:
    SortieScene инициализируется СРАЗУ на depth=3 (skip depth 1+2)
    → CombatScene: bossfight rerun (тот же босс, те же статы)
    → boss dies → LootScene (guaranteed boss-drop + drop_table) → ReturnScene
    → state.progress.daily_completed[zoneId] = Date.now() (timestamp ms)
  → если нет (cool-down активен):
    кнопка «Дейли» disabled, tooltip «Доступно через: <remaining time>»
```

**Cool-down:** `daily_reset_hours = 24` для всех зон (см. balance §M5.6). Формула проверки:
```typescript
canEnterDailyInstance(state: GameState, zoneId: string): boolean {
  const lastTimestamp = state.progress.daily_completed?.[zoneId] ?? 0;
  const cooldownMs = zone.daily_reset_hours * 3600 * 1000;
  return Date.now() - lastTimestamp >= cooldownMs;
}
```

**Дейли triggered до первого kill:** кнопка «Дейли» **не видна** (отсутствует в UI), т.к. `boss_defeated === false` → `canEnterDailyInstance` возвращает false. Показывать disabled-кнопку не нужно — игрок не знает о дейли, пока не убьёт босса первый раз.

**GameState extension:**
```typescript
// в GameState.progress:
daily_completed: Record<string, number>;  // zoneId → timestamp (ms) последнего дейли-kill
// + существующие <zoneId>_boss_defeated: boolean
```

#### 9.5. Газовые зоны

Зоны `warehouse` и `city` на глубинах 2 и 3 — **газовые** (`Zone.levels[].is_gas = true` на depth 2 и 3). Зона `forest` — НЕ газовая.

**Механика:** в CombatScene на газовой зоне, если герой **не имеет `gas_mask`** (ни в armor-slot, ни в inventory) — каждый раунд после хода мобов:
```
hero.hp -= zone.gas_damage_per_turn
```
Урон отображается в HUD: «Газ: -<X> HP/ход».

**С `gas_mask`** в armor-slot ИЛИ в inventory — `gas_damage_per_turn = 0`. Проверка: `hero.equipped_armor?.id === "gas_mask" || hero.inventory.some(i => i.id === "gas_mask")`.

> **M3 lore-stub → M5 mechanical:** `gas_mask` (T2 armor, defense=1, вес 0.5) был lore stub на M3. На M5 он становится механически необходимым предметом для газовых зон. Defense=1 сохраняется (газовая защита — отдельный флаг, не defense-бонус). Content не меняет статы `gas_mask` — только Engineer добавляет gas damage logic.

**Edge-case:** газовый урон может убить героя (hero.hp <= 0 от gas) → поражение, как от обычного боя. Loot loss применяется по §3 правилу 50%.

**Флаги per-depth (а не per-zone):** `Zone.levels[].is_gas` позволяет задать газ только на определённых глубинах. В M5:
- warehouse: depth 1 — `is_gas: false`, depth 2 — `is_gas: true`, depth 3 — `is_gas: true`
- city: depth 1 — `is_gas: false`, depth 2 — `is_gas: true`, depth 3 — `is_gas: true`
- forest: все depths — `is_gas: false` (поле отсутствует → default false)

#### 9.6. T3 craft chain

Boss-drop → T3 recipe → T3 item. Каждый T3 рецепт требует **T2 base item** + **boss-drop из той же зоны** + общие ресурсы. T3 экипировка — лучшая в игре на M5.

**3 T3 рецепта (1/зона):**

| recipe_id | base_item (T2) | boss_drop × qty | other ingredients | output_item (T3) | zone |
|---|---|---|---|---|---|
| `recipe_composite_blade` | `crowbar` | `mutated_gland` × 2 | `scrap` × 5 | `composite_blade` | forest |
| `recipe_prime_shotgun` | `pipe_rifle` | `prime_circuit` × 2 | `scrap` × 6 | `prime_shotgun` | warehouse |
| `recipe_captain_armor` | `tactical_vest` | `captain_insignia` × 2 | `leather` × 4 | `captain_armor` | city |

> **Уточнение vs handoff preview:** preview-таблица в `staff/handoff/M5-GD.md` указывала `crossbow` как T2 base для `prime_shotgun`. `crossbow` не существует в items (M3 ввёл `pipe_rifle` и `crowbar` как T2 оружия). Канон M5: `prime_shotgun` ← `pipe_rifle` (T2 ranged base).

**T3 craft logic:** как и M1/M2/M3 — мгновенный крафт (`craft_time_s = 0`), на базе (BaseScene → CraftScene). T2 base item **потребляется** при крафте (как ingredient, count=1). Recipe `tier = 3`.

**CraftScene gating:** T3 рецепт отображается в CraftScene только если:
1. Игрок имеет все ингредиенты (включая boss-drop).
2. Recipe `unlock_condition = null` на M5 (все T3 рецепты доступны сразу, gated только ингредиентами).

#### 9.7. Edge-cases

- **Multi-level-up при kill boss:** boss даёт повышенный XP (150/200/250). Если это вызывает multi-level-up → LevelUpScene показывает popup'ы последовательно (M4 NB follow-up: Engineer реализует popup queue на M5).
- **Player умирает в bossfight:** GameState не сохраняет partial-kill. Босс respawn'ится на следующем sortie. `boss_defeated` флаг НЕ устанавливается.
- **Player выходит из CombatScene без боя (если разрешено):** boss НЕ defeated. Стандартный retreat/flee logic.
- **Дейли triggered до первого kill:** кнопка «Дейли» не видна в UI (`canEnterDailyInstance` → false по `boss_defeated` флагу). Disabled-кнопка НЕ показывается.
- **Дейли cool-down активен:** кнопка «Дейли» disabled с tooltip «Доступно через: <HH:MM:SS>».
- **Босс + regular мобы в одном бою:** на depth 3 могут спавниться regular мобы вместе с боссом (по `enemy_count` зоны). Boss и regular мобы независимы; boss идентифицируется по `role === "boss"`.
- **Gas kill:** если hero умирает от газового урона → поражение, loot loss 50%. Не отличается от смерти от моба.
- **Дейли skip depth 1-2:** ресурсы с depth 1-2 НЕ собираются при дейли-инстансе. Игрок получает только boss-drop + drop_table лут.

#### 9.8. Связь с другими системами

- **§5.4 (AI-паттерны):** boss phase 1 и phase 2 используют ровно существующие 5 behavior_id. Phase swap = переключение `mob.behavior_id` в runtime. Никаких новых AI behaviours.
- **§6.2 (Mob schema):** 3 новых опциональных поля для boss: `phase_threshold`, `phase_2_behavior_id`, `boss_drop_id` (см. §6.X ниже).
- **§6.4 (Zone schema):** новые опциональные поля: `is_gas`, `gas_damage_per_turn`, `daily_reset_hours`, `levels[].is_gas` (см. §6.X ниже).
- **§8 (Прогрессия M4):** boss kill даёт `xp_reward` → XP-curve `round(40 * level^1.5)`. LevelUpScene popup queue (M4 NB follow-up).
- **§2 (Боевая система):** boss fight использует те же формулы урона/инициативы/укрытия. Gas damage — дополнительный источник урона вне combat formula.
- **§3 (Инвентарь):** boss-drop ресурс добавляется в инвентарь с весом (см. balance §M5.2). T3 items замещают T2 в слотах.
- **§4 (Крафт):** T3 recipes — расширение CraftScene, tier=3.
- **balance.md §M5:** все числа — boss stats, T3 stats, gas damage, daily cool-down.

#### 9.9. Anti-scope M5 (явно)

Следующие фичи **НЕ делаются** на M5. QA Spec проверяет grep на наличие упоминаний вне anti-scope блоков:

- **Модульное оружие / брони-слоты (head-slot, accessory, runes)** — M5+ отдельная подсистема (refactor path вне M5).
- **Полная радио-логика (rewards, ambush, trust scale, faction reputation)** — M6.
- **Yandex SDK / Cloud Saves / Leaderboard / IAP** — M8.
- **Skill tree / поинты / prereq / tier / cost / cooldown** — M5+ refactor path.
- **PvP / мультиплеер** — пост-релиз.
- **Boss-cinematics / animated phase transition** — M7 polish. Phase transition = текстовый popup + static sprite swap.
- **Дейли-instance reward rotation / weekly events** — M5 daily = простой 24h cool-down + boss-drop, без вариативности.
- **Дополнительные AI behaviors** — M5 boss AI переиспользует ТОЛЬКО M3 §5.4 behaviors (`ranged_keep_distance`, `defensive_cover`, `berserker_low_hp`, `pack_bonus_when_paired`, `armor_piercing_ranged`) + phase swap.
- **Minion spawn / sub-boss в bossfight** — M5 boss fight = 1 boss + regular мобы (по enemy_count). Отдельный minion-spawn mechanic — M5+.
- **Active abilities / cooldowns** — M5+ refactor path.

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

#### 10.M6. Радио и доверие — полная логика (M6)

> **Скоуп M6:** радио-выборы теперь имеют последствия. Сигналы делятся на 3 типа (`truth` / `trap` / `ambiguous`); `respond` и `ignore` дают разные исходы (награда / засада / влияние на доверие). Добавляется глобальная шкала `radio_trust` в диапазоне `[−5, +5]`. M3 UI-stub §10.M3 сохраняется как историческая подсекция — её функциональность полностью заменяется §10.M6.

##### 10.M6.1. Сигнальные типы и исходы

| Тип сигнала | `respond` исход | `ignore` исход |
|---|---|---|
| `truth` | Награда (reward → baseStash) + trust impact | Нет награды/засады, trust impact |
| `trap` | Засада (ambush → CombatScene) + trust impact | Нет засады, trust impact |
| `ambiguous` | Награда (reward → baseStash) **ЗАСИМ** засада (ambush) + trust impact | Нет награды/засады, trust impact |

> **Порядок для `ambiguous` respond:** награда применяется **первой** (item добавляется в baseStash), затем запускается засада. Игрок **не теряет** полученную награду при засаде — награда уже в stash, а не в backpack.

> **Fail-safe для Content-ошибок:** если `reward.item_id` отсутствует в `content/items.json` или `trap_mob_id` отсутствует в `content/mobs.json`, Engineer **пропускает** соответствующий outcome (не награду и не засаду) и возвращает typed status `REWARD_SKIPPED` / `AMBUSH_SKIPPED` в результате resolve. QA Acceptance **блокирует** PR Content, если такие статусы появляются при валидных данных. `console.log` **не используется** — только typed return value.

##### 10.M6.2. JSON-схема `RadioSignal` (M6 extension)

```typescript
type RadioSignalType = "truth" | "trap" | "ambiguous";
type RadioSignalOptionId = "respond" | "ignore";

interface RadioReward {
  item_id: string;           // ∈ content/items.json id (M1–M5 items only)
  count: number;             // > 0
}

interface RadioTrustImpact {
  respond: number;           // integer, typically −2..+2
  ignore: number;            // integer, typically −1..+1
}

interface RadioSignal {
  id: string;                // snake_case, формат "radio_<theme>"
  from: string;              // отправитель: "caravan" | "unknown" | "survivor_group_a" | ... (свободная строка)
  subject: string;           // краткий заголовок (1 строка для списка)
  body_ru: string;           // 2-4 предложения текста сигнала
  type: RadioSignalType;     // M6: тип сигнала (заменяет M3 отсутствие поля)
  zone_id: "forest" | "warehouse" | "city";  // M6: зона, к которой привязан сигнал
  options: RadioSignalOption[];  // ровно 2: [{id: "respond", label_ru: "Откликнуться"}, {id: "ignore", label_ru: "Игнорировать"}]
  reward: RadioReward | null;    // M6: null для trap сигналов без награды
  trap_mob_id: string | null;    // M6: id regular mob ∈ content/mobs.json (не boss); null для truth сигналов
  trust_impact: RadioTrustImpact; // M6: {respond, ignore} — exact integer per signal
  expires_after_sorties: number; // > 0; уменьшается после каждой завершённой вылазки
  chosen_option: RadioSignalOptionId | null; // M6: "respond" | "ignore" | null (до выбора)
  resolved: boolean;              // M6: true = последствия применены или сигнал истёк
}
```

> **Миграция M3 → M6:** поле `dismissed` заменяется на `resolved`. Семантика: `resolved = true` означает «сигнал обработан (выбрана опция ИЛИ истёк без выбора), последствия применены». Content M6 должен: (1) удалить 3 M3 dummy-сигнала из `content/radio.json`; (2) заполнить ровно 6 канонических M6 сигналов с полными полями схемы. Engineer M6 должен: удалить поле `dismissed` из runtime type, заменить на `resolved` + `chosen_option`. M3 dummy-сигналы **не сохраняются** как активные JSON-строки — они superseded.

##### 10.M6.3. Шкала доверия (trust flow)

- `GameState.progress.radio_trust: number` — целое, init = `0`, clamp `[−5, +5]`.
- Trust impact применяется **ровно один раз** при выборе опции (`respond` или `ignore`).
- Формула: `radio_trust = clamp(radio_trust + trust_impact.<chosen_option>, −5, +5)`.
- Если signal уже `resolved = true`, повторный вызов resolve — **no-op** (ни trust, ни reward, ни ambush не применяются повторно).
- **Истёкший без выбора:** сигнал с `expires_after_sorties === 0` и `resolved === false` автоматически получает `resolved = true`, `chosen_option = null`. Trust impact = `ignore` значение из `trust_impact.ignore` данного сигнала. Это моделирует «тихое игнорирование».

##### 10.M6.4. Награды (reward rules)

- Rewards добавляются **только** в `GameState.baseStash`, не в `player.backpack`.
- `reward.item_id` ∈ `content/items.json` (M1–M5 items only — никаких новых item types на M6).
- `reward.count` — малые числа: 1-3 для resources, 1 для consumables (см. balance §M6 exact table).
- Если `reward = null`, награда не выдаётся (trap-сигналы без награды).
- Если `reward.item_id` не найден в items.json, outcome возвращает `REWARD_SKIPPED` и награда **не выдаётся**.

##### 10.M6.5. Засады (ambush rules)

- `trap_mob_id` ∈ `content/mobs.json` с `role !== "boss"` (regular mob only).
- Ambush запускает бой с указанным mob через существующий CombatScene (без новых combat mechanics).
- Implementation: Engineer создаёт sortie-like encounter state; CombatScene обрабатывает как обычный бой. После боя игрок возвращается в RadioScene (или BaseScene по усмотрению Engineer).
- Если `trap_mob_id = null`, засада не запускается (truth-сигналы).
- Если `trap_mob_id` не найден в mobs.json, outcome возвращает `AMBUSH_SKIPPED` и засада **не запускается**.

##### 10.M6.6. UI-flow (M6 extension)

```
[BaseScene]
    │ кнопка «Радио»
    ▼
[RadioScene: список активных сигналов]
    │ active = signals.filter(s => !s.resolved && s.expires_after_sorties > 0)
    │ для каждого сигнала: subject + from + type badge (truth/trap/ambiguous unknown to player)
    │ + zone label + «Истекает через X вылазок»
    │ + текущий radio_trust отображается вверху списка
    │ если active пуст → «Эфир пуст», кнопка «Назад»
    ▼ клик по карточке
[RadioScene: детали сигнала]
    │ body_ru
    │ zone label
    │ «Истекает через X вылазок»
    │ две кнопки: «Откликнуться» и «Игнорировать»
    ▼ клик по опции
[RadioScene: исход выбора]
    │ chosen_option = "respond" | "ignore"
    │ resolved = true
    │ trust applied → radio_trust обновлён
    │ outcome summary (1-2 строки):
    │   truth respond: «Получено: <reward>»
    │   trap respond: «Засада! <mob_name> атакует!» → CombatScene
    │   ambiguous respond: «Получено: <reward> … Засада! <mob_name> атакует!» → CombatScene
    │   any ignore: «Сигнал проигнорирован.»
    │ trust change indicator: «Доверие: <old> → <new>»
    ▼ после боя (если ambush) или сразу
[RadioScene: список обновлённых сигналов]
    ▼ кнопка «Назад»
[BaseScene]
```

> **Player не видит тип сигнала заранее.** Type badge в списке — это **UI-решение Engineer'а**, но на M6 рекомендуется **не показывать** type игроку (это убивает смысл выбора). Игрок должен судить по тексту (`from`, `subject`, `body_ru`) — это осмысленный выбор по content-brief правилу «не очевидно правильный вариант».

##### 10.M6.7. Таймер `expires_after_sorties` (M6 extension)

- Счётчик уменьшается в `ReturnScene.onComplete()` (как M3) — **и при успешном возврате, и при поражении** (M3 уменьшал только при успехе; M6 расширяет).
- При `expires_after_sorties === 0` и `resolved === false`: auto-resolve с `chosen_option = null`, trust impact = `trust_impact.ignore` (тихое игнорирование).
- Implementation hint (~8 LOC):

```typescript
for (const sig of GameState.data.radioSignals) {
  if (!sig.resolved && sig.expires_after_sorties > 0) {
    sig.expires_after_sorties -= 1;
    if (sig.expires_after_sorties === 0) {
      sig.resolved = true;
      sig.chosen_option = null;
      applyTrustImpact(sig, "ignore");  // quiet ignore
    }
  }
}
```

##### 10.M6.8. Edge cases

| Edge case | Правило |
|---|---|
| Signal expires while visible in RadioScene | На следующем открытии RadioScene сигнал отсутствует в active list. Если игрок нажал «Откликнуться» на уже истёкший сигнал (race condition): no-op, показать «Сигнал уже истёк». |
| Player clicks same option twice / scene restarts | `resolved = true` → no-op. Idempotent. |
| Trust at clamp boundary (−5 или +5) | `clamp(radio_trust + impact, −5, +5)` — overflow/underflow отбрасывается. |
| Reward item missing from content | Outcome возвращает `REWARD_SKIPPED`. Награда не выдаётся. QA Content PR blocker. |
| Ambush mob missing from content | Outcome возвращает `AMBUSH_SKIPPED`. Засада не запускается. QA Content PR blocker. |
| Ignore trap signal | Нет засады. Trust impact по `trust_impact.ignore`. Trap «не срабатывает» — это корректное поведение (игрок избежал ловушки). |
| Respond to ambiguous (both reward and ambush) | Сначала reward → baseStash, затем ambush. Reward **не теряется**. |
| M3 dummy signals migration | 3 M3 dummy-сигнала superseded — Content M6 удаляет их из `content/radio.json` и заполняет 6 канонических M6 сигналов. Engineer удаляет `dismissed` field, заменяет на `resolved` + `chosen_option`. |

##### 10.M6.9. Связь §10.M6 с другими системами

- **§1 Core Loop:** RadioScene вызывается с BaseScene; `expires_after_sorties` декрементится в ReturnScene (теперь и при defeat).
- **§2 Combat:** Ambush использует существующий CombatScene; никаких новых combat mechanics.
- **§4 Craft / §8 Progression:** Rewards не дают XP и не требуют крафта — direct item в stash.
- **§9 M5 Bosses/Daily/Gas:** Radio не влияет на boss fight / daily instance / gas zones. Независимые системы.
- **§5.4 / §6.4.M3:** Trap mobs — существующие regular mobs из §5.4; зон привязка через `zone_id`.
- **§6 JSON-схемы:** Schema extension в §10.M6.2 (RadioSignal); `GameState.progress` добавляет `radio_trust: number` (Engineer).
- **§10.M3:** Superseded — §10.M3 сохраняется как историческая подсекция. §10.M6 полностью заменяет runtime поведение.

##### 10.M6.10. Anti-scope §10.M6 (что НЕ делает Engineer/Content/Artist на M6)

- **Yandex SDK / Cloud Saves / Leaderboard / IAP / rewarded ads** — M8.
- **Новые зоны / новые мобы / новые боссы / T4 gear** — M6 работает на M5 world (11 mobs, 35 items, 3 zones).
- **Модульное оружие / брони-слоты / runes** — M5+ отдельная подсистема.
- **Skill tree / active abilities / cooldown abilities** — не M6.
- **Faction-specific reputation** — M7+. M6 = одна глобальная шкала `radio_trust`.
- **Real-time/background timers** — expiry остаётся sortie-based.
- **Новые combat mechanics** — ambush использует существующий CombatScene.
- **Voice/audio/sound** — M7 polish.

### 11. Полировка, баланс и расширение контента (M7)

#### 11.M7.1. Scope, Anti-scope и Count Contract

M7 scope: балансный тюнинг M2–M6, контент-экспансия (6 зон, 45 предметов, 24 рецепта), аудио/анимационная полировка (10 UI SFX + 16 visual tweens), smoke regression 40+ пунктов.

**Count Contract**

| Entity | M6 Count | M7 Target | Delta |
|---|---|---|---|
| zones | 3 | 9 | +6 |
| items | 35 | 80 | +45 |
| recipes | 18 | 42 | +24 |
| SFX | 0 | 10 | +10 |
| tweens | 0 | 16 | +16 |
| tests | 164 | 176 | +12 |

**Anti-scope §11.M7** (явные отказы, grep-блок QA):
- Никаких новых мобов или боссов (mob pool заморожен: 8 regular + 3 boss).
- Никаких T4-предметов, оружия, брони или расходников.
- Никаких музыкальных треков, голосовых линий или ambient-лупов.
- Никакой интеграции Yandex SDK, cloud saves, leaderboards, IAP или рекламы.
- Никакого редизайна UI или новых сцен (только polish tweens / SFX).
- Никаких skill tree, perk points, активных способностей или cooldown-систем.
- Никакого расширения слотов модульного оружия / брони за рамки существующей схемы.
- Никакой faction reputation системы помимо глобальной `radio_trust` из M6.

#### 11.M7.2. 9-Zone Model (3 existing + 6 new)

**Key constraint:** mob pool = существующие 8 regular мобов (`marauder`, `wild_dog`, `mutant`, `looter_sniper`, `armored_guard`, `fanatic_berserker`, `pack_rat`, `relic_drone`) + 3 босса (`forest_alpha_mutant`, `warehouse_drone_prime`, `city_guard_captain`). Zero новых мобов.

**3 существующие зоны** (`forest`, `warehouse`, `city`) — не изменяются структурно, допускается только числовой тюнинг в `balance.md` §M7.1.

**Tier progression:** T1 (`forest`, `suburbs`, `school`) → T2 (`warehouse`, `factory`, `hospital`) → T3 (`city`, `metro`, `power_plant`).

**6 новых зон**

| id | name_ru | unlock_condition | description_ru | risk_rating | mob_pool | unique_resources | return_time_multiplier | drop_multiplier |
|---|---|---|---|---|---|---|---|---|
| `suburbs` | Спальные районы | `any_forest_sortie_completed` | «Заброшенные частные дома и гаражи. Мародёры обыскали доски, но в сараях ещё можно найти припасы.» | 1 | `marauder`, `wild_dog`, `pack_rat` | `suburban_scrap`, `garden_seed` | 1.0 | 0.9 |
| `school` | Школа | `suburbs_sortie_completed` | «Разрушенное здание школы. В кабинетах — старые учебники и битая электроника. Здесь водятся крысы и бродяги.» | 2 | `marauder`, `looter_sniper`, `pack_rat` | `school_book`, `broken_tablet` | 1.1 | 1.0 |
| `factory` | Завод | `warehouse_boss_defeated` | «Заброшенный сборочный цех. Машинное масло, ржавые станки и кабели — золото для мастерской.» | 3 | `mutant`, `armored_guard`, `relic_drone` | `machine_part`, `industrial_cable` | 1.3 | 1.1 |
| `hospital` | Больница | `factory_sortie_completed` | «Полуразрушенная районная больница. Медикаменты и стерильные бинты ценятся выше золота.» | 3 | `mutant`, `fanatic_berserker`, `pack_rat` | `hospital_supply`, `sterile_wrap` | 1.3 | 1.0 |
| `metro` | Метро | `city_boss_defeated` | «Тёмные туннели заброшенного метро. Здесь водятся мутанты и дроны-патрули.» | 4 | `looter_sniper`, `armored_guard`, `fanatic_berserker`, `relic_drone` | `metro_token`, `rail_shard` | 1.6 | 1.1 |
| `power_plant` | Электростанция | `metro_sortie_completed` | «Остов энергетического комплекса. Радиация низкая, но мутанты и механизмы не дают покоя.» | 5 | `mutant`, `armored_guard`, `fanatic_berserker`, `relic_drone` | `reactor_ash`, `copper_coil` | 1.8 | 1.2 |

> Боссы (`forest_alpha_mutant`, `warehouse_drone_prime`, `city_guard_captain`) остаются прикреплёнными к зонам `forest`, `warehouse`, `city` (depth 3 и дейли-инстансы). Новые зоны не получают боссов.

**Depth config для 6 новых зон**

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

#### 11.M7.3. 80-Item Taxonomy & 42-Recipe Policy

**Общий состав:** 35 существующих (M1–M6) + 45 новых = 80 предметов.

**Tier policy:**
- T1 — только новые ресурсы из 6 зон (12 шт.).
- T2 — основная масса нового gear: оружие, броня, расходники (33 шт.).
- T3 — ≤5 новых T3; на M7 добавлено 0 новых T3 (всего T3 остаётся 3 из M5).
- **NO T4** — жёсткий потолок.

**Категории новых предметов (45)**

| Категория | Кол-во | Примеры (id) |
|---|---|---|
| T1 resource (новые зонные) | 12 | `suburban_scrap`, `garden_seed`, `school_book`, `broken_tablet`, `machine_part`, `industrial_cable`, `hospital_supply`, `sterile_wrap`, `metro_token`, `rail_shard`, `reactor_ash`, `copper_coil` |
| T2 weapon_melee (craftable) | 3 | `shiv`, `machete`, `sledgehammer` |
| T2 weapon_ranged (craftable) | 2 | `crossbow`, `hunting_rifle` |
| T2 weapon_melee/ranged (loot-only) | 4 | `spear`, `flare_pistol`, `cleaver`, `sawed_off` |
| T2 armor (craftable) | 7 | `riot_shield`, `scout_mask`, `padded_coat`, `ballistic_vest`, `medical_gown`, `insulated_vest`, `metal_helm` |
| T2 armor (loot-only) | 2 | `reinforced_gloves`, `tactical_pants` |
| T2 consumable (craftable) | 12 | `heal_salve`, `stimpack`, `adrenaline_shot`, `tear_gas`, `ammo_bolt`, `ammo_flare`, `electrolyte`, `speed_drug`, `decoy_flare`, `pulse_grenade`, `smoke_grenade`, `energy_gel` |
| T2 consumable (loot-only) | 3 | `ration_bar`, `healing_patch`, `makeshift_grenade` |
| **Итого новых** | **45** | — |

**Uniqueness:** каждый новый предмет проходит ≥2 из 4 критериев `content-brief.md` (механическая уникальность, зоноспецифичность, нарративная функция, тактическая ниша). Полная таблица 45 новых предметов — в [`balance.md` §M7.3](./balance.md#m7--полировка-баланс-и-расширение-контента).

**Recipe policy:** 18 существующих (M1–M6) + 24 новых = 42 рецепта. Каждый новый рецепт использует **минимум 1 ресурс из новых зон**. Полный реестр 24 новых рецептов — в `balance.md` §M7.3.

**Пример покрытия новых ресурсов рецептами:**
- `suburban_scrap` → `recipe_shiv`
- `garden_seed` → `recipe_padded_coat`, `recipe_heal_salve`
- `school_book` → `recipe_scout_mask`, `recipe_ammo_flare`
- `broken_tablet` → `recipe_energy_gel`
- `machine_part` → `recipe_sledgehammer`, `recipe_riot_shield`, `recipe_hunting_rifle`, `recipe_pulse_grenade`
- `industrial_cable` → `recipe_crossbow`, `recipe_ballistic_vest`, `recipe_tear_gas`
- `hospital_supply` → `recipe_stimpack`, `recipe_electrolyte`
- `sterile_wrap` → `recipe_adrenaline_shot`, `recipe_medical_gown`
- `metro_token` → `recipe_decoy_flare`
- `rail_shard` → `recipe_smoke_grenade`
- `reactor_ash` → `recipe_speed_drug`
- `copper_coil` → `recipe_insulated_vest`

#### 11.M7.4. Audio Policy (10 UI SFX)

**Scope:** только короткие UI SFX (≤1 с), без музыки, голосов или ambience.

**Settings:**
- Mute toggle — отключает все SFX.
- Volume slider — диапазон 0.0–1.0, применяется к gain в реальном времени.
- Настройки хранятся в session memory (без cloud save / Yandex SDK).

**Registry (10 trigger IDs)**

| trigger_id | Scene | Event | Max duration |
|---|---|---|---|
| `sfx_hit` | CombatScene | Нанесение / получение урона | ≤1 с |
| `sfx_heal` | CombatScene / InventoryScene | Использование heal-расходника | ≤1 с |
| `sfx_craft` | CraftScene | Успешный крафт рецепта | ≤1 с |
| `sfx_loot` | LootScene | Подбор предмета в лут | ≤1 с |
| `sfx_radio` | RadioScene | Открытие сигнала | ≤1 с |
| `sfx_menu_click` | Any UI | Нажатие кнопки | ≤0.5 с |
| `sfx_level_up` | LevelUpScene | Получение уровня | ≤1 с |
| `sfx_boss_phase` | CombatScene | Переход босса во 2-ю фазу | ≤1 с |
| `sfx_blocked` | CombatScene | Атака заблокирована укрытием | ≤0.5 с |
| `sfx_confirm` | Any UI | Подтверждение позитивного действия | ≤0.5 с |

#### 11.M7.5. Animation Policy (16 Visual Tweens)

**Принцип:** только визуальные Phaser tweens, **никакой игровой логики в callbacks**. Все изменения состояния (HP, инвентарь, уровень) применяются до старта tween; tween лишь отображает результат.

**Registry (16 event IDs)**

| event_id | scene_target | trigger | duration_ms | easing | effect |
|---|---|---|---|---|---|
| `tween_damage_flash` | CombatScene | Герой получает урон | 200 | Linear | Красный оверлей alpha 0→0.3→0 |
| `tween_hit_shake` | CombatScene | Любой юнит получает урон | 150 | Elastic.Out | Camera offset ±2 px |
| `tween_heal_pulse` | CombatScene | Применён heal | 400 | Sine.Out | Масштаб цели 1→1.2→1 |
| `tween_loot_bounce` | LootScene | Предмет подобран | 300 | Back.Out | Иконка y -10 px bounce |
| `tween_craft_spin` | CraftScene | Успешный крафт | 500 | Cubic.InOut | Иконка рецепта rotate 360° |
| `tween_menu_hover` | BaseScene | Hover кнопки | 150 | Sine.Out | Масштаб 1→1.05 |
| `tween_level_up_glow` | LevelUpScene | Level up | 600 | Sine.InOut | Золотое свечение alpha 0→1→0 |
| `tween_boss_phase_red` | CombatScene | Boss phase swap | 400 | Quintic.Out | Красный tint босса flash |
| `tween_return_walk` | ReturnScene | Старт возврата | 1000 | Linear | Спрайт героя x +20 px |
| `tween_xp_bar_fill` | LevelUpScene | Добавлен XP | 300 | Cubic.Out | Ширина бара до target% |
| `tween_radio_static` | RadioScene | Открытие списка сигналов | 250 | Linear | Static alpha flicker 0.2→0.8 |
| `tween_gas_warning` | CombatScene | Gas damage tick | 200 | Linear | Жёлтая рамка alpha 0→0.5→0 |
| `tween_sortie_enter` | SortieScene | Выбрана глубина | 400 | Sine.Out | Оверлей alpha 1→0 |
| `tween_defeat_fade` | CombatScene | Герой погиб | 500 | Quadratic.Out | Экран fade to black |
| `tween_perk_card_deal` | LevelUpScene | Показана perk-карта | 300 | Back.Out | Карта slide y +50→0 |
| `tween_item_tooltip` | InventoryScene | Hover предмета | 150 | Linear | Tooltip alpha 0→1 |

#### 11.M7.6. Smoke Regression Outline

40+ пунктов, сгруппированных по вехам.

**M2 — Core Loop**
1. Базовый цикл: Base → Sortie → Combat → Loot → Return → Craft проходит end-to-end.
2. Перегруз: при `cur_weight > max_weight` кнопка «Возврат» заблокирована.
3. Поражение: 50% веса лута выброшено, экипировка сохранена, XP за убитых мобов остаётся.

**M3 — AI и зоны**
4. `ranged_keep_distance`: `looter_sniper` наносит ×0.5 урона, если герой в melee.
5. `defensive_cover`: `armored_guard` пропускает нечётные ходы, cover активен на следующую атаку.
6. `berserker_low_hp`: `fanatic_berserker` удваивает урон и теряет 30 speed один раз при HP<50%.
7. `pack_bonus_when_paired`: `pack_rat` наносит ×1.5 урона, если живых `pack_rat` ≥2.
8. `armor_piercing_ranged`: `relic_drone` игнорирует `armor.defense` героя.
9. Зона `warehouse`: `return_time_multiplier = 1.2` корректно применяется.
10. Зона `city`: `return_time_multiplier = 1.5` корректно применяется.

**M4 — Прогрессия**
11. XP-curve L1–10 точно воспроизводит `round(40 * level^1.5)`.
12–19. Каждый из 8 перков (`tough_skin`, `sharp_blade`, `lean_pack`, `lucky_scavenger`, `keen_eye`, `reinforced_plates`, `quick_hands`, `fast_learner`) даёт заявленный stat modifier.
20. `LevelUpScene` показывает 3 случайных перка; после исчерпания пула применяется fallback `veteran_conditioning` (+10 hp_max).

**M5 — Боссы и инстансы**
21. `forest_alpha_mutant`: фаза 1 `berserker_low_hp`, фаза 2 `pack_bonus_when_paired`.
22. `warehouse_drone_prime`: фаза 1 `armor_piercing_ranged`, фаза 2 `defensive_cover`.
23. `city_guard_captain`: фаза 1 `defensive_cover`, фаза 2 `ranged_keep_distance`.
24. Дейли-инстанс: 24ч cool-down, пропуск depth 1–2, гарантированный boss-drop.
25. Газовые зоны: `warehouse`/`city` depth 2–3 наносят gas damage за ход без `gas_mask`.
26. T3-крафт: `composite_blade`, `prime_shotgun`, `captain_armor` требуют boss-drop + T2 base.

**M6 — Радио и доверие**
27. `radio_trust` клэмпится в диапазоне [−5, +5].
28–33. Каждый из 6 канонических сигналов (`radio_supply_drop`, `radio_drone_cache`, `radio_distress_trap`, `radio_medical_ambush`, `radio_shady_deal`, `radio_partial_sos`) применяет правильный trust impact и исход (reward / ambush / both).
34. Ambush запускает CombatScene с `trap_mob_id` и возвращает в RadioScene после боя.

**M7 — Полировка и контент**
35. Mute toggle отключает все 10 UI SFX.
36. Volume slider 0.0–1.0 масштабирует gain в реальном времени.
37. `sfx_hit` триггерится на каждом событии урона.
38. `sfx_level_up` триггерится на каждом повышении уровня.
39. `sfx_boss_phase` триггерится на phase transition.
40. Все 16 tweens — чисто визуальные; удаление callback не ломает игровую логику.
41. Цепочка разблокировки 9 зон: заблокированные зоны показывают серую кнопку с подсказкой.
42. `suburbs` открывается после первой успешной вылазки в Лес; `power_plant` — последняя зона.

#### 11.M7.7. Anti-scope §11.M7

Повторение и расширение anti-scope из §11.M7.1 для QA grep:
- **NO new mobs / bosses** — mob pool заморожен.
- **NO T4** — потолок T3.
- **NO music / voice / ambience** — только 10 коротких UI SFX.
- **NO SDK / cloud / ads / IAP** — аудио хранится локально.
- **NO UI redesign** — только SFX и tween polish поверх существующих сцен.
- **NO skill tree / active abilities / cooldowns / modular slots / faction reputation**.

---

### 12. Модульное оружие и броня (M5+)
<!-- GD заполнит на M5+: модули, слоты, уникальные статы из компонентов -->

### 13. Платформа, персистентность и мобильный (M8a) / Монетизация (M8b — отложено)

#### §13a — Платформа Yandex Games, persistence, mobile-first (M8a)

> **Скоуп M8a:** Platform/Persistence/Mobile. Контент (зоны/мобы/айтемы/рецепты/перки/радио/SFX/твины) заморожен на M7. Никаких новых игровых механик. Спека — только этот раздел. Числа — в [`balance.md` §M8a](./balance.md#m8a-платформа-и-персистентность).

---

##### 13a.1 — SDK lifecycle

**Загрузка скрипта:**

```html
<script src="https://yandex.ru/games/sdk/v2"></script>
```

Скрипт добавляется в `index.html` перед bundle-скриптом. Глобальная переменная `YaGames` становится доступна после загрузки.

**Инициализация:**

```
1. YaGames.init() → Promise<SDKInstance>
2. SDK-экземпляр хранится как singleton в src/systems/platform.ts
3. sdk.features.LoadingAPI?.ready() вызывается ПОСЛЕ того, как BootScene завершила preload всех ассетов
```

**Fail-soft contract (4 режима отказа):**

| Условие | Поведение | console |
|---|---|---|
| `YaGames` не определён (нет сети, adblock, локальный dev без iframe) | Игра запускается без SDK-фич. Все вызовы `sdk.*` обёрнуты в guard, возвращают undefined/null/noop. | Нет `console.error`. Один `console.warn` при старте. |
| `YaGames.init()` reject (SDK загружен, но инит не прошёл) | Аналогично: игра без SDK-фич. | Один `console.warn`. |
| SDK загружен, но `LoadingAPI` не поддерживается | `LoadingAPI?.ready()` — optional chaining, noop если undefined. | Тишина. |
| SDK загружен, инит успешен, но `getPlayer()` reject | Cloud save недоступен; игра продолжается с локальной сессией. | Один `console.warn`. |

Во всех случаях игра **запускается идентично M7** — никаких `throw`, никакого `catch → reload`. Пользователь не видит ошибок SDK.

---

##### 13a.2 — Cloud save schema

**Snapshot-поля (сериализация всего GameState):**

```
{
  "level": number,
  "xp": number,
  "perks": string[],                        // id выбранных перков
  "inventory": [{ "id": string, "count": number }],
  "baseStash": [{ "id": string, "count": number }],
  "radio_trust": number,                    // -5 .. +5
  "resolvedSignals": string[],              // id сигналов, которые игрок уже разрешил
  "settings": { "mute": boolean, "volume": number },  // из M7
  "saved_at": string                        // ISO8601, UTC
}
```

**Storage API:**

```typescript
const player = await sdk.getPlayer();
// save (flush = true — принудительная запись)
await player.setData(snapshot, true);
// load
const data = await player.getData(["level", "xp", "perks", "inventory",
  "baseStash", "radio_trust", "resolvedSignals", "settings", "saved_at"]);
```

**Conflict policy:**

- **На boot-load (старт сессии):** загружаем remote snapshot; сравниваем `remote.saved_at` с `local.saved_at` (in-memory сохранение предыдущей сессии). Если `remote.saved_at > local.saved_at` → используем remote (remote newer wins). Иначе — keep local.
- **На каждый save:** last-writer-wins. Текущий snapshot целиком перезаписывает remote. Никакой merge-логики (no diff, no field-level merge, no reconciliation). Это сознательное упрощение: в single-device сценарии конфликтов не возникает; cross-device offline — последний закоммитивший побеждает. QA не ожидает merge UI.

**Throttle:**

Минимальный интервал между cloud-save вызовами: `MIN_CLOUD_SAVE_INTERVAL_S` секунд (см. [`balance.md` §M8a](./balance.md#m8a-платформа-и-персистентность)). Если save вызывается раньше — вызов тихо дропается (no-op, без ошибки).

**Critical save triggers (приоритетные, форсируют запись с учётом throttle):**

| Trigger | Описание |
|---|---|
| post-sortie-return | Возврат из вылазки (любой исход) |
| post-craft | Завершение крафта в CraftScene |
| post-level-up | Подтверждение выбора перка в LevelUpScene |
| settings-change | Изменение mute/volume в SettingsScene |
| perk-choice-commit | Выбор перка после level-up |
| **visibilitychange='hidden'** | Браузер сворачивается/вкладка уходит в фон (сразу, **без throttle**) |
| **beforeunload** | Пользователь закрывает вкладку (сразу, **без throttle**) |

Duck-typing: `visibilitychange` и `beforeunload` вызывают `player.setData(snapshot, true)` **немедленно**, пропуская throttle guard. Это единственные два триггера, которые bypass throttle. Mobile-пользователь, закрывающий вкладку после крафта, не должен потерять данные.

**Quota note:**

Yandex player data quota ≈ `YANDEX_PLAYER_DATA_QUOTA_BYTES` (см. [`balance.md` §M8a](./balance.md#m8a-платформа-и-персистентность)). Ожидаемый размер snapshot: `EXPECTED_SNAPSHOT_SIZE_BYTES` (см. там же). Schema intentionally minimal: нет истории, нет логов, нет дублирующих полей. Запас под quota > ×20.

**Fail-soft:**

Если `getPlayer()` или `setData/getData` недоступны (SDK нет, player reject, quota exceeded), игра продолжается с **локальной in-memory сессией**, идентичной M7. Все изменения `GameState` работают как обычно. UI не показывает ошибок облака — save просто не происходит. Один `console.warn` при старте, если SDK не инициализирован.

---

##### 13a.3 — Locale RU lock

- `<html lang="ru">` уже установлен в `index.html`.
- `src/systems/locale.ts` экспортирует `t(key: string): string` — возвращает RU-строку из единого registry-объекта.
- `sdk.environment.i18n.lang` читается на старте, но **игнорируется** на M8a (всегда RU).
- **Scope применения `t()`:** ОБЯЗАТЕЛЬНО только для нового M8a-кода (например: toast «Ошибка сохранения», новые UI-строки в SettingsScene при миграции). Существующие M2–M7 UI-строки остаются RU-литералами. Массовый рефакторинг существующих сцен на `t()` отложен в BACKLOG (пост-MVP) — это отдельная задача, не входящая в M8a scope.
- **Forward hook:** любая строка, показываемая пользователю из нового кода, проходит через `t()`. В будущем подключение EN — замена registry и, опционально, масс-миграция старых строк.

---

##### 13a.4 — Mobile-first viewport polish

**Viewport meta:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

**Safe-area CSS:**

```css
.game-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

Safe-area применяется к корневому контейнеру игры / HUD-overlay, чтобы контент не обрезался notch-устройствами (iPhone 14+, Pixel 7+).

**iOS audio autoplay unlock:**

```
Первый touchstart / pointerdown на canvas (любой tap):
  → если AudioContext не создан → создать
  → если AudioContext suspended → resume()
  → после unlock — SFX воспроизводятся нормально
```

Никакой попытки autoplay до первого gesture. Создание AudioContext синхронизируется с первым взаимодействием.

**Portrait orientation lock:**

- Через Yandex SDK: `sdk.screen.orientation?.lock("portrait")`.
- Или через manifest.json: `"orientation": "portrait"`.
- На M8a **нет landscape-поддержки**. Игра всегда portrait-only.

**Double-tap zoom suppression:**

```typescript
canvas.addEventListener("touchstart", (e) => {
  if (e.target === canvas) e.preventDefault();
}, { passive: false });
```

`preventDefault` только на самом canvas (не на body), чтобы не блокировать скролл нативных элементов (если есть).

---

##### 13a.5 — Settings persistence migration

На M7 `Settings` (mute + volume) существовали только в in-memory (runtime state). На M8a они мигрируют в cloud-save schema (поле `settings` внутри snapshot).

**Migration flow:**

```
1. boot: загружаем remote snapshot
2. если settings есть в snapshot → применяем remote значения
3. если нет (первый запуск, нет cloud) → defaults:
     mute = false
     volume = 1.0
4. изменения в SettingsScene → throttled cloudSave()
```

Начальные defaults зашиты как константы в `balance.md` §M8a.

---

##### 13a.6 — Anti-scope M8a (явный)

Следующие категории НЕ входят в §13a и запрещены к реализации на M8a:

- **NO ads** (rewarded / interstitial) — реализовано в M8b §13b.
- **NO IAP** (catalog / purchase / restore) — реализовано в M8b §13b.
- **NO leaderboards / achievements** — пост-релиз (BACKLOG).
- **NO telemetry / analytics / backend**.
- **NO новых языков** — только RU. `t()` для нового кода, масс-миграция в BACKLOG.
- **NO новых mobs / bosses / zones / items / recipes / perks / radio signals / SFX / tweens** — контент заморожен на M7.
- **NO новых combat / craft / radio / progression механик** — геймплей заморожен на M7.
- **NO music / voice / ambience** — аудио заморожено на 10 SFX M7.
- **NO UI redesign** — только safe-area / viewport / zoom suppression поверх существующих сцен.
- **NO third-party libs** кроме `YaGames` SDK (внешний script tag, не npm-зависимость).

#### §13b — Монетизация (M8b)

Монетизация через Yandex Games SDK: rewarded video, interstitial, sticky banner, in-app purchases (IAP) и ads-remover.

---

##### 13b.1 — Rewarded Video

API: `ysdk.adv.showRewardedVideo({callbacks: {onOpen, onRewarded, onClose(wasShown), onError}})`. Callback `onRewarded` срабатывает когда рекламное видео засчитано, в нём выдаётся награда. `onClose(wasShown)` получает `boolean` — показана ли была реклама. `onError` — ошибка загрузки/показа. Yandex не лимитирует частоту rewarded-показов.

**4 триггера:**

**T1 — ×2 looting (ReturnScene):** После успешной вылазки, перед кнопкой "Вернуться на базу". Кнопка "×2 (реклама)" рядом. Награда: удвоить все resource-типы в sortie loot (пройти инвентарь, добавить копию каждого resource item). Fail-soft: если ad не загрузился или platform unavailable → обычный возврат без удвоения. При `disable_ads` → мгновенное удвоение без просмотра (текст кнопки "×2 (без рекламы)").

**T2 — Second chance in combat (CombatScene):** При смерти игрока (HP ≤ 0). Кнопка "Второй шанс (реклама)". Награда: восстановить 50% max HP, продолжить бой с того же раунда. Ограничение: 1 second-chance на вылазку. Fail-soft: без ad → обычная смерть (return to map, lose loot). При `disable_ads` → мгновенное восстановление (кнопка "Второй шанс (без рекламы)").

**T3 — Daily reset skip (MapScene/SortieScene):** Если daily_instance на кулдауне (cooldown > 0). Награда: мгновенный сброс daily-таймера до 0. Fail-soft: ждать таймер. При `disable_ads` → мгновенный сброс.

**T4 — Gas refill +1 (MapScene/SortieScene):** Если `gas < GAS_MAX`. Награда: `gas += 1`. Кулдаун между rewarded gas: `GAS_REWARDED_COOLDOWN_S = 300` (5 min). Fail-soft: ждать пассивной регенерации. При `disable_ads` → мгновенный газ.

**Общие правила rewarded:**
- Кнопка видна только если ad доступен (`ysdk !== null`). На локальном dev без SDK кнопка не показывается.
- Никаких `setInterval` auto-call'ов — только explicit user action.
- Per-context кулдауны в `balance.md` §M8b.

---

##### 13b.2 — Interstitial

API: `ysdk.adv.showFullscreenAdv({callbacks: {onOpen, onClose(wasShown), onError}})`. Fullscreen ad, перекрывает всю игру.

**1 размещение — post-sortie (ReturnScene → BaseScene):**
1. ReturnScene показывает результат вылазки (loot, XP, etc.)
2. Игрок жмёт "Вернуться на базу"
3. Вызывается `showFullscreenAdv()`
4. Коллбэк `onClose(wasShown)` — независимо от `wasShown`, переход в BaseScene

Правила:
- Частота показа контролируется Яндексом (frequency cap на серверной стороне). Игра не управляет частотой.
- Не показывать если `disable_ads` active (переход без interstitial).
- Не показывать если platform unavailable (fallback: переход без interstitial).
- Не показывать interstitial во время боя/крафта/лута — только на transition ReturnScene → BaseScene.

---

##### 13b.3 — Sticky Banner

API: `ysdk.adv.showBannerAdv()` / `ysdk.adv.hideBannerAdv()` / `ysdk.adv.getBannerAdvStatus()`. Требует включения «Use the API to display a sticky-banner» в Developer Console.

**Scene-aware visibility:**

| Сцена | Баннер |
|---|---|
| BaseScene, CraftScene, InventoryScene, MapScene | **show** |
| CombatScene, SortieScene, LootScene, RegionScene (gameplay) | **hide** |
| BootScene (загрузка) | **hide** |

- Позиция: bottom (portrait + landscape), настраивается в Developer Console
- При `disable_ads` → баннер всегда скрыт (hide + не показывать нигде)
- Fail-soft: если platform unavailable → no-op

---

##### 13b.4 — In-App Purchases (IAP)

API: `ysdk.getPayments()` → `payments` объект с методами:
- `payments.purchase({id: string, developerPayload?: string})` → `Promise<IPurchase | reject>`
- `payments.getPurchases()` → `Promise<IPurchase[]>`
- `payments.getCatalog()` → `Promise<IProduct[]>`
- `payments.consumePurchase(purchaseToken: string)` → `Promise<void>`

Client-side processing (`signed: false`). Server-side верификация — MVP не требуется (будет в M9+).

**IAP-каталог (3 продукта, создаются в Developer Console):**

| ID | Название | Тип | Цена (YAN) | Награда |
|---|---|---|---|---|
| `disable_ads` | Отключить рекламу | non-consumable | ~99 | Все rewarded → instant, interstitial/banner отключены навсегда |
| `starter_pack` | Стартовый набор | consumable | ~49 | +5 bandage +3 scrap +2 electronics → baseStash |
| `gas_pack` | Бак топлива | consumable | ~29 | +3 gas (сверх капа) |

**Check-unprocessed-purchases (обязательно для модерации §1.13.1):**

На boot (после `initPlatform()` и `initIap()`):
```
1. payments.getPurchases() → массив покупок
2. Для каждой покупки:
   a. Если non-consumable (disable_ads): установить ads_removed флаг
   b. Если consumable (starter_pack, gas_pack):
      - ВЫДАТЬ награду ПЕРВОЙ (добавить в baseStash/gas)
      - ПОТОМ payments.consumePurchase(token) — удаляет покупку
3. Если consumePurchase успешен → покупка обработана
```

**Consume flow (для новых покупок после boot):**
```
1. payments.purchase({id: 'starter_pack'}) → resolve с {productID, purchaseToken}
2. Выдать награду (baseStash += items)
3. payments.consumePurchase(purchaseToken) → удалить из списка
```

Warning: consumePurchase удаляет покупку безвозвратно. Награда должна быть выдана ДО consume.

**Общие правила IAP:**
- `payments.getCatalog()` — динамический каталог цен из консоли. В коде используются ID, цены берутся из ответа `getCatalog()` для UI.
- При failed purchase (юзер отменил / закрыл окно / таймаут) — `Promise` rejects, игра не выдаёт награду.
- При `initIap()` fails (no SDK / no payments) — IAP-кнопки не показываются, unprocessed-check пропускается, игра работает без покупок.

---

##### 13b.5 — Ads-Remover Logic

`disable_ads` — non-consumable продукт. Проверка при каждом boot через `payments.getPurchases()`.

**Если disable_ads куплен:**

| Компонент | Поведение |
|---|---|
| Rewarded кнопки | Мгновенная награда без просмотра рекламы. Текст кнопки: "×2 (без рекламы)" / "Второй шанс (без рекламы)" и т.д. |
| Interstitial | Не показывается. ReturnScene → BaseScene мгновенно. |
| Sticky banner | Всегда скрыт. `hideBannerAdv()` на boot, не показывать ни в каких сценах. |

**Если disable_ads НЕ куплен:** стандартный ad-fallback (если ad не загрузился / ошибка, игра продолжается без награды для rewarded, без блокировки для interstitial).

Хранить `adsRemoved` флаг в рантайме; не в cloud-save (восстанавливается из `getPurchases()` каждый boot).

---

##### 13b.0 — Anti-scope M8b (явный)

Следующие категории НЕ входят в §13b и запрещены к реализации на M8b:

- **NO leaderboards** (`getLeaderboards`, `setScore`) — пост-релиз BACKLOG.
- **NO achievements** (`getAchievements`).
- **NO server-side IAP verification** (`signed: true`) — MVP client-side only.
- **NO backend / telemetry / analytics**.
- **NO новых языков** — только RU.
- **NO новых mobs / bosses / zones / items / recipes / perks / radio signals / SFX / tweens** — контент заморожен на M7.
- **NO новых combat / craft / radio / progression механик** — gameplay заморожен на M7.
- **NO music / voice / ambience**.
- **NO UI redesign** — только монетизационные кнопки/текст поверх существующих сцен.
- **NO third-party libs** кроме Yandex SDK.
- **M8a §13a не модифицируется** — platform/cloudSave/locale/audioUnlock/viewport untouched.

---

# M11 Addendum (2026-05-28)

> Сохранены оригинальные секции M1-M10 выше. Новые правила/модели M11 описаны здесь.
> Когда секция выше противоречит этой — приоритет у этого Addendum'а.

## §M11.1 Item Model — Three Classes

После M11.0a items.json расширен с 80 до 187 предметов. Введён `item_class`:

- **craft** — самоделы (8 шт): Заточка, Поджига, Трубка, Обрез, Копьё, Арбалет, Хлопушка, Молотов. Всегда работают, низкий тир (T1-T2), деградируют по `durability`.
- **drop** — реальные стволы (15 шт): ПМ, ТТ, АПС, ППШ, СКС, АКС-74У, АКМ, АК-74, РПК, Тигр, Мосина, СВД, ИЖ-43, Сайга, Бекас + 3 ножа + 3 гранаты. Нужны парты + ammo. Средний-высокий тир (T2-T5).
- **modification** — моды (8 шт): ПБС-1, ПСО-1, прицелы, расш. магазины, штык-нож, тактическая рукоятка. Прицепляются к drop оружию.
- **part** — части drop-оружия (60 шт): pm_frame, ak74_barrel, svd_bolt и т.д. Нужны для сборки. Дропаются с мобов.
- **broken_craft** — сломанный craft, разбирается на верстаке (30% возврат материалов).

Новые поля на Item (см. `src/types/items.ts`):
- `caliber` — для drop weapons, привязка к ammo: "9x18", "7.62x25", "5.45x39", "7.62x39", "7.62x54R", "12ga", ".308"
- `magazineSize` — ёмкость магазина (drop weapons)
- `durability` — для craft (5-60 шотов до поломки)
- `parts` — `string[]` ID-партов нужных для сборки (drop weapons)
- `fits_weapons` — `string[]` для модов и партов (к каким стволам подходит)
- `name_real_ru` / `name_generic_ru` — парные имена ствола («ПМ» / «компактный пистолет 9мм»)
- `recipe_type` — "craft" | "assemble" (для UI фильтра в CraftScene)
- `is_mod` — true если рецепт даёт модификацию

См. полный ADR: [`docs/decisions/ADR-001-three-class-items.md`](decisions/ADR-001-three-class-items.md).

## §M11.2 Combat (минорные правки до M12)

Боёвка по сути M3-9 пока сохраняется. M12 «Combat Overhaul» введёт:
- Action points (3 AP/turn)
- Statuses (Кровотечение, Оглушён, Подавлен, Отравлен, Горящий, Слепой)
- Active abilities (manual trigger из skill tree)
- Position layer (Открыто / Укрытие / Между)

Полная спецификация: [`docs/redesign/M12-COMBAT-OVERHAUL.md`](redesign/M12-COMBAT-OVERHAUL.md).

В M11 единственное изменение боёвки — расход ammo по `caliber` для drop weapons.

## §M11.3 Crafting — Два режима

UI CraftScene (M11.0c) теперь имеет фильтр-табы:
- **🔨 Крафт** (56 рецептов) — самоделы из ресурсов. `recipe_type: "craft"` или legacy (35 без поля).
- **🎯 Сборка** (15 рецептов) — реальные стволы из партов. `recipe_type: "assemble"`. Счётчик деталей `[3/5]`.
- **Всё** (71) — оба режима, default tab.

**Разбор broken_craft** (планируется M11.0d или M12.0):
- Игрок может на верстаке разобрать broken_craft → 30% возврат материалов от рецепта
- Возврат округляется вниз, минимум 1

## §M11.4 Loot — Двойной формат mob.drops

После M11.0e (PR #99) каждый моб может иметь:
- `drop_table` (legacy M3 формат — string IDs со weighted random)
- `drops` (новый M11 формат — `{id, chance, count?: [min,max]}[]`)

Bridge в `src/systems/loot.ts:generateMobLoot` читает оба формата и мерджит. Один моб может использовать оба одновременно.

11 мобов:
- 4 базовых (T1-T2): marauder, wild_dog, mutant, pack_rat
- 5 спец (T2-T4): fanatic_berserker, looter_sniper, armored_guard, relic_drone, city_guard_captain
- 2 альфа (T4): forest_alpha_mutant, warehouse_drone_prime

3 босса для M11.3 (TBD): boss_factory_brigadier, boss_metro_warden, boss_hospital_chief.

## §M11.5 Progression — Skill Tree

Старая система (M3, 8 случайных перков из dropping) **deprecated**.

После M11.4 (PR #109):
- Древо 3 ветки × 8 узлов = 24 узла
- **Боец** (красный): Меткость I/II, Крит I/II, Урон в укрытии, Быстрая перезарядка + 2 active (Прицельный, Двойной выстрел)
- **Выживальщик** (зелёный): HP I/II, Регенерация в укрытии, Эффективность брони, Бонус мед, Иммунитет к кровотечению, Iron Will + 1 active (Последний вздох)
- **Ремесленник** (оранжевый): 8 пассив (Скорость крафта, Доп лут, Бонус разбора, и др.)

**Очки навыков:** +1 за каждый level-up. Тратить в SkillTreeScene (hotspot «НАВЫКИ» на лежанке в Оплоте).

**Save migration v2→v3:** 8 legacy perk IDs мигрируют через `PERK_MIGRATION_MAP` (см. `src/state/SkillTree.ts`). Неизвестные перки конвертируются в bonus skill points (по 1 за каждый).

## §M11.6 Tiers

T1-T5 — система rarity и силы предметов. Цвета рамок в UI:
- T1 — серый (`#808080`)
- T2 — белый (`#d4c5a0`)
- T3 — синий (`#4a7bc8`)
- T4 — фиолетовый (`#8a4ac8`)
- T5 — золотой (`#c5a267`)

Привязка к зонам (после M11.1):
- T1 → forest, suburbs (первые зоны)
- T2 → warehouse, school
- T3 → city, hospital, factory
- T4 → metro, power_plant
- T5 → дроп с боссов M11.3

Точная балансировка по тирам — в [`balance.md`](balance.md) и в M11.1 spec.

**Известные balance flags** (M11.5 review, см. [`staff/handoff/M11.5-GD-rebalance-flags.md`](../staff/handoff/M11.5-GD-rebalance-flags.md)):
- F1: prime_shotgun T3 — урон выше T5 (исправить в M11.1)
- F2: aps T3 — урон ниже соседних T3 (исправить в M11.1)
- F3: kukri T4 — урон ниже T3 ranged (исправить в M11.1)
