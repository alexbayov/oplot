# Handoff: QA Spec Review — Веха M4

> **Роль:** QA Engineer (spec-review)
> **Веха:** M4 — Перки и прогрессия
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m4-integration`
> **Твой PR-branch:** `qa/m4-spec-review`
> **PR base:** `m4-integration` (НЕ `main`)

---

## Preconditions

- [x] GD M4 PR (`m4/gd-amendment → m4-integration`) **Ready** (не Draft).
- [x] PM сообщил тебе: «GD amendment Ready, дай verdict».

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/roles/QA.md` | Твоя роль |
| `staff/status/M4.md` | M4 scope, anti-scope, DoD |
| `staff/handoff/M3-SUMMARY.md` | Унаследованные ограничения с M3 |
| `docs/GDD.md` | Целиком (включая GD-amendment §Прогрессия + §6.X Perk) |
| `docs/balance.md` | Целиком (включая §M4) |
| GD PR diff | `gh pr diff <PR>` или GitHub UI |

---

## Чек-листы (7 проверок)

### 1. §`Прогрессия` присутствует и непротиворечива

- Есть подсекция «XP — источники» (минимум 1 источник: kill mob).
- Есть подсекция «XP-curve formula» (явная формула + примеры чисел для уровней 1-10 в balance §M4).
- Есть подсекция «Level-up flow» (триггер → popup → выбор из 3 → state update).
- Явно описано поведение «overkill XP» (carry over / сгорает).
- Явно описано поведение «все перки взяты» (что делать если пул из 8 исчерпан).

### 2. §6.X `Perk` JSON schema валидна

- `id` — snake_case, уникальный.
- `name` — string, человекочитаемый.
- `description` — string.
- `type` — enum [additive, multiplicative, percentage].
- `stat` — enum (8 fixed значений из GDD).
- `value` — number > 0.
- Нет полей `prereq` / `tier` / `cost` / `cooldown` (это anti-scope M5+).

### 3. `balance.md` §M4 XP-curve

- Таблица `level → threshold` присутствует для уровней 1-10.
- Формула пересчёта явная и совпадает с GDD §1.2.
- Числа достижимы за 1-2 часа playthrough (subjective check — отметь, если кажется слишком долго / быстро).

### 4. `balance.md` §M4 mob xp_reward + 8 perk numbers

- Для всех 8 мобов (3 M1 + 5 M3) указан `xp_reward`.
- Для всех 8 перков указан `type / stat / value`.
- Числа `value` правдоподобны (не +1000 HP, не -90% weight, не x10 damage).

### 5. Anti-scope M4 явно зафиксирован

В GDD §Прогрессия (или соседней секции):
- «Skill tree / поинты / prereq'и» — **M5+ refactor path**.
- «Активные ability / cooldowns» — **M5+**.
- «Боссы / T3 чертежи» — **M5**.
- «Полная радио-логика» — **M6**.
- «Yandex SDK / save» — **M8**.

Grep-чек: `grep -ni "skill[_ ]tree\|skill[_ ]point\|active[_ ]ability\|cooldown" docs/GDD.md` — если есть hits, они должны быть **только** как «M5+ evolution path», не как M4 features.

### 6. Consistency с M3 (не сломали унаследованное)

- `docs/GDD.md` §1–§7 не изменены.
- `docs/balance.md` §M1/§M2/§M3 не изменены.
- Mob `xp_reward` добавлен НЕ как изменение существующих M1/M2/M3 mob stats (HP/damage/speed), а как **новое поле** для каждого моба.

### 7. Recovery-safe + PR hygiene

- GD PR имеет Recovery block в body.
- GD PR base = `m4-integration` (НЕ `main`).
- GD PR scope = только `docs/GDD.md` + `docs/balance.md` + `staff/status/GAME_DESIGNER.md`. Никакой `content/`, `src/`, `assets/`, чужие staff/.

---

## Verdict

**APPROVE** если все 7 чек-листов PASS.

**CHANGES_REQUESTED** если хотя бы 1 fail. В отчёте укажи:
- Что конкретно не так (с цитатой из GDD/balance).
- Что должно быть (например: «§Прогрессия должна явно зафиксировать поведение overkill XP, сейчас неоднозначно»).
- Это блокер или non-blocking (если non-blocking — может вкатиться, но запиши в M5 follow-ups).

---

## Definition of Done (твой чек-лист перед PR)

- [ ] Прочитан GDD + balance + GD PR diff целиком.
- [ ] Все 7 чек-листов отмечены PASS / FAIL с обоснованием.
- [ ] `staff/status/QA.md` обновлён — секция «# M4 Spec Review» с полным verdict.
- [ ] PR `qa/m4-spec-review → m4-integration` открыт, в body — copy verdict'а из `staff/status/QA.md`.
- [ ] Alex уведомлён блокирующим: «QA Spec M4 verdict <APPROVE|CHANGES_REQUESTED>, PR <ссылка>».

---

## FORBIDDEN

- Self-merge.
- Изменять `docs/`, `src/`, `content/`, `assets/`, чужие `staff/` файлы (только `staff/status/QA.md`).
- PAT в URL / echo / print.
- Verdict APPROVE если есть нарушения anti-scope M4 (M5+ skill tree / active / boss / SDK как M4 features).
- Резолвить расхождения «balance vs GDD» самостоятельно — это эскалация в PM + GD.

---

## Процедура

1. Клонируй репо, `git checkout m4-integration`, `git fetch origin m4/gd-amendment`, `git diff origin/m4-integration..origin/m4/gd-amendment -- docs/`.
2. Прочитай `docs/GDD.md` (целиком) + `docs/balance.md` (целиком, включая §M4).
3. Прогони 7 чек-листов.
4. Запиши отчёт в `staff/status/QA.md` (секция «# M4 Spec Review»).
5. Открой PR `qa/m4-spec-review → m4-integration` (одна правка — `staff/status/QA.md`).
6. Сообщи Alex'у блокирующим.

Token-budget: эта задача — ~20-30 минут чтения + 20-40 минут отчёта. Если приближаешься к 50% лимита — push partial + recovery block в PR.
