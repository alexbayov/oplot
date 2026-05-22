# Handoff — Engineer M5 (Боссы и инстансы)

> Этот документ — подробный брифинг для Engineer на вехе M5. Ты реализуешь boss AI 2-фазный flow, daily instance, gas zones, T3 craft integration, MobRole runtime gating, и LevelUpScene overkill queue (M4 NB follow-up). Цель: 128 baseline → **148** vitest.

## Preconditions

- GD M5 amendment PR `m5/gd-amendment` merged в `m5-integration`.
- QA Spec M5 verdict = APPROVE.
- Параллельно с тобой работают Content M5 и Artist M5 в своих ветках.
- M4 baseline: 128 vitest, 11 scenes, build ~1.5 MB, perks/XP/ProgressionScene/LevelUpScene functional.

## Контекст файлов

**Читать:**
1. `staff/CONTEXT.md`
2. `staff/LINKS.md`
3. `staff/status/M5.md`
4. `staff/handoff/M5-ENG.md` (этот файл)
5. `staff/handoff/M4-SUMMARY.md` (что унаследовано: 5 mob AI behaviors, MobRuntimeState, multi-zone runtime, ProgressionScene, LevelUpScene, perks)
6. `staff/handoff/M3-SUMMARY.md` (multi-zone + RadioScene baseline)
7. `docs/GDD.md` §9 (boss spec) + §6.X (schema)
8. `docs/balance.md` §M5 (numbers)
9. Существующий код:
   - `src/types/mob.ts` (MobType, MobRole, Mob)
   - `src/types/zone.ts` (Zone)
   - `src/systems/mobAI.ts` (chooseMobActionV2, MobRuntimeState, 5 behaviors)
   - `src/systems/combat.ts` (computeDamage)
   - `src/systems/weight.ts` (computeReturnTime)
   - `src/state/types.ts` (GameState, GameState.progress)
   - `src/state/GameState.ts` (helpers)
   - `src/scenes/{Boot,Base,Map,Sortie,Combat,Loot,Return,Inventory,Craft,Radio,Progression,LevelUp}Scene.ts`
   - `src/main.ts`
10. Существующие тесты: `src/systems/__tests__/*.test.ts` (128 vitest — должны остаться зелёные)

## Baseline check (перед планом)

```
git checkout m5-integration && git pull
npm install
npm run typecheck    # должен быть clean
npm run lint         # должен быть clean
npm run test         # ожидаем 128 / 128
npm run build        # ожидаем ~1.5 MB clean
```

Если baseline не зелёный — это **blocker**, эскалируй PM сразу.

## Deliverables (5-7 крупных блоков, каждый — отдельный коммит после своего теста)

### 1. Boss AI 2-фазный flow (Phaser-free `src/systems/mobAI.ts`)

- Расширить `MobRuntimeState`:
  ```ts
  interface MobRuntimeState {
    // ... existing M3 fields
    phase: 1 | 2;
    phase_transition_done: boolean;
  }
  ```
- Новая функция `computePhaseTransition(mob, runtimeState): { newPhase: 1 | 2, newBehaviorId: string | null }`:
  - If `runtimeState.phase === 1 && !runtimeState.phase_transition_done && mob.hp / mob.hp_max < mob.phase_threshold` → return `{ newPhase: 2, newBehaviorId: mob.phase_2_behavior_id }`.
  - Иначе return `{ newPhase: runtimeState.phase, newBehaviorId: null }`.
- В `chooseMobActionV2`: перед выбором действия — вызвать `computePhaseTransition`; если phase changed → flip `runtimeState.phase` + `phase_transition_done = true` + use `newBehaviorId` для текущего хода.
- M1 mobs (`role` undefined или `"regular"`) — fallback в `chooseMobAction` (existing), `MobRuntimeState.phase` = 1, transition no-op.
- Тесты `src/systems/__tests__/mobAI.test.ts` (≥ 5 новых):
  - Boss starts at phase 1.
  - Boss transitions to phase 2 при hp/hp_max < threshold.
  - Boss НЕ transitions второй раз (idempotent).
  - Phase 2 использует `phase_2_behavior_id`.
  - Regular mob phase stays 1, no transition.

### 2. CombatScene boss-fight UI (Phaser scene)

