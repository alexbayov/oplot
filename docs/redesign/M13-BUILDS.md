# M13 — Билды: контракт компонент-схемы и 2-3 стартовых стратегии

> **Статус:** черновик PR-3 (схема + документ; миграция содержимого в PR-4, UI крафта в PR-5).
> **Дата:** 2026-06-13
> **Автор:** Ross (ross@bimross.com), согласовано с Алексеем Баёвым.
> **Контракт PR-3:** добавляем схему `itemSchema` для целевой таксономии M13, никакого нового контента в `items.json` не катим, soft-warn на boot говорит «187 предметов ещё не на M13-схеме, мигрирует PR-4».

## Зачем этот документ

PR-3 фиксирует контракт без миграции данных. Чтобы PR-4 не превратился в «навалили 200 предметов по вкусу», описываем словами, какие билды должна поддержать схема и какие компоненты под них нужны. Это даёт PR-4 чёткий шорт-лист предметов вместо открытого списка.

Если по ходу PR-4 окажется, что нужный билд не собирается на текущей схеме — это сигнал расширять схему здесь, а не выкручиваться через `stats: any`.

## Таксономия (что закреплено в `itemSchema.ts`)

`discriminatedUnion("kind", ...)` с шестью ветками:

- `material` — сырьё с вылазки: дерево, металл, ткань, порох, провода. Слот не имеет, тир задаёт качество.
- `component` — крафтовый промежуток: рафинированный металл, пороховой заряд, плита брони. Поле `fits: "weapon" | "armor"` показывает, куда такой компонент идёт.
- `consumable` — расходник: бинт, аптечка, патрон. Обязательные `stats: {effect_type, effect_value, charges}`.
- `weapon` — готовая часть оружия со `slot: barrel | action | stock | mod`. Сборка из четырёх таких частей = собранное оружие. Опциональные `affixes` (до 3).
- `armor` — готовая часть брони со `slot: plate | strap | helm`. Сборка из трёх частей = комплект. Опциональные `affixes` (до 3).
- `tool` — инструмент: лом, фонарь, отмычки. Опциональные `stats: {tool_type, uses}`.

Тир — `1..5`. Поля общие: `id`, `name_ru`, `weight_kg`, `zone_origin`, `description_ru`, `flavor_ru?`, `recipe_id`, `tier`.

Что *не* закладываем в PR-3 (намеренно):

- глобальный реестр аффиксов — пока произвольный `{id, value}` до 3 штук, расширим под нужды баланса в PR-4;
- редкость отдельным полем — сейчас наследуется из `tier`;
- наборы / сет-бонусы — отложены до M14;
- износ и ремонт — обсуждаются в M13 PR-6, не входят в контракт схемы.

## Slot-енумы как контракт билда

Slot-енумы фиксируют, *сколько кубиков* в каждом билде:

- оружие = 4 кубика (barrel + action + stock + mod);
- броня = 3 кубика (plate + strap + helm).

Это потолок сложности крафта M13: не больше 4 решений за оружие, не больше 3 за броню. Если будущий билд требует 5+ слотов, либо обрезаем, либо официально расширяем енум здесь, не наплывом в данных.

## Билд-стратегия №1 — Стрелок

Оружие — самозарядный пистолет под `9x18`.

- `barrel`: ствол `pm_barrel` (tier 2)
- `action`: самозарядный механизм `pm_action` (tier 2)
- `stock`: рукоять с упором `pm_grip` (tier 1)
- `mod`: глушитель `pm_silencer` (tier 3), опционально

Броня — лёгкая, скорость > броня.

- `plate`: тканевая подкладка `padded_lining` (tier 1)
- `strap`: разгрузка `tactical_strap` (tier 2)
- `helm`: бандана `scarf_hood` (tier 1)

Расходники: `ammo_9x18` (consumable), `bandage` (consumable). Промежутки: `gunpowder` (material), `refined_metal` (component, fits weapon).

