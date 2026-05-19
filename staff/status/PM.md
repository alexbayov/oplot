# Status: PM

**Текущая веха:** M1 — Технический скелет
**Статус:** GATE_CLOSE_PR_OPEN (M1 готова к финальному merge Alex'ом)
**Последнее обновление:** 2026-05-19
**Текущий gate:** `M1_GATE_CLOSE_PR_OPEN`

## Что сделано на M1

- M0 process skeleton создан и смержен в `main`.
- M1 kickoff/handoff briefs подготовлены и смержены через PR #1.
- Game Designer (PR #2) и QA Spec re-review (PR #5) — спека M1 утверждена.
- Создан единый dashboard `staff/status/M1.md` и state-machine `staff/STATE_MACHINE.md`.
- PM/process PR #8 (orchestration dashboard, state machine, communication kit, role self-update rules, PR template) смержен в `main`.
- PM recovery snapshot PR #9 (dashboard/LINKS/CONTEXT reconcile) смержен в `main`.
- 2026-05-19 — зафиксировано решение «Integration-ветка на веху; merge в `main` только на gate-close» в `staff/decisions/DECISIONS.md`. Процесс-файлы (`STATE_MACHINE.md`, `ORCHESTRATION.md`, `PROCESS.md`) обновлены под новый workflow.
- Workflow-policy follow-up PR #10 смержен Alex'ом (`f322457`).
- Создана ветка `m1-integration` от `main` (commit `9c232b1`), push'нута на origin; синхронизирована с актуальным `main` после мержа PR #10.
- Content PR #6 и Engineer PR #7 ретаргечены base → `m1-integration`, конфликты на `staff/status/*.md` pre-resolved.
- PM-review APPROVE на PR #6, PR #7, PR #11 (Artist) оставлены в PR-комментариях по чек-листам handoff.
- 2026-05-19 — зафиксировано решение «M1 Artist placeholders генерируются программно (Pillow); AI-пайплайн для M2+» в `staff/decisions/DECISIONS.md`.
- 2026-05-19 — зафиксировано решение «На M1 формальная QA Acceptance-сессия заменена PM-integration smoke» в `staff/decisions/DECISIONS.md`.
- PM-integration smoke выполнен локально на test-ветке `pm/integration-smoke` от `m1-integration` с merged PR #7+#6+#11:
  - `npm install` clean (180 packages, 0 vulnerabilities).
  - `npm run typecheck` clean (0 errors).
  - `npm run lint` clean (0 errors).
  - `npm run build` OK (3.68 s, bundle chunk warning expected for Phaser).
  - Cross-PR JSON consistency: `recipes.result_id` → `items.id` (5/5 OK), `recipes.ingredients.item_id` → `items.id` (15/15 OK), `zones.depths.enemies` → `mobs.id` (3/3 OK), `zones.depths.resources` → `items.id` (OK), `mobs.drop_table.item_id` → `items.id` (OK), 8 resource icons ↔ canonical resource ids в `items.json` exact match.
  - Asset budget 81.3 КБ / 300 КБ (27% used).
- PR #7 (Engineer) merged в `m1-integration` (commit `a37fb97`).
- PR #6 (Content) merged в `m1-integration` (commit `59e4d39`).
- PR #11 (Artist) merged в `m1-integration` (commit `5e34cbf`).
- Создан M1 summary `staff/handoff/M1-SUMMARY.md`.
- `staff/PLAN.md` обновлён: M1 помечена DONE 2026-05-19.
- `staff/decisions/CHANGELOG.md` обновлён: M1 entry.
- Открыт gate-close PR `m1-integration → main`.

## Что НЕ сделано (по дизайну, отдаётся Alex'у)

- Merge gate-close PR `m1-integration → main` — это Alex/Заказчик. PM не имеет права push в `main`.
- M2 не стартовал: `m2-integration` будет создан только после мерджа gate-close PR.

## Блокеры

- Нет блокеров. Жду Alex'овского merge gate-close PR.

## PR

- Gate-close PR `m1-integration → main`: открыт PM.
- PR #6 — Content MVP, merged в `m1-integration`.
- PR #7 — Engineer bootstrap, merged в `m1-integration`.
- PR #11 — Artist initial, merged в `m1-integration`.
- PR #8 / #9 / #10 — PM process / recovery / workflow-policy, все merged в `main`.

## Что делать новой PM-сессии (recovery)

1. Прочитай `staff/status/M1.md`, `staff/handoff/M1-SUMMARY.md`, `staff/STATE_MACHINE.md`, `staff/ORCHESTRATION.md`, `staff/PLAN.md`.
2. Проверь в GitHub статус gate-close PR `m1-integration → main`.
3. Если он merged Alex'ом:
   - создай `m2-integration` от свежего `main`, push'ни на origin;
   - открой kickoff'ы M2 (Engineer / Content / возможно GD-amendment по M2 spec);
   - обнови `staff/status/M2.md` как новый dashboard.
4. Если gate-close PR ещё open — жди Alex'овского merge, не пытайся самостоятельно сделать push в `main`.
