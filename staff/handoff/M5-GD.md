# Handoff — Game Designer M5 (Боссы и инстансы)

> Этот документ — подробный брифинг для GD на вехе M5. Это **amendment-сессия**: GDD §1–§8 уже зафиксированы под M1–M4 и НЕ переписываются. Ты добавляешь §9 «Боссы и инстансы», расширения §6.X для `Mob` / `Zone`, и секцию §M5 в `balance.md`.

## Preconditions

- `m5-integration` создана от `main` HEAD `723ed1c` (M4 gate-close PR #39 merged). PM kickoff PR #40 (`pm/m5-kickoff → m5-integration`) merged (этот шаг — твой trigger).
- M4 закрыта: gate-close PR #39 merged в `main` 2026-05-22 PM по делегации Alex'а. 11 scenes, 128 vitest, ProgressionScene + LevelUpScene + 8 perks + veteran_conditioning fallback, perk modifiers в combat/weight/loot/XP, XP-curve L1-10 `round(40*level^1.5)`.

## Контекст файлов

**Читать:**
1. `staff/CONTEXT.md` — snapshot M5 kickoff phase.
2. `staff/LINKS.md` — M5 PR-реестр.
3. `staff/status/M5.md` — полный M5 dashboard (gate / scope / anti-scope / DoD / роли).
4. `staff/handoff/M4-SUMMARY.md` — что унаследовано с M4.
5. `staff/handoff/M3-SUMMARY.md` — 5 AI behaviors (`ranged_keep_distance`, `defensive_cover`, `berserker_low_hp`, `pack_bonus_when_paired`, `armor_piercing_ranged`) — boss использует одну из них на phase 1 и другую (или ту же) на phase 2.
6. `docs/GDD.md`:
   - §5.4 (5 AI behaviors — переиспользуются в boss).
   - §5.4.6 (поведения и формулы — phase swap должен переключать behavior_id у моба runtime).
   - §6.2 (`MobType = "human" | "animal" | "mutant" | "boss" | "mech"`, `MobRole = "regular" | "boss"`).
   - §6.4 (`Zone` schema: `boss_id`, `levels[]`, `return_time_multiplier`).
   - §8 (Прогрессия M4 — XP source includes `xp_reward` from mob, boss = повышенный XP).
   - §11 placeholder («Модульное оружие M5+») — НЕ заполнять, остаётся placeholder под отдельную M5+ подсистему.
7. `docs/balance.md`:
   - §M1 (mob HP / damage baseline — 3 archetype: marauder/wild_dog/mutant).
   - §M3 (mob HP / damage для 5 M3 mobs — boss архетипы наследуют от них).
   - §M4 (perks numbers — boss-fight под M4 perks модификаторы должен корректно обрабатываться, например defense_boost на armored_guard phase 2).
   - §M2 (combat formulas — boss damage / defense расчитывается через ту же формулу `attack vs defense`).
8. `docs/content-brief.md` — правила uniqueness (boss механически уникален в зоне + между зонами).

**Не трогать:** GDD §1, §2, §3, §4, §5.1–§5.4 (только дополнить §5.4 явной ссылкой «boss использует phase_1/phase_2 behaviors из §5.4»), §6.1–§6.3 (только дополнить §6.2 Mob schema новыми полями), §6.5–§7 (perk-schema M4 не трогать), §8, §10. `balance.md` §M1, §M2, §M3, §M4 — НЕ трогать.

## Deliverables (5-7 deliverables, как роль-сессия в budget'е)

### 1. GDD §9 «Боссы и инстансы» — новая секция

Структура (см. формат GDD из `staff/roles/GAME_DESIGNER.md`: Описание → Flow → Формулы → Edge-cases → Связь):

- **§9.1 Описание** — что такое boss в Oplot M5 (уникальный моб на depth 3 в каждой зоне; `Mob.role = "boss"`; 2-фазный бой; гарантированный boss-drop; вход в дейли-инстанс после первого kill).
- **§9.2 Boss roster (3 boss)**:
  - `forest_alpha_mutant` (forest depth=3): `type: "mutant"`, phase 1 = `berserker_low_hp` (наследует от M3 fanatic_berserker), phase 2 = `pack_bonus_when_paired` (синергия с 2 sub-боссами / минионами в той же combat encounter — НО без новых мобов; если нет support — phase 2 просто остаётся в berserker mode, без бонуса), threshold = 0.5.
  - `warehouse_drone_prime` (warehouse depth=3): `type: "mech"`, phase 1 = `armor_piercing_ranged` (наследует от M3 relic_drone), phase 2 = `defensive_cover` (нагревается, начинает защищаться — каждый 2-й ход +50% defense), threshold = 0.5.
  - `city_guard_captain` (city depth=3): `type: "human"`, phase 1 = `defensive_cover` (наследует от M3 armored_guard), phase 2 = `ranged_keep_distance` (отступает на дистанцию + ranged attack), threshold = 0.5.
  - Финальные id'ы / phase_threshold можно скорректировать, но **должны быть фиксированными** (DoD-precision urok M3+M4).
- **§9.3 Flow (2-фазный бой)** — текстовый flow + диаграмма ASCII:
  ```
  Sortie reaches depth 3 → CombatScene init → spawn Mob with role:"boss" 
    → HUD overlay "Босс: <name>" + phase 1 sprite/behavior_id
    → combat loop (player vs boss, boss использует phase_1_behavior_id)
    → когда boss.hp / boss.hp_max < phase_threshold:
      → trigger computePhaseTransition() → swap behavior_id → phase 2 sprite/HUD
      → continue combat (player vs boss phase 2)
    → boss dies → LootScene → guaranteed boss-drop in loot pool 
    → ReturnScene → GameState.progress.<zone>_boss_defeated = true
  ```
- **§9.4 Дейли-инстанс** — после первого kill boss в зоне, MapScene показывает кнопку «Дейли (зона)» рядом с обычной кнопкой зоны. Click → SortieScene прыгает сразу на depth=3 (skip depth 1+2), bossfight rerun. Cool-down: `daily_reset_hours` (24) с момента предыдущего kill в дейли. `GameState.progress.daily_completed: Record<ZoneId, number>` (timestamp ms).
- **§9.5 Газовые зоны** — `Zone.is_gas: boolean`. На warehouse + city, depth 2 и 3 — `is_gas: true`. В CombatScene на газовой зоне, если player **не имеет `gas_mask`** в armor-slot или inventory — каждый ход после хода мобов: `player.hp -= zone.gas_damage_per_turn` (явно отображается в HUD: «Газ: -<X> HP/ход»). С `gas_mask` — damage = 0 (M3 `gas_mask` lore-stub теперь mechanical).
- **§9.6 T3 craft chain** — boss-drop → T3 recipe → T3 item. 3 T3 recipes (1/зона), каждый требует T2 base (existing weapon/armor) + boss-drop из той же зоны. T3 stats явно в balance §M5.
- **§9.7 Edge-cases**:
  - Multi-level-up при kill boss (boss даёт большой XP): LevelUpScene queue popups (Engineer закроет M4 NB follow-up).
  - Player умирает в bossfight: GameState не сохраняет partial-kill (boss respawns на следующем sortie). 
  - Player выходит без боя из CombatScene (если разрешено): boss НЕ defeated.
  - Дейли triggered до первого kill: кнопка «Дейли» **не видна** (canEnterDailyInstance → false).
  - Дейли cool-down активен: кнопка «Дейли» disabled с tooltip «До: <timestamp>».
- **§9.8 Связь с другими системами**: §5.4 (boss behaviors переиспользуются), §6.2/§6.4 (schema), §8 (xp_reward на boss kill повышенный), §M5 (числа).
- **§9.9 Anti-scope M5 (явно)** — список того, что НЕ делается в M5: модульное оружие (M5+ отдельная подсистема), полная радио-логика (M6), Yandex SDK (M8), skill tree (M5+ refactor), PvP, boss-cinematics (M7), дополнительные AI behaviors (только phase_1/phase_2 из M3-5), daily reward rotation. **Это критично — QA Spec проверяет grep**.

### 2. GDD §6.X schema extensions

- **§6.2 Mob schema** — добавить **необязательные** поля (backward-compat с M1-M4):
  - `phase_threshold?: number` — fraction (0.5), required для `role:"boss"`, optional для regular.
  - `phase_2_behavior_id?: string` — id одного из 5 behaviors из §5.4, required для boss.
  - `boss_drop_id?: string | null` — id resource в `items.json`, required для boss.
- **§6.4 Zone schema** — добавить:
  - `is_gas?: boolean` (default false) — газовая зона флаг.
  - `gas_damage_per_turn?: number` (required если is_gas=true) — например 5 HP/ход.
  - `daily_reset_hours?: number` (required если есть boss) — 24.
  - **`Zone.levels[].is_gas?: boolean`** — флаг per-depth (если is_gas только на depth 2-3, не на 1).
- НЕ менять existing fields: `id`, `name`, `boss_id` (already в schema), `unlock_condition`, `return_time_multiplier`, `levels[]`, `resources`, `mobs`, `unique_resources`.

### 3. balance.md §M5 — новая секция

Структура:

- **§M5.1 Boss stats** — таблица:
  ```
  | id | hp | damage | defense | phase_threshold | phase_2_behavior_id | xp_reward |
  |---|---|---|---|---|---|---|
  | forest_alpha_mutant | 300 | 35 | 8 | 0.5 | pack_bonus_when_paired | 150 |
  | warehouse_drone_prime | 350 | 40 | 10 | 0.5 | defensive_cover | 200 |
  | city_guard_captain | 400 | 38 | 12 | 0.5 | ranged_keep_distance | 250 |
  ```
  (Числа — preview. Финальные определяет GD; точные, не «≥».)
- **§M5.2 Boss-drop resources** — 3 items (boss-drop type=resource, weight=1, для T3 craft):
  - `mutated_gland` (forest_alpha_mutant)
  - `prime_circuit` (warehouse_drone_prime)
  - `captain_insignia` (city_guard_captain)
- **§M5.3 T3 recipes**:
  ```
  | recipe_id | base_item | boss_drop_qty | other_ingredients | output_item |
  |---|---|---|---|---|
  | composite_blade | pipe_rifle (T2) | mutated_gland × 2 | scrap × 5 | composite_blade |
  | prime_shotgun | crossbow (T2) | prime_circuit × 2 | scrap × 6 | prime_shotgun |
  | captain_armor | tactical_vest (T2) | captain_insignia × 2 | leather × 4 | captain_armor |
  ```
- **§M5.4 T3 item stats** — преимущество над T2:
  ```
  | id | type | slot | damage/defense | weight |
  |---|---|---|---|---|
  | composite_blade | weapon | weapon | 28 | 3 |
  | prime_shotgun | weapon | weapon | 32 | 4 |
  | captain_armor | armor | armor | 12 | 5 |
  ```
- **§M5.5 Gas zone damage**:
  ```
  | zone_id | depth | is_gas | gas_damage_per_turn |
  |---|---|---|---|
  | warehouse | 2,3 | true | 5 |
  | city | 2,3 | true | 8 |
  | forest | * | false | — |
  ```
- **§M5.6 Дейли cool-down** — `daily_reset_hours: 24` для всех 3 zone.
- **§M5.7 Anti-scope §M5** — повторить anti-scope (модульное / радио / SDK / skill tree / PvP / cinematic / доп AI / daily rotation).

**Cross-spec проверка перед финализацией:**
- Числа в §M5 **должны совпадать** с тем, что Content потом запишет в `content/{mobs,items,recipes,zones}.json`.
- Если ты в `balance.md` напишешь `boss HP=300`, но §6.2 schema говорит `hp: number` без ограничений → consistent. Если в §M5 boss HP=300 vs существующий M3 mob HP=50 (mutant) — consistent (boss > regular × 6, sanity).
- Если найдёшь conflict с M1/M2/M3/M4 числами — **НЕ резолвить** (М4 урок), эскалировать PM в `staff/status/GAME_DESIGNER.md` секция «Открытые вопросы».

### 4. `staff/status/GAME_DESIGNER.md` update

Обновить секцию M5:
- Status: IN_PROGRESS → DONE после твоего merge.
- Список изменений: «GDD §9 (10 sub-sections)», «§6.2 Mob + 3 fields», «§6.4 Zone + 3 fields», «balance.md §M5 (7 sub-sections, 3 boss / 3 boss-drop / 3 T3 / 3 gas zone / daily cool-down)».
- Открытые вопросы (если есть) — для PM эскалации.

## DoD (Definition of Done — Game Designer M5)

1. [ ] GDD §9 «Боссы и инстансы» — 10 sub-sections (§9.1–§9.9), описание / flow / 3 boss roster / phase mechanic / daily / gas / T3 craft / edge-cases / связь / anti-scope.
2. [ ] GDD §6.2 Mob schema расширена 3 необязательными полями (`phase_threshold`, `phase_2_behavior_id`, `boss_drop_id`). Backward-compat (M1-M4 mobs работают без новых полей).
3. [ ] GDD §6.4 Zone schema расширена 3 необязательными полями (`is_gas`, `gas_damage_per_turn`, `daily_reset_hours`) + `levels[].is_gas`. Backward-compat.
4. [ ] balance.md §M5 — 7 sub-sections (boss stats / boss-drops / T3 recipes / T3 stats / gas / daily / anti-scope). Все числа **точные** (не «≥X»).
5. [ ] Anti-scope M5 явно зафиксирован в §9.9 и в balance §M5.7. Список совпадает с `staff/status/M5.md` «Anti-scope M5».
6. [ ] `staff/status/GAME_DESIGNER.md` обновлён под M5 (status, изменения, открытые вопросы).
7. [ ] GDD §1–§8 не изменены (только новые §9 + расширения §6.X). balance.md §M1/§M2/§M3/§M4 не изменены.
8. [ ] Recovery-safe: первый коммит + Draft PR в первые 5-10 минут; коммит + push после каждого подшага (§9 → §6.X → balance §M5).
9. [ ] PR base = `m5-integration` (НЕ `main`). PR scope = только `docs/GDD.md` + `docs/balance.md` + `staff/status/GAME_DESIGNER.md`. Никаких `content/`, `src/`, `assets/`, чужих `staff/`.

## Anti-scope (твой)

- НЕ переписывать GDD §1–§8 / balance §M1–§M4.
- НЕ менять `content/*.json`, `src/`, `assets/`, чужие `staff/`.
- НЕ self-merge.
- НЕ добавлять в GDD §9 модульное оружие, полную радио-логику, Yandex SDK, skill tree, PvP, boss-cinematics, дополнительные AI behaviors, daily reward rotation, активные ability — всё это перечислено явно в §9.9 anti-scope.

## Ключевые файлы (expected create/modify)

| Файл | Action | Notes |
|---|---|---|
| `docs/GDD.md` | MODIFY (add §9 + extend §6.2, §6.4) | Не трогать §1–§5.3, §5.4 только дополнить ссылкой «boss использует §5.4 behaviors», §7, §8, §10, §11 |
| `docs/balance.md` | MODIFY (add §M5) | Не трогать §M1, §M2, §M3, §M4 |
| `staff/status/GAME_DESIGNER.md` | MODIFY | Status / изменения / открытые вопросы |

## Cross-refs (dependencies on other roles)

- **Content M5** (после твоего merge + QA Spec APPROVE): берёт твои `id`'ы (3 boss / 3 boss-drop / 3 T3) и числа из balance §M5 + кладёт в `content/{mobs,items,recipes,zones}.json`. Любое расхождение между твоим GDD и Content — **blocker** (M4 урок).
- **Engineer M5** (после QA Spec APPROVE): реализует `computePhaseTransition` / daily / gas / T3 craft / MobRole gating по твоему §9.3 flow и числам из balance §M5. Любое расхождение — **blocker**.
- **Artist M5** (после QA Spec APPROVE): рисует 3 boss спрайта 128×128 + 3 boss-drop + 3 T3 icons + gas overlay, использует **твои `id`'ы** (имена файлов = id'ы в content).
- **QA Spec M5** (после твоего PR Ready): проверяет 7 чек-листов против твоего PR. Если CHANGES_REQUESTED → ты делаешь fix PR (`m5/gd-fix`, как M4 паттерн PR #34 для PR #33 блокера).

## Token-budget (sanity)

~30-120 min на запись §9 + §6.X + balance §M5 + status update. Если выходишь за 120 min — разбить на continuation (commit/push текущее, открыть continuation handoff в `staff/status/GAME_DESIGNER.md`).

## Lessons learned M2+M3+M4 (применить)

- **DoD-precision**: «boss HP = 300», не «boss HP ≥ 200». M3+M4 урок: QA Spec поймал mismatch.
- **Cross-spec**: GDD §9 numbers **должны совпадать** с balance §M5 numbers. Не записывай `boss HP=300` в GDD и `boss HP=350` в balance — QA Spec это поймает.
- **Recovery-safe**: первый Draft PR в 5-10 мин (например, шапка §9 + одна boss-таблица — этого достаточно для open Draft).
- **Anti-scope discipline**: §9.9 явно перечисляет non-M5 фичи. QA Spec grep будет искать `module_weapon` / `cooldown` / `skill_tree` — должны быть только в anti-scope блоках.
