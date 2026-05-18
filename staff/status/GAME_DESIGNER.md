# Status: Game Designer

**Текущая веха:** M1
**Статус:** DONE_PENDING_REVIEW
**Последнее обновление:** 2026-05-18

## Что сделано

### `docs/GDD.md` — 6 секций по формату из `staff/roles/GAME_DESIGNER.md` + раздел «Канон M1»
- §1 Core Loop (Вылазка): Описание, Flow, Формулы → balance.md, Edge-cases, Связи
- §2 Боевая система: 3 действия (Атака / Укрытие / Аптечка), формулы урона/инициативы, AI поведения
- §3 Инвентарь и вес: max_weight 30 кг, штрафы перегруза, правило loot loss 50% при поражении
- §4 Крафт (базовый): 5 рецептов, мгновенно, на базе
- §5 Мобы MVP (3 шт.): Мародёр / Дикий пёс / Мутант с архетипами и AI
- §6 JSON-схемы: TS-интерфейсы `Item`, `Mob`, `Recipe`, `Zone` (поля синхронны с `docs/content-brief.md`)
- §7 Канон M1: таблица 15 предметов (7.1), 5 рецептов (7.2), дроп-таблицы (7.3), зона forest + 3 глубины (7.4)
- §Отклонения C1–C3 от `staff/handoff/M1-GD.md` с обоснованием

### `docs/balance.md` — таблицы 1–10
- Общие константы (MAX_WEIGHT_KG=30, MAX_LEVEL=5, DAMAGE_ROLL_MIN/MAX, и т.д.)
- Hero стартовые статы (HP=100, base_speed=100, max_weight=30, start_weapon=knife, start_armor=cloth_jacket)
- Мобы MVP (3 шт.) — HP / damage_min / damage_max / defense / base_speed / xp_reward / behavior / zone / level
- Оружие MVP (knife, makeshift_pistol)
- Броня MVP (cloth_jacket, leather_vest)
- Ресурсы MVP (8 шт. с весами)
- Расходники (bandage, medkit, ammo_pistol)
- Рецепты (5 шт.)
- XP-таблица 1→5 + формула
- Зоны MVP (forest + 3 depth)
- Блок «Формулы» (single source of truth для Engineer)
- Скоуп «что НЕ в balance.md M1»

## Что НЕ сделано (намеренно вне скоупа M1)
- Перки и дерево прокачки — M4
- Модульное оружие / броня — M5+
- Боссы, мини-боссы, дейли-инстансы — M5
- Зоны Склад / Город — M3
- Радио и шкала доверия — M6
- Монетизация (IAP / реклама / Yandex SDK rewards) — M8
- Содержимое `content/*.json` (это задача Content Designer на M1, не GD)
- Реализация в коде (это задача Engineer на M2)

## Блокеры

- Нет.

## Отклонения от `staff/handoff/M1-GD.md` (зафиксировано в GDD §Отклонения)

- **C1** — Дроп Мутанта (`Хим.реагент` / `Катализатор`) → заменён на `scrap` + `gunpowder` + редкий `leather`. Причина: эти ресурсы не входят в 8 канонических ресурсов M1-CONTENT; добавление нарушило бы лимит 15 предметов. Согласовано PM в kickoff-сессии.
- **C2** — Рецепт `recipe_medkit` (`Бинт x2 + Медикаменты x1`) → `bandage x2 + cloth x2`. Причина: «Медикаменты» нет среди 8 канонических ресурсов. Согласовано PM.
- **C3** — Рецепты `recipe_club` / `recipe_shiv` (предметы `Дубинка`, `Заточка`) → `recipe_leather_vest` / `recipe_ammo_pistol`. Причина: `club` / `shiv` не входят в 15 канонических предметов M1-CONTENT (2 оружия: `knife`, `makeshift_pistol`). Замена сохраняет 5 рецептов и покрывает все 4 крафтовых предмета + источник патронов. Согласовано PM.

## Технические уточнения схем (не отклонения, а расширения content-brief)

- `Mob.damage` → `damage_min` / `damage_max` (соответствие формуле боя §2).
- `Zone.levels[]` добавлен массив глубин (3 уровня для `forest`).

## PR

- PR в `main` (создаётся после коммита). 3 файла: `docs/GDD.md`, `docs/balance.md`, `staff/status/GAME_DESIGNER.md`. **Self-merge запрещён** — ждём ревью PM.
