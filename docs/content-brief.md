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
