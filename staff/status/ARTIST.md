# Status: Artist

**Текущая веха:** M3 — Расширение мира
**Статус:** IN_PROGRESS (Draft PR #27, step 2/5 — 5 mob sprites done)
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

### Что НЕ сделано (запланировано в Steps 3-5)

| Step | Файлы | Статус |
|---|---|---|
| 3 | `assets/sprites/items/{electronics,oil,medical_supplies,circuitry,pipe_rifle,crowbar,tactical_vest,helmet,gas_mask,large_medkit,energy_drink,emp_grenade,smoke_bomb,ammo_rifle}.png` (14 icons) | PENDING |
| 4 | `assets/backgrounds/{warehouse,city}.png` | PENDING |
| 5 | `assets/ui/radio_icon.png` (опционально, по handoff §4) + budget check + PR Ready | PENDING |

Все step'ы генерятся одним вызовом `python3 tools/art/gen_m3_assets.py` (тестовый прогон локально: 22 файла, 129 622 байт суммарно = ~127 KB, ≤500 KB бюджет с большим запасом).

## Бюджет M3

| Категория | Прогноз | Бюджет |
|---|---|---|
| 5 mob sprites (128×128) | ~27 KB | ≤ 250 KB |
| 14 item icons (64×64) | ~33 KB | ≤ 70 KB (handoff ~50) |
| 2 backgrounds (800×600) | ~66 KB | ≤ 200 KB |
| 1 radio UI icon (64×64) | ~3 KB | ≤ 5 KB |
| **Итого M3 add** | **~127 KB** | **≤ 500 KB** |
| **Project total (M1 + M3)** | **~213 KB** | **≤ 600 KB / 5 MB Яндекс** |

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

- `m3/art → m3-integration` — Draft (открывается в step 1, после первого push).

## Self-update / Recovery

Эта сессия обновляет **только** `staff/status/ARTIST.md`. `staff/status/M3.md`, `staff/status/{другие_роли}.md`, `staff/decisions/CHANGELOG.md` и `PLAN.md` синхронизирует PM.
