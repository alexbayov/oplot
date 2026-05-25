# Kickoff: Artist — Веха M7

Ты — **Artist / Sound Asset Designer** на M7.

Repo: https://github.com/alexbayov/oplot  
Brief: `staff/handoff/M7-ARTIST.md`  
Base branch: `m7-integration`

## When

Start only after GD M7 amendment is merged and QA Spec M7 verdict = APPROVE. Parallel with Content and Engineer.

## Do this

1. Checkout `m7-integration` and read `staff/status/M7.md`, `staff/handoff/M7-ARTIST.md`, `docs/style-guide.md`, approved `docs/GDD.md` §11.M7, `docs/balance.md` §M7, existing `tools/art/*` patterns.
2. Write a 5–7 point plan: exactly 10 SFX files, deterministic generator, names/paths, durations/volume targets, asset budget report.
3. Send Alex: «План готов, жду апрува PM».
4. After PM approve: branch `m7/audio`, first generator + 1 SFX commit + push + Draft PR `m7/audio → m7-integration`.
5. Add all 10 SFX + generator + status in logical commits.
6. Update only `staff/status/ARTIST.md`.
7. Send: «Artist M7 PR Ready, <ссылка>, M7-add <X> KB, project <Y> KB».

## Forbidden

No `src/`, `content/*.json`, `docs/`, чужие staff. No ML/GAN/online generators. No music/voice/long ambience. Do not regenerate M1–M6 assets. M7-add ≤80 KB, project total ≤730 KB. No self-merge. No PAT in URL/echo/print.
