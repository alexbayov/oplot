# Status: Engineer

**Текущая веха:** M3
**Статус:** DONE_PENDING_QA_REVIEW
**Последнее обновление:** 2026-05-21

## Что сделано (M3)

- Ветка `m3/world` создана от `m3-integration`, PR [#26](https://github.com/alexbayov/oplot/pull/26) (`m3/world → m3-integration`) — Ready for review.
- Все 4 проверки зелёные локально: `npm run typecheck` ✅, `npm run lint` ✅, `npm run test` ✅ (**89/89**, было 49 в M2), `npm run build` ✅ (~1510 kB, под лимитом 2 MB Yandex.Games).
- Архитектурное правило соблюдено: все gameplay-формулы и AI — в Phaser-free `src/systems/*`, сцены только рендерят state и зовут системы.

### Phaser-free системы (новые)

- `src/systems/mobAI.ts` — `MobRuntimeState` (per-fight mutable: hp / damage_min/max / base_speed / turn_count / berserk_triggered / cover_active / fled) + `createMobRuntimeState` + `chooseMobActionV2`. Реализованы 5 поведений GDD §5.4.6:
  - `ranged_keep_distance` (×0.5 dmg против melee-героя; иначе ×1.0).
  - `defensive_cover` (чередует attack ↔ cover по чётности своего хода; `cover_active=true` для следующего удара героя).
  - `berserker_low_hp` (при первом падении hp < 50%: damage ×2, base_speed −30, single-shot).
  - `pack_bonus_when_paired` (×1.5 dmg при ≥2 живых `pack_rat` — включая себя).
  - `armor_piercing_ranged` (action.ignore_armor_defense=true → армор героя игнорируется).
  - **M1 fallback**: `behavior_id?` опционален; mob без behavior_id → старая логика `chooseMobAction` (marauder flee, остальные plain attack) → 49 M2 тестов остаются зелёные.
- `src/systems/zoneUnlock.ts` — `evaluateUnlockCondition` / `describeUnlockCondition` / `applySortieCompletion`. Поддержанные условия:
  - `"start"` → всегда unlocked (forest).
  - `"forest_depth_2_completed"` → читается из `progress`.
  - `"any_warehouse_sortie_completed"` → читается из `progress`.
  - Любое другое значение → locked + `console.warn` (граceful для будущих зон).
- `src/systems/radio.ts` — `activeSignals` (filter `!dismissed && expires_after_sorties > 0`), `tickRadioOnReturn` (декремент + auto-dismiss на 0), `dismissSignal`. **Только локальное состояние**, никаких rewards / ambush / trust — anti-scope M6.
- `src/systems/weight.ts` — `computeReturnTime(curWeight, maxWeight, zoneMultiplier = 1.0)`. forest без аргумента → ×1.0 → M2-формула не изменилась; warehouse=1.2, city=1.5 (`docs/balance.md` §M3).

### Сцены (рефакторинг под системы)

- `src/scenes/CombatScene.ts` — `MobInstance` теперь `{ mob: Mob; state: MobRuntimeState }`. `runMobTurn` → `chooseMobActionV2`. Ветки:
  - `flee` → `state.fled = true`, advance.
  - `cover` → лог + advance; `cover_active` устанавливает сам AI.
  - `attack` → `applyAttack` с `state.damage_*` × `action.damage_multiplier`; `armorStats = null` если `action.ignore_armor_defense`.
  - Удар героя по `cover_active`-мобу: его defense × `(1 + COVER_DEFENSE_BONUS_PCT)` на один удар, потом `cover_active = false`.
  - Initiative моба берётся из `state.base_speed` (а не `mob.base_speed`), чтобы berserker `−30 speed` влиял на порядок ходов.
- `src/scenes/MapScene.ts` — список ВСЕХ зон из `GameState.data.zones`, сортировка по `ZONE_ORDER = [forest, warehouse, city]`. Заблокированные зоны → `alpha 0.5` + лейбл «Закрыто. Откроется после: <человеко-читаемое условие>». M2 forest path не сломан (`start` → всегда unlocked).
- `src/scenes/ReturnScene.ts` — `computeReturnTime` получает `zone.return_time_multiplier ?? 1.0`; перед сбросом `currentSortie` зовётся `applySortieCompletion` (флипает `forest_depth_2_completed` / `any_warehouse_sortie_completed` при `fights_completed > 0`); каждый возврат — `tickRadioOnReturn`.
- `src/scenes/RadioScene.ts` (NEW) — две вьюхи через локальный `mode` (`list` / `detail`). Список фильтруется через `activeSignals`. Detail: body + 2 кнопки из `sig.options`, обе зовут `dismissSignal` и возвращают в список. Пустой список → «Эфир пуст». Никаких rewards.
- `src/scenes/BaseScene.ts` — кнопка «Радио» снизу под «Инвентарь».
- `src/main.ts` — `RadioScene` зарегистрирована последней в массиве scene (никаких preload, входит только вручную).

### Types & state

- `src/types/mob.ts` — `MobType` += `"mech"`; `Mob.behavior_id?: string`.
- `src/types/zone.ts` — `Zone.return_time_multiplier?: number`.
- `src/types/radio.ts` (NEW) — `RadioSignal` строго по GDD §10.M3.1 (id / subject / from / body_ru / options[label_ru,outcome] / expires_after_sorties / dismissed).
- `src/state/types.ts` — `GameProgress` interface (`forest_depth_2_completed`, `any_warehouse_sortie_completed`); `ContentData.radioSignals: RadioSignal[]`; `GameStateShape.progress: GameProgress`.
- `src/state/GameState.ts` — геттер/сеттер `progress`; `reset()` восстанавливает default-progress; `data.radioSignals` инициализируется `[]`, заполняется из BootScene.
- `src/scenes/BootScene.ts` — count-mismatch теперь `soft-warn` (`console.warn`) вместо hard-fail, чтобы Engineer-runtime бутался без Content M3 PR; параллельная загрузка `content/radio.json` (через `Promise.all`).

### Тесты (vitest)

| Файл                                            | Кол-во | Покрытие                                                                 |
|------------------------------------------------|--------|--------------------------------------------------------------------------|
| `src/systems/__tests__/mobAI.test.ts` (NEW)    | 15     | createMobRuntimeState + M1 fallback (marauder/mutant) + все 5 behaviors + unknown id → soft fallback |
| `src/systems/__tests__/zoneUnlock.test.ts` (NEW) | 11   | eval(start/forest/warehouse/city/unknown) + describe + applySortieCompletion (forest d2 / warehouse / non-victory) |
| `src/systems/__tests__/radio.test.ts` (NEW)    | 9      | activeSignals filter / dismissSignal idempotency / tickRadioOnReturn auto-dismiss / empty edge |
| `src/systems/__tests__/weight.test.ts` (+4)    | 18     | + zoneMultiplier (default=1.0 / warehouse=1.2 / city=1.5 / maxWeight≤0 edge) |

Итог: **89 vitest passed**. M2 baseline (49) ни одного теста не сломалось.

## Runtime smoke (Chrome localhost:5173, `npm run dev`)

- BaseScene → кнопка «Радио» появилась, ведёт в RadioScene → «Эфир пуст.» + back. ✅
- MapScene → forest unlocked, кликабельно, ведёт в SortieScene. ✅
- SortieScene → depth 1 доступен (lvl 1), depth 2/3 закрыты по уровню (M2 behavior). ✅
- CombatScene → M1 mobs (Мародёр + Дикий пёс) без `behavior_id`: атакуют героя, log пишется, HP списывается. M1 fallback codepath работает. ✅
- «Отступить» → возврат в SortieScene с непотраченными боями (M2-эквивалентное поведение). ✅
- Скриншоты — в комментариях PR #26.

**Не протестировано вручную** (только в vitest, ждёт QA в continuation):
- warehouse / city зоны (Content M3 PR пока не смержен — в content.json только forest);
- 5 новых behavior_id mobs (Content M3 PR пока не смержен);
- M3 radio signals в эфире (Content M3 PR пока не смержен).

## Что НЕ сделано (вне scope Engineer M3)

- M4+ фичи: перки, левелап-боссы, модули — out of scope.
- M6 radio business-logic: rewards, ambush, trust — anti-scope, спека PR #21 явно говорит «UI-stub only в M3».
- Реальный Yandex.Games SDK, animations, sounds, сторонние UI libs — out of scope M3.
- Content (`content/*.json`) — не моя ответственность (Content Designer).
- Assets — не моя ответственность (Artist).
- `docs/*` — не моя ответственность (Game Designer).

## Блокеры

- Нет. Soft-warn в BootScene даёт runtime бутаться при M2-content (15/3/5/1) и при M3-content (29/8/15/3) — на момент написания content всё ещё в M2-форме, поэтому новые behaviors протестированы только в vitest.

## Следующий конкретный шаг

1. PM ревьюит PR [#26](https://github.com/alexbayov/oplot/pull/26).
2. После апрува PM мерджит в `m3-integration` (НЕ self-merge).
3. После мерджа Content M3 PR — QA проводит runtime smoke по `M3-QA-SPEC` (warehouse + city zones, 5 новых behaviors, radio signals).

## PR

- PR #26 `m3/world → m3-integration` — Ready for review.
