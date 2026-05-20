# Links & Entry Points

> Быстрый вход для PM, ролей и recovery-сессий.

## GitHub

- Repository: https://github.com/alexbayov/oplot
- Pull requests: https://github.com/alexbayov/oplot/pulls
- Issues: https://github.com/alexbayov/oplot/issues

## Integration branch

- **M3 integration baseline (в работе):** `m3-integration` (создана от `main` 2026-05-20, HEAD `3a40709` — M2 gate-close). Все M3 role PR таргетятся в `m3-integration`. Gate-close PR `m3-integration → main` откроет PM в конце вехи; мерджит Alex/Заказчик.
- **M2 integration baseline** `m2-integration` закрыта gate-close PR #19 (`m2-integration → main`, merged 2026-05-20 Alex'ом).
- **M1 integration baseline** `m1-integration` закрыта gate-close PR #12 (`m1-integration → main`, merged 2026-05-19).

## M3 PRs (active)

_Last reconciled with GitHub: 2026-05-20 (M3 kickoff)._

| PR | Role | Base | Status |
|---|---|---|---|
| (this PR) | PM / M3 kickoff | `m3-integration ← pm/m3-kickoff` | Open — M3 dashboard, kickoff/handoff materials |
| TBD | GD M3 amendment | `m3-integration ← m3/gd-amendment` | Pending — §5.4 (5 mobs) + §6.4.M3 (2 zones) + §7 (radio stub) + balance §M3 |
| TBD | QA Spec M3 | `m3-integration ← qa/m3-spec-review` | Pending — ревью GD-amendment |
| TBD | Content M3 | `m3-integration ← m3/content` | Pending — +items / +mobs / +recipes / +zones / +radio signals |
| TBD | Engineer M3 | `m3-integration ← m3/world` | Pending — multi-zone runtime + 5 mob AI + RadioScene stub |
| TBD | Artist M3 | `m3-integration ← m3/art` | Pending — 5 mob sprites + 2 backgrounds + ~10 item icons |
| TBD | QA Acceptance M3 | `m3-integration ← qa/m3-acceptance` | Pending — final approve |
| TBD | PM finalize M3 | `m3-integration ← pm/m3-finalize` | Pending — gate → M3_DONE, M3-SUMMARY, CHANGELOG |
| TBD | PM gate-close M3 | `main ← m3-integration` | Pending — мерджит Alex/Заказчик |

## Merged M2 PRs (история)

| PR | Role | Base | Status |
|---|---|---|---|
| #14 | PM / M2 kickoff | `main ← pm/m2-kickoff` | Merged 2026-05-19 Alex'ом |
| #15 | Engineer | `m2-integration ← m2/gameplay` | Merged 2026-05-20 PM |
| #16 | PM / status sync | `m2-integration ← pm/m2-status-sync-eng-pr15` | Merged 2026-05-20 PM |
| #17 | QA Acceptance | `m2-integration ← qa/m2-acceptance` | Merged 2026-05-20 PM |
| #18 | PM / finalize | `m2-integration ← pm/m2-finalize` | Merged 2026-05-20 PM |
| #19 | PM / M2 gate-close | `main ← m2-integration` | Merged 2026-05-20 Alex'ом — закрыл M2 |

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
| M3 status (в работе) | `staff/status/M3.md` |
| M2 summary (закрыта) | `staff/status/M2.md`, `staff/handoff/M2-SUMMARY.md` |
| M1 summary (закрыта) | `staff/handoff/M1-SUMMARY.md` |
| PM playbook | `staff/ORCHESTRATION.md` |
| Role workflow | `staff/PROCESS.md` |
| State machine | `staff/STATE_MACHINE.md` |
| Commands | `staff/COMMANDS.md` |

## Role briefs (M3 — active)

| Role | Kickoff | Handoff | Status |
|---|---|---|---|
| Game Designer | `staff/kickoff/M3-GD.md` | `staff/handoff/M3-GD.md` | `staff/status/GAME_DESIGNER.md` (pending) |
| QA Spec | `staff/kickoff/M3-QA-SPEC.md` | `staff/handoff/M3-QA-SPEC.md` | `staff/status/QA.md` (pending) |
| Content | `staff/kickoff/M3-CONTENT.md` | `staff/handoff/M3-CONTENT.md` | `staff/status/CONTENT.md` (pending) |
| Engineer | `staff/kickoff/M3-ENG.md` | `staff/handoff/M3-ENG.md` | `staff/status/ENGINEER.md` (pending) |
| Artist | `staff/kickoff/M3-ARTIST.md` | `staff/handoff/M3-ARTIST.md` | `staff/status/ARTIST.md` (pending) |
| QA Acceptance | `staff/kickoff/M3-QA-ACCEPT.md` | `staff/handoff/M3-QA-ACCEPT.md` | `staff/status/QA.md` (pending) |

## Role briefs (M2 — closed, история)

| Role | Kickoff | Handoff | Status |
|---|---|---|---|
| Engineer | `staff/kickoff/M2-ENG.md` | `staff/handoff/M2-ENG.md` | `staff/status/ENGINEER.md` (DONE по PR #15) |
| QA Acceptance | `staff/kickoff/M2-QA-ACCEPT.md` | `staff/handoff/M2-QA-ACCEPT.md` | `staff/status/QA.md` (APPROVED по PR #17) |

Content / Artist / GD / QA Spec на M2 не запускались (решение подтверждено QA APPROVE).

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
