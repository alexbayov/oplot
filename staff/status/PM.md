# Status: PM

**Текущая веха:** M2 — Играбельный MVP
**Статус:** PARALLEL_PRODUCTION_IN_PROGRESS (Engineer Draft PR #15 open, план апрувлен, steps 1–2 запушены)
**Последнее обновление:** 2026-05-19 (после открытия Engineer Draft PR #15)
**Текущий gate:** `PARALLEL_PRODUCTION_IN_PROGRESS`

## История

- **M0 — Каркас процесса:** DONE 2026-05-18. PR #1.
- **M1 — Технический скелет:** DONE 2026-05-19. Gate-close PR #12 merged Alex'ом в `main`. Полный summary — `staff/handoff/M1-SUMMARY.md`. M1 deliverables: Phaser 3 + TS + Vite skeleton, GDD §1–§6, 15 items / 3 mobs / 5 recipes / 1 forest zone, 10 placeholder-ассетов, integration-branch workflow введён.
- **M2 — Играбельный MVP:** IN_PROGRESS с 2026-05-19. См. `staff/status/M2.md`.

## Что сделано на M2 (этой сессией)

- Создана интеграционная ветка `m2-integration` от свежего `main` (commit `1244c5f`), push'нута на origin.
- Подготовлены kickoff/handoff материалы для M2:
  - `staff/status/M2.md` — dashboard вехи: скоуп, anti-scope, активные роли, DoD, recovery prompt.
  - `staff/kickoff/M2-ENG.md` + `staff/handoff/M2-ENG.md` — Engineer M2 (главная роль вехи: реализует core loop, бой, лут+вес, инвентарь, крафт).
  - `staff/kickoff/M2-QA-ACCEPT.md` + `staff/handoff/M2-QA-ACCEPT.md` — формальная QA Acceptance-сессия возвращается на M2.
- Обновлены `staff/CONTEXT.md`, `staff/LINKS.md` — указывают на M2 как активную веху.
- PR #14 `pm/m2-kickoff → main` — **merged 2026-05-19** Alex'ом.
- Engineer-сессия запущена; план 13 пунктов **апрувлен PM** (с 3 уточнениями: dev-cheat за `import.meta.env.DEV`, sceneUi.ts минимальный, recovery cadence).
- Engineer открыл Draft PR #15 `m2/gameplay → m2-integration`, запушены steps 1–2 (`src/state/{balance,types,GameState}.ts` + `staff/status/ENGINEER.md`). Baseline зелёный (`typecheck`/`lint`/`build`).

## Что НЕ сделано (по дизайну, ждёт ролей)

- Engineer #15 продолжает работу по плану (steps 3–13: системы weight/combat/loot/craft → сцены Boot/Base/Map/Sortie/Combat/Loot/Inventory/Craft → vitest unit-tests → runtime smoke 7-step MVP-flow в Chrome).
- Engineer переводит #15 в Ready после прохода всех `npm` команд и runtime smoke.
- Запуск QA Acceptance M2 — PM запускает после Engineer Ready (снят Draft) по `staff/kickoff/M2-QA-ACCEPT.md`.
- Gate-close PR `m2-integration → main` — PM открывает после QA APPROVE; merge'ит Alex/Заказчик.

## Плановые решения M2 (зафиксированы в kickoff'ах)

- **GD amendment не нужен:** GDD §1–§6 уже покрывает M2 механики (core loop, бой, инвентарь/вес, крафт, мобы). Если Engineer найдёт пробел — PM открывает GD-amendment fix-сессию.
- **Content на M2 не запускается:** canonical M1 content (15/3/5/1) хватает для MVP. Любые правки чисел — через `docs/balance.md`, не через `content/*.json` (там canonical).
- **Artist на M2 не запускается:** M1 placeholder-ассеты достаточны. Реальный арт — M3+.
- **QA Acceptance возвращается** формальной сессией (на M1 она была заменена PM-integration smoke — это разовое решение, см. `staff/decisions/DECISIONS.md` 2026-05-19).

## Блокеры

- Нет. Жду продолжения Engineer #15 по плану и его перевода в Ready.

## PR

- PM-process M2 kickoff PR #14 `pm/m2-kickoff → main`: **merged 2026-05-19** Alex'ом.
- Engineer M2 PR #15 `m2/gameplay → m2-integration`: **open (Draft)**, steps 1–2 запушены, WIP по плану 13 пунктов.
- PM status-sync PR `pm/m2-status-sync-eng-pr15 → m2-integration`: open (этот PR; sync статус-файлов под gate-move на PARALLEL_PRODUCTION_IN_PROGRESS).
- QA Acceptance M2 PR `qa/m2-acceptance → m2-integration`: not yet created.
- Gate-close M2 PR `m2-integration → main`: not yet created.
- M1 PR-реестр (closed): #6/#7/#11/#13 → `m1-integration`; #8/#9/#10/#12 → `main`.

## Что делать новой PM-сессии (recovery)

1. Прочитай `staff/status/M2.md`, `staff/handoff/M1-SUMMARY.md`, `staff/STATE_MACHINE.md`, `staff/ORCHESTRATION.md`, `staff/PLAN.md` §2.
2. Проверь в GitHub статус Engineer M2 PR (`gh pr list --base m2-integration`):
   - Если open и mergeable: запусти PM-ревью по `staff/handoff/M2-ENG.md` DoD.
   - Если closed/merged: запусти QA Acceptance по `staff/kickoff/M2-QA-ACCEPT.md`.
   - Если ещё нет: попроси Alex запустить новую Devin-сессию по `staff/kickoff/M2-ENG.md`.
3. Не пытайся писать код / контент / ассеты сам — это работа ролей.
4. Не пытайся самостоятельно push в `main` — gate-close мерджит только Alex/Заказчик.
5. Обновляй только `staff/status/PM.md`, `staff/status/M2.md`, `staff/PLAN.md`, `staff/decisions/CHANGELOG.md`, `staff/decisions/DECISIONS.md`, `staff/handoff/M{N}-SUMMARY.md`, `staff/CONTEXT.md`, `staff/LINKS.md`. Чужие status-файлы — не трогай.
