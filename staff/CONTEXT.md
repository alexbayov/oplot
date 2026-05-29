# Project Context — Oplot

> Короткая память проекта для любой новой Devin-сессии. Если нужно больше деталей, переходи по `staff/LINKS.md`.

## Что это

«Оплот» — mobile-first HTML5 survival RPG для Яндекс.Игр.

- Stack target: Phaser 3 + TypeScript + Vite + Yandex Games SDK.
- Core fantasy: вылазки за ресурсами, вес как риск/жадность, крафт, пошаговый бой, развитие оплота.
- Текущая рабочая модель: мульти-сессионная команда под управлением PM/оркестратора.

## Источники правды

| Что | Файл |
|---|---|
| Процесс и роли | `staff/TEAM.md`, `staff/PROCESS.md`, `staff/ORCHESTRATION.md` |
| Текущее состояние (M10 done, M11 planning) | `staff/CONTEXT.md` (этот файл, раздел «Текущий snapshot»), `staff/PLAN.md` |
| План M10 (закрыт) | `docs/redesign/M10-LIVING-REFUGE.md` |
| Конкурирующие планы M11 | `docs/redesign/M11-CORE-LOOP.md`, `docs/redesign/M11-NARRATIVE-PROGRESSION.md` |
| Завершённая веха M7 | `staff/status/M7.md`, `staff/handoff/M7-SUMMARY.md` |
| Завершённая веха M6 | `staff/status/M6.md`, `staff/handoff/M6-SUMMARY.md` |
| Завершённая веха M5 | `staff/status/M5.md`, `staff/handoff/M5-SUMMARY.md` |
| Завершённая веха M4 | `staff/status/M4.md`, `staff/handoff/M4-SUMMARY.md` |
| Завершённая веха M3 | `staff/status/M3.md`, `staff/handoff/M3-SUMMARY.md` |
| Завершённая веха M2 | `staff/status/M2.md`, `staff/handoff/M2-SUMMARY.md` |
| Завершённая веха M1 | `staff/status/M1.md`, `staff/handoff/M1-SUMMARY.md` |
| State machine | `staff/STATE_MACHINE.md` |
| План вех | `staff/PLAN.md` |
| Механики | `docs/GDD.md` |
| Числа и баланс | `docs/balance.md` |
| Контент | `content/*.json` |
| Визуальный стиль | `docs/style-guide.md`, `assets/` |

## Главные правила

- Роль работает только в своей зоне ответственности.
- Роль обновляет только свой `staff/status/{ROLE}.md` и PR recovery block.
- PM обновляет `staff/status/M{N}.md`, `PLAN.md`, `CHANGELOG.md` и общий статус.
- QA всегда отдельная сессия от той роли, которую проверяет.
- PR не self-merge. Мерджит PM после нужного gate.

## Текущий snapshot (2026-05-29 — M10 закрыта, M11 в планировании)

_Last reconciled with GitHub: 2026-05-29 (`main` HEAD `723fd13`)._

