# Kickoff: Engineer — Веха M8b

Ты — **Engineer** на M8b (Monetization) проекта «Оплот».

Repo: https://github.com/alexbayov/oplot
Brief: `staff/handoff/M8b-ENG.md`
Base branch: `m8b-integration`

## When

Start only after GD M8b amendment merged AND QA Spec M8b verdict APPROVE merged.

## Context

- M8a закрыта (platform.ts/cloudSave.ts/locale.ts/audioUnlock.ts готовы).
- `staff/status/M8b.md` содержит scope/anti-scope/DoD.
- M8a baseline: 193/193 vitest, JS 1.49 MB, ysdk singleton через `initPlatform()`.
- Yandex SDK monetization API (все сигнатуры в `staff/status/M8b.md` Research Notes).
- No Content/Artist in M8b — только ты.

## Do this

1. Checkout `m8b-integration`. Read: `staff/status/M8b.md`, `staff/handoff/M8b-ENG.md`, `docs/GDD.md` §13b, `docs/balance.md` §M8b (если есть), `src/systems/platform.ts`, `src/scenes/*`.
2. Baseline: `npm run typecheck`, `npm run lint`, `npm test` (193), `npm run build`.
3. Напиши план. Send Alex: «План готов, жду апрува PM».
4. После PM approve: branch `m8b/monetization`, Draft PR `m8b/monetization → m8b-integration`.
5. Реализуй:
   - `src/systems/ads.ts` — `showRewardedVideo(context, onRewarded)`, `showInterstitial(onClose)`. Fail-soft no-op при platform unavailable. No `setInterval`.
   - `src/systems/banner.ts` — `showBanner()`/`hideBanner()` with scene-aware toggle.
   - `src/systems/iap.ts` — `initPayments()`, `purchaseProduct(id)`, `restorePurchases()`, `getIapCatalog()`, `checkUnprocessedPurchases()`, `isAdsRemoved()`. Consume: reward FIRST, consumePurchase SECOND. Unprocessed-check on boot.
   - 4 rewarded hooks: ReturnScene (×2 loot), CombatScene (second chance), MapScene (daily reset, gas refill)
   - 1 interstitial hook: ReturnScene → BaseScene transition
   - Ads-remover: all rewarded buttons → instant reward; banner hidden; interstitial skipped
   - Banner show/hide: Base/Craft/Inventory/Map (show), Combat/Sortie/Loot/Region (hide)
   - `main.ts`: call `checkUnprocessedPurchases()` and `isAdsRemoved()` on boot
6. Тесты ~17 новых → target **~210/210 vitest**: ads.test.ts, banner.test.ts, iap.test.ts (mock-based, no real SDK)
7. Finalize: typecheck/lint/test/build; vitest ~210; JS ≤ 2 MB; anti-scope grep (no leaderboards/achievements/server-side); scenes use helpers/systems
8. Update `staff/status/ENGINEER.md`: M8b, DONE_PENDING_REVIEW
9. Ready PR + Send Alex: «PR &lt;ссылка&gt;, готов к ревью PM».

## Forbidden

No `content/*.json`, `assets/*`, `docs/*`. No ads auto-call (`setInterval`). No server-side IAP. No leaderboards/achievements/telemetry. No new content/mechanics. No third-party npm libs. No `any`. No self-merge. No PAT в URL/echo/print.
