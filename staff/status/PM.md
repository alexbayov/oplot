# Status: PM

**Текущая веха:** M2 — Играбельный MVP (закрывается)
**Статус:** M2_DONE (PM merges #15/#16/#17 в m2-integration завершены; этот PR pm/m2-finalize закрывает M2 dashboard, дальше — gate-close PR для Alex'а)
**Последнее обновление:** 2026-05-20 (после QA APPROVE re-review и PM merges)
**Текущий gate:** `M2_DONE`

## История

- **M0 — Каркас процесса:** DONE 2026-05-18. PR #1.
- **M1 — Технический скелет:** DONE 2026-05-19. Gate-close PR #12 merged Alex'ом в `main`. Полный summary — `staff/handoff/M1-SUMMARY.md`. M1 deliverables: Phaser 3 + TS + Vite skeleton, GDD §1–§6, 15 items / 3 mobs / 5 recipes / 1 forest zone, 10 placeholder-ассетов, integration-branch workflow введён.
- **M2 — Играбельный MVP:** DONE 2026-05-20 (PM merges все 4 role/PM PR в m2-integration; ждёт gate-close merge от Alex). См. `staff/status/M2.md` и `staff/handoff/M2-SUMMARY.md`.

## Что сделано на M2 (итог)

- Создана интеграционная ветка `m2-integration` от `main` (commit `1244c5f`).
- Подготовлены kickoff/handoff материалы и M2 dashboard.
- **PR #14** `pm/m2-kickoff → main` — merged 2026-05-19 Alex'ом (M2 kickoff materials).
- **PR #15** `m2/gameplay → m2-integration` — merged 2026-05-20 PM. Engineer-реализация: core loop, 4 системы, 9 сцен (incl. ReturnScene), 49 vitest тестов. Две сессии: исходная (steps 1–12) + continuation (ReturnScene fix после QA-blocker).
- **PR #16** `pm/m2-status-sync-eng-pr15 → m2-integration` — merged 2026-05-20 PM (исторический gate move на PARALLEL_PRODUCTION_IN_PROGRESS).
- **PR #17** `qa/m2-acceptance → m2-integration` — merged 2026-05-20 PM. QA Acceptance two-pass (CHANGES_REQUESTED → APPROVE), PR открыт PM-ом (git-manager proxy не дал QA-сессии push PR).
- **Этот PR** `pm/m2-finalize → m2-integration` — gate → M2_DONE, M2-SUMMARY, CHANGELOG, обновление dashboard.

## PM-процесс lessons learned на M2

- **Token-budget**: Engineer-сессия с планом 13 пунктов сжёг лимит на step 13. На M3+ разбивать скоуп на 3-5 действий на сессию (recovery-safe continuation pattern).
- **Recovery-safe PR**: ранний Draft PR обязателен (PR #15 был открыт после steps 1–2, что спасло работу после смерти сессии).
- **QA-blocker на спек-нарушения**: QA нашла, что Engineer не реализовал `return_time_s` / `ReturnScene` из GDD §1 + balance.md. PM верифицировал локально и запустил 5-действенную Engineer continuation. Урок: PM-promo для Engineer должен явно перечислять сцены из GDD §1 диаграммы (не опираться на «я всё сделал»).
- **PAT-hygiene**: QA-сессия случайно залогировала PAT в tool-output (fallback-команда с trailing newline). PAT ротирован. На M3+ role-promo явный запрет: PAT только в Authorization header, никогда в URL или echo/print.
- **Git-proxy 403**: git-manager прокси не имеет write на alexbayov/oplot в PM/QA-сессиях. На M2 PM использовал temp PAT, затем Alex сохранил org-scope secret `GITHUB_PAT_OPLOT`. На M3+ PM-сессия будет использовать его без ручных запросов.

## Что НЕ сделано (по дизайну, ждёт Alex'а)

- Gate-close PR `m2-integration → main` — PM открывает после этого pm/m2-finalize merge; мерджит Alex/Заказчик.
- Старт M3 — после merge gate-close в main.

## Плановые решения M2 (зафиксированы в kickoff'ах и подтверждены QA APPROVE)

- **GD amendment не нужен:** GDD §1–§6 уже покрывает M2 механики (core loop, бой, инвентарь/вес, крафт, мобы). Это подтверждено по результатам M2.
- **Content на M2 не запускается:** canonical M1 content (15/3/5/1) хватило для MVP. Любые правки чисел — через `docs/balance.md`, не через `content/*.json`.
- **Artist на M2 не запускается:** M1 placeholder-ассеты использованы. Реальный арт — M3+.
- **QA Acceptance возвращается** формальной сессией на M2 (на M1 заменена PM-integration smoke — разовое решение, см. `staff/decisions/DECISIONS.md` 2026-05-19).

## Блокеры

- Нет. M2 закрыта по PM-стороне. Ждёт Alex/Заказчика для merge gate-close PR `m2-integration → main`.

## PR

- PM-process M2 kickoff PR #14 `pm/m2-kickoff → main`: **merged 2026-05-19** Alex'ом.
- Engineer M2 PR #15 `m2/gameplay → m2-integration`: **merged 2026-05-20** PM. 5 commits (incl. ReturnScene fix после QA-blocker).
- PM status-sync PR #16 `pm/m2-status-sync-eng-pr15 → m2-integration`: **merged 2026-05-20** PM. Исторический gate move.
- QA Acceptance M2 PR #17 `qa/m2-acceptance → m2-integration`: **merged 2026-05-20** PM. Two-pass review APPROVED.
- PM M2 finalize PR `pm/m2-finalize → m2-integration`: этот PR.
- Gate-close M2 PR `m2-integration → main`: откроется PM-ом после merge этого PR. Мерджит Alex.
- M1 PR-реестр (closed): #6/#7/#11/#13 → `m1-integration`; #8/#9/#10/#12 → `main`.

## Что делать новой PM-сессии (recovery)

1. Прочитай `staff/status/PM.md` (этот файл), `staff/status/M2.md`, `staff/handoff/M2-SUMMARY.md`, `staff/STATE_MACHINE.md`, `staff/PLAN.md`.
2. Проверь статус gate-close PR `m2-integration → main`:
   - Если открыт и не смержен: попроси Alex'а смержить (не self-merge).
   - Если смержен → M2 официально закрыта. Старт M3.
3. **Старт M3** (после gate-close merge):
   - создай `m3-integration` от свежего `main`;
   - подготовь `staff/kickoff/M3-*.md` + `staff/handoff/M3-*.md` под план M3 (см. `staff/PLAN.md` §3);
   - обнови `staff/status/M3.md`, `staff/CONTEXT.md`, `staff/LINKS.md` под активную M3.
4. **Лессон M2:** не давай role-сессии план > 5-7 действий. Ранний Draft PR + recovery-блок обязательны. PAT только в Authorization header.
5. Не пиши код/контент/ассеты сам. Не self-merge gate-close. Обновляй только `staff/status/PM.md`, `staff/status/M{N}.md`, `staff/PLAN.md`, `staff/decisions/CHANGELOG.md`, `staff/decisions/DECISIONS.md`, `staff/handoff/M{N}-SUMMARY.md`, `staff/CONTEXT.md`, `staff/LINKS.md`.
