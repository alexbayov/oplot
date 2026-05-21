# Handoff: Artist — Веха M3

> **Роль:** Artist / Asset Lead
> **Веха:** M3 — Расширение мира
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m3-integration`
> **Твой PR-branch:** `m3/art`
> **PR base:** `m3-integration` (НЕ `main`)

---

## Preconditions

- [x] M2 закрыта.
- [x] GD M3 amendment merged (знаешь имена новых мобов/зон/items).
- [x] QA Spec Review APPROVE.
- [x] `docs/style-guide.md` финализирован на M1 — следуй ему.

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/roles/ARTIST.md` | Твоя роль |
| `staff/status/M3.md` | M3 scope, DoD |
| `docs/style-guide.md` | Палитра, размеры, стиль — source of truth |
| `docs/GDD.md` §5.4 | Описания 5 новых мобов (для персонажных спрайтов) |
| `docs/GDD.md` §6.4.M3 | Описания 2 новых зон (для backgrounds) |
| `staff/handoff/M3-CONTENT.md` | Список новых items (для item icons) |

---

## Твои deliverables

### 1. 5 mob sprites (`assets/sprites/mobs/`)

Для каждого из 5 новых мобов из GDD §5.4:

- 128×128 px, PNG, прозрачный фон.
- Стиль: «Military Graphic Novel» (тёмные тона, чёткие контуры, как hero.png на M1).
- Именование: `{mob_id}.png` (snake_case, совпадает с id из `content/mobs.json`).
- Каждый моб визуально **отличим** — не recolor. Разные позы, оружие, силуэты.

Если на M1 mob sprites лежат в другом месте — следуй существующей конвенции (проверь `assets/sprites/` перед работой).

### 2. 2 zone backgrounds (`assets/backgrounds/`)

- `warehouse.png` — 800×600, PNG или WebP.
  - Заброшенный промышленный склад. Стеллажи, разбитые ящики, тусклый свет сверху.
  - Тёмная палитра (серые, коричневые, ржавые тона).
- `city.png` — 800×600, PNG или WebP.
  - Разрушенный городской квартал. Обломки зданий, пыль, трещины в асфальте.
  - Холодная палитра (серо-синие тона, бетон).

Стиль: постапокалипсис, Darkest Dungeon-esque контрасты.

### 3. ~10 new item icons (`assets/sprites/items/`)

Для каждого нового item из Content M3 (примерные id'ы — уточни по Content PR):

- 64×64 px, PNG, прозрачный фон.
- Именование: `{item_id}.png` (совпадает с id из `content/items.json`).
- Стиль: как M1 item icons (чёткие силуэты на прозрачном фоне).
- Тиры: ресурсы в нейтральных тонах, T2 items — чуть ярче T1 (стилевое отличие по style-guide §Тиры).

Примерный список (уточни по Content / GDD §6.4.M3 zone-exclusive ресурсы):
- `electronics.png`, `oil.png`, `gear.png`, `chemicals.png` (warehouse resources)
- `medical_supplies.png`, `circuitry.png`, `fuel.png` (city resources)
- `pipe_rifle.png`, `crowbar.png` (T2 weapons)
- `tactical_vest.png` (T2 armor)

### 4. RadioScene UI элементы (опционально)

Если Engineer / PM решат, что RadioScene нуждается в иконке «Радио» для BaseScene (кнопка):
- `assets/ui/radio_icon.png` — 64×64, иконка радиоприёмника (старый рациевый стиль).
- Это **опционально** — Engineer может обойтись текстовой кнопкой.

---

## Размерный бюджет M3

| Что | Макс. размер |
|---|---|
| 5 mob sprites (128×128 × 5) | ~50 КБ каждый → ~250 КБ |
| 2 zone backgrounds (800×600 × 2) | ~100 КБ каждый → ~200 КБ |
| ~10 item icons (64×64 × 10) | ~5 КБ каждый → ~50 КБ |
| Radio icon (опционально) | ~5 КБ |
| **Итого M3 допбюджет** | **≤ 500 КБ** |
| **Итого проект (M1 + M3)** | **≤ 600 КБ** (из 5 МБ Яндекс-бюджета) |

Метод генерации: **Pillow pipeline** из M1 (см. `docs/style-guide.md` §Арт-пайплайн). Цветовые базы берёшь из палитры style-guide (тёмный фон `#1A1A1A` для mob backgrounds, основные `#4A4A3A/#8B7355/#3D5C3A` для details). Все спрайты — placeholder-класса, не production-арт; реальная замена на AI-generated — на M7 (полировка).

---

## Definition of Done

- [ ] 5 mob sprites в `assets/sprites/mobs/` (или в `assets/sprites/` если конвенция M1 другая). 128×128, PNG, прозрачный фон.
- [ ] 2 zone backgrounds в `assets/backgrounds/`: `warehouse.png` + `city.png`. 800×600.
- [ ] ~10 item icons в `assets/sprites/items/`. 64×64, PNG, прозрачный фон.
- [ ] Все имена файлов = `{id}.png` (snake_case), совпадают с `id` из Content JSON.
- [ ] M1 ассеты (`hero.png`, 8 M1 item icons, `forest.png`) **НЕ тронуты**.
- [ ] Общий размер M3 ассетов ≤ 500 КБ.
- [ ] `staff/status/ARTIST.md` обновлён под M3.

---

## FORBIDDEN

- Изменять M1 ассеты (hero.png, M1 item icons, forest.png).
- Использовать пиксель-арт стиль (style-guide запрещает).
- Яркие / мультяшные цвета (только постапок палитра из style-guide).
- Self-merge.
- Push в `main` / `m3-integration` напрямую.
- PAT-токен в URL / echo / print.
- Любые правки `src/`, `content/`, `docs/`, чужие `staff/status/*.md`.

---

## Процедура

1. Клонируй репо, `git checkout m3-integration`, прочитай файлы из «Контекст».
2. Проверь `docs/style-guide.md` + существующую структуру `assets/`.
3. Напиши план (5-7 пунктов): какие ассеты, в каком порядке.
4. Отправь Alex'у блокирующим: «План готов, жду апрува PM».
5. После апрува — `git checkout -b m3/art`, сделай первый ассет (например, 1 mob sprite) и **сразу push + Draft PR** `m3/art → m3-integration` (recovery-safe).
6. Сгенерируй остальные ассеты через Pillow pipeline.
7. Обнови `staff/status/ARTIST.md`.
8. Переведи PR в Ready.
9. Сообщи Alex'у блокирующим: «PR <ссылка>, готов к ревью PM».

Token-budget: ~30-60 минут. Если приближаешься к лимиту — push partial + Recovery block в PR. PM подхватит.

**Можно параллельно с:** Content, Engineer (координируй именование через PR-комментарии).
**Нельзя до:** GD M3 PR merged + QA Spec APPROVE (чтобы знать точные id'ы мобов/зон/items).
