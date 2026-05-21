# Handoff: Engineer — Веха M3

> **Роль:** Engineer
> **Веха:** M3 — Расширение мира
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m3-integration`
> **Твой PR-branch:** `m3/world`
> **PR base:** `m3-integration` (НЕ `main`)

---

## Preconditions

- [x] M2 закрыта (gate-close PR #19 merged 2026-05-20).
- [x] GD M3 amendment merged в `m3-integration` (§5.4 / §6.4.M3 / §7 / balance §M3).
- [x] QA Spec Review APPROVE.
- [x] Content M3 PR существует (можешь работать параллельно, но валидация cross-refs полагается на их JSON).

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/roles/ENGINEER.md` | Твоя роль, DoD |
| `staff/status/M3.md` | M3 scope, anti-scope, DoD |
| `staff/handoff/M2-SUMMARY.md` | Что унаследовано с M2 (системы, сцены, тесты) |
| `docs/GDD.md` §5.4 | 5 новых mob AI patterns — твой источник правды для combat.ts |
| `docs/GDD.md` §6.4.M3 | 2 новые зоны + unlock_conditions — твой источник для MapScene + GameState |
| `docs/GDD.md` §7 | RadioScene structure — UI flow + RadioSignal schema |
| `docs/balance.md` §M3 | Числа |
| Текущий код | `src/scenes/`, `src/systems/`, `src/state/`, `src/types/` — НЕ переписывай M2 без причины |

---

## Твои deliverables (узкий M3 scope)

### 1. Multi-zone runtime

- В `MapScene` отрендери все зоны из `GameState.data.zones` (а не только forest). Кнопка «Войти» для каждой.
- Реализуй `unlock_condition` для зон (warehouse / city) из GDD §6.4.M3. Минимально: храни в `GameState.progress` булевы флаги вроде `forest_depth_2_completed`, `any_warehouse_sortie_completed`. Не делай полноценную систему квестов — только нужные флаги.
- Зоны должны отображать `unlock_condition` явно (например, заблокированная зона показывается с серой кнопкой и текстом «Откроется после: <условие>»).

### 2. 5 новых mob AI behaviors

- В `src/systems/combat.ts` (или новом `src/systems/mobAI.ts`) добавь switch по `mob.behavior_id`, где каждое значение — отдельная функция выбора действия моба на свой ход.
- Существующие behaviors (`marauder` runs, `wild_dog` first strike, `mutant` plain) НЕ переписывай — только добавь 5 новых.
- Каждый новый AI должен пройти минимум 1 unit-test (vitest) с фиксированным seed RNG.

### 3. RadioScene stub

- Создай `src/scenes/RadioScene.ts`.
- На `BaseScene` добавь кнопку «Радио» (рядом с существующими «Инвентарь» / «Мастерская» / «В вылазку»).
- `RadioScene.create()`:
  - Заголовок «Радио».
  - Список сигналов из `GameState.data.radioSignals` (загружен `BootScene`-ом), фильтр по `expires_after_sorties > 0` и `dismissed === false`.
  - Каждый сигнал = кликабельная строка → раскрывает body + 2 кнопки («Откликнуться» / «Игнорировать»).
  - Любая кнопка → сигнал помечается `dismissed: true` в GameState и убирается из списка. НИКАКИХ последствий (это M6).
  - Кнопка «Назад» → BaseScene.
- Если сигналов нет — текст «Эфир пуст».

### 4. Загрузка radio.json

- В `BootScene` добавь параллельную загрузку `content/radio.json`.
- В `GameState.data.radioSignals` — массив `RadioSignal` (тип объяви в `src/types/radio.ts`, схема из GDD §7).
- Validate count'ы только soft-warning (не блокирующая ошибка).

### 5. Регистрация сцены + тесты

- Зарегистрируй `RadioScene` в `src/main.ts` (например, между InventoryScene и CraftScene).
- Добавь vitest-тесты:
  - 5 mob AI behaviors — минимум 1 тест на behavior (всего ≥ 5 новых тестов).
  - `unlock_condition` evaluation (≥ 2 теста: forest unlocked from start, warehouse locked initially / unlocked after trigger).
