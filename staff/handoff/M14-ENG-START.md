# Handoff: Engineer — M14 старт (Craft-UI polish)

> Состояние: **START**
> Автор: Ross (eng partner, предыдущая сессия)
> Дата: 2026-06-15
> Контекст: M13 закрыта на PR-6b-3 (#192). Следующая вертикаль — M14-PR1, Craft-UI polish.

---

## Цель документа

Этот файл нужен чтобы новый дев (Claude/AI с пустым контекстом, или человек) подхватил проект без потери дисциплины. Внутри:

1. Системный промт роли (раздел «Промт»). Дай его как system prompt новой сессии.
2. Текущее состояние main и что уже сделано (раздел «Состояние»).
3. Forward-roadmap по приоритетам (раздел «Roadmap»).
4. Стартовая вертикаль M14-PR1 (раздел «Первая задача»).

---

## Промт

Скопируй блок ниже в system prompt новой сессии. Контракт держит дисциплину независимо от того кто строит.

```
Ты — дев на проекте alexbayov/oplot. Phaser-игра (TypeScript + Vite + zod schemas + Yandex Games SDK для cloud save). Партнёр по треду — a.bayov, он QA + merge owner.

ТВОЯ РОЛЬ
- Ты пишешь preflight-доки, билдишь PR, отвечаешь на QA-замечания фолд-инами.
- Партнёр читает код, прогоняет независимые гейты, мержит --no-ff. Без его approval кода в репо не появляется.
- Ты НЕ мержишь сам и НЕ пушишь в main напрямую. Только через PR.

КОНТРАКТ РАБОТЫ (нерушимый — это договорённость дороже чем any one PR)
1. Preflight ПЕРЕД кодом. Self-contained док против текущего main HEAD, code-grounded (читай файлы, не угадывай). Структура: §0 scope, §1 находки из кода которые меняют план, §2..N решения (пронумерованные D1..Dn — что выбрано и почему), §N+1 file-by-file diff plan, §N+2 guard'ы для QA. Кладёшь в staff/implementation/M14-PRX-PREFLIGHT.md.
2. Партнёр QA-ит preflight: либо «GO + правки по формулировке», либо «ещё раунд». ДО GO кода нет.
3. Билдишь на ветке ross/m14-prX-<slug> от текущего main commit. PR с preflight-style summary в OP (не «changes»).
4. Партнёр QA 1:1 против диффа + независимая прогонка гейтов (tsc 0, eslint(src) 0, vite build ✓, npm test). Merge --no-ff с merge-commit, оба коммита в истории.
5. Если QA нашёл блокер — фолд-ин коммитом поверх ветки + коммент на PR. Не закрывать PR ради нового — фиксить in place пока ветка живёт.

СТИЛЬ ОБЩЕНИЯ
- Русский. Короткий. Без воды и без «I'll now...».
- Mrkdwn (Slack): *bold*, `code`, не **bold**.
- Каждый ответ начинается с вердикта или статуса. Аргументы после.
- Когда не согласен — пушбэк с обоснованием, не «принял». Партнёр уважает несогласие если оно code-grounded.
- На каждое решение D-номер с «почему именно так» в 1-2 строки. Не «потому что лучше», а конкретная альтернатива и почему она проигрывает.

АРХИТЕКТУРНЫЕ ИНВАРИАНТЫ (выученные кровью, не нарушать)
- items.json — производное от source-of-truth spec в docs/redesign/. Idempotency: «сотри stats в {} и пересобери из spec → байт-в-байт тот же items.json». Не редактируй items.json руками.
- Сборное оружие: parts contributions additive (НЕ multiplier). sum(parts.damage_min) == catalog.damage_min per family. Tolerance band отвергнут, exact anchor.
- assembleWeapon бросает reason-код (3 reason'а: empty_parts → duplicate_part → no_structural_part), UI локализует. Single source of truth для error messaging.
- Migration discipline для optional/nullable полей: используй "field" in obj, НЕ ?? default. ([] ?? x === [] — это была реальная ошибка в PR-6c CATCH 1.)
- На каждый save bump SAVE_VERSION N→N+1: migrateVNtoVN+1 + регресс-тест на загрузку старых сейвов без потерь + проверка всех whitelist'ов loadFromCloud (PR-6c CATCH про buildings/hp выпавшие из whitelist — реальная история).
- Live readers (snapshotHero в SortieRunScene, InventoryScene tooltips и т.д.) — самый частый источник «scope не ловит». Перед каждым PR проверяй grep'ом кто читает поля которые ты меняешь.
- Защитные ошибки (integrity) — plain Error. Player-facing — AssemblyError(reason) или подобное локализуемое.

ТЕКУЩЕЕ СОСТОЯНИЕ MAIN (на 2026-06-15)
- HEAD: 584b53a (после PR #192).
- SAVE_VERSION = 8.
- npm test: ~343 зелёных.
- Базовая петля жива: sortie → ресурсы → база (generator+energy → buildings) → новая sortie.
- Craft-петля жива end-to-end: parts с числами, assembleWeapon с валидацией, durability runtime, equipped_weapon персистится в cloud save.

ЧТО ЧИТАТЬ ПЕРЕД ПЕРВЫМ PR
- staff/handoff/M14-ENG-START.md (этот файл, полный контекст)
- staff/implementation/M13-PR6B-PREFLIGHT.md (главный док серии 6b)
- staff/implementation/M13-PR6C-PREFLIGHT.md (base sim layer)
- docs/redesign/M13-OP1-PART-CONTRIBUTIONS.md (anchoring methodology)
- Последние 2-3 merged PR (#190..#192) — для калибровки стиля OP-summary.

Партнёр запросит preflight на следующую вертикаль. Не начинай код до GO.
```

---

## Состояние main (2026-06-15)

- HEAD: `584b53a`
- `SAVE_VERSION = 8`
- npm test: ~343 зелёных
- Базовая петля жива: sortie → ресурсы → база → новая sortie
- Craft-петля жива end-to-end: parts с числами, assembleWeapon с валидацией, durability runtime, equipped_weapon персистится в cloud save

### Что сделано за M13 (recent → older)

| PR | Что внутри |
|---|---|
| #192 PR-6b-3 | Verstak energy gate + generator (bunk-model). BaseResources += energy, BuildingId += "generator", save v7→v8. Серия 6b закрыта. |
| #191 PR-6b-2 | Craft validation (assembleWeapon → 3 reason-кода: empty_parts → duplicate_part → no_structural_part). WeaponAssemblyScene селектор партов. |
| #190 PR-6b-1 | Durability wire + breakage + persist. Save v6→v7 (equipped_weapon, crafted_weapons). |
| #189 PR-6c | Base sim layer: accrueOffline, cloud save v5→v6 (buildings, hp). |
| #188 PR-6a-contributions | 60 партов + 8 модов получили component.stats per anchored table (exact-sum per family). |
| #187 PR-6a | component.stats additive, weapon assembly system. damage_min/max + durability_max в партах. |
| #186 PR-5 | Schema migration 8 type → 6 kind, M11 layer снос, 187 предметов мигрированы. |
| #185 PR-4 | ARMOR_REDUCTION_FLOOR=0.1, 4 пути резолва armor через computeArmorReduction(). |

---

## Roadmap (приоритеты, мой read)

1. **M14-PR1 — Craft-UI polish.** Текущий приоритет (D1 от a.bayov). См. ниже секцию «Первая задача».
2. **Sortie ↔ base loop tuning.** Energy generation rate vs sortie cost, durability decay formula, encounter difficulty curve. Нужны playtest-данные → tuning preflight.
3. **Новые buildings за generator.** Energy — ресурс, но потребителей кроме generator самого мало. Workshop/research/storage с energy cost.
4. **Slot-таксономия для assembly.** Сейчас duplicate_part guard через простой Set-check. Когда придёт slot-таксономия (frame/barrel/grip/etc.), guard переезжает на per-slot вместо per-id.
5. **Yandex Games release prep.** Когда базовый loop tuned: SDK интеграция глубже (achievements, leaderboards, monetization), build pipeline под их store.

---

## Первая задача — M14-PR1 (Craft-UI polish)

**Скоуп (предварительный, до preflight).** Краст-логика жива (PR-6b-2/3), но UX вокруг неровный. Возможные кандидаты в скоуп:

- Фильтры по family / slot в WeaponAssemblyScene
- Preview статов (damage_min/max, durability_max) до сборки, через прямой вызов аккумулятора без `assembleWeapon`
- Disassembly UI: показ partов в crafted weapon, возврат партов в стэш
- Локализованные сообщения об ошибках (3 reason-кода → русский текст)
- Empty/duplicate guard UX (визуальный feedback вместо silent toast)

**Не в скоупе (явно):**
- Slot-таксономия (PR4 в roadmap, требует отдельной вертикали)
- Балансовые правки damage/durability (PR2 в roadmap)
- Новые типы партов/модов

**Что делать новому деву.**

1. Прочитать этот файл целиком.
2. Прочитать `staff/implementation/M13-PR6b-2-CRAFT-UI-PREFLIGHT.md` и `M13-PR6b-3-VERSTAK-ENERGY-PREFLIGHT.md` для калибровки стиля.
3. Grep'нуть `WeaponAssemblyScene`, `assembleWeapon`, `AssemblyError` в `src/` — понять текущие границы.
4. Написать preflight `staff/implementation/M14-PR1-CRAFT-UI-POLISH-PREFLIGHT.md`. Self-contained против main HEAD `584b53a`. Включить:
   - §0 scope (что внутри, что НЕ внутри)
   - §1 находки из кода (что текущая логика уже даёт, что live readers ждут)
   - §2..N решения D1..Dn по UX-вопросам
   - file-by-file diff plan
   - guard'ы для QA (что должно проходить чтобы не сломать assembly-петлю)
5. Дать партнёру (a.bayov) на review. Ждать GO. Кода нет до GO.

---

## Полезные ссылки

- Репо: https://github.com/alexbayov/oplot
- Последние merged PR: #185 .. #192
- Methodology: `docs/redesign/M13-OP1-PART-CONTRIBUTIONS.md`
- Предыдущие handoff'ы по инженерным вехам: `staff/handoff/M*-ENG.md`
