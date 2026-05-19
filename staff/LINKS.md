# Links & Entry Points

> Быстрый вход для PM, ролей и recovery-сессий.

## GitHub

- Repository: https://github.com/alexbayov/oplot
- Pull requests: https://github.com/alexbayov/oplot/pulls
- Issues: https://github.com/alexbayov/oplot/issues

## Integration branch

- M1 integration baseline: `m1-integration` (создана от `main` 2026-05-19). Все role PR M1 и PM-fix PR в рамках M1 таргетятся в `m1-integration`. PM сам мержит role PR после QA Acceptance APPROVE. На M1 gate-close PM открывает PR `m1-integration → main`, который мерджит Alex/Заказчик. См. `staff/decisions/DECISIONS.md` «2026-05-19» и `staff/STATE_MACHINE.md`.

## Active M1 PRs

_Last reconciled with GitHub: 2026-05-19 (M1 gate-close)._

| PR | Role | Base | Status |
|---|---|---|---|
| #6 | Content Designer | `m1-integration` | Merged 2026-05-19 |
| #7 | Engineer | `m1-integration` | Merged 2026-05-19 |
| #8 | PM / Process | `main` | Merged; orchestration dashboard + recovery rules |
| #9 | PM / Recovery snapshot | `main` | Merged; dashboard/LINKS/CONTEXT reconcile |
| #10 | PM / Workflow policy | `main` | Merged; workflow-policy doc + kickoffs retargeted |
| #11 | Artist | `m1-integration` | Merged 2026-05-19 |
| (gate-close) | PM | `main ← m1-integration` | Open; M1 final merge, делает Alex/Заказчик |

**Next action:** Alex мерджит gate-close PR `m1-integration → main`. После этого PM создаёт `m2-integration` от свежего `main` и открывает kickoff'ы M2. На M1 формальная QA Acceptance-сессия не запускалась — заменена PM-integration smoke по решению Заказчика 2026-05-19 (см. `staff/decisions/DECISIONS.md`).

## Start here

| Need | Read |
|---|---|
| 2-minute context | `staff/CONTEXT.md` |
| Current M1 status | `staff/status/M1.md` |
| PM playbook | `staff/ORCHESTRATION.md` |
| Role workflow | `staff/PROCESS.md` |
| State machine | `staff/STATE_MACHINE.md` |
| Commands | `staff/COMMANDS.md` |

## Role briefs

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
