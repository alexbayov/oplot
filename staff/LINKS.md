# Links & Entry Points

> Быстрый вход для PM, ролей и recovery-сессий.

## GitHub

- Repository: https://github.com/alexbayov/oplot
- Pull requests: https://github.com/alexbayov/oplot/pulls
- Issues: https://github.com/alexbayov/oplot/issues

## Integration branch

- **M2 integration baseline:** `m2-integration` (создана от `main` 2026-05-19, commit `1244c5f`). Все role PR M2 и PM-fix PR в рамках M2 таргетятся в `m2-integration`. PM сам мержит role PR после QA Acceptance APPROVE. На M2 gate-close PM открывает PR `m2-integration → main`, который мерджит Alex/Заказчик. См. `staff/decisions/DECISIONS.md` «2026-05-19» и `staff/STATE_MACHINE.md`.
- M1 integration baseline `m1-integration` была закрыта gate-close PR #12 (`m1-integration → main`, merged 2026-05-19).

## Active M2 PRs

_Last reconciled with GitHub: 2026-05-19 (M2 kickoff)._

| PR | Role | Base | Status |
|---|---|---|---|
| (this PR) | PM / M2 kickoff | `main ← pm/m2-kickoff` | Open; межвеховый PM-process PR, мерджит Alex/Заказчик |
| (Engineer) | Engineer | `m2-integration ← m2/gameplay` | Not yet created |
| (QA) | QA Acceptance | `m2-integration ← qa/m2-acceptance` | Not yet created |
| (gate-close) | PM | `main ← m2-integration` | Not yet created; открывается на M2 gate-close |

**Next action:** Alex мерджит этот PM-process PR в `main` (один клик), запускает Engineer-сессию по `staff/kickoff/M2-ENG.md`. PM подхватывает Engineer plan → PR-review → QA Acceptance kickoff → merge в `m2-integration` → gate-close PR.

## Merged M1 PRs (история)

| PR | Role | Base | Status |
|---|---|---|---|
| #6 | Content Designer | `m1-integration` | Merged 2026-05-19 |
| #7 | Engineer | `m1-integration` | Merged 2026-05-19 |
| #8 | PM / Process | `main` | Merged; orchestration dashboard + recovery rules |
| #9 | PM / Recovery snapshot | `main` | Merged; dashboard/LINKS/CONTEXT reconcile |
| #10 | PM / Workflow policy | `main` | Merged; workflow-policy doc + kickoffs retargeted |
| #11 | Artist | `m1-integration` | Merged 2026-05-19 |
| #12 | PM / M1 gate-close | `main ← m1-integration` | Merged 2026-05-19 Alex'ом — закрыл M1 |
| #13 | QA Acceptance M1 | `m1-integration` | Merged 2026-05-19 в m1-integration (затем попал в main в составе #12) |

## Start here

| Need | Read |
|---|---|
| 2-minute context | `staff/CONTEXT.md` |
| Current (M2) status | `staff/status/M2.md` |
| M1 summary (закрыта) | `staff/handoff/M1-SUMMARY.md` |
| PM playbook | `staff/ORCHESTRATION.md` |
| Role workflow | `staff/PROCESS.md` |
| State machine | `staff/STATE_MACHINE.md` |
| Commands | `staff/COMMANDS.md` |

## Role briefs (M2 — active)

| Role | Kickoff | Handoff | Status |
|---|---|---|---|
| Engineer | `staff/kickoff/M2-ENG.md` | `staff/handoff/M2-ENG.md` | `staff/status/ENGINEER.md` |
| QA Acceptance | `staff/kickoff/M2-QA-ACCEPT.md` | `staff/handoff/M2-QA-ACCEPT.md` | `staff/status/QA.md` |

Content / Artist / GD / QA Spec на M2 не запускаются (см. anti-scope в `staff/status/M2.md`). Если по ходу M2 PM решит открыть fix-сессию одной из этих ролей — промт будет дописан в рамках fix-PR.

## Role briefs (M1 — закрытые, история)

| Role | Kickoff | Handoff | Status |
|---|---|---|---|
| Game Designer | `staff/kickoff/M1-GD.md` | `staff/handoff/M1-GD.md` | `staff/status/GAME_DESIGNER.md` |
| QA Spec | `staff/kickoff/M1-QA-SPEC.md` | `staff/handoff/M1-QA-SPEC.md` | `staff/status/QA.md` |
| Content | `staff/kickoff/M1-CONTENT.md` | `staff/handoff/M1-CONTENT.md` | `staff/status/CONTENT.md` |
| Engineer | `staff/kickoff/M1-ENG.md` | `staff/handoff/M1-ENG.md` | `staff/status/ENGINEER.md` |
| Artist | `staff/kickoff/M1-ARTIST.md` | `staff/handoff/M1-ARTIST.md` | `staff/status/ARTIST.md` |
| QA Acceptance | `staff/kickoff/M1-QA-ACCEPT.md` | `staff/handoff/M1-QA-ACCEPT.md` | `staff/status/QA.md` |

## Core docs

- GDD: `docs/GDD.md`
- Balance: `docs/balance.md`
- Content brief: `docs/content-brief.md`
- Style guide: `docs/style-guide.md`