Когда играется: первые часы, низкий уровень. Низкий вес, держит дистанцию, ловит редкие патроны.

## Билд-стратегия №2 — Танк

Оружие — короткое, но злое: помповый дробовик.

- `barrel`: короткий ствол `shotgun_barrel` (tier 3)
- `action`: помповый механизм `shotgun_pump` (tier 3)
- `stock`: тяжёлый приклад `wood_stock` (tier 2)
- `mod`: расширитель магазина `mag_ext` (tier 4)

Броня — тяжёлая, скорость падает, но HP-cap растёт.

- `plate`: пластина `steel_plate` (tier 4)
- `strap`: бронежилет `ballistic_strap` (tier 3)
- `helm`: каска `metal_helm` (tier 3)

Расходники: `ammo_12g` (consumable), `medkit` (consumable). Промежутки: `steel_ingot` (component, fits armor), `gunpowder` (material).

Когда играется: средний уровень, после стабилизации базы. Идёт в ближний бой, тащит много, медленно.

## Билд-стратегия №3 — Гриндер

Оружие — копье или самопал, ставка не на оружие, а на расходники и компоненты с вылазки.

- `barrel`: лезвие `spear_head` (tier 2)
- `action`: древко `spear_shaft` (tier 1)
- `stock`: оплётка `grip_wrap` (tier 1)
- `mod`: токсин на лезвии `poison_coat` (tier 3)

Броня — функциональная, не топ-числа, но `affixes` под weight/loot.

- `plate`: рюкзачный жилет `scout_vest` (tier 2) с аффиксом `+carry_kg`
- `strap`: пояс `harness_belt` (tier 2) с аффиксом `+inventory_slots`
- `helm`: налобный фонарь `headlamp` (tier 2) с аффиксом `+scavenge_chance`

Расходники: `energy_drink`, `ration_bar`. Промежутки: `cloth`, `wire`, `circuitry` (все material).

Когда играется: long-haul. Жертвует уроном ради того, чтобы за вылазку нести в 1.5× больше. Кормит крафт-цепочку базы.

## Шорт-лист для PR-4

Минимум, чтобы три билда выше собрались полностью (без дублей):

- `material`: wood, scrap, cloth, gunpowder, wire, circuitry, leather (= 7);
- `component`: refined_metal, steel_ingot, plate_steel, powder_pack, fabric_weave (= 5; `fits` распределён 2 weapon / 2 armor / 1 универсал в стат-поле);
- `consumable`: bandage, medkit, ammo_9x18, ammo_12g, energy_drink, ration_bar (= 6);
- `weapon`: pm_barrel, pm_action, pm_grip, pm_silencer, shotgun_barrel, shotgun_pump, wood_stock, mag_ext, spear_head, spear_shaft, grip_wrap, poison_coat (= 12, по 4 на билд);
- `armor`: padded_lining, tactical_strap, scarf_hood, steel_plate, ballistic_strap, metal_helm, scout_vest, harness_belt, headlamp (= 9, по 3 на билд);
- `tool`: crowbar, lockpick, flashlight (= 3, не привязан к билду но нужен для зон).

Итого ~42 предмета для трёх рабочих билдов. Текущие 187 в `items.json` — переходят в архив или раскладываются по этой таблице в PR-4.

## Чек-лист контракта (для ревью)

- [x] `kind` фиксирует категорию, не размывается через `type`/`item_class`.
- [x] `weapon.slot` и `armor.slot` — закрытые енумы (не свободный текст).
- [x] Affixes ограничены (`.max(3)`), `value: z.number()` (не строка, не объект).
- [x] Boot-validation — soft-warn со счётчиком, не бросает исключения.
- [x] Тесты покрывают happy-path для всех 6 kind и fail-path для слотов/тиров.
- [ ] PR-4: миграция `items.json` под этот контракт, шорт-лист выше как опорный.
- [ ] PR-5: `CraftScene` принимает `slot` как ось UI (4 кубика для оружия, 3 для брони).
