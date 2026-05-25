# Kickoff: QA Spec Review — Веха M7

Ты — **QA Engineer** на spec-review M7.

Repo: https://github.com/alexbayov/oplot  
Brief: `staff/handoff/M7-QA-SPEC.md`  
Base branch: `m7-integration`

## When

Start after PM says GD M7 amendment PR is Ready (`m7/gd-amendment → m7-integration`).

## Do this

1. Checkout `m7-integration`, fetch GD branch, review `git diff origin/m7-integration..origin/m7/gd-amendment -- docs/ staff/`.
2. Read `staff/status/M7.md`, `staff/handoff/M7-QA-SPEC.md`, `staff/handoff/M7-GD.md`, `staff/handoff/M6-SUMMARY.md`, `docs/GDD.md`, `docs/balance.md`.
3. Run 7 checklists: scope/counts, balance tuning, content readiness, SFX policy, animation policy, smoke regression, anti-scope/recovery.
4. Verdict: APPROVE / CHANGES_REQUESTED. Write report in `staff/status/QA.md` section `# M7 Spec Review`.
5. Open PR `qa/m7-spec-review → m7-integration` changing only `staff/status/QA.md`.
6. Send: «QA Spec M7 verdict <APPROVE|CHANGES_REQUESTED>, PR <ссылка>».

## Forbidden

No GDD/balance/src/content/assets changes. No self-merge. No PAT in URL/echo/print. Do not APPROVE ambiguous counts or anti-scope violations. Escalate cross-spec mismatches to PM+GD.
