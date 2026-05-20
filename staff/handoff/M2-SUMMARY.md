# M2 — Играбельный MVP: Summary

**Веха:** M2
**Название:** Играбельный MVP
**Период:** 2026-05-19 → 2026-05-20
**Gate-close:** 2026-05-20, PR `m2-integration → main` (открывает PM, мерджит Alex/Заказчик)

---

## 1. Что было целью

Реализовать игровой MVP — играбельный 7-шаговый core-loop в браузере:

1. Открыть игру → BaseScene с кнопкой «Вылазка».
2. Выбрать зону «Лес» (единственная) → MapScene → SortieScene.
3. Встретить 1–3 мобов, провести пошаговый бой (нож + самодельный пистолет).
4. Победить → собрать лут (3–5 ресурсов), видеть вес в рюкзаке.
5. Вернуться на базу — длительность возврата зависит от веса.
6. Видеть инвентарь, складировать лут.
7. Скрафтить 1–2 предмета из собранных ресурсов.

Спека была готова с M1 (`docs/GDD.md` §1–§6 + `docs/balance.md`). M2 — это runtime реализация core-loop'а поверх M1 skeleton'а.

## 2. Что вошло в `m2-integration`

### Код Engineer (PR #15, 5 commits, +2124 LOC)

**Системы (Phaser-free, под unit-tests):**

- `src/systems/combat.ts` — `calcInitiative`, `applyAttack` (damage roll [0.85, 1.15], armor mitigation, vs_melee_bonus), 18 vitest тестов.
- `src/systems/weight.ts` — `computeWeight`, `computeReturnTime(curWeight, maxWeight)` — formula `BASE_RETURN_TIME_S * (1 + (cur/max) * WEIGHT_PENALTY_FACTOR)`. Edge case `maxWeight ≤ 0 → BASE_RETURN_TIME_S` против NaN. 11 vitest тестов (8 weight + 3 return-time).
- `src/systems/loot.ts` — `rollLoot` (drop_table роллы), `applyLootLoss` (50% потеря лута на retreat/death). 7 vitest тестов.
- `src/systems/craft.ts` — `canCraft`, `applyCraft` (списание ингредиентов + добавление результата в stash). 10 vitest тестов.

**Сцены (Phaser 3):**

- `src/scenes/BootScene.ts` — preload content JSON + ассетов через `src/utils/loader.ts`.
- `src/scenes/BaseScene.ts` — экран Оплота, кнопки «Вылазка»/«Инвентарь»/«Крафт». Hotkey `O` (DEV) — добавляет cloth × 10 в stash.
- `src/scenes/MapScene.ts` — выбор зоны (forest), глубина 1–3.
- `src/scenes/SortieScene.ts` — pre-combat экран, кнопка «Бой».
- `src/scenes/CombatScene.ts` — пошаговый бой по инициативе, выбор атаки (knife / makeshift_pistol при наличии ammo), `Retreat` возвращает в SortieScene (фикс b02d297).
- `src/scenes/LootScene.ts` — лут после боя, выбор «Взять всё» / «Возврат на базу». `endSortie()` теперь `scene.start("ReturnScene")` — merge logic перенесён.
- `src/scenes/ReturnScene.ts` — **NEW (QA-blocker fix).** Показывает «Вес X/30 кг», «Время возврата: Y с», progress-bar tween за `computeReturnTime() * 1000 ms`. `onComplete`: merge backpack → baseStash, heal HP до max, clear sortie, переход в BaseScene.
- `src/scenes/InventoryScene.ts` — список stash + backpack.
- `src/scenes/CraftScene.ts` — список рецептов (highlight доступных), кнопка «Скрафтить» (фикс layout b02d297).

**State + balance:**

- `src/state/balance.ts` — все константы из `docs/balance.md`: HP_MAX=100, HERO_MAX_WEIGHT_KG=30, BASE_RETURN_TIME_S=30, WEIGHT_PENALTY_FACTOR=1.0, COVER_BONUS=0.5, LOOT_LOSS=0.5, DAMAGE_ROLL_RANGE=[0.85, 1.15].
- `src/state/GameState.ts` — singleton state: player (hp, hp_max, max_weight_kg, backpack), baseStash (stack[]), data (items/mobs/recipes/zones), currentSortie. Pure-data, без Phaser. Хелперы `addToStack`, `removeFromStack`, `findStack`.
- `src/state/types.ts` — runtime типы (ItemStack, Player, Sortie). Не путать с `src/types/*` (GDD §6 data-schema types).

