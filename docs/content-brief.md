# Content Brief — «Оплот»

> Правила создания контента. Content Designer обязан сверяться с этим документом при написании любого JSON.

## Золотое правило

**Каждый элемент контента должен быть уникален игромеханически И нарративно.**

Два предмета не могут отличаться только числами. Если «Нож» и «Тесак» делают одно и то же но с разным уроном — это **баг контента**, один из них надо переделать или убрать.

## Критерии уникальности предмета

Предмет считается уникальным, если выполняется **хотя бы 2 из 4**:

1. **Механическая уникальность** — делает что-то, чего не делает ни один другой предмет того же типа (доп. эффект, особый скейлинг, уникальное взаимодействие)
2. **Зоноспецифичность** — крафтится только из ресурсов конкретной зоны
3. **Нарративная функция** — привязан к лору, радио-квесту или боссу
4. **Тактическая ниша** — оптимален для конкретной ситуации (анти-броня, AoE, лёгкий для побега)

## Чек-лист перед PR

- [ ] Каждый предмет имеет уникальное `description_ru` (не шаблонное)
- [ ] Каждый предмет имеет `flavor_ru` (атмосферная цитата, 1 строка)
- [ ] Нет двух предметов с одинаковой механической ролью
- [ ] Все числа (урон, вес, HP) — из `balance.md`, не выдуманы
- [ ] Зоноспецифичные ресурсы не дублируются между зонами
- [ ] Радио-сигналы имеют осмысленный выбор (не «очевидно правильный» вариант)

## Формат JSON-файлов

### items.json
```json
[
  {
    "id": "string — snake_case, уникальный",
    "name_ru": "string — название по-русски",
    "type": "resource | weapon_melee | weapon_ranged | armor | consumable | module | misc",
    "tier": "number — 1-5",
    "zone_origin": "string — id зоны или 'universal'",
    "weight_kg": "number",
    "description_ru": "string — 1-2 предложения, что это и зачем",
    "flavor_ru": "string — атмосферная цитата или заметка",
    "stats": {},
    "recipe_id": "string | null — ссылка на рецепт"
  }
]
```

### mobs.json
```json
[
  {
    "id": "string — snake_case",
    "name_ru": "string",
    "type": "human | animal | mutant | boss",
    "zone": "string — id зоны",
    "level": "number",
    "hp": "number — из balance.md",
    "damage": "number — из balance.md",
    "defense": "number — из balance.md",
    "xp_reward": "number — из balance.md",
    "behavior": "string — aggressive | defensive | passive | ambush",
    "description_ru": "string",
    "drop_table": [
      { "item_id": "string", "chance": "number 0-1" }
    ]
  }
]
```

### recipes.json
```json
[
  {
    "id": "string — recipe_<result_id>",
    "result_id": "string — id предмета",
    "result_count": "number",
    "ingredients": [
      { "item_id": "string", "count": "number" }
    ],
    "tier": "number — 1-5",
    "unlock_condition": "string | null — что нужно для разблокировки"
  }
]
```

### zones.json
```json
[
  {
    "id": "string — snake_case",
    "name_ru": "string",
    "level": "number — рекомендованный уровень",
    "description_ru": "string",
    "resources": ["string — id ресурсов"],
    "mobs": ["string — id мобов"],
    "boss_id": "string | null",
    "unique_resources": ["string — ресурсы ТОЛЬКО в этой зоне"]
  }
]
```

### radio.json
```json
[
  {
    "id": "string — radio_NNN",
    "text_ru": "string — текст сигнала (1-3 предложения)",
    "type": "truth | trap | ambiguous",
    "zone": "string — id зоны",
    "reward": { "item_id": "string", "count": "number" },
    "trap_mob_id": "string | null",
    "trust_impact": "number — -2..+2"
  }
]
```

## Тональность текстов

- **Жёсткий реализм** с элементами чёрного юмора
- Никакой магии, фэнтези, зомби
- Техногенная катастрофа, не ядерная война
- Персонажи — обычные люди, не супергерои
- Flavor-тексты: короткие, с характером (граффити, заметки, радиоперехваты)

---

## M11.0a Content Drop — что добавлено (2026-05-28)

### Состояние после M11.0a-e:

| Категория | До M11 | После M11.0a | Δ |
|---|---|---|---|
| `items.json` | 80 | 187 | +107 |
| `recipes.json` | 42 | 71 | +29 |
| `mobs.json` с drops | 0/11 | 11/11 | +11 |

### Конкретно добавлено в M11.0a (PR #95):

- **8 самоделов** (item_class=craft): Заточка, Поджига, Трубка, Обрез, Копьё, Арбалет, Хлопушка, Молотов
- **15 дроп-стволов** (item_class=drop): ПМ, ТТ, АПС, ППШ, СКС, АКС-74У, АКМ, АК-74, РПК, Тигр (.308), Мосина, СВД, ИЖ-43, Сайга-12, Бекас
- **3 ножа дроп**: НР-43, боевое мачете, кукри
- **3 гранаты**: Ф-1, РГД-5, РГО
- **60 партов** (item_class=part): все 15 стволов сборные с уникальными деталями
- **8 модов** (item_class=modification): ПБС-1, ПСО-1, ПСО-1М, Прицел 4x, Расш. магазин 9×18, Расш. магазин 5.45, Тактическая рукоятка, Штык-нож
- **7 калибров ammo**: 9×18, 7.62×25, 5.45×39, 7.62×39, 7.62×54R, 12ga, .308

### Что ещё нужно для M12 (Combat Overhaul)

| Asset / Контент | Кол-во | Приоритет |
|---|---|---|
| Иконки приёмов оружия (active skills) | ~30 | high |
| Иконки статусов (Кровотечение, Оглушён, Подавлен, Отравлен, Горящий, Слепой) | 6 | high |
| Iconpack environment объектов (бочка, машина, тело, ящик, светильник, мост) | 6 | medium |
| Active skill ноды для skill tree (UI триггера) | 3 | medium |
| Mob Phase-2 описания (11 мобов × «триггер + поведение») | 11 описаний | medium |

### Carve-out для M13 (Spot Grinding + Dungeon Clear)

Содержательная часть после M12:
- Encounter pool для «Точек» (~20 событий между волнами)
- Dungeon room presets (~15 типов комнат)
- 3 mini-boss профиля (для M11.2 «Точек»)
- 3 dungeon boss профиля (для M11.3) — кроме уже-TBD-помеченных `boss_factory_brigadier`, `boss_metro_warden`, `boss_hospital_chief`
- Cooldown timers + reward tables для повторных зачисток

