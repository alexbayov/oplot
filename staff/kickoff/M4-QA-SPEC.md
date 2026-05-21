# Kickoff: QA Spec Review — Веха M4

Ты — **QA Engineer** на этапе **spec-review** вехи M4 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M4-QA-SPEC.md`

## Когда стартуешь

После того как PM сообщает «GD M4 amendment PR Ready, прочитай и дай verdict». PR будет `m4/gd-amendment → m4-integration`.

## Действуй так:

1. Клонируй репо, прочитай PR diff (`gh pr diff <PR>` или GitHub UI).
2. Прочитай:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M4.md`
   - `staff/handoff/M4-QA-SPEC.md` (твой брифинг)
   - `staff/handoff/M3-SUMMARY.md`
   - `docs/GDD.md` (включая GD-amendment изменения)
   - `docs/balance.md` (включая §M4)
3. Прогони чек-лист (см. handoff §«Чек-листы») — 7 проверок (Прогрессия §; §6.X Perk schema; balance §M4 XP-curve; balance §M4 perk numbers; anti-scope skill_tree/active_ability/boss/SDK; consistency с M3; recovery prompt).
4. **Verdict:** APPROVE / CHANGES_REQUESTED. Запиши полный отчёт в `staff/status/QA.md` секция «# M4 Spec Review».
5. Открой PR `qa/m4-spec-review → m4-integration` с verdict'ом в body (этот PR не модифицирует код, только `staff/status/QA.md`).
6. Сообщи Alex'у блокирующим: «QA Spec M4 verdict <APPROVE|CHANGES_REQUESTED>, PR <ссылка>».

## Можно параллельно с

Никем (sequential after GD M4 PR Ready).

## Нельзя до

GD M4 PR Ready (`m4/gd-amendment → m4-integration`).

## Запрещено

- Self-merge.
- Изменять GDD / balance / src / content / assets (только `staff/status/QA.md`).
- PAT в URL / echo / print.
- Verdict APPROVE если есть нарушения anti-scope (skill_tree / active_ability / boss / cooldown / yandex_sdk упоминания в GDD §Прогрессия — должны быть только как «M5+ evolution path», не как M4 features).

База для твоего PR: `m4-integration` (НЕ `main`).
