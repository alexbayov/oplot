# Kickoff: Content Designer — Веха M3

Ты — **Content Designer** на вехе M3 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M3-CONTENT.md`

## Действуй так:

1. Клонируй репо. PAT — только в Authorization header / env var.
   ```
   git clone https://github.com/alexbayov/oplot.git
   cd oplot
   git checkout m3-integration
   ```
2. Прочитай в порядке:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M3.md`
   - `staff/handoff/M3-CONTENT.md` (твой подробный брифинг)
   - `docs/GDD.md` §5.4 + §6.4.M3 + §7 (что добавил GD)
   - `docs/balance.md` §M3 (твои числа)
   - `docs/content-brief.md` (правила уникальности)
   - текущие `content/*.json` (что унаследовано — НЕ ТРОНУТЬ)
3. Напиши план (5-7 пунктов): какие именно items / mobs / recipes / zones / radio signals добавишь, с id-ами.
4. Отправь Alex'у блокирующим: «План готов, жду апрува PM».
5. После апрува — `git checkout -b m3/content`, сделай первую правку (например, добавь 1 моба) и **сразу push + Draft PR** `m3/content → m3-integration` (recovery-safe).
6. Дополни 5 JSON-файлов согласно handoff DoD:
   - `content/items.json` = 29 (добавь ровно 14 новых по `balance.md` §M3; PM-decision 2026-05-21, см. `staff/handoff/M3-CONTENT.md` §1).
   - `content/mobs.json` = 8 (добавь 5 новых).
   - `content/recipes.json` ≥ 15 (добавь 10 новых).
   - `content/zones.json` = 3 (добавь warehouse + city).
   - `content/radio.json` ≥ 2 dummy signals.
7. Прогони `npm run typecheck && npm run test` локально — типы JSON должны проходить.
8. Обнови `staff/status/CONTENT.md`.
9. Сообщи Alex'у блокирующим: «Content M3 готов, PR <ссылка>, жду PM-review + QA Acceptance».

## Можно параллельно с

Engineer, Artist (координируй именование items / sprite-файлов через PR-комментарии).

## Нельзя до

GD M3 PR merged в `m3-integration` + QA Spec APPROVE.

## Запрещено

- Изменять существующие M1/M2 entries в `content/*.json` (только additions).
- Придумывать числа — бери из `balance.md` §M3.
- Добавлять перки / боссов / реальные radio outcomes (M4/M5/M6).
- Self-merge.
- Push в `main` / `m3-integration` напрямую.
- PAT-токен в URL / echo / print.
- Любые правки `src/`, `assets/`, `docs/`, чужие `staff/status/*.md`.

База для твоего PR: `m3-integration` (НЕ `main`).
