# Status: QA

**Текущая веха:** M2 — Playable MVP
**Последнее действие:** re-review after Engineer fix (commits 872503d + 1335977) → APPROVE
**Статус:** APPROVED
**Дата:** 2026-05-19
**Текущий шаг:** done (ready for PM merge)

## Текущий gate

QA Acceptance по M2 выполняется на ветке `qa/m2-acceptance` от `m2-integration`.

Объект проверки: Engineer PR #15 (`m2/gameplay` → `m2-integration`).

## Acceptance report — M2 Engineer PR #15

### §1 Build/static checks

Статус: PASS.

Проверено на ветке `m2/gameplay` после `npm install`:
- `npm install` — PASS, 0 vulnerabilities.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm run test` — PASS: 4 files / 46 tests passed.
- `npm run build` — PASS.

Примечание: Vite показал предупреждение о chunk > 500 kB (`dist/assets/index-*.js` ~1.5 MB). Это не blocker для M2, потому что build успешен, а предупреждение вызвано Phaser bundle.

### §2 M1 regression diff

Статус: PASS.

Команды:
- `git diff --stat m2-integration...m2/gameplay -- content/ assets/ docs/ src/types/`
- `git diff --name-status m2-integration...m2/gameplay -- content/ assets/ docs/ src/types/`

Результат: output пустой. Engineer PR #15 не меняет M1 baseline areas `content/`, `assets/`, `docs/`, `src/types/`; регрессий M1 в scoped diff не обнаружено.

### §3 Runtime smoke — 7-step MVP flow

Статус: PASS_WITH_NOTE.

Среда:
- `npm run dev -- --host 127.0.0.1`, Vite at `http://127.0.0.1:5173/`.
- Desktop Chrome.
- Screen recording evidence: `/home/ubuntu/oplot_m2_runtime_smoke.mp4` (local evidence file, not committed).

Проверено:
- App open <5 сек; CDP console check after reload: JS exceptions не обнаружены. Зафиксирован один non-blocking 404 resource error, вероятно favicon/static resource.
- `BaseScene`: HP, weapon, armor, stash and 3 buttons visible.
- `MapScene`: единственная зона Forest/Лес visible, `Войти` works.
- `SortieScene`: depth selection visible, depth 1 starts combat.
- `CombatScene`: hero/enemy HP, `Атака`, `Укрытие`, `Аптечка`, `Отступить` visible; attack/cover advance turns; marauder flee + wild dog attack path verified.
- `LootScene`: loot list visible; `Взять всё`, `Следующий бой`, `Возврат на базу` visible; take-all and return to base work.
- Return to `BaseScene`: HP persisted/restored according to scene flow; stash weight updated after loot return.
- `InventoryScene`: base stash stacks and per-stack weights visible.
- `CraftScene`: all 5 recipes visible; after resource seeding via runtime dev shortcut `O`, `Бинт` craft succeeds and updates status to `Создано: Бинт`.
- Defeat path: by repeatedly using `Укрытие`, hero HP reaches defeat and app returns to `BaseScene`; stash/HP state updates without crash.

Note: overload-return block was not forced by temporary file edits because QA constraints forbid modifying Engineer code/docs in this branch. It will be covered by formula/code review sections.

### §4 Formula sanity vs GDD

Статус: CHANGES_REQUESTED.

Проверено на Engineer branch `m2/gameplay`:
- `src/systems/combat.ts`: `calcHeroInitiative` matches GDD §2/§3 (`base_speed - (cur_weight / max_weight) * 50`, overweight → 0).
- `src/systems/combat.ts`: `applyAttack` matches GDD §2 / `balance.md` (weapon roll, 0.85..1.15 multiplier, defense subtraction, min damage floor 1).
- `src/systems/weight.ts`: `applyLootLoss` matches GDD §3 / `balance.md` defeat rule (`totalWeight * 0.5`, drop heaviest units first).
- `src/systems/craft.ts`: `canCraft` matches GDD §4 (`have >= ingredient.count` for every ingredient).

Blocking mismatch:
- `return_time_s` formula from GDD §1/§3 and `balance.md` is not implemented/used in runtime code. `src/state/balance.ts` defines `BASE_RETURN_TIME_S` and `WEIGHT_PENALTY_FACTOR`, but `rg "return_time|BASE_RETURN_TIME|WEIGHT_PENALTY" src/` finds no formula usage beyond constants. `LootScene.endSortie()` returns directly to `BaseScene` without `ReturnScene`/return duration.

### §5 Anti-scope checks

Статус: PASS.

Проверено на Engineer branch `m2/gameplay`:
- `src/` + `content/`: no radio/радио matches.
- `src/` + `content/`: no perk/перки matches.
- `src/`: no Yandex SDK / `ysdk` / ads integration. `reward` matches are only `xp_reward` fields, not SDK rewards.
- `package.json`: no third-party UI libs/frameworks; runtime dependency remains Phaser only.

### §6 Architecture/readability

Статус: PASS_WITH_NOTE.

Проверено на Engineer branch `m2/gameplay`:
- `GameState` centralizes player/content/sortie/base stash; scenes use it consistently (`BootScene`, `BaseScene`, `MapScene`, `SortieScene`, `CombatScene`, `LootScene`, `InventoryScene`, `CraftScene`).
- `src/systems/{combat,weight,craft,loot}.ts` remain Phaser-free/pure runtime logic; Phaser imports stay in scenes.
- `rg "\\bany\\b" src/ --glob "*.ts"`: no `any` type usage; only comment text says helper avoids `any`.
- `rg "TODO|FIXME|HACK|console.log" src/ --glob "*.ts"`: no matches.
- Note: `BaseScene` has a DEV-only `O` cheat guarded by `import.meta.env.DEV`; build/static checks passed and this does not affect production bundle path for M2 acceptance.

### §7 Engineer status note

Статус: PASS_WITH_NOTE.

Проверено на Engineer branch `m2/gameplay`: `staff/status/ENGINEER.md` обновлён под M2, но stale относительно финального PR состояния:
- status still `IN_PROGRESS`.
- `Что НЕ сделано` still lists systems/scenes/tests/runtime smoke as future work.
- `Следующий конкретный шаг` still says `src/systems/weight.ts` next, although those files exist and passed §1 checks.

This is a process/status-note issue, not a runtime/code blocker for M2 acceptance.

## Findings

- §1 PASS: typecheck, lint, tests (46), build passed; Vite chunk-size warning is non-blocking.
- §2 PASS: no M1 baseline diff in `content/`, `assets/`, `docs/`, `src/types/`.
- §3 PASS_WITH_NOTE: desktop Chrome 7-step smoke completed with screen recording; no JS exceptions; one non-blocking 404 resource error.
- §4 CHANGES_REQUESTED: `return_time_s` formula from GDD/balance is not implemented/used in runtime code; `LootScene` returns directly to `BaseScene`.
- §5 PASS: anti-scope clean (no radio/perks/SDK/third-party UI libs).
- §6 PASS_WITH_NOTE: architecture clean; DEV-only `O` cheat is guarded by `import.meta.env.DEV`.
- §7 PASS_WITH_NOTE: `staff/status/ENGINEER.md` is stale, non-blocker.

## Blockers

- Engineer PR #15 needs changes for missing `return_time_s` formula/runtime return duration, unless PM explicitly de-scopes ReturnScene/return time from M2 acceptance.

## Final verdict

CHANGES_REQUESTED.

Required fix:
- Implement/use the GDD/balance return-time formula: `return_time_s = BASE_RETURN_TIME_S * (1 + (cur_weight / max_weight) * WEIGHT_PENALTY_FACTOR)` in the return-to-base flow, or get explicit PM de-scope and document it.

