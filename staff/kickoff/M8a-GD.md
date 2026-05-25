# Kickoff: Game Designer — Веха M8a

Ты — **Game Designer** на M8a (Platform & Persistence) проекта «Оплот».

Repo: https://github.com/alexbayov/oplot
Brief: `staff/handoff/M8a-GD.md`
Base branch: `m8a-integration`

## When

Start only after PM kickoff PR `pm/m8a-kickoff → main` merged AND `m8a-integration` branch created from new `main`.

## Context

- M7 закрыта (gate-close PR #65, `main` HEAD `2399b7b`). См. `staff/handoff/M7-SUMMARY.md`.
- Скоуп M8 разделён по согласию Заказчика: **M8a (Platform/Persistence/Mobile) — этот kickoff** + **M8b (Monetization) — отложен до получения ads/IAP-модели от Заказчика**.
- Owners M8a по PLAN §3: Engineer + QA. GD пишет ТОЛЬКО spec для §13a.
- M8a `staff/status/M8a.md` уже содержит scope/anti-scope/DoD — это твоя главная reference.

## Do this

1. Checkout `m8a-integration`. Read: `staff/status/M8a.md`, `staff/handoff/M8a-GD.md`, `docs/GDD.md` (особенно §13 placeholder), `docs/balance.md`, `staff/handoff/M7-SUMMARY.md`.
2. Sanity check: типы и контент M7 не трогаются — все 9 zones / 80 items / 42 recipes / 11 mobs / 8 perks / 6 radio / 10 SFX / 16 tweens замораживаются на M7.
3. Напиши план (5–7 пунктов): что появится в §13a (5 блоков по handoff §Deliverables) + нужен ли §M8a в `balance.md` (опционально, только если есть числа throttle / quota).
4. Send Alex: «План готов, жду апрува PM».
5. После PM approve: branch `m8a/gd-amendment`, early scaffold commit + push + Draft PR `m8a/gd-amendment → m8a-integration` с Recovery block.
6. Запиши §13a в `docs/GDD.md` (расширяя существующий §13 placeholder, не удаляя §13b reservation под M8b).
7. Если нужны числа — `docs/balance.md` §M8a (короткая таблица throttle interval + quota + defaults).
8. Anti-scope §13a — ровно как в `staff/status/M8a.md` (ads/IAP/leaderboards/achievements/telemetry/новых языков/нового контента/новых механик/music/UI redesign).
9. Final self-check: 7 чек-листов QA Spec из `staff/handoff/M8a-QA-SPEC.md` все должны проходить.
10. Update only `staff/status/GAME_DESIGNER.md` (M8a, IN_PROGRESS → DONE_PENDING_REVIEW, что сделано, что нет, блокеры).
11. Ready PR + Send Alex: «PR &lt;ссылка&gt;, готов к ревью PM».

## Forbidden

No `src/`, `content/`, `assets/`, other staff files (только `staff/status/GAME_DESIGNER.md`). No код / контент / ассеты. No новых mobs / bosses / zones / items / recipes / perks / radio / SFX / tweens. No монетизация (ads / IAP) — это M8b. No music / voice / UI redesign. No self-merge. No PAT в URL/echo/print.
