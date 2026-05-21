# Handoff: QA Acceptance — Веха M4

> **Роль:** QA Engineer (acceptance-review с локальным octopus-merge)
> **Веха:** M4 — Перки и прогрессия
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m4-integration`
> **Твой PR-branch:** `qa/m4-acceptance`
> **PR base:** `m4-integration` (НЕ `main`)

---

## Preconditions

- [x] **3 role-PR Ready** (не Draft):
  - `m4/content → m4-integration`
  - `m4/progression → m4-integration`
  - `m4/art → m4-integration`
- [x] PM сообщил тебе: «3 role-PR Ready, стартуй QA Acceptance M4».

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/roles/QA.md` | Твоя роль |
| `staff/status/M4.md` | M4 scope, anti-scope, DoD |
| `staff/handoff/M3-SUMMARY.md` | M3 acceptance паттерн (3 Gate'а + octopus-merge) |
| `docs/GDD.md` §Прогрессия + §6.X | Спека |
| `docs/balance.md` §M4 | Числа для сверки |
| 3 role-PR diff'ы | Содержание изменений |

---

## Локальный octopus-merge (обязательно, lesson M3)

Цель: поймать cross-PR конфликты ДО того, как PM начнёт sequential merge.

```bash
git checkout m4-integration
git fetch origin
git checkout -b qa/m4-acceptance-test
git merge origin/m4/content origin/m4/progression origin/m4/art
# должно merge clean
# если конфликты — REPORT TO PM, НЕ резолвь сам
```

Если octopus-merge clean — на этой ветке запускай 3 Gate'а ниже.

---

## 3 Gate'а

### Gate 1 — Static checks

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

Все команды должны exit 0. `npm run test` count:
- M2 baseline: 49 тестов.
- M3 addition: 40 тестов.
- M4 addition: ≥ 20 тестов (≥ 10 xp + ≥ 10 perks).
- **Total ≥ 109 vitest passed**, 0 failed.

`npm run build` produces `dist/` ≤ 2 MB total.

### Gate 2 — Runtime smoke

`npm run dev`, в Chrome `http://127.0.0.1:5173/`:

#### 2.1 M2 7-step Forest regression (не сломали M2)

1. Стартовая база. Открыть MapScene. Лес.
2. CombatScene с маrauder/wild_dog/mutant. Использовать knife + makeshift_pistol.
3. Лут падает. Поднять.
4. Return на базу. Weight penalty корректен.
5. CraftScene. Скрафтить knife / makeshift_pistol.
6. State persists in session (refresh ломает — ок, M8 fix).
7. Death → restart works.

#### 2.2 M3 multi-zone navigation (не сломали M3)

1. После crafting `pipe_rifle` — открывается зона **Warehouse** в MapScene.
2. Сорти в Warehouse, бой с мобом из M3 (например, sniper), zone-exclusive ресурс (electronics / oil).
3. City пока locked (откроется на M5 после boss). Locked badge видим.
4. **RadioScene** открывается из BaseScene, 3 dummy signals видны, rowHeight ≥ 120 (не наезжают).

#### 2.3 M4 progression flow (новое)

1. **XP gain:** kill моба → видишь `+N XP` (notification / лог).
2. **Level-up trigger:** после нескольких kill'ов достигаешь threshold → открывается `LevelUpScene` popup.
3. **3 random perks:** popup показывает 3 perk-карточки (icon 64×64 + name + description).
4. **Choice apply:** выбираешь 1 перк → popup закрывается → возврат на исходную сцену.
5. **ProgressionScene** (или таб на BaseScene) показывает:
   - Текущий уровень.
   - XP-bar (текущий XP / threshold к следующему уровню).
   - Список взятых перков.
6. **Perk applies:** выбираешь, например, `sharp_blade` (+15% damage). Следующий бой — урон выше, чем без перка.
7. **Multiple level-ups:** возможны (зависит от GDD overkill решения).

#### 2.4 M3 follow-ups verify

- `src/scenes/RadioScene.ts` — `rowHeight >= 120`. Визуально — 3 signals не наезжают друг на друга.
- `src/scenes/BootScene.ts` — preload содержит ALL M3 ассеты (mob sprites + item icons + zone backgrounds + radio_icon). Проверка через grep на `preload`.
- `src/types/mob.ts` (или соседний) — есть `export type MobRole = "regular" | "boss"`. Existing string literal в zoneUnlock.ts мигрирован.

### Gate 3 — Spec compliance

#### 3.1 Anti-scope greps (должны давать 0 hits)

```bash
grep -rni "skill[_ ]tree\|skill[_ ]point\|active[_ ]ability\|cooldown" src/
# Hits должны быть 0 (или только в комментариях как "M5+ refactor").

grep -rni "boss" src/
# Hits только в типах MobRole / комментариях / zoneUnlock locked city — НЕ как реальная боссовая логика.

grep -rni "ysdk\|yandex" src/
# 0 hits.
```

#### 3.2 `content/perks.json` validation

- `cat content/perks.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))"` → 8.
- Все 8 имеют `id / name / description / type / value / stat`.
- Все `id` совпадают с `balance.md` §M4.
- Все `type / stat / value` строго из `balance.md` §M4 (cross-ref).

#### 3.3 Engineer integration check

- `grep -n "applyPerk\|getModifier" src/` — есть импорты в combat / weight / craft / loot.
- `grep -n "awardXP" src/` — есть вызов в CombatScene при kill моба.
- `grep -n "LevelUpScene" src/` — есть scene.launch при `leveledUp: true`.

#### 3.4 GD <-> Content <-> Engineer consistency

- 8 perk-id в `balance.md` §M4 = 8 perk-id в `content/perks.json` = 8 PerkId enum / strings в `src/` (`grep -ni "tough_skin\|sharp_blade\|lean_pack\|lucky_scavenger\|keen_eye\|reinforced_plates\|quick_hands\|fast_learner" src/`).
- 8 perk-icon файлов в `assets/sprites/perks/` соответствуют 8 perk-id (`ls assets/sprites/perks/`).

---

## Verdict

**APPROVE** если все 3 Gate'а PASS. Запиши:
- Total vitest count.
- Bundle size.
- Anti-scope grep results (0 hits).
- Список **non-blocking M5 follow-ups** (если есть — например, «overkill XP behavior неоптимален», «LevelUpScene не показывает which stat affected by current perks», «no balance playtest done — числа могут быть off»).

**CHANGES_REQUESTED** если хотя бы 1 Gate fail. Запиши блокеры (с точной причиной + цитатой / grep'ом). НЕ резолвь сам.

Отчёт пиши в:
- `staff/status/QA.md` — секция «# M4 Acceptance Review» (полный отчёт).
- PR body `qa/m4-acceptance → m4-integration` — copy того же verdict'а + Recovery block.

---

## Definition of Done (твой чек-лист перед PR)

- [ ] Локальный octopus-merge `qa/m4-acceptance-test` clean.
- [ ] Gate 1 (static) PASS.
- [ ] Gate 2 (runtime smoke) PASS — 7-step M2 + multi-zone M3 + M4 progression flow + M3 follow-ups.
- [ ] Gate 3 (spec compliance) PASS — anti-scope greps 0 hits + content/perks.json cross-ref + Engineer integration.
- [ ] Verdict в `staff/status/QA.md` (полный).
- [ ] PR `qa/m4-acceptance → m4-integration` открыт с verdict'ом в body.
- [ ] Alex уведомлён.

---

## FORBIDDEN

- Self-merge. Merge role-PR в m4-integration — НЕ твоя задача (это PM после APPROVE).
- Изменять `docs/`, `src/`, `content/`, `assets/`. Только `staff/status/QA.md` + (опц.) `tools/qa/gate3_m4_check.py`.
- PAT в URL / echo / print.
- Verdict APPROVE если есть нарушения anti-scope (M5+ как M4 features).
- Резолвить cross-PR конфликты в octopus-merge — это эскалация в PM.

---

## Процедура

1. Клонируй репо, `git checkout m4-integration`, `git fetch origin`. Прочитай файлы из «Контекст».
2. Локальный octopus-merge на `qa/m4-acceptance-test`.
3. Прогони Gate 1 → Gate 2 → Gate 3 последовательно.
4. Запиши verdict в `staff/status/QA.md`.
5. Открой PR `qa/m4-acceptance → m4-integration` (одна правка — `staff/status/QA.md`, опц. `tools/qa/gate3_m4_check.py`).
6. Сообщи Alex'у блокирующим.

Token-budget: эта задача — ~30 минут чтения + 60-120 минут тестов + 30 минут отчёта. Continuation возможна — push partial Gate 1 / Gate 2 results в Draft PR.
