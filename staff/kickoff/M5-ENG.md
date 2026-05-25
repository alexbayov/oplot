# Kickoff: Engineer — Веха M5

Ты — **Engineer** на вехе M5 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M5-ENG.md`

## Когда стартуешь

После того как PM merge'нул GD M5 amendment PR в `m5-integration` И QA Spec M5 verdict = APPROVE. Параллельно с Content M5 и Artist M5.

## Действуй так:

1. Клонируй репо, переключись на `m5-integration` (`git checkout m5-integration && git pull`).
2. Прочитай:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M5.md`
   - `staff/handoff/M5-ENG.md` (твой брифинг)
   - `staff/handoff/M4-SUMMARY.md` (что унаследовано: ProgressionScene, LevelUpScene, perks, xp)
   - `staff/handoff/M3-SUMMARY.md` (5 AI behaviors, MobRuntimeState, multi-zone runtime)
   - `docs/GDD.md` §9 (boss механика) + §6.X (schema)
   - `docs/balance.md` §M5 (boss / T3 / gas / daily numbers)
3. Прогони **baseline на m5-integration**:
   ```
   npm install
   npm run typecheck
   npm run lint
   npm run test    # ожидаемо 128 / 128 (M4 baseline)
   npm run build
   ```
4. Напиши **короткий план** (5-7 пунктов):
   - Boss AI 2-фазный flow: расширить `MobRuntimeState` (`phase: 1 | 2`, `phase_transition_done: boolean`), функция `computePhaseTransition(mob, runtimeState, allies, heroCtx)` в `src/systems/mobAI.ts` — flip phase когда `mob.hp / mob.hp_max < mob.phase_threshold`, swap `behavior_id`. CombatScene показывает phase 1 / phase 2 (текст HUD + sprite swap).
   - Дейли-инстанс: `GameState.progress.daily_completed: Record<ZoneId, number>` (timestamp ms), функция `canEnterDailyInstance(state, zoneId, now) → boolean` (true если boss already defeated AND now - daily_completed[zoneId] ≥ daily_reset_hours × 3600 × 1000). UI: кнопка «Дейли» на MapScene видна только если canEnterDailyInstance.
   - Газовые зоны: в CombatScene если `zone.is_gas && !player.has_gas_mask` → `-zone.gas_damage_per_turn` каждый ход (после ход мобов). `has_gas_mask` = `hasItemInInventory(state, "gas_mask")` или `player.armor.id === "gas_mask"`.
   - T3 craft integration: `CraftScene` показывает T3 recipes из `content/recipes.json` (tier=3 или флаг), gating по ингредиент-наличию (включая boss-drop). После craft — slot replacement (как M2/M3).
   - MobRole runtime gating + boss-fight init в CombatScene: при spawn моба если `mob.role === "boss"` → boss-fight init (HUD overlay «Босс: name», phase=1 setup, guaranteed boss-drop on kill в LootScene).
   - LevelUpScene overkill queue (M4 NB follow-up): если xp gain > xpRequired до next level → multi-level-up, queue popups последовательно (вместо текущего single popup).
   - Тесты: ≥ 20 новых vitest (128 → ≥ 148): boss AI 2-phase (≥ 5), daily-instance (≥ 3), gas-zone (≥ 3), T3 craft (≥ 3), MobRole runtime (≥ 3), LevelUpScene queue (≥ 3).
5. Отправь Alex'у блокирующим: «План готов, жду апрува PM».
6. После апрува — `git checkout -b m5/world`, первый scaffolding-commit (например, расширение `MobRuntimeState` + `computePhaseTransition` stub + `GameState.progress.daily_completed` field) + push + **Draft PR `m5/world → m5-integration`** (recovery-safe, lesson M2+M3+M4).
7. Итерируй по подшагам, push после каждого. Соблюдай **архитектурное правило**: gameplay-логика в Phaser-free `src/systems/*` и `src/state/*`; scenes только рендерят state и зовут системы.
8. Self-check: `npm run typecheck && npm run lint && npm run test && npm run build` зелёные. Vitest count ≥ 148.
9. Обнови `staff/status/ENGINEER.md` под M5.
10. Сообщи Alex'у: «Engineer M5 PR Ready, <ссылка>, vitest <X>, build <Y> KB».

## Можно параллельно с

Content M5, Artist M5 (после QA Spec M5 APPROVE).

## Нельзя до

QA Spec M5 verdict = APPROVE.

## Запрещено

- Self-merge.
- Push в `main` / `m5-integration` напрямую.
- Изменять `content/*.json` (Content owner) или `assets/*` (Artist owner) или `docs/*` (GD owner) или чужие `staff/`.
- Включение фич вне M5 scope: модули оружия, новые AI behaviors (boss использует phase_1/phase_2 из M3-5), полная радио-логика (M6), Yandex SDK (M8), skill tree, активные ability, PvP, animated phase transition / cinematics (M7 polish — у тебя простой текст/sprite swap).
- Сторонние UI libs / animations / sounds (M7).
- PAT в URL / echo / print.
- План > 7 пунктов.
- Ломать M2 Forest 7-step MVP flow / M3 multi-zone navigation / M3 RadioScene / M4 ProgressionScene + LevelUpScene (regression: 128 baseline vitest должны остаться зелёные).
- **Cross-spec расхождение** (например, `content/mobs.json` boss HP vs `balance.md` §M5 boss HP) → **эскалация в PM**, не резолвить (M4 урок). Числа берутся **строго** из `content/*.json` (которые Content получает из `balance.md`).
- **DoD-precision: 148 vitest (не «≥148»), 2 МБ build budget (не «≤2 МБ»)** — точные числа в финальном PR description.

База для твоего PR: `m5-integration` (НЕ `main`).

## Архитектурное правило (важно)

- Gameplay formulas / AI / state transitions — **в Phaser-free `src/systems/*` и `src/state/*`**.
- Scenes (`src/scenes/*`) только рендерят state и вызывают системные функции; **никаких hidden формул внутри UI scenes**.
- Пример M5: `computePhaseTransition(mob, runtimeState, allies, heroCtx)` — в `src/systems/mobAI.ts`. CombatScene вызывает её и рендерит результат (phase HUD + sprite swap).
