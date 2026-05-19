# Kickoff: Engineer — Веха M2

Ты — **Engineer** на вехе M2 проекта «Оплот» (survival RPG для Яндекс.Игр).

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M2-ENG.md`

## Действуй так:

1. Клонируй репо и переключись на интеграционную ветку M2 (НЕ на `main`):
   ```
   git clone https://github.com/alexbayov/oplot.git
   cd oplot
   git checkout m2-integration
   ```
2. Прочитай в порядке:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M2.md`
   - `staff/handoff/M2-ENG.md` (твой подробный брифинг)
   - `staff/handoff/M1-SUMMARY.md` (что унаследовано с M1)
   - `docs/GDD.md` §1–§6 (M2 механики; авторитетная спецификация)
   - `docs/balance.md` (числа)
   - `staff/PROCESS.md`, `staff/STATE_MACHINE.md`
3. Прогони `npm install && npm run typecheck && npm run lint && npm run build` на свежем checkout `m2-integration`, чтобы убедиться, что унаследованный с M1 каркас собирается локально.
4. Напиши план (8–15 пунктов), отправь заказчику **блокирующим**: «План готов, жду апрува PM». В плане отдельно перечисли:
   - какие сцены пишутся / переписываются и в какой последовательности (Loader → Base → Map → Sortie → Combat → Loot → Inventory → Craft);
   - какие новые модули появятся (`src/state/`, `src/systems/combat`, `src/systems/weight`, `src/systems/crafting`, `src/systems/loot`);
   - как покрываешь формулы из GDD §2/§3/§4 (initiative, damage roll, weight penalty, return time, loot loss 50%);
   - как тестируешь (vitest unit tests на формулы, ручной runtime smoke по 7-шаговому MVP-flow).
5. После апрува PM — выполняй строго по плану.
6. Создай рабочую ветку `m2/gameplay` **от `m2-integration`** (НЕ от `main`), оформи PR в `m2-integration` (НЕ в `main`). Сам **НЕ** мерджи.
7. Обнови `staff/status/ENGINEER.md`: что сделано, что нет, блокеры, текущая веха = M2.
8. Сообщи заказчику блокирующим: «PR <ссылка>, готов к ревью PM».

## Можно параллельно с

Никем. На M2 запущен только Engineer (Content/Artist/GD не активны — см. `staff/status/M2.md`). Если по ходу работы понадобятся правки content или ассетов — оставь конкретный список в PR-комментарии, PM откроет fix-роль.

## Нельзя до

M1 gate-close PR смержен в `main` (выполнено 2026-05-19, PR #12). Все handoff/preconditions для M2 уже на месте.

## Запрещено

- Self-merge своего PR.
- Push в `main` или `m2-integration` напрямую.
- Использование PAT-токена в URL для обхода git-proxy.
- Модификация `content/*.json` (это вотчина Content, и в M2 контент не меняется по умолчанию).
- Модификация `assets/*` (вотчина Artist; M2 placeholder-ассетов из M1 хватает).
- Модификация `staff/status/{не_ENGINEER}.md`, `staff/handoff/*`, `staff/kickoff/*`, `staff/PLAN.md`, `staff/decisions/*`, `staff/PROCESS.md`, `staff/STATE_MACHINE.md`, `staff/ORCHESTRATION.md`, `staff/CONTEXT.md`, `staff/LINKS.md`. Если что-то из этого реально надо подправить — оставь конкретный список в PR-комментарии, PM сделает сам.
- Включение фич вне M2 anti-scope (см. `staff/status/M2.md` «Anti-scope M2»).
