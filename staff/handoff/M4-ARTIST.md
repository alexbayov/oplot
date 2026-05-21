# Handoff: Artist / Asset Lead — Веха M4

> **Роль:** Artist / Asset Lead (детерминистичный Pillow-pipeline)
> **Веха:** M4 — Перки и прогрессия
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m4-integration`
> **Твой PR-branch:** `m4/art`
> **PR base:** `m4-integration` (НЕ `main`)

---

## Preconditions

- [x] GD M4 amendment merged в `m4-integration` (8 перков с id'ами зафиксированы в `balance.md` §M4).
- [x] QA Spec M4 APPROVE.
- [x] PM сообщил тебе: «Parallel production M4 start».

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/roles/ARTIST.md` | Твоя роль |
| `staff/status/M4.md` | M4 scope, anti-scope, DoD |
| `staff/handoff/M3-SUMMARY.md` | Унаследованные ассеты M3 (129.8 KB / 500 KB) — образец |
| `docs/style-guide.md` | Style правила (painted-ish, palette, contour) |
| `docs/GDD.md` §6.X Perk + §Прогрессия | Какие перки нужны |
| `docs/balance.md` §M4 | id'ы 8 перков (для имён файлов) |
| `tools/art/gen_m3_assets.py` | **Образец Pillow-script — копируй структуру** |

---

## Твои deliverables

### 1. `tools/art/gen_m4_assets.py` (NEW)

Детерминистичный Pillow-скрипт (random seed fixed) для генерации 8 perk-иконок 64×64.

Структура (на основе `tools/art/gen_m3_assets.py`):

```python
import os, random
from PIL import Image, ImageDraw, ImageFont

SEED = 42
random.seed(SEED)

PERKS = [
  ("tough_skin",       "shield_motif",     (180, 60, 60)),     # red
  ("sharp_blade",      "blade_motif",      (200, 200, 200)),   # silver
  ("lean_pack",        "feather_motif",    (220, 200, 100)),   # yellow
  ("lucky_scavenger",  "coin_motif",       (220, 180, 30)),    # gold
  ("keen_eye",         "eye_motif",        (80, 180, 200)),    # cyan
  ("reinforced_plates","plate_motif",      (120, 120, 180)),   # steel
  ("quick_hands",      "hand_motif",       (200, 140, 60)),    # orange
  ("fast_learner",     "book_motif",       (120, 180, 100)),   # green
]

def generate_perk_icon(perk_id, motif, color):
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # ... motif-specific drawing (силуэт + контур + текстура)
    return img

OUT_DIR = "assets/sprites/perks"
os.makedirs(OUT_DIR, exist_ok=True)
for pid, motif, color in PERKS:
    img = generate_perk_icon(pid, motif, color)
    img.save(f"{OUT_DIR}/perk_{pid}.png", "PNG")
    print(f"Generated perk_{pid}.png")
```

Правила:
- Фиксированный `SEED` для воспроизводимости (PR ревью должен дать ту же картинку при rerun).
- Прозрачный фон (RGBA).
- Стиль: bold контур + ограниченная палитра (3-4 цвета на иконку) + узнаваемый motif (щит для tough_skin, нож для sharp_blade, и т.д.).
- НЕ photo-realistic / vector / animated / 3D.

### 2. `assets/sprites/perks/perk_<id>.png` × 8

После `python3 tools/art/gen_m4_assets.py` должны появиться 8 файлов:
- `perk_tough_skin.png`
- `perk_sharp_blade.png`
- `perk_lean_pack.png`
- `perk_lucky_scavenger.png`
- `perk_keen_eye.png`
- `perk_reinforced_plates.png`
- `perk_quick_hands.png`
- `perk_fast_learner.png`

Каждый — 64×64 RGBA PNG, ≤ 6 KB.

### 3. Бюджет

- M4-add: `du -sb assets/sprites/perks/` ≤ 50 KB.
- Project total: `du -sb assets/` ≤ 600 KB. (Текущий baseline после M3: 211.1 KB. Запас огромный, но не злоупотребляй.)

### 4. (Optional) Декор для LevelUpScene

Если успеваешь — 1 декоративный frame 400×600 или 600×400 (placeholder, не обязателен). Engineer его подключит через `BootScene.preload` если ты сделаешь, и в `LevelUpScene` как background.

---

## Definition of Done (твой чек-лист перед PR)

- [ ] `tools/art/gen_m4_assets.py` детерминистичный, документирован.
- [ ] 8 perk-иконок 64×64 RGBA PNG сгенерированы.
- [ ] M4-add ≤ 50 KB.
- [ ] Project total ≤ 600 KB.
- [ ] Стиль соответствует `docs/style-guide.md`.
- [ ] `staff/status/ARTIST.md` обновлён под M4.
- [ ] PR описание содержит scope, anti-scope, список сгенерированных файлов, бюджет + Recovery block.

---

## FORBIDDEN

- Self-merge. Push в `main` / `m4-integration` напрямую.
- PAT в URL / echo / print.
- Изменять `src/`, `content/`, `docs/`, чужие `staff/`.
- Пересоздание M1/M3 ассетов (только M4-новые файлы).
- Style вне `docs/style-guide.md` (никаких photo-realistic / animated / 3D / vector / cute-cartoon).
- Превышение бюджета 600 KB project total.
- Использовать GAN / Stable Diffusion / любые ML-генераторы (детерминистичный Pillow only).
- Включать в PR не-relevant ассеты (mob sprites / item icons / backgrounds — это M3, не трогай).
- План > 7 пунктов.

---

## Процедура

1. Клонируй репо, `git checkout m4-integration`. Прочитай файлы из «Контекст».
2. Изучи `tools/art/gen_m3_assets.py` (там реализованные motifs — sniper goggles, healer cross, и т.д.). Скопируй стиль.
3. Напиши план (5-7 пунктов): какие motif'ы для 8 перков, какая палитра.
4. После апрува — `git checkout -b m4/art`. Первый commit — `gen_m4_assets.py` skeleton (без всех motif'ов). Push + Draft PR (recovery-safe).
5. Допиши `gen_m4_assets.py` порциями (по 2-3 perk'а за commit). После КАЖДОГО commit'а прогоняй скрипт + добавляй PNG в коммит.
6. Финальный run: проверь бюджет.
7. Обнови `staff/status/ARTIST.md`.
8. Flip Draft → Ready. Сообщи Alex'у блокирующим.

Token-budget: эта задача — ~20 минут чтения + 1-2 часа письма Pillow-кода. Должна укладываться в 1 сессию.
