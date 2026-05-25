# Handoff — QA Acceptance M5 (Боссы и инстансы)

> Этот документ — подробный брифинг для QA Engineer на этапе **acceptance review** вехи M5. Ты проверяешь все 3 role-PR (Content / Engineer / Artist) через 3 Gate'а (static / runtime / spec) с локальным octopus-merge. Verdict: APPROVE / CHANGES_REQUESTED.

## Preconditions

- 3 role-PR Ready (не Draft): Content M5 (`m5/content`), Engineer M5 (`m5/world`), Artist M5 (`m5/art`).
- GD M5 amendment + QA Spec M5 уже merged в `m5-integration` (предыдущие gate'ы).
- Ты — последний gate перед PM merge sequence + gate-close.

## Контекст файлов

**Читать:**
1. `staff/CONTEXT.md`
2. `staff/LINKS.md`
3. `staff/status/M5.md` (DoD ground-truth)
4. `staff/handoff/M5-QA-ACCEPT.md` (этот файл)
5. `staff/handoff/M5-QA-SPEC.md` (что QA Spec уже проверил)
6. `staff/handoff/M5-{GD,CONTENT,ENG,ARTIST}.md` (что каждый владелец должен был сделать)
7. `staff/handoff/M4-SUMMARY.md` (M4 baseline: 128 vitest, 11 scenes, ~1.5 MB build, ~259 KB assets, perks/XP/ProgressionScene/LevelUpScene)
8. `staff/handoff/M3-SUMMARY.md`
9. `docs/GDD.md` (включая §9 + §6.X)
10. `docs/balance.md` (включая §M5)

## Локальный octopus-merge (M3+M4 урок: ловим cross-PR конфликты ДО PM merge sequence)

```bash
git checkout m5-integration && git pull
git checkout -b qa/m5-acceptance-test m5-integration
git fetch origin m5/content m5/world m5/art
git merge --no-ff origin/m5/content origin/m5/world origin/m5/art
```

**Результаты:**
- Clean merge → переходи к Gate 1.
- Conflict → **blocker**, эскалируй владельцам конфликтующих файлов (Content / Engineer / Artist) через сообщение Alex'у. **Не резолвить самостоятельно** (M3+M4 урок).

После octopus-merge — на этой временной ветке `qa/m5-acceptance-test` прогоняй Gate 1 + Gate 2 + Gate 3. Финальный verdict записывай в `staff/status/QA.md` (на отдельной ветке `qa/m5-acceptance` от `m5-integration`).

## Gate 1: Static check

```bash
npm install
npm run typecheck    # должен быть clean
npm run lint         # должен быть clean
npm run test         # ожидаем ≥ 148 vitest, 0 failed
npm run build        # ожидаем ≤ 2 MB
```

Проверки:
- [ ] `typecheck` clean (0 errors).
- [ ] `lint` clean (0 errors / 0 warnings — или внутри M4 baseline tolerance).
- [ ] `vitest` count = **148** (128 M4 baseline + 20 M5). Если меньше — **blocker** (DoD-precision M3+M4 урок).
- [ ] 0 failed tests.
- [ ] `build` size ≤ **2 MB** (точное число в МБ).
- [ ] `du -sk assets/` ≤ **600 KB** (точное число в KB).

## Gate 2: Runtime smoke

Запустить `npm run dev`, открыть в Chrome / dev tool (или headless через Playwright если доступно).

### M2 regression (7-step Forest MVP — не сломан)

- [ ] BaseScene → MapScene → click Forest → SortieScene (depth 1) → CombatScene mob spawn → kill mob → loot drop → ReturnScene weight calc → CraftScene → CraftSuccess → InventoryScene.

### M3 regression (multi-zone + RadioScene — не сломан)

- [ ] MapScene показывает 3 zones (Forest unlocked, Warehouse/City unlocked после M5 progress).
- [ ] Warehouse depth 1 (без gas) → бой → возврат с zone multiplier 1.2.
- [ ] City depth 1 → бой → возврат с zone multiplier 1.5.
- [ ] RadioScene открывается с BaseScene, dummy signals видны, dismiss работает.

### M4 regression (Progression + LevelUpScene — не сломан)

- [ ] CombatScene kill mob → XP gain → если level-up → LevelUpScene popup → выбрать perk → applied в state.
- [ ] ProgressionScene открывается с BaseScene, текущий level / XP / perks visible.
- [ ] 8 perks selectable + veteran_conditioning fallback when pool empty.

### M5 boss-fight (новое)

- [ ] Sortie до Forest depth 3 → CombatScene spawn `forest_alpha_mutant` (role:"boss") → HUD overlay «Босс: <name>» visible.
- [ ] Phase 1 indicator visible. Boss использует phase_1_behavior_id (например `berserker_low_hp`).
- [ ] Поскольку boss HP падает ниже phase_threshold → phase transition popup + Phase 2 indicator visible. Boss использует phase_2_behavior_id (например `pack_bonus_when_paired`).
- [ ] Kill boss → loot включает guaranteed boss-drop (`mutated_gland`).
- [ ] Аналогично для warehouse_drone_prime (depth 3 warehouse) и city_guard_captain (depth 3 city).

### M5 daily instance (новое)

- [ ] После kill boss → ReturnScene → progress.daily_completed[zoneId] = timestamp.
- [ ] На MapScene видна кнопка «Дейли (<zone>)» (только для zone'ов с defeated boss).
- [ ] В cool-down period (24h) — кнопка disabled / hidden.
- [ ] После 24h expiry — кнопка enabled, click → SortieScene jump to depth 3 → boss spawn → rerun bossfight.

### M5 gas zone (новое)

- [ ] Sortie в warehouse depth 2 без `gas_mask` в armor-slot → CombatScene HUD: «Газ: -5 HP/ход» (или actual number из balance).
- [ ] Player HP уменьшается на gas_damage_per_turn каждый ход.
- [ ] Sortie в warehouse depth 2 с `gas_mask` (equipped или в inventory) → 0 gas damage.
- [ ] Sortie в forest (без gas) → 0 gas damage всегда.

### M5 T3 craft (новое)

- [ ] После kill boss → boss-drop в inventory.
- [ ] CraftScene показывает T3 recipe (например `composite_blade`) с боcc-drop ингредиентом в visible list.
- [ ] Без boss-drop → T3 recipe button disabled с tooltip «Требуется: <boss_drop_id> × <qty>».
- [ ] С boss-drop → craft success → T3 item в inventory, ингредиенты consumed, slot auto-equip.

### M5 LevelUpScene overkill queue (M4 NB follow-up)

- [ ] Kill boss с high xp_reward → multi-level-up (≥ 2 уровня сразу).
- [ ] LevelUpScene показывает **N popups sequentially** (1 popup на level-up), не single popup.

## Gate 3: Spec compliance

### 3a. Anti-scope grep (обязательно)

В `src/` и `content/`:
```bash
grep -rni "module_weapon\|weapon_module\|attachment\|skill[_ ]tree\|skill[_ ]point\|cooldown\|yandex[_ ]sdk\|leaderboard\|cloud[_ ]save\|pvp\|multiplayer\|cinematic\|trust[_ ]level\|radio[_ ]reward\|active[_ ]ability" src/ content/
```

Проверки:
- [ ] Hits только в комментариях `// M5+ TODO` / `// M6+ ...` / `// not for M5`. Никаких runtime / config / data references.
- [ ] Если есть hits с реальными formulas / fields / JSON keys → **blocker** (anti-scope violation).

### 3b. DoD numbers (precision)

Сверка с `staff/status/M5.md` DoD:
- [ ] `content/mobs.json`: всего **11** mobs (8 regular + 3 boss). Точное число.
- [ ] `content/items.json`: всего **35** items (29 + 3 boss-drop + 3 T3). Точное.
- [ ] `content/recipes.json`: всего **18** recipes (15 + 3 T3). Точное.
- [ ] `content/zones.json`: 3 zones, все `boss_id` заполнены. Warehouse + city с `is_gas: true` на depth 2,3.
- [ ] M5 assets: **10 файлов** (3 boss + 3 boss-drop + 3 T3 + 1 gas overlay). Точное.
- [ ] vitest count = **148** (Gate 1 уже проверил, повторная сверка).

### 3c. JSON cross-ref validation

- [ ] Каждый `mobs[].boss_drop_id` exists в `items[].id`.
- [ ] Каждый `recipes[].ingredients[].item_id` exists в `items[].id`.
- [ ] Каждый `recipes[].output_item_id` exists в `items[].id`.
- [ ] Каждый `zones[].boss_id` exists в `mobs[].id` с `role: "boss"`.

### 3d. Balance / content / code consistency

- [ ] `content/mobs.json` boss `hp` совпадает с `balance.md` §M5.1 для всех 3 boss.
- [ ] `content/mobs.json` boss `phase_threshold` / `phase_2_behavior_id` совпадает с balance §M5.1.
- [ ] `content/zones.json` `gas_damage_per_turn` совпадает с balance §M5.5.
- [ ] `content/zones.json` `daily_reset_hours` = 24 для всех 3 zone (per balance §M5.6).
- [ ] T3 item stats в `content/items.json` совпадает с balance §M5.4.
- [ ] Engineer's `src/systems/mobAI.ts` `computePhaseTransition` использует `mob.phase_threshold` (а не hardcoded 0.5) — backward read из content.

### 3e. M3+M4 regression (backwards compat)

- [ ] Existing 8 mobs (3 M1 + 5 M3) all `role: "regular"` или undefined.
- [ ] Existing 29 items не изменены (только +6 added).
- [ ] Existing 15 recipes не изменены (только +3 added).
- [ ] M1+M3+M4 assets не пересозданы (git log assets/ показывает только M5 commits).

## Verdict (итог)

- **APPROVE** — все 3 Gate'а PASS (Gate 1 + Gate 2 all checks + Gate 3 all sub-checks).
- **CHANGES_REQUESTED** — ≥ 1 FAIL в любом Gate'е. Каждый блокер пометь:
  - **`**blocker**`** — должен fix перед PM merge sequence (vitest fail, anti-scope hits, cross-ref errors, JSON validation errors, regression breakage).
  - **`_non-blocking M6+ follow-up_`** — может пройти, M6 backlog (минорные UX / size budget пересечения / minor visual fallback).

Записать в `staff/status/QA.md` секция «# M5 Acceptance»:
- Полный отчёт каждого Gate'а (PASS / FAIL для каждой проверки + цитата / numbers).
- Финальный verdict.
- Точные числа: vitest count, build MB, assets KB, mobs/items/recipes total.

## DoD (твой)

1. [ ] Локальный octopus-merge clean (без conflicts).
2. [ ] Gate 1 — все 6 проверок PASS.
3. [ ] Gate 2 — все runtime smoke проверки PASS (M2/M3/M4 regression + 6 M5 новых).
4. [ ] Gate 3 — все 5 sub-Gate'ов PASS (anti-scope grep, DoD numbers, JSON cross-ref, balance/content/code consistency, M3+M4 regression).
5. [ ] `staff/status/QA.md` обновлён с полным M5 Acceptance отчётом.
6. [ ] PR `qa/m5-acceptance → m5-integration` Ready (не Draft).
7. [ ] Recovery-safe: первый Draft PR в 5-10 мин (scaffold `staff/status/QA.md` секция «# M5 Acceptance» status: IN_PROGRESS), push после каждого Gate'а.
8. [ ] PR scope = только `staff/status/QA.md`. **Никаких** `docs/`, `src/`, `content/`, `assets/`, чужих `staff/`.
9. [ ] Verdict сообщён Alex'у блокирующим: «QA Acceptance M5 verdict <APPROVE|CHANGES_REQUESTED>, PR <ссылка>, vitest <X>, build <Y> MB, assets <Z> KB».

## Anti-scope (твой)

- НЕ менять `docs/`, `src/`, `content/`, `assets/`, чужие `staff/` (только `staff/status/QA.md`).
- НЕ self-merge.
- НЕ резолвить cross-PR конфликты / cross-spec расхождения (эскалация в PM).
- НЕ verdict APPROVE если хоть один FAIL в любом Gate'е.
- НЕ vitest skip / disable / TODO — все должны быть green (PASS).

## Ключевые файлы

| Файл | Action |
|---|---|
| `staff/status/QA.md` | MODIFY — добавить секцию «# M5 Acceptance» с полным verdict |

## Cross-refs (dependencies)

- **Content M5 / Engineer M5 / Artist M5**: твой verdict — последний gate перед PM merge sequence. Если CHANGES_REQUESTED → role-owner делает fix PR (например `m5/content-fix`), ты делаешь re-review (новая секция в `staff/status/QA.md`).
- **PM finalize**: после твоего APPROVE → PM делает finalize PR (`pm/m5-finalize → m5-integration`) с updated status / summary, затем gate-close PR (`m5-integration → main`).
- **GD M5 fix** (если cross-spec mismatch в Gate 3d): эскалация в PM — он решает option (a) update content / option (b) update balance / option (c) update code, как M4 урок (PR #34 fixed PR #33 blocker).

## Token-budget

~30-90 min на octopus-merge + 3 Gate'а + verdict + push. План должен быть ≤ 7 пунктов.

## Lessons learned M2+M3+M4 (применить)

- **Octopus-merge first**: M3+M4 урок — clean octopus до Gate 1. Cross-PR конфликты в content/ JSON или src/ ts — ловятся здесь.
- **DoD-precision**: vitest = **148**, mobs total = **11**, items = **35**, recipes = **18**, assets = **10**. Точные числа в verdict report. M3 урок: items=29 не «≥30».
- **Cross-spec → blocker**: M4 урок (xp_reward §M4 vs §M1/§M3 → fix PR #34). Если в Gate 3d расхождение balance vs content vs code — blocker, эскалация в PM.
- **Anti-scope grep**: M3+M4 урок — реально прогонять grep, не «на глаз». Цитата с line number в verdict.
- **Backwards compat**: Gate 3e обязательно — M3+M4 баzelines не сломаны.
- **Recovery-safe**: Draft PR в 5-10 мин (scaffold), push после каждого Gate'а.

База для твоего PR: `m5-integration` (НЕ `main`).
