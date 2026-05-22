# Status: Game Designer

**Текущая веха:** M5 (amendment)
**Статус:** DONE_PENDING_PM_REVIEW
**Последнее обновление:** 2026-05-22 (M5 GD-amendment)

---

## M5 GD-amendment (ветка `m5/gd-amendment`, PR #41 → `m5-integration`)

**Базируется на M5-integration** (PM kickoff PR #40 merged, HEAD `512bb32`).

### Что сделано

| Файл | Секция | Изменение |
|---|---|---|
| `docs/GDD.md` | §9 «Боссы и инстансы (M5)» | **+** §9.1 Описание (boss = Mob.role="boss", depth 3, 2-phase, guaranteed drop, MobRole gating); §9.2 Boss roster (3 boss: `forest_alpha_mutant`, `warehouse_drone_prime`, `city_guard_captain` с phase 1/2 behaviors из §5.4); §9.3 Flow (2-фазный бой, computePhaseTransition, phase swap logic, berserker special case); §9.4 Дейли-инстанс (canEnterDailyInstance, 24h cool-down, depth skip, daily_completed state); §9.5 Газовые зоны (is_gas per-depth, gas_damage_per_turn, gas_mask requirement); §9.6 T3 craft chain (3 рецепта: crowbar→composite_blade, pipe_rifle→prime_shotgun, tactical_vest→captain_armor); §9.7 Edge-cases (multi-level-up, boss death, retreat, daily gating, gas kill, boss+regular, daily skip); §9.8 Связь с другими системами (§5.4, §6.2, §6.4, §8, §2, §3, §4); §9.9 Anti-scope M5 (модульное оружие, радио, SDK, skill tree, PvP, cinematics, reward rotation, minion spawn, active abilities) |
| `docs/GDD.md` | §6.2 `Mob` schema | **+** 3 опциональных поля: `phase_threshold?: number` (0.5, required для boss), `phase_2_behavior_id?: string` (из §5.4, required для boss), `boss_drop_id?: string \| null` (resource id, required для boss). Backward-compat (M1-M4 mobs: поля отсутствуют) |
| `docs/GDD.md` | §5.4 Связь | **+** cross-ref: «§9 Боссы M5 используют те же 5 behavior_id из §5.4.6 в phase 1 и phase 2. Phase swap переключает mob.behavior_id runtime. Никаких новых AI behaviours на M5 не вводится.» |
| `docs/GDD.md` | §6.4 `Zone` / `ZoneLevel` schema | **+** `ZoneLevel.is_gas?: boolean` (default false); **+** `Zone.is_gas?: boolean` (default false, агрегат); **+** `Zone.gas_damage_per_turn?: number` (required если is_gas); **+** `Zone.daily_reset_hours?: number` (required если boss_id !== null); **+** `Zone.boss_id` comment updated (M5: filled with boss id). Backward-compat |
| `docs/balance.md` | §M5 «Боссы и инстансы» | **+** §M5.1 Boss stats (3 boss: HP 300/350/400, damage 20-30/25-35/22-32, defense 6/8/10, xp 150/200/250, phase behaviors, phase_threshold 0.5); §M5.2 Boss-drop resources (mutated_gland, prime_circuit, captain_insignia); §M5.3 T3 recipes (3: composite_blade, prime_shotgun, captain_armor); §M5.4 T3 item stats (2 weapons + 1 armor); §M5.5 Gas zone damage (warehouse depth 2-3: 5 HP/turn, city depth 2-3: 8 HP/turn); §M5.6 Daily cool-down (24h); §M5.7 Warehouse depth 3 (new depth config); §M5 Anti-scope |
| `staff/status/GAME_DESIGNER.md` | — | этот M5 status block |

### Числа M5

- Boss HP: `forest_alpha_mutant=300`, `warehouse_drone_prime=350`, `city_guard_captain=400`.
- Boss damage (min-max): `forest 20-30`, `warehouse 25-35`, `city 22-32`.
- Boss defense: `forest=6`, `warehouse=8`, `city=10`.
- Boss XP: `forest=150`, `warehouse=200`, `city=250`.
- Phase threshold: `0.5` для всех 3 боссов.
- Phase behaviors: `berserker→pack_bonus` / `armor_piercing→defensive_cover` / `defensive_cover→ranged_keep_distance`.
- Boss-drop: `mutated_gland` / `prime_circuit` / `captain_insignia` (weight=1, tier=2).
- T3 weapons: `composite_blade 24-32 dmg` (melee), `prime_shotgun 27-37 dmg` (ranged, uses ammo_rifle).
- T3 armor: `captain_armor defense=12`.
- Gas damage: `warehouse depth 2-3 = 5 HP/turn`, `city depth 2-3 = 8 HP/turn`.
- Daily cool-down: `24 hours`.
- Warehouse depth 3: `enemy_count [2,3], resource_count [3,5], min_player_level 5, fights_per_depth 3`.

### Коммиты на ветке `m5/gd-amendment` (PR #41)

1. `2fb7919` — `docs(M5): add §9 header scaffold (M5 GD amendment scope)` — recovery-safe Draft PR start.
2. `427baa0` — `docs(M5): GDD §9 — Bosses and Instances (3 boss, 2-phase AI, daily, gas, T3 craft)`.
3. `55d71f7` — `docs(M5): GDD §6.2 Mob schema — 3 boss fields + §5.4 cross-ref`.
4. `767240b` — `docs(M5): GDD §6.4 Zone schema — gas + daily + boss_id + levels[].is_gas`.
5. `e8210d1` — `docs(M5): balance.md §M5 — boss stats, boss-drops, T3, gas, daily, anti-scope`.
6. (этот commit) — `chore(M5): update GAME_DESIGNER status`.

### Что НЕ сделано (намеренно вне скоупа M5 GD-amendment)

- **`src/`:** не трогал. Engineer реализует boss AI / phase transition / daily / gas / T3 после QA Spec APPROVE.
- **`content/*.json`:** не трогал. Content создаст 3 boss в `content/mobs.json`, 3 boss-drop + 3 T3 items в `content/items.json`, 3 T3 recipes в `content/recipes.json`, обновит `content/zones.json` (boss_id, is_gas, gas_damage_per_turn, daily_reset_hours, warehouse depth 3).
- **`assets/`:** не трогал. Artist создаст 3 boss sprites 128×128 + 3 boss-drop icons + 3 T3 item icons + gas overlay.
- **GDD §1–§8:** не переписывал; только добавил §9 + расширения §6.2/§6.4/§5.4 cross-ref.
- **M1/M2/M3/M4 числа в `balance.md`:** не менял; только добавил §M5.
- **Чужие staff-файлы:** не трогал.
- **Anti-scope:** модульное оружие / полная радио / Yandex SDK / skill tree / PvP / boss-cinematics / доп AI behaviours / reward rotation / minion spawn / active abilities не добавлял.

### Блокеры

- Нет. PR #41 Draft → Ready после финальных локальных проверок.

### Уточнение vs handoff preview

- Handoff preview указывал `crossbow` как T2 base для `prime_shotgun`. `crossbow` не существует в items. Канон M5: `prime_shotgun` ← `pipe_rifle` (T2 ranged base). `composite_blade` ← `crowbar` (T2 melee base). Это решение GD, не cross-spec расхождение.

### Открытые вопросы для PM / QA Spec

- `warehouse` получает depth 3 на M5 (до M3 имел только depth 1-2). Content должен обновить `content/zones.json` warehouse levels: добавить depth 3 с enemy_count, resource_count, is_gas=true.
- `gas_mask` теперь механически необходим на M5 (отменяет gas damage). Его defense=1 остаётся без изменений — gas защита — это отдельный флаг (item id check), не defense-бонус. Engineer проверяет наличие `gas_mask` по id, не по новому полю на Item.

### Следующая роль после моего merge

- **QA Spec M5** review'ит GDD §9, GDD §6.2/§6.4 extensions, balance §M5 на соответствие M5 scope / anti-scope.
- После QA Spec APPROVE + PM merge `m5/gd-amendment → m5-integration` → стартуют Content + Engineer + Artist параллельно.

---

## M4 GD-amendment (ветка `m4/gd-amendment`, PR #32 → `m4-integration`)

**Базируется на M4-integration** (PM kickoff PR #31 merged, HEAD `d8e2a31`). PM approved plan in chat before implementation.

### Что сделано

| Файл | Секция | Изменение |
|---|---|---|
| `docs/GDD.md` | §8 «Перки и прогрессия (M4)» | **+** XP-источник kill mob, формула `round(40 * level^1.5)`, level-up flow trigger → popup → 3 choices → state update, overkill carry-over + popup queue, empty-pool fallback `veteran_conditioning` |
| `docs/GDD.md` | §8 anti-scope | **+** явно зафиксировано: skill tree / points / nodes / prereq = M5+ refactor path; active abilities / cooldowns = M5+; bosses / T3 = M5; full radio = M6; Yandex SDK / persistence = M8 |
| `docs/GDD.md` | §6.5 `Perk` schema | **+** JSON schema: `id`, `name`, `description`, `type`, `stat`, `value`; enum `type`, enum 8 fixed `stat`; validators; forbidden `prereq/tier/cost/cooldown` |
| `docs/balance.md` | §M4 «Прогрессия» | **+** XP-curve table levels 1–10, 8 mob `xp_reward`, 8 perk numbers, hardcoded fallback note |
| `staff/status/GAME_DESIGNER.md` | — | этот M4 status block |

### Числа M4

- XP-curve: `xp_to_next(level)=round(40 * level^1.5)`, cumulative L10 = 4442 XP.
- Mob XP rewards: `marauder 18`, `wild_dog 14`, `mutant 45`, `looter_sniper 28`, `armored_guard 36`, `fanatic_berserker 42`, `pack_rat 22`, `relic_drone 50`.
- Perks: `tough_skin +15 hp_max`, `sharp_blade damage x1.15`, `lean_pack weight_penalty x0.85`, `lucky_scavenger loot_quantity x1.20`, `keen_eye +0.05 crit_chance`, `reinforced_plates armor_efficiency x1.15`, `quick_hands crafting_speed x0.90`, `fast_learner xp_gain x1.15`.
- Empty pool fallback: `veteran_conditioning` = hardcoded `LevelUpScene` fallback `hp_max +10`, **не** JSON-перк. Content пишет ровно 8 perks в `content/perks.json`; QA pool count = 8 + 1 hardcoded fallback.

### Коммиты на ветке `m4/gd-amendment` (PR #32)

1. `89a58a5` — `docs(M4): add progression anti-scope skeleton` — recovery-safe Draft PR start.
2. `d245ba2` — `docs(M4): specify progression flow and XP rules`.
3. `5086392` — `docs(M4): add Perk JSON schema`.
4. `273d8a0` — `docs(M4): add progression balance tables`.
5. (этот commit) — `chore(M4): update GAME_DESIGNER status`.

### Что НЕ сделано (намеренно вне скоупа M4 GD-amendment)

- **`src/`:** не трогал. Engineer реализует progression/perks после QA Spec APPROVE.
- **`content/*.json`:** не трогал. Content создаст `content/perks.json` с ровно 8 перками из `balance.md` §M4.
- **`assets/`:** не трогал. Artist создаст 8 perk icons.
- **GDD §1–§7:** не переписывал; только добавил §6.5 и заполнил §8 placeholder.
- **M1/M2/M3 числа в `balance.md`:** не менял; только добавил §M4.
- **Чужие staff-файлы:** не трогал.
- **Anti-scope:** skill tree / active abilities / cooldowns / bosses / T3 / full radio / Yandex SDK не добавлял.

### Блокеры

- Нет. PR #32 готов к переводу Draft → Ready после финальных локальных проверок и обновления PR description.

### Следующая роль после моего merge

- **QA Spec M4** review'ит GDD §8, GDD §6.5, balance §M4 на соответствие M4 scope / anti-scope.
- После QA Spec APPROVE + PM merge `m4/gd-amendment → m4-integration` → стартуют Content + Engineer + Artist параллельно.

---


## M4 GD-fix (ветка `m4/gd-fix`, PR #34 → `m4-integration`)

**Причина:** QA Spec M4 PR #33 verdict CHANGES_REQUESTED: `balance.md` §M4 `xp_reward` values не синхронизированы с baseline mob tables.

### Что сделано

| Файл | Секция | Изменение |
|---|---|---|
| `docs/balance.md` | §Мобы (MVP) | `xp_reward` синхронизирован с §M4: `marauder=18`, `wild_dog=14`, `mutant=45` |
| `docs/balance.md` | §M3 — Мобы | `xp_reward` синхронизирован с §M4: `looter_sniper=28`, `armored_guard=36`, `fanatic_berserker=42`, `pack_rat=22`, `relic_drone=50` |
| `docs/balance.md` | TODO Content M4 | добавлены явные TODO обновить `content/mobs.json` в M4 Content PR; HP/damage/AI/drop-tables не меняются |
| `staff/status/GAME_DESIGNER.md` | — | этот M4 fix status block |

### Что НЕ сделано

- `content/mobs.json` не трогал: это зона Content M4.
- `src/`, `assets/`, чужие staff-файлы не трогал.
- XP-curve и perk values из GD PR #32 не менял.

### Recovery

- Base: `m4-integration` HEAD `d8e2a31`.
- Scope: только `docs/balance.md` + `staff/status/GAME_DESIGNER.md`.
- Continue from: PR #34 готов к QA Spec re-review; если изменения запрошены, править только `docs/balance.md` и/или этот status-файл.

---

## M3 GD-amendment (ветка `m3/gd-amendment`, PR #21 → `m3-integration`)

**Базируется на M2-integration** (PR #19 merged into main, M2 closed). M3 kickoff PR #20 (`pm/m3-kickoff` → `m3-integration`) merged before this work.

### Что сделано

| Файл | Секция | Изменение |
|---|---|---|
| `docs/GDD.md` | §5.4 «Мобы M3» | **+** 5 новых мобов (`looter_sniper`, `armored_guard`, `fanatic_berserker`, `pack_rat`, `relic_drone`) с уникальным `behavior_id` + implementation hints для Engineer (по запросу PM) |
| `docs/GDD.md` | §6.2 `Mob` schema | **+** `MobType` enum значение `"mech"` (forward-compat), **+** опциональное поле `Mob.behavior_id?: string` (M3+ AI-pattern switcher) |
| `docs/GDD.md` | §6.4 `Zone` schema | **+** опциональное поле `Zone.return_time_multiplier?: number` (default 1.0, forest без поля → no-op) |
| `docs/GDD.md` | §6.4.M3 «Новые зоны M3» | **+** 2 зоны (Склад / Город) с depths, enemies, resources, unlock_condition strings, zone-exclusive ресурсами, implementation hints (`evaluateUnlockCondition` Engineer helper) |
| `docs/GDD.md` | §7 (placeholder) | **~** заглушка `### 7. Зоны и карта (M3)` помечена `DONE` (содержимое в §6.4.M3) |
| `docs/GDD.md` | §10.M3 «Структура радио» | **+** RadioSignal JSON-схема, UI-flow, `expires_after_sorties` декремент, anti-scope M3 (никаких rewards/ambush/trust — M6) |
| `docs/balance.md` | §M3 «Расширение мира» | **+** 5 mob stat table, drop-tables, 2 zone configs (depths + return_time_multipliers forest=1.0/warehouse=1.2/city=1.5), расширенная return_time_s формула с zone multiplier, 4 zone-exclusive resources, 2 T2-weapons, 3 T2-armor, 5 T2-consumables (с новыми `effect_type`: initiative_boost / mech_disable / cover_boost), 10 рецептов (минимум 1 zone-exclusive ингредиент на рецепт) |
| `staff/status/GAME_DESIGNER.md` | — | этот файл |

### Коммиты на ветке `m3/gd-amendment` (PR #21)

1. `91b39f1` — `docs(M3): add GDD §5.4 placeholder header (M3 GD amendment scope)` — recovery-safe Draft PR start (lesson M2).
2. `b96738b` — `docs(M3): GDD §5.4 — 5 new mobs (behavior_id + implementation hints for Engineer)`.
3. `c62a356` — `docs(M3): GDD §6.2 — Mob schema extension (mech enum + behavior_id field)`.
4. `7d24bd1` — `docs(M3): GDD §6.4.M3 — 2 new zones (warehouse + city) + Zone schema return_time_multiplier`.
5. `889f977` — `docs(M3): GDD §10.M3 — Radio system structure stub (UI-flow, RadioSignal schema, anti-scope)`.
6. `16252e5` — `docs(M3): balance.md §M3 — mob stats, drops, zones, return formula, 10 recipes, new items`.
7. (этот commit) — `chore(M3): update GAME_DESIGNER.md after GD-amendment`.

### PM-feedback зафиксирован в §5.4 (implementation hints для Engineer)

PM локально проверил M2 runtime и подтвердил:
- `computeDefense(armor, coverActive, attackerType)` уже принимает `coverActive: boolean` → `defensive_cover` (armored_guard) реализуется в ~5 LOC.
- Combat **positionless** → `ranged_keep_distance` (looter_sniper) и `armor_piercing_ranged` (relic_drone) — damage modifiers, не позиционная механика.
- `mech` enum **forward-compat only**: `combat.ts:51 attackerType === "animal"` hard-check к `mech` не относится, `vs_melee_bonus` не триггерится.
- `pack_bonus_when_paired` — **stateless query** по `enemies.filter(...)`, никаких новых полей на Mob.

Все 4 пункта явно прописаны в §5.4 / §6.2 / §6.4.M3 implementation hints + продублированы в `balance.md` §M3 numerical table — Engineer не должен догадываться.

### Что НЕ сделано (намеренно вне скоупа M3-amendment)

- **GDD §1–§5.3:** не трогал, только добавлял §5.4 / §6.2 ext / §6.4.M3 / §10.M3.
- **M1/M2 числа в balance.md:** не трогал (forest `return_time_multiplier` НЕ задаётся → fallback 1.0 → no-op для M1/M2 поведения).
- **`content/*.json`:** не моя зона. Content Designer на следующем PR заполнит `mobs.json` (+5), `zones.json` (+2 + опц. поле для forest), `items.json` (+10 новых), `recipes.json` (+10), `radio.json` (3 dummy).
- **`src/`:** не моя зона. Engineer на следующем PR реализует `MobType="mech"`, `Mob.behavior_id`, 5 AI-веток, `Zone.return_time_multiplier`, `computeReturnTime` 3-аргумент, `evaluateUnlockCondition`, RadioScene + boot loader.
- **`assets/`:** не моя зона. Artist на следующем PR — 5 mob-портретов, 2 zone-обложки, RadioScene UI ассеты.
- **Чужие staff-файлы:** не трогал `staff/handoff/*`, `staff/kickoff/*`, `staff/CONTEXT.md`, `staff/LINKS.md`, `staff/PLAN.md`, `staff/decisions/*`, `staff/status/*` (кроме своего).
- **Anti-scope M3:** перки (M4), боссы / multi-stage / phase changes (M5), полная radio-логика / награды / шкала доверия (M6), модули оружия (M5+), реальные звуки/анимации (M7), Yandex SDK (M8), позиционная механика боя (M5+).

### Блокеры

- Нет. PR #21 в Draft до перевода в Ready (этот же коммит + ручной flip через REST API).

### Открытые вопросы для PM / QA Spec

- Числа против M1 baseline (`marauder` 18HP/5–8dmg) — намеренно подтянуты вверх для M3-progression. PM просил проверить on PR — балансовая прогрессия в `balance.md` §M3 mob table подразумевает: M1 (lvl 1–2) → warehouse (lvl 2) → city (lvl 3). Сравнение с XP-кривой M1 (`xp_to_next_level: 100/250/500/1000`) — `relic_drone` 20xp выше `mutant` 30xp; намеренно меньше, потому что mutant — единственный M1 mob lvl 3 и должен оставаться peak M1 baseline.
- `helmet` без head-slot (M3 — single armor slot как M2). Поправлено в §M3 → M5 GD-amendment введёт мульти-слот броню (когда модули появятся).
- `gas_mask` defense=1 — самый слабый T2-armor, но это **lore stub** для M5 газовых зон. Может выглядеть как «зачем он нужен на M3» — обосновано в balance.md §M3.

### Следующая роль после моего merge

- **QA Spec M3** делает review §5.4 / §6.2 / §6.4.M3 / §10.M3 + balance §M3 для спек-соответствия (parallel, в течение PM-ревью).
- После QA Spec APPROVE + PM merge `m3/gd-amendment → m3-integration` → стартуют **Content + Engineer + Artist** параллельно (см. `staff/status/M3.md` PR-реестр).

### Hygiene-замечания (для PM, не блокеры)

- **Git push через org-proxy** для `alexbayov/oplot` возвращает 403 (как в M1/M2). Пушил через GitHub REST API (`/git/blobs` + `/git/trees` + `/git/commits` + `/git/refs/heads/{branch}`). PAT — только в `Authorization: Bearer` header, никогда в URL/echo/print. Helper-скрипт `/tmp/push_via_api.py` (не коммитится в репо, только в VM session).
- В первом push был баг скрипта: одно повторное «пустое» дублирование placeholder-коммита (`05587ef`). Исправлено force-push'ом replacement-коммита и линеаризацией истории. Текущая `m3/gd-amendment` чистая: 6 коммитов выше `m3-integration` (97cb8d5).

## QA-fix (M1, ветка `m1/gd-spec-qa-fix`)

Правка по результатам QA Spec Review (`staff/status/QA.md`, вердикт `CHANGES_REQUESTED`). PM-решения зафиксированы.

### Блокирующее QA #1 — мародёр не «слабый»
- `docs/balance.md` §Мобы: `marauder.hp` `30` → `18`, `defense` без изменений (`1`). Среднее число ударов ножом: 18 / (5.5 − 1) = 4 → попадает в требование чек-листа «3–4 удара ножом».
- `docs/GDD.md` §5 Мобы: описание `marauder` изменено со «Стандартный противник» на «Слабый человеческий противник. Низкий HP — убивается ножом за 3–4 удара (см. balance.md §Мобы: HP=18, defense=1)». Поведение `flee` при HP<30% сохранено.

### Minor QA #2 — семантика `vs_melee_bonus`
- `docs/GDD.md` §6.1 `ArmorStats`: расширен комментарий поля `vs_melee_bonus` — явно зафиксировано, что в M1 бонус применяется только когда атакует моб с `type = "animal"` (`wild_dog`), потому что это единственный melee-атакёр MVP (атакует укусом/когтями без оружия). Marauder и mutant в M1 НЕ считаются melee-атакёрами для целей этого бонуса. В M2+ условие переключится на отдельное поле `Mob.attack_kind`.
- `docs/balance.md` §Броня: сноска про `vs_melee_bonus` переписана в том же духе (бонус против melee-атак; в M1 эквивалентно `source.type == "animal"`).
- `docs/balance.md` §Формулы: условие в `target_total_defense` синхронизировано (`если source — melee-атакёр; в M1 это эквивалентно source.type == "animal"`).

### Что НЕ трогал
- `staff/status/QA.md` (не моя зона).
- Числа кроме `marauder.hp` (поведение и баланс остальных мобов сохранены, XP/инициатива/дроп не изменены).
- Edge-case из QA #3 (2 мародёра за бой) — снимается автоматически после фикса №1, отдельной правкой не закрывал.

---

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
