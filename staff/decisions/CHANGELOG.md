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