- **Ориентация: landscape 1280×720** (`Scale.FIT`, `src/config.ts`). Зафиксировано редизайн-вехой (PR #84). Портретный таргет из ранних GDD/handoff-доков **устарел** — не использовать как источник правды.
- **Что выпущено в `main`:** M0–M9 + Redesign (landscape + painted) + **M10 «Living Refuge» (DONE)**. Контент на `main`: 80 предметов, 42 рецепта, 11 мобов, 9 зон, 8 перков, 6 радиосигналов, 31 encounter.
- **Веха M11 — в планировании, НЕ закрыта.** В `main` лежат **два конкурирующих плана**:
  - `docs/redesign/M11-CORE-LOOP.md` — тиры + дерево навыков + сборка оружия из частей (нарратив отложен).
  - `docs/redesign/M11-NARRATIVE-PROGRESSION.md` — сюжет, цель, личность героя сейчас.
  - **Открытое решение владельца: что есть M11.** До решения не стартовать реализацию.
- **Открытый issue:** #79 (UI/UX redesign, Priority 1). Владелец считает работу фактически сделанной (painted-сцены/тултипы выпущены) — **issue нужно верифицировать и закрыть либо переоткрыть с остатком**.
- **Release-hardening не закрыт:** сжатие/lazy-load painted-фонов (bundle), проверка cloud save / ads / IAP на реальном Yandex Draft, `npm run lint` (был красный — 6 ошибок в `encounters.ts`).

## Незавершённое / в работе (важно для новых сессий)

- **M11/M12 влиты в `main`** через gate-close (combat-движок `combatEngine.ts`/`durability.ts`, тиры T1–T5, дерево навыков на 24 узла, 187 предметов, save-миграция v3). Это была работа из веток `m11-integration`/`m12-integration` — ветки живы на origin, но канон теперь `main`.
- **Combat Overhaul (M12) требует QA-финализации** — движок есть, но это крупная боевая перестройка: прогнать приёмочные тесты и убедиться, что старый бой не сломан, ПЕРЕД анонсом фичи игрокам.
- **Два конфликтующих плана M11** в `docs/redesign/`: `M11-CORE-LOOP.md` (нарратив отложен в M14) против `M11-NARRATIVE-PROGRESSION.md` (нарратив сейчас). **Владельцу проекта нужно выбрать один** — иначе следующая веха снова разъедется.
- **`docs/IDEAS.md`** — бэклог концептов, НЕ план. Не путать с вехами.

## Закрытые вехи

- **M10 — Living Refuge:** закрыта 2026-05-27 (PR #90 foundation + #91 full implementation, merged в `main`). Telemetry, sceneStack, painted world map (9 пинов), база как painted-сцена (6 хотспотов), encounter-система (31 событие), return-ритуал. Полный план — `docs/redesign/M10-LIVING-REFUGE.md`.
- **Redesign (landscape + painted):** закрыт 2026-05-27. Landscape 1280×720 (PR #84), painted-фоны/иконки 88 шт (PR #85), painted UI-хелперы (PR #87), rich-тултипы инвентаря (PR #88), fix unlock-условий 9 зон (PR #86).
- **M9 — Визуальный прогон + сабмит:** закрыта 2026-05-26 gate-close PR #78. 9 zone backgrounds, 80 item icons, hero/mob sprites, Pillow generator, 716 KB assets, 213 vitest.
- **M8b — Монетизация:** закрыта 2026-05-26 gate-close PR #77. Rewarded ×4 / interstitial ×1 / sticky banner / IAP 3 products + ads-remover + unprocessed-check §1.13.1. 213 vitest, JS 1.5 MB.
- **M7 — Полировка и баланс:** закрыта 2026-05-25 gate-close PR #65 (`m7-integration → main`, merged Alex'ом). Полный summary — `staff/handoff/M7-SUMMARY.md`. Итоги: 9 zones, 80 items, 42 recipes, 10 SFX, 16 tween events, 176/176 vitest, JS 1.49 MB, project assets 524 KB.
- **M6 — Радио и доверие:** закрыта 2026-05-25 gate-close PR #57 (`m6-integration → main`, PM merge по делегации Alex'а). Полный summary — `staff/handoff/M6-SUMMARY.md`. Итоги: 6 radio signals, `radio_trust [-5,+5]`, RadioScene M6 + ambush, 164/164 vitest, 456 KB assets.
- **M5 — Боссы и инстансы:** закрыта 2026-05-25 gate-close PR #47 (`m5-integration → main`, PM merge по делегации Alex'а). Полный summary — `staff/handoff/M5-SUMMARY.md`. Итоги: 3 босса, boss drops, T3 craft, daily instances, gas zones, MobRole runtime, 152 vitest, 1.48 MB build, 412 KB assets.
- **M4 — Перки и прогрессия:** закрыта 2026-05-22 gate-close PR #39 (`m4-integration → main`, PM merge по делегации Alex'а). Полный summary — `staff/handoff/M4-SUMMARY.md`. Итоги: 11 scenes, 128 vitest, 1.5 MB build, ~259 KB assets, 8 перков + veteran_conditioning fallback, XP-curve L1-10, ProgressionScene + LevelUpScene.
- **M3 — Расширение мира:** закрыта 2026-05-21 gate-close PR #30 (`m3-integration → main`). Полный summary — `staff/handoff/M3-SUMMARY.md`.
- **M2 — Играбельный MVP:** закрыта 2026-05-20 gate-close PR #19 (`m2-integration → main`). Полный summary — `staff/handoff/M2-SUMMARY.md`.
- **M1 — Технический скелет:** закрыта 2026-05-19 gate-close PR #12 (`m1-integration → main`). Полный summary — `staff/handoff/M1-SUMMARY.md`.
