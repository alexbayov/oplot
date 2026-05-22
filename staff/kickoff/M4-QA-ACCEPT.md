# Kickoff: QA Acceptance — Веха M4

Ты — **QA Engineer** на этапе **acceptance-review** вехи M4 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M4-QA-ACCEPT.md`

## Когда стартуешь

После того как PM сообщает: «3 role-PR Ready (Content + Engineer + Artist), стартуй QA Acceptance M4».

## Действуй так:

1. Клонируй репо и переключись на интеграционную ветку M4:
   ```
   git clone https://github.com/alexbayov/oplot.git
   cd oplot
   git checkout m4-integration
   git fetch origin
   ```
2. Прочитай:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M4.md`
   - `staff/handoff/M4-QA-ACCEPT.md` (твой брифинг)
   - `staff/handoff/M3-SUMMARY.md` (как делался M3 QA Acceptance — образец 3 Gate'а)
   - GDD §Прогрессия + balance §M4 (на что валидировать)
3. **Локальный octopus-merge** (lesson M3 — обязательно):
   ```
   git checkout -b qa/m4-acceptance-test
   git merge origin/m4/content origin/m4/progression origin/m4/art
   # должно merge clean; если конфликты — REPORT TO PM, НЕ резолвь сам
   ```
4. Прогони **3 Gate'а** (см. handoff §«Чек-листы»):
   - **Gate 1 — Static:** `npm install && npm run typecheck && npm run lint && npm run test && npm run build` — все clean. Vitest count ≥ 89 (M2+M3 baseline) + ≥ 20 M4 (xp + perks) = ≥ 109 tests, все PASS.
   - **Gate 2 — Runtime smoke:** `npm run dev`, в Chrome `http://127.0.0.1:5173/`:
     - M2 7-step Forest regression PASS (knife + makeshift_pistol, loot, return, craft).
     - M3 multi-zone navigation PASS (Forest + Warehouse после crafting `pipe_rifle`).
     - **M4 progression PASS:** убить моба → XP награждается → достичь level threshold → открывается LevelUpScene с 3 рандомными перками → выбор применяется → ProgressionScene отображает текущий уровень + список перков + XP-bar.
     - **M3 follow-ups verify:** RadioScene rowHeight ≥ 120 (3 signals не наезжают), BootScene preload завершён до перехода в BaseScene (нет lazy load в RadioScene/MapScene), `MobRole` enum в `src/types/mob.ts` есть.
   - **Gate 3 — Spec compliance:** `python3 tools/qa/gate3_spec_check.py` (M3 скрипт; на M4 расширить или дописать новый `gate3_m4_check.py`), плюс grep'ы:
     - `grep -r "skill_tree\|skill_points\|active_ability\|cooldown" src/` → 0 hits (anti-scope M4).
     - `grep -r "boss\|ysdk\|yandex" src/` → 0 hits (anti-scope M5/M8).
     - `content/perks.json` items = 8, все имеют `id / name / description / type / value / stat`, все `value` совпадают с `balance.md` §M4.
     - `src/` импортирует `content/perks.json`, не хардкодит numbers.
5. Открой PR `qa/m4-acceptance → m4-integration` с полным отчётом в body + verdict (APPROVE / CHANGES_REQUESTED). Параллельно — обнови `staff/status/QA.md` секция «# M4 Acceptance Review».
6. Если **APPROVE**: список non-blocking M5 follow-ups (если есть).
7. Если **CHANGES_REQUESTED**: блокеры → передаёшь PM, не пытаешься фиксить сам.
8. Сообщи Alex'у блокирующим: «QA Acceptance M4 verdict <APPROVE|CHANGES_REQUESTED>, PR <ссылка>».

## Можно параллельно с

Никем (sequential after все 3 role-PR Ready).

## Нельзя до

Все 3 role-PR Ready (`m4/content` + `m4/progression` + `m4/art`).

## Запрещено

- Self-merge. Merge role-PR в m4-integration — НЕ твоя задача (это PM).
- Изменять `docs/`, `src/`, `content/`, `assets/` — только `staff/status/QA.md` + `tools/qa/gate3_m4_check.py` (если решишь дописать).
- PAT в URL / echo / print.
- Verdict APPROVE если есть нарушения anti-scope (M5+ skill tree / active / boss / SDK упоминания в `src/`).
- Резолвить cross-PR конфликты в octopus-merge — это эскалация в PM.

База для твоего PR: `m4-integration` (НЕ `main`).
