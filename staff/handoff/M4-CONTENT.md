# Handoff: Content Designer — Веха M4

> **Роль:** Content Designer (text + JSON authoring)
> **Веха:** M4 — Перки и прогрессия
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m4-integration`
> **Твой PR-branch:** `m4/content`
> **PR base:** `m4-integration` (НЕ `main`)

---

## Preconditions

- [x] GD M4 amendment merged в `m4-integration` (GDD §Прогрессия + §6.X Perk + balance §M4 готовы).
- [x] QA Spec M4 APPROVE.
- [x] PM сообщил тебе: «Parallel production M4 start, твой scope — perks JSON».

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/roles/CONTENT.md` | Твоя роль |
| `staff/status/M4.md` | M4 scope, anti-scope, DoD |
| `staff/handoff/M3-SUMMARY.md` | Унаследованный контент M3 (29 items / 15 recipes / etc) |
| `docs/GDD.md` §Прогрессия + §6.X | Спека Perk + level-up |
| `docs/balance.md` §M4 | **Числа для 8 perks** — твой главный источник |
| `docs/content-brief.md` | Tone, language guidelines (если есть) |
| `content/items.json` / `content/mobs.json` (M3) | Образец стиля имён / описаний |

---

## Твой deliverable

### `content/perks.json` (NEW) — 8 perks

Структура файла — массив `Perk` объектов (JSON spec из GDD §6.X):

```json
[
  {
    "id": "tough_skin",
    "name": "Закалённая кожа",
    "description": "+15 HP к максимальному здоровью.",
    "type": "additive",
    "stat": "hp_max",
    "value": 15
  },
  {
    "id": "sharp_blade",
    "name": "Острое лезвие",
    "description": "+15% к урону в бою (ближний и дальний).",
    "type": "multiplicative",
    "stat": "damage",
    "value": 1.15
  }
  // ... 6 ещё
]
```

Правила:
- **8 перков** строго (id'ы и числа из `balance.md` §M4 — НЕ придумывай свои).
- `id` берёшь из `balance.md` (snake_case, например `tough_skin`).
- `type` / `stat` / `value` строго из `balance.md` (НЕ меняй).
- `name` — твой (русский, lore-tone — survival post-apocalypse).
- `description` — твой (1-2 предложения, **должен включать число** из `value` для прозрачности: «+15 HP», «+15% урон», «-15% штраф перевеса», и т.д.).

Tone-rules для `description`:
- Конкретно, без воды («Закалённая кожа делает тебя крепче» → нет; «+15 HP к максимальному здоровью.» → да).
- Имени игрока не упоминать.
- Русский язык, без англицизмов где можно (но «бонус», «штраф», «крит» — ок).
- Без эмоджи / спец-символов / markdown.

### Optional: text snippets для UI

Если решишь — отдельный файл `content/ui_strings_m4.json` с заголовками для `ProgressionScene` / `LevelUpScene`:

```json
{
  "progression.title": "Прогрессия",
  "progression.level_label": "Уровень",
  "progression.xp_label": "Опыт",
  "progression.perks_label": "Перки",
  "levelup.title": "Новый уровень!",
  "levelup.choose_label": "Выбери один из трёх перков",
  "levelup.confirm_button": "Взять"
}
```

Это **optional** — Engineer может захардкодить русские строки в Scene, если ты не успеваешь. Если делаешь — согласуй с Engineer через PR comment, чтобы он импортил твой JSON.

---

## Definition of Done (твой чек-лист перед PR)

- [ ] `content/perks.json` создан, 8 объектов, все поля.
- [ ] `node -e "JSON.parse(require('fs').readFileSync('content/perks.json'))"` — exit 0 (валидный JSON).
- [ ] Все `id` совпадают с `balance.md` §M4 (8 шт).
- [ ] Все `type / stat / value` строго из `balance.md` §M4.
- [ ] Все `name / description` — лор-тон, без воды, число из `value` в описании.
- [ ] (Опц.) `content/ui_strings_m4.json` создан + согласован с Engineer.
- [ ] `staff/status/CONTENT.md` обновлён под M4.
- [ ] PR описание содержит scope, anti-scope, какие перки добавлены + Recovery block.

---

## FORBIDDEN

- Изменять `docs/`, `src/`, `assets/`, чужие `staff/` файлы.
- Self-merge.
- PAT в URL / echo / print.
- Менять числа `value` или enum `type` / `stat` (это zone of GD).
- Добавлять поля `prereq` / `tier` / `cost` / `cooldown` / `requires` — M5+ skill tree anti-scope.
- Дублировать перк-id (8 уникальных).
- План > 7 пунктов.
- Использовать markdown / эмоджи / спец-символы в `description`.

---

## Процедура

1. Клонируй репо, `git checkout m4-integration`, прочитай файлы из «Контекст».
2. Напиши план (5-7 пунктов): какие 8 perk-id берёшь, какие name'ы / description'ы стиль. Отправь Alex'у блокирующим.
3. После апрува — `git checkout -b m4/content`. Первый commit — пустой `content/perks.json` с шапкой `[]`. Push + Draft PR (recovery-safe).
4. Допиши 8 perks порциями (commit'ы по 2-3 perk'а).
5. Прогони JSON parse + cross-ref check с `balance.md`.
6. Обнови `staff/status/CONTENT.md`.
7. Flip Draft → Ready. Сообщи Alex'у блокирующим: «Content M4 PR <ссылка>».

Token-budget: эта задача — ~15 минут чтения + 30-60 минут письма. Должна укладываться в 1 сессию.
