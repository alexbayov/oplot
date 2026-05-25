# Kickoff: QA Acceptance — Веха M6

Ты — **QA Engineer** на этапе **acceptance review** вехи M6 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot  
Твой брифинг: `staff/handoff/M6-QA-ACCEPT.md`

## Когда стартуешь

После того как Content M6, Engineer M6 и Artist M6 PR находятся в Ready (не Draft), а GD + QA Spec уже merged/APPROVE.

## Действуй так:

1. Клонируй репо, переключись на `m6-integration`, создай temporary test branch для локального octopus-merge.
2. Прочитай:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M6.md`
   - `staff/handoff/M6-QA-ACCEPT.md`
   - `staff/handoff/M6-{GD,QA-SPEC,CONTENT,ENG,ARTIST}.md`
   - `staff/handoff/M5-SUMMARY.md`
   - `docs/GDD.md`
   - `docs/balance.md`
3. Локальный octopus-merge:
   ```
   git checkout m6-integration && git pull
   git checkout -b qa/m6-acceptance-test m6-integration
   git fetch origin m6/content m6/radio m6/art
   git merge --no-ff origin/m6/content origin/m6/radio origin/m6/art
   ```
   Conflict = blocker; не резолвить самому.
4. Gate 1 static: `npm install`, `npm run typecheck`, `npm run lint`, `npm run test` (expect exact **164/164**), `npm run build`, `du -sk assets`.
5. Gate 2 runtime smoke: M2/M3/M4/M5 regression + M6 RadioScene choices, reward, trap/ambush, trust clamp, no duplicate outcomes.
6. Gate 3 spec: compare content/src/assets against GDD §10.M6 + balance §M6 + `staff/status/M6.md` DoD; anti-scope grep.
7. Verdict APPROVE / CHANGES_REQUESTED. Запиши full report в `staff/status/QA.md` секция «# M6 Acceptance».
8. Открой PR `qa/m6-acceptance → m6-integration` с verdict body. Сообщи Alex'у: «QA Acceptance M6 verdict <APPROVE|CHANGES_REQUESTED>, PR <ссылка>».

## Можно параллельно с

Никем. Это последний gate перед PM merge sequence.

## Нельзя до

Content/Engineer/Artist M6 PR Ready + QA Spec M6 APPROVE.

## Запрещено

- Self-merge.
- Изменять src/content/assets/docs. Только `staff/status/QA.md`.
- Резолвить role-PR conflicts самостоятельно.
- Verdict APPROVE если Gate 1/2/3 blocker exists.
- PAT в URL / echo / print.
- План > 7 пунктов.
- DoD ambiguity: exact counts only (6 radio signals, 4 assets, 164 vitest).

База для твоего PR: `m6-integration` (НЕ `main`).
