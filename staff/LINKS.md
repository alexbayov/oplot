# Links & Entry Points

> Быстрый вход для PM, ролей и recovery-сессий.

## GitHub

- Repository: https://github.com/alexbayov/oplot
- Pull requests: https://github.com/alexbayov/oplot/pulls
- Issues: https://github.com/alexbayov/oplot/issues

## Integration branch

- **M6 integration baseline (active):** `m6-integration` (создана от `main` 2026-05-25, HEAD `0af8ad4` — Merge PR #47 M5 gate-close). M6 role-PR таргетятся в `m6-integration`. PM мерджит role-PR в `m6-integration` после QA Acceptance APPROVE. Gate-close PR `m6-integration → main` мерджит PM по продолжению M3+M4+M5-делегации Alex'а.
- **M5 integration baseline** `m5-integration` закрыта gate-close PR #47 (`m5-integration → main`, merged 2026-05-25 PM по делегации Alex'а).
- **M4 integration baseline** `m4-integration` закрыта gate-close PR #39 (`m4-integration → main`, merged 2026-05-22 PM по делегации Alex'а).
- **M3 integration baseline** `m3-integration` закрыта gate-close PR #30 (`m3-integration → main`, merged 2026-05-21 PM по делегации Alex'а).
- **M2 integration baseline** `m2-integration` закрыта gate-close PR #19 (`m2-integration → main`, merged 2026-05-20 Alex'ом).
- **M1 integration baseline** `m1-integration` закрыта gate-close PR #12 (`m1-integration → main`, merged 2026-05-19).

## M6 PRs (in-progress — kickoff phase)

_Last reconciled with GitHub: 2026-05-25 (`m6-integration` HEAD = `0af8ad4`, Draft PR #48 open)._

| PR | Role | Base | Status |
|---|---|---|---|
| **#48** | PM / M6 kickoff | `m6-integration ← pm/m6-kickoff` | Draft — dashboard scaffold; prompts + dashboards update in progress |
| TBD | GD M6 amendment | `m6-integration ← m6/gd-amendment` | Pending (запуск после merge #48) |
| TBD | QA Spec M6 | `m6-integration ← qa/m6-spec-review` | Pending (после GD M6 PR Ready) |
| TBD | Content M6 | `m6-integration ← m6/content` | Pending (parallel после QA Spec APPROVE) |
| TBD | Engineer M6 | `m6-integration ← m6/radio` | Pending (parallel после QA Spec APPROVE) |
| TBD | Artist M6 | `m6-integration ← m6/art` | Pending (parallel после QA Spec APPROVE) |
| TBD | QA Acceptance M6 | `m6-integration ← qa/m6-acceptance` | Pending (после 3 role-PR Ready) |
| TBD | PM gate-close M6 | `main ← m6-integration` | Pending — мерджит PM по продолжению M3+M4+M5-делегации Alex'а |

## Merged M5 PRs (история)

| PR | Role | Base | Status |
|---|---|---|---|
| #40 | PM / M5 kickoff | `m5-integration ← pm/m5-kickoff` | Merged 2026-05-22 PM |
| #41 | GD M5 amendment | `m5-integration ← m5/gd-amendment` | Merged 2026-05-22 PM |
| #42 | QA Spec M5 | `m5-integration ← qa/m5-spec-review` | Merged 2026-05-22 PM (verdict APPROVE) |
| #43 | Artist M5 | `m5-integration ← m5/art` | PM sequential merge 2026-05-25 |
| #44 | Content M5 | `m5-integration ← m5/content` | PM sequential merge 2026-05-25 |
| #45 | Engineer M5 | `m5-integration ← m5/world` | PM sequential merge 2026-05-25 |
| #46 | QA Acceptance M5 | `m5-integration ← qa/m5-acceptance` | APPROVE evidence cherry-picked into integration |
| #47 | PM gate-close M5 | `main ← m5-integration` | Merged 2026-05-25 PM по делегации Alex'а — закрыл M5 |

## Merged M4 PRs (история)

| PR | Role | Base | Status |
|---|---|---|---|
| #31 | PM / M4 kickoff | `m4-integration ← pm/m4-kickoff` | Merged 2026-05-21 PM |
| #32 | GD M4 amendment | `m4-integration ← m4/gd-amendment` | Merged 2026-05-21 PM |
| #34 | GD M4 fix (xp_reward option a) | `m4-integration ← m4/gd-fix` | Merged 2026-05-21 PM |
| #33 | QA Spec M4 | `m4-integration ← qa/m4-spec-review` | Merged 2026-05-21 PM (verdict APPROVE after re-review) |
| #35 | Artist M4 | `m4-integration ← m4/art` | Merged 2026-05-22 PM |
| #36 | Content M4 | `m4-integration ← m4/content` | Merged 2026-05-22 PM |
| #37 | Engineer M4 | `m4-integration ← m4/progression` | Merged 2026-05-22 PM |
| #38 | QA Acceptance M4 | `m4-integration ← qa/m4-acceptance` | Merged 2026-05-22 PM (verdict APPROVE) |
| #39 | PM gate-close M4 | `main ← m4-integration` | Merged 2026-05-22 PM по делегации Alex'а — закрыл M4 |

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
| M5 status (active — kickoff phase) | `staff/status/M5.md` |
| M4 summary (закрыта) | `staff/status/M4.md`, `staff/handoff/M4-SUMMARY.md` |
| M3 summary (закрыта) | `staff/status/M3.md`, `staff/handoff/M3-SUMMARY.md` |
| M2 summary (закрыта) | `staff/status/M2.md`, `staff/handoff/M2-SUMMARY.md` |
| M1 summary (закрыта) | `staff/handoff/M1-SUMMARY.md` |
| PM playbook | `staff/ORCHESTRATION.md` |
| Role workflow | `staff/PROCESS.md` |
| State machine | `staff/STATE_MACHINE.md` |
| Commands | `staff/COMMANDS.md` |

## Role briefs (M5 — active, kickoff phase)

| Role | Kickoff | Handoff | Status |
|---|---|---|---|
| Game Designer | `staff/kickoff/M5-GD.md` | `staff/handoff/M5-GD.md` | **PENDING** (запуск после merge #40) |
| QA Spec | `staff/kickoff/M5-QA-SPEC.md` | `staff/handoff/M5-QA-SPEC.md` | **PENDING** (после GD M5 PR Ready) |
| Content | `staff/kickoff/M5-CONTENT.md` | `staff/handoff/M5-CONTENT.md` | **PENDING** (после QA Spec APPROVE) |
| Engineer | `staff/kickoff/M5-ENG.md` | `staff/handoff/M5-ENG.md` | **PENDING** (после QA Spec APPROVE) |
| Artist | `staff/kickoff/M5-ARTIST.md` | `staff/handoff/M5-ARTIST.md` | **PENDING** (после QA Spec APPROVE) |
| QA Acceptance | `staff/kickoff/M5-QA-ACCEPT.md` | `staff/handoff/M5-QA-ACCEPT.md` | **PENDING** (после 3 role-PR Ready) |

## Role briefs (M4 — closed, история)

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
