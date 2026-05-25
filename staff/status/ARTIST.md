# Status: Artist

**Текущая веха:** M6 — Радио и доверие
**Статус:** DONE_PENDING_PM_REVIEW (4 M6 assets generated, M6 ARTIST DoD met)
**Ветка:** `m6/art` (base = `m6-integration`)
**Последнее обновление:** 2026-05-25

## Recovery block (для будущих сессий)

- **Роль:** Artist / Asset Lead, M5
- **Базовая ветка:** `m5-integration`
- **Рабочая ветка:** `m5/art`
- **PR target:** `m5-integration` (НЕ `main`)
- **Pillow pipeline:** детерминистичный (fixed seed 42). Запуск из repo root: `python3 tools/art/gen_m5_assets.py`. Регенерирует все M5 ассеты идентично.
- **Палитра/размеры/обводки** строго из `docs/style-guide.md`.
- **Recovery cadence:** после каждого step push + апдейт PR Recovery block + этого файла.

## Что сделано (M5)

### `tools/art/gen_m5_assets.py` — детерминистичный Pillow-генератор

2x super-sampling + LANCZOS downsample для smooth outlines (boss sprites/icons). Gas overlay uses direct 256×256 RGBA with quantized alpha for compression. Палитра HEX из `docs/style-guide.md` §Палитра. `random.seed(42)` в начале. Boss-specific palette extensions (mutant flesh/growth, drone prime blue, guard armor bronze/insignia gold). T3 tier frame (`#2196F3` blue) distinct от T1 grey / T2 green / perk gold.

### 3 boss sprites 128×128 RGBA PNG

| Файл | Размер | Archetype | Motif |
|---|---|---|---|
| `forest_alpha_mutant.png` | 10.4 KB | mutant | Large asymmetric hulking body, left giant arm with claw, 3 mutated eyes, spine growths, hump |
| `warehouse_drone_prime.png` | 12.8 KB | mech | Reinforced hex body, 3-lens optic array, 3 antennas (central + side), hydraulic arms, prime chevron mark |
| `city_guard_captain.png` | 10.9 KB | human | Full tactical helmet with visor, heavy chest plate with insignia, shield + sword, pauldrons with rivets |

### 3 boss-drop icons 64×64 RGBA PNG

| Файл | Размер | Motif |
|---|---|---|
| `mutated_gland.png` | 4.2 KB | Biological tissue oval with pink lobes, red veins, oozing duct |
| `prime_circuit.png` | 3.4 KB | Blue metallic PCB with gold traces, processor chip, pin edges |
| `captain_insignia.png` | 3.4 KB | Heater shield shape, bronze border, red enamel, gold chevron/star boss |

### 3 T3 item icons 64×64 RGBA PNG

| Файл | Размер | Motif |
|---|---|---|
| `composite_blade.png` | 3.3 KB | Long diagonal blade with composite stripe, fuller groove, crossguard, blue T3 glow tip |
| `prime_shotgun.png` | 3.2 KB | Double barrel shotgun with prime circuit module (blue box + gold traces), pump grip, T3 muzzle glow |
| `captain_armor.png` | 3.6 KB | Heavy armored vest with chest plate, insignia on chest, blue T3 accent stripe, side plates |

### 1 gas zone overlay 256×256 RGBA PNG

| Файл | Размер |
|---|---|
| `gas_overlay.png` | 15.4 KB |

Semi-transparent green-yellow textured noise with large soft blobs, wisps, Gaussian blur, alpha quantization for small file size.

## Бюджет M5

| Категория | Факт | Бюджет |
|---|---|---|
| 3 boss sprites (128×128) | 34.1 KB | — |
| 3 boss-drop icons (64×64) | 11.0 KB | — |
| 3 T3 item icons (64×64) | 10.1 KB | — |
| 1 gas overlay (256×256) | 15.4 KB | — |
| **Итого M5 add** | **69.0 KB** | **≤ 80 KB (86.3% used)** |
| **Project total** | **412 KB** | **≤ 600 KB (68.7% used) / 5 MB Яндекс** |

`tools/art/gen_m5_assets.py` — tool, не runtime asset, не входит в bundle.

## Соответствие style-guide

- Палитра из `docs/style-guide.md` §Палитра (HEX-точно).
- Bold обводки 2–3 px (через 2x super-sampling, OUTLINE_WIDTH_SPRITE/ICON=4 → 2px final).
- Прозрачные фоны на спрайтах/иконках (RGBA).
- snake_case ASCII naming, file id = balance §M5.2 / §M5.4 / GDD §9.2 boss ids.
- T3 tier frame (`#2196F3` blue) — distinct от T1/T2/perk frames.
- Boss sprites визуально отличимы от M3 mobs (крупнее, детальнее, boss-специфичные элементы).
- M1+M3+M4 ассеты НЕ пересозданы.

## Anti-scope M5

- НЕ трогаю M1/M3/M4 ассеты.
- НЕ трогаю `src/`, `content/`, `docs/`, чужие `staff/status/*.md`.
- НЕ pixel-art, не cartoon, не AI-генерация (М7 scope).
- НЕ self-merge, НЕ push в `main`/`m5-integration` напрямую.
- Phase 2 sprites — НЕ сделаны (budget safe without; Engineer applies red tint overlay for phase 2 per handoff).

## Блокеры

- Нет.

## PR

- `m5/art → m5-integration` — готов к PM review

---

## M4 (закрытая — история)

**Статус:** DONE (PR merged в m4-integration, gate-close PR #39 merged в main).

M4 deliverables: 8 perk icons. M4-add 24.2 KB. Всё регенерится через `tools/art/gen_m4_assets.py`.

---

## M3 (закрытая — история)

**Статус:** DONE (PR #27 merged в m3-integration, затем gate-close PR #30 merged в main).

M3 deliverables: 5 mob sprites + 14 item icons + 2 backgrounds + radio_icon. M3-add 129.8 KB. Всё регенерится через `tools/art/gen_m3_assets.py`.

---

## M6 (текущая)

**Статус:** DONE_PENDING_PM_REVIEW (4 M6 assets generated, M6 ARTIST DoD met).

### `tools/art/gen_m6_assets.py` — детерминистичный Pillow-генератор

Pillow only, `random.seed(42)`, 2x super-sampling + LANCZOS downsample.
Палитра HEX из `docs/style-guide.md` §Палитра.
snake_case ASCII naming.

### 4 radio assets

| Файл | Размер | Motif |
|---|---|---|
| `radio_truth.png` (64×64) | 4.1 KB | Зелёная стабильная синусоида на тёмном фоне |
| `radio_trap.png` (64×64) | 4.7 KB | Красная ломаная волна с предупреждающим треугольником |
| `radio_ambiguous.png` (64×64) | 4.3 KB | Разделённый сигнал: слева зелёный чистый, справа янтарный с помехами |
| `radio_panel_bg.png` (256×128) | 13.2 KB | Тёмная металлическая панель с scanlines, кнобами, LED-индикаторами |

### Бюджет

| Категория | Факт | Бюджет |
|---|---|---|
| 4 radio assets | 26.2 KB | ≤ 40 KB (65.5% used) |
| Project total assets | ~456 KB | ≤ 650 KB (70.2% used) |

### Команда

```bash
python3 tools/art/gen_m6_assets.py
```

Детерминизм проверен: повторный запуск даёт идентичные MD5.

## PR

- `m6/art → m6-integration` — Draft → Ready for review.
