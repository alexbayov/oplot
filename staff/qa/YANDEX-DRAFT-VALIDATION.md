# Yandex Draft Validation Runbook

> Release status: **NO-GO until this runbook is executed in Yandex Draft and every blocker item has PASS evidence**. Do not mark an item PASS without a screenshot, video, console capture, Draft link, or tester note that can be reviewed.

## Execution metadata

| Field | Value |
|---|---|
| Build commit / artifact | TBD |
| Yandex Draft URL | TBD |
| Tester | TBD |
| Date | TBD |
| Browser / device | TBD |
| Screen size / orientation | TBD |
| Console log capture | TBD |
| Screenshot / video folder | TBD |

## Status legend

- **NOT RUN** — no evidence has been collected yet; release blocker for Draft validation.
- **PASS** — tested in Yandex Draft or the specified fallback environment, with evidence linked.
- **REWORK** — tested and failed; requires a follow-up fix before release.

## 1. SDK init

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until the Yandex SDK initialization is observed in Draft without uncaught errors.

### Steps
1. Upload/open the current production build in Yandex Draft.
2. Open browser developer tools before the game starts.
3. Reload the Draft page and wait for the first playable screen.
4. Verify that the Yandex Games SDK initializes before platform-dependent calls are used.

### Expected result
- Game reaches the first playable screen.
- `YaGames` SDK initialization succeeds or fails soft without blocking boot.
- No uncaught exception is emitted during SDK initialization.

## 2. Fail-soft fallback without YaGames

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until local/offline behavior is verified without the Yandex SDK global.

### Steps
1. Run/open the production build outside Yandex Draft, where `YaGames` is unavailable.
2. Start a new session and play until first combat or base interaction.
3. Trigger at least one platform-adjacent action if available, such as save/load or ad-gated UI.
4. Capture the console output.

### Expected result
- Game remains playable with local fallback behavior.
- Platform features report unavailable status without uncaught errors.
- Console may contain documented fail-soft warnings only; no blocker `console.error` during normal flow.

## 3. LoadingAPI

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until LoadingAPI behavior is verified in Draft.

### Steps
1. Open the Draft build with network/devtools visible.
2. Reload the page and watch the boot/loading phase.
3. Confirm the game reports loading progress/ready state according to the Yandex Games LoadingAPI integration.
4. Capture a short video or console/network evidence.

### Expected result
- Loading flow completes once and does not hang.
- Yandex Draft does not report a stuck loading state.
- The game is interactive after loading completes.

## 4. Landscape 1280×720 orientation / Scale.FIT

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until landscape scaling is checked on desktop and a mobile-sized viewport/device.

### Steps
1. Open Draft in a 1280×720 viewport and capture the first playable screen.
2. Open Draft in a mobile browser or mobile emulation with landscape orientation.
3. Rotate between portrait and landscape if the device/browser allows it.
4. Check UI bounds, letterboxing, and touch/click hit areas.

### Expected result
- The game uses landscape 1280×720 Scale.FIT without cropped critical UI.
- Text remains readable.
- Primary touch targets are reachable and do not overlap.
- Orientation handling does not trap the player on a blank or unusable screen.

## 5. Cloud save — load

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until cloud load is verified with an authenticated Draft user.

### Steps
1. Log into Yandex with a test user in Draft.
2. Ensure the user has a known existing cloud save, or create one using the save step below first.
3. Reload Draft and start the game.
4. Verify the game loads the expected state.

### Expected result
- Cloud save is requested successfully when available.
- Existing player progress is restored without corruption.
- Missing cloud data falls back to a valid new/local state.

## 6. Cloud save — save

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until cloud save persistence is verified across reloads.

### Steps
1. Start from a clean or known save in Draft.
2. Change a visible piece of progress: inventory, base state, skill, or combat outcome.
3. Trigger a save point.
4. Reload the Draft page and confirm the change persists.

### Expected result
- Save request completes without uncaught errors.
- Changed progress persists after reload.
- Local fallback does not overwrite valid cloud progress unexpectedly.

## 7. Cloud save — corrupted/missing data fallback

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until bad or absent cloud data is shown to fail safe.

### Steps
1. Use a test account/save fixture with missing, empty, or intentionally corrupted cloud data.
2. Open Draft and allow the game to load.
3. Observe whether migration/fallback creates a valid playable state.
4. Capture console output and resulting player state.

### Expected result
- Corrupted or missing cloud data does not crash boot.
- The game falls back to a valid default/local state.
- No save corruption propagates back to cloud without an intentional valid save path.

## 8. Cloud save — offline fallback

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until offline/cloud-unavailable behavior is verified.

### Steps
1. Open Draft with a test user, then simulate offline or blocked cloud access.
2. Start or continue a session.
3. Change progress and trigger a save point.
4. Restore connectivity and reload if applicable.

### Expected result
- The game remains playable while cloud save is unavailable.
- Local fallback stores progress where supported.
- Reconnecting does not corrupt or unexpectedly discard progress.

## 9. Ads — rewarded

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until reward grant/cancel/failure behavior is verified in Draft.

### Steps
1. Find a rewarded-ad entry point in Draft.
2. Trigger the rewarded ad and complete it.
3. Verify the reward is granted exactly once.
4. Repeat with cancel/failure if Draft tooling allows.

