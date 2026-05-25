# Kickoff: Game Designer — Веха M6

Ты — **Game Designer** на вехе M6 проекта «Оплот» (survival RPG для Яндекс.Игр).

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M6-GD.md`

Это **amendment-сессия**: GDD §1–§9 уже написаны под M1–M5 — их **НЕ трогай**. Ты расширяешь §10 «Радио и доверие» из M3 UI-stub до M6 full logic, добавляешь schema extensions для `RadioSignal` / radio state, и секцию §M6 в `balance.md`.

## Действуй так:

1. Клонируй репо и переключись на интеграционную ветку M6 (НЕ на `main`):
   ```
   git clone https://github.com/alexbayov/oplot.git
   cd oplot
   git checkout m6-integration
   ```
2. Прочитай в порядке:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M6.md`
   - `staff/handoff/M6-GD.md` (твой подробный брифинг)
   - `staff/handoff/M5-SUMMARY.md`
   - `staff/handoff/M4-SUMMARY.md`
   - `staff/handoff/M3-SUMMARY.md`
   - `staff/STATE_MACHINE.md`
   - `docs/GDD.md` целиком (особенно §10.M3)
   - `docs/balance.md` целиком (особенно §M3 radio stub и §M5 final counts)
   - `docs/content-brief.md`
3. Напиши **короткий план** (5-7 пунктов): как расширишь GDD §10.M6, какие 6 signal archetypes (2 truth / 2 trap / 2 ambiguous), какую `radio_trust` шкалу и clamp, какие rewards/ambush rules, какие exact balance numbers.
4. Отправь Alex'у блокирующим: «План готов, жду апрува PM».
5. После апрува — `git checkout -b m6/gd-amendment`, сделай первую правку (например, шапка §10.M6 + anti-scope block) и **сразу push + открой Draft PR** `m6/gd-amendment → m6-integration` (recovery-safe).
6. Дополни GDD + balance согласно handoff'у. Коммить логическими порциями (schema → trust flow → outcomes → edge cases → balance §M6).
7. Обнови `staff/status/GAME_DESIGNER.md` под M6.
8. Сообщи Alex'у блокирующим: «GD M6 amendment готов, PR <ссылка>, жду PM-ревью + QA Spec».

## Можно параллельно с

Никем. M6 GD — первая роль на вехе. Content/Engineer/Artist стартуют ПОСЛЕ твоего merge + QA Spec M6 APPROVE.

## Нельзя до

M5 gate-close PR #47 смержен в `main` (выполнено 2026-05-25). M6 kickoff PR `pm/m6-kickoff` смержен в `m6-integration` (PM-action).

## Запрещено

- Переписывать GDD §1–§9 (только расширить §10 + schema cross-refs).
- Трогать числа M1–M5 в `balance.md`; добавлять только §M6.
- Self-merge.
- Push в `main` / `m6-integration` напрямую.
- PAT-токен в URL или echo/print.
- Любые правки в `content/*.json`, `src/`, `assets/`, чужие `staff/status/*.md`, `staff/handoff/*`, `staff/kickoff/*`, `staff/PLAN.md`, `staff/decisions/*`, `staff/PROCESS.md`, `staff/STATE_MACHINE.md`, `staff/ORCHESTRATION.md`, `staff/CONTEXT.md`, `staff/LINKS.md`.
- Включение фич вне M6 anti-scope (см. `staff/status/M6.md`): Yandex SDK/Cloud Saves/Leaderboard/IAP, новые зоны/мобы/боссы/T4, модульное оружие, skill tree/active abilities, faction-specific reputation, real-time timers, новые combat mechanics, voice/audio.
- План > 7 пунктов (разбивай на continuation).
- **Cross-spec расхождение** (например, GDD trust impact vs balance §M6) → эскалация в PM, НЕ резолвить самовольно.
- **DoD-precision:** использовать точные числа, НЕ «≥X» / «примерно».

База для твоего PR: `m6-integration` (НЕ `main`).