- Тестов должно быть **≥ 56** (49 M2 + 5 mob + 2 unlock; больше — лучше).

### 6. Runtime smoke (твой self-test)

Локально через `npm run dev`:
1. Открой `http://127.0.0.1:5173/`.
2. BaseScene показывает кнопку «Радио» — клик ведёт в RadioScene.
3. RadioScene показывает 2-3 dummy сигнала (если Content PR смержен) или «Эфир пуст» (если нет).
4. Кнопка «Откликнуться» / «Игнорировать» закрывает сигнал и возвращает на BaseScene.
5. MapScene показывает 3 зоны: forest (доступна), warehouse + city (или доступны, или заблокированы согласно unlock_condition).
6. Пройди вылазку в warehouse — встретишь хотя бы одного нового моба → AI ведёт себя согласно его behavior_id из §5.4.
7. M2 7-шаговый flow в Forest всё ещё работает (regression).

---

## Definition of Done

- [ ] `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test` — все зелёные.
- [ ] MapScene показывает 3 зоны, переключение работает.
- [ ] 5 новых mob AI реализованы, каждый покрыт vitest.
- [ ] `RadioScene` существует и UI-flow работает (без реальной логики).
- [ ] `RadioSignal` тип в `src/types/radio.ts`.
- [ ] `BootScene` грузит `content/radio.json`, GameState имеет `radioSignals`.
- [ ] M2 49 тестов всё ещё проходят (regression).
- [ ] 7-шаговый MVP-flow M2 в Forest работает (regression).
- [ ] Build size ≤ 2 MB (после твоих правок).
- [ ] `staff/status/ENGINEER.md` обновлён под M3.
- [ ] PR-описание содержит scope, anti-scope, runtime test log, recovery block.

---

## FORBIDDEN

- Любые фичи M4+ (перки, XP-система, уровни игрока).
- Любые фичи M5+ (боссы, инстансы, T3 чертежи).
- Полная логика радио (ветвления, награды, репутация) — М3 только UI-заглушка.
- Модули оружия.
- Yandex SDK.
- Сторонние UI-библиотеки (только Phaser built-in).
- Анимации, шейдеры, звуки.
- Self-merge.
- Push в `main` / `m3-integration` напрямую.
- PAT-токен в URL / echo / print.
- Модификация `content/*.json` (это вотчина Content на M3 — координируй через PR-комментарии).
- Модификация `assets/*` (Artist).
- Модификация `docs/*` (GD).
- Модификация чужих `staff/status/*.md`, `staff/kickoff/*`, `staff/handoff/*`.

---

## Процедура

1. Клонируй репо, `git checkout m3-integration`, прочитай файлы из «Контекст».
2. Прогон `npm install && npm run typecheck && npm run lint && npm run test && npm run build` — должно быть зелёное (49 тестов M2 baseline).
3. Напиши план **строго 5-7 пунктов** (LESSON M2: больше 7 = слишком много, разбивай на continuation):
   - План должен покрывать ровно: multi-zone, 5 mob AI, RadioScene, RadioSignal type, тесты.
4. Отправь Alex'у блокирующим: «План готов, жду апрува PM».
5. После апрува — `git checkout -b m3/world`.
6. **Recovery-safe**: после первого commit (например, RadioSignal type + регистрация сцены-пустышки) — **сразу push + Draft PR** `m3/world → m3-integration`.
7. Дальше — коммить логическими порциями (`feat(M3):`, `test(M3):`, `chore(M3):`).
8. Прогон всех `npm` команд, runtime smoke в Chrome.
9. Обнови `staff/status/ENGINEER.md`.
10. Переведи PR в Ready.
11. Сообщи Alex'у блокирующим: «PR <ссылка>, готов к ревью PM».

Token-budget: разбей работу на **2-3 push'а** (по 2-3 действия каждый), не на один большой commit. Если приближаешься к 50% лимита — push partial + Recovery block в PR с next step. PM подхватит continuation.

**Можно параллельно с:** Content, Artist (координируй cross-refs через PR-комментарии).
**Нельзя до:** GD M3 PR merged + QA Spec APPROVE.
