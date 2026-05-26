# Handoff — Engineer M8b

Engineer реализует системы монетизации: реклама (rewarded + interstitial + banner) и IAP (in-app purchases + ads-remover).

## Preconditions

- GD M8b amendment merged (`docs/GDD.md` §13b + `docs/balance.md` §M8b).
- QA Spec M8b APPROVE merged.
- M8a baseline: `src/systems/platform.ts` (ysdk singleton ready), 193/193 vitest, JS 1.49 MB.

## Deliverables

### 1. Rewarded Video — `src/systems/ads.ts`

```typescript
function isRewardedAvailable(): boolean
function showRewardedVideo(
  context: 'loot_double' | 'second_chance' | 'daily_reset' | 'gas_refill',
  onRewarded: () => void,
  onClose?: () => void
): void
```

- Uses `ysdk.adv.showRewardedVideo()` with 4 callbacks
- Fail-soft: if `ysdk === null` (no platform) or ad unavailable → skip, do nothing
- When `disable_ads` active → call `onRewarded()` immediately (instant reward)
- Cooldowns per context in `balance.md` §M8b

**4 triggers wired to scenes:**

| Context | Scene | When | Reward | Cooldown |
|---|---|---|---|---|
| `loot_double` | ReturnScene | After successful sortie, before "Return to Base" | ×2 all resources in sortie loot (iterate inventory, duplicate resource-type items) | None |
| `second_chance` | CombatScene | On player death (HP ≤ 0) | Restore 50% max HP, continue combat same round | 1 per sortie |
| `daily_reset` | MapScene | If daily instance on cooldown | Reset daily timer to 0 | 1 per sortie |
| `gas_refill` | MapScene | If `gas < GAS_MAX` | `gas += 1` | 300s (5 min) |

### 2. Interstitial — `src/systems/ads.ts`

```typescript
function showInterstitial(onClose?: () => void): void
```

- Uses `ysdk.adv.showFullscreenAdv()` with onOpen/onClose(wasShown)/onError
- 1 placement: ReturnScene → user clicks "Return to Base" → interstitial → transition to BaseScene
- Fail-soft: if ad unavailable or `disable_ads` → proceed to BaseScene immediately
- No manual throttle (Yandex controls frequency)

### 3. Sticky Banner — `src/systems/banner.ts`

```typescript
function initBanner(): void
function showBanner(): Promise<void>
function hideBanner(): Promise<void>
```

- Uses `ysdk.adv.showBannerAdv()` / `hideBannerAdv()` / `getBannerAdvStatus()`
- Show in: BaseScene, CraftScene, InventoryScene, MapScene
- Hide in: CombatScene, SortieScene, LootScene, RegionScene (gameplay)
- When `disable_ads` → always hidden
- Fail-soft: if platform unavailable → no-op

### 4. IAP — `src/systems/iap.ts`

```typescript
interface IapProduct { id: string; title: string; description: string; price: string; ... }
function initIap(): Promise<void>
function purchaseProduct(productId: string): Promise<{ productID: string; purchaseToken: string } | null>
function getPurchases(): Promise<IapPurchase[]>
function getCatalog(): Promise<IapProduct[]>
function consumePurchase(token: string): Promise<void>
function checkUnprocessedPurchases(): Promise<void>
function isAdsRemoved(): boolean
```

- Uses `ysdk.getPayments()` → `payments.purchase()`, `getPurchases()`, `getCatalog()`, `consumePurchase()`
- Client-side `signed: false`
- **checkUnprocessedPurchases()** called at boot:
  1. `getPurchases()` → iterate
  2. If consumable (starter_pack/gas_pack) → reward FIRST → `consumePurchase(token)` SECOND
  3. If non-consumable (disable_ads) → set ads_removed flag
- If `disable_ads` in purchases → `isAdsRemoved()` returns true → all ads systems use instant/fail-soft paths

**IAP Catalog (IDs in GDD §13b, actual products in Developer Console):**

| ID | Reward |
|---|---|
| `disable_ads` | set ads_removed flag |
| `starter_pack` | +5 bandage +3 scrap +2 electronics → baseStash, then consume |
| `gas_pack` | +3 gas, then consume |

### 5. Tests — ~17 new

| File | What |
|---|---|
| `src/systems/__tests__/ads.test.ts` | Rewarded mock: 4 contexts, fail-soft, instant-reward when ads_removed. Interstitial mock: onClose flow, skip when ads_removed. No setInterval detection |
| `src/systems/__tests__/banner.test.ts` | Show/hide per scene. Hide when ads_removed. Fail-soft no-op |
| `src/systems/__tests__/iap.test.ts` | Purchase mock (resolve/reject), getPurchases (non-consumable + consumable), consumePurchase, checkUnprocessed (consume AFTER reward), isAdsRemoved flag |

### 6. Script checks

- `src/main.ts`: `initIap()` → `checkUnprocessedPurchases()` → `isAdsRemoved()` on boot

### 7. Finalize

- typecheck/lint/test (~210)/build all green
- JS ≤ 2 MB
- Anti-scope grep: no `getLeaderboards`, `setScore`, `getAchievements`, no `signed: true`
- `staff/status/ENGINEER.md` updated

## Forbidden

No `content/*.json`, `assets/*`, `docs/*`. No `setInterval` for ads. No server-side IAP. No leaderboards/achievements/telemetry. No new content/mechanics. No third-party npm. No `any`. No self-merge.

## Acceptance

PR `m8b/monetization → m8b-integration`. Only `src/`, `staff/status/ENGINEER.md`.
