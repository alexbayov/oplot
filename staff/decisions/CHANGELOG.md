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
