# Links & Entry Points

> Быстрый вход для PM, ролей и recovery-сессий.

## GitHub

- Repository: https://github.com/alexbayov/oplot
- Pull requests: https://github.com/alexbayov/oplot/pulls
- Issues: https://github.com/alexbayov/oplot/issues

## Integration branch

- **M2 integration baseline (закрывается):** `m2-integration` (создана от `main` 2026-05-19, commit `1244c5f`). На этот момент в `m2-integration` смержены PR #15 (Engineer), #16 (PM status sync), #17 (QA Acceptance) и этот PR (pm/m2-finalize). Gate-close PR `m2-integration → main` открывает PM после merge этого PR; мерджит Alex/Заказчик.
- M1 integration baseline `m1-integration` была закрыта gate-close PR #12 (`m1-integration → main`, merged 2026-05-19).

## M2 PRs (final reconciliation)

_Last reconciled with GitHub: 2026-05-20 (M2 gate-close pending Alex merge)._

| PR | Role | Base | Status |
|---|---|---|---|
| #14 | PM / M2 kickoff | `main ← pm/m2-kickoff` | **Merged 2026-05-19** Alex'ом |
| #15 | Engineer | `m2-integration ← m2/gameplay` | **Merged 2026-05-20** PM — core loop, 4 системы, 9 сцен (incl. ReturnScene), 49 vitest тестов |
| #16 | PM / status sync | `m2-integration ← pm/m2-status-sync-eng-pr15` | **Merged 2026-05-20** PM — исторический gate move |
| #17 | QA Acceptance | `m2-integration ← qa/m2-acceptance` | **Merged 2026-05-20** PM — two-pass APPROVED |
| (this PR) | PM / finalize | `m2-integration ← pm/m2-finalize` | Open — gate → M2_DONE, M2-SUMMARY, CHANGELOG |
| (gate-close) | PM | `main ← m2-integration` | Pending; откроется PM-ом после merge этого PR; мерджит Alex |

**Next action:** Alex мерджит gate-close PR `m2-integration → main` → M2 официально закрывается, стартует M3.

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
| M2 status (закрывается) | `staff/status/M2.md` |
| M2 summary (итог) | `staff/handoff/M2-SUMMARY.md` |
| M1 summary (закрыта) | `staff/handoff/M1-SUMMARY.md` |
| PM playbook | `staff/ORCHESTRATION.md` |
| Role workflow | `staff/PROCESS.md` |
| State machine | `staff/STATE_MACHINE.md` |
| Commands | `staff/COMMANDS.md` |

## Role briefs (M2 — closed)

| Role | Kickoff | Handoff | Status |
|---|---|---|---|
| Engineer | `staff/kickoff/M2-ENG.md` | `staff/handoff/M2-ENG.md` | `staff/status/ENGINEER.md` (DONE по PR #15) |
| QA Acceptance | `staff/kickoff/M2-QA-ACCEPT.md` | `staff/handoff/M2-QA-ACCEPT.md` | `staff/status/QA.md` (APPROVED по PR #17) |

Content / Artist / GD / QA Spec на M2 не запускались (см. anti-scope в `staff/status/M2.md`). Решение подтверждено QA APPROVE.

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
