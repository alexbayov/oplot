# Handoff: Game Designer — Веха M4

> **Роль:** Game Designer (amendment к существующему GDD)
> **Веха:** M4 — Перки и прогрессия
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m4-integration`
> **Твой PR-branch:** `m4/gd-amendment`
> **PR base:** `m4-integration` (НЕ `main`)

---

## Preconditions

- [x] M3 закрыта (gate-close PR #30 merged в `main` 2026-05-21).
- [x] `m4-integration` создана от `main` PM-ом (HEAD `0b1de53`).
- [x] PM kickoff PR (`pm/m4-kickoff → m4-integration`) merged — там M4 dashboard и эти handoff'ы.
- [x] GDD §1–§7 покрывает M1/M2/M3 (core loop / combat / inventory / craft / mobs / json / radio stub).
- [x] `balance.md` имеет числа M1/M2/M3 — НЕ трогай эти числа, только **добавляй** §M4.

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/roles/GAME_DESIGNER.md` | Твоя роль, DoD |
| `staff/status/M4.md` | M4 scope, anti-scope, DoD |
| `staff/handoff/M3-SUMMARY.md` | Что унаследовано с M3 |
| `docs/GDD.md` §1–§7 | Существующая спека M1/M2/M3 (не переписывай, только дополняй) |
| `docs/balance.md` | Существующие числа (не трогай, только добавляй §M4) |
| `staff/PLAN.md` §3 | Что должно быть на M4 |
| `docs/content-brief.md` | Правила механической уникальности контента |

---

## Твои deliverables

### 1. `docs/GDD.md` — новая §`Прогрессия` (XP + 8 перков + level-up flow)

Добавь новую top-level секцию (после существующей §7 Radio stub — пусть будет §8 или промаркируй как «§Прогрессия (M4)»). Опиши:

#### 1.1 XP — источники

- **Источник 1 (M4 core):** убийство моба → `mob.xp_reward` (число задаёшь в §M4 balance — индивидуально для каждого моба, см. п. 4).
- **Источник 2 (опц., если решишь):** успешный return на базу — фиксированный +`base_xp_per_sortie` (например, 10). НЕ обязательно для M4 — оставь на твоё усмотрение, но фиксируй явно в GDD.
- **НЕ источники на M4 (явно прокомментируй):** craft, поднятие лута, исследование зон (всё на M5+ как «exploration XP refactor»).

#### 1.2 XP-curve formula

Опиши формулу пересчёта `total_xp → level`. Рекомендованная (простая, для проверки на 10 уровней playthrough):

```
threshold(level) = base_xp * level ^ 1.5
```

где `base_xp = 50` (т.е. level 1→2 требует 50 XP, 2→3 требует 50*2^1.5 ≈ 141, и т.д.). Альтернатива — линейная (`base * level`) или геометрическая (`base * 2^(level-1)`). Выбери одну и зафиксируй формулу + числа на уровни 1-10 в `balance.md` §M4.

