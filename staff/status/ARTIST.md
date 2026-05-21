# Status: Artist

**Текущая веха:** M3 — Расширение мира
**Статус:** READY_FOR_PM_REVIEW (PR #27 Ready — все 22 ассета сгенерированы, M3 ARTIST DoD met)
**Ветка:** `m3/art` (base = `m3-integration`)
**Последнее обновление:** 2026-05-21

## Recovery block (для будущих сессий)

- **Роль:** Artist / Asset Lead, M3
- **Базовая ветка:** `m3-integration`
- **Рабочая ветка:** `m3/art`
- **PR target:** `m3-integration` (НЕ `main`)
- **План APPROVED PM 2026-05-21** — 7 пунктов с обязательным фиксом: Pillow-генератор коммитится в `tools/art/gen_m3_assets.py` для cross-session reproducibility (continuation of M1 PM-decision 2026-05-19, `staff/decisions/DECISIONS.md`).
- **Pillow pipeline:** детерминистичный (без рандома). Запуск из repo root: `python3 tools/art/gen_m3_assets.py`. Регенерирует все M3 ассеты идентично.
- **Палитра/размеры/обводки** строго из `docs/style-guide.md`.
- **Recovery cadence:** после каждого step push + апдейт PR Recovery block + этого файла.

## Что сделано (M3, шаг за шагом)

### Step 1 (DONE) — Генератор + 1-й mob (recovery-safe)

- `tools/art/gen_m3_assets.py` — детерминистичный Pillow-генератор для всех M3 ассетов (5 mobs + 14 items + 2 backgrounds + 1 radio UI icon). 2x super-sampling + LANCZOS downsample для smooth outlines. Палитра HEX заимствована из `docs/style-guide.md` §Палитра.
- `assets/sprites/mobs/looter_sniper.png` — 128×128, прозрачный фон, ~4 KB. Снайпер в low ranged stance с длинной винтовкой; цвета `#4A4A3A` (хаки) + `#8B7355` (ржавый акцент) + чёрная обводка 2 px (style-guide compliant).

### Step 2 (DONE) — 4 mob sprites

| Файл | Размер | Архетип (GDD §5.4) | Силуэтное различие |
|---|---|---|---|
| `assets/sprites/mobs/armored_guard.png` | 128×128, ~4 KB | Defensive cycle (`defensive_cover`) — Склад | Bulky figure + riot shield, chest plate с заклёпками, тёмный визор |
| `assets/sprites/mobs/fanatic_berserker.png` | 128×128, ~7 KB | Berserker low HP (`berserker_low_hp`) — Город | Полураздетый культист с факелом (amber+scarlet flame), ribs hint, rags loincloth |
| `assets/sprites/mobs/pack_rat.png` | 128×128, ~4 KB | Pack bonus (`pack_bonus_when_paired`) — Город | 4-лапая мутант-крыса, snout right, длинный rust-tail слева |
| `assets/sprites/mobs/relic_drone.png` | 128×128, ~8 KB | Armor piercing ranged (`armor_piercing_ranged`) — bridge | Hexagonal mech body, 4 rotor arms, центральный scarlet lens, antenna+amber tip |

Все 5 мобов visually distinct (не recolor) — разные silhouettes + signature props (винтовка / щит / факел / 4 лапы / hexagonal frame).

### Step 3 (DONE) — 14 item icons 64×64

| Категория | Файлы | Тир | Бюджет факт |
|---|---|---|---|
| Zone-exclusive ресурсы (warehouse) | `electronics.png`, `oil.png` | T1 (grey frame `#9E9E9E`) | ~4.7 KB |
| Zone-exclusive ресурсы (city) | `medical_supplies.png`, `circuitry.png` | T1 (grey frame `#9E9E9E`) | ~4.8 KB |
| T2 оружие | `pipe_rifle.png`, `crowbar.png` | T2 (green frame `#4CAF50`) | ~4.2 KB |
| T2 броня | `tactical_vest.png`, `helmet.png`, `gas_mask.png` | T2 (green frame `#4CAF50`) | ~7.8 KB |
| T2 расходники | `large_medkit.png`, `energy_drink.png`, `emp_grenade.png`, `smoke_bomb.png`, `ammo_rifle.png` | T2 (green frame `#4CAF50`) | ~13.1 KB |

Каждая icon — distinct silhouette: PCB chip / oil can with spout / pill bottle + red cross / pinned IC / rifle with stock / L-bar / vest with pouches / dome / mask + filter / box+cross / lightning can / antenna sphere / canister + smoke / vertical cartridge. snake_case naming совпадает с `id` из balance.md §M3 (для Content M3 PR — drop-in совместимость).

### Step 4 (DONE) — 2 backgrounds 800×600

| Файл | Размер | Содержание (GDD §6.4.M3) |
|---|---|---|
| `assets/backgrounds/warehouse.png` | 800×600, ~45 KB | Стеллажи с ящиками по бокам, подвесная лампа с конусом тёплого света (`#8B7355`), перспективная сетка пола, угольно-чёрный фон `#1A1A1A` + тёмно-серо-зелёные панели `#2D2D2A` |
| `assets/backgrounds/city.png` | 800×600, ~23 KB | Силуэт разрушенных многоэтажек с case-by-case разбитыми окнами, foreground rubble peaks (irregular polygons, без eye-shapes), туманный градиент, dark sky `#1A1A1A` → `#2D2D2A` |

Backgrounds: post-apocalyptic atmosphere, без персонажей и UI; плотные PNG (handoff §3 разрешает плотный fill).

### Step 5 (DONE) — radio_icon + budget verification + PR Ready

- `assets/ui/radio_icon.png` — 64×64, ~2.3 KB. Старая полевая рация: тёмный корпус (`#4A4A3A`), 4 динамических полосы (`#2D2D2A`), tuner-кнопка (`#8B7355`), антенна (`#4A4A3A`) с amber-tip (`#8B7355`). По handoff §4 это опциональный stub для RadioScene UI.
- Финальный budget verification (`du -b` на repo root): M3 additions = 132 925 B (~129.8 KB), project total = 216 143 B (~211.1 KB), оба well within budgets.
- PR `m3/art → m3-integration` переведён из Draft в Ready.

Все ассеты регенерятся одним вызовом `python3 tools/art/gen_m3_assets.py` (детерминистично, без random/seeds; не requires PIL stub mode).

## Бюджет M3

| Категория | Факт | Бюджет |
|---|---|---|
| 5 mob sprites (128×128) | 26.0 KB | ≤ 250 KB |
| 14 item icons (64×64) | 33.8 KB | ≤ 70 KB |
| 2 backgrounds (800×600) | 67.6 KB | ≤ 200 KB |
| 1 radio UI icon (64×64) | 2.3 KB | ≤ 5 KB |
| **Итого M3 add** | **129.8 KB** | **≤ 500 KB (26.0% used)** |
| **Project total (M1 baseline 81.3 KB + M3 129.8 KB)** | **211.1 KB** | **≤ 600 KB (35.2% used) / 5 MB Яндекс** |

`tools/art/gen_m3_assets.py` (~28 KB) — tool, не runtime asset, не входит в bundle.

## Соответствие style-guide

- Палитра из `docs/style-guide.md` §Палитра (HEX-точно).
- Bold обводки 2–3 px на персонаже и иконках (через 2x super-sampling).
- Прозрачные фоны на спрайтах/иконках; плотные backgrounds.
- snake_case ASCII naming, file id = content/balance id.
- T1/T2 tier-frames (`#9E9E9E` / `#4CAF50`) на item-icons.

## Anti-scope

- НЕ трогаю M1 ассеты (`hero.png`, 8 M1 item icons, `forest.png`).
- НЕ трогаю `src/`, `content/`, `docs/`, чужие `staff/status/*.md`.
- НЕ pixel-art, не cartoon, не AI-генерация (М7 scope).
- НЕ self-merge, НЕ push в `main`/`m3-integration` напрямую.

## Блокеры

- Нет.

## PR

- `m3/art → m3-integration` — **Ready for PM review**: https://github.com/alexbayov/oplot/pull/27
- Финальный SHA: см. `git log origin/m3/art -1`.

## Self-update / Recovery

Эта сессия обновляет **только** `staff/status/ARTIST.md`. `staff/status/M3.md`, `staff/status/{другие_роли}.md`, `staff/decisions/CHANGELOG.md` и `PLAN.md` синхронизирует PM.
