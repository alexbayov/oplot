# M1 — Технический скелет: Summary

**Веха:** M1
**Название:** Технический скелет
**Период:** 2026-05-18 → 2026-05-19
**Gate-close:** 2026-05-19, PR `m1-integration → main`

---

## 1. Что было целью

Заложить технический скелет проекта, на который встают все последующие вехи:

- Phaser 3 + TypeScript + Vite билд, который собирается и грузится в браузере.
- Финализированный GDD и balance.md для M1-механик (вылазка, бой, лут, крафт).
- QA Spec approve на спеку.
- Canonical content (items / mobs / recipes / zones) под GDD §6 типы.
- Style-guide и минимальные visual placeholder-ассеты для unblock Engineer-сцен.
- Процесс-инфраструктура (state machine, integration-branch, dashboard, recovery snapshots).

## 2. Что вошло в `main` (через `m1-integration → main`)

### Код (Engineer, PR #7)

- Phaser 3 + TS + Vite skeleton: `src/main.ts`, `src/config.ts`, `src/utils/loader.ts`.
- TS-типы под GDD §6: `src/types/item.ts`, `src/types/mob.ts`, `src/types/recipe.ts`, `src/types/zone.ts`, `src/types/index.ts`. `damage_min` / `damage_max` (не одиночное `damage`), `vs_melee_bonus` опциональный, `ammo_id` ссылается на item-id.
- 7 сцен-заглушек: Boot / Base / Map / Sortie / Combat / Inventory / Craft. Навигация base→map→sortie→combat плюс craft/inventory→base. Runtime smoke зафиксирован в комментарии к PR #7.
- npm scripts: `dev` / `build` / `lint` / `typecheck`. `npm run test` через `vitest run` (тестов пока нет — нормально для M1).
- `npm run build` производит ~1.5 МБ JS, gzip ~342 КБ.

### Контент (Content Designer, PR #6)

- `content/items.json`: 15 предметов (8 ресурсов + 2 оружия + 2 брони + 3 расходника).
- `content/mobs.json`: 3 моба (marauder, wild_dog, mutant) с `drop_table`, `behavior`, `xp_reward`.
- `content/recipes.json`: 5 рецептов (`recipe_pistol`, `recipe_leather_vest`, `recipe_bandage`, `recipe_medkit`, `recipe_ammo_pistol`).
- `content/zones.json`: 1 зона `forest` с 3 уровнями глубины.
- Все числа сверены с `docs/balance.md` (marauder HP=18, weapon stats, recipe costs).

### Ассеты (Artist, PR #11)

- `docs/style-guide.md` финализирован: палитра в HEX (`#1A1A1A`, `#2D2D2A`, `#4A4A3A` хаки, `#8B7355` ржавчина, `#3D5C3A` зелень, `#D4C5A0` песочный, `#8B0000` HP, `#4682B4` энергия), тиры T1–T5, шрифты (Oswald заголовки, Roboto основной), размеры, правила, AI-пайплайн как процесс для M2+, M1 placeholder pipeline через Pillow.
- `assets/sprites/hero.png` — 128×128 RGBA, 7.4 КБ.
- 8 item icons по 64×64 RGBA (wood, scrap, cloth, food, water, gunpowder, leather, rope) — суммарно ~22 КБ.
- `assets/backgrounds/forest.png` — 800×600 RGB, 52 КБ.
- `docs/style-guide-m1-preview.png` — contact sheet для PR review, 25 КБ.
- Суммарный размер M1 ассетов: **81.3 КБ / 300 КБ (27% бюджета)**.

### GD + QA Spec (вошли в `main` до integration-branch policy)

- `docs/GDD.md` финализирован под M1 (вылазка, бой, лут, инвентарь, крафт, JSON-схемы §6).
- `docs/balance.md` финализирован.
- QA Spec re-review verdict: APPROVE (`staff/status/QA.md`).

### Процесс (PM)

- `staff/STATE_MACHINE.md`, `staff/ORCHESTRATION.md`, `staff/PROCESS.md` — orchestration на multi-session флоу.
- `staff/decisions/DECISIONS.md` зафиксированы три M1-решения: integration-branch policy (2026-05-19), Pillow placeholders (2026-05-19), PM-integration smoke вместо отдельной QA Acceptance-сессии на M1 (2026-05-19).
- `staff/LINKS.md`, `staff/CONTEXT.md` — recovery entry points для будущих сессий.
- Dashboard `staff/status/M1.md` с PR-реестром.
- Шаблон PR-описания и роль-self-update правила.

## 3. Финальная сверка с GDD / balance / handoff

