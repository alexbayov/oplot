# Оркестрация: Playbook для PM

> Этот документ — инструкция для PM-сессии. Как запускать вехи, передавать контекст, восстанавливаться после обрывов.

## 1. Структура репозитория

```
oplot/
├── staff/
│   ├── PLAN.md              # Вехи, сроки, Definition of Done
│   ├── PROCESS.md           # Партитура: цикл вехи, шаблоны промтов
│   ├── TEAM.md              # Кто за что отвечает
│   ├── ORCHESTRATION.md     # (этот файл) Playbook для PM
│   ├── roles/               # Детальные описания ролей
│   │   ├── GAME_DESIGNER.md
│   │   ├── CONTENT.md
│   │   ├── ENGINEER.md
│   │   ├── ARTIST.md
│   │   └── QA.md
│   ├── status/              # Текущее состояние каждой роли
│   │   ├── PM.md
│   │   ├── GAME_DESIGNER.md
│   │   ├── CONTENT.md
│   │   ├── ENGINEER.md
│   │   ├── ARTIST.md
│   │   └── QA.md
│   ├── kickoff/             # Короткие промты для старта сессий (копипаст)
│   │   └── M{N}-{ROLE}.md
│   ├── handoff/             # Полные брифинги для каждой роли на вехе
│   │   └── M{N}-{ROLE}.md
│   ├── prompts/             # Сводные промты по вехам
│   │   └── M{N}.md
│   └── decisions/           # Решения, бэклог, лог изменений
│       ├── DECISIONS.md
│       ├── BACKLOG.md
│       └── CHANGELOG.md
├── docs/
│   ├── GDD.md               # Game Design Document (источник правды по механикам)
│   ├── balance.md            # Все числа, формулы, таблицы
│   ├── style-guide.md        # Визуальный стиль, палитра, референсы
│   └── content-brief.md      # Правила контента, уникальность, шаблоны
├── content/
│   ├── items.json            # Все предметы (ресурсы, оружие, броня, расходники)
│   ├── mobs.json             # Все мобы (статы, дроп, поведение)
│   ├── recipes.json          # Все рецепты крафта
│   ├── zones.json            # Все зоны (мобы, ресурсы, уровень)
│   └── radio.json            # Радио-сигналы (текст, тип, награда/засада)
├── src/                      # Код (Phaser 3 + TypeScript)
├── assets/
│   ├── sprites/              # Спрайты персонажей, мобов, предметов
│   ├── ui/                   # UI-элементы, иконки, кнопки
│   └── audio/                # Звуки, музыка
├── public/                   # Статические файлы (index.html)
└── README.md
```

## 2. Как PM запускает веху M{N}

### Шаг 0: Подготовка (PM делает сам)

1. Проверь PLAN.md: M{N-1} помечена [x] DONE.
2. Создай ветку `m{N}-integration` от `main` и запушь на remote. Это baseline всех role PR вехи.
3. Напиши `staff/prompts/M{N}.md` — сводный ТЗ по ролям.
4. Напиши 6 файлов kickoff: `staff/kickoff/M{N}-{ROLE}.md`. Каждый должен явно указывать base = `m{N}-integration`.
5. Напиши 6 файлов handoff: `staff/handoff/M{N}-{ROLE}.md`.
6. Обнови `staff/status/PM.md`: текущая веха = M{N}, статус = KICKOFF.
7. Скажи Alex'у: «M{N} готова к запуску. Начинай с GD».

### Шаг 1-5: См. PROCESS.md §1.1

### Шаг 6: Закрытие

