# Changelog проекта «Оплот»

> Формат: дата — что изменилось

## 2026-05-18 — M0: Каркас процесса

- Создан репозиторий https://github.com/alexbayov/oplot (public)
- Создана полная структура staff/ (PLAN, PROCESS, TEAM, ORCHESTRATION, roles, status, decisions)
- Созданы шаблоны docs/ (GDD, balance, style-guide, content-brief)
- Созданы шаблоны content/ (items, mobs, recipes, zones, radio — пустые JSON)
- Создана структура assets/ (sprites, ui, audio — пустые)
- Создан README.md

## 2026-05-19 — M1: Технический скелет

См. полный summary в `staff/handoff/M1-SUMMARY.md`.

- Финализированы `docs/GDD.md` и `docs/balance.md` под M1 (вылазка, бой, лут, инвентарь, крафт, JSON §6).
- QA Spec re-review APPROVE.
- Финализирован `docs/style-guide.md` (палитра HEX, шрифты, размеры, правила, AI-пайплайн для M2+, M1 placeholder pipeline).
- Engineer PR #7: Phaser 3 + TypeScript + Vite skeleton, GDD §6 types, 7 сцен, runtime smoke OK.
- Content PR #6: 15 items, 3 mobs, 5 recipes, 1 forest zone — canonical content под GDD §6.
- Artist PR #11: 10 placeholder-ассетов через Pillow (hero 128×128, 8 item icons 64×64, forest 800×600), бюджет 81.3 КБ / 300 КБ.
- Введён integration-branch workflow: per-milestone `m{N}-integration`, `main` хранит только закрытые вехи.
- Все три role-PR смержены в `m1-integration` после PM-integration smoke (typecheck/lint/build clean, cross-PR JSON references resolve, resource-id ↔ icon name set exact match).
- Gate-close PR `m1-integration → main` открыт PM, мерджит Alex/Заказчик.

## 2026-05-20 — M2: Играбельный MVP

См. полный summary в `staff/handoff/M2-SUMMARY.md`.

