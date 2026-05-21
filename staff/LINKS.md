# Links & Entry Points

> Быстрый вход для PM, ролей и recovery-сессий.

## GitHub

- Repository: https://github.com/alexbayov/oplot
- Pull requests: https://github.com/alexbayov/oplot/pulls
- Issues: https://github.com/alexbayov/oplot/issues

## Integration branch

- **M3 integration baseline (фактически закрыта, ждёт gate-close):** `m3-integration` (создана от `main` 2026-05-20, HEAD `aaf2ae5` — Merge PR #28). Все 9 M3 PR смержены. Gate-close PR `m3-integration → main` PM откроет после merge этого PM finalize PR; мерджит Alex/Заказчик.
- **M2 integration baseline** `m2-integration` закрыта gate-close PR #19 (`m2-integration → main`, merged 2026-05-20 Alex'ом).
- **M1 integration baseline** `m1-integration` закрыта gate-close PR #12 (`m1-integration → main`, merged 2026-05-19).

## M3 PRs (фактически закрыта, ждёт gate-close)

_Last reconciled with GitHub: 2026-05-21 (m3-integration HEAD = `aaf2ae5` Merge PR #28: qa(M3 acceptance) — APPROVE)._

| PR | Role | Base | Status |
|---|---|---|---|
| **#20** | PM / M3 kickoff | `m3-integration ← pm/m3-kickoff` | **Merged 2026-05-20 PM** — M3 dashboard + 6 kickoff + 6 handoff |
| **#21** | GD M3 amendment | `m3-integration ← m3/gd-amendment` | **Merged 2026-05-20 PM** — GDD §5.4 (5 mobs) + §6.2 (Mob schema) + §6.4.M3 (2 zones + Zone schema) + §10.M3 (radio stub) + balance §M3 |
| **#22** | QA Spec M3 | `m3-integration ← qa/m3-spec-review` | **Merged 2026-05-20 PM** — verdict **APPROVE** по 7 чек-листам |
| **#23** | PM / status-sync | `m3-integration ← pm/m3-status-sync` | **Merged 2026-05-21 PM** — dashboards under GitHub-fact (#20/#21/#22) |
| **#24** | PM / DoD-align items=29 | `m3-integration ← pm/m3-dod-align-items` | **Merged 2026-05-21 PM** — DoD `≥30 items` → `29` под balance §M3 |
| **#25** | Content M3 | `m3-integration ← m3/content` | **Merged 2026-05-21 PM** — +5 mobs / +14 items / +10 recipes / +2 zones / +3 dummy radio signals (JSON only) |
| **#26** | Engineer M3 | `m3-integration ← m3/world` | **Merged 2026-05-21 PM** — multi-zone runtime + 5 mob AI + RadioScene stub + 89/89 vitest |
| **#27** | Artist M3 | `m3-integration ← m3/art` | **Merged 2026-05-21 PM** — 5 mob sprites + 14 item icons + 2 backgrounds + radio_icon (129.8 KB / 500 KB) |
| **#28** | QA Acceptance M3 | `m3-integration ← qa/m3-acceptance` | **Merged 2026-05-21 PM** — verdict **APPROVE** (3 Gate'а PASS на octopus-merge #25/#26/#27, 0 blockers / 3 NB M4 follow-ups) |
| **(this PR #29)** | PM / finalize | `m3-integration ← pm/m3-finalize` | Open — gate → M3_DONE_PENDING_GATE_CLOSE, M3-SUMMARY, CHANGELOG, status-sync всех PM-owned dashboards |
| TBD | PM gate-close M3 | `main ← m3-integration` | Pending — открывает PM после merge этого PR; мерджит Alex/Заказчик (НЕ self-merge) |

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
| M3 status (done pending gate-close) | `staff/status/M3.md`, `staff/handoff/M3-SUMMARY.md` |
| M2 summary (закрыта) | `staff/status/M2.md`, `staff/handoff/M2-SUMMARY.md` |
| M1 summary (закрыта) | `staff/handoff/M1-SUMMARY.md` |
| PM playbook | `staff/ORCHESTRATION.md` |
| Role workflow | `staff/PROCESS.md` |
| State machine | `staff/STATE_MACHINE.md` |
| Commands | `staff/COMMANDS.md` |

## Role briefs (M3 — done pending gate-close)

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
