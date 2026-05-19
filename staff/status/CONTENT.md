# Status: Content Designer

**Текущая веха:** M1 — Технический скелет
**Статус:** DONE_PENDING_QA_ACCEPT
**Последнее обновление:** 2026-05-18

## Что сделано

- Создан PR #6 `m1/content-mvp` → `main`: https://github.com/alexbayov/oplot/pull/6
- PR содержит M1 canonical content JSON:
  - `content/items.json` — 15 предметов: 8 ресурсов, 2 оружия, 2 брони, 3 расходника.
  - `content/mobs.json` — 3 моба: `marauder`, `wild_dog`, `mutant`.
  - `content/recipes.json` — 5 рецептов по канону GDD/balance.
  - `content/zones.json` — 1 зона `forest` с 3 depth-levels.
- В PR #6 PM оставил approve-комментарий для QA Acceptance gate.
- Локальная JSON/reference validation в PR описании прошла.

## Что НЕ сделано

- PR #6 ещё не смержен.
- Финальная QA Acceptance ещё не запускалась.
- `content/radio.json` не тронут по anti-scope M1.

## Блокеры

- Ждёт QA Acceptance вместе с Engineer и Artist PR.
- Artist PR отсутствует и блокирует общий M1 QA Acceptance gate.

## PR

- https://github.com/alexbayov/oplot/pull/6
