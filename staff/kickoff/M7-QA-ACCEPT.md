# Kickoff: QA Acceptance — Веха M7

Ты — **QA Engineer** на acceptance review M7.

Repo: https://github.com/alexbayov/oplot  
Brief: `staff/handoff/M7-QA-ACCEPT.md`  
Base branch: `m7-integration`

## When

Start after Content `m7/content`, Engineer `m7/polish`, Artist `m7/audio` PRs are Ready, and GD + QA Spec are merged/APPROVE.

## Do this

1. Checkout `m7-integration`; create test branch `qa/m7-acceptance-test`.
2. Read `staff/status/M7.md`, all `staff/handoff/M7-*.md`, `staff/handoff/M6-SUMMARY.md`, `docs/GDD.md`, `docs/balance.md`.
3. Locally octopus-merge: `origin/m7/content`, `origin/m7/polish`, `origin/m7/audio`. Conflict = blocker unless PM asks you to resolve clerical conflict.
4. Gate 1 static: `npm install`, `npm run typecheck`, `npm run lint`, `npm run test` exact **176/176**, `npm run build`, asset budget.
5. Gate 2 runtime smoke: M2–M6 regression + M7 audio/mute/animations/9-zone visibility.
6. Gate 3 spec: exact counts and anti-scope grep.
7. Verdict APPROVE / CHANGES_REQUESTED in `staff/status/QA.md` section `# M7 Acceptance`.
8. Open PR `qa/m7-acceptance → m7-integration` and send verdict.

## Forbidden

No src/content/assets/docs changes; only `staff/status/QA.md`. No self-merge. No PAT in URL/echo/print. No APPROVE if any Gate blocker exists. Exact counts: 9 zones / 80 items / 42 recipes / 10 SFX / 16 tweens / 176 tests.
