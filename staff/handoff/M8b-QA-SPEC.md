# Handoff — QA Spec Review M8b

QA reviews GD M8b amendment (`docs/GDD.md` §13b + optionally `docs/balance.md` §M8b). Verdict APPROVE or CHANGES_REQUESTED.

## Preconditions

- GD M8b amendment PR `m8b/gd-amendment → m8b-integration` open or merged.
- `staff/status/M8b.md` snapshot read.

## Checklist 1: Rewarded video spec is implementable

- `showRewardedVideo` API signature correct (onOpen, onRewarded, onClose(wasShown), onError)
- 4 triggers each: trigger location (scene), trigger condition, reward, fail-soft behaviour, per-trigger cooldown/limit
- No `setInterval` auto-calls
- Rewards defined in balance.md (multipliers, HP fraction, gas amount)

## Checklist 2: Interstitial spec is complete

- `showFullscreenAdv` API signature correct (onOpen, onClose(wasShown), onError)
- 1 placement: post-sortie → BaseScene (exact flow: ReturnScene result → user presses "Return" → interstitial → BaseScene)
- Frequency note: controlled by Yandex, no manual throttle
- Disabled when `disable_ads` active

## Checklist 3: Sticky banner spec is complete

- API: showBannerAdv / hideBannerAdv / getBannerAdvStatus
- Show/hide per scene: show in Base/Craft/Inventory/Map, hide in Combat/Sortie/Loot/Region
- Position: bottom
- Disabled when `disable_ads` active

## Checklist 4: IAP spec is complete

- `getPayments()` → `payments.purchase({id})`, `getPurchases()`, `getCatalog()`, `consumePurchase(token)`
- Client-side `signed: false`
- 3 products with IDs, types (consumable/non-consumable), rewards
- Consume flow: reward FIRST → consumePurchase SECOND
- Unprocessed-check on boot: `getPurchases()` → foreach consumable → reward → consume
- Moderation §1.13.1 note present

## Checklist 5: Ads-remover logic is complete

- `disable_ads` non-consumable product
- Boot check via `getPurchases()` for `disable_ads` productID
- Behaviour: rewarded → instant reward, interstitial → no show, banner → no show
- UI text change

## Checklist 6: Anti-scope §13b explicit and matches M8b.md

- NO leaderboards/achievements/server-side/telemetry/new languages/new content/new mechanics/music/voice/UI redesign
- NO server-side IAP verification
- §13a (M8a platform) not modified

## Checklist 7: M2-M8a regression carry-over

- No contradiction with shipped M2-M8a behavior
- Platform SDK, cloud save, locale, mobile viewport, settings — all untouched
- M7 content counts frozen

## Verdict format

In `staff/status/QA.md`, append `# M8b Spec Review`:
- Verdict: APPROVE / CHANGES_REQUESTED
- Checklist 1-7: PASS/FAIL per item
- Blockers / Non-blocking notes / Recovery state

## Forbidden

No edits to `docs/`, `content/`, `src/`, `assets/`. No self-merge. No APPROVE if any checklist fails. No PAT in URL/echo/print.

## Acceptance

PR `qa/m8b-spec-review → m8b-integration`. Only `staff/status/QA.md` changed.
