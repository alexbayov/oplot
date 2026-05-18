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
type MobType = "human" | "animal" | "mutant" | "boss";
// "boss" — НЕ в MVP, оставлено для совместимости со схемой content-brief.

type MobBehavior = "aggressive" | "defensive" | "passive" | "ambush";
// MVP использует только "aggressive" (с поведенческой особенностью у marauder — flee при low HP).

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
  description_ru: string;
  flavor_ru: string;
  drop_table: DropEntry[];
}
```

> **Уточнение к `content-brief.md`:** content-brief.md описывает поле `damage` как одно число. Канон GDD M1 расширяет его до `damage_min` / `damage_max`, чтобы соответствовать формуле боя §2. Content Designer обязан использовать `damage_min` / `damage_max`.

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
  unlock_condition: string;      // "start" для forest в MVP
}
```

> **Уточнение к `content-brief.md`:** content-brief.md описывает зону как плоский объект (`resources`, `mobs`, `boss_id`, `unique_resources`). Канон GDD M1 добавляет массив `levels[]` для механики 3-х глубин Леса (§1). Поле `unique_resources` сохраняется ради совместимости; в MVP при одной зоне оно равно полному списку `resources`.

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

### 7. Зоны и карта (M3)
<!-- GD заполнит на M3: новые зоны (Склад, Город), переходы, прогрессия глубины -->

### 8. Перки и прогрессия (M4)
<!-- GD заполнит на M4: XP-кривая выше 5 уровня, дерево перков, UI прогрессии -->

### 9. Боссы и инстансы (M5)
<!-- GD заполнит на M5: мини-боссы, дейли-инстансы, чертежи T3+ -->

### 10. Радио и доверие (M6)
<!-- GD заполнит на M6: сигналы, решения, засады/награды, шкала доверия -->

### 11. Модульное оружие и броня (M5+)
<!-- GD заполнит на M5+: модули, слоты, уникальные статы из компонентов -->

### 12. Монетизация (M8)
<!-- GD заполнит на M8: реклама, IAP, Yandex SDK интеграция -->
