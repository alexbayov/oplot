# Status: QA

**Текущая веха:** M1 — Технический скелет
**Последнее действие:** Acceptance Testing по role PR #6, #7, #11
**Статус:** ACCEPTANCE_APPROVE_ALL
**Дата:** 2026-05-19

## Текущий gate

QA Acceptance по M1 завершена. Все обязательные role PR проверены против `m1-integration` и получают **APPROVE**:

| PR | Роль | Ветка | Verdict |
|---|---|---|---|
| #7 | Engineer | `m1/eng-bootstrap` | **APPROVE** |
| #6 | Content Designer | `m1/content-mvp` | **APPROVE** |
| #11 | Artist / Asset Lead | `m1/art-initial` | **APPROVE** |

## Acceptance report — 2026-05-19

### PR #7 Engineer — APPROVE

Проверено локально на ветке `m1/eng-bootstrap`, diff против `m1-integration`.

**Checks run:**
- `npm install` — passed, 0 vulnerabilities.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run build` — passed.
- `npm run dev -- --host 127.0.0.1` + Chrome runtime-smoke — passed.

**Checklist evidence:**
- BootScene существует и стартует первой; `create()` переводит в `BaseScene`.
- BaseScene показывает `ОПЛОТ`, кнопки `В вылазку`, `Крафт`, `Инвентарь`.
- MapScene показывает MVP-зону `Лес` и вход в вылазку.
- SortieScene / CombatScene / InventoryScene / CraftScene присутствуют как M1-заглушки.
- CombatScene показывает действия `Атака`, `Укрытие`, `Аптечка`, `Вернуться на базу`.
- `src/types/` содержит `Item`, `Mob`, `Recipe`, `Zone`; поля соответствуют GDD §6 (`damage_min` / `damage_max`, `levels[]`, `vs_melee_bonus`).
- Поиск по `src/`: `any` и закомментированный код не найдены.
- `.gitignore` содержит `node_modules/` и `dist/`.

**Note:** production `dist/` после `npm run build` = ~1.5 MiB. Это выше handoff-пункта `< 1 МБ`, но ниже project/platform limit `< 5 MB` из GDD/QA role; превышение вызвано базовым Phaser bundle. Для M1 skeleton это не блокер.

**Runtime smoke:** Base → Map → Sortie → Combat → Base → Craft → Base → Inventory прошёл; browser console без ошибок.

### PR #6 Content — APPROVE

Проверено локально на ветке `m1/content-mvp`, diff против `m1-integration`.

**Checks run:**
- JSON parse для `content/items.json`, `mobs.json`, `recipes.json`, `zones.json`, `radio.json` — passed.
- Counts: 15 items, 3 mobs, 5 recipes, 1 zone, `radio.json` пустой — passed.
- Reference validation: recipes→items, mob drops→items, zone mobs→mobs, zone resources→items — passed.
- Balance validation vs `docs/balance.md` и canon tables GDD §7.1–7.4 — passed.

**Checklist evidence:**
- Items: 8 resources + 2 weapons + 2 armor + 3 consumables; все required поля заполнены.
- Item weights/stats совпадают с balance.md (`knife`, `makeshift_pistol`, `cloth_jacket`, `leather_vest`, `bandage`, `medkit`, `ammo_pistol`).
- Mobs: `marauder`, `wild_dog`, `mutant`; статы и drop tables совпадают с balance/GDD.
- Recipes: 5 canonical recipes; ingredients/results resolve to canonical items.
- Zone: single `forest`, 3 depth levels, `boss_id: null`, refs valid.
- Anti-scope: нет радио-сигналов, перков, extra zones, M2+ mobs/items.

### PR #11 Artist — APPROVE

Проверено локально на ветке `m1/art-initial`, diff против `m1-integration`.

**Checks run:**
- style-guide coverage: Military Graphic Novel, HEX palette, sprite sizes, fonts, art pipeline — passed.
- PNG dimensions/file sizes via Pillow — passed.
- Transparency check for hero/items alpha extrema — passed.
- Visual distinguishability/contact sheet spot-check — passed.

**Checklist evidence:**
- `docs/style-guide.md` описывает общий стиль, anti-style, HEX palette, fonts, sprite sizes, UI rules, M2+ art pipeline and M1 placeholder pipeline.
- `assets/sprites/hero.png`: 128×128, RGBA, alpha `(0, 255)`, 7.4 KiB.
- 8 resource icons in `assets/sprites/items/`: each 64×64, RGBA, alpha `(0, 255)`, visually distinguishable.
- `assets/backgrounds/forest.png`: 800×600, RGB dense background, 51.9 KiB, dark forest style.
- Total M1 asset size: 81.3 KiB / 300 KiB budget.
- Anti-scope: no mob sprites, no UI kit, no animations, no pixel-art direction.

## Блокеры

Нет.

## PR / Recovery

- QA-report branch: `qa/m1-acceptance-report` (base = `m1-integration`).
- This QA session updates only `staff/status/QA.md`.
- Next gate after PM reviews QA-report: PM may merge approved role PRs #6, #7, #11 into `m1-integration` and proceed with M1 close process.

## История

- 2026-05-18 — Spec Review #1: `CHANGES_REQUESTED` (marauder weakness blocker; `vs_melee_bonus` semantic minor).
- 2026-05-18 — GD QA-fix PR #4 merged.
- 2026-05-18 — Spec Review #2: `APPROVE`.
- 2026-05-19 — Acceptance Testing for PR #6/#7/#11: `APPROVE` all.