- При spawn mob с `role: "boss"` — CombatScene показывает HUD overlay: «Босс: <mob.name>» (top of screen).
- Phase 1 / Phase 2 indicator (HUD): «Фаза 1» / «Фаза 2» — обновляется по `runtimeState.phase`.
- На phase transition (computePhaseTransition вернул newPhase: 2) — short popup «<mob.name> переходит в фазу 2!» (текст, 1.5 сек, **БЕЗ animation / cinematic** — anti-scope M7).
- Sprite swap (если Artist предоставил `<mob_id>_phase2.png`) — optional, fallback: phase 2 sprite tinted (например, red tint).
- При boss kill — гарантированный boss-drop добавлен в LootScene pool (через `mob.loot_table` с `drop_chance: 1.0`).
- Phaser-free: вся логика phase transition — в `src/systems/mobAI.ts` через `computePhaseTransition`; CombatScene только рендерит state.

### 3. Daily instance (`GameState.progress` + UI)

- Расширить `GameState.progress`:
  ```ts
  daily_completed: Record<string /* zoneId */, number /* timestamp ms */>;
  // Existing: forest_depth_2_completed, any_warehouse_sortie_completed
  ```
- В `src/state/GameState.ts` или `src/systems/dailyInstance.ts` (новый):
  - `canEnterDailyInstance(state, zoneId, now): boolean` — true если:
    - Zone has `boss_id` defined в `content/zones.json`.
    - Boss already defeated (можно отследить через progress flag, например `<zone>_boss_defeated`).
    - `now - state.progress.daily_completed[zoneId] >= zone.daily_reset_hours * 3600 * 1000`.
  - `markDailyCompleted(state, zoneId, now)` — set `state.progress.daily_completed[zoneId] = now`.
- В MapScene: после spawn zone buttons — для каждой zone с unlocked + boss-defeated — добавить вторичную кнопку «Дейли (<zone>)»:
  - Видна только если `canEnterDailyInstance(state, zoneId, Date.now())`.
  - Click → SortieScene init с `daily: true, depth: 3` (skip depth 1+2, jump directly to bossfight).
  - Если cool-down активен — кнопка disabled с tooltip «До: <readable time>».
- В ReturnScene после успешного дейли — `markDailyCompleted(state, currentZoneId, Date.now())`.
- Тесты `src/systems/__tests__/dailyInstance.test.ts` (≥ 3 новых):
  - `canEnterDailyInstance` false до boss defeated.
  - `canEnterDailyInstance` false в cool-down period (после kill).
  - `canEnterDailyInstance` true после cool-down expiry.

### 4. Gas zones (CombatScene damage-per-turn)

- В `src/systems/combat.ts` (или новый `src/systems/gasZone.ts`):
  - `computeGasDamage(zone, depth, player): number` — return `zone.gas_damage_per_turn` если `zone.levels[depth].is_gas` И `!playerHasGasMask(player)`, else 0.
  - `playerHasGasMask(player): boolean` — true если `player.armor?.id === "gas_mask"` ИЛИ `inventory.some(i => i.id === "gas_mask")`.
- В CombatScene после хода мобов (turn end):
  - `gasDamage = computeGasDamage(currentZone, currentDepth, player)`.
  - Если `gasDamage > 0` → `player.hp -= gasDamage`, HUD показывает «Газ: -<gasDamage> HP».
- ReturnScene аналогично: если возврат через gas zone без gas_mask → tick gas damage per return turn (или один раз — на выбор GD, в balance §M5.5).
- Тесты `src/systems/__tests__/gasZone.test.ts` (≥ 3 новых):
  - Forest (без gas) → 0 damage.
  - Warehouse depth 2 без gas_mask → damage > 0.
  - Warehouse depth 2 с gas_mask в armor-slot → 0 damage.

### 5. T3 craft integration (CraftScene)

- В CraftScene: при load recipes из `content/recipes.json` — показывать **все** (T1 + T2 + T3).
- Для T3 recipe (`tier === 3`) — кнопка «Скрафтить» disabled если в inventory нет требуемого boss-drop ингредиента (gating).
- Tooltip: «Требуется: <boss_drop_id> × <qty>» если ингредиент отсутствует.
- После craft — slot replacement (как M2/M3): новый T3 item в inventory, ingredients consumed, equipped в slot (auto-equip если slot пустой).
- Тесты `src/systems/__tests__/craft.test.ts` (или extend existing) (≥ 3 новых):
  - T3 recipe видим в CraftScene list.
  - T3 craft без boss-drop → fail / disabled.
  - T3 craft успех → output_item в inventory, ингредиенты consumed.

### 6. MobRole runtime gating + boss-fight init

