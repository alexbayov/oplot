# Handoff — Content M5 (Боссы и инстансы)

> Этот документ — подробный брифинг для Content на вехе M5. Ты добавляешь 3 boss / 3 boss-drop / 3 T3 item / 3 T3 recipe в `content/*.json` + обновляешь `content/zones.json` (boss_id + is_gas). **Числа берутся строго из `balance.md` §M5**, имена/описания/лор — Content authored по style-guide.

## Preconditions

- GD M5 amendment PR `m5/gd-amendment` merged в `m5-integration`.
- QA Spec M5 verdict = APPROVE (`qa/m5-spec-review` merged или verdict APPROVE без блокеров).
- Параллельно с тобой работают Engineer M5 и Artist M5 в своих ветках.

## Контекст файлов

**Читать:**
1. `staff/CONTEXT.md`
2. `staff/LINKS.md`
3. `staff/status/M5.md`
4. `staff/handoff/M5-CONTENT.md` (этот файл)
5. `staff/handoff/M4-SUMMARY.md`
6. `staff/handoff/M3-SUMMARY.md`
7. `docs/GDD.md` §9 (boss spec) + §6.X (schema)
8. `docs/balance.md` §M5 (boss / T3 / gas / daily числа — **ground-truth для всех твоих numbers**)
9. `docs/content-brief.md` (правила naming / uniqueness)
10. `docs/style-guide.md` (палитра / тон описаний — для name/description fields)
11. Существующие `content/mobs.json` / `content/items.json` / `content/recipes.json` / `content/zones.json` (M3+M4 baseline)

## Deliverables (5-7 deliverables)

### 1. `content/mobs.json` — добавить 3 boss

Каждый boss object:
```json
{
  "id": "<from GDD §9.2>",
  "name": "<RU name, Content authored>",
  "description": "<RU description, Content authored, ≤120 chars>",
  "type": "<from GDD §9.2: human | mutant | mech>",
  "role": "boss",
  "behavior_id": "<phase_1_behavior_id from balance §M5.1>",
  "phase_threshold": <number, from balance §M5.1>,
  "phase_2_behavior_id": "<from balance §M5.1>",
  "boss_drop_id": "<from balance §M5.2>",
  "hp": <number, from balance §M5.1>,
  "hp_max": <same as hp>,
  "damage": <from balance §M5.1>,
  "defense": <from balance §M5.1>,
  "speed": <sane, from balance §M5.1 if present, else 0>,
  "xp_reward": <from balance §M5.1>,
  "loot_table": [
    { "item_id": "<boss_drop_id>", "drop_chance": 1.0, "qty": 1 },
    { "item_id": "<optional regular loot>", "drop_chance": 0.5, "qty": 1 }
  ]
}
```

После 3 boss добавлены: **mobs total = 11** (8 M1+M3 regular + 3 M5 boss). M1+M3 mobs **не изменяются** (включая их `role: "regular"`).

### 2. `content/items.json` — добавить 3 boss-drop + 3 T3 items