1. PM мержит все approved role PR в `m{N}-integration` сам после QA Acceptance approve. Role-сессии никогда не мержат себя сами.
2. PM открывает единственный gate-close PR `m{N}-integration → main` с описанием вехи и чек-листом.
3. Alex/Заказчик мержит gate-close PR в `main` вручную.
4. PM обновляет PLAN.md: M{N} = [x] DONE.
5. PM обновляет decisions/CHANGELOG.md и пишет `staff/handoff/M{N}-SUMMARY.md`.
6. PM обновляет все status/*.md.
7. Подготовь M{N+1} (вернись к Шаг 0).

## 3. Как Alex использует kickoff

```
Для ПОСЛЕДОВАТЕЛЬНЫХ шагов (GD, QA-spec, QA-accept):
  1. Alex открывает новую Devin-сессию
  2. Копипастит содержимое kickoff/M{N}-{ROLE}.md
  3. Ждёт результат
  4. Передаёт PM для ревью
  5. После OK → следующий шаг

Для ПАРАЛЛЕЛЬНЫХ шагов (Eng + Content + Artist):
  1. Alex открывает 3 новые Devin-сессии ОДНОВРЕМЕННО
  2. В каждую копипастит свой kickoff/M{N}-{ROLE}.md
  3. Ждёт все 3 PR
  4. Передаёт PM для интеграции
```

## 4. Recovery-протокол

### Главный источник факта

Перед любым recovery PM читает:

1. `staff/status/M{N}.md` — единый dashboard текущей вехи.
2. `staff/STATE_MACHINE.md` — gate-состояния и правила переходов.
3. `staff/status/*.md` — детализация по ролям.
4. GitHub PR list — фактические ветки, PR, mergeability и комментарии.

Если handoff-файл говорит, что PR уже создан, но GitHub/status-dashboard этого не подтверждают, handoff считается **исходным заданием**, а не фактом.

### Обрыв Devin-сессии роли

```
1. PM проверяет staff/status/{ROLE}.md
2. PM проверяет, есть ли незавершённый PR
3. PM создаёт recovery-kickoff:

   «RECOVERY — продолжение M{N} для роли {ROLE}.
   Клонируй https://github.com/alexbayov/oplot
   Прочитай staff/status/{ROLE}.md — там написано что сделано и что нет.
   Прочитай staff/handoff/M{N}-{ROLE}.md — полный бриф.
   Доделай то, что в "Что НЕ сделано". Создай PR.»

4. Alex копипастит → новая сессия подхватывает
```

### Обрыв PM-сессии

```
1. Новая PM-сессия читает:
   - staff/status/M{N}.md — единый dashboard текущей вехи
   - staff/STATE_MACHINE.md — текущий gate и правила переходов
   - staff/PLAN.md — какая веха текущая
   - staff/status/PM.md — на каком шаге остановились
   - staff/status/*.md — кто что успел
   - decisions/CHANGELOG.md — последние решения
2. Продолжает с того шага, на котором остановился предыдущий PM
```

### Recovery-блок в каждом PR

Каждый role PR должен содержать блок:

```markdown
## Recovery

If this session dies, next Devin should:
1. checkout `<branch>`;
2. read `staff/status/{ROLE}.md`;
3. read `staff/handoff/M{N}-{ROLE}.md`;
4. read this PR description and comments;
5. continue from: `<next concrete step>`;
6. update only this role status file;
7. do not self-merge.
```

Role sessions must not update `staff/status/M{N}.md`, `PLAN.md`, `CHANGELOG.md`, or other roles' status files. PM synchronizes those after reviewing the role PR.

## 5. Формат status-файлов

Каждый `staff/status/{ROLE}.md` имеет формат:

```markdown
# Status: {ROLE}

**Текущая веха:** M{N}
**Статус:** IN_PROGRESS | DONE | BLOCKED | NOT_STARTED
**Последнее обновление:** {дата}

## Что сделано
- {артефакт 1}
- {артефакт 2}

## Что НЕ сделано
- {задача 1}
- {задача 2}

## Блокеры
- {блокер или "нет"}

## PR
- {ссылка на PR или "нет"}
```

## 6. Формат kickoff-файлов

```markdown
# Kickoff: M{N} — {ROLE}

> Скопируй весь этот файл в новую Devin-сессию.

ROLE: {ROLE}
MILESTONE: M{N} — {название вехи}
REPO: https://github.com/alexbayov/oplot

ЗАДАЧА: {1-2 предложения}

ШАГИ:
1. Клонируй репо.
2. Прочитай staff/handoff/M{N}-{ROLE}.md (полный бриф).
3. Прочитай staff/PROCESS.md §1.2 (внутренний цикл).
4. Напиши план, отправь мне.
5. После апрува — работай по плану.
6. Создай PR, обнови status/{ROLE}.md.
7. Сообщи мне ссылку на PR.
```

## 7. Формат handoff-файлов

```markdown
# Handoff: M{N} — {ROLE}

## Контекст
{Что уже сделано, на что опираться}

## Твоя задача
{Подробное описание}

## Артефакты на выходе
- {файл 1}: {описание}
- {файл 2}: {описание}

## Запрещено
- {ограничение 1}
- {ограничение 2}

## Чек-лист готовности
- [ ] {критерий 1}
- [ ] {критерий 2}

## Связанные документы
- staff/PLAN.md §{N}
- docs/GDD.md §{секция}
- staff/roles/{ROLE}.md
```
