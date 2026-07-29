# R-серия — полный редизайн «Оплот»

> **Статус:** канон. Источник правды для R0–R6.
> **Дата:** 2026-07-29
> **Ветка:** `redesign/r-series`
> **Автор:** Lindy (Chief of Staff) + Critic loop против AAA-референсов.
> **Правило:** код пишется только по этому документу и под-спекам R2/R3. Старый GDD/M13 — исторический контекст, не канон геймплея.

---

## 1. North Star

**Жанр:** изометрическая post-apoc RPG для Яндекс.Игр.
**Core loop:** База → Вылазка → Пошаговый бой (точность + прицел по частям тела) → Лут (вес) → Крафт/моды стволов → Прогрессия → повтор.

**Референсы (обязательные, Critic сверяет каждый PR):**
- XCOM 2 — прозрачный hit%, укрытия, овервотч
- Escape from Tarkov — реальные стволы, калибры, моды с trade-off
- Fallout 1/2 — прицельные выстрелы по частям тела
- Wasteland 3 — инициатива по юнитам, засады
- Mutant Year Zero — стелс-зачистка до открытого боя
- Project Zomboid — изометрическая читаемость
- This War of Mine — ритм день/база · ночь/вылазка

**Платформа:** HTML5, mobile-first landscape 1280×720, Яндекс.Игры SDK (сохраняем существующую интеграцию).

**Стек (целевой):**
| Слой | Было | Стало |
|---|---|---|
| 2D UI / меню | Phaser 3 | Phaser 3 (оставить) |
| Мир / бой / база | Phaser 2D | **Babylon.js** изометрия |
| Язык | TypeScript | TypeScript |
| Сборка | Vite | Vite |
| Контент | JSON | JSON (расширяем) |

Phaser остаётся для UI-сцен (инвентарь, крафт, меню). Babylon.js — для Base3D, Combat3D, Sortie3D.

---

## 2. Что сохраняем из текущего main

Не выбрасываем фундамент:
- `src/systems/weight.ts`, loot, xp, radio, cloudSave, iap, ads, telemetry
- `content/zones.json`, mobs, items (187), perks/skill tree
- Миграции сейвов (SAVE_VERSION) — бамп + миграция v9→v10
- Yandex SDK / locale RU / settings
- Vitest-гейты и процесс PR

**Вырезаем / заменяем:**
- Авторесолв как основной бой (`sortieResolve` остаётся fallback/симуляцией для AI-тестов, не player-facing)
- Мёртвые skill-nodes (17 inert) — все 24 должны влиять на геймплей
- Pillow-заглушки ассетов — замена low-poly 3D + painted UI

---

## 3. Вехи R0–R6

| Веха | Название | Deliverable | Definition of Done |
|---|---|---|---|
| **R0** | Foundation | Babylon.js + изо-камера + пустая сцена + SAVE_VERSION=10 stub | `npm run dev` открывает 3D-сцену на телефоне, typecheck/lint зелёные |
| **R1** | Grid & Move | Сетка, клик-ход героя, препятствия, pathfinding | Герой ходит по клику, путь виден |
| **R2** | Combat MVP | AP, hit%, прицел (торс/голова/руки/ноги), укрытия, 3 моба, UI hit-breakdown | 1 полный бой end-to-end; Critic подписывает hit% UX |
| **R3** | Arsenal | 30+ реальных стволов, калибры, 5 слотов модов, прочность, разбор/сборка | Собрал АКМ из деталей; мод меняет hit%/шум/вес |
| **R4** | Full Loop | Вылазка→бой→лут→база→крафт→офлайн | 15-мин сессия без багов; миграция сейвов |
| **R5** | Progression | 24/24 skill nodes live, зоны unlock, перки | 2ч геймплея без потолка |
| **R6** | Polish + Ship | Low-poly модели, свет, painted UI, bundle, Yandex submit | Проходит smoke + модерацию |

**Правило порядка:** R2 не стартует без R1 DoD. R3 можно параллелить с R2 UI-полишем, но merge R3 после R2 green.

---

## 4. Critic loop (обязателен)

Перед merge любого PR вехи:
1. Автор (Engineer/Lindy) сдаёт diff + короткий «что изменилось для игрока».
2. **Critic** (`staff/roles/CRITIC.md`) сверяет с референсами из §1.
3. Critic возвращает: APPROVE | REQUEST_CHANGES (список конкретных gaps).
4. Без APPROVE — не merge.

KPI критика: игрок видит hit% **до** выстрела; мод даёт **понятный trade-off**; бой не сводится к «спам Атака».

---

## 5. Anti-scope (до R6)

- PvP / мультиплеер
- Полный open-world
- FPS / third-person free camera
- Реальные ТМ логотипы производителей (названия стволов — ок, логотипы брендов — нет)
- Сюжетная кампания на 10+ часов (пост-R6)
- Коммуна NPC (пост-R6)

---

## 6. Файлы пакета

| Файл | Содержание |
|---|---|
| `docs/redesign/R-MASTER.md` | Этот документ |
| `docs/redesign/R2-COMBAT.md` | Бой: AP, hit%, части тела, укрытия, шум, мораль |
| `docs/redesign/R3-WEAPONS.md` | Стволы, калибры, моды, шмот |
| `docs/redesign/R0-FOUNDATION.md` | Babylon bootstrap, структура папок |
| `staff/roles/CRITIC.md` | Роль критика |
| `staff/ledger/CURRENT.md` | Обновлённый ledger |

---

## 7. Локальный запуск (для владельца)

```bash
git clone https://github.com/alexbayov/oplot.git
cd oplot
git checkout redesign/r-series
npm install
npm run dev
```

После R0: открыть localhost URL из Vite — должна быть 3D-сцена.
Build: `npm run build` → `dist/` для деплоя на Яндекс.Игры.

---

## 8. Решение владельца (зафиксировано без переспросов)

- 3D изометрия — да
- Пошаговый бой с точностью и прицелом — да
- Реальные названия оружия — да
- Моды/апгрейды стволов и шмота — да
- Critic против AAA — да
- Автономная работа без переспросов — да
