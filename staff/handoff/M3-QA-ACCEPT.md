# Handoff: QA Acceptance — Веха M3

> **Роль:** QA / Acceptance Critic
> **Веха:** M3 — Расширение мира
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m3-integration`
> **Твой PR-branch:** `qa/m3-acceptance`
> **PR base:** `m3-integration`

---

## Preconditions

- [x] M2 закрыта.
- [x] GD M3 amendment merged + QA Spec APPROVE.
- [x] Content M3 PR `m3/content → m3-integration` Ready + PM-review APPROVE.
- [x] Engineer M3 PR `m3/world → m3-integration` Ready + PM-review APPROVE.
- [x] Artist M3 PR `m3/art → m3-integration` Ready + PM-review APPROVE.

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/status/M3.md` | Скоуп, anti-scope, DoD M3 |
| `staff/handoff/M3-ENG.md` | Что Engineer должен был сделать |
| `staff/handoff/M3-CONTENT.md` | Что Content должен был сделать |
| `staff/handoff/M3-ARTIST.md` | Что Artist должен был сделать |
| `staff/handoff/M3-GD.md` | Что GD должен был сделать (спека) |
| `staff/handoff/M2-SUMMARY.md` | M2 baseline для regression |
| `docs/GDD.md` §1–§7 | Авторитетная спецификация |
| `docs/balance.md` §M3 | Числа |
| `docs/content-brief.md` | Правила уникальности |

---

## Чек-листы

### 1. Сборка / статика

- [ ] `npm install` — 0 vulnerabilities, нет ошибок.
- [ ] `npm run typecheck` — 0 errors.
- [ ] `npm run lint` — 0 errors.
- [ ] `npm run build` — успешно, размер ≤ 2 MB.
- [ ] `npm run test` — все тесты зелёные. Тестов ≥ 56 (49 M2 + ≥ 5 mob AI + ≥ 2 unlock_condition).

### 2. Регрессия M2

- [ ] `git diff m2-integration...m3-integration -- src/state/GameState.ts` — изменения только аддитивные (нет breaking changes в существующих полях).
- [ ] 7-шаговый MVP-flow M2 в Forest всё ещё работает: BaseScene → MapScene → Forest → SortieScene → CombatScene → LootScene → ReturnScene → BaseScene → InventoryScene → CraftScene. Никаких регрессий.
- [ ] Все 49 M2 unit-тестов всё ещё проходят.

### 3. Runtime smoke — M3 features

- [ ] **MapScene показывает 3 зоны.**
  - Forest доступен (unlock_condition = start).
  - Warehouse + City — статус согласно GDD §6.4.M3 unlock_condition'ам.
- [ ] **Сценарий A — Warehouse run:** залогируй текущий unlock state. Если требуется условие — выполни (например, пройди sortie в Forest depth 2). Войди в Warehouse → SortieScene → Combat с новым мобом → LootScene с новыми ресурсами → ReturnScene → BaseScene.
  - Подтверди, что новый mob ведёт себя согласно `behavior_id` из §5.4.
  - Подтверди, что хотя бы 1 zone-exclusive item падает только здесь.
- [ ] **Сценарий B — City run:** аналогично, после открытия зоны.
- [ ] **RadioScene.**
  - На BaseScene есть кнопка «Радио».
  - Клик → RadioScene → видны 2-3 dummy-сигнала (или «Эфир пуст» если все dismissed / expired).
  - Клик по сигналу → видно body + 2 кнопки.
  - «Откликнуться» → сигнал убирается, возврат на BaseScene. Никаких real-world последствий (не падает loot, не меняется HP).
  - «Игнорировать» → то же поведение.
- [ ] **CraftScene** показывает ≥ 15 рецептов. Хотя бы 1 новый рецепт крафтится при наличии ингредиентов из новой зоны.

### 4. Формулы — соответствие GDD

- [ ] Все 5 новых mob AI behaviors соответствуют описанию в §5.4 (один тест на behavior + ручная верификация).
- [ ] Зональные `unlock_condition` работают согласно §6.4.M3 (один тест на каждую зону).
- [ ] `RadioSignal.expires_after_sorties` уменьшается при каждой вылазке (если это указано в §7).

