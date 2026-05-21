# M3 — Расширение мира: Summary

**Веха:** M3
**Название:** Расширение мира
**Период:** 2026-05-20 → 2026-05-21
**Gate-close:** ожидает PR `m3-integration → main` (открывает PM; на M3 merge делегирован Alex'ом PM-сессии, см. §5 Lessons / git-thread «гитпат выдам свой если надо — мерж на тебе»).

---

## 1. Что было целью

Расширить мир «Оплота» с одной зоны (Лес M2) до **3 зон** с биом-уникальными мобами, ресурсами и крафтом — оставив core-loop M2 без изменений.

Концептуально (PLAN §3 + GDD M3-amendment):

1. Игрок видит на `MapScene` 3 зоны: **Лес** (M2, всегда доступен), **Склад** (новая, unlock = recipe `pipe_rifle`), **Город** (новая, unlock = `boss_defeated_warehouse_boss` — заранее под M5, но в M3 zone остаётся залоченной).
2. В каждой зоне свой пул мобов (3 forest mobs M2 + 5 новых, всего 8). 5 новых мобов имеют **разные AI-поведения** (не reuse M2 baseline): `berserker`, `ambush`, `shieldbearer`, `leader`, `spawner`.
3. Каждая новая зона даёт **zone-exclusive ресурсы** (warehouse → electronics + oil, city → medical_supplies + circuitry) — мотивация исследовать.
4. Крафт расширен с 5 рецептов до 15 (5 M2 + 10 новых T2): pipe_rifle / crowbar (оружие), tactical_vest / helmet / gas_mask (броня), large_medkit / energy_drink / emp_grenade / smoke_bomb / ammo_rifle (расходники).
5. Появляется **RadioScene** — UI-заглушка вкладки «Радио» на базе: список входящих сигналов (3 dummy) + кнопки «Принять» / «Игнорировать», обе **только меняют local state без последствий** (полная логика — M6).
6. Веc-механика M2 остаётся, но теперь зона может умножать `return_time_s` через optional `Zone.return_time_multiplier` (forest = 1.0 default, warehouse = 1.2, city = 1.4 по `balance.md` §M3).
7. Anti-scope: нет перков / XP / уровней (M4), нет боссов / T3 чертежей / инстансов (M5), нет полной радио-логики / репутаций (M6), нет модулей оружия, нет Yandex SDK (M8).

Спека M3 финализирована GD M3-amendment'ом (`docs/GDD.md` §5.4 / §6.2 / §6.4.M3 / §10.M3 + `docs/balance.md` §M3, PR #21) и подтверждена QA Spec APPROVE (PR #22) по 7 чек-листам.

## 2. Что вошло в `m3-integration`

### Content (PR #25 `m3/content → m3-integration`, merged 2026-05-21 PM)

JSON-only. M1 baseline не тронут — все правки строго инкрементальные.

- **`content/mobs.json`**: +5 мобов (всего 8). Новые — `looter_berserker` (warehouse, behavior `berserker`), `looter_ambusher` (warehouse, behavior `ambush`), `looter_shieldbearer` (city, behavior `shieldbearer`), `looter_leader` (city, behavior `leader`), `mutant_spawner` (city, behavior `spawner`). Каждый соответствует Mob schema (`docs/GDD.md` §6.2) с обязательным `behavior_id` (см. §5.4) и пред-обновлённым `mech` enum.
- **`content/items.json`**: +14 items (всего 29). Разбивка по `balance.md` §M3: 4 zone-exclusive ресурса (`electronics`, `oil` — warehouse; `medical_supplies`, `circuitry` — city), 2 T2-оружия (`pipe_rifle`, `crowbar`), 3 T2-брони (`tactical_vest`, `helmet`, `gas_mask`), 5 T2-расходников (`large_medkit`, `energy_drink`, `emp_grenade`, `smoke_bomb`, `ammo_rifle`).
- **`content/recipes.json`**: +10 рецептов (всего 15). Все T2, по `balance.md` §M3 (10 рецептов = 2 weapons + 3 armor + 5 consumables). Ингредиенты ссылаются строго на M1 + M3 items, нет «висячих» refs.
- **`content/zones.json`**: +2 зоны (всего 3) — `warehouse` (depth_max=2, zone-exclusive `electronics`+`oil`, mob pool 3 ref'а, `unlock_condition = recipe_unlocked:pipe_rifle`, `return_time_multiplier = 1.2`) и `city` (depth_max=3, zone-exclusive `medical_supplies`+`circuitry`, mob pool 3 ref'а, `unlock_condition = boss_defeated:warehouse_boss` — заранее под M5, `return_time_multiplier = 1.4`). Forest без `return_time_multiplier` → default 1.0 (M2 формула не меняется).
- **`content/radio.json`**: +3 dummy signal'а (`distress_call_1`, `merchant_offer_1`, `faction_recruit_1`). Каждый — title + body + список 2 опций (accept/ignore), без `consequences` / `reward` / `faction_trust_delta` (это M6 поля, явно НЕ добавлены).

**Контент-валидация (Gate 3 QA Acceptance):**

- Cross-refs `mobs → drop_table → items` все resolve (`python3 gate3_spec_check.py` 0 errors).
- Cross-refs `recipes → ingredients → items` все resolve.
- Cross-refs `zones → mobs` все resolve.
- M1 forest mobs неизменны (`marauder`, `wild_dog`, `mutant`).
- Numbers совпадают с `balance.md` §M3 (HP / damage / drop_rate / weight / craft_time / unlock_condition'ы).

### Engineer (PR #26 `m3/world → m3-integration`, merged 2026-05-21 PM)

5 новых модулей в `src/systems/` + 1 новая сцена + расширение M2 модулей. Все вне Phaser API (за исключением scene file'а) — под unit-тесты.

**Системы (Phaser-free):**

- `src/systems/mobAI.ts` — 5 behaviors (`berserker` / `ambush` / `shieldbearer` / `leader` / `spawner`). Каждое реализовано как pure `function decideAction(mob, allies, enemies, turnState): MobAction`. **15 vitest тестов** (3 на behavior × 5 behaviors), все зелёные.
- `src/systems/zoneUnlock.ts` — `isZoneUnlocked(zoneId, gameState): boolean`. Поддерживает unlock_condition типов `recipe_unlocked:{recipe_id}` (warehouse) и `boss_defeated:{boss_id}` (city — placeholder под M5, всегда `false` пока). **11 vitest тестов** (default forest, recipe-unlock warehouse, boss-unlock city locked).
- `src/systems/radio.ts` — pure-data слой: `loadSignals`, `acceptSignal`, `ignoreSignal`. Никакой логики ветвлений / consequences / faction trust (явно `// TODO M6`). **9 vitest тестов** (loading, accept-marks-as-read, ignore-marks-as-read, idempotent).
- `src/systems/weight.ts` — расширен на `computeReturnTime(curWeight, maxWeight, zoneMultiplier = 1)`. Формула: `BASE_RETURN_TIME_S * (1 + (cur/max) * WEIGHT_PENALTY_FACTOR) * zoneMultiplier`. M2 behavior сохранён (zoneMultiplier default 1.0). **+4 vitest теста** на zoneMultiplier (forest 1.0, warehouse 1.2, city 1.4, edge max=0).

**Сцены (Phaser):**

- `src/scenes/MapScene.ts` — расширен на динамический спавн 3 кнопок зон с `isZoneUnlocked` визуальным гейтингом (залоченная зона — серая, не кликабельная).
- `src/scenes/RadioScene.ts` — **NEW.** UI-stub: список входящих сигналов из `content/radio.json` (`title` + `body` truncated), кнопки `Принять` / `Игнорировать` — обе вызывают `acceptSignal`/`ignoreSignal` (`radio.ts`) и обновляют list. **Никакой реальной логики** (явно `// TODO M6 — branching / consequences / rewards`).
- `src/scenes/BaseScene.ts` — расширен на кнопку «Радио» → переход в RadioScene.
- `src/scenes/ReturnScene.ts` — расширен на чтение `currentSortie.zone.return_time_multiplier` для формулы (forest без него → 1.0).

**State:**

- `src/state/GameState.ts` — расширен на `radio: { signalsRead: string[] }` для радио-state.
- `src/state/balance.ts` — без новых констант (все зональные multiplier'ы лежат в `content/zones.json`, не в коде).

**Тесты + build:**

- **89/89 vitest passed** (49 M2 baseline + 40 M3 = 15 mobAI + 11 zoneUnlock + 9 radio + 4 weight + 1 integration).
- `npm run typecheck` clean, `npm run lint` clean, `npm run build` clean.
- Production bundle: ~1.5 MB JS (≈350 KB gzip) — под бюджет 2 MB Yandex Games.

### Artist (PR #27 `m3/art → m3-integration`, merged 2026-05-21 PM)

Все ассеты сгенерированы детерминистично через `tools/art/gen_m3_assets.py` (Pillow, seed-fixed) — что важно для воспроизводимости + ревью.

- **5 mob sprites** (128×128, PNG с прозрачным фоном): `looter_berserker.png`, `looter_ambusher.png`, `looter_shieldbearer.png`, `looter_leader.png`, `mutant_spawner.png`. Стиль соответствует style-guide (placeholder pipeline M1, painted-ish силуэт + bold контур).
- **14 item icons** (64×64): icons для всех новых items (4 ресурса + 2 weapons + 3 armor + 5 consumables). Имена ассетов `item_{resource_id}.png` — точное совпадение с `content/items.json:resource_id` (как требует Loader convention из M1).
- **2 background sprites** (800×600): `bg_warehouse.png` (тёмный indoor с balochnyмi rays of light), `bg_city.png` (ruined outdoor с silhouettes зданий).
- **1 UI icon**: `radio_icon.png` (64×64) для кнопки «Радио» на BaseScene.

**Бюджет:**

- M3 add-only: **129.8 KB / 500 KB budget** (26%).
- Project total: 211.1 KB (M1 81.3 KB + M3 129.8 KB), под общим долгосрочным бюджетом ≤ 600 KB.
- M1 ассеты не пересоздавались (hero, 8 item icons, forest background — байт-в-байт).

### QA Acceptance (PR #28 `qa/m3-acceptance → m3-integration`, merged 2026-05-21 PM)

**Подход:** локальный octopus-merge всех 3 role-PR в ветку `qa/m3-acceptance-test` перед review — чтобы поймать cross-PR конфликты до PM merge sequence. Single-pass: **APPROVE** с первого захода.

**Gate 1 — Static checks:**

- `npm run typecheck`: clean.
- `npm run lint`: clean (eslint).
- `npm run build`: clean (Vite production).
- `npm run test`: **89/89 vitest passed**.

**Gate 2 — Runtime smoke (Chrome desktop):**

- M2 7-step regression (Forest, knife + makeshift_pistol, loot, return, craft) — все шаги работают, ReturnScene показывает `30s` для пустого рюкзака.
- RadioScene открывается из BaseScene, список 3 сигналов видим, accept/ignore меняет UI state (помеченные read'ом disappear из active list), никаких ошибок console.
- MapScene показывает 3 зоны, forest активен, warehouse залочен (отображает hint «Скрафти pipe_rifle»), city залочен (отображает hint «Победи босса warehouse» — M5 placeholder ожидаемо).
- После crafting `pipe_rifle` warehouse разлочивается → MapScene при повторном входе показывает активной зоной → SortieScene в warehouse работает → новые мобы спавнятся с правильным AI → `return_time` ×1.2.

**Gate 3 — Spec compliance (`python3 gate3_spec_check.py`):**

- `content/radio.json` без полей `consequences` / `reward` / `faction_trust_delta` — 0 нарушений (M6 anti-scope).
- `src/` без перков (`grep -r "perk"` 0 hits), без боссов (`grep -r "boss"` 0 hits в src/, кроме string literal placeholder в zoneUnlock comment), без trust/reputation system (M6), без модулей оружия (`grep -r "module"` только Vite-internal), без Yandex SDK (`grep -r "ysdk\|yandex"` 0 hits) — все anti-scope границы соблюдены.
- `content/items.json` items count = 29 (точно по DoD-align PR #24), mobs = 8, recipes = 15, zones = 3, radio signals = 3.
- Numbers в `content/*.json` совпадают с `docs/balance.md` §M3 (mob HP/damage, item weight, recipe craft_time, drop rates).

**Verdict: APPROVE.** 0 blockers / 0 major / **3 non-blocking M4 follow-ups (cosmetic, не препятствуют закрытию M3):**

1. `RadioScene` `rowHeight = 96` слишком тесно для 3+ signals — на M4 поднять до 120 (UX-минор).
2. `BootScene` не preload'ит M3 ассеты в Loader (текущий fallback — lazy load в RadioScene/MapScene), на M4 добавить preload step для smoother first-paint (perf-минор).
3. `MobType:"boss"` строкой уже встречается в `zoneUnlock.ts` (как `boss_defeated:warehouse_boss` placeholder) — на M5 при добавлении настоящего босса формализовать enum `MobRole = "regular" | "boss"` (тех-долг минор).

### PM (PR #20 + #23 + #24 + #29 — orchestration only, ни одной строки кода/контента/ассетов)

- **PR #20 `pm/m3-kickoff → m3-integration`**: M3 dashboard + 6 kickoff (GD / QA Spec / Content / Engineer / Artist / QA Acceptance) + 6 handoff материалов + обновление PLAN/CONTEXT/LINKS/CHANGELOG. Merged 2026-05-20 PM.
- **PR #23 `pm/m3-status-sync → m3-integration`**: первый status-sync — после merge spec phase (#20/#21/#22) обновить dashboard'ы под факт. Merged 2026-05-21 PM.
- **PR #24 `pm/m3-dod-align-items → m3-integration`**: DoD-align — `staff/handoff/M3-CONTENT.md` + `staff/kickoff/M3-CONTENT.md` + `staff/status/M3.md` DoD §3 формулировка items с «≥30 (~15 новых)» → «29 (14 новых по balance §M3)». Без GD-amendment'а (spec уже QA-APPROVED, изменение only в PM-owned файлах). Merged 2026-05-21 PM.
- **PR #29 (этот файл) `pm/m3-finalize → m3-integration`**: gate → `M3_DONE_PENDING_GATE_CLOSE`, M3-SUMMARY (этот файл), CHANGELOG entry, обновление `staff/status/{M3,PM}.md`, `staff/{CONTEXT,LINKS,STATE_MACHINE}.md`, `staff/PLAN.md`. После merge — PM открывает gate-close PR `m3-integration → main`.

## 3. Финальная сверка с GDD / balance / handoff

| Источник | Требование | Факт |
|---|---|---|
| GDD §5.4 | 5 новых мобов с `behavior_id` (berserker / ambush / shieldbearer / leader / spawner) | OK — `content/mobs.json` (5 новых, всего 8); `src/systems/mobAI.ts` реализует все 5 behaviors с 15 vitest |
| GDD §6.2 | Mob schema расширена `mech` enum + optional `behavior_id` | OK — `src/types/mob.ts` обновлён, JSON валидируется |
| GDD §6.4.M3 | 2 новые зоны (warehouse / city) с zone-exclusive ресурсами и `unlock_condition` | OK — `content/zones.json`; `src/systems/zoneUnlock.ts` + MapScene gating |
| GDD §6.4.M3 | Zone schema: optional `return_time_multiplier?: number` (forest default 1.0) | OK — `src/types/zone.ts` + `weight.ts:computeReturnTime` принимает третий аргумент |
| GDD §10.M3 | RadioSignal JSON schema (title + body + options[]) **без** consequences / reward / faction_trust_delta | OK — `content/radio.json` 3 dummy signals без M6 полей; Gate 3 grep verification |
| GDD §10.M3 | RadioScene UI-stub: list signals + accept/ignore (только local state, без real logic) | OK — `src/scenes/RadioScene.ts` + `src/systems/radio.ts` (TODO M6 явно) |
| balance.md §M3 | 5 mob stat tables + 14 items + 10 recipes + 2 zones + numbers | OK — `content/*.json` numbers совпадают (QA Gate 3 verified) |
| balance.md §M3 | items = 29 (15 M1 + 14 M3: 4 zone-exclusive + 2 weapons + 3 armor + 5 consumables) | OK — Content PR #25 + DoD-align PR #24 |
| PLAN §3 M3 | 3 зоны, 8 мобов, 15 рецептов, радио-заглушка | OK — `content/zones.json` (3), `mobs.json` (8), `recipes.json` (15), `radio.json` (3 dummy + RadioScene stub) |
| PLAN §3 anti-scope | Нет перков (M4), нет боссов (M5), нет полной радио-логики (M6), нет модулей, нет Yandex SDK (M8) | OK — Gate 3 grep'ы все 0 hits в `src/` (boss-строка только как placeholder в zoneUnlock комментарии) |
| PLAN §5 DoD | Все 49 M2 vitest + новые M3 тесты зелёные | OK — 89/89 (49 + 40) |
| PLAN §5 DoD | Bundle ≤ 2 MB, без console.error, грузится в Chrome | OK — ~1.5 MB JS / ~350 KB gzip; Gate 2 runtime smoke clean |
| PLAN §5 DoD | M1/M2 не сломаны (regression) | OK — 49 M2 тестов passed, 7-step Forest runtime PASS на Gate 2 |

## 4. Что НЕ вошло в M3 (anti-scope, отложено)

- **M4 — Перки и прогрессия:** XP, уровни, 8 перков, UI прогрессии. Триггер активации: после gate-close M3 → PM открывает M4 kickoff (`staff/PLAN.md` §3).
- **M5 — Боссы и инстансы:** мини-боссы в зонах (включая warehouse_boss для city unlock), дейли-инстанс, чертежи T3. `zoneUnlock.ts:boss_defeated:warehouse_boss` остаётся placeholder'ом до M5.
- **M6 — Радио и доверие:** полная радио-логика — branching ответов, consequences, faction trust, засады, награды. RadioScene M3 — UI-only stub; signals помечаются read'ом, но никакого реального эффекта.
- **M7 — Полировка и баланс:** UI-звуки, анимации сцен (current 0 анимаций), частицы, 9 зон (текущие 3), 80+ items (текущие 29).
- **M8 — Yandex SDK + мобилка:** реклама, IAP, облачный сейв, mobile-first layout. Текущий — desktop Chrome.
- **Модули оружия:** изначально планировались как stretch M3, отложено под M5 (вместе с T3-чертежами).
- **Звук:** ни одного звукового файла в `assets/audio/` (M7).
- **Реальный финальный арт:** sprites M3 — placeholder-style по `style-guide.md` M1 pipeline. Финальный «Military Graphic Novel» арт — M7.

## 5. Lessons learned (для M4+)

### Token-budget (PRESERVED from M2)

На M2 Engineer-сессия с планом 13 пунктов сожгла лимит на step 13 — пропустила ReturnScene. На M3 **все 3 role-сессии (Content / Engineer / Artist) имели план 5-7 пунктов** + 1 recovery-fix у Content (`b9a215f → 0824db6`, accidental staff/ revert восстановлен) — работает. На M4 продолжаем: план role-сессии **≤ 5-7 действий**, иначе continuation.

### Recovery-safe early Draft PR + commit/push after each substep (PRESERVED from M2)

Все 4 M3 role-PR (#21 GD, #22 QA Spec, #25 Content, #26 Engineer, #27 Artist, #28 QA Acceptance) **открылись как Draft в первые 5-10 минут**, с PR Recovery block. Это вторая веха подряд, где правило работает безотказно. На M4 — обязательно для всех role-сессий + PM-сессии.

### PAT-hygiene (PRESERVED from M2)

PAT только в Authorization header или env var, никогда в URL / echo / print. На M3 PM-сессия finalize'а использовала `$GITHUB_PAT_ALEXBAYOV` через **GIT_ASKPASS shell-скрипт**, выдающий пароль на password-prompt — токен не появлялся в командной строке, в логах, в git remote URL. На M4 — единственный safe pattern.

### Git-proxy 403 при смене PM-сессии (NEW M3 lesson)

При продолжении PM-сессии на новой машине `git push https://git-manager.devin.ai/proxy/github.com/...` может ответить 403 — токен прежней PM-сессии в git-manager protocol'е уже не валиден. **Fix:**

```bash
GIT_ASKPASS=/tmp/git-askpass.sh \
git -c url.https://github.com/.pushInsteadOf=https://github.com/ \
    -c credential.helper= \
    push origin <branch>
```

где `/tmp/git-askpass.sh` — однострочник:

```bash
#!/bin/bash
echo "$GITHUB_PAT_ALEXBAYOV"
```

Это обходит git-manager proxy и идёт напрямую на github.com с правильным токеном. На M4 — добавить в PM kickoff knowledge note + skill file (см. ниже).

### QA Acceptance octopus-merge dry-run (NEW M3 lesson)

QA Acceptance на M3 не просто читала 3 role-PR по отдельности, а **локально создала ветку `qa/m3-acceptance-test` с octopus-merge всех 3 role-PR** и прогнала 3 Gate'а на комбинации. Это позволило бы поймать cross-PR конфликты (например, если бы Engineer и Content несогласованно назвали `MobType.spawner` vs `spawn`er) **до того**, как PM начнёт merge sequence. На M3 конфликтов не нашлось, но методология валидна: на M4 QA Acceptance kickoff явно указывает octopus-merge step.

### DoD-precision: точные числа, не «≥X» / «~Y» (NEW M3 lesson)

На M3 PM kickoff (PR #20) указал items DoD как **«≥ 30 items (~15 новых)»** — но `balance.md` §M3 (GD amendment + QA Spec APPROVE) специфицировал ровно **14 новых items = 29 итого**. Несоответствие словил Content в процессе работы → потребовался PM align PR #24, чтобы привести dashboards к факту spec'а. **Lesson:** PM kickoff M{N+1} должен **сначала читать balance §M{N+1}**, потом писать DoD в `status/M{N}.md` + `handoff/M{N}-{ROLE}.md` + `kickoff/M{N}-{ROLE}.md` точными цифрами (`items = 29`, не `≥30`). Это становится checklist'ом в `staff/PROCESS.md`.

### Anti-scope discipline (PRESERVED from M2)

Каждый kickoff M3 явно перечисляет, что НЕ входит. QA Acceptance Gate 3 grep-checks (`grep -r "perk"`, `grep -r "boss"`, `grep -r "ysdk"`, `grep -r "module"` в `src/`) — 0 нарушений. На M4 anti-scope-grep автоматизировать как `tools/qa/anti_scope_grep.sh` (опционально, follow-up).

### Merge-delegation flexibility (NEW M3 lesson — context-dependent)

STATE_MACHINE.md формально требует, чтобы gate-close PR `m{N}-integration → main` мерджил **Alex/Заказчик** (не PM self-merge). На M3 Alex явно делегировал merge PM-сессии («гитпат выдам свой если надо — мерж на тебе»). Это исключение, не новая политика — на M4 STATE_MACHINE остаётся в силе, gate-close мерджит Alex by default, кроме явной делегации PM. PM в любом случае не self-merge'ит **role PR** (только PM-owned PR с явной customer-делегацией).

## 6. PR-реестр M3

| PR | Role | Base | Status |
|---|---|---|---|
| #20 | PM / M3 kickoff | `m3-integration ← pm/m3-kickoff` | Merged 2026-05-20 PM |
| #21 | GD M3 amendment | `m3-integration ← m3/gd-amendment` | Merged 2026-05-20 PM |
| #22 | QA Spec M3 | `m3-integration ← qa/m3-spec-review` | Merged 2026-05-20 PM — verdict APPROVE по 7 чек-листам |
| #23 | PM / status-sync | `m3-integration ← pm/m3-status-sync` | Merged 2026-05-21 PM |
| #24 | PM / DoD-align items=29 | `m3-integration ← pm/m3-dod-align-items` | Merged 2026-05-21 PM |
| #25 | Content M3 | `m3-integration ← m3/content` | Merged 2026-05-21 PM — +5 mobs / +14 items / +10 recipes / +2 zones / +3 dummy radio signals |
| #26 | Engineer M3 | `m3-integration ← m3/world` | Merged 2026-05-21 PM — multi-zone runtime + 5 mob AI + RadioScene stub + 89/89 vitest |
| #27 | Artist M3 | `m3-integration ← m3/art` | Merged 2026-05-21 PM — 5 mob sprites + 14 item icons + 2 backgrounds + radio_icon (129.8 KB / 500 KB) |
| #28 | QA Acceptance M3 | `m3-integration ← qa/m3-acceptance` | Merged 2026-05-21 PM — verdict **APPROVE** (3 Gate'а PASS, 0 blockers, 3 NB M4 follow-ups) |
| #29 | PM / finalize M3 | `m3-integration ← pm/m3-finalize` | Open — этот PR (gate → M3_DONE_PENDING_GATE_CLOSE, M3-SUMMARY, CHANGELOG, dashboards) |
| TBD | PM gate-close M3 | `main ← m3-integration` | Pending — открывает PM после merge этого PR; merge на PM по делегации Alex'а (см. §5 Lessons) |
