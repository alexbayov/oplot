# Kickoff: QA Spec Review — Веха M5

Ты — **QA Engineer** на этапе **spec-review** вехи M5 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M5-QA-SPEC.md`

## Когда стартуешь

После того как PM сообщает «GD M5 amendment PR Ready, прочитай и дай verdict». PR будет `m5/gd-amendment → m5-integration`.

## Действуй так:

1. Клонируй репо, прочитай PR diff (`git diff origin/m5-integration..origin/m5/gd-amendment -- docs/ staff/`).
2. Прочитай:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M5.md`
   - `staff/handoff/M5-QA-SPEC.md` (твой брифинг с 7 чек-листами)
   - `staff/handoff/M4-SUMMARY.md`
   - `staff/handoff/M3-SUMMARY.md`
   - `docs/GDD.md` (целиком, включая GD M5 amendment §9 + §6.X расширения)
   - `docs/balance.md` (целиком, включая §M5)
3. Прогони **7 чек-листов** (см. handoff §«Чек-листы»):
   - **§1 §9 Боссы и инстансы**: 3 boss schema (id, phase_1_behavior_id из M3-5, phase_threshold, phase_2_behavior_id, boss_drop_id), 2-фазный flow явно (HP < threshold → transition), дейли-инстанс правила (24h cool-down, daily_reset_hours), газовые зоны (`is_gas`, `gas_damage_per_turn`, `gas_mask` exemption), T3 craft chain (boss-drop → T3 recipe → T3 item).
   - **§2 §6.X schema extensions**: `Mob` (`role: "regular" | "boss"` already есть с M4, M5 добавляет `phase_threshold: number`, `phase_2_behavior_id: string`, `boss_drop_id: string | null`), `Zone` (`is_gas: boolean`, `daily_reset_hours: number`, `boss_id: string | null` уже есть). Нет лишних полей.
   - **§3 balance.md §M5 boss stats**: для 3 boss (HP / damage / defense / phase_threshold / phase_2_behavior_id). Числа sanity: boss HP > regular mob HP × 3-5, boss damage > regular × 1.5-2, threshold = 0.5 × HP (или явно зафиксировано).
   - **§4 balance.md §M5 T3 + gas + daily**: 3 T3 recipes (ингредиенты — T2 base + boss-drop количество), gas damage-per-turn (~5-10 sane), daily_reset_hours = 24.
   - **§5 Anti-scope M5 явно зафиксирован**: GDD §9 явно перечисляет «модульное оружие = M5+ подсистема», «полная радио-логика = M6», «boss-cinematics = M7», «skill tree = M5+ refactor», «PvP = не делается», «доп. AI behaviors = переиспользуются M3-5 + phase swap», «daily reward rotation = не M5». Grep: `grep -ni "module\|радио\b\|skill[_ ]tree\|cinematic\|cooldown\|active[_ ]ability" docs/GDD.md` — hits должны быть только как «M5+/M6/M7/M8 evolution path», не M5 features.
   - **§6 Consistency с M4** (не сломали унаследованное): GDD §1–§8 не изменены (только добавлены §9 и расширения §6.X), `balance.md` §M1/§M2/§M3/§M4 не изменены, существующие 8 мобов в `content/mobs.json` schema совместимы с новыми полями (Mob.phase_threshold? optional, не required для regular).
   - **§7 Recovery-safe + PR hygiene**: GD PR base = `m5-integration` (НЕ `main`), Recovery block в body, scope = только `docs/GDD.md` + `docs/balance.md` + `staff/status/GAME_DESIGNER.md`. Никакого `content/`, `src/`, `assets/`, чужих staff/.
4. **Verdict:** APPROVE / CHANGES_REQUESTED. Запиши полный отчёт в `staff/status/QA.md` секция «# M5 Spec Review».
5. Открой PR `qa/m5-spec-review → m5-integration` с verdict'ом в body (этот PR не модифицирует код, только `staff/status/QA.md`).
6. Сообщи Alex'у блокирующим: «QA Spec M5 verdict <APPROVE|CHANGES_REQUESTED>, PR <ссылка>».

## Можно параллельно с

Никем (sequential after GD M5 PR Ready).

## Нельзя до

GD M5 PR Ready (`m5/gd-amendment → m5-integration`).

## Запрещено

- Self-merge.
- Изменять GDD / balance / src / content / assets (только `staff/status/QA.md`).
- PAT в URL / echo / print.
- Verdict APPROVE если есть нарушения anti-scope (модульное оружие / полная радио / Yandex SDK / skill tree / boss-cinematics / доп. AI behaviors в GDD §9 как M5 features — должны быть только как «M5+/M6/M7/M8 evolution path»).
- **Резолвить cross-spec расхождения** (например, balance §M5 boss HP vs §9 GDD spec) **самостоятельно** — это эскалация в PM + GD (M4 урок: xp_reward §M4 vs §M1/§M3 → QA Spec PR #33 пометил blocker, PM решил через option (a) fix PR #34).
- **DoD-precision check**: если GD написал «boss HP ≥ 200» вместо «boss HP = 300» — это FAIL (M3+M4 урок).
- План > 7 пунктов (разбивай на continuation).

## При CHANGES_REQUESTED verdict

Каждый блокер пометь явно:
- **`**blocker**`** — должен быть зафиксирован GD до Content/Engineer/Artist start.
- **`_non-blocking M5/M6+ follow-up_`** — может пройти, записать в M5 backlog для следующего fix-PR или M6+ кикофф.

Cross-spec расхождения (balance vs schema vs content) — всегда **blocker**.

База для твоего PR: `m5-integration` (НЕ `main`).
