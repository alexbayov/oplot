# Kickoff: QA Acceptance — Веха M5

Ты — **QA Engineer** на этапе **acceptance review** вехи M5 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M5-QA-ACCEPT.md`

## Когда стартуешь

После того как **все 3 role-PR Ready**: Content M5 (`m5/content`), Engineer M5 (`m5/world`), Artist M5 (`m5/art`). Это **последний gate** перед PM merge sequence + gate-close.

## Действуй так:

1. Клонируй репо, переключись на `m5-integration` (`git checkout m5-integration && git pull`).
2. Прочитай:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M5.md`
   - `staff/handoff/M5-QA-ACCEPT.md` (твой брифинг с 3 Gate'ами)
   - `staff/handoff/M4-SUMMARY.md` (M4 baseline что нельзя сломать: 128 vitest, 11 scenes, build ~1.5 MB, ассеты ~259 KB)
   - `staff/handoff/M3-SUMMARY.md`
   - `docs/GDD.md` §9 (M5 spec ground-truth)
   - `docs/balance.md` §M5 (числа ground-truth)
3. **Локальный octopus-merge** (M3+M4 урок: ловим cross-PR конфликты ДО PM merge sequence):
   ```
   git checkout -b qa/m5-acceptance-test m5-integration
   git fetch origin m5/content m5/world m5/art
   git merge --no-ff origin/m5/content origin/m5/world origin/m5/art
   ```
   - Если conflict → блокер, эскалируй владельцам конфликтующих файлов.
   - Если clean merge → переходи к Gate 1.
4. Напиши **короткий план** (5-7 пунктов):
   - Gate 1 (static): `npm install && npm run typecheck && npm run lint && npm run test && npm run build`. Проверки: typecheck/lint clean, vitest **≥ 148** (128 M4 baseline + 20 M5), build ≤ 2 MB.
   - Gate 2 (runtime smoke): запустить dev server / Chrome. Проверки: 7-step Forest MVP regression (M2 baseline) + multi-zone navigation (M3) + RadioScene flow (M3) + ProgressionScene + LevelUpScene (M4) + **boss-fight 2-phase** (M5: spawn moba role:"boss" → phase 1 visible → HP<threshold → phase 2 visible + sprite swap + behavior_id swap) + **дейли-инстанс** (M5: после kill boss, MapScene показывает кнопку «Дейли», 24h cool-down работает с timestamp ms) + **газовая зона** (M5: warehouse depth 2 без gas_mask → -damage/turn видно в CombatScene HUD; с gas_mask — нет damage) + **T3 craft** (M5: после boss-drop в инвентаре → CraftScene показывает T3 recipe → craft → slot replacement) + **LevelUpScene overkill queue** (M5 NB follow-up M4).
   - Gate 3 (spec compliance): анти-скоуп grep + JSON validation + balance/content/code consistency.
   - Verdict: **APPROVE** (все 3 Gate'а PASS) или **CHANGES_REQUESTED** (≥ 1 FAIL).
   - Записать verdict в `staff/status/QA.md` секция «# M5 Acceptance».
5. Отправь Alex'у блокирующим: «План готов, жду апрува PM».
6. После апрува — `git checkout -b qa/m5-acceptance`, scaffold `staff/status/QA.md` (секция M5 Acceptance, status: IN_PROGRESS) + push + **Draft PR `qa/m5-acceptance → m5-integration`** (recovery-safe).
7. Прогон Gate 1 + Gate 2 + Gate 3, push после каждого Gate'а.
8. Финальный verdict + push, flip Draft → Ready.
9. Сообщи Alex'у блокирующим: «QA Acceptance M5 verdict <APPROVE|CHANGES_REQUESTED>, PR <ссылка>, vitest <X>, build <Y> MB, ассеты <Z> KB».

## Можно параллельно с

Никем (sequential after Content + Engineer + Artist M5 PR Ready).

## Нельзя до

Все 3 role-PR Ready: `m5/content`, `m5/world`, `m5/art`.

## Запрещено

- Self-merge.
- Изменять `docs/`, `src/`, `content/`, `assets/`, чужие `staff/` (только `staff/status/QA.md`).
- Verdict APPROVE если хотя бы 1 Gate FAIL (даже cosmetic).
- PAT в URL / echo / print.
- План > 7 пунктов.
- **Резолвить cross-spec / cross-PR расхождения самостоятельно** — эскалация в PM (M4 урок).

## Anti-scope greps (Gate 3 обязательно)

В `src/` и `content/`:
```
grep -rni "module_weapon\|weapon_module\|attachment\|skill[_ ]tree\|skill[_ ]point\|cooldown\|yandex[_ ]sdk\|leaderboard\|cloud[_ ]save\|pvp\|multiplayer\|cinematic\|trust[_ ]level\|radio[_ ]reward" src/ content/
```
Hits должны быть **только в комментариях** (вида `// M5+ TODO` / `// M6+`) — никаких runtime / config / data references. Если есть hits с реальными формулами / fields / JSON keys → **blocker**.

## DoD-precision (Gate 3)

Точные числа из M5 DoD (`staff/status/M5.md`):
- 3 boss в `content/mobs.json` (mobs total = 11).
- 3 boss-drop + 3 T3 в `content/items.json` (items total = 35).
- 3 T3 recipes в `content/recipes.json` (recipes total = 18).
- 3 zones обновлены в `content/zones.json` (boss_id заполнен на forest/warehouse/city; is_gas=true на warehouse+city depth=2..3).
- 10 ассетов M5 (3 boss + 3 boss-drop + 3 T3 + 1 gas-overlay).
- 148 vitest (128 M4 + 20 M5).
- Project assets ≤ 600 KB, M5-add ≤ 80 KB.
- Build ≤ 2 MB.

Если число — «≥X» вместо точного «X» → FAIL (M3+M4 урок).

## При CHANGES_REQUESTED verdict

Каждый блокер пометь:
- **`**blocker**`** — должен fix перед PM merge sequence.
- **`_non-blocking M6+ follow-up_`** — может пройти, записать в M6 backlog.

Cross-PR conflicts, vitest fail, anti-scope hits в runtime — всегда **blocker**.

База для твоего PR: `m5-integration` (НЕ `main`).