### 5. Контент vs спека

- [ ] `content/items.json` ≥ 30 items, все cross-refs (`drop_table.item_id`, `recipes.ingredients[*].item_id`, `recipes.result_id`, `zones.resources[*]`) разрешаются.
- [ ] `content/mobs.json` = 8 mobs, все `behavior_id` соответствуют Engineer-реализации.
- [ ] `content/recipes.json` ≥ 15 recipes.
- [ ] `content/zones.json` = 3 zones.
- [ ] `content/radio.json` ≥ 2 dummy signals со схемой §7.
- [ ] Все числа соответствуют `balance.md` §M3.

### 6. Anti-scope

- [ ] В коде / контенте нет упоминаний перков, XP-уровней, боссов, инстансов, модулей оружия, коммуны, Yandex SDK.
- [ ] RadioScene **только UI**, нет реальной логики ветвлений / наград / репутации.
- [ ] В `package.json` нет новых сторонних UI-библиотек.

### 7. Архитектура / читабельность

- [ ] `src/systems/` — чистые функции, не используют Phaser.
- [ ] `src/scenes/RadioScene.ts` — чистая Phaser scene, переиспользует `createTitle`/UI-helpers из M2.
- [ ] Нет `any`. Нет закомментированного «черновика».
- [ ] Mob AI dispatch (switch / mapping) читаем — каждый новый behavior легко добавить.

### 8. Артефакты

- [ ] 5 новых mob sprites лежат в `assets/sprites/mobs/` (или согласованной директории), имена совпадают с `id`.
- [ ] 2 новых backgrounds: `warehouse.png` + `city.png`.
- [ ] ~10 новых item icons.
- [ ] Общий размер M3 ассетов ≤ 500 КБ.
- [ ] M1 ассеты не тронуты.

---

## Verdict

Опубликуй в `staff/status/QA.md` и в PR-комментариях на 3 role-PR (Content/Engineer/Artist):

### APPROVE

```
QA Acceptance M3 — APPROVE
Дата: <YYYY-MM-DD>
Engineer PR: #<...>, Content PR: #<...>, Artist PR: #<...>
Все чек-листы §1–§8 пройдены.
Runtime smoke: 3 зоны, 5 новых mob AI, RadioScene UI, 15+ рецептов.
M2 regression: 7-шаговый MVP-flow в Forest работает, 49 baseline тестов зелёные.
```

### CHANGES_REQUESTED

```
QA Acceptance M3 — CHANGES_REQUESTED
Дата: <YYYY-MM-DD>

Блокеры (must-fix перед merge):
1. <role> <file:line> — <конкретная проблема, ссылка на GDD-секцию>
2. ...

Замечания (не-блокер):
- ...
```

---

## FORBIDDEN

- Править код / контент / ассеты / docs в чужих PR — только PR-комментарии и свой QA-report.
- Self-merge.
- Push в `main` / `m3-integration` напрямую.
- PAT-токен в URL / echo / print.
- Предлагать новые фичи / scope-расширения.
- Проверять то, что вне M3 scope (например, RadioScene должна работать как заглушка — НЕ ожидай реальной логики ветвлений, это M6).

---

## Процедура

1. Клонируй репо, `git checkout m3-integration`, `npm install`.
2. Прочитай все файлы из «Контекст».
3. `git fetch origin && git checkout <engineer-branch>` для смоук-теста (или используй `m3-integration` HEAD, если все 3 PR merged до твоего старта).
4. Прогоняй чек-листы 1–8 в порядке.
5. Документируй findings в `staff/status/QA.md` под секцией «M3 Acceptance report».
6. `git checkout -b qa/m3-acceptance` от `m3-integration`.
7. Закоммить только `staff/status/QA.md`. **Recovery-safe**: сразу push + Draft PR `qa/m3-acceptance → m3-integration` в первые 5 минут.
8. После прогона всех чек-листов — переведи PR в Ready, опубликуй verdict.
9. Сообщи Alex'у блокирующим в формате выше.

Token-budget: M3 acceptance — 30-60 минут (больше runtime-тестов чем M2). Если приближаешься к лимиту — push partial verdict (что проверено, что нет) + Recovery block в QA.md. PM подхватит continuation.
