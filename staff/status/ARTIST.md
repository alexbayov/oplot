# Status: Artist

**Текущая веха:** M1 — Технический скелет
**Статус:** DONE_PENDING_QA_ACCEPT
**Ветка:** `m1/art-initial` (base = `m1-integration`)
**Последнее обновление:** 2026-05-19

## Что сделано

### 1. `docs/style-guide.md` — финализирован
- Стиль «Military Graphic Novel» зафиксирован (атмосфера, техника, обводки, тоновая идея, anti-style).
- Палитра в HEX: база мира (`#1A1A1A`, `#2D2D2A`, `#4A4A3A` хаки, `#8B7355` ржавчина, `#3D5C3A` зелень), UI/текст (`#D4C5A0` песочный, `#8B0000` HP, `#4682B4` энергия), тиры T1–T5, акценты состояний.
- Шрифты: Oswald заголовки, Roboto основной текст, Roboto Mono числа (рекомендация Engineer'у).
- Размеры спрайтов: hero 128×128, items 64×64, фон 800×600, UI tap ≥ 48×48.
- Правила стиля (прозрачный фон, обводки 2–3 px, snake_case naming, PNG на M1).
- AI-пайплайн задокументирован как процесс для **M2+** (Stable Diffusion / DALL-E / Midjourney + промпт-шаблоны + пост-обработка).
- Зафиксирован отдельный M1 placeholder pipeline (Pillow, PM-решение 2026-05-19).
- Размерный бюджет M1 (≤ 300 КБ) и общий лимит проекта (< 5 MB).

### 2. M1 placeholder-ассеты — сгенерированы (Pillow)

| Файл | Размер (px) | Размер (КБ) | Прозрачный фон | Бюджет |
|---|---|---|---|---|
| `assets/sprites/hero.png` | 128 × 128 | 7.4 | да | ≤ 50 КБ |
| `assets/sprites/items/wood.png` | 64 × 64 | 2.9 | да | ≤ 100 КБ (8 шт суммарно) |
| `assets/sprites/items/scrap.png` | 64 × 64 | 3.0 | да | (см. выше) |
| `assets/sprites/items/cloth.png` | 64 × 64 | 3.0 | да | (см. выше) |
| `assets/sprites/items/food.png` | 64 × 64 | 2.3 | да | (см. выше) |
| `assets/sprites/items/water.png` | 64 × 64 | 1.8 | да | (см. выше) |
| `assets/sprites/items/gunpowder.png` | 64 × 64 | 2.6 | да | (см. выше) |
| `assets/sprites/items/leather.png` | 64 × 64 | 3.1 | да | (см. выше) |
| `assets/sprites/items/rope.png` | 64 × 64 | 3.3 | да | (см. выше) |
| `assets/backgrounds/forest.png` | 800 × 600 | 51.9 | нет (плотный) | ≤ 150 КБ |
| **Сумма M1** |  | **~81.3 КБ** |  | **≤ 300 КБ (использовано 27%)** |

### 3. Соответствие style-guide
- Палитра из палитры style-guide.
- Bold обводки 2–3 px на персонаже и иконках.
- Прозрачные фоны на спрайтах/иконках; плотный фон у `forest.png`.
- snake_case ASCII naming.
- Painterly value noise для отхода от flat cartoon.

## Что НЕ сделано (по плану M1, корректно перенесено в M2+)

- Спрайты мобов (M2).
- UI-кит (M2–M3).
- Анимации (M3+).
- AI-генерация ассетов (M2+). На M1 placeholder'ы по PM-решению 2026-05-19.
- Спрайт-атласы и упаковка (M2+).

## Блокеры

- Нет.

## PR

- `m1/art-initial → m1-integration`. Ссылку проставит PM-сессия в `staff/status/M1.md` после открытия PR. См. PR description: scope / anti-scope / recovery / per-file sizes / contact sheet.

## Self-update / Recovery

Эта сессия обновила **только** `staff/status/ARTIST.md`. `staff/status/M1.md`, `staff/status/{другие_роли}.md`, `staff/decisions/CHANGELOG.md` и `PLAN.md` синхронизирует PM.
