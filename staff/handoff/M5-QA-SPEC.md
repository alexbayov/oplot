# Handoff — QA Spec Review M5

> Это **подробный брифинг для QA Engineer (spec-review)** на вехе M5. Ты проверяешь GD M5 amendment PR против 7 чек-листов и пишешь verdict APPROVE / CHANGES_REQUESTED.

## Preconditions

- GD M5 amendment PR `m5/gd-amendment → m5-integration` Ready (не Draft).
- Ты делаешь PR `qa/m5-spec-review → m5-integration` с одной правкой: `staff/status/QA.md` (секция «# M5 Spec Review»).

## Контекст файлов

**Читать:**
1. `staff/CONTEXT.md`
2. `staff/LINKS.md`
3. `staff/status/M5.md` (DoD M5 ground-truth)
4. `staff/handoff/M5-QA-SPEC.md` (этот файл)
5. `staff/handoff/M5-GD.md` (что GD должен был сделать)
6. `staff/handoff/M4-SUMMARY.md` (M4 baseline)
7. `staff/handoff/M3-SUMMARY.md`
8. `staff/STATE_MACHINE.md`
9. `docs/GDD.md` целиком (включая новый §9 + §6.X расширения)
10. `docs/balance.md` целиком (включая §M5)
11. GD PR diff: `git diff origin/m5-integration..origin/m5/gd-amendment -- docs/ staff/`

## 7 чек-листов (PASS / FAIL для каждого)

### §1 GDD §9 «Боссы и инстансы»

Проверки:
- [ ] §9 присутствует (не placeholder, не «coming soon»).
- [ ] §9.1 Описание явно: 3 boss / depth 3 / 2-phase fight / guaranteed drop / daily-instance unlock.
- [ ] §9.2 Boss roster: 3 boss, каждый имеет:
  - `id` (строка, например `forest_alpha_mutant`).
  - `type` (один из enum `MobType` из §6.2).
  - `phase_1_behavior_id` (один из 5 из §5.4).
  - `phase_2_behavior_id` (один из 5 из §5.4, может совпадать с phase_1).
  - `phase_threshold` (число 0..1, sane: 0.3-0.5).
  - `boss_drop_id` (строка, ref на §M5.2).
- [ ] §9.3 Flow 2-фазного боя — sequential / linear описан текстом или ASCII диаграммой. Trigger `hp / hp_max < phase_threshold` явно.
- [ ] §9.4 Дейли-инстанс flow: первый kill → unlock дейли → MapScene кнопка → SortieScene skip to depth=3 → bossfight rerun → 24h cool-down. `GameState.progress.daily_completed: Record<ZoneId, number>` явно упомянут.
- [ ] §9.5 Газовые зоны: `Zone.is_gas` / `gas_damage_per_turn` / `gas_mask` exemption. Применяется в CombatScene per-turn после хода мобов.
- [ ] §9.6 T3 craft chain: boss-drop → T3 recipe → T3 item. 3 T3 recipes явно (1/зона).
- [ ] §9.7 Edge-cases: multi-level-up при kill boss, player death в bossfight, exit без kill, дейли до первого kill, дейли в cool-down.
- [ ] §9.8 Связь с §5.4 (behaviors), §6.2/§6.4 (schema), §8 (XP), §M5 (numbers).
- [ ] §9.9 Anti-scope M5 явный список (≥ 7 пунктов).

**Verdict §1:** PASS / FAIL + цитата (если FAIL).

### §2 GDD §6.X schema extensions

Проверки:
- [ ] §6.2 Mob schema добавлены **необязательные** поля: `phase_threshold?: number`, `phase_2_behavior_id?: string`, `boss_drop_id?: string | null`. Backward-compat (existing M1-M4 mobs без новых полей валидны).
- [ ] Documented: `phase_threshold`, `phase_2_behavior_id`, `boss_drop_id` required при `role:"boss"`, optional иначе.
- [ ] §6.4 Zone schema добавлены: `is_gas?: boolean` (default false), `gas_damage_per_turn?: number` (required если is_gas=true), `daily_reset_hours?: number` (required если boss_id != null), `levels[].is_gas?: boolean` (per-depth флаг).
- [ ] Backward-compat: forest без gas_*, без daily_* — валиден.
- [ ] Existing fields (`id`, `name`, `boss_id`, `unlock_condition`, `return_time_multiplier`, `levels[]`, `resources`, `mobs`, `unique_resources`) **не изменены**.

**Verdict §2:** PASS / FAIL + цитата.

### §3 balance.md §M5 boss stats

Проверки:
- [ ] §M5 секция присутствует.
- [ ] §M5.1 Boss stats таблица: 3 строки (forest_alpha_mutant / warehouse_drone_prime / city_guard_captain или финальные id'ы из GD), все поля заполнены (hp / damage / defense / phase_threshold / phase_2_behavior_id / xp_reward), числа **точные** (не «≥X»).
- [ ] Sanity boss numbers:
  - HP > regular mob HP × 3 (например M3 mutant=80, boss > 240). Проверь: HP **300/350/400** против M1-M3 baseline.
  - damage > regular × 1.5 (M3 mutant damage=15 → boss > 22). Проверь.
  - phase_threshold ∈ (0, 1), sane 0.3-0.5.
  - xp_reward > regular × 5 (M3 mutant=45 → boss > 225). Проверь.
- [ ] Cross-spec consistency: GDD §9.2 boss roster id'ы / phase_1/phase_2 behaviors **совпадают** с balance §M5.1. Если расхождение — **blocker** (M4 урок).

**Verdict §3:** PASS / FAIL + цитата.

### §4 balance.md §M5 T3 + gas + daily

Проверки:
- [ ] §M5.2 Boss-drops: 3 items (по одному на boss), уникальные id'ы, type=resource, weight sane (1).
- [ ] §M5.3 T3 recipes: 3 строки, каждая имеет base_item (T2 weapon/armor), boss_drop_qty (sane: 1-3), other_ingredients (existing M1-M4 items), output_item.
- [ ] §M5.4 T3 item stats: 3 строки, каждая T3 item имеет sane upgrade vs T2 (например T2 weapon damage=20 → T3 damage=25-32; не +1000%).
- [ ] §M5.5 Gas zone damage: warehouse и city на depth=2,3 имеют `is_gas: true` + `gas_damage_per_turn` (sane: 3-10 HP/turn). Forest без gas.
- [ ] §M5.6 `daily_reset_hours: 24` для всех 3 zone.
- [ ] §M5.7 Anti-scope M5 повторён, совпадает с §9.9.

**Verdict §4:** PASS / FAIL + цитата.

### §5 Anti-scope M5 явно зафиксирован

Проверки:
- [ ] GDD §9.9 + balance §M5.7 явно перечисляют ≥ 7 anti-scope пунктов:
  - Модульное оружие (M5+ отдельная подсистема).
  - Полная радио-логика (M6).
  - Yandex SDK / Cloud Saves / Leaderboard / IAP (M8).
  - Skill tree / поинты / prereq / tier / cost / cooldown (M5+ refactor).
  - PvP / мультиплеер.
  - Boss-cinematics / animated phase transition (M7 polish).
  - Дополнительные AI behaviors (переиспользуются M3-5 + phase swap).
  - Daily reward rotation / weekly events.
- [ ] Grep `grep -ni "module\|радио\b\|skill[_ ]tree\|cinematic\|cooldown\|active[_ ]ability\|yandex[_ ]sdk\|leaderboard\|pvp\|multiplayer" docs/GDD.md` — все hits должны быть **только в anti-scope блоках** §9.9 или в подсказках вида «M5+/M6/M7/M8».
- [ ] Никаких hits в §9.1-§9.8 (где описывается реальная M5 механика).

**Verdict §5:** PASS / FAIL + цитата.

### §6 Consistency с M4 (regression)

Проверки:
- [ ] `git diff origin/m5-integration..origin/m5/gd-amendment -- docs/GDD.md` показывает только **добавления** в §9 + minor extensions в §6.2 / §6.4. **Никаких deletion** в §1-§8.
- [ ] `git diff origin/m5-integration..origin/m5/gd-amendment -- docs/balance.md` показывает только **добавления** §M5. **Никаких изменений** §M1/§M2/§M3/§M4.
- [ ] Existing 8 mobs (3 M1 + 5 M3) в `content/mobs.json` schema **остаются валидными** под new schema (новые поля optional).
- [ ] M4 perk system / progression / XP curve не изменены.
- [ ] M3 5 AI behaviors не переименованы (boss использует те же `ranged_keep_distance` / `defensive_cover` / etc.).

**Verdict §6:** PASS / FAIL + цитата.

### §7 Recovery-safe + PR hygiene

Проверки:
- [ ] PR base = `m5-integration` (НЕ `main`).
- [ ] PR body содержит Recovery block (см. PR template).
- [ ] PR scope = только 3 файла: `docs/GDD.md` + `docs/balance.md` + `staff/status/GAME_DESIGNER.md`. **Никаких** `content/`, `src/`, `assets/`, чужих `staff/`.
- [ ] PR commits — логические порции (например: «add §9.1-§9.2 boss schema», «add §9.3 flow», «add §M5 balance», «status update»), не один монстр-коммит.
- [ ] PR title ≈ `gd(M5): amendment — Боссы и инстансы (§9 + §6.X + balance §M5)`.

**Verdict §7:** PASS / FAIL + цитата.

## Verdict (итог)

- **APPROVE** — все 7 PASS.
- **CHANGES_REQUESTED** — ≥ 1 FAIL. Каждый блокер пометь:
  - **`**blocker**`** — должен fix перед Content/Engineer/Artist start (cross-spec mismatches, schema breakage, anti-scope violations).
  - **`_non-blocking M5/M6+ follow-up_`** — может пройти, M5 backlog или M6+ kickoff.

**Cross-spec расхождения** (например, GDD §9 boss HP vs balance §M5 boss HP, или GDD `phase_2_behavior_id` vs §5.4 behavior list) — **всегда blocker**. **Не резолвить самостоятельно** (M4 урок: xp_reward §M4 vs §M1/§M3 → QA Spec PR #33 пометил blocker, PM решил через GD fix PR #34).

## DoD (твой)

1. [ ] 7 чек-листов прогнаны, для каждого записан verdict PASS/FAIL с цитатой/обоснованием.
2. [ ] `staff/status/QA.md` обновлён: добавлена секция «# M5 Spec Review» с полным отчётом.
3. [ ] PR `qa/m5-spec-review → m5-integration` Ready (не Draft).
4. [ ] Recovery-safe: первый Draft PR в 5-10 мин (scaffold `staff/status/QA.md` со status: IN_PROGRESS), push после каждого подшага.
5. [ ] PR scope = только `staff/status/QA.md`. Никаких `docs/`, `src/`, `content/`, `assets/`, чужих `staff/`.
6. [ ] Verdict сообщён Alex'у блокирующим с PR link.

## Anti-scope (твой)

- НЕ менять `docs/`, `src/`, `content/`, `assets/`, чужие `staff/` (только `staff/status/QA.md`).
- НЕ self-merge.
- НЕ резолвить cross-spec расхождения (эскалация в PM).
- НЕ verdict APPROVE если хоть один FAIL.

## Ключевые файлы

| Файл | Action |
|---|---|
| `staff/status/QA.md` | MODIFY — добавить секцию «# M5 Spec Review» с полным verdict |

## Cross-refs

- **GD M5** (предыдущий gate): твой verdict — gate для GD M5 merge. Если CHANGES_REQUESTED → GD делает fix PR (`m5/gd-fix → m5-integration`), ты делаешь re-review (новая секция или edit existing в `staff/status/QA.md`).
- **Content / Engineer / Artist M5** (следующий gate): стартуют **только после твоего APPROVE**.
- **QA Acceptance M5** (через 3 PR): прочитает твой verdict + проверит, что fixes (если были) применены.

## Lessons learned M2+M3+M4 (применить)

- **CHANGES_REQUESTED detailed**: каждый блокер с цитатой + reasoning + что должно быть. Не «§9 broken» а «§9.2 forest_alpha_mutant phase_2_behavior_id = `swarm_attack`, но в §5.4 такого behavior нет; должен быть один из 5 existing». 
- **Cross-spec → blocker**: M4 паттерн (PR #33 поймал §M4 vs §M1/§M3 xp_reward mismatch → blocker → PM resolved via fix PR #34 option a). Применяй так же.
- **Anti-scope grep**: M3+M4 урок — реально прогонять grep командой, не «на глаз». Цитата с line number.
- **Recovery-safe**: Draft PR в 5-10 мин (scaffold `staff/status/QA.md` достаточно), push после §1-3, push после §4-7, push verdict.

База для твоего PR: `m5-integration` (НЕ `main`).