- В CombatScene при spawn mob:
  - Если `mob.role === "boss"` → boss-fight init: HUD overlay «Босс: <mob.name>», `MobRuntimeState.phase = 1`, `phase_transition_done = false`, loot_table includes guaranteed boss-drop.
  - Иначе (regular) → existing M3 flow без изменений.
- В LootScene: для boss kill (`mob.role === "boss"`) — display «Drop с босса: <boss_drop.name>» с highlight (UI hint, не animation).
- Тесты `src/systems/__tests__/mobRole.test.ts` (или extend mobAI.test.ts) (≥ 3 новых):
  - Spawn mob role:"boss" → MobRuntimeState init с phase: 1.
  - Spawn mob role:"regular" → no phase tracking (или phase: 1 always, no transition).
  - Boss kill → loot_table guaranteed drop в loot pool.

### 7. LevelUpScene overkill popup queue (M4 NB follow-up)

- M4 LevelUpScene показывает **single popup** даже если xp gain > xpRequired(currentLevel) + xpRequired(currentLevel + 1) (multi-level-up).
- M5 fix: queue popups последовательно (popup 1 → user picks perk → popup 2 → ...).
- В LevelUpScene или `src/systems/progression.ts`:
  - При gain XP → расчитать `levelsGained: number`.
  - Если `levelsGained > 1` → push `levelsGained` popups в queue, показывать sequentially.
- Тесты `src/systems/__tests__/progression.test.ts` (или extend existing) (≥ 3 новых):
  - Single level-up → 1 popup.
  - Double level-up (overkill XP) → 2 popups в queue.
  - Triple level-up → 3 popups в queue.

## Vitest target

- **Baseline:** 128 (M4).
- **M5 deliverables:** ≥ 20 новых (5 boss AI + 3 daily + 3 gas + 3 T3 craft + 3 MobRole + 3 LevelUpScene queue).
- **Total target:** **148** vitest (точное число, не «≥148» — M3+M4 урок DoD-precision).

## DoD (Engineer M5)

1. [ ] `computePhaseTransition` + `MobRuntimeState.phase` + `phase_transition_done` в `src/systems/mobAI.ts`. 2-фазный flow работает для 3 boss из `content/mobs.json`.
2. [ ] CombatScene boss HUD overlay + phase indicator + phase transition popup (text, без animation).
3. [ ] `GameState.progress.daily_completed: Record<ZoneId, number>` + `canEnterDailyInstance` + MapScene дейли кнопка + ReturnScene `markDailyCompleted`.
4. [ ] `computeGasDamage` + `playerHasGasMask` + CombatScene gas tick + HUD «Газ: -<X> HP».
5. [ ] CraftScene показывает T3 recipes + boss-drop gating + slot replacement после craft.
6. [ ] MobRole runtime: boss spawn → boss-fight init / regular spawn → unchanged. Boss kill → guaranteed drop.
7. [ ] LevelUpScene overkill queue (multi-level-up → N popups sequentially).
8. [ ] Vitest count = **148** (128 baseline + 20 M5). 0 failed.
9. [ ] `npm run typecheck && npm run lint && npm run test && npm run build` — clean.
10. [ ] Build ≤ **2 MB**.
11. [ ] M2 Forest 7-step MVP / M3 multi-zone / M3 RadioScene / M4 ProgressionScene + LevelUpScene не сломаны (regression PASS).
12. [ ] `staff/status/ENGINEER.md` обновлён.
13. [ ] Recovery-safe: Draft PR в 5-10 мин (например, scaffold `MobRuntimeState.phase` + `phase_transition_done` + 1 test), push после каждого deliverable.
14. [ ] PR base = `m5-integration` (НЕ `main`). PR scope = только `src/` + `staff/status/ENGINEER.md`. **Никаких** `docs/`, `content/`, `assets/`, чужих `staff/`.

## Anti-scope (твой)

- НЕ менять `docs/` (GD owner), `content/*.json` (Content owner), `assets/*` (Artist owner), чужие `staff/`.
- НЕ self-merge.
- НЕ добавлять модули оружия (M5+ подсистема), полную радио-логику (M6), Yandex SDK (M8), skill tree (M5+), активные ability, PvP, boss-cinematics / animated phase transition (M7), дополнительные AI behaviors (boss использует phase_1/phase_2 из M3-5), animation / sound / particle effects.
- НЕ сторонние UI libs.
- НЕ менять M2 7-step Forest MVP / M3 multi-zone / RadioScene formulas / M4 ProgressionScene formulas (regression).
- НЕ резолвить cross-spec расхождения (если `content/mobs.json` boss HP=300 vs `balance.md` §M5.1 boss HP=350 → эскалация в PM, не самовольно).

