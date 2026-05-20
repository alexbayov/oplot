# Handoff: QA Spec Review — Веха M3

> **Роль:** QA Spec Reviewer (отдельная сессия от QA Acceptance)
> **Веха:** M3 — Расширение мира
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m3-integration`
> **Твой PR-branch:** `qa/m3-spec-review`
> **PR base:** `m3-integration`

---

## Preconditions

- [x] M2 закрыта.
- [x] GD M3 amendment PR (`m3/gd-amendment → m3-integration`) **открыт и готов к ревью**.

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/roles/QA.md` | Твоя роль (QA spec part) |
| `staff/status/M3.md` | Скоуп M3 и anti-scope |
| `staff/handoff/M3-GD.md` | Что GD должен был сделать (твой источник чек-листов) |
| `docs/GDD.md` | Полная спека после GD-amendment — ревьюй секции §5.4, §6.4.M3, §7 |
| `docs/balance.md` | Числа M3 — секция §M3 |
| `docs/content-brief.md` | Правила механической уникальности |

---

## Чек-листы

### 1. §5.4 «Мобы M3»

- [ ] Ровно 5 новых мобов добавлены.
- [ ] Каждый имеет **уникальный AI-паттерн**, отличный от marauder / wild_dog / mutant.
- [ ] Каждый имеет `id`, `name_ru`, `type`, HP, damage_min, damage_max, speed, xp, defense (если есть), дроп-таблицу-ссылку.
- [ ] AI описаны словесно понятно (не «делает атаку», а «при HP < 30% уходит за укрытие на 2 хода»).
- [ ] Нет AI, требующих перков / радио-доверия / multi-phase boss-mechanics.
- [ ] Минимум 1 моб — для Склада, минимум 1 — для Города (zone-coverage).

### 2. §6.4.M3 «Новые зоны M3»

- [ ] Ровно 2 новые зоны: `warehouse` + `city`.
- [ ] Каждая имеет 2-3 уровня глубины с разными mob-listами и resource-listами.
- [ ] Каждая зона имеет **минимум 1 zone-exclusive ресурс**.
- [ ] `unlock_condition` для каждой зоны записано простой формулой/триггером, реализуемым Engineer'ом без новой системы прогрессии (M4 нет на M3).
- [ ] Forest зона (M2) НЕ изменена.

### 3. §7 «Radio structure stub»

- [ ] `RadioSignal` JSON-схема описана.
- [ ] `RadioScene` UI-flow описан (вход → список → выбор → 2 кнопки → выход).
- [ ] Явно отмечено, что на M3 это **заглушка**: кнопки только меняют state без последствий.
- [ ] Phrase «полная логика — M6» присутствует в тексте секции.
- [ ] 2-3 dummy-сигнала описаны как примеры структуры (НЕ как реальный контент — это Content делает).

### 4. `balance.md` §M3

- [ ] Stats для 5 новых мобов согласованы с описанием в §5.4 (числа из balance ≡ числа в GDD-описании).
- [ ] Drop tables для 5 мобов есть, item_id'ы согласованы с тем, что Content планирует добавить (`scrap`, `wood`, `electronics`, `oil`, etc).
- [ ] Numbers для 10 новых рецептов есть.
- [ ] Существующие числа M1/M2 в balance.md **НЕ изменены** (`git diff m3-integration...m3/gd-amendment -- docs/balance.md` — только additions).

### 5. Anti-scope

- [ ] В amendment'е нет перков / уровней / XP-системы / boss-механик / модулей оружия / коммуны / Yandex SDK.
- [ ] Radio section явно заглушечная, не описывает полные ветвления.

### 6. Регрессия

- [ ] §1–§6 GDD не переписаны (`git diff m3-integration...m3/gd-amendment -- docs/GDD.md` — только additions).
- [ ] `staff/status/GAME_DESIGNER.md` обновлён под M3.

---

## Verdict

После прогона всех чек-листов опубликуй один из двух вариантов в `staff/status/QA.md` и в PR-комментарии на GD PR:

### APPROVE

```
QA Spec Review M3 — APPROVE
Дата: <YYYY-MM-DD>
GD PR: #<номер>
§5.4 (5 мобов), §6.4.M3 (2 зоны), §7 (radio stub), balance §M3 — все чек-листы пройдены.
Существующие §1–§6 / M1+M2 числа не тронуты.
Anti-scope соблюдён.
Ready: Content / Engineer / Artist can start параллельно.
```

### CHANGES_REQUESTED

```
QA Spec Review M3 — CHANGES_REQUESTED
Дата: <YYYY-MM-DD>
GD PR: #<номер>

Блокеры (must-fix перед merge):
1. <docs/GDD.md:line> — <конкретная проблема>
2. ...

Замечания (не-блокер):
- ...
```

---

## FORBIDDEN

- Править GDD / balance / content / src / assets в GD PR — только PR-комментарии и свой QA-report.
- Self-merge.
- Push в `main` / `m3-integration` напрямую.
- PAT-токен в URL / echo / print (только Authorization header).
- Предлагать новые фичи для M3 (твоя работа — проверить, что GD сделал то, что планировалось, и что нет scope-extension).

---

## Процедура

1. Клонируй репо, `git checkout m3-integration`, прочитай файлы из «Контекст».
2. `git fetch origin && git checkout m3/gd-amendment`.
3. Прогоняй чек-листы 1–6 в порядке.
4. Документируй findings в `staff/status/QA.md` под секцией «M3 Spec Review».
5. `git checkout -b qa/m3-spec-review` от `m3-integration` (не от GD-ветки).
6. Закоммить только `staff/status/QA.md`. **Recovery-safe**: сразу push + Draft PR `qa/m3-spec-review → m3-integration` после первой записи.
7. Открой Ready PR с описанием = твой verdict.
8. Сообщи Alex'у блокирующим: APPROVE / CHANGES_REQUESTED.

Token-budget: эта задача — 20-40 минут. Если приближаешься к лимиту — push partial verdict + recovery в QA.md, PM подхватит continuation.