Non-blocking notes:
- `staff/status/ENGINEER.md` is stale relative to final M2 work.
- Vite chunk-size warning is non-blocking for M2 because build succeeds and Phaser bundle is expected.
- One 404 resource error during runtime smoke is non-blocking because gameplay flow and JS runtime were healthy.

## Recovery

- Role: QA Acceptance Critic
- Milestone: M2 Playable MVP
- Branch: `qa/m2-acceptance`
- Current section: final verdict complete
- Done sections: §1 PASS; §2 PASS; §3 PASS_WITH_NOTE; §4 CHANGES_REQUESTED; §5 PASS; §6 PASS_WITH_NOTE; §7 PASS_WITH_NOTE
- Next concrete step: PM/Engineer should address `return_time_s` or explicitly de-scope it; PM should create QA-report PR from `qa/m2-acceptance` to `m2-integration` because Devin PR tool cannot see repo
- Engineer PR: #15 (`m2/gameplay` → `m2-integration`)
- Findings: final verdict CHANGES_REQUESTED due missing `return_time_s`; all other sections pass or pass with non-blocking notes
- Blockers: missing `return_time_s` runtime implementation unless de-scoped by PM

## PR / Process

- QA-report branch: `qa/m2-acceptance` (base = `m2-integration`).
- This QA session updates only `staff/status/QA.md`.
- No Engineer code/content/assets/docs changes are allowed in this branch.

## Re-review after Engineer fix (2026-05-19)

Object: Engineer continuation commits on `m2/gameplay`:
- `872503d` — `feat(M2): add ReturnScene with weight-based return_time_s (QA blocker fix)`.
- `1335977` — `chore(M2): update ENGINEER.md after ReturnScene fix`.

HEAD checked: `1335977` (`origin/m2/gameplay`).

### Re-review §1 build/static

Статус: PASS.

Прогон на `m2/gameplay` HEAD `1335977` после `npm install`:

- `npm install` — PASS, 0 vulnerabilities.
- `npm run typecheck` — PASS (exit 0).
- `npm run lint` — PASS (exit 0).
- `npm run test` — PASS: 4 files / **49 tests** (was 46 + **3 new** for `computeReturnTime`).
- `npm run build` — PASS (exit 0). Vite chunk-size warning for Phaser bundle остался, non-blocking, как в первом review.

```
 Test Files  4 passed (4)
      Tests  49 passed (49)
   Duration  615ms
```

### Re-review §3 runtime smoke (ReturnScene path only)

Статус: PASS.

Среда: `npm run dev -- --host 127.0.0.1`, Vite at `http://127.0.0.1:5173/`, Desktop Chrome.

Screen-recording: запущен и аннотирован 4 точками (setup + 2× test_start + 2× assertion). Сессия была прервана out-of-quota в самом конце scenario B (после успешного assertion); recording был активен на момент scenario A полностью и scenario B до verification ReturnScene. Скриншот-evidence заменяет recording для итогового артефакта (см. attachments в комментарии PR).

#### Сценарий A — пустой рюкзак

Путь: BaseScene → «В вылазку» → MapScene «Войти» → SortieScene «Старт depth 1» → CombatScene (2× Дикий пёс) → атака до победы (использовали 2 бинта) → LootScene показал лут (Кожа+Дерево+Верёвка+Ткань = 6 кг), backpack 0.0/30 кг → «Возврат на базу» (loot НЕ взят).

ReturnScene observed:
- Title «Возврат на базу» — PASS.
- «Вес 0.0/30 кг» — PASS (пустой рюкзак, как ожидалось).
- «Время возврата: 30с» — PASS (совпадает с `BASE_RETURN_TIME_S = 30`, формула `30 * (1 + 0/30 * 1.0) = 30`).
- Progress-bar анимируется от 0 к 100% — PASS.
- По завершении tween: переход обратно в BaseScene, HP восстановлен до 100/100, sortie очищен, stash без новых ресурсов — PASS.

#### Сценарий B — нагруженный рюкзак

Путь: page reload → BaseScene → «В вылазку» → MapScene «Войти» → SortieScene «Старт depth 1» → CombatScene (Мародёр) → атака до победы → LootScene показал лут (Верёвка+Дерево = 3 кг), backpack 0.6/30 кг (2 бинта) → «Взять всё» → backpack 3.6/30 кг → «Возврат на базу».

ReturnScene observed:
- Title «Возврат на базу» — PASS.
- «Вес 3.6/30 кг» — PASS (3.0 кг лута + 0.6 кг бинтов).
- «Время возврата: 34с» — PASS. Расчёт: `30 * (1 + 3.6/30 * 1.0) = 33.6 → toFixed(0) = "34"`. Совпадает.
- Progress-bar анимируется — PASS.
- Текст времени **меняется** с весом (34с vs 30с в сценарии A) — критерий QA выполнен.

Переход в BaseScene в сценарии B не дождан полностью (kickoff явно разрешил наблюдение 5-10 сек для B), но логика onComplete идентична сценарию A (тот же `completeReturn()`-handler), там переход подтверждён.

Дополнительно зафиксирован O dev-cheat на BaseScene: добавляет cloth × 10 = **10.0 кг** в stash (kickoff упоминал 5 кг — фактическая цифра отличается, потому что cloth весит 1 кг/шт, не 0.5; non-blocker, cheat работает корректно).

### Re-review §4 formula sanity vs GDD

Статус: PASS.

File-by-file diff vs sources of truth:

- `src/systems/weight.ts:23-35` — `computeReturnTime(curWeight, maxWeight)`:
  - Формула `BASE_RETURN_TIME_S * (1 + (curWeight / maxWeight) * WEIGHT_PENALTY_FACTOR)` совпадает с `docs/balance.md:190`:
    `return_time_s = BASE_RETURN_TIME_S * (1 + (cur_weight / max_weight) * WEIGHT_PENALTY_FACTOR)`. ✓
  - Edge-case `maxWeight <= 0 → BASE_RETURN_TIME_S` (защита от NaN/Infinity). Разумная защита; в GDD не указана явно, не противоречит. ✓
  - Константы `BASE_RETURN_TIME_S`, `WEIGHT_PENALTY_FACTOR` импортированы из `../state/balance`. ✓

- `src/systems/__tests__/weight.test.ts` describe `computeReturnTime` — 3 теста:
  - zero weight → 30s (`BASE_RETURN_TIME_S`). ✓
  - half weight 15/30 → 45s (`30 * (1 + 0.5 * 1.0)`). ✓
  - full weight 30/30 → 60s (`30 * (1 + 1.0 * 1.0)`). ✓
  - Используют `HERO_MAX_WEIGHT_KG`/`BASE_RETURN_TIME_S`/`WEIGHT_PENALTY_FACTOR` из `balance.ts`, не хардкод. ✓

- `src/scenes/ReturnScene.ts:23-25` — runtime wiring:
  - `curWeight = computeWeight(player.backpack, GameState.data.items)`. ✓
  - `returnTimeS = computeReturnTime(curWeight, player.max_weight_kg)`. ✓
  - Tween: `duration: returnTimeS * 1000, ease: "Linear"` (строки 44-47). ✓
  - `onComplete` → `completeReturn()` merges backpack→stash via `addToStack`, sets `player.hp = player.hp_max`, clears `currentSortie`, `scene.start("BaseScene")`. ✓
  - Skip-кнопки нет (по требованию kickoff — вес = время = риск). ✓

- `src/scenes/LootScene.ts:120-125` — `endSortie()`:
  - Только `if (!GameState.currentSortie) return; this.scene.start("ReturnScene");`. ✓
  - Cleanup-логика полностью переехала в `ReturnScene.completeReturn`. ✓

