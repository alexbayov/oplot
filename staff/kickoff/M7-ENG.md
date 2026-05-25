# Kickoff: Engineer — Веха M7

Ты — **Engineer** на M7.

Repo: https://github.com/alexbayov/oplot  
Brief: `staff/handoff/M7-ENG.md`  
Base branch: `m7-integration`

## When

Start only after GD M7 amendment is merged and QA Spec M7 verdict = APPROVE. Parallel with Content and Artist.

## Do this

1. Checkout `m7-integration` and read `staff/status/M7.md`, `staff/handoff/M7-ENG.md`, approved `docs/GDD.md` §11.M7, `docs/balance.md` §M7, current scenes/systems/tests.
2. Baseline check: `npm install`, `npm run typecheck`, `npm run lint`, `npm run test` (expect 164), `npm run build`.
3. Write a 5–7 point plan: SFX registry loader/playback, Settings mute/volume, 16 tweens, data count/ref validation, 12 tests, status.
4. Send Alex: «План готов, жду апрува PM».
5. After PM approve: branch `m7/polish`, first scaffold commit + push + Draft PR `m7/polish → m7-integration`.
6. Keep gameplay formulas Phaser-free; scenes call helpers/systems.
7. Final self-check: typecheck/lint/test/build green; exact vitest target **176/176**.
8. Update only `staff/status/ENGINEER.md` and send PR link/build/test summary.

## Forbidden

No content JSON, audio assets, docs, чужие staff. No SDK/cloud/ads/IAP, music/voice, new mobs/bosses/T4, UI redesign. No third-party audio/UI libs without PM approval. No `any`/lazy type escapes. No self-merge. No PAT in URL/echo/print.
