# PM / Оркестратор — M5 Kickoff: Боссы и инстансы

## Контекст

Ты — PM/Оркестратор проекта «Оплот» (мобильная HTML5 survival RPG). Веха M4 «Перки и прогрессия» завершена (gate-close PR #39 merged в main 2026-05-22, main HEAD `723ed1c`). Теперь нужно стартовать M5 «Боссы и инстансы».

## Что делать (5-7 шагов)

1. **Создать `m5-integration`** от `main` HEAD. Все M5 role PR таргетятся в `m5-integration`. PM мерджит role PR в `m5-integration` после QA Acceptance APPROVE. Gate-close PR `m5-integration → main` мерджит PM (продолжение делегации Alex'а с M3).

2. **Обновить dashboards** на ветке `pm/m5-kickoff → m5-integration`:
   - `staff/status/M5.md` — M5 scope, anti-scope, DoD, PR-реестр, роли
   - `staff/PLAN.md` — M4→DONE, M5→IN_PROGRESS
   - `staff/STATE_MACHINE.md` — текущий gate = `M5_PREPARED`
   - `staff/CONTEXT.md` — актуальный snapshot
   - `staff/LINKS.md` — M5 PR-реестр
   - `staff/decisions/CHANGELOG.md` — запись «M5 kickoff»
   - `staff/status/PM.md` — обновление

3. **Создать 6 kickoff файлов** `staff/kickoff/M5-{GD,QA-SPEC,CONTENT,ENG,ARTIST,QA-ACCEPT}.md` — каждый содержит: роль, скоуп, anti-scope, конкретные шаги (5-7), recovery-safe правила.

4. **Создать 6 handoff файлов** `staff/handoff/M5-{GD,QA-SPEC,CONTENT,ENG,ARTIST,QA-ACCEPT}.md` — каждый содержит: чек-листы для роли, DoD-критерии, anti-scope.

5. **Early push + Draft PR** `pm/m5-kickoff → m5-integration` с Recovery block.

6. **Flip Draft → Ready, self-merge** (по делегации Alex'а).

7. **Запустить GD M5** — передать промт `staff/kickoff/M5-GD.md` в новую Devin-сессию.

## M5 скоуп (из PLAN §3 + GDD placeholder §9)

**«Боссы и инстансы».** Игрок может:

1. Встретить **мини-босса** в конце глубины 3 каждой зоны (1 босс/зона × 3 зоны = 3 босса). Босс использует `MobType = "boss"` (уже в enum) и `MobRole = "boss"` (уже в интерфейсе Mob).
2. Боссы имеют **многофазный бой** (2 фазы: при <50% HP — смена AI + усиление). Реализуется через `MobRuntimeState` расширение.
3. Победа над боссом даёт **уникальный T3 чертёж** (1 чертёж/босс = 3 чертежа). T3 крафт требует zone-exclusive ресурсы + boss-drop ресурс.
4. **Дейли-инстанс**: раз за сессию можно пройти «элитную вылазку» с усиленным боссом → повышенный лут. Отслеживается через `GameState.progress.daily_completed`.
5. **Газовые зоны**: зона/глубина с газом требует `gas_mask` в equipped_armor — без неё урон каждый ход. `gas_mask` уже существует как T2-armor (lore stub с M3).

## M5 anti-scope (явный)

- **Нет полноценной радио-логики** (M6)
- **Нет Yandex SDK / persistence** (M8)
- **Нет модульного оружия/брони** (M5+ — отдельная подсистема, НЕ входит в M5)
- **Нет PvP / мультиплеера**
- **Нет реальных звуков/анимаций** (M7)
- **Нет skill tree** (M5+ refactor — система перков M4 остаётся flat pool)
- **Нет активных ability / cooldowns** (M5+ — боссы используют усиленные существующие AI behaviors, не новые ability-механики)

## M5 предварительный скоуп по ролям

| Роль | Что делает |
|---|---|
| GD | GDD §9 «Боссы и инстансы» (3 босса с 2-фазным AI, дейли-инстанс, газовые зоны, T3 чертежи), §6 schema extensions (boss-related fields), balance.md §M5 (boss stats, T3 recipes, gas zone params, daily reset). |
| QA Spec | 7 чек-листов: §9 boss mechanics, §6 schema extensions, balance §M5 numbers, anti-scope, M4 regression, consistency, recovery-safe. |
| Content | `content/mobs.json` (+3 босса), `content/items.json` (+boss-drop ресурсы + T3 items), `content/recipes.json` (+3 T3 рецепта), `content/zones.json` (глубины с газом + boss_id), `content/radio.json` (boss-связанные сигналы — optional). |
| Engineer | Босс AI (2-фазный бой + phase transition), CombatScene boss fight flow, дейли-инстанс (reset tracking + UI), газовые зоны (damage-per-turn без gas_mask), T3 крафт интеграция, MobRole runtime consumption, ProgressionScene boss-kill tracking. Цель: 128 baseline + ≥20 новых M5 = ≥148 vitest. |
| Artist | 3 boss спрайта (128×128), T3 item icons, boss-drop resource icons, gas zone overlay/indicator. M5-add ≤80 KB. |
| QA Acceptance | 3 Gate'а (static/runtime/spec). Anti-scope grep: `skill_tree|active_ability|cooldown|pvp|yandex`. M4 regression: 128 baseline tests pass. |

## Унаследовано с M4 (для kickoff/handoff файлов)

- 11 scenes, 128 vitest, 1.5 MB build, ~259 KB assets
- 8 mobs (3 M1 + 5 M3), 8 perks, 29 items, 15 recipes, 3 zones
- `MobType = "boss"` уже в enum (`src/types/mob.ts`)
- `MobRole = "regular" | "boss"` уже в enum + `role` field на `Mob` interface (но не consumed runtime)
- `gas_mask` item существует (T2-armor, defense=1, lore stub)
- `Zone.boss_id: string | null` уже в schema (M1, всегда null)
- `MobRuntimeState` в `src/systems/mobAI.ts` — готов к расширению для phase tracking
- `GameState.progress` — имеет boolean флаги для zoneUnlock, готов к `daily_completed`

## Ключевые уроки M2+M3+M4 (прошить в каждый kickoff)

- Token-budget: план role-сессии ≤ 5-7 действий
- Recovery-safe: ранний Draft PR + commit/push после каждого под-шага + PR Recovery block
- QA-blocker на cross-spec расхождение — эскалация в PM, не самостоятельный резолв (M4 урок: xp_reward mismatch §M4 vs §M1/§M3)
- DoD-precision: формулировки дают точные числа, не «≥X» (M3 урок: items=29 не ≥30)
- QA Acceptance: локальный octopus-merge всех role-PR перед review (M3+M4 подход работает)
- Anti-scope discipline на каждой роли
- PM kickoff M{N+1} проверяет что DoD-формулировки совпадают с spec

## Формат kickoff файлов

Каждый `staff/kickoff/M5-{ROLE}.md`:

```markdown
# M5 Kickoff — {Role Name}

## Роль
{role description}

## Веха
M5 — Боссы и инстансы

## Скоуп
{bullet list of deliverables}

## Anti-scope
{bullet list — что НЕ делает}

## Конкретные шаги (5-7)
1. ...
2. ...

## Recovery-safe правила
1. Ветка `m5/{role-branch}` от `m5-integration`.
2. Early push + Draft PR.
3. Commit после каждого под-шага.
4. Recovery block в PR body.
5. Не self-merge. Мерджит PM после QA Acceptance APPROVE.

## DoD для роли
{checklist}
```

Каждый `staff/handoff/M5-{ROLE}.md`:

```markdown
# M5 Handoff — {Role Name}

## Чек-листы
{numbered checklist for QA/reviewer}

## DoD
{definition of done for this role}

## Anti-scope
{what this role does NOT touch}

## Ключевые файлы
{list of files this role is expected to create/modify}

## Cross-refs
{other roles this depends on / that depend on this}
```

## Важно

- НЕ править `docs/`, `src/`, `content/`, `assets/` — только `staff/` файлы
- После self-merge kickoff PR → запустить GD M5 в новой сессии с промтом из `staff/kickoff/M5-GD.md`
- GD PR → QA Spec → параллельно Content + Engineer + Artist → QA Acceptance → PM merge → gate-close
- Gate-close PR `m5-integration → main` мерджит PM по делегации

## Файлы для первого чтения

1. `staff/CONTEXT.md`
2. `staff/handoff/M4-SUMMARY.md` (что унаследовано)
3. `staff/PLAN.md` §3 (вехи)
4. `staff/STATE_MACHINE.md`
5. `docs/GDD.md` §9 placeholder + §11 placeholder
6. `docs/balance.md` §M5 references
7. `src/types/mob.ts` (MobType + MobRole)
8. `src/systems/mobAI.ts` (MobRuntimeState)
9. `src/state/types.ts` (GameState.progress)