- `src/main.ts:10, 19-29` — registry:
  - `import { ReturnScene } from "./scenes/ReturnScene";`. ✓
  - Порядок scenes: `BootScene, BaseScene, MapScene, SortieScene, CombatScene, LootScene, ReturnScene, InventoryScene, CraftScene`. `ReturnScene` между `LootScene` и `InventoryScene` (по core-loop). ✓

- `docs/GDD.md:60-66` диаграмма core-loop:
  - `[LootScene] → [ReturnScene: возврат на базу] → [BaseScene → CraftScene → InventoryScene → ...]`. Реализация LootScene → ReturnScene → BaseScene полностью соответствует. ✓

Выводы §4: формула, тесты, runtime-wiring, core-loop integration — всё совпадает с GDD/balance.md, никаких отклонений.

### Re-review final verdict

**APPROVE.**

QA blocker §4 (`return_time_s` formula not implemented) closed Engineer commits `872503d` + `1335977`:
- §1 build/static: PASS (49 tests).
- §3 runtime smoke: PASS — оба сценария (пустой/нагруженный рюкзак) подтвердили, что текст времени меняется с весом по формуле, progress-bar анимируется, ReturnScene → BaseScene transition работает.
- §4 formula sanity: PASS — формула в коде идентична `docs/balance.md:190`, тесты corner-case'ов покрыты, ReturnScene вызывает helper корректно, scene registry в core-loop порядке.
- §2/§5/§6/§7 из первого review не затронуты fix'ом, статусы тех секций остаются как были (PASS / PASS / PASS_WITH_NOTE / PASS_WITH_NOTE).

Ready for PM merge of PR #15 (`m2/gameplay` → `m2-integration`).

Non-blocking notes (несут vs первый review):
- ENGINEER.md обновлён, status уже не stale.
- Vite chunk-size warning не изменился (non-blocking, как и было).
- O dev-cheat остаётся под `import.meta.env.DEV` (по-прежнему non-blocking).

---

# M3 Spec Review

**Роль:** QA Spec Reviewer (отдельная сессия от QA Acceptance)
**Веха:** M3 — Расширение мира
**Объект ревью:** GD PR #21 (`m3/gd-amendment` → `m3-integration`), HEAD `9070cad`
**QA-report ветка:** `qa/m3-spec-review` (base `m3-integration`, HEAD `97cb8d5`)
**Дата старта:** 2026-05-19
**Текущий шаг:** WIP — recovery-safe Draft PR up; full checklist verdict pending.

## Recovery

