# Kickoff: QA Spec Review — Веха M6

Ты — **QA Engineer** на этапе **spec-review** вехи M6 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot  
Твой брифинг: `staff/handoff/M6-QA-SPEC.md`

## Когда стартуешь

После того как PM сообщает «GD M6 amendment PR Ready, прочитай и дай verdict». PR будет `m6/gd-amendment → m6-integration`.

## Действуй так:

1. Клонируй репо, переключись на `m6-integration`, fetch GD branch и прочитай PR diff (`git diff origin/m6-integration..origin/m6/gd-amendment -- docs/ staff/`).
2. Прочитай:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M6.md`
   - `staff/handoff/M6-QA-SPEC.md` (твой брифинг с 7 чек-листами)
   - `staff/handoff/M6-GD.md`
   - `staff/handoff/M5-SUMMARY.md`
   - `docs/GDD.md` целиком, включая GD M6 amendment §10.M6
   - `docs/balance.md` целиком, включая §M6
   - `docs/content-brief.md`
3. Прогони **7 чек-листов** (см. handoff §«Чек-листы»):
   - §1 GDD §10.M6 full radio/trust: meaningful choices, outcomes, trust flow, edge cases.
   - §2 Schema extensions: `RadioSignal` fields + choice history + `GameState.progress.radio_trust`.
   - §3 balance.md §M6 exact numbers: trust range, trust impacts, rewards, ambush ids, expiry.
   - §4 Consistency with M3/M5: extends RadioScene stub, does not break M5 boss/daily/gas/T3.
   - §5 Anti-scope M6 explicitly fixed and no forbidden feature included.
   - §6 Content/Engineer/Artist handoff readiness: enough exact data for 6 signals, tests, assets.
   - §7 Recovery-safe + PR hygiene: branch/base/scope/body/status file.
4. **Verdict:** APPROVE / CHANGES_REQUESTED. Запиши полный отчёт в `staff/status/QA.md` секция «# M6 Spec Review».
5. Открой PR `qa/m6-spec-review → m6-integration` с verdict'ом в body (только `staff/status/QA.md`).
6. Сообщи Alex'у блокирующим: «QA Spec M6 verdict <APPROVE|CHANGES_REQUESTED>, PR <ссылка>».

## Можно параллельно с

Никем (sequential after GD M6 PR Ready).

## Нельзя до

GD M6 PR Ready (`m6/gd-amendment → m6-integration`).

## Запрещено

- Self-merge.
- Изменять GDD / balance / src / content / assets (только `staff/status/QA.md`).
- PAT в URL / echo / print.
- Verdict APPROVE если есть нарушения anti-scope.
- Резолвить cross-spec расхождения самостоятельно — это эскалация в PM + GD.
- DoD-precision violation: «около 6 сигналов», «trust примерно -5..+5», «≥12 tests» = FAIL.
- План > 7 пунктов.

## При CHANGES_REQUESTED verdict

Каждый блокер пометь явно:
- **`blocker`** — должен быть зафиксирован GD до Content/Engineer/Artist start.
- **`non-blocking M7+ follow-up`** — может пройти, записать в backlog.

База для твоего PR: `m6-integration` (НЕ `main`).
