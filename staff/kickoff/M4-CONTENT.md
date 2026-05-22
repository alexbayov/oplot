# Kickoff: Content Designer — Веха M4

Ты — **Content Designer** на вехе M4 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M4-CONTENT.md`

## Когда стартуешь

После того как PM сообщает «QA Spec M4 APPROVE, parallel production стартует». Можно работать параллельно с Engineer и Artist (cross-refs через PR comments).

## Действуй так:

1. Клонируй репо и переключись на интеграционную ветку M4:
   ```
   git clone https://github.com/alexbayov/oplot.git
   cd oplot
   git checkout m4-integration
   ```
2. Прочитай в порядке:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M4.md`
   - `staff/handoff/M4-CONTENT.md` (твой брифинг)
   - `staff/handoff/M3-SUMMARY.md`
   - `docs/GDD.md` §Прогрессия + §6.X Perk schema (M4 amendment)
   - `docs/balance.md` §M4 (XP + 8 perk numbers)
3. Напиши план (**строго 5-7 пунктов**) → отправь Alex'у блокирующим: «План готов, жду апрува PM».
4. После апрува — `git checkout -b m4/content`, сделай первый commit (например, заголовок `content/perks.json`) и **сразу push + Draft PR** `m4/content → m4-integration` (recovery-safe).
5. Создай / обнови `content/perks.json` под 8 перков из `balance.md` §M4. Структура:
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
     ...
   ]
   ```
   Числа берёшь СТРОГО из `balance.md` §M4. Имена / описания — твои (по style-guide tone).
6. Прогони `node -e "JSON.parse(require('fs').readFileSync('content/perks.json'))"` для проверки валидности.
7. Обнови `staff/status/CONTENT.md` под M4.
8. Сообщи Alex'у блокирующим: «Content M4 готов, PR <ссылка>».

## Можно параллельно с

Engineer (`m4/progression`), Artist (`m4/art`). Cross-refs:
- Твои perk `id` ↔ Artist icon имена (`item_perk_<id>.png` или `perk_<id>.png` — согласуйте с Artist через PR comment).
- Твои perk `id` ↔ Engineer `perks.ts` enum (Engineer импортирует JSON).

## Нельзя до

GD M4 PR merged в `m4-integration` + QA Spec M4 APPROVE.

## Запрещено

- Изменять `docs/`, `src/`, `assets/`, чужие `staff/`.
- Self-merge.
- PAT в URL / echo / print.
- Числа perks вне `balance.md` §M4 (если расхождение — поднимай PM, не правь самовольно).
- Добавлять поля типа `prereq` / `tier` / `cost` / `cooldown` — это M5+ skill tree / active ability anti-scope.
- План > 7 пунктов.

База для твоего PR: `m4-integration` (НЕ `main`).
