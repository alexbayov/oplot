# M12.5 PR 5c Preflight — Reload Action Wiring

> Status: docs-only preflight for the future PR 5c implementation.
>
> This document does **not** implement reload actions, does **not** change runtime behavior, does **not** modify `CombatScene`, `CombatEngine`, content, or save schema.

---

## 1. Current State after PR5b

*   **Ammo Helper:** Centralized, pure, and thoroughly tested ammo helpers exist in [combatAmmo.ts](file:///home/alex/.gemini/antigravity/scratch/oplot/src/systems/combatAmmo.ts).
*   **CombatScene UI Preview:** [CombatScene.ts](file:///home/alex/.gemini/antigravity/scratch/oplot/src/scenes/CombatScene.ts) renders a display-only preview bar above the action preview panel showing:
    *   Magazine status (`Магазин: не подключён · Ёмкость: <capacity>`);
    *   Compatible caliber/ammo ID item name;
    *   Backpack reserve count (`Запас: <count>`);
    *   Reload status (`Перезарядка: предпросмотр` or Russian translation of the disabled reason).
*   **No Magazine State:** There is no runtime magazine count tracked in `CombatScene` or player state yet.
*   **No Reload Action/Button:** Players cannot trigger a reload, and there is no button for it.
*   **Legacy Ammo Consumption:** Ranged weapon attacks still consume legacy backpack ammo stacks directly during damage resolution.
*   **Save Schema:** The save schema has not been altered.

---

## 2. Core Design Decision before Implementation

The safest path for PR5c is a **runtime-only magazine state inside CombatScene**, keeping the blast radius extremely small:

*   **Decision A (Selected):** Implement `currentMagazineByWeaponId` in `CombatScene` as a runtime-only map to track loaded rounds during the current fight. This state will **not** be written to saved files, local storage, or cloud saves.
*   **Decision B (Selected):** No attack migration yet. Ranged attacks will continue their legacy behavior of consuming backpack ammo directly.
*   **Decision C (Selected):** The reload button consumes backpack reserve ammo and increments the runtime magazine count to its maximum capacity.
*   **Decision D (Selected):** Attack still continues legacy behavior of direct backpack ammo consumption until PR5d.
*   **Decision E (Selected):** The reload action is fully testable on the UI and in smoke tests, but is not yet combat-authoritative for weapon firing (which is deferred to PR5d).

### Alternatives Considered & Rejected
*   *Alternative:* Persist magazine counts on weapon instances in the save file.
    *   *Rejected:* High risk of save corruption, requires schema migration, and expands the scope to save/load/cloud serialization.
*   *Alternative:* Migrating attacks to consume magazine in PR5c.
    *   *Rejected:* Violates the isolation of PR5c. Firing behavior changes must be deferred to PR5d to prevent breaking combat loop stability.

---

## 3. Reload Action Lifecycle Proposal

When a player triggers the reload action in `CombatScene`:

1.  **Awaiting Hero Gate:** Verify that `this.state === "awaiting_hero"`. If not, do nothing.
2.  **AP Validation:** Verify if the action cost (1 AP) is met.
    *   *Note:* The current AP model in `CombatScene` is display-only. AP is not dynamically decremented inside a turn; instead, actions check availability and immediately end the turn.
    *   *PR5c Approach:* Verify `this.currentAp >= 1`. If yes, advance. Otherwise, do nothing.
3.  **Plan Calculation:** Call `computeReloadPlan` with:
    *   `weapon: weaponItem`
    *   `backpack: player.backpack`
    *   `currentMagazine: currentMagazineByWeaponId.get(weaponId) ?? 0`
    *   `magazineCapacity: spec.magazineCapacity`
4.  **Disabled Resolution:** If the reload plan is not OK (`ok === false`):
    *   Log the disabled reason to the combat log using `getAmmoDisabledReasonLabel(disabledReason)`.
    *   Do not modify backpack or magazine state, and do not advance the turn.
5.  **Successful Execution:** If the plan is OK:
    *   **Inventory Decrement:** Deduct `reloadAmount` from `player.backpack` stacks using `removeFromStack()`.
    *   **Magazine Update:** Set the weapon's runtime magazine count to the planned `resultingMagazine` level.
    *   **Combat Log:** Log the reload success (e.g., `Перезарядка: +8 патронов Пистолет ПМ`).
    *   **UI Update:** Update the visual display and preview labels.
    *   **Turn Advance:** Transition `this.state` to `"resolving_mobs"`. Schedule `this.advanceTurn()` after a brief delay (250ms) to resolve the mobs' turn and reset AP, ending the hero's turn.

---

## 4. Runtime Magazine State Proposal

*   **Location:** `CombatScene` private map: `private currentMagazineByWeaponId = new Map<string, number>()`.
*   **Keying:** Kept by `weaponItemId` (e.g., `pm`, `aps`) to ensure it maps correctly to the equipped weapon item.
*   **Comparison of Initialization Options:**
    *   *Option A (Selected):* Initialize to `0` when the weapon is first encountered in combat.
        *   *Pros:* Safest choice. Forces reload verification, prevents free ammo generation, and visually demonstrates that the inventory subtraction and reload calculations work.
        *   *Cons:* Player starts the first fight with an empty magazine. (Acceptable for testing and staging).
    *   *Option B:* Initialize to max capacity on combat start.
        *   *Pros:* Matches realistic initial state.
        *   *Cons:* Can mask bugs in reload action verification and could duplicate ammo if the scene is repeatedly restarted without saving.
*   **Lifecycle:**
    *   Initialized inside `create()`.
    *   Cleared on scene shutdown or `endCombatVictory()` / `endSortie()`.
    *   **No local or cloud save serialization.** State lives purely in memory.
*   **Future Transition:** This runtime map is a temporary scaffold. In PR5d, the attack resolution path will consume ammunition from this map instead of directly subtracting stacks from the backpack.

---

## 5. Inventory Mutation Risk

*   **Safe Decrementing:** Modify backpack stacks using the pure helper `removeFromStack(player.backpack, ammoId, reloadAmount)`.
*   **No Negative Counts:** Guaranteed by `computeReloadPlan` restricting `reloadAmount` to `Math.min(missingInMagazine, reserveBefore)`.
*   **Zero-Count Stacks:** Stacks that reach `0` count will be completely removed from the backpack array to avoid inventory clutter and match consumable item usage.
*   **Disabled Actions:** No state mutation if `computeReloadPlan` returns `ok === false`.
*   **No Duplication:** Ammo is either in `backpack` or in the runtime magazine. Since the firing path is not yet wired to consume magazine ammo, no duplicate generation or hidden losses can happen.
*   **No Silent Loss:** Every inventory modification is computed via pure plans and logged in the combat log.
*   **No Stash Mutation:** The reload action must not touch `baseStash`.
*   **No Return/Loot Lifecycle Mutation:** The backpack is merged to stash upon sortie end using unchanged legacy logic.

---

## 6. UI Proposal

*   **Reload Button:** We will add a fifth button `ПЕРЕЗАРЯДКА` to the bottom action bar.
    *   *Action Slot:* A new physical button instead of replacing an existing action.
*   **Layout Adaptation:** To fit 5 buttons cleanly inside the 1280x720 layout:
    *   Reduce button width from `btnW = 200` to `btnW = 160`.
    *   Reduce gap from `18` to `12`.
    *   This keeps the total width at `5 * 160 + 4 * 12 = 848` pixels, which fits within the safe area.
*   **Wording Update:**
    *   Once the runtime magazine is active, the preview copy will show the actual count:
        `Магазин: 0/8 · Патроны: Патроны 9x18 · Запас: 12 · Перезарядка: готово` (or disabled reason).
    *   The word `"предпросмотр"` will be removed, as the reload action becomes functional.
*   **Visibility of Reasons:** The disabled reason should be displayed in the preview bar *before* the player clicks the button (e.g., `Перезарядка: нет патронов в запасе`).

---

## 7. AP Decision

*   **Decision:** Reload will cost 1 AP.
*   **Rationale:** Since the current `CombatScene` AP model is display-only and does not track sub-turn AP reductions, reload will follow the existing action pattern: it checks if the action is available and ends the turn immediately. This avoids introducing a custom sub-turn loop and prevents regressions in the round/turn sequence.

---

## 8. Required Tests for Future PR5c

The future PR5c must implement and pass the following tests:

*   **Reload Disabled without Reserve Ammo:** Verify reload is disabled when reserve ammo is missing (`no_reserve_ammo`).
*   **Reload Disabled for Melee:** Verify reload is disabled for melee weapons (`not_ranged_weapon`).
*   **Reload Disabled with Broken Metadata:** Verify reload is disabled for weapons with invalid capacity metadata (`invalid_capacity`).
*   **Successful Reload:** Verify reload with reserve ammo decrements backpack by `reloadAmount` and increases the runtime magazine.
*   **No Mutation when Disabled:** Verify reload does not mutate inventory when disabled.
*   **No Ammo Duplication:** Verify total ammo (backpack + magazine) remains constant before and after reload.
*   **Partial Reload:** Verify reloading with less reserve ammo than capacity consumes all available reserve and leaves the magazine partially full.
*   **Zero-Count Stack Behavior:** Verify inventory stacks reaching zero count are removed from the backpack.
*   **UI Preview Updates:** Verify runtime magazine preview updates dynamically on reload.
*   **No Ranged Attack Changes:** Verify existing attack behavior remains unchanged.
*   **AP Preview and Intents:** Verify existing AP preview, intent, and ammo preview smoke tests still pass.
*   **Sortie Lifecycles:** Verify victory, defeat, and retreat smoke tests still pass.

---

## 9. Explicit Anti-Scope

PR5c must **not** include:
*   Attack consumes magazine (deferred to PR5d).
*   Save schema changes or migrations.
*   Cloud/local save changes.
*   Content changes (`content/items.json` or recipes).
*   `CombatEngine` runtime authority migration.
*   Durability rewrite.
*   Enemy intent changes.
*   AP overhaul.
*   Loot/return lifecycle changes.
*   Yandex platform SDK / ads / IAP changes.

---

## 10. No-Go Conditions

The implementation of PR5c must stop immediately if:
*   Reload requires persistent weapon instance or save schema changes.
*   Reload requires rewriting the attack path.
*   Inventory mutation cannot be proven no-loss/no-dup by unit tests.
*   UI cannot fit without hiding AP, intent, or action buttons.
*   Tests cannot isolate the runtime magazine state.