**Тесты:**

- 49 vitest unit-тестов, 4 файла: `combat.test.ts` (18), `weight.test.ts` (11), `loot.test.ts` (7), `craft.test.ts` (10), `weight-return.test.ts` интегрирован в weight.test.ts (3 теста на `computeReturnTime`).

**Build:**

- `npm run typecheck` clean, `npm run lint` clean, `npm run test` 49/49 passed, `npm run build` clean.
- Production bundle: 1504.30 kB JS / 347.65 kB gzip (под бюджет 2 MB Yandex Games).

### QA Acceptance (PR #17, 10 commits в qa/m2-acceptance)

**Two-pass review:**

1. **Первый прогон (CHANGES_REQUESTED):** Полный отчёт §1–§7 в `staff/status/QA.md`. Блокер: `return_time_s` formula из `docs/balance.md:190` не применялась. `BASE_RETURN_TIME_S`/`WEIGHT_PENALTY_FACTOR` в `balance.ts` были, но grep по `src/` дал 0 совпадений. `LootScene.endSortie()` напрямую `scene.start("BaseScene")` без ReturnScene. PM локально верифицировал → реальный спек-violation, не косметика → запустил 5-action Engineer continuation.

2. **Re-review (APPROVE):** Подтверждение после Engineer commits `872503d` + `1335977`:
   - §1 build/static — PASS (49 тестов).
   - §3 runtime smoke — PASS. Desktop Chrome `http://127.0.0.1:5173/`:
     - Сценарий A (пустой рюкзак): ReturnScene «Вес 0.0/30 кг», «Время возврата: 30с», progress-bar анимируется, переход в BaseScene с HP=100/100.
     - Сценарий B (нагруженный рюкзак ~3.6 кг loot+bandages): «Время возврата: 34с» (30 * (1 + 3.6/30) = 33.6 → toFixed(0) = 34). Формула применяется корректно.
   - §4 formula sanity — PASS. `computeReturnTime` точно соответствует `balance.md:190`.

Verdict comment на PR #15: https://github.com/alexbayov/oplot/pull/15#issuecomment-4496445519

### PM (PR #14 + #16 + pm/m2-finalize)

- PR #14 `pm/m2-kickoff → main` — kickoff materials, merged 2026-05-19 Alex'ом.
- PR #16 `pm/m2-status-sync-eng-pr15 → m2-integration` — исторический gate move на PARALLEL_PRODUCTION_IN_PROGRESS после открытия Engineer Draft PR #15. Merged 2026-05-20 PM.
- pm/m2-finalize → m2-integration — этот PR. Gate → M2_DONE, M2-SUMMARY (этот файл), CHANGELOG entry, обновление dashboard/LINKS/CONTEXT/PM.

## 3. Финальная сверка с GDD / balance / handoff

| Источник | Требование | Факт |
|---|---|---|
| GDD §1 Core Loop | BaseScene → MapScene → SortieScene → CombatScene → LootScene → ReturnScene → BaseScene | OK (все сцены реализованы, переходы работают) |
| GDD §1 + balance.md:190 | `return_time_s = BASE_RETURN_TIME_S * (1 + (cur_weight / max_weight) * WEIGHT_PENALTY_FACTOR)` | OK (`src/systems/weight.ts:23-35` + `ReturnScene.ts:24-25`) |
| GDD §2 Combat | Инициатива по `speed + roll`, damage roll [0.85, 1.15], armor mitigation, vs_melee_bonus | OK (`src/systems/combat.ts` + 18 тестов) |
| GDD §3 Inventory/Weight | `computeWeight(backpack, items)`, max_weight_kg=30, отображение в LootScene/ReturnScene | OK (`src/systems/weight.ts`) |
| GDD §4 Craft | Рецепт = список ингредиентов + результат. `canCraft` проверяет stash, `applyCraft` списывает и добавляет | OK (`src/systems/craft.ts` + 10 тестов) |
| GDD §5 Mobs | drop_table роллы, vs_melee бонус для брони | OK (`src/systems/loot.ts` + 7 тестов; armor logic в combat.ts) |
| balance.md §Формулы | LOOT_LOSS=0.5, COVER_BONUS=0.5, BASE_RETURN_TIME_S=30, WEIGHT_PENALTY_FACTOR=1.0 | OK (`src/state/balance.ts`) |
| MVP-Definition (PLAN §2) | 7-шаговый core-loop игрок может пройти в браузере | OK (QA runtime smoke PASS) |
| MVP-Definition | загрузка < 5 сек на 4G | OK (gzip bundle 348 КБ, baseline загрузки < 2с на 4G по browser DevTools) |
| MVP-Definition | Anti-scope: нет радио / перков / боссов / модулей / Yandex SDK | OK (QA §5 anti-scope grep — 0 совпадений) |