### Expected result
- Rewarded ad opens through Yandex platform APIs.
- Completed ad grants the expected reward once.
- Cancel/failure path does not grant reward and does not break gameplay.

## 10. Ads — interstitial

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until interstitial display and resume behavior are verified.

### Steps
1. Play until an interstitial placement should be eligible.
2. Trigger the placement in Draft.
3. Close or finish the ad.
4. Continue gameplay and capture console output.

### Expected result
- Interstitial displays only at an acceptable transition point.
- Game resumes cleanly after close.
- No duplicate overlays, soft locks, or uncaught errors occur.

## 11. Ads — banner

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until banner behavior is verified or explicitly marked not applicable by product/engineering.

### Steps
1. Open Draft in a viewport where banner ads are expected to be available.
2. Trigger or wait for the banner placement.
3. Check whether the banner overlaps core UI or touch targets.
4. Rotate/resize if mobile validation is available.

### Expected result
- Banner either displays in an allowed safe area or is intentionally disabled/not applicable.
- Banner does not cover critical controls, text, or combat decisions.
- No console errors occur if banners are unavailable.

## 12. Ads — ads remover behavior

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until ads-removal entitlement behavior is verified, or explicitly marked not applicable.

### Steps
1. Use a test account without ads removal and confirm ads behavior is normal.
2. Purchase or grant the ads-removal entitlement in Draft/test tooling if supported.
3. Reload the game.
4. Confirm rewarded ads, interstitials, and banners follow the intended product rules after entitlement.

### Expected result
- Ads-removal state persists across reloads.
- Removed ad types no longer display according to product rules.
- Any ad type intentionally not removed is documented and still works.

## 13. IAP — catalog

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until Yandex catalog retrieval is verified or IAP is explicitly disabled for the release.

### Steps
1. Open Draft with IAP test products configured.
2. Navigate to the shop/IAP entry point.
3. Confirm product list loads from the Yandex platform.
4. Capture visible products and console/network evidence.

### Expected result
- Catalog loads without blocking the game.
- Product IDs, prices, and labels are visible and match the configured Draft products.
- Missing catalog fails soft with a clear unavailable state.

## 14. IAP — purchase

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until purchase fulfillment and persistence are verified.

### Steps
1. Select a configured test product in Draft.
2. Complete the purchase through Yandex test payment flow.
3. Verify the purchased item/entitlement is granted exactly once.
4. Reload and confirm persistence.

### Expected result
- Purchase completes through Yandex APIs.
- Entitlement/reward is granted once and saved.
- Reload does not duplicate or lose the purchase.

## 15. IAP — unprocessed purchases

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until recovery of pending purchases is verified.

### Steps
1. Create or simulate an unprocessed purchase with Draft/test tooling if available.
2. Open or reload the game.
3. Verify the game detects and processes the pending purchase.
4. Confirm the purchase is not processed repeatedly after completion.

### Expected result
- Unprocessed purchase is recovered and fulfilled safely.
- Fulfillment is idempotent.
- No duplicate grant or stuck pending state remains.

## 16. IAP — failure/cancel path

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until cancel and failure flows are verified.

### Steps
1. Start a purchase in Draft.
2. Cancel it, or trigger a failure path if test tooling supports it.
3. Return to the game.
4. Continue gameplay and capture console output.

### Expected result
- No item/entitlement is granted after cancel/failure.
- UI recovers to a usable state.
- No uncaught errors, stuck overlays, or blocked input occur.

## 17. Local save fallback

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until local save is verified both outside Draft and when platform save is unavailable.

### Steps
1. Open the production build where cloud save is unavailable.
2. Start a session and change progress.
3. Reload the page in the same browser profile.
4. Verify progress restoration.

### Expected result
- Local save persists progress across reloads.
- Local save does not throw uncaught errors when storage is available.
- If storage is blocked, the game fails soft and remains playable.

## 18. First session smoke inside Yandex Draft

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until the first 10 minutes are recorded or summarized with evidence.

### Steps
1. Use a clean test account/profile in Yandex Draft.
2. Start a fresh game and play for 10 minutes.
3. Cover base, sortie, combat, loot/inventory, and return flow if reachable.
4. Keep console open and record video or screenshots of key transitions.

### Expected result
- Player can understand and progress through the first 10 minutes.
- No blocker UX issue prevents play.
- No save corruption or progression reset occurs.
- No uncaught errors or blocker `console.error` appear during normal flow.

## 19. Console requirements

- **Status:** NOT RUN
- **Actual result:** NOT RUN
- **Evidence link / screenshot / video:** None
- **Notes:** Release blocker until console output is captured and reviewed.

### Steps
1. Open devtools before loading the Draft build.
2. Execute SDK init, first session smoke, save/load, ads, and IAP checks.
3. Export or screenshot console output.
4. Separate expected fail-soft warnings from blocker errors.

### Expected result
- No uncaught JavaScript errors.
- No blocker `console.error` during normal gameplay flow.
- Expected fail-soft warnings are documented with context and do not break gameplay.
- Any new console error is linked to a follow-up issue before release.

## Release gate summary

- **Current Draft validation verdict:** NO-GO / NOT RUN.
- **Release blocker:** every section above remains a blocker until real Yandex Draft evidence is attached and status is changed to PASS.
- **Do not announce M11/M12 as player-facing complete** until this runbook and the M11/M12 QA acceptance evidence log are both fully PASS.
