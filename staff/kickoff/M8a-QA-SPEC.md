# Kickoff: QA Spec Review — Веха M8a

Ты — **QA Engineer (Spec Review)** на M8a проекта «Оплот».

Repo: https://github.com/alexbayov/oplot
Brief: `staff/handoff/M8a-QA-SPEC.md`
Base branch: `m8a-integration`

## When

Start only after GD M8a amendment PR `m8a/gd-amendment → m8a-integration` is open (Ready or Draft). Parallel start with Engineer is **forbidden**: Engineer ждёт твоего APPROVE.

## Context

- M7 закрыта (`main` HEAD `2399b7b`, см. `staff/handoff/M7-SUMMARY.md`).
- M8 разделён по согласию Заказчика: **M8a — Platform & Persistence** (этот gate); M8b — Monetization (отложен).
- `staff/status/M8a.md` содержит scope/anti-scope/DoD — это твоя главная reference.
- M8a owners: Engineer + QA (нет Content / Artist).

## Do this

1. Checkout `m8a-integration`. Pull GD amendment branch / view PR diff.
2. Read: `staff/status/M8a.md`, `staff/handoff/M8a-QA-SPEC.md`, GD M8a amendment diff (`docs/GDD.md` §13a + optional `docs/balance.md` §M8a), `staff/handoff/M7-SUMMARY.md`.
3. Прогон 7 чек-листов из `staff/handoff/M8a-QA-SPEC.md`:
   1. SDK lifecycle spec is implementable (4 failure modes covered).
   2. Cloud save schema complete (все GameState fields, snapshot size vs 200 KB quota, conflict policy single rule, throttle interval, critical triggers).
   3. Locale RU lock unambiguous (`t(key)` API, ignored `i18n.lang`, EN forward hook).
   4. Mobile-first viewport spec complete (viewport meta exact, safe-area surfaces, iOS audio gesture, portrait-only, double-tap suppression scope).
   5. Settings persistence migration clear (mute / volume → cloud-save).
   6. Anti-scope §13a explicit и совпадает с `staff/status/M8a.md`.
   7. M2–M7 regression carry-over: ничего не противоречит shipped behavior.
4. Branch `qa/m8a-spec-review` от `m8a-integration`, early Draft PR с Recovery block.
5. Verdict в `staff/status/QA.md`, append section `# M8a Spec Review`: APPROVE или CHANGES_REQUESTED + 7 чек-листов PASS/FAIL + blockers + non-blocking notes + commands + recovery state.
6. Если есть blocker — verdict CHANGES_REQUESTED, перечисли точно что править в §13a / §M8a. GD сделает fix PR, ты re-review.
7. Если всё чисто — verdict APPROVE.
8. Ready PR + Send Alex: «QA Spec M8a verdict &lt;APPROVE|CHANGES_REQUESTED&gt;, PR &lt;ссылка&gt;».

## Forbidden

- No edits to `docs/`, `content/`, `src/`, `assets/`, other staff files (только `staff/status/QA.md`).
- No self-merge.
- No APPROVE if any of 7 checklist items fails.
- No PAT в URL/echo/print.
