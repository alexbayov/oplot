# Kickoff: Game Designer — Веха M8b

Ты — **Game Designer** на M8b (Monetization) проекта «Оплот».

Repo: https://github.com/alexbayov/oplot
Brief: `staff/handoff/M8b-GD.md`
Base branch: `m8b-integration`

## When

Start only after PM kickoff PR `pm/m8b-kickoff → main` merged AND `m8b-integration` branch created from new `main`.

## Context

- M8a закрыта (gate-close PR #71). См. `staff/handoff/M7-SUMMARY.md`, `staff/status/M8b.md`.
- M8 split: M8a (Platform) = DONE; M8b (Monetization) = this.
- `staff/status/M8b.md` содержит scope/anti-scope/DoD с конкретными API-сигнатурами из Yandex SDK docs.
- Owners M8b: Engineer + QA. GD пишет ТОЛЬКО spec для §13b.
- M8a baseline: platform.ts (ysdk singleton), cloudSave.ts, locale.ts, audioUnlock.ts готовы.

## Do this

1. Checkout `m8b-integration`. Read: `staff/status/M8b.md`, `staff/handoff/M8b-GD.md`, `docs/GDD.md` (особенно §13b placeholder), `staff/handoff/M7-SUMMARY.md`.
2. Sanity check: контент M7 заморожен (9/80/42/11/3/8/6/10/16). M8a platform/cloudSave НЕ трогаются.
3. Напиши план: что появится в §13b (5 подсекций) + §M8b в `balance.md` (IAP цены, rewarded rewards).
4. Send Alex: «План готов, жду апрува PM».
5. После PM approve: branch `m8b/gd-amendment`, ранний scaffold commit + push + Draft PR `m8b/gd-amendment → m8b-integration`.
6. Запиши §13b в `docs/GDD.md` (расширяя placeholder, НЕ удаляя M8a):
   - §13b.1 — Rewarded video (API + 4 triggers + rewards)
   - §13b.2 — Interstitial (API + 1 placement + frequency note)
   - §13b.3 — Sticky banner (API + show/hide rules per scene)
   - §13b.4 — IAP (API + catalog 3 товара + consume + unprocessed-check + moderation §1.13.1 note)
   - §13b.5 — Ads-remover logic (disable_ads → instant rewards + no ads/banner)
   - §13b.0 — Anti-scope (leaderboards/achievements/server-side no)
7. `docs/balance.md` §M8b: таблица rewarded rewards (×2 loot / second-chance-50%-HP / daily-reset / gas+1), IAP catalog с YAN-совместимыми полями, ads-remover behaviour.
8. Final self-check: 7 чек-листов QA Spec из `staff/handoff/M8b-QA-SPEC.md` все PASS.
9. Update only `staff/status/GAME_DESIGNER.md` (M8b, DONE_PENDING_REVIEW).
10. Ready PR + Send Alex: «PR &lt;ссылка&gt;, готов к ревью PM».

## Forbidden

No `src/`, `content/`, `assets/`, other staff files. No код/контент/ассеты. No новых mobs/bosses/zones/items/recipes/perks/radio/SFX/tweens. No monetization code. No self-merge. No PAT в URL/echo/print.
