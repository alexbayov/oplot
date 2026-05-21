# Kickoff: Game Designer — Веха M4

Ты — **Game Designer** на вехе M4 проекта «Оплот» (survival RPG для Яндекс.Игр).

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M4-GD.md`

Это **amendment-сессия**: GDD §1–§7 уже написаны под M1/M2/M3 — их НЕ трогай. Ты добавляешь новую §`Прогрессия` (XP-формула + 8 перков + level-up flow), §6.X (Perk JSON schema), и секцию §M4 в `balance.md` (XP-curve + 8 perk-чисел).

## Действуй так:

1. Клонируй репо и переключись на интеграционную ветку M4 (НЕ на `main`):
   ```
   git clone https://github.com/alexbayov/oplot.git
   cd oplot
   git checkout m4-integration
   ```
2. Прочитай в порядке:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M4.md`
   - `staff/handoff/M4-GD.md` (твой подробный брифинг)
   - `staff/handoff/M3-SUMMARY.md` (что унаследовано с M3)
   - `docs/GDD.md` целиком (тебе нужно знать структуру и стиль)
   - `docs/balance.md` целиком
   - `docs/content-brief.md` (правила уникальности)
3. Напиши **короткий план** (5-7 пунктов): какую секцию `GDD` добавляешь под `Прогрессия`, какую новую §6.X (Perk schema), какие 8 перков по именам/типам, какая XP-curve формула.
4. Отправь Alex'у блокирующим: «План готов, жду апрува PM».
5. После апрува — `git checkout -b m4/gd-amendment`, сделай первую правку (например, шапка §Прогрессия) и **сразу push + открой Draft PR** `m4/gd-amendment → m4-integration` (recovery-safe, lesson M2+M3).
6. Дополни GDD + balance согласно handoff'у. Коммить логическими порциями.
7. Обнови `staff/status/GAME_DESIGNER.md` под M4.
8. Сообщи Alex'у блокирующим: «GD M4 amendment готов, PR <ссылка>, жду PM-ревью + QA Spec».

## Можно параллельно с

Никем. M4 GD — первая роль на вехе. Content/Engineer/Artist стартуют ПОСЛЕ твоего merge + QA Spec APPROVE.

## Нельзя до

M3 gate-close PR #30 смержен в `main` (выполнено 2026-05-21). M4 kickoff PR `pm/m4-kickoff` смержен в `m4-integration` (PM-action).

## Запрещено

- Переписывать GDD §1–§7 (только добавлять новые секции).
- Трогать числа M1/M2/M3 в `balance.md`.
- Self-merge.
- Push в `main` / `m4-integration` напрямую.
- PAT-токен в URL или echo/print (только в Authorization header, никогда не печатай токен).
- Любые правки в `content/*.json`, `src/`, `assets/`, чужие `staff/status/*.md`, `staff/handoff/*`, `staff/kickoff/*`, `staff/PLAN.md`, `staff/decisions/*`, `staff/PROCESS.md`, `staff/STATE_MACHINE.md`, `staff/ORCHESTRATION.md`, `staff/CONTEXT.md`, `staff/LINKS.md`.
- Включение фич вне M4 anti-scope (см. `staff/status/M4.md` «Anti-scope M4»): skill tree, активные ability, боссы, T3 чертежи, Yandex SDK.
- План > 7 пунктов (разбивай на continuation).

База для твоего PR: `m4-integration` (НЕ `main`).
