# Kickoff: Game Designer — Веха M3

Ты — **Game Designer** на вехе M3 проекта «Оплот» (survival RPG для Яндекс.Игр).

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M3-GD.md`

Это **amendment-сессия**: GDD §1–§6 уже написаны под M1/M2 — их НЕ трогай. Ты добавляешь §5.4 (5 новых мобов), §6.4.M3 (2 новые зоны), новую §7 (radio structure stub), и секцию §M3 в `balance.md`.

## Действуй так:

1. Клонируй репо и переключись на интеграционную ветку M3 (НЕ на `main`):
   ```
   git clone https://github.com/alexbayov/oplot.git
   cd oplot
   git checkout m3-integration
   ```
2. Прочитай в порядке:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M3.md`
   - `staff/handoff/M3-GD.md` (твой подробный брифинг)
   - `staff/handoff/M2-SUMMARY.md` (что унаследовано с M2)
   - `docs/GDD.md` §1–§6 целиком (тебе нужно знать структуру и стиль)
   - `docs/balance.md` целиком
   - `docs/content-brief.md` (правила уникальности)
3. Напиши **короткий план** (5-7 пунктов): что добавляешь в §5.4 / §6.4.M3 / §7 / balance §M3, и каковы 5 мобов / 2 зоны по именам.
4. Отправь Alex'у блокирующим: «План готов, жду апрува PM».
5. После апрува — `git checkout -b m3/gd-amendment`, сделай первую правку (например, шапка §5.4) и **сразу push + открой Draft PR** `m3/gd-amendment → m3-integration` (recovery-safe, lesson M2).
6. Дополни GDD + balance согласно handoff'у. Коммить логическими порциями.
7. Обнови `staff/status/GAME_DESIGNER.md` под M3.
8. Сообщи Alex'у блокирующим: «GD M3 amendment готов, PR <ссылка>, жду PM-ревью + QA Spec».

## Можно параллельно с

Никем. M3 GD — первая роль на вехе. Content/Engineer/Artist стартуют ПОСЛЕ твоего merge + QA Spec APPROVE.

## Нельзя до

M2 gate-close PR #19 смержен в `main` (выполнено 2026-05-20). M3 kickoff PR `pm/m3-kickoff` смержен в `m3-integration` (PM-action).

## Запрещено

- Переписывать GDD §1–§6 (только добавлять §5.4 / §6.4.M3 / §7).
- Трогать числа M1/M2 в `balance.md`.
- Self-merge.
- Push в `main` / `m3-integration` напрямую.
- PAT-токен в URL или echo/print (только в Authorization header, никогда не печатай токен).
- Любые правки в `content/*.json`, `src/`, `assets/`, чужие `staff/status/*.md`, `staff/handoff/*`, `staff/kickoff/*`, `staff/PLAN.md`, `staff/decisions/*`, `staff/PROCESS.md`, `staff/STATE_MACHINE.md`, `staff/ORCHESTRATION.md`, `staff/CONTEXT.md`, `staff/LINKS.md`.
- Включение фич вне M3 anti-scope (см. `staff/status/M3.md` «Anti-scope M3»).

База для твоего PR: `m3-integration` (НЕ `main`).