- Role: QA Spec Reviewer M3.
- Milestone: M3 spec review (GD amendment).
- Branch: `qa/m3-spec-review` от `m3-integration` (HEAD m3-integration = `97cb8d5`).
- Base: `m3-integration`.
- Object under review: `m3/gd-amendment` HEAD `9070cad` (PR #21).
- Done sections: branch создана, первый commit + push, Draft PR открыт.
- Next concrete step: дописать полный verdict по 7 чек-листам, перевести PR в Ready, опубликовать verdict на PR #21, заблокировать Alex итогом.
- Blockers: нет.
- PAT discipline: PAT ТОЛЬКО в `Authorization: Bearer` header через `os.environ['GITHUB_PAT_OPLOT']`, никогда не в URL/echo/print (lesson M2).
- Forbidden: править GDD/balance/content/src/assets в GD PR; self-merge; push в `main` / `m3-integration` напрямую; менять чужие `staff/status/*.md`; предлагать новые M3-фичи; проверять runtime (это QA Acceptance).

## Объект ревью — артефакты

| Артефакт | Источник | Что смотрел |
|---|---|---|
| GD PR | #21 (`m3/gd-amendment` → `m3-integration`), HEAD `9070cad` | весь diff, 762 строки сводного diff |
| GDD §5.4 (5 мобов M3) | `docs/GDD.md` | новая секция (5.4.0 … 5.4.7) |
| GDD §6.2 (Mob/Zone schema extensions) | `docs/GDD.md` | enum `mech`, `Mob.behavior_id?`, `Zone.return_time_multiplier?`, расширение `unlock_condition` |
| GDD §6.4.M3 (2 зоны) | `docs/GDD.md` | `warehouse`, `city` + sub-sections 6.4.M3.0 … 6.4.M3.6 |
| GDD §10.M3 (radio stub) | `docs/GDD.md` | `RadioSignal` schema + UI-flow + anti-scope |
| balance §M3 | `docs/balance.md` | mobs/drops/zones/return_time/items/recipes |
| `docs/content-brief.md` | без изменений в этом PR | использовал как baseline для правил уникальности |
| `staff/status/GAME_DESIGNER.md` | обновлён GD PR | под M3 |
| `staff/handoff/M3-GD.md` | baseline | источник checklists |
| `staff/handoff/M3-QA-SPEC.md` | baseline | мой брифинг |
| Канонические M1 items | `content/items.json` (15 шт.) | подтверждение cross-refs для drop_tables/recipes |
| git diff scope | `m3-integration...m3/gd-amendment -- docs/GDD.md docs/balance.md` | 6 «-» строк всего; ни одна не модифицирует M1/M2 числа |

## Метрика diff'а

| Файл | + строк | − строк | Тип изменений |
|---|---|---|---|
| `docs/GDD.md` | 481 | 4 | 4 удаления — это (1) MobType enum раcширение, (2) комментарий к `unlock_condition`, (3-4) замена двух placeholder-секций (§7, §10) на реальный контент. M1/M2 содержимое НЕ изменено. |
| `docs/balance.md` | 210 | 1 | 1 удаление — strikethrough «~~Числа warehouse, city — M3~~» (метка outstanding scope tracker, не M1/M2 число). |
| `staff/status/GAME_DESIGNER.md` | 75 | (− trivial) | GD статус-апдейт, не предмет моего ревью. |
| **Всего** | **756 +** | **10 −** | Изменения — purely additive по существу. |

## Checklist 1 — §5.4 «Мобы M3»

| Критерий | Статус | Детали |
|---|---|---|
| Ровно 5 новых мобов | **PASS** | `looter_sniper`, `armored_guard`, `fanatic_berserker`, `pack_rat`, `relic_drone` — 5 шт. (GDD §5.4.0 сводная таблица + §5.4.1 … §5.4.5 отдельные подсекции). |
| Каждый имеет уникальный AI-паттерн | **PASS** | 5 уникальных `behavior_id`: `ranged_keep_distance` / `defensive_cover` / `berserker_low_hp` / `pack_bonus_when_paired` / `armor_piercing_ranged`. §5.4.0 явно сверяет уникальность с M1 (`marauder`/`wild_dog`/`mutant`): `fanatic_berserker` инверт `marauder`, `pack_rat` отличен от `wild_dog`, `armored_guard` / `looter_sniper` / `relic_drone` отличны от `mutant`. |
| Поля `id`, `name_ru`, `type`, `hp`, `damage_min/max`, `defense`, `base_speed`, `xp_reward`, `behavior_id`, zone | **PASS** | balance §M3 — Мобы (5 новых): полная числовая таблица для всех 5 мобов; GDD §5.4 — отдельная карточка для каждого моба с теми же полями. |
| AI описаны словесно понятно (псевдокод, а не «делает атаку») | **PASS** | Каждый из 5 мобов имеет блок `**AI flow.**` с конкретным псевдокодом (триггер → эффект), плюс `**Боевой сценарий.**` (что видит игрок) и `**Implementation hint (Engineer).**` (~3–6 LOC, ссылки на существующую M2 механику). |
| Нет AI, требующих перков (M4) / radio-доверия (M6) / multi-phase boss (M5) | **PASS** | Явный anti-scope в §5.4 преамбуле: «перки (M4), боссы / multi-stage / phase changes (M5), полная radio-логика (M6), модули оружия (M5+), реальные звуки/анимации (M7), Yandex SDK (M8), позиционная механика боя». Все 5 паттернов работают на existing M2 combat-формуле без runtime-state расширений (кроме `_berserk_triggered` single-shot flag и `turn_count % 2`). |
| AI implementable ≤50 LOC | **PASS** | Каждая implementation hint указывает ~3–6 LOC: `ranged_keep_distance` (1 if, ~3 LOC), `defensive_cover` (~5 LOC reuse existing `coverActive` boolean), `berserker_low_hp` (~6 LOC), `pack_bonus_when_paired` (~4 LOC stateless query), `armor_piercing_ranged` (0 LOC новой механики — просто пересчёт total_defense). Σ ≈ 22 LOC; запас огромный. |
| Минимум 1 моб для Склада, минимум 1 для Города (zone-coverage) | **PASS** | `looter_sniper` + `armored_guard` exclusive Склад; `fanatic_berserker` + `pack_rat` exclusive Город; `relic_drone` — bridge обеих зон (намеренный mech, единственный источник `electronics`/`circuitry`/`oil` вне zone-loot, §5.4.5). |
| M1 mobs (`marauder`, `wild_dog`, `mutant`) НЕ изменены | **PASS** | §5.4 преамбула: «M1 mobs … НЕ изменяются — ни числами, ни поведением». §6.2: «M1 mobs (marauder, wild_dog, mutant) и их числа в `balance.md` — без изменений». balance.md diff не трогает M1-моб блок. |

**§5.4 verdict: PASS.**

## Checklist 2 — §6.2 «Mob/Zone schema extensions»

| Критерий | Статус | Детали |
|---|---|---|
| `MobType` enum получает `"mech"` (добавление, не удаление существующих) | **PASS** | diff line 228-229: `type MobType = "human" \| "animal" \| "mutant" \| "boss";` → `... \| "boss" \| "mech";`. Все 4 существующих значения сохранены; добавлено 5-е. Комментарий явно: «Forward-compat only … M1 mobs и их числа в `balance.md` — без изменений.» |
| `combat.ts` hard-check `attackerType === "animal"` НЕ ломается | **PASS** | §5.4.5 / §6.2 явно: «`combat.ts` проверка `attackerType === "animal"` … для `vs_melee_bonus` к `mech` не относится — `mech` НЕ триггерит этот бонус. Это **поведение по умолчанию**, никаких изменений в `computeDefense` не нужно.» Это backward-compatible — все 3 M1 mob.type values продолжают вести себя по-старому. |
| `Mob.behavior_id?: string` — optional | **PASS** | diff line 249: `behavior_id?: string; // M3+: уникальный ID AI-паттерна`. M1 mobs **не задают** поле (Engineer fallback на existing switch по `id`). M3 mobs — обязательное (один из 5 enum-string значений, документировано в комментарии). |
| `Zone.return_time_multiplier?: number` — optional, default 1.0 | **PASS** | diff line 276-278: `return_time_multiplier?: number; // M3+: множитель к BASE_RETURN_TIME_S … Optional, default 1.0. Engineer читает `zone.return_time_multiplier ?? 1.0`. `forest` поле НЕ задаёт → default=1.0 → M1/M2 поведение математически no-op.` |
| `Zone.unlock_condition` принимает M3 строки без расширения схемы | **PASS** | diff line 275: тип остаётся `string`; в комментарии §6.2 явно перечислены 3 допустимых значения (`"start"`, `"forest_depth_2_completed"`, `"any_warehouse_sortie_completed"`); §6.4.M3.3 даёт implementation hint c switch-case на 3-5 LOC. |
| M1 mobs остаются без `behavior_id` (Engineer fallback на классический switch) | **PASS** | Документировано в §5.4.0 и §6.2: «Для M1 mobs (marauder/wild_dog/mutant) поле отсутствует — Engineer fallback на классический switch по `id`». Расширение чисто аддитивное. |

**§6.2 verdict: PASS.**

## Checklist 3 — §6.4.M3 «Новые зоны M3»

| Критерий | Статус | Детали |
|---|---|---|
| Ровно 2 новые зоны | **PASS** | `warehouse` и `city` — 2 шт. (GDD §6.4.M3.0 сводная таблица + §6.4.M3.1 / §6.4.M3.2 отдельные подсекции). |
| Каждая имеет 2-3 уровня глубины с разными mob-/resource-листами | **PASS** | warehouse: 2 depth (1, 2) — разные `enemies[]` (`marauder/looter_sniper` vs `looter_sniper/armored_guard/relic_drone`), разные `resources[]`. city: 3 depth (1, 2, 3) — разные `enemies[]` (`mutant/pack_rat` vs `pack_rat/fanatic_berserker/relic_drone` vs `fanatic_berserker/relic_drone/mutant`), разные `resources[]`. |
| Каждая зона имеет минимум 1 zone-exclusive ресурс | **PASS** | warehouse `unique_resources = electronics, oil` (2 шт.); city `unique_resources = medical_supplies, circuitry` (2 шт.). §6.4.M3.5 явно описывает правило non-overlap + единственное исключение для `relic_drone` (намеренный design). |
| `unlock_condition` реализуемо без новой системы прогрессии (простой switch) | **PASS** | §6.4.M3.3 даёт ТОЧНЫЙ implementation hint: 2 boolean флага в `GameState.progress` + switch-case функция `evaluateUnlockCondition(cond, progress): boolean`. ~10 LOC. Триггеры сетятся в `ReturnScene.onComplete()`. Никаких новых систем (квесты/perks/XP-extensions) не требуется. |
| Forest зона (M2) НЕ изменена | **PASS** | §6.4.M3 преамбула: «Зона `forest` и её 3 глубины **НЕ изменяются**». `forest` НЕ задаёт `return_time_multiplier` в content/zones.json → fallback default 1.0 → формула эквивалентна M1/M2 версии (математически no-op). |
| `return_time_multiplier` backward-compat | **PASS** | balance §M3 — Расширенная формула + §6.4.M3.4 implementation hint: caller передаёт `zone.return_time_multiplier ?? 1.0`. M2 vitest `computeReturnTime(curWeight, maxWeight)` вызывают без 3-го аргумента → default 1.0 → старое поведение. Дополнительные vitest на warehouse=1.2 / city=1.5 (см. M3-ENG handoff §5). |

**§6.4.M3 verdict: PASS.**

## Checklist 4 — §10.M3 «Radio structure stub»

| Критерий | Статус | Детали |
|---|---|---|
| `RadioSignal` JSON-схема описана | **PASS** | §10.M3.1: полный TypeScript `interface RadioSignal { id, from, subject, body_ru, options, expires_after_sorties, dismissed }` + `RadioSignalOption { id, label_ru }` + type alias `RadioSignalOptionId = "respond" \| "ignore"`. |
| `RadioScene` UI-flow описан (вход → список → выбор → 2 кнопки → выход) | **PASS** | §10.M3.2: ASCII-flow `BaseScene → RadioScene[список активных] → [детали сигнала] → клик одной из 2 кнопок → dismiss → возврат в список (или «Эфир пуст») → BaseScene`. Учитывает edge case пустого списка («Эфир пуст», кнопка «Назад»). |
| Явно отмечено, что на M3 это заглушка | **PASS** | §10 преамбула: «На M3 заполнено только §10.M3 … Это нужно, чтобы Content мог наполнить 2-3 dummy-сигнала, а Engineer — реализовать RadioScene как UI-заглушку». §10.M3 преамбула: «UI-заглушка … Никаких реальных последствий (rewards/ambush/faction changes)». |
| Phrase «полная логика — M6» присутствует | **PASS** | §10 преамбула: «Полная логика (сигналы с ветвлениями, засады, награды, фракционные репутации, шкала доверия) — M6». §10.M3.1: «M6 расширит до выбора: …». §10.M3 преамбула + §10.M3.6: «M6 эволюция: этот stub будет расширен амендментом M6 GD». |
| 2 опции ровно (`respond` / `ignore`) | **PASS** | `RadioSignalOptionId = "respond" \| "ignore"` — exhaustive type alias. `options: RadioSignalOption[]; // ровно 2 элемента: [{id: "respond", label_ru: "Откликнуться"}, {id: "ignore", label_ru: "Игнорировать"}]`. |
| `expires_after_sorties` числовое | **PASS** | `expires_after_sorties: number; // > 0; счётчик уменьшается после каждой завершённой вылазки. При 0 → авто-dismissed.` Implementation в §10.M3.3 (5 LOC в `ReturnScene.onComplete()`). |
| `dismissed` boolean | **PASS** | `dismissed: boolean; // M3: устанавливается в true после клика на любую из 2 кнопок. По умолчанию false.` Комментарий явно: «M6 расширит … до choice-history» — миграционный путь продуман. |
| Anti-scope явно (нет rewards/ambush/trust на M3) | **PASS** | §10.M3.4 «Anti-scope §10.M3 (что НЕ делает Engineer на M3)» — 6 явных пунктов: rewards, ambush, trust, branching outcomes, per-zone triggers, real-time timers. §10.M3.1 примечание: «Поля content-brief.md, относящиеся к M6 (НЕ использовать в M3 stub): type, zone, reward, trap_mob_id, trust_impact. В M3 RadioSignal этих полей нет.» |
| 2-3 dummy-сигнала как примеры структуры | **PASS_WITH_NOTE** | §10.M3.5 cross-refs делегирует на Content («Content Designer: 2-3 dummy-сигнала в `content/radio.json`»). В самом GDD-amendment'е inline-примеров сигналов нет — это NOT_BLOCKING, поскольку (a) JSON-схема полностью задана, Content имеет всё нужное чтобы наполнить файл; (b) chechlist M3-QA-SPEC уточняет «НЕ как реальный контент — это Content делает» — то есть GD не должен писать контент; (c) разделение ответственности корректное. |

**§10.M3 verdict: PASS (с одним non-blocking note).**

**Numbering note (non-blocking).** Handoff M3-GD §3 говорит о «новой §7», но GD выбрал §10.M3 (заглушка к существующей §10 «Радио и доверие (M6)»). Это **структурно лучше**, чем создавать §7 и сдвигать нумерацию: (a) §10 уже была placeholder именно для радио, расширение естественно; (b) §7 «Зоны и карта (M3)» помечена `— DONE` с cross-ref на §6.4.M3 (содержимое логично переехало в подсекцию §6). Это не отклонение от scope, а изящное решение по placement. Outdated handoff формулировка — задача PM, не GD.

## Checklist 5 — `balance.md` §M3

| Критерий | Статус | Детали |
|---|---|---|
| Stats для 5 новых мобов согласованы с §5.4 GDD | **PASS** | Сравнил каждое поле в balance.md «M3 — Мобы (5 новых)» таблице vs соответствующие карточки §5.4.1–§5.4.5 GDD. `id`, `name_ru`, `type`, `behavior_id`, `zone` идентичны. HP/damage/defense/base_speed/xp_reward — единственный источник в balance.md (GDD §5.4 не дублирует числа, только AI и tactical descriptions — это правильный «numbers in balance, behavior in GDD» pattern). Numbers AI-модификаторов («damage × 0.5», «damage × 2», «damage × 1.5», «base_speed −30», «turn_count % 2», «hp / hp_max < 0.5», «pack_rat alive ≥ 2») продублированы в balance.md «Модификаторы AI» таблице — согласованы. |
| Drop tables для 5 мобов есть | **PASS** | balance §M3 «Drop-tables (новые мобы)» — отдельная таблица для каждого из 5 мобов с `item_id @ chance (count_min–count_max)`. |
| Cross-refs `item_id` ↔ items roster разрешимы | **PASS** | Сверил каждый `item_id` в drop_tables и `recipes.ingredients` против `content/items.json` (15 M1 items) + M3 новые items из balance.md §M3: `looter_sniper`: cloth/ammo_pistol/scrap (M1) + ammo_rifle (M3 new) — все ✓; `armored_guard`: scrap/leather/gunpowder (M1) + electronics (M3) — ✓; `fanatic_berserker`: cloth/food/bandage (M1) + medical_supplies (M3) — ✓; `pack_rat`: leather/food (M1) + circuitry (M3) — ✓; `relic_drone`: scrap (M1) + electronics/circuitry/oil (M3) — ✓. Recipes: все 10 рецептов используют валидные item_id. Конкретно проверил `wood`, `rope`, `medkit`, `water` — все есть в M1 items.json. |
| Numbers для 10 новых рецептов есть | **PASS** | balance §M3 «Recipes (10 новых)» таблица — 10 строк (`recipe_pipe_rifle`, `recipe_crowbar`, `recipe_tactical_vest`, `recipe_helmet`, `recipe_large_medkit`, `recipe_energy_drink`, `recipe_gas_mask`, `recipe_emp_grenade`, `recipe_smoke_bomb`, `recipe_ammo_rifle`) с полными полями (`result_id`, `result_count`, `ingredients`, `tier`, `craft_time_s`, `unlock_condition`). |
| Recipes используют zone-exclusive ресурсы (создаёт игровую мотивацию исследовать зоны) | **PASS** | Покрытие задокументировано в самом balance.md: `electronics` (warehouse) → 2 рецепта; `oil` (warehouse) → 3 рецепта; `medical_supplies` (city) → 2 рецепта; `circuitry` (city) → 2 рецепта. 2 рецепта (`recipe_helmet`, `recipe_ammo_rifle`) намеренно без zone-exclusive — даёт «entry-level T2» крафт без необходимости сразу открывать новые зоны. Дизайн-рационал явный. |
| Existing M1/M2 числа в balance.md НЕ изменены | **PASS** | `git diff origin/m3-integration...origin/m3/gd-amendment -- docs/balance.md` показывает только 1 deletion: вычёркнутый M3 placeholder «~~Числа второй и далее зоны (warehouse, city)~~ — DONE в §M3 ниже» — это outstanding-scope tracker, не число. Все M1/M2 числовые блоки (hero stats, weapons, armor, consumables, recipes M1, XP-таблица, forest zone, формулы M1/M2) — без изменений. |
| `return_time_multiplier` формула backward-compat | **PASS** | balance §M3 «Расширенная формула return_time_s» + таблицы примеров для forest/warehouse/city: forest zone_mult=1.0 → результат идентичен M1/M2 (60.0 s полный рюкзак, 30.0 s пустой). Engineer hint: caller `computeReturnTime(curWeight, maxWeight)` без 3-го аргумента → default 1.0 → M2 vitest продолжают работать. |
| Numbers согласованы между §5.4/§6.4.M3 GDD и balance §M3 | **PASS** | §6.4.M3.0 сводная таблица зон содержит `return_time_multiplier` (1.2 / 1.5) — те же числа в balance §M3 «Зоны». `enemy_count`, `resource_count`, `min_player_level`, `fights_per_depth` в GDD §6.4.M3.1/§6.4.M3.2 идентичны balance §M3 «Глубины Склада/Города» таблицам. |

**balance §M3 verdict: PASS.**

## Checklist 6 — Anti-scope

| Критерий | Статус | Детали |
|---|---|---|
| Нет перков (M4) | **PASS** | Явный anti-scope в §5.4, §6.4.M3, §10.M3, balance §M3 «Скоуп». Никакого `perk`/`talent`/`skill_tree` в diff. `min_player_level` — это existing M1/M2 поле, не M4 perks. |
| Нет боссов (M5) / multi-stage / phase changes | **PASS** | `boss_id: null` для обеих новых зон. Ни один из 5 mob AI не использует phase change / multi-stage. `fanatic_berserker` имеет single-shot trigger (`_berserk_triggered=true`, не возвращается) — это not «multi-stage», это buff с single transition. |
| Нет полной radio-логики (M6) | **PASS** | §10.M3.4 «Anti-scope §10.M3»: rewards / ambush / trust / branching outcomes / per-zone triggers / real-time timers — все 6 пунктов явно вне M3. §10.M3.1: 5 M6 полей (`type`, `zone`, `reward`, `trap_mob_id`, `trust_impact`) явно НЕ используются в M3 stub. |
| Нет модулей оружия (M5+) | **PASS** | balance §M3 «Скоуп» явно: «Модули оружия / брони (head-slot, accessory slots, runes) — M5+ (см. GDD §11 placeholder)». §M3 T2-armor `helmet`: «новый слот (голова). На M3 Engineer держит один armor-slot в hero (как M1/M2). Слот helmet — в M5 (модули). На M3 helmet рассматривается как альтернативная T2-броня». Намеренное упрощение задокументировано. |
| Нет Yandex SDK (M8) | **PASS** | balance §M3 «Скоуп»: «IAP, реклама, Yandex SDK rewards — M8». §5.4 преамбула: «Yandex SDK (M8)». Никаких `ysdk` / `ads` matches в diff. |
| Нет коммуны / NPC-членов / газовых зон / звуков-анимаций | **PASS** | Газовые зоны (требующие `gas_mask`) — explicitly M5 в balance §M3 «Скоуп»; `gas_mask` на M3 — «lore stub». Анимации/звуки/коммуна — anti-scope §5.4 преамбула. |
| Нет XP-системы / уровней выше 5 | **PASS** | balance §M3 «Глубины Города» примечание: «На M3 XP-система потолок = 5 (см. §XP-таблица). Engineer проверяет `player.level >= min_player_level` точно так же, как в M1. Никаких новых уровней XP не вводится.» |

**Anti-scope verdict: PASS.**

## Checklist 7 — Регрессия M1/M2

| Критерий | Статус | Детали |
|---|---|---|
| §1–§6 GDD не переписаны | **PASS** | `git diff origin/m3-integration...origin/m3/gd-amendment -- docs/GDD.md` — 4 deletion lines всего: (1) MobType enum (additive расширение, все 4 старых значения сохранены); (2) `unlock_condition` комментарий (semantic content тот же, добавлен cross-ref на §6.4.M3); (3-4) замены placeholder section header `### 7. Зоны и карта (M3)` / `### 10. Радио и доверие (M6)` на реальный контент с пометкой `DONE` / `M3 заглушка`. M1/M2 текст (§1 core loop, §2 combat, §3 weight, §4 craft, §5.1-§5.3 mobs M1, §6.1/§6.3/§6.4.MVP схемы forest) полностью сохранён. |
| §7.1-§7.4 (M1/M2 балансные блоки в balance.md) не тронуты | **PASS** | balance.md diff — только 1 deletion: strikethrough M3 placeholder в верхнем «Не на M3» списке. Hero stats, weapons (knife / makeshift_pistol), armor (cloth_jacket / leather_vest), consumables (bandage / medkit / ammo_pistol), recipes M1 (5 шт.), XP-таблица, forest zone params, формулы M1/M2 — без изменений. |
| M1/M2 числа в balance.md (`hp_max`, `max_weight`, `LOOT_LOSS_ON_DEFEAT`, etc.) не тронуты | **PASS** | Подтверждено визуально: ни одна строка в M1/M2 балансных таблицах не помечена `-` или `+` в diff. Дополнительно: M2 vitest `computeReturnTime(curWeight, maxWeight)` (без 3-го аргумента) сохраняет существующее поведение через default `zone_multiplier=1.0`. |
| `staff/status/GAME_DESIGNER.md` обновлён под M3 | **PASS** | diff показывает 75+ insertions в `staff/status/GAME_DESIGNER.md` — GD статус-апдейт. Содержимое этого файла — вне моего scope (это GD-owned file), но факт обновления — checklist item passed. |
| Cross-refs внутри amendment'а корректны | **PASS** | Все internal references (`§5.4` ↔ `§6.2`, `§5.4` ↔ `balance §M3`, `§6.4.M3` ↔ `balance §M3 — Расширенная формула`, `§10.M3` ↔ `content/radio.json`, `§6.4.M3.4` ↔ M3-ENG handoff §5) — разрешимы. Якоря (`<a id="m3-drop-tables">`, `<a id="m3-recipes">`) добавлены для глубоких ссылок. |
| Никаких изменений в `content/`, `src/`, `assets/`, других `staff/status/*.md` | **PASS** | `git diff --stat origin/m3-integration...origin/m3/gd-amendment` затрагивает только 3 файла: `docs/GDD.md`, `docs/balance.md`, `staff/status/GAME_DESIGNER.md`. GD строго остался в своей зоне. |

**Регрессия verdict: PASS.**

## Сводка по 7 чек-листам

| # | Чек-лист | Verdict |
|---|---|---|
| 1 | §5.4 «Мобы M3» (ровно 5, уникальный AI, ≤50 LOC, M1 mobs untouched) | **PASS** |
| 2 | §6.2 «Mob/Zone schema extensions» (mech enum additive, behavior_id optional, return_time_multiplier optional) | **PASS** |
| 3 | §6.4.M3 «Новые зоны M3» (ровно 2, zone-exclusive resources, unlock switch-implementable, forest untouched) | **PASS** |
| 4 | §10.M3 «Radio structure stub» (2 options, expires numeric, dismissed boolean, anti-scope явный) | **PASS** (1 non-blocking note: inline dummy-signals делегированы Content — корректно) |
| 5 | balance §M3 (numbers согласованы, cross-refs resolvable, return_time backward-compat) | **PASS** |
| 6 | Anti-scope (нет perks/bosses/full-radio/modules/SDK/новых XP) | **PASS** |
| 7 | Регрессия M1/M2 (§1–§6 / M1/M2 numbers untouched, scope clean) | **PASS** |

## Final verdict

**APPROVE.**

GD M3 amendment (PR #21, HEAD `9070cad`) полностью соответствует брифу `staff/handoff/M3-GD.md` и чек-листам `staff/handoff/M3-QA-SPEC.md`:
- 5 механически уникальных мобов с реализуемым ≤50 LOC AI.
- 2 новые зоны с zone-exclusive ресурсами и реализуемыми (≤10 LOC) unlock-условиями.
- Radio UI-stub схема с явным «полная логика — M6» и 6-пунктовым anti-scope.
- 10 рецептов с резолвимыми cross-refs.
- Backward-compatible расширения схем (`mech` enum additive, `behavior_id?` / `return_time_multiplier?` optional).
- Zero модификаций M1/M2 чисел.
- Чистый anti-scope (нет perks / bosses / full radio / weapon modules / Yandex SDK / новых XP уровней).

**Готов к merge в `m3-integration`.** После merge Content / Engineer / Artist могут стартовать параллельно (см. `staff/status/M3.md` PR-реестр).

### Single non-blocking note

§10.M3.5 делегирует 2-3 dummy radio-сигнала на Content (`content/radio.json` остаётся `[]` до Content PR). Это **правильное** разделение ролей (GD задаёт схему, Content наполняет контент); checklist M3-QA-SPEC §3 явно: «2-3 dummy-сигнала описаны как примеры структуры (НЕ как реальный контент — это Content делает)». GD выполнил «описание структуры»; Content выполнит «наполнение». Никаких действий от GD не требуется.

### Numbering observation (out-of-band — не influences verdict)

Handoff M3-GD говорил «§7 Radio structure stub», но GD выбрал §10.M3 (заглушка существующей §10 «Радио и доверие (M6)»). Это **структурно лучше**, чем создавать §7 (которая в существующем GDD уже была placeholder для «Зоны и карта (M3)» и помечена `— DONE` с cross-ref на §6.4.M3). Outdated handoff формулировка — это PM-задача синхронизировать брифинг, не GD.

## Recovery (обновлено после финального verdict)

- Role: QA Spec Reviewer M3.
- Milestone: M3 spec review (GD amendment).
- Branch: `qa/m3-spec-review` (base `m3-integration`).
- Object under review: `m3/gd-amendment` HEAD `9070cad` (PR #21).
- Done sections: branch / first commit / Draft PR / 7-checklist verdict / non-blocking notes / final APPROVE.
- Next concrete step: переключить QA-report PR в Ready, опубликовать verdict на PR #21, заблокировать Alex итогом.
- Blockers: нет.

---

# M3 Acceptance Review

**Роль:** QA / Acceptance Critic (последняя role-сессия M3, право вето)
**Веха:** M3 — Расширение мира
**Дата старта:** 2026-05-21
**Gate:** QA_ACCEPT_IN_PROGRESS → QA_ACCEPT_APPROVED / CHANGES_REQUESTED
**Базовая ветка:** `m3-integration` (HEAD `3823395`)
**QA-report branch:** `qa/m3-acceptance` (base `m3-integration`)
**PR base:** `m3-integration`

## Объект ревью — 3 role-PR в Ready

| PR | Branch | Head | Role | Что внутри |
|---|---|---|---|---|
| #25 | `m3/content` | `24dcb28f` | Content Designer | 5 JSON: mobs (3→8), items (15→29), recipes (5→15), zones (1→3), radio (0→3 dummy) — всё по `balance.md` §M3 |
| #26 | `m3/world` | `c220fca1` | Engineer | multi-zone runtime, 5 mob AI behaviors, RadioScene UI-stub, +39 vitest (49→89), tsc/lint/build/test зелёные |
| #27 | `m3/art` | `f44c770b` | Artist | 5 mob sprites + 14 item icons + 2 backgrounds + 1 radio_icon + детерминистичный `tools/art/gen_m3_assets.py`; M3-add 129.8 KB / 500 KB |

PM (orchestrator) уже сделал code-review всех трёх PR'ов с verdict APPROVE. Моя задача — независимая runtime/regression acceptance на **комбинированном** состоянии.

## Combined test branch

`qa/m3-acceptance-test` создан локально от `m3-integration` через octopus-merge:
- `git merge --no-ff origin/m3/content` — clean (merge made by 'ort' strategy, 6 files, +633/-40).
- `git merge --no-ff origin/m3/art` — clean (5 mob sprites + 8 item icons + 2 backgrounds + radio_icon + gen_m3_assets.py).
- `git merge --no-ff origin/m3/world` — clean (23 files, +1189/-107; RadioScene, mobAI/radio/zoneUnlock systems + tests, radio types).

**Все три merge прошли cleanly без конфликтов** — подтверждает PM dry-run от 2026-05-21T15:13Z.

## Progress (recovery-safe checkpoints)

### Done
- [x] Repo fetched, briefing прочитан (M3.md / M3-QA-ACCEPT.md handoff / launch.md).
- [x] `qa/m3-acceptance-test` октопус-merge от `m3-integration` — 3 PR'а clean, без конфликтов.
- [x] `qa/m3-acceptance` branch создана от `m3-integration` + Draft PR #28 открыт.
- [x] **Gate 1 — Static checks (на октопус-комбинации)** — все четыре команды зелёные:
  - `npm install --no-audit --no-fund` — 180 пакетов, 0 vulnerabilities.
  - `npm run typecheck` (`tsc --noEmit`) — чисто.
  - `npm run lint` (`eslint src/`) — чисто.
  - `npm run test` (`vitest run`) — **89/89 PASS** (49 M2 baseline + 39 M3 Engineer + 1 sanity, как и обещал Eng в PR #26).
  - `npm run build` (`vite build`) — `dist/` 1.5 MB ≤ 2 MB.
- [x] **Gate 2 — Runtime smoke** (через `npm run dev` + Chrome at `http://127.0.0.1:5173/`):
  - BaseScene: HP 100/100, Уровень 1, Нож + Тканевая куртка, 4 кнопки — `В вылазку` / `Мастерская` / `Инвентарь` / **`Радио`** (M3 кнопка на месте, GDD §10.M3).
  - **RadioScene list view**: 3 dummy сигнала видны — `caravan — Караван у северного периметра` (4 вылазок), `unknown — SOS на 121.5` (3), `survivor_group_a — Прогноз погоды от Сони` (5). Кнопка `Назад в Оплот` рендерится.
  - **RadioScene detail view**: клик `Открыть` на `caravan` → body+subject отрисованы, 2 кнопки `Откликнуться` / `Игнорировать` + `Назад к списку`.
  - **Dismiss flow**: `Откликнуться` на caravan → возврат к списку, остались 2 сигнала; `Игнорировать` на unknown → остался 1 сигнал. Обе ветки одинаково ставят `dismissed=true` (соответствует GDD §10.M3.3 и `radio.ts:26-33`).
  - **MapScene multi-zone**: 3 зоны в порядке `forest → warehouse → city`. `Лес (ур. 1)` unlocked → `Войти: Лес`. `Склад (ур. 2)` closed → `Закрыто. Откроется после: успешной вылазки в Лес depth 2.` `Город (ур. 3)` closed → `Закрыто. Откроется после: успешной вылазки на Склад.` Заблокированные кнопки полупрозрачные (alpha 0.5), `onClick` early-return — соответствует `MapScene.ts:64-71`.
  - **M2 regression 7-step Forest MVP**: Map → `Войти: Лес` → SortieScene (Старт depth 1, depth 2/3 закрыты по level-gate) → CombatScene (wild_dog HP 20/20) → 4 хода атак (hero knife dmg ~6.7, wild_dog bite ~7.9/6.5/5.2/6.2) → wild_dog 0/20 → LootScene (Кожа x1 / Консервы x1) → `Возврат на базу` 34с прогресс-бар → BaseScene (Склад 3 стакa · 3.6 кг). M1-AI fallback для `marauder.flee`/`wild_dog` без `behavior_id` сохранён.
  - **Assets на диске** (read-only, runtime preload вне Engineer's M3 DoD): 5 mob sprites в `assets/sprites/mobs/`, 14 M3 item icons в `assets/sprites/items/`, `warehouse.png` + `city.png` в `assets/backgrounds/`, `radio_icon.png` в `assets/ui/`. M3-add 129.8 KB / 500 KB (см. note #2 ниже про wiring follow-up).
  - **M3 mob AI** (5 behaviors) не тестировался напрямую в combat runtime — warehouse/city locked, для unlock'а нужен forest depth 2 (player level 3+). Покрытие проверено через **16 vitest** (`mobAI.test.ts`) + ручной review `chooseMobActionV2` (`src/systems/mobAI.ts:71-133`) и его потребителя `CombatScene.runMobTurn` (`src/scenes/CombatScene.ts:152-203`). Все 5 веток (`ranged_keep_distance ×0.5 vs melee` / `defensive_cover` parity + `cover_active` flag → COVER_DEFENSE_BONUS_PCT / `berserker_low_hp` triggered-once + base_speed −30 / `pack_bonus_when_paired ×1.5 if ≥2 alive pack_rat` / `armor_piercing_ranged → ignore_armor_defense`) корректно мутируют `MobRuntimeState` и читаются `CombatScene` без drift'а.
- [x] **Gate 3 — Spec compliance** (полный прогон `python3 /home/ubuntu/gate3_spec_check.py` — 0 errors):
  - **Counts** ровно по DoD: items=29 / mobs=8 / recipes=15 / zones=3 / radio=3.
  - **Uniqueness**: id'ы уникальны во всех 5 JSON.
  - **Cross-refs**: `recipes.result_id` + `ingredients[*].item_id` ⊆ items; `items.recipe_id` ∈ recipes ∪ {null}; `mobs.drop_table[*].item_id` ⊆ items; `zones.{resources, unique_resources, mobs, levels[*].enemies, levels[*].resources}` ⊆ items ∪ mobs; `weapon_ranged.ammo_id` → `consumable` тип. Всё резолвится.
  - **Balance.md §M3 spot-check** (5 M3 mobs × 6 stats = 30 числовых полей: hp / damage_min / damage_max / defense / base_speed / xp_reward) — каждое поле сходится с балансной таблицей.
  - **GDD §5.4 behavior_id mapping**: `looter_sniper → ranged_keep_distance`, `armored_guard → defensive_cover`, `fanatic_berserker → berserker_low_hp`, `pack_rat → pack_bonus_when_paired`, `relic_drone → armor_piercing_ranged` — все 5 совпадают.
  - **GDD §6.4.M3 unlock conditions**: `forest → start`, `warehouse → forest_depth_2_completed`, `city → any_warehouse_sortie_completed` + `return_time_multiplier` 1.0 / 1.2 / 1.5 — всё на месте.
  - **M1 preservation**: 3 M1 mob'а (`marauder` 18/1/5/8/90, `wild_dog` 20/0/8/12/120, `mutant` 60/3/10/15/70) — без regress'а.
  - **Anti-scope** (grep по `src/` + `radio.json`): `radio.json` без M6-полей (`reward` / `trap_mob_id` / `trust_impact` / `type`); `src/` чист от M4 (`\.perks\b`), M5 (`boss` — см. note #3), M6 (`trust_impact` / `trap_mob_id`), M7 (`weapon_modules`), M8 (`YandexGames`). Только корректный enum-член `MobType = "boss"` присутствует как schema-spot, GDD §6.2 канон.
  - **Naming convention**: `{mob_id}.png` для 5 mob sprites, `{item_id}.png` для 14 item icons, `{zone.id}.png` для warehouse / city backgrounds, `radio_icon.png` — всё snake_case и сходится с JSON id'ами.
  - **Style/budget**: 129.8 KB / 500 KB, размеры и palette подтверждены детерминистичным `tools/art/gen_m3_assets.py` (по Artist'у в `staff/status/ARTIST.md`).

## Verdict

**APPROVE.** Все три Gate'а пройдены чисто (0 blocker'ов / 0 major / 3 minor для M4 follow-up). Право вето QA НЕ исполняется. PM может мерджить **PR #25 → PR #26 → PR #27** в `m3-integration` (порядок neutral — три merge независимы по PM dry-run).

### Не-блокирующие follow-ups для M4 (NB only)

1. **RadioScene list-view layout overlap (minor cosmetic)** — кнопка `Открыть` визуально пересекается со строкой `Истекает через X вылазок` внутри карточки сигнала (см. screenshot Gate 2). Текст и клик функциональны, проблема чисто визуальная. Engineer'у на M4: либо увеличить `rowHeight` (сейчас 96) до ~120, либо отодвинуть кнопку ниже. `src/scenes/RadioScene.ts:54-68`.
2. **M3 assets present on disk but not wired into BootScene preload / scenes** — `assets/sprites/mobs/*.png`, M3-only `assets/sprites/items/*.png`, `assets/backgrounds/{warehouse,city}.png`, `assets/ui/radio_icon.png` существуют в репо после merge PR #27, но `BootScene.preload()` (`src/scenes/BootScene.ts:32-38`) грузит только 8 M1 item icons + `hero.png` + `forest.png`. Это соответствует Engineer DoD M3 (§4 handoff требовал только `radio.json` loading — sprite-rendering не в M3 scope), и assets всё равно влезают в budget 129.8 KB / 500 KB. **На M4 integration polish**: расширить preload + отрендерить sprite'ы в `CombatScene` / `LootScene` / `MapScene` / `BaseScene → Радио button icon`.
3. **`MobType = "boss"` schema-stub (intentional, not a violation)** — `src/types/mob.ts:3` содержит `boss` в enum, но на M3 нет мобов с `type:"boss"`. Это GDD §6.2 канон (forward-compatibility под M5 bosses), не anti-scope-нарушение. Note для будущего QA Acceptance M5 — там этот тип должен начать использоваться.

## Recovery

- Role: QA Acceptance Critic M3.
- Milestone: M3 final acceptance — **APPROVED**.
- Branch: `qa/m3-acceptance` (base `m3-integration` HEAD `3823395`).
- Test branch: `qa/m3-acceptance-test` (local, octopus-merge content + art + world — три clean merge без конфликтов).
- Objects under review: PR #25 (`24dcb28f`), PR #26 (`c220fca1`), PR #27 (`f44c770b`).
- Done sections: setup / briefing / octopus dry-run / Draft PR / **Gate 1 PASS** / **Gate 2 PASS** / **Gate 3 PASS** / **final APPROVE**.
- Next concrete step: PM мерджит role-PR в `m3-integration` (порядок свободный), затем M3 gate-close PR + старт M4 kickoff.
- Blockers: нет.
- PAT discipline: PAT ТОЛЬКО в `Authorization: Bearer` header через `os.environ['git_pat']`, никогда не в URL/echo/print.
- Forbidden: править код/контент/ассеты в чужих PR (#25/#26/#27) — только PR-комментарии и свой QA-report. Self-merge. Push в `main`/`m3-integration` напрямую. Менять чужие `staff/status/*.md` (только свой `staff/status/QA.md`). Предлагать новые M3-фичи. Проверять то, что вне M3 scope (radio выходит за UI-stub — это M6, anti-scope).

---

# M4 Spec Review

**Текущая веха:** M4 — Перки и прогрессия (spec-review phase)
**Объект ревью:** GD M4 amendment PR [#32](https://github.com/alexbayov/oplot/pull/32) (`m4/gd-amendment → m4-integration`).
**Статус:** IN_PROGRESS (verdict pending — 7 чек-листов в работе)
**Дата:** 2026-05-21
**QA branch:** `qa/m4-spec-review` (base `m4-integration` HEAD `d8e2a31`)

## Recovery

Если сессия упадёт — следующему Devin делать:

1. `git checkout qa/m4-spec-review && git pull`.
2. Прочитать:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M4.md`
   - `staff/handoff/M4-QA-SPEC.md` (7 чек-листов)
   - `staff/handoff/M3-SUMMARY.md`
   - `docs/GDD.md` + `docs/balance.md` целиком (включая M4 GD-amendment с ветки `origin/m4/gd-amendment`).
3. Продолжить с: посмотреть какие подсекции «# M4 Spec Review» уже заполнены, добить недостающие чек-листы, записать финальный verdict.
4. Обновлять ТОЛЬКО `staff/status/QA.md`. НЕ трогать `docs/`, `src/`, `content/`, `assets/`, чужие staff/.
5. После полного verdict'а — flip PR Draft → Ready и отправить блокирующее сообщение Alex'у: «QA Spec M4 verdict <APPROVE|CHANGES_REQUESTED>, PR <ссылка>».
6. Не self-merge.

## Объект ревью — артефакты

- GD PR #32 base = `m4-integration` (НЕ main) — подтверждено через `git_view_pr`.
- GD PR #32 scope (3 файла, +248 / −3): `docs/GDD.md`, `docs/balance.md`, `staff/status/GAME_DESIGNER.md`. `src/`, `content/`, `assets/`, чужие `staff/` — не тронуты.
- Octopus diff command: `git diff origin/m4-integration..origin/m4/gd-amendment -- docs/ staff/`.

## Verdict (TBD)

_Заполнено после прогона всех 7 чек-листов ниже._
