# Handoff: Content Designer — Веха M3

> **Роль:** Content Designer
> **Веха:** M3 — Расширение мира
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m3-integration`
> **Твой PR-branch:** `m3/content`
> **PR base:** `m3-integration`

---

## Preconditions

- [x] M2 закрыта.
- [x] GD M3 amendment merged в `m3-integration` (§5.4 / §6.4.M3 / §7 / balance §M3).
- [x] QA Spec Review APPROVE.

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/roles/CONTENT.md` | Твоя роль |
| `staff/status/M3.md` | Скоуп M3 |
| `staff/handoff/M2-SUMMARY.md` | Что унаследовано с M2 (15 items / 3 mobs / 5 recipes / 1 zone) |
| `docs/GDD.md` §5.4 + §6.4.M3 + §7 | Источник правды для новых mobs / zones / radio signals |
| `docs/balance.md` §M3 | Все числа берёшь отсюда, ничего не выдумываешь |
| `docs/content-brief.md` | Правила механической уникальности |

---

## Твои deliverables

### 1. `content/items.json` — добавь **14 новых items** (всего 29)

> PM-decision (2026-05-21, PR `pm/m3-dod-align-items`): `balance.md` §M3 специфицирует ровно 14 новых items (4 zone-exclusive + 2 T2-weapons + 3 T2-armor + 5 T2-consumables). QA Spec APPROVE (PR #22) фиксирует этот спек. Не выдумывай 15-й item — 29 = факт spec'а.

Не трогай существующие 15 items M1 (`wood / scrap / cloth / food / water / gunpowder / leather / rope / knife / makeshift_pistol / cloth_jacket / leather_vest / bandage / medkit / ammo_pistol`).

Добавь новые items для покрытия:
- **Zone-exclusive ресурсы** из §6.4.M3:
  - Warehouse: например `electronics`, `oil`, `gear`, `chemicals` (имена согласуй с GDD — что GD написал, то и используй).
  - City: например `medical_supplies`, `circuitry`, `fuel`, `documents`.
- **Новые T2 оружия** (минимум 1-2): например `pipe_rifle` (огнестрел T2), `crowbar` (melee T2).
- **Новые T2 броня** (минимум 1): например `tactical_vest`, `helmet`.
- **Новые расходники** (минимум 1-2): например `large_medkit`, `energy_drink`, `gas_mask` (как заглушка для будущего M5).

Каждый item:
- Соответствует JSON-схеме §6.1.
- Имеет уникальное `id` (snake_case).
- Имеет `name_ru` на русском.
- Имеет `type` из существующих enum'ов (или из новых, если GD добавил).
- `weight` берётся из GDD §3 «Weight tiers» (resources обычно 1-3, weapons 0.5-2, armor 1-3, consumables 0.3-1).
- Все ссылки на icon-имена должны совпадать с тем, что Artist готовит на M3 (см. `staff/handoff/M3-ARTIST.md`). Согласуй именование в PR-комментариях.

### 2. `content/mobs.json` — добавь **5 новых mobs** (всего 8)

Не трогай существующие 3 мобов M1.

Добавь ровно 5 mobs, соответствующих §5.4 GDD. Для каждого:
- `id` (snake_case).
- `name_ru` на русском.
- `type` (human / animal / mutant / mech / etc — согласовано с GD §5.4).
- HP / damage_min / damage_max / speed / xp / defense (из balance.md §M3).
- `behavior_id` — строка, идентифицирующая AI-паттерн (Engineer использует для switch'а в combat.ts).
- `drop_table`: массив `{item_id, chance, count_min, count_max}` согласно balance.md §M3.

### 3. `content/recipes.json` — добавь **10 новых recipes** (всего 15)

Не трогай существующие 5 рецептов M1.

Добавь 10 рецептов согласно GDD §4 (та же схема, что M1) + balance.md §M3:
- Минимум 2 рецепта для T2-оружия (например `recipe_pipe_rifle` из `scrap × 5 + wood × 3 + gunpowder × 2`).
- Минимум 1 рецепт для T2-брони.
- Минимум 2 рецепта для новых расходников.
- Остальные — на твой выбор, но **каждый использует минимум 1 zone-exclusive ресурс** (правило «крафт мотивирует исследовать зоны»).

Все `result_id` / `ingredient.item_id` должны существовать в обновлённом `items.json`.

### 4. `content/zones.json` — добавь **2 новые zones** (всего 3)

Не трогай существующую зону `forest`.

Добавь ровно 2 zone-entries для `warehouse` + `city` строго по GDD §6.4.M3:
- `id`, `name_ru`, `description`.
- `levels` (или `depths` — используй текущую схему M1/M2; не меняй схему!).
- `enemies` — list of mob ids в этой глубине.
- `enemy_count` — `[min, max]`.
- `resources` — list of item ids.
- `resource_count` — `[min, max]`.
- `unlock_condition` — текст из GDD §6.4.M3 (Engineer переведёт в код).

### 5. `content/radio.json` — добавь **2-3 dummy-сигнала**

Файл уже существует как пустой массив (`[]`). Добавь 2-3 dummy entries согласно GDD §7 (структура `RadioSignal`):
- `id` (snake_case).
- `from` (от кого: `"unknown"`, `"survivor_group_A"`, `"caravan"`, etc — на твой выбор).
- `subject` (короткий заголовок).
- `body` (2-4 предложения текста — что-то нейтральное, без обещаний наград).
- `options` — массив **ровно 2** опций: `[{id: "respond", label: "Откликнуться"}, {id: "ignore", label: "Игнорировать"}]`.
- `expires_after_sorties` — число (например 3) — сколько вылазок сигнал «живёт».

Важно: **не пиши последствия** (rewards, ambush, faction changes) — это M6. Контент сейчас = чистый плейсхолдер для UI.

---

## КРИТИЧЕСКОЕ ПРАВИЛО: УНИКАЛЬНОСТЬ

> Каждый предмет / моб / рецепт ДОЛЖЕН отличаться **механически**, не только именем или числами.

Примеры допустимые:
- `pipe_rifle` (огнестрел T2, тратит общие `ammo_pistol`, бьёт сильнее `makeshift_pistol`) ✅
- `gas_mask` (расходник, заглушка для зон с газом в M5) ✅

Примеры запретные:
- «Большая аптечка» = просто `bandage × 2 эффект» — это уже `medkit`, не делай.
- «Стальной нож» = `knife` с +2 урона — нет, это вариация чисел, не уникальность.

---

## Definition of Done

- [ ] `content/items.json` = 29 items (15 M1 + 14 M3 по `balance.md` §M3).
- [ ] `content/mobs.json` = 8 mobs (3 старых + 5 новых).
- [ ] `content/recipes.json` ≥ 15 recipes (5 старых + 10 новых).
- [ ] `content/zones.json` = 3 zones (forest + warehouse + city).
- [ ] `content/radio.json` ≥ 2 dummy signals.
- [ ] Все cross-references работают: каждый `ingredient.item_id`, `drop_table.item_id`, `zones.resources[*]`, `zones.enemies[*]`, `recipes.result_id` существует в соответствующем JSON.
- [ ] Все числа соответствуют `balance.md` §M3.
- [ ] M1/M2 content **НЕ изменён** (`git diff m3-integration...m3/content -- content/` показывает только additions, no deletions/modifications в M1/M2 entries).
- [ ] `staff/status/CONTENT.md` обновлён под M3.

---

## FORBIDDEN

- Изменять существующие 15 items / 3 mobs / 5 recipes / forest zone M1/M2.
- Придумывать числа (бери из `balance.md` §M3).
- Добавлять боссов, перки, реальные radio outcomes — это M4/M5/M6.
- Self-merge.
- Push в `main` / `m3-integration` напрямую.
- PAT-токен в URL / echo / print.
- Любые правки `src/`, `assets/`, `docs/` (если нужны правки docs — оставь список в PR-комментариях, PM откроет fix-роль для GD).

---

## Процедура

1. Клонируй репо, `git checkout m3-integration`, прочитай файлы из «Контекст».
2. Сверь GDD §5.4 / §6.4.M3 / §7 + balance §M3 — то, что Content наполняет.
3. Напиши план (5-7 пунктов) → отправь Alex'у блокирующим: «План готов, жду апрува PM».
4. После апрува — `git checkout -b m3/content`, сделай первую правку, **сразу push + Draft PR** в первые 5 минут.
5. Дополни 5 JSON-файлов согласно DoD.
6. Прогон `npm run typecheck` и `npm run test` локально — типы должны проходить (Engineer M3 ещё не активен; ты только проверяешь, что JSON загружается без type-errors).
7. Обнови `staff/status/CONTENT.md`.
8. Открой Ready PR `m3/content → m3-integration` (НЕ в `main`). Сам **НЕ** мерджи.
9. Сообщи Alex'у блокирующим: «Content M3 готов, PR <ссылка>, жду PM-review + QA Acceptance».

Token-budget: эта задача — ~60-90 минут. Если приближаешься к лимиту — push partial + recovery block в PR + обновление `CONTENT.md` next step. PM подхватит continuation.

**Можно параллельно с:** Engineer, Artist (но координируй именование items / sprite-файлов в PR-комментариях).
**Нельзя до:** GD M3 PR merged + QA Spec APPROVE.
