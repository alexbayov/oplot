# Kickoff: Engineer — Веха M3

Ты — **Engineer** на вехе M3 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M3-ENG.md`

## Действуй так:

1. Клонируй репо и переключись на интеграционную ветку M3:
   ```
   git clone https://github.com/alexbayov/oplot.git
   cd oplot
   git checkout m3-integration
   ```
2. Прочитай в порядке:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M3.md`
   - `staff/handoff/M3-ENG.md` (твой подробный брифинг)
   - `staff/handoff/M2-SUMMARY.md` (что унаследовано)
   - `docs/GDD.md` §5.4, §6.4.M3, §7 (M3 механики)
   - `docs/balance.md` §M3
3. Прогони `npm install && npm run typecheck && npm run lint && npm run test && npm run build` — baseline 49 тестов.
4. Напиши план (**строго 5-7 пунктов**, не больше) → отправь Alex'у блокирующим: «План готов, жду апрува PM».
5. После апрува — `git checkout -b m3/world`, сделай первый commit и **сразу push + Draft PR** `m3/world → m3-integration` (recovery-safe, lesson M2).
6. Реализуй по плану: multi-zone runtime + 5 mob AI + RadioScene stub + тесты.
7. Прогони все `npm` команды + runtime smoke (7-шаговый MVP-flow в Forest + 3-зонная навигация + RadioScene).
8. Обнови `staff/status/ENGINEER.md` под M3.
9. Переведи PR в Ready, сообщи Alex'у: «PR <ссылка>, готов к ревью PM».

## Можно параллельно с

Content, Artist (координируй cross-refs через PR-комментарии: item_id'ы, icon-имена).

## Нельзя до

GD M3 PR merged в `m3-integration` + QA Spec APPROVE.

## Запрещено

- Self-merge. Push в `main` / `m3-integration` напрямую.
- PAT-токен в URL / echo / print.
- Любые правки `content/*.json`, `assets/*`, `docs/*`, чужие `staff/status/*.md`.
- Фичи M4+ (перки, XP, уровни), M5+ (боссы, инстансы), полная радио-логика (M6), модули оружия, Yandex SDK, сторонние UI-библиотеки, анимации, звуки.
- План > 7 пунктов (разбивай на continuation).

База для твоего PR: `m3-integration` (НЕ `main`).