| Источник | Требование | Факт |
|---|---|---|
| GDD §6 / balance §Мобы | marauder HP=18, defense=1 | OK (`content/mobs.json` marauder) |
| GDD §6 | weapon.damage = пара min/max | OK (`makeshift_pistol` 9–14, `knife` 4–7) |
| GDD §6 | ranged.ammo_id ссылается на existing item | OK (`makeshift_pistol.stats.ammo_id = "ammo_pistol"`) |
| GDD §6 | armor.vs_melee_bonus опциональный | OK (`cloth_jacket.stats.vs_melee_bonus = 1`) |
| MVP-Definition (PLAN §2) | 1 зона | OK (только `forest`) |
| MVP-Definition | 2 оружия | OK (knife + makeshift_pistol) |
| MVP-Definition | 3 типа мобов | OK (marauder + wild_dog + mutant) |
| MVP-Definition | 5 базовых ресурсов | OK (wood, scrap, cloth, food, water + bonus: gunpowder, leather, rope = 8 ресурсов; покрывает все рецепты) |
| MVP-Definition | 3-5 рецептов крафта T1 | OK (5 рецептов, все T1) |
| MVP-Definition | Anti-scope: нет радио / перков / боссов / модулей | OK (`content/radio.json` пустой; в коде нет; `boss_id: null` во `forest`) |
| Artist handoff §2 | hero 128×128 | OK |
| Artist handoff §2 | 8 icons 64×64 | OK (имена совпадают с `content/items.json`) |
| Artist handoff §2 | forest 800×600 | OK |
| Artist handoff §бюджет | ≤300 КБ | OK (81.3 КБ) |
| Engineer handoff | npm build/lint/typecheck зелёные | OK (проверено локально на объединённом дереве PR #7+#6+#11) |

## 4. Что НЕ вошло в M1 (отложено)

- Реальная игровая логика (бой, лут, вес, крафт) — это M2 MVP.
- Реальные AI-генерированные ассеты — M2+ (на M1 — placeholder через Pillow).
- Yandex Games SDK — M8.
- Радио / перки / боссы / модули — отдельные вехи M3–M6.
- Подключение Engineer'ом ассетов в Phaser-сценах (загрузка PNG, отображение hero, тайлы леса) — задача M2 Engineer'а.

## 5. PR-реестр M1

| PR | Роль | Статус | В какую ветку |
|---|---|---|---|
| #1 | PM | merged | main |
| #2 | Game Designer | merged | main |
| #3 | QA Spec | merged | main |
| #4 | Game Designer (QA-fix) | merged | main |
| #5 | QA Spec (re-review) | merged | main |
| #6 | Content Designer | merged | m1-integration |
| #7 | Engineer | merged | m1-integration |
| #8 | PM (process) | merged | main |
| #9 | PM (recovery snapshot) | merged | main |
| #10 | PM (workflow policy follow-up) | merged | main |
| #11 | Artist | merged | m1-integration |
| (gate-close) | PM | open at gate-close | main ← m1-integration |

## 6. Решения, принятые на M1

См. `staff/decisions/DECISIONS.md`:

- Integration-ветка на веху (2026-05-19): `m{N}-integration` промежуточная ветка, `main` только на gate-close.
- M1 Artist placeholders через Pillow (2026-05-19): AI-пайплайн отложен на M2+.
- PM-integration smoke вместо QA Acceptance-сессии на M1 (2026-05-19): применимо только на M1; начиная с M2 формальная QA Acceptance возвращается.

## 7. Definition of Done (PLAN §5) — сверка для M1

1. Есть описание в GDD — OK (`docs/GDD.md`).
2. Цифры в `balance.md` — OK.
3. Реализовано Engineer'ом по GDD — OK (PR #7).
4. Контент написан под шаблон GDD — OK (PR #6).
5. Прошла чек-лист QA — OK (PM-integration smoke по чек-листу `M1-QA-ACCEPT.md` + QA Spec approve).
6. Не сломала предыдущие вехи — OK (M0 process не затронут).
7. Билд проходит, нет console.error, грузится в Chrome — OK (Alex runtime smoke на PR #7; npm build clean на объединённом дереве).

## 8. Что готово к M2

- TS-types и canonical content — Engineer M2 может писать инвентарь / бой / крафт против существующих типов и JSON.
- `src/utils/loader.ts` готов для load JSON по URL.
- Placeholder-ассеты в правильных путях — Engineer M2 может грузить `assets/sprites/hero.png` и item-icons по `item.id`.
- Style-guide финализирован — Artist M2 может начинать AI-пайплайн с уже зафиксированной палитрой и правилами.
- Integration-branch workflow обкатан — для M2 будет `m2-integration` от `main` сразу после мержа этого gate-close PR.

## 9. Запуск M2

После мержа gate-close PR:

1. PM создаёт `m2-integration` от свежего `main`.
2. PM открывает kickoff'ы для M2: Engineer (`m2/inventory-combat-loot`), Content (`m2/content-expansion`, если нужен), GD (M2 spec amendments если нужны).
3. Возвращается формальная QA Acceptance-сессия (отдельный Devin) на gate-close M2.
