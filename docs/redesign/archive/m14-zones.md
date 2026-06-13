# Архивные зоны (отложены до M14)

> Создано в рамках M13 PR-2. См. `docs/redesign/M13-PIVOT.md` §«Карта и зоны».

На лаунч (после M13) на карте открыты три зоны: **Лес**, **Склад**, **Промзона**.
Остальные шесть зон убраны из `content/zones.json` и `src/scenes/MapScene.ts`,
чтобы не отвлекать игрока серыми пинами и не тащить за собой контент, который
сейчас не работает на петлю «база ↔ вылазка». Возвращаем их в M14, когда будет
готова петля построек (PR-5) и расширенный пул врагов.

Здесь снапшот того, что нужно будет восстановить, плюс координаты пинов на
painted-карте `world_map.jpg` (см. `MapScene.ts` старая версия) — чтобы при
возврате не подбирать руками.

## Пины (координаты на painted-карте)

```ts
const ARCHIVED_PINS = [
  { zone_id: "suburbs",     x: 211,  y: 525 },
  { zone_id: "city",        x: 511,  y: 328 },
  { zone_id: "school",      x: 834,  y: 272 },
  { zone_id: "hospital",    x: 768,  y: 487 },
  { zone_id: "metro",       x: 900,  y: 581 },
  { zone_id: "power_plant", x: 1115, y: 122 },
];
```

## Снапшот зон

Полные определения зон до M13 PR-2 лежат в git-истории
`content/zones.json` (на коммите `a759bdf` — `fix(m13-pr1): preserve sortie
outcome on return`). Краткая сводка по каждой:

| id            | name_ru        | level | unlock_condition                  | unique_resources                       |
|---------------|----------------|-------|-----------------------------------|----------------------------------------|
| `suburbs`     | Пригород       | 1     | `any_forest_sortie_completed`     | `suburban_scrap`, `garden_seed`         |
| `city`        | Город          | 3     | `any_warehouse_sortie_completed`  | `medical_supplies`, `circuitry`         |
| `school`      | Школа          | 2     | `suburbs_sortie_completed`        | `school_book`, `broken_tablet`          |
| `hospital`    | Госпиталь      | 3     | `factory_sortie_completed`        | `hospital_supply`, `sterile_wrap`       |
| `metro`      | Метро          | 4     | `city_boss_defeated`              | `metro_token`, `rail_shard`             |
| `power_plant` | Электростанция | 5     | `metro_sortie_completed`           | `reactor_ash`, `copper_coil`            |

## Перетекание мобов

`fanatic_berserker`, `pack_rat`, `city_guard_captain` исходно жили в `city`. В
M13 PR-2 их `zone_affinity` указывает на `factory` — берсерки и крысы перешли
в Промзону, чтобы зона не была пустой по поведению врагов. При возврате `city`
в M14 их affinity нужно расширить обратно, не дублируя записи мобов.

## Флаги прогресса

`GameProgress` всё ещё содержит флаги архивных зон (`suburbs_sortie_completed`,
`city_boss_defeated`, `metro_sortie_completed` и т.д.). Они не выставляются ни
из одной живой зоны, но остаются в типе ради миграции сейвов v3→v4 и обратной
совместимости. При возврате зон в M14 ничего добавлять не нужно — флаги уже на
месте, нужно лишь восстановить `applySortieCompletion`-ветки.

## Уникальные item_id

Уникальные ресурсы архивных зон (`suburban_scrap`, `school_book`,
`hospital_supply` и т.п.) остаются в `content/items.json` и в drop_table мобов
— это безвредно, просто никогда не дропается, пока зоны не вернутся. Чистить
их в M13 не стоит: переплести с краф-рецептами и `items.json` правками — лишняя
работа на удаление того, что мы вернём.
