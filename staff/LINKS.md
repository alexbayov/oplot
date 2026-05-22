# Links & Entry Points

> Быстрый вход для PM, ролей и recovery-сессий.

## GitHub

- Repository: https://github.com/alexbayov/oplot
- Pull requests: https://github.com/alexbayov/oplot/pulls
- Issues: https://github.com/alexbayov/oplot/issues

## Integration branch

- **M4 integration baseline (active):** `m4-integration` (создана от `main` 2026-05-21, HEAD `0b1de53` — Merge PR #30 M3 gate-close). M4 role-PR таргетятся в `m4-integration`. PM мерджит role-PR в `m4-integration` после QA Acceptance APPROVE. Gate-close PR `m4-integration → main` мерджит PM по продолжению M3-делегации Alex'а.
- **M3 integration baseline** `m3-integration` закрыта gate-close PR #30 (`m3-integration → main`, merged 2026-05-21 PM по делегации Alex'а).
- **M2 integration baseline** `m2-integration` закрыта gate-close PR #19 (`m2-integration → main`, merged 2026-05-20 Alex'ом).
- **M1 integration baseline** `m1-integration` закрыта gate-close PR #12 (`m1-integration → main`, merged 2026-05-19).

## M4 PRs (done — all merged)

_Last reconciled with GitHub: 2026-05-22 (m4-integration HEAD = `4a04678`)._

| PR | Role | Base | Status |
|---|---|---|---|
| **#31** | PM / M4 kickoff | `m4-integration ← pm/m4-kickoff` | Merged 2026-05-21 PM |
| **#32** | GD M4 amendment | `m4-integration ← m4/gd-amendment` | Merged 2026-05-21 PM |
| **#34** | GD M4 fix (xp_reward option a) | `m4-integration ← m4/gd-fix` | Merged 2026-05-21 PM |
| **#33** | QA Spec M4 | `m4-integration ← qa/m4-spec-review` | Merged 2026-05-21 PM (verdict APPROVE after re-review) |
| **#35** | Artist M4 | `m4-integration ← m4/art` | Merged 2026-05-22 PM |
| **#36** | Content M4 | `m4-integration ← m4/content` | Merged 2026-05-22 PM |
| **#37** | Engineer M4 | `m4-integration ← m4/progression` | Merged 2026-05-22 PM |
| **#38** | QA Acceptance M4 | `m4-integration ← qa/m4-acceptance` | Merged 2026-05-22 PM (verdict APPROVE) |
| TBD | PM gate-close M4 | `main ← m4-integration` | Pending — мерджит PM по продолжению M3-делегации Alex'а |

## Merged M3 PRs (история)

| PR | Role | Base | Status |
|---|---|---|---|
| #20 | PM / M3 kickoff | `m3-integration ← pm/m3-kickoff` | Merged 2026-05-20 PM |
| #21 | GD M3 amendment | `m3-integration ← m3/gd-amendment` | Merged 2026-05-20 PM |
| #22 | QA Spec M3 | `m3-integration ← qa/m3-spec-review` | Merged 2026-05-20 PM (verdict APPROVE) |
| #23 | PM / status-sync M3 | `m3-integration ← pm/m3-status-sync` | Merged 2026-05-21 PM |
| #24 | PM / DoD-align items=29 | `m3-integration ← pm/m3-dod-align-items` | Merged 2026-05-21 PM |
| #25 | Content M3 | `m3-integration ← m3/content` | Merged 2026-05-21 PM |
| #26 | Engineer M3 | `m3-integration ← m3/world` | Merged 2026-05-21 PM |
| #27 | Artist M3 | `m3-integration ← m3/art` | Merged 2026-05-21 PM |
| #28 | QA Acceptance M3 | `m3-integration ← qa/m3-acceptance` | Merged 2026-05-21 PM (verdict APPROVE) |
| #29 | PM / finalize M3 | `m3-integration ← pm/m3-finalize` | Merged 2026-05-21 PM |
| #30 | PM gate-close M3 | `main ← m3-integration` | Merged 2026-05-21 PM по делегации Alex'а — закрыл M3 |

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
| M4 status (done, gate-close pending) | `staff/status/M4.md` |
| M3 summary (закрыта) | `staff/status/M3.md`, `staff/handoff/M3-SUMMARY.md` |
| M2 summary (закрыта) | `staff/status/M2.md`, `staff/handoff/M2-SUMMARY.md` |
| M1 summary (закрыта) | `staff/handoff/M1-SUMMARY.md` |
| PM playbook | `staff/ORCHESTRATION.md` |
| Role workflow | `staff/PROCESS.md` |
| State machine | `staff/STATE_MACHINE.md` |
| Commands | `staff/COMMANDS.md` |

## Role briefs (M4 — done)

| Role | Kickoff | Handoff | Status |
|---|---|---|---|
| Game Designer | `staff/kickoff/M4-GD.md` | `staff/handoff/M4-GD.md` | **DONE** (PR #32 + #34 merged) |
| QA Spec | `staff/kickoff/M4-QA-SPEC.md` | `staff/handoff/M4-QA-SPEC.md` | **DONE** (PR #33 merged, APPROVE) |
| Content | `staff/kickoff/M4-CONTENT.md` | `staff/handoff/M4-CONTENT.md` | **DONE** (PR #36 merged) |
| Engineer | `staff/kickoff/M4-ENG.md` | `staff/handoff/M4-ENG.md` | **DONE** (PR #37 merged) |
| Artist | `staff/kickoff/M4-ARTIST.md` | `staff/handoff/M4-ARTIST.md` | **DONE** (PR #35 merged) |
| QA Acceptance | `staff/kickoff/M4-QA-ACCEPT.md` | `staff/handoff/M4-QA-ACCEPT.md` | **DONE** (PR #38 merged, APPROVE) |

## Role briefs (M3 — closed, история)

| Role | Kickoff | Handoff | Status |
|---|---|---|---|
| Game Designer | `staff/kickoff/M3-GD.md` | `staff/handoff/M3-GD.md` | `staff/status/GAME_DESIGNER.md` — **DONE** (PR #21 merged) |
| QA Spec | `staff/kickoff/M3-QA-SPEC.md` | `staff/handoff/M3-QA-SPEC.md` | `staff/status/QA.md` §M3 Spec Review — **APPROVE** (PR #22 merged) |
| Content | `staff/kickoff/M3-CONTENT.md` | `staff/handoff/M3-CONTENT.md` | `staff/status/CONTENT.md` — **DONE** (PR #25 merged) |
| Engineer | `staff/kickoff/M3-ENG.md` | `staff/handoff/M3-ENG.md` | `staff/status/ENGINEER.md` — **DONE** (PR #26 merged) |
| Artist | `staff/kickoff/M3-ARTIST.md` | `staff/handoff/M3-ARTIST.md` | `staff/status/ARTIST.md` — **DONE** (PR #27 merged) |
| QA Acceptance | `staff/kickoff/M3-QA-ACCEPT.md` | `staff/handoff/M3-QA-ACCEPT.md` | `staff/status/QA.md` §M3 Acceptance Review — **APPROVE** (PR #28 merged) |

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