**3 boss-drop** (type: "resource", уникальный для каждого босса):
```json
{ "id": "mutated_gland", "name": "Мутировавшая железа", "description": "<>", "type": "resource", "weight": 1, "value": 100 }
{ "id": "prime_circuit", "name": "Прайм-схема", "description": "<>", "type": "resource", "weight": 1, "value": 150 }
{ "id": "captain_insignia", "name": "Знак отличия капитана", "description": "<>", "type": "resource", "weight": 1, "value": 200 }
```
(Числа `value` / `weight` — из balance §M5.2; id'ы / type — точно из balance §M5.2 + GDD §9.2 `boss_drop_id`. Имена RU — Content authored.)

**3 T3 items** (type: "weapon" или "armor", T3 stats из balance §M5.4):
```json
{ "id": "composite_blade", "name": "Композитный клинок", "type": "weapon", "slot": "weapon", "damage": <T3>, "weight": <T3>, "value": <sane>, "description": "<>" }
{ "id": "prime_shotgun", "name": "Прайм-дробовик", "type": "weapon", "slot": "weapon", "damage": <T3>, "weight": <T3>, "value": <sane>, "description": "<>" }
{ "id": "captain_armor", "name": "Капитанская броня", "type": "armor", "slot": "armor", "defense": <T3>, "weight": <T3>, "value": <sane>, "description": "<>" }
```

После: **items total = 35** (29 M1+M3 + 3 M5 boss-drop + 3 M5 T3). M1+M3 items не изменяются.

### 3. `content/recipes.json` — добавить 3 T3 recipes

Каждый recipe object (по существующему M3+M4 формату):
```json
{
  "id": "composite_blade",
  "name": "Композитный клинок",
  "tier": 3,
  "ingredients": [
    { "item_id": "pipe_rifle", "qty": 1 },
    { "item_id": "mutated_gland", "qty": 2 },
    { "item_id": "scrap", "qty": 5 }
  ],
  "output_item_id": "composite_blade",
  "output_qty": 1,
  "unlock_condition": { "type": "boss_drop_collected", "boss_id": "forest_alpha_mutant" }
}
```

(`unlock_condition` — Content предлагает на основе GDD §9.6 / balance §M5.3; формат может быть и проще: T3 recipe видим в CraftScene только если в inventory есть требуемый boss_drop. Engineer закроет рантайм.)

После: **recipes total = 18** (15 M1+M3 + 3 M5 T3). M1+M3 recipes не изменяются.

### 4. `content/zones.json` — обновить boss_id + is_gas

Текущее: 3 zones (forest / warehouse / city), все `boss_id: null`.

Обновления:
- **forest**: `boss_id: "forest_alpha_mutant"`, `daily_reset_hours: 24`. `is_gas: false` или omit. `levels` не менять.
- **warehouse**: `boss_id: "warehouse_drone_prime"`, `daily_reset_hours: 24`, `is_gas: true`, `gas_damage_per_turn: 5`. `levels[depth=2,3].is_gas = true`. `levels[depth=1].is_gas = false`.
- **city**: `boss_id: "city_guard_captain"`, `daily_reset_hours: 24`, `is_gas: true`, `gas_damage_per_turn: 8`. `levels[depth=2,3].is_gas = true`. `levels[depth=1].is_gas = false`.

**M1+M3 поля zones (id / name / unlock_condition / return_time_multiplier / levels.resources / levels.mobs / unique_resources)** — **не менять**. Только добавлять новые `boss_id` / `daily_reset_hours` / `is_gas` / `gas_damage_per_turn`.

### 5. Cross-ref валидация (перед PR Ready)

Прогон вручную:
- Каждый `mobs[].boss_drop_id` exists в `items[].id`. ✓
- Каждый `recipes[].ingredients[].item_id` exists в `items[].id` (включая boss_drop_id). ✓
- Каждый `recipes[].output_item_id` exists в `items[].id`. ✓
- Каждый `zones[].boss_id` exists в `mobs[].id` И тот mob имеет `role: "boss"`. ✓
- Каждый `zones[].levels[].mobs[].mob_id` exists в `mobs[].id` (boss добавляется в spawn pool depth=3). ✓

Если расхождение с `balance.md` §M5 (например `hp: 250` в твоём mobs.json vs `hp: 300` в balance §M5.1) → **эскалация в PM**, не резолвить (M4 урок).

### 6. `staff/status/CONTENT.md` update

Обновить секцию M5:
- Status: IN_PROGRESS → DONE после твоего merge.
- Список изменений с точными числами (mobs: 8 → 11, items: 29 → 35, recipes: 15 → 18, zones: 3 modified).
- Открытые вопросы для PM эскалации (если есть).

## DoD (Definition of Done — Content M5)

1. [ ] 3 boss добавлены в `content/mobs.json` (mobs total = **11**), все `role: "boss"`, все 11 полей заполнены по §6.2 schema.
2. [ ] 3 boss-drop добавлены в `content/items.json` (items total после = 32 после boss-drop, **35** после T3 items).
3. [ ] 3 T3 items добавлены в `content/items.json` (items total = **35**).
4. [ ] 3 T3 recipes добавлены в `content/recipes.json` (recipes total = **18**), все `tier: 3`, все cross-ref валидны.
5. [ ] `content/zones.json` обновлён: 3 zone имеют `boss_id` заполнен; warehouse + city имеют `is_gas: true` + `gas_damage_per_turn` на depth=2,3; forest без gas. **0 изменений M1+M3 полей**.
6. [ ] Cross-ref валидация: каждый boss_drop_id / item_id / output_item_id / boss_id / mob_id в spawn pool — exists.
7. [ ] M1+M3 baseline **не изменён** (8 regular mobs + 29 items + 15 recipes + 3 zones existing fields).
8. [ ] `staff/status/CONTENT.md` обновлён под M5.
9. [ ] Recovery-safe: Draft PR в 5-10 мин, push после каждого подшага (mobs → items → recipes → zones → cross-ref).
10. [ ] PR base = `m5-integration` (НЕ `main`). PR scope = только `content/{mobs,items,recipes,zones}.json` + `staff/status/CONTENT.md`. **Никаких** `docs/`, `src/`, `assets/`, чужих `staff/`.

## Anti-scope (твой)

- НЕ менять `docs/`, `src/`, `assets/`, чужие `staff/`.
- НЕ изменять числа M1+M3+M4 (только добавлять M5).
- НЕ self-merge.
- НЕ добавлять модули оружия / новые AI behaviors / активные ability / daily reward rotation / sounds / animation refs / Yandex SDK fields / cloud save fields / skill tree fields / PvP fields.
- НЕ менять existing JSON schema полей (только добавлять новые boss-fields там, где это разрешено GDD §6.X).

## Ключевые файлы (expected create/modify)

| Файл | Action | Что добавить |
|---|---|---|
| `content/mobs.json` | MODIFY | +3 boss objects |
| `content/items.json` | MODIFY | +3 boss-drop resources + 3 T3 items |
| `content/recipes.json` | MODIFY | +3 T3 recipes (tier:3) |
| `content/zones.json` | MODIFY | boss_id + daily_reset_hours + is_gas (warehouse+city) для 3 zone |
| `staff/status/CONTENT.md` | MODIFY | M5 status / changes / открытые вопросы |

## Cross-refs (dependencies)

- **GD M5** (предыдущий gate): твои `id`'ы и числа — из его GDD §9 + balance §M5. Любое расхождение → **эскалация в PM**.
- **Engineer M5** (параллельно): он читает твой `content/mobs.json` для spawn / boss behavior / boss-drop guarantee. Если он зашёл раньше тебя — он использует **stub data** (`role: "regular"` для всех; soft-warn в BootScene вместо hard-fail, по M3 паттерну). После merge твоего PR + его PR → cross-ref работает.
- **Artist M5** (параллельно): имена файлов спрайтов = твои `id`'ы (например `forest_alpha_mutant.png`). Согласуй id'ы заранее (через GDD §9.2 — single source of truth).
- **QA Acceptance M5** (через 3 PR): проверит cross-ref + DoD numbers (mobs=11, items=35, recipes=18).

## Token-budget

~45-90 min на 4 JSON-файла + status update. План должен быть ≤ 7 пунктов (см. kickoff).

## Lessons learned M2+M3+M4 (применить)

- **DoD-precision**: mobs total = **11**, items total = **35**, recipes total = **18**. Не «≥11», не «8+». M3 урок: items=29 не «≥30», QA Spec поймал.
- **Cross-spec**: твой `content/mobs.json` boss HP **должен совпадать** с balance §M5.1 boss HP. М4 урок: xp_reward §M4 в GDD vs §M1/§M3 в balance + M3 numbers в content/ → blocker, PM resolved.
- **Backward-compat**: M1+M3 mobs всё ещё валидны под расширенный §6.2 schema (новые поля optional). Не «пере-сохраняй» M1 mobs если они не нуждаются в изменениях.
- **Recovery-safe**: ранний Draft PR (например, после первого boss object в mobs.json) + push после каждого JSON-файла.

База для твоего PR: `m5-integration` (НЕ `main`).
