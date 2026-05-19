# Handoff: QA Acceptance — Веха M2

> **Роль:** QA / Acceptance Critic
> **Веха:** M2 — Играбельный MVP
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m2-integration`
> **Твой PR-branch:** `qa/m2-acceptance`
> **PR base:** `m2-integration`

---

## Preconditions

- [x] M1 закрыта (см. `staff/handoff/M1-SUMMARY.md`).
- [x] M2 Engineer PR `m2/gameplay → m2-integration` существует, открыт и mergeable.
- [x] PM-ревью на Engineer PR оставлено как APPROVE или CHANGES_REQUESTED (если CHANGES — ты не запускаешься до фикса).

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/status/M2.md` | Текущий gate-state, скоуп, anti-scope, DoD |
| `staff/handoff/M2-ENG.md` | Что должен был сделать Engineer (источник твоих чек-листов) |
| `staff/handoff/M1-SUMMARY.md` | M1 unchanged baseline для regression check |
| `docs/GDD.md` §1–§6 | Авторитетная спецификация механик M2 |
| `docs/balance.md` | Числа |
| `staff/roles/QA.md` | Твоя роль |
| `staff/PROCESS.md`, `staff/STATE_MACHINE.md` | Workflow и gate-переходы |

---

## Чек-листы

### 1. Сборка / статика

- [ ] `npm install` — 0 vulnerabilities, нет ошибок установки.
- [ ] `npm run typecheck` — 0 errors.
- [ ] `npm run lint` — 0 errors (warnings допустимы, но опиши их в отчёте).
- [ ] `npm run build` — успешно. Chunk-warning на Phaser bundle допустим, dist-размер ≤ 2 МБ.
- [ ] `npm run test` — все unit-тесты зелёные. Проверь, что юнит-тесты реально покрывают:
  - rollDamage / calcInitiative / applyAttack edge-cases;
  - computeWeight / canAddItem / applyLootLoss;
  - canCraft happy-path и 4+ missing-ingredient ветки;
  - generateMobLoot детерминированный (seeded).

### 2. Регрессия M1

- [ ] `git diff m2-integration...m2/gameplay -- content/` — diff пустой (контент M1 не тронут).
- [ ] `git diff m2-integration...m2/gameplay -- assets/` — diff пустой.
- [ ] `git diff m2-integration...m2/gameplay -- docs/` — diff пустой (или только тривиальные правки опечаток).
- [ ] `git diff m2-integration...m2/gameplay -- src/types/` — diff пустой (если изменения есть, проверь, что они аддитивны и совместимы с GDD §6).

### 3. Runtime — 7-шаговый MVP-flow (Chrome, `npm run dev`)

Воспроизведи MVP-flow из `staff/status/M2.md` «Скоуп M2 (из PLAN §2)»:

1. [ ] Открытие приложения < 5 сек (на твоей машине, не 4G). Без console.error.
2. [ ] `BaseScene`: показан HP игрока, экипированный нож, 3 кнопки.
3. [ ] `MapScene`: показана единственная зона Forest. Кнопка «Войти» работает.
4. [ ] `SortieScene`: пред-показ вылазки. Кнопка «Бой» переключает на `CombatScene`.
5. [ ] `CombatScene`: видны HP обоих, кнопки «Атака», «Укрытие», «Аптечка», «Отступить». Удар наносится по формуле из GDD §2. AI моба соответствует §5.
6. [ ] `LootScene`: список выпавших ресурсов. Проверь блокировку «Возврат» при искусственном перегрузе (например, отредактируй временно `HERO_MAX_WEIGHT_KG_BASE` в локальной копии `balance.md` — но не коммить).
7. [ ] `BaseScene` после возврата: HP сохранён, baseStash обновлён.
8. [ ] `InventoryScene`: показ baseStash с весом каждого стака.
9. [ ] `CraftScene`: список 5 рецептов. `bandage` крафтится, если есть `cloth ≥ 3`. После крафта — соответствующий update.
10. [ ] Сценарий поражения: поспеши проиграть моб'у; убедись, что применяется loot loss 50% по правилу из GDD §3.

### 4. Формулы — соответствие GDD

Для каждого пункта найди в коде функцию и сверь формулу:

- [ ] `calcInitiative` ≡ GDD §3 «Штраф инициативы».
- [ ] `return_time_s` ≡ GDD §3 «Скорость возврата».
- [ ] `applyAttack` учитывает `defense` и `vs_melee_bonus` (только при `mob.type === "animal"` per GDD §6.1 — wild_dog в MVP).
- [ ] `applyLootLoss` ≡ GDD §3 «Правило 50%»: выкидывание сверху вниз по убыванию веса предмета, экипировка не теряется.
- [ ] `canCraft` ≡ GDD §4: `∀ ingredient: inventory[ingredient.item_id] ≥ ingredient.count`.

### 5. Anti-scope

- [ ] В коде нет упоминаний радио, перков, боссов, модулей оружия, коммуны, Yandex SDK.
- [ ] В коде нет сторонних UI-библиотек (только Phaser). `package.json` deps не добавляет ничего за пределы того, что нужно для GameState/RNG/Vitest.
- [ ] В коде нет анимаций фреймами, шейдеров, звуков.

### 6. Архитектура / читабельность

- [ ] `src/state/GameState.ts` существует и реально используется всеми сценами.
- [ ] `src/systems/{combat,weight,craft,loot}.ts` — чистые функции, не используют Phaser API.
- [ ] Нет `any`. Нет закомментированного «черновика».
- [ ] Сцены используют типы из `src/types/` и `src/state/` без дублирования.

### 7. Статус-файл

- [ ] `staff/status/ENGINEER.md` обновлён под M2 и описывает scope/done/blockers.

---

## Verdict

После прогона всех чек-листов опубликуй один из двух вариантов в `staff/status/QA.md` и в PR-комментарии на Engineer PR:

### APPROVE

```
QA Acceptance M2 — APPROVE
Дата: <YYYY-MM-DD>
Engineer PR: #<номер>
Все чек-листы пройдены; формулы соответствуют GDD §1–§6; регрессии M1 нет; anti-scope соблюдён.
Runtime smoke: 7-шаговый MVP-flow пройден.
```

### CHANGES_REQUESTED

```
QA Acceptance M2 — CHANGES_REQUESTED
Дата: <YYYY-MM-DD>
Engineer PR: #<номер>

Блокеры (must-fix перед merge):
1. <file:line> — <конкретная проблема, ссылка на GDD-секцию> 
2. ...

Замечания (не-блокер, на усмотрение Engineer):
- ...
```

---

## FORBIDDEN

- Править код / тесты / docs / content / assets в Engineer PR.
- Self-merge своего QA-report PR или Engineer PR.
- Push в `main` / `m2-integration` напрямую.
- PAT-токен в URL.
- Предлагать новые фичи / scope-расширения.
- Запускать проверки вне M2 scope (например, тестировать Yandex SDK — он на M8).

---

## Процедура

1. Клонируй репо, `git checkout m2-integration`, `npm install`.
2. Прочитай все файлы из таблицы «Контекст».
3. `git fetch origin && git checkout m2/gameplay`.
4. Прогоняй чек-листы 1–7 в порядке.
5. Документируй findings в `staff/status/QA.md` под секцией «M2 Acceptance report».
6. `git checkout -b qa/m2-acceptance` от текущего HEAD `m2-integration` (а не от `m2/gameplay`).
7. Закоммить только `staff/status/QA.md`.
8. Открой PR `qa/m2-acceptance → m2-integration`, с описанием = твой report.
9. Сообщи Alex'у блокирующим в формате выше.
