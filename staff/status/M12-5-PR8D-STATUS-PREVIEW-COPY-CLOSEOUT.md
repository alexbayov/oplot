# M12.5 PR8d — Preview-Only Status Application Copy Closeout

This document summarizes the completion of the PR8d preview-only status application copy feature in the combat action preview line, including testing details, safety validations, and next implementation options.

---

## 1. Feature Status

The preview-only status application copy has been successfully integrated into the combat action preview line.

* **Scene-Local Preview Map**: A private map `statusPreviewByAction` inside `CombatScene` holds the status configuration.
* **Test Seam Controls**: The seam `setStatusPreviewForTest(actionKey, status)` allows programmatic preview configuration in tests.
* **Only Attack Preview Reads Preview Status**: The status copy is configured strictly for the attack action key, appending status info (e.g., `· Кровь 2`) to the preview text.
* **No Real Status Application**: Previews are display-only. Generating preview copies or executing attacks does not mutate or add statuses to the active status mapping (`combatStatusesByTarget`).
* **Zero Runtime Mechanics Side-Effects**:
  * No status application on action commits.
  * No duration ticking (durations are completely static).
  * No Damage over Time (DoT) or status-induced health depletion.
  * No stun, action constraints, or turn skips.
  * No changes to AP costs, weapon damage, cover calculations, reload logic, magazine states, or enemy intents.
  * No modifications to game saves, content database files, or external platform APIs.

---

## 2. Verified Test Coverage

A total of 17 dedicated smoke tests have been verified in `src/scenes/__tests__/CombatScene.smoke.test.ts` to ensure complete behavioral coverage:

1. **Default State**: Action preview text displays no preview statuses by default.
2. **Configured Attack Preview**: Setting a test preview status (e.g., `bleed 2`) correctly appends the status copy (`Кровь 2`) to the attack preview text.
3. **Loaded Firearm Preview**: Confirms that when a firearm is loaded, both noise preview and status preview render together (e.g., `Шум +2 · Кровь 2`).
4. **Repeated Preview Refresh**: Verifies that updating the display and action preview repeatedly is non-mutating and does not duplicate status text or append duplicate dot-separated chips.
5. **Attack Commit Non-Mutation**: Committing an attack with a status preview does not apply the status to the active maps, while correctly decrementing weapon magazine size and incrementing noise according to existing PR7 rules.
6. **Empty Magazine Fallback**: An empty magazine fallback melee attack (bash) correctly suppresses firearm noise preview (`Шум +2`) and firearm-configured status previews.
7. **Disabled Action Guard**: Action previews are hidden, and status copy is suppressed when actions are disabled (e.g., when the game state is not `awaiting_hero`).
8. **Action Exclusion**: Ensures that only the attack action key displays status previews, and other buttons (like reload, cover, heal, movement, and retreat) are excluded.
9. **Clear Preview Seam**: Setting a preview to `null` via the test seam correctly clears it from the action preview.
10. **Active Chips Independence**: Active status chips currently on the player or enemy cards remain displayed and unaffected by active status previews.
11. **Scene Transition Reset**: Verifies that creating a new scene harness fully clears the preview and active status maps, preventing carry-over.
12. **Non-Attack Keys Ignored**: Setting status preview for non-attack action keys (like reload, cover, heal, movement, retreat) is ignored by the UI.
13. **Source Object Non-Mutation**: Confirms that the source object passed to the test seam is not mutated or frozen during the rendering pass.
14. **Safe Invalid Inputs**: Malformed inputs (e.g. unknown status IDs, negative durations, fractional values, or NaNs) are normalized or safely ignored without throwing exceptions or crashing the game.
15. **Commit and Refresh Lifecycle**: Verifies that resetting the scene to `awaiting_hero` after committing an attack does not leave any active statuses in the active status maps.
16. **Melee Configured Preview**: Confirms that if a status preview is explicitly configured for melee attacks (like `exposed 1`), it renders properly (`Открыт 1`) but does not apply the status on attack execution.
17. **HUD Integrity**: Regression guard confirming all 7 action buttons, AP indicators, magazine states, distance chips, noise chips, and enemy intents continue to render correctly without layout or text truncation errors.

---

## 3. Known Limitations

* **No Dynamic Status Application**: Preview indicators are static copies driven by test fixtures; no runtime trigger applies them to active combatants.
* **Stable Target Key Requirement**: Statuses are currently mapped using content IDs (`inst.mob.id`), which makes them unsuitable for multi-mob encounters due to duplicate key collision risk. A unique instance key or array indexing identifier must be introduced before real status application can be committed.
* **Seam Dependency**: Preview statuses are set strictly via test seams; there is no runtime config connecting item types to dynamic status effects yet.
* **Viewport QA**: Layout must be verified manually on a physical 1280×720 viewport to guarantee visual consistency.

---

## 4. Visual QA Guidelines

* **Resolution Verification**: Configure test environment viewport size to 1280×720 landscape.
* **Layout and Alignment**:
  * Verify that the combined text `Шум +2 · Кровь 2` fits cleanly inside the action preview bar without clipping.
  * Ensure that active status chips (above actions) do not overlap the preview text row.
* **Touch-First Checks**: Verify that action preview updates reliably on tap/refresh and does not depend on desktop hover events.

---

## 5. Next Implementation Roadmap

* **Option A**: Run visual manual QA pass on 1280×720 viewport and resolve minor font/style layout bugs.
* **Option B (Recommended)**: Draft the PR8e preflight to introduce stable per-instance target keys on the runtime combat entities to support unique enemy status mutations.
* **Option C**: Proceed to the PR9 movement/AP preflight.

> [!WARNING]
> Do not attempt to implement actual status mutations or damage/DoT/stun ticking until stable entity keying is resolved. Real mutations on content IDs will cause severe multi-enemy layout replication bugs.
