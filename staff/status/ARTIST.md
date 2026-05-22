# Status: Artist

**Текущая веха:** M4 — Перки и прогрессия
**Статус:** DONE_PENDING_PM_REVIEW (8 perk icons generated, M4 ARTIST DoD met)
**Ветка:** `m4/art` (base = `m4-integration`)
**Последнее обновление:** 2026-05-22

## Recovery block (для будущих сессий)

- **Роль:** Artist / Asset Lead, M4
- **Базовая ветка:** `m4-integration`
- **Рабочая ветка:** `m4/art`
- **PR target:** `m4-integration` (НЕ `main`)
- **Pillow pipeline:** детерминистичный (без рандома). Запуск из repo root: `python3 tools/art/gen_m4_assets.py`. Регенерирует все M4 ассеты идентично.
- **Палитра/размеры/обводки** строго из `docs/style-guide.md`.
- **Recovery cadence:** после каждого step push + апдейт PR Recovery block + этого файла.

## Что сделано (M4)

### `tools/art/gen_m4_assets.py` — детерминистичный Pillow-генератор

2x super-sampling + LANCZOS downsample для smooth outlines. Палитра HEX из `docs/style-guide.md` §Палитра. Perk-специфичные цвета (red/silver/yellow/gold/cyan/steel/orange/green). Gold frame (`#C5A267`) для perk icons (distinct от T1 grey / T2 green tier-frames).

### 8 perk icons 64×64 RGBA PNG

| Файл | Размер | Motif | Цвет |
|---|---|---|---|
| `perk_tough_skin.png` | ~2.4 KB | Щит с заклёпками + заклёпки наверху | Red `#B43C3C` |
| `perk_sharp_blade.png` | ~2.2 KB | Кинжал с рукоятью + fuller | Silver `#C0C0C8` |
| `perk_lean_pack.png` | ~2.7 KB | Рюкзак + ремень сбоку | Yellow `#DCC864` |
| `perk_lucky_scavenger.png` | ~3.9 KB | Монета/звезда с центром | Gold `#DCB41E` |
| `perk_keen_eye.png` | ~3.9 KB | Глаз с прицелом-усами | Cyan `#50B4C8` |
| `perk_reinforced_plates.png` | ~2.5 KB | Бронепластина с заклёпками + ремни | Steel `#7878B4` |
| `perk_quick_hands.png` | ~4.0 KB | Ладонь (hex-щит) + пальцы | Orange `#C88C3C` |
| `perk_fast_learner.png` | ~2.5 KB | Книга с закладкой-звездой | Green `#78B464` |

Каждая icon — distinct silhouette + signature motif + gold perk-frame `#C5A267` (отличается от T1/T2 item-frames). snake_case naming совпадает с `id` из balance.md §M4.

## Бюджет M4

| Категория | Факт | Бюджет |
|---|---|---|
| 8 perk icons (64×64) | 24.2 KB | ≤ 50 KB |
| **Итого M4 add** | **24.2 KB** | **≤ 50 KB (48.4% used)** |
| **Project total (M1 81.3 KB + M3 129.8 KB + M4 24.2 KB)** | **235.3 KB** | **≤ 600 KB (39.2% used) / 5 MB Яндекс** |

`tools/art/gen_m4_assets.py` — tool, не runtime asset, не входит в bundle.

## Соответствие style-guide

- Палитра из `docs/style-guide.md` §Палитра (HEX-точно).
- Bold обводки 2–3 px (через 2x super-sampling, OUTLINE_WIDTH_ICON=4 → 2px final).
- Прозрачные фоны на иконках (RGBA).
- snake_case ASCII naming, file id = balance §M4 perk id.
- Gold perk-frame (`#C5A267`) — distinct от T1/T2 tier-frames.

## Anti-scope M4

- НЕ трогаю M1/M3 ассеты.
- НЕ трогаю `src/`, `content/`, `docs/`, чужие `staff/status/*.md`.
- НЕ pixel-art, не cartoon, не AI-генерация (М7 scope).
- НЕ self-merge, НЕ push в `main`/`m4-integration` напрямую.
- LevelUpScene decorative frame — не делаю (optional per handoff, budget safe without it).

## Блокеры

- Нет.

## PR

- `m4/art → m4-integration` — готов к PM review

## Self-update / Recovery

Эта сессия обновляет **только** `staff/status/ARTIST.md`. `staff/status/M4.md`, `staff/status/{другие_роли}.md`, `staff/decisions/CHANGELOG.md` и `PLAN.md` синхронизирует PM.

---

## M3 (закрытая — история)

**Статус:** DONE (PR #27 merged в m3-integration, затем gate-close PR #30 merged в main).

M3 deliverables: 5 mob sprites + 14 item icons + 2 backgrounds + radio_icon. M3-add 129.8 KB. Всё регенерится через `tools/art/gen_m3_assets.py`.