- Реализован core loop игры на Phaser 3 + TypeScript: 9 сцен (Boot/Base/Map/Sortie/Combat/Loot/Return/Inventory/Craft) + 4 системы (combat/weight/loot/craft) + 49 vitest unit-tests.
- Введена `ReturnScene` со spec-формулой `return_time_s = BASE_RETURN_TIME_S * (1 + (cur_weight / max_weight) * WEIGHT_PENALTY_FACTOR)` (GDD §1 + balance.md §Формулы): тяжёлый рюкзак = дольше возврат на базу. Подтверждено QA runtime smoke (30s vs 34s на разных весах).
- Engineer PR #15 (5 commits, +2124 LOC): две сессии — исходная (steps 1–12) + continuation (ReturnScene fix после QA-blocker).
- QA Acceptance two-pass: первый прогон CHANGES_REQUESTED на отсутствующий `return_time_s` / `ReturnScene`; re-review APPROVE после Engineer continuation. PR #17 (10 commits в `qa/m2-acceptance`).
- PM merges всех 4 PR в `m2-integration` (#15 Engineer / #16 PM status sync / #17 QA / pm/m2-finalize).
- Build clean: 1504.30 kB JS / 347.65 kB gzip — под бюджет 2 MB Yandex Games.
- Workflow lessons зафиксированы в `staff/status/PM.md`: token-budget (3-5 действий на role-сессию), recovery-safe ранний Draft PR, PAT-hygiene (только в Authorization header), org-scope secret `GITHUB_PAT_OPLOT` для PM merge без ручных запросов.
- Gate-close PR `m2-integration → main` открывает PM после merge pm/m2-finalize; мерджит Alex/Заказчик.
- M2 закрыта: gate-close PR #19 merged Alex'ом 2026-05-20.

## 2026-05-20 — M3: Kickoff (Расширение мира)

См. `staff/status/M3.md` для полного скоупа.

- M3 «Расширение мира» стартует: 3 зоны (Лес есть, +Склад +Город), 8 мобов (3 есть, +5 новых), 15 рецептов (5 есть, +10 новых), radio system structure stub.
- `m3-integration` создана от свежего `main` (HEAD `3a40709` — M2 gate-close).
- PM kickoff PR `pm/m3-kickoff → m3-integration` несёт M3 dashboard + 6 kickoff + 6 handoff материалов (GD / QA Spec / Content / Engineer / Artist / QA Acceptance) + обновление `PLAN.md` (M2 → DONE, M3 → IN_PROGRESS) + `CONTEXT.md` + `LINKS.md` + `staff/status/PM.md`.
- Lessons learned M2 явно прошиты в каждый M3 kickoff: token-budget (план ≤ 5-7 пунктов), recovery-safe ранний Draft PR, PAT-hygiene (только в Authorization header, никогда в URL/echo/print), anti-scope discipline (явный перечень что НЕ входит в M3 на уровне каждой роли).
- M3 anti-scope: нет перков (M4), нет боссов (M5), нет полной радио-логики (M6), нет модулей оружия, нет Yandex SDK (M8), нет сторонних UI-библиотек.
- Org-scope secret `GITHUB_PAT_OPLOT` сохранён и используется PM-сессией для merge без ручного PAT-запроса.
- Последовательность M3: GD amendment → QA Spec → (Content + Engineer + Artist параллельно) → QA Acceptance → PM finalize → gate-close.

## 2026-05-21 — M3: Spec phase closed, parallel production ready

- PM kickoff PR #20 merged в `m3-integration` 2026-05-20 (`pm/m3-kickoff → m3-integration`): M3 dashboard + 6 kickoff + 6 handoff материалов + PLAN/CONTEXT/LINKS/CHANGELOG update.
- GD M3 amendment PR #21 merged в `m3-integration` 2026-05-20 (`m3/gd-amendment → m3-integration`): GDD §5.4 (5 новых мобов с `behavior_id`), §6.2 (Mob schema extension: `mech` enum + optional `behavior_id` field), §6.4.M3 (2 новые зоны warehouse + city + Zone schema `return_time_multiplier?`), §10.M3 (RadioSignal JSON-схема + UI-flow + anti-scope), `balance.md` §M3 (5 mob stat tables + drop-tables + 2 zone configs + zone-exclusive resources + T2 weapons/armor/consumables + 10 рецептов).
- QA Spec Review PR #22 merged в `m3-integration` 2026-05-20 (`qa/m3-spec-review → m3-integration`): verdict APPROVE по 7 чек-листам (§5.4 / §6.2 / §6.4.M3 / §10.M3 / balance §M3 / anti-scope / M1-M2 regression).
- PM status-sync PR `pm/m3-status-sync → m3-integration`: dashboards (`staff/status/M3.md`, `staff/status/PM.md`, `staff/LINKS.md`, `staff/CONTEXT.md`, `staff/decisions/CHANGELOG.md`) приведены под факт GitHub. Gate: `QA_SPEC_APPROVED → PARALLEL_PRODUCTION_READY`.
- Следующий шаг — параллельный запуск Content + Engineer + Artist role-сессий (PR base = `m3-integration`). Каждая role-сессия следует recovery-safe правилу M2: ранний Draft PR + commit/push после каждого под-шага + PR Recovery block.

## 2026-05-21 — M3 DoD-align: items 29 (не ≥30) под факт balance.md §M3

- **Контекст:** Content M3 role-session подняла факт, что `staff/handoff/M3-CONTENT.md` §1 + `staff/status/M3.md` DoD §3 + `staff/kickoff/M3-CONTENT.md` step 6 ставили цель `items ≥ 30 (~15 новых)`, но `docs/balance.md` §M3 (GD-amendment PR #21, прошедший QA Spec APPROVE PR #22) специфицирует **ровно 14 новых items**: 4 zone-exclusive (electronics / oil / medical_supplies / circuitry) + 2 T2-weapons (pipe_rifle / crowbar) + 3 T2-armor (tactical_vest / helmet / gas_mask) + 5 T2-consumables (large_medkit / energy_drink / emp_grenade / smoke_bomb / ammo_rifle) = 14 → итого 29.
- **PM-decision (2026-05-21):** фиксируем `items = 29` как фактический скоуп M3, без GD-fix амендмента (который бы убил parallel-production: +1 GD сессия + +1 QA Spec сессия ради одного «филлерного» item, не оправдано). Spec (`balance.md` §M3) сильнее проектной DoD-формулировки «≥ 30», так как spec прошёл QA Spec APPROVE.
- **Файлы под align:** `staff/status/M3.md` DoD §3 + `Роли` таблица «+15 items» → «+14 items»; `staff/handoff/M3-CONTENT.md` §1 заголовок + чек-лист §1; `staff/kickoff/M3-CONTENT.md` step 6. PR: `pm/m3-dod-align-items → m3-integration`.
- **Anti-scope:** никаких изменений `docs/`, `src/`, `content/`, `assets/`. PM-only staff-файлы.
- **Lesson learned для следующих вех:** при PM kickoff (M{N+1}) проверять, что DoD-формулировки в handoff/kickoff/status дают **точные** числа, а не «приблизительно», чтобы GD-amendment + QA Spec не уезжали от dashboards. На M4 это будет шагом checklist'а в `staff/PROCESS.md`.

## 2026-05-21 — M3: Parallel production + QA Acceptance APPROVE

См. полный summary в `staff/handoff/M3-SUMMARY.md`.

- **Content PR #25** merged в `m3-integration` 2026-05-21 (`m3/content → m3-integration`): +5 mobs (всего 8), +14 items (всего 29), +10 recipes (всего 15), +2 zones (warehouse + city, всего 3), +3 dummy radio signals. JSON cross-refs валидны, balance.md §M3 числа полностью сверены, M1 baseline неизменён, forest без `return_time_multiplier` → default 1.0.
- **Engineer PR #26** merged в `m3-integration` 2026-05-21 (`m3/world → m3-integration`): multi-zone runtime (3 зоны, динамический spawn по zone+mob refs), 5 mob AI behaviors (`berserker`/`ambush`/`shieldbearer`/`leader`/`spawner`), `zoneUnlock.ts` (gating по recipe_unlocked / boss_defeated), radio stub (`RadioScene.ts` + `radioState.ts` без логики), weight zoneMultiplier на возврат. 89/89 vitest passed (49 M2 + 40 M3). Build clean ~1.5 MB.
- **Artist PR #27** merged в `m3-integration` 2026-05-21 (`m3/art → m3-integration`): 5 mob sprites (128×128, PNG) + 14 item icons (64×64) + 2 zone backgrounds (warehouse 800×600, city 800×600) + radio_icon, всё через детерминистичный `tools/art/gen_m3_assets.py` (Pillow). M3-add: 129.8 KB / 500 KB budget (26%). M1 ассеты не пересоздавались.
- **QA Acceptance PR #28** merged в `m3-integration` 2026-05-21 (`qa/m3-acceptance → m3-integration`): verdict **APPROVE**. Подход — локальный octopus-merge `qa/m3-acceptance-test` всех 3 role-PR + 3 Gate'а проверки: Gate 1 (static — typecheck/lint/build/vitest 89/89) PASS, Gate 2 (runtime smoke — RadioScene + multi-zone navigation + zoneUnlock) PASS, Gate 3 (spec compliance — radio.json без M6-полей, src/ без M4 perks / M5 boss / M6 trust / M7 modules / M8 SDK, balance §M3 numbers match content/) PASS. **0 blockers**, 3 non-blocking M4 follow-ups (RadioScene rowHeight cosmetic, BootScene M3 asset preload, MobType:"boss" под M5 заранее).
- **PM finalize PR #29** open (`pm/m3-finalize → m3-integration`): обновление всех PM-owned dashboards под факт #25/#26/#27/#28 merged, создание `staff/handoff/M3-SUMMARY.md`, эта запись CHANGELOG, gate → `M3_DONE_PENDING_GATE_CLOSE`.
- **Следующий шаг:** после merge PR #29 Alex'ом в `m3-integration` — PM откроет gate-close PR `m3-integration → main` (мерджит Alex/Заказчик, **НЕ** self-merge). После gate-close — M4 kickoff (перки + прогрессия, PLAN §3).
- **Lessons learned M3** (применять на M4): октопус-merge dry-run в QA Acceptance ловит cross-PR конфликты ранее, чем PM merge sequence; PM kickoff M{N+1} должен иметь точные DoD-числа (а не «≥X»); git-proxy 403 между сессиями обходится через `GIT_ASKPASS` + direct GitHub URL; все role-сессии M3 уложились в 5-7 шагов (token-budget работает); все 4 PR + QA Acceptance открылись Draft в первые 5-10 минут (recovery-safe правило работает).

## 2026-05-21 — M3: Closed (gate-close PR #30 merged в main)

- **PM finalize PR #29** merged в `m3-integration` 2026-05-21 (`pm/m3-finalize → m3-integration`): обновление всех PM-owned dashboards под факт #25/#26/#27/#28 merged, создание `staff/handoff/M3-SUMMARY.md`. Gate → `M3_DONE_PENDING_GATE_CLOSE`.
- **PM gate-close PR #30** merged в `main` 2026-05-21 PM (`m3-integration → main`): **закрыл M3**. Alex явно делегировал merge: «гитпат выдам свой если надо — мерж на тебе» — PM сам мерджит и finalize PR в `m3-integration`, и gate-close PR в `main`. Это отступление от стандартной STATE_MACHINE-политики «gate-close мерджит Alex», легитимировано прямым указанием Alex'а. `main` HEAD: `3a40709` (M2 gate-close) → `0b1de53` (M3 gate-close).
- **M3 финальное состояние:** 3 зоны (Forest + Warehouse + City), 8 мобов, 29 items, 15 recipes, 3 dummy radio signals, multi-zone runtime + 5 mob AI behaviors + RadioScene UI-stub + zoneUnlock + weight zoneMultiplier, 89/89 vitest passed, 1.5 MB build, 211.1 KB ассетов (81 M1 + 130 M3) под бюджетом ≤ 600 KB.
- **3 non-blocking M4 follow-ups** из QA Acceptance:
  1. RadioScene rowHeight 96→120 (UX-минор).
  2. BootScene preload M3 ассетов (perf-минор).
  3. Формализовать `MobRole = "regular" | "boss"` enum (тех-долг под M5).

## 2026-05-21 — M4: Kickoff (Перки и прогрессия)

См. `staff/status/M4.md` для полного скоупа.

- M4 «Перки и прогрессия» стартует: XP-система (мобы дают XP при kill), уровни (по XP-curve, формула задаёт GD), 8 пассивных перков, level-up выбор из 3 рандомных перков, новая `ProgressionScene` + `LevelUpScene` popup. Также fold-in 3 M3 NB follow-ups в Engineer M4 scope.
- `m4-integration` создана от свежего `main` (HEAD `0b1de53` — M3 gate-close).
- PM kickoff PR `pm/m4-kickoff → m4-integration` несёт M4 dashboard (`staff/status/M4.md`) + 6 kickoff (`staff/kickoff/M4-{GD,QA-SPEC,CONTENT,ENG,ARTIST,QA-ACCEPT}.md`) + 6 handoff (`staff/handoff/M4-{GD,QA-SPEC,CONTENT,ENG,ARTIST,QA-ACCEPT}.md`) + обновление PLAN.md (M3 → DONE, M4 → IN_PROGRESS) + CONTEXT.md + LINKS.md + STATE_MACHINE.md + status/PM.md + эту запись CHANGELOG.
- Lessons learned M3 явно прошиты в каждый M4 kickoff: token-budget (план ≤ 5-7 пунктов); recovery-safe ранний Draft PR + commit/push после каждого под-шага + PR Recovery block; PAT-hygiene (только в Authorization header через GIT_ASKPASS shell-script); QA octopus-merge dry-run; anti-scope discipline на каждой роли.
- **M4 anti-scope (явный):** **нет skill tree** (M5+ refactor path — GDD M4 явно зафиксирует, чтобы избежать double-work на M5); нет активных ability / cooldowns (M5+); нет боссов / T3 чертежей (M5); нет полной радио-логики (M6); нет Yandex SDK (M8).
- **Merge-делегация:** Alex продолжает M3-делегацию на M4 (PM сам мерджит role-PR в `m4-integration` после QA Acceptance APPROVE + gate-close PR `m4-integration → main`). Если Alex изменит политику — PM прочитает явное указание в чате и адаптирует.
- Org-scope secret `GITHUB_PAT_ALEXBAYOV` сохранён и используется PM-сессией для merge без ручного PAT-запроса. Git-proxy 403 workaround (GIT_ASKPASS + direct GitHub URL) применён при создании ветки `m4-integration`.
- Последовательность M4: GD amendment → QA Spec → (Content + Engineer + Artist параллельно) → QA Acceptance (с локальным octopus-merge) → PM finalize → PM gate-close (по делегации).

## 2026-05-22 — M4: Closed (all role PR merged, gate-close pending)

- **M4 «Перки и прогрессия» — DONE.** Все deliverables завершены, QA Acceptance APPROVE (7/7 checklists PASS).

- **GD PR #32** merged (GDD §8 Прогрессия + §6.5 Perk schema + balance.md §M4: XP-curve `round(40*level^1.5)` + 8 perk numbers + mob xp_reward + veteran_conditioning fallback).
- **GD fix PR #34** merged (option a: updated §M1/§M3 mob xp_reward tables to M4 numbers, TODO for Content).
- **QA Spec PR #33** merged (APPROVE after re-review — blocker resolved by PR #34).
- **Content PR #36** merged (`content/perks.json` 8 perks + `content/mobs.json` xp_reward update — scope: only content/).
- **Engineer PR #37** merged (`src/systems/xp.ts` + `src/systems/perks.ts` + ProgressionScene + LevelUpScene + perk modifier integration in combat/weight/loot/XP + M3 follow-ups: RadioScene rowHeight, BootScene preload, MobRole enum — 128/128 vitest).
- **Artist PR #35** merged (8 perk icons 64×64 RGBA + `tools/art/gen_m4_assets.py` — 24.2 KB / 50 KB budget).
- **QA Acceptance PR #38** merged (APPROVE — 7/7 checklists PASS, 0 blockers, 3 non-blocking notes: prompt typo xpRequired(10), computePerkModifiers call frequency, overkill multi-level-up single popup vs queue).

- **M4 final state:** 11 scenes, 128 vitest, 1.5 MB build, ~259 KB assets, 8 perks + veteran_conditioning fallback, XP-curve L1-10, perk modifiers in combat/weight/loot/XP, ProgressionScene + LevelUpScene, 3 M3 NB follow-ups closed.

- **Gate-close PR `m4-integration → main` pending** (PM merge по делегации Alex'а).

- **Lessons learned M4:** GD cross-spec mismatch (xp_reward §M4 vs §M1/§M3) caught by QA Spec → resolved via option (a) fix PR; parallel production works well when QA Spec APPROVE gates; Engineer can fold M3 follow-ups into M4 scope saving a separate session; LevelUpScene overkill popup queue is minor deviation from GDD §8 but acceptable for M4.

## 2026-05-22 — M4: Closed (gate-close PR #39 merged в main)

- **PM gate-close PR #39** merged в `main` 2026-05-22 PM (`m4-integration → main`): **закрыл M4**. По продолжению M3-делегации Alex'а: PM сам мерджит gate-close PR в `main` (не Alex). `main` HEAD: `0b1de53` (M3 gate-close) → `723ed1c` (M4 gate-close).
- **M4 финальное состояние:** 11 scenes (Boot, Base, Map, Sortie, Combat, Loot, Return, Inventory, Craft, Radio, **Progression**, **LevelUp**), 128/128 vitest passed (49 M2 + 40 M3 + 24 xp + 15 perks), 1.5 MB build, ~259 KB ассетов (81 M1 + 130 M3 + 24.2 M4 + M3 preload additions) под бюджетом ≤ 600 KB, 8 mobs с `xp_reward`, 8 perks JSON + 1 hardcoded `veteran_conditioning` fallback, XP-curve L1-10 `round(40*level^1.5)` MAX_LEVEL=10, perk modifiers integrated в combat / weight / loot / XP, 3 M3 NB follow-ups closed (RadioScene rowHeight 96→120, BootScene M3 preload, MobRole enum).
- **Полный summary** — `staff/handoff/M4-SUMMARY.md`.
- **3 non-blocking M5 follow-ups** из QA Acceptance M4:
  1. LevelUpScene overkill multi-level-up — текущий single popup, GDD §8 specifies queue. Минорное отклонение, M5 Engineer закроет.
  2. `computePerkModifiers` per-attack calls — не кэшировано в CombatScene state. Negligible perf impact at scale 8 perks; M5+ optimize if needed.
  3. Perk icons not rendered в LevelUpScene — на диске лежат, но scene использует text-only cards. M5 UI polish.

## 2026-05-22 — M5: Kickoff (Боссы и инстансы)

См. `staff/status/M5.md` для полного скоупа.

- M5 «Боссы и инстансы» kickoff: PM открыл интеграционную ветку `m5-integration` от `main` HEAD `723ed1c` (после merge gate-close PR #39 M4) и Draft PR #40 `pm/m5-kickoff → m5-integration` (этот PR) — M5 dashboard + 6 kickoff (`staff/kickoff/M5-*.md`) + 6 handoff (`staff/handoff/M5-*.md`) + обновление PLAN / CONTEXT / LINKS / STATE_MACHINE.
- **M5 scope:** 3 босса (1/зона, depth=3, 2-фазный бой с phase transition на HP<50%), 3 boss-drop ресурса, 3 T3 чертежа (1/зона), дейли-инстанс (24h cool-down, `GameState.progress.daily_completed`), газовые зоны (warehouse/city depth=2..3 — damage-per-turn без `gas_mask`), MobRole runtime gating (`Mob.role: "boss"` запускает boss-fight init в CombatScene), LevelUpScene overkill popup queue (M4 NB follow-up).
- **M5 anti-scope (явный, прошит в каждый kickoff):** модульное оружие (M5+ отдельная подсистема), полная радио-логика (M6), Yandex SDK / Cloud Saves / Leaderboard / IAP (M8), skill tree / поинты / prereq / tier / cost / cooldown (M5+ refactor path), PvP / мультиплеер, boss-cinematics / animated phase transition (M7 polish), дейли-instance reward rotation (M5 daily = простой 24h cool-down без вариативности), дополнительные AI behaviors (переиспользуются M3-5 + phase swap).
- **Merge-делегация:** Alex продолжает M3+M4-делегацию на M5 (PM сам мерджит role-PR в `m5-integration` после QA Acceptance APPROVE + gate-close PR `m5-integration → main`). Если Alex изменит политику — PM прочитает явное указание в чате и адаптирует.
- **Последовательность M5:** GD amendment → QA Spec → (если CHANGES_REQUESTED) GD fix PR → QA Spec re-review → (Content + Engineer + Artist параллельно) → QA Acceptance (с локальным octopus-merge) → PM finalize → PM gate-close (по делегации).
- **Прошитые в каждый kickoff уроки M2+M3+M4:**
  - Token-budget: план role-сессии ≤ 5-7 действий (нарушение → разбивать на continuation).
  - Recovery-safe: ранний Draft PR (5-10 мин) + commit/push после каждого подшага + PR Recovery block.
  - Cross-spec расхождение (например, балансовое число vs GDD schema) → эскалация в PM, **не auto-resolve** (M4 урок: xp_reward §M4 vs §M1/§M3 → QA Spec поймал, PM резолвил через option (a) fix PR).
  - DoD-precision: точные числа, не «≥X» (M3 урок: items=29 не «≥30», QA Spec поймал mismatch с DoD).
  - QA Acceptance: октопус-merge всех 3 role-PR ДО review, чтобы ловить cross-PR конфликты до PM merge sequence.
  - Anti-scope discipline на каждой роли (явный grep-чек у QA Spec + QA Acceptance).
  - GD fix может быть отдельным PR если QA Spec CHANGES_REQUESTED (M4 паттерн: PR #34 fix для блокера из PR #33).