ОГРАНИЧЕНИЯ: формула должна давать **достижимый level 5+** за 1-2 часа игры (метрика playtest'а — но playtest M4 за рамками amendment-сессии, ориентируйся на «10-20 убийств = level-up на ранних уровнях»).

#### 1.3 Level-up flow

При накоплении XP до `threshold(current_level + 1)`:

1. Триггерится level-up event.
2. Открывается `LevelUpScene` popup (overlay на текущей сцене).
3. Игроку показывается **3 случайных перка** из пула 8 (без повторов; если уже все взяты — что делать: либо «нечего предложить, +HP_max автоматически», либо «уровни закончились», ты выбираешь).
4. Игрок выбирает 1 из 3 → перк добавляется в `GameState.player.perks[]`.
5. Popup закрывается, игрок возвращается на исходную сцену.

Правила:
- Уровни накапливаются (можно получить level-up в любой сцене — Combat / Base / Sortie / Map).
- Если за один kill можно получить несколько level-up'ов (overkill XP) — обработай: либо «сразу несколько popup'ов подряд», либо «overkill XP сгорает». Зафиксируй в GDD.
- 8 перков финальный размер пула на M4 — расширение пула под M5+ refactor.

### 2. `docs/GDD.md` — новая §6.X `Perk` JSON schema

Добавь после существующих §6.X (Item / Recipe / Mob / Zone / RadioSignal) новую подсекцию `Perk`:

```json
{
  "id": "tough_skin",
  "name": "Закалённая кожа",
  "description": "+15 HP к максимальному здоровью.",
  "type": "additive",          // "additive" | "multiplicative" | "percentage"
  "stat": "hp_max",            // имя стата (см. список ниже)
  "value": 15                  // число — значение модификатора
}
```

Стандартизированные `stat` значения для M4 (СТРОГО фиксированный enum):
- `hp_max` — максимум HP игрока
- `damage` — урон в combat
- `weight_penalty_multiplier` — множитель overweight return_time penalty (значение < 1 = bonus, > 1 = malus)
- `loot_quantity_multiplier` — множитель количества drop из мобов (значение > 1 = больше лута)
- `crit_chance` — chance крита (0..1, additive bonus)
- `armor_efficiency` — множитель mitigation от armor (> 1 = better)
- `crafting_speed_multiplier` — множитель craft_time (< 1 = быстрее)
- `xp_gain_multiplier` — множитель XP награды (> 1 = больше XP)

В JSON-схеме укажи валидаторы:
- `id` — snake_case, уникален.
- `type` — enum [additive|multiplicative|percentage].
- `stat` — enum (8 значений выше).
- `value` — number > 0.

### 3. `docs/GDD.md` — anti-scope reminder в §Прогрессия

В верхней части §Прогрессия явно зафиксируй (форма subsection «§Прогрессия — скоуп и anti-scope M4»):

- **M4 scope:** 8 пассивных перков, выбор из 3 рандомных при level-up.
- **M4 anti-scope:**
  - **Skill tree (поинты + ноды + prereq'и) — НЕ M4, это M5+ refactor path** («perk system evolution»). M4 = flat pool. M5 может перерезать архитектуру: добавить `prereq: PerkId[]`, `tier: 1|2|3`, `cost: number`, инвертировать выбор (игрок copies points в tree). M4 GDD умышленно делает простой JSON schema, чтобы M5 refactor был аддитивным.
  - **Active abilities / cooldowns — НЕ M4**, это M5+.
  - **Боссы / T3 чертежи — НЕ M4**, это M5.
  - **Полная радио-логика — НЕ M4**, это M6.
  - **Yandex SDK / Save / Leaderboard — НЕ M4**, это M8. M4 perks хранятся только в session memory.

### 4. `docs/balance.md` — новая §M4 «Прогрессия — числа»

Добавь секцию `§M4 — Прогрессия`:

#### 4.1 XP-curve

Заполни таблицу `level → threshold`:

| Level | Threshold XP (от 0) | Cumulative XP |
|---|---|---|
| 1→2 | 50 | 50 |
| 2→3 | ~141 | ~191 |
| ... | ... | ... |
| 9→10 | ~1349 | ~5000 |

(Числа примерные — пересчитай по своей формуле для уровней 1-10.)

#### 4.2 Mob XP rewards

Для всех 8 существующих мобов (3 M1 + 5 M3) укажи `xp_reward`. Например:

| Mob | xp_reward |
|---|---|
| marauder | 25 |
| wild_dog | 15 |
| mutant | 30 |
| (M3 mob 1) | ... |
| ... | ... |

Логика: слабые мобы — 10-20 XP, средние — 25-40, тяжёлые — 50-80.

#### 4.3 8 perk numbers

Для всех 8 перков (имена из `staff/status/M4.md`) укажи `type / stat / value`:

| Perk id | Name | type | stat | value |
|---|---|---|---|---|
| tough_skin | Закалённая кожа | additive | hp_max | 15 |
| sharp_blade | Острое лезвие | multiplicative | damage | 1.15 |
| lean_pack | Лёгкая сумка | multiplicative | weight_penalty_multiplier | 0.85 |
| lucky_scavenger | Удачливый сборщик | multiplicative | loot_quantity_multiplier | 1.20 |
| keen_eye | Острый глаз | additive | crit_chance | 0.05 |
| reinforced_plates | Усиленные пластины | multiplicative | armor_efficiency | 1.15 |
| quick_hands | Быстрые руки | multiplicative | crafting_speed_multiplier | 0.90 |
| fast_learner | Быстрая обучаемость | multiplicative | xp_gain_multiplier | 1.20 |

(Числа примерные — финальные определяешь ты на основе game feel; типы НЕ меняй, stat'ы НЕ меняй — это API контракт с Engineer.)

### 5. Anti-scope reminder в начале amendment

В верхней части §Прогрессия / §6.X / §M4 явно повтори, что **НЕ** входит в M4:

- Skill tree / поинты / prereq'и / tiers (M5+ refactor path).
- Активные ability / cooldowns / triggered effects (M5+).
- Боссы / T3 чертежи (M5).
- Полная логика радио (M6).
- Yandex SDK / persistence (M8).

---

## Definition of Done (твой чек-лист перед PR)

- [ ] §`Прогрессия` (или §8) добавлена в `docs/GDD.md` — XP-источники, формула, level-up flow.
- [ ] §6.X `Perk` JSON schema добавлена — fields + enums.
- [ ] §`Прогрессия — anti-scope M4` явно фиксирует «skill tree = M5+ refactor path».
- [ ] `docs/balance.md` имеет §M4 — XP-curve table (10 уровней) + mob xp_reward (8 мобов) + 8 perk numbers.
- [ ] **Существующие §1–§7 GDD и числа M1/M2/M3 в balance.md НЕ изменены** (только добавления).
- [ ] 8 перков **механически уникальны** (разные stat'ы, нет дублей).
- [ ] `staff/status/GAME_DESIGNER.md` обновлён под M4.
- [ ] PR-описание содержит scope, anti-scope, что нового в GDD/balance, что НЕ изменено + Recovery block.

---

## FORBIDDEN

- Любые правки `docs/GDD.md` §1–§7 (только добавляй §Прогрессия / §6.X / §M4 anti-scope; не переписывай существующее).
- Любые правки чисел M1/M2/M3 в `balance.md` (только добавляй §M4).
- Любые правки `content/*.json` (это вотчина Content на M4).
- Любые правки кода (`src/`).
- Любые правки ассетов (`assets/`).
- Self-merge.
- Push в `main` / `m4-integration` напрямую.
- PAT-токен в URL / в выводе любых команд (Authorization header через GIT_ASKPASS или env var; никогда не печатай токен).
- Включение в M4 фич из M5+ (skill tree, active abilities, боссы) — см. anti-scope выше.

---

## Процедура

1. Клонируй репо, `git checkout m4-integration`, прочитай файлы из «Контекст».
2. Напиши **короткий план** (5-7 пунктов) → отправь Alex'у блокирующим: «План готов, жду апрува PM».
3. После апрува — `git checkout -b m4/gd-amendment`.
4. **Recovery-safe**: после первой 1-2 правки сделай первый push + открой Draft PR `m4/gd-amendment → m4-integration` (это спасёт работу при смерти сессии).
5. Дополни GDD §Прогрессия / §6.X Perk schema + balance §M4.
6. Обнови `staff/status/GAME_DESIGNER.md` (что сделано, под M4).
7. Сообщи Alex'у блокирующим: «GD M4 amendment готов, PR <ссылка>, жду PM-ревью + QA Spec».

Token-budget: эта задача — ~30-60 минут чтения + 60-120 минут письма. Если приближаешься к 50% лимита — push partial + recovery block в PR, PM подхватит continuation.
