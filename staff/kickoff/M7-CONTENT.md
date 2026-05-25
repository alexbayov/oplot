# Kickoff: Content — Веха M7

Ты — **Content Designer** на M7.

Repo: https://github.com/alexbayov/oplot  
Brief: `staff/handoff/M7-CONTENT.md`  
Base branch: `m7-integration`

## When

Start only after GD M7 amendment is merged and QA Spec M7 verdict = APPROVE. Parallel with Engineer and Artist.

## Do this

1. Checkout `m7-integration` and read `staff/status/M7.md`, `staff/handoff/M7-CONTENT.md`, approved `docs/GDD.md` §11.M7, `docs/balance.md` §M7, `docs/content-brief.md`, current `content/*.json`.
2. Verify M6 baseline counts: zones=3, items=35, recipes=18, mobs=11, radio=6.
3. Write a 5–7 point plan: +6 zones, +45 items, +24 recipes, `content/sfx.json` 10 entries, validation, status.
4. Send Alex: «План готов, жду апрува PM».
5. After PM approve: branch `m7/content`, first scaffold commit + push + Draft PR `m7/content → m7-integration`.
6. Commit logical chunks: zones → items → recipes → SFX registry → validation/status.
7. Update only `staff/status/CONTENT.md`.
8. Send: «Content M7 PR Ready, <ссылка>, counts zones/items/recipes/sfx = <...>».

## Forbidden

No `src/`, `assets/`, `docs/`, чужие staff. No mobs/bosses/T4/skill tree/modular weapons. No self-merge. No PAT in URL/echo/print. Exact final counts: zones=9, items=80, recipes=42, SFX registry=10.