## Архитектурное правило (важно)

- Gameplay formulas / AI / state transitions — в Phaser-free `src/systems/*` и `src/state/*`.
- Scenes (`src/scenes/*`) только рендерят state + вызывают системные функции. **Никаких hidden формул внутри UI scenes** (например, computePhaseTransition не должно быть внутри CombatScene; оно в mobAI.ts).
- Пример: `MobRuntimeState` хранится либо в Combat encounter state (в `GameState`), либо в локальной structure CombatScene'а, **НО** методы изменения — в `mobAI.ts`.

## Ключевые файлы (expected create/modify)

| Файл | Action |
|---|---|
| `src/systems/mobAI.ts` | MODIFY — `computePhaseTransition`, `MobRuntimeState.phase` |
| `src/systems/dailyInstance.ts` (NEW) | CREATE — `canEnterDailyInstance`, `markDailyCompleted` |
| `src/systems/gasZone.ts` (NEW) | CREATE — `computeGasDamage`, `playerHasGasMask` |
| `src/state/types.ts` | MODIFY — `GameState.progress.daily_completed` |
| `src/scenes/CombatScene.ts` | MODIFY — boss HUD, phase indicator, gas tick |
| `src/scenes/MapScene.ts` | MODIFY — дейли button per zone |
| `src/scenes/ReturnScene.ts` | MODIFY — `markDailyCompleted` после дейли возврата |
| `src/scenes/CraftScene.ts` | MODIFY — T3 recipes + boss-drop gating |
| `src/scenes/LevelUpScene.ts` | MODIFY — overkill popup queue |
| `src/systems/__tests__/mobAI.test.ts` | MODIFY — ≥ 5 новых тестов |
| `src/systems/__tests__/dailyInstance.test.ts` (NEW) | CREATE — ≥ 3 тестов |
| `src/systems/__tests__/gasZone.test.ts` (NEW) | CREATE — ≥ 3 тестов |
| `src/systems/__tests__/craft.test.ts` (NEW или MODIFY) | CREATE/MODIFY — ≥ 3 тестов T3 |
| `src/systems/__tests__/mobRole.test.ts` (NEW или extend) | CREATE — ≥ 3 тестов |
| `src/systems/__tests__/progression.test.ts` | MODIFY — ≥ 3 новых тестов queue |
| `staff/status/ENGINEER.md` | MODIFY |

## Cross-refs (dependencies)

- **GD M5**: GDD §9 — твой spec для phase transition / daily / gas / T3 craft. balance §M5 — числа для тестов (phase_threshold=0.5, gas damage=5/8, daily=24h).
- **Content M5** (параллельно): ты читаешь его `content/mobs.json` для boss data, `content/zones.json` для is_gas / boss_id / daily_reset_hours, `content/recipes.json` для T3. Если он merge'нется ПОСЛЕ тебя — используй **soft-warn в BootScene** вместо hard-fail на cross-ref (M3 паттерн). После обоих merge — cross-ref работает.
- **Artist M5** (параллельно): boss sprites используются в CombatScene. Если sprite отсутствует — fallback на existing M3 mob sprite + tint. Phase 2 sprite — optional, fallback red tint.
- **QA Acceptance M5**: проверит vitest=148, build, regression, anti-scope в `src/`.

## Token-budget

~60-120 min на 5-7 deliverables. Если выходишь — разбить на continuation: commit/push текущее, обнови `staff/status/ENGINEER.md` с «continuation needed», открой continuation handoff с указанием next deliverable.

## Lessons learned M2+M3+M4 (применить)

- **DoD-precision**: vitest = **148**, не «≥148». M3+M4 урок — точные числа.
- **Cross-spec**: `content/mobs.json` boss HP должен совпадать с `balance.md` §M5.1 boss HP. M4 урок (xp_reward §M4 vs §M1/§M3 → blocker).
- **Phaser-free architecture**: M3 урок — все 5 AI behaviors в `src/systems/mobAI.ts`, не в CombatScene. Повтори паттерн для phase transition / gas / daily.
- **Backward-compat**: M1 mobs (`role: "regular"`) работают через existing `chooseMobAction` fallback. Не ломай.
- **Soft-warn vs hard-fail**: M3 BootScene паттерн — soft-warn на missing assets (если Content/Artist ещё не merge'нулись). После всех merge — нет warnings.
- **Recovery-safe**: первый scaffold-commit + Draft PR в 5-10 мин. Push после каждого deliverable.

База для твоего PR: `m5-integration` (НЕ `main`).