## 4. Что НЕ вошло в M2 (отложено)

- **M3 — Прогрессия и баланс**: дополнительные зоны, мобы, рецепты, перки, прокачка персонажа.
- **M4 — Контент 1**: реальный арт, мутанты-боссы, события.
- **M5 — Контент 2**: более глубокие зоны, артефакты.
- **M6 — Radio механика**: пассивный лор/баффы через радио.
- **M7 — Polish**: звук, анимации, частицы, UI polish.
- **M8 — Yandex SDK + публикация**: лидерборды, авторизация, монетизация.

См. `staff/PLAN.md` для полного плана вех.

## 5. Lessons learned (для M3+)

### Token-budget

Engineer-сессия с планом 13 пунктов сожгла лимит токенов на step 13 (runtime smoke). PM решил де-скопить runtime smoke к QA Acceptance (это и так часть их handoff'а §3). Однако позже QA нашла, что Engineer пропустил **ReturnScene + return_time_s формулу** (step 13 как такового не было выполнен, но и в steps 1–12 ReturnScene не было — Engineer не реализовал её, возможно из-за token-burnout перед runtime smoke).

**Решение для M3+:** не давать role-сессии план > 5-7 действий. Если задача больше — разбивать на несколько continuation-сессий с явным handoff через PR Recovery-block.

### Recovery-safe ранний Draft PR

PR #15 был открыт после steps 1–2 (steps 1–2 запушены, остальные 11 шагов — пусто). Это спасло работу после смерти Engineer-сессии: PM смог взять PR, обновить description, увидеть что fтcommтоally 12 шагов сделаны, и продолжить. **Это работает только если recovery-block в PR description обновляется после каждой подзадачи**.

### QA-blocker на спек-нарушения

QA нашла критичный спек-violation (отсутствие ReturnScene + return_time_s formula). PM **обязательно** должен локально верифицировать findings перед эскалацией Engineer continuation (чтобы не делать ложный фикс). В данном случае: grep по `src/`, чтение `balance.ts`, чтение `LootScene.endSortie` — всё подтвердило finding.

**Решение для M3+:** PM-promo для Engineer **явно** перечисляет сцены из GDD §1 диаграммы (не опираться на «я всё сделал»). QA-промо повторяет grep-чек для каждой spec-механики.

### PAT-hygiene

QA-сессия случайно залогировала PAT в tool-output (fallback-команда с trailing newline). PAT был ротирован Alex'ом. На M3+ role-promo явный запрет: PAT только в Authorization header, никогда в URL или echo/print.

### Git-proxy 403

Devin git-manager proxy не имеет write на alexbayov/oplot в PM/QA-сессиях. На M2 PM использовал temporary PAT (через `git push https://x-access-token:${PAT}@github.com/...` с PAT в Authorization-эквивалентном виде через URL). После QA-leak Alex сохранил org-scope secret `GITHUB_PAT_OPLOT` для постоянного использования.

На M3+ PM-сессия будет использовать org-scope secret без ручных запросов.

## 6. PR-реестр M2

| PR | Role | Base | Status |
|---|---|---|---|
| #14 | PM / M2 kickoff | `main ← pm/m2-kickoff` | Merged 2026-05-19 Alex'ом |
| #15 | Engineer | `m2-integration ← m2/gameplay` | Merged 2026-05-20 PM |
| #16 | PM / status sync | `m2-integration ← pm/m2-status-sync-eng-pr15` | Merged 2026-05-20 PM |
| #17 | QA Acceptance | `m2-integration ← qa/m2-acceptance` | Merged 2026-05-20 PM |
| (this) | PM / finalize | `m2-integration ← pm/m2-finalize` | Open — gate → M2_DONE |
| (gate-close) | PM | `main ← m2-integration` | Pending; мерджит Alex |
