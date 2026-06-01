# M12.5 PR5d Preflight — Migrate Ranged Attack to Magazine

> Status: docs-only preflight for the future PR5d implementation.
>
> This document does **not** implement code changes, does **not** change runtime behavior, does **not** modify `CombatScene`, `CombatEngine`, content, or save schema.

---

## 1. Current Post-PR5c State

*   **Reload Button:** Added as `"ПЕРЕЗАРЯДКА"` in the action bar, but it is currently a preview-only affordance.
*   **Inventory Mutation:** Reload does **not** mutate backpack stacks or consume ammunition.
*   **No Magazine State:** No runtime magazine state is kept or updated.
*   **Legacy Ammo Consumption:** Ranged weapon attacks still consume backpack ammunition directly during damage resolution.
*   **Ammo Preview:** Shows `Магазин: не подключён · Ёмкость: <capacity> · Патроны: <name> · Запас: <count> · Перезарядка: <status>`.

---

## 2. Core PR5d Decision

The main goal of PR5d is to make reload and magazine mechanics functional in the player-facing combat loop, migrating away from the legacy model:

*   **Runtime State:** Introduce a scene-local runtime magazine state map inside `CombatScene`.
*   **Reload Authority:** Reload becomes functional, consuming reserve ammunition from the backpack and filling the runtime magazine.
*   **Attack Migration:** Ranged attacks will consume ammo from the runtime magazine, not from the backpack directly.
*   **Melee Attacks:** Melee attacks remain completely unchanged.
*   **No Persistence:** No save schema changes, no cloud/local save changes, and no backpack/stash persistence for magazine state.
*   **AP Consumption:** AP consumption and turn ending for reload remain **disabled** in PR5d unless explicitly approved, keeping reload as a free, non-turn-ending action.

---

## 3. Runtime Magazine State Design

*   **Data Structure:** `private currentMagazineByWeaponId = new Map<string, number>()` in [CombatScene.ts](file:///home/alex/.gemini/antigravity/scratch/oplot/src/scenes/CombatScene.ts).
*   **Keying Strategy:**
    *   *Weapon Item ID keying (Selected):* Key by the equipped weapon item ID (e.g. `pm`, `aps`) derived from `player.equipped_weapon_id`.
    *   *Risks:* If a player has multiple copies of the same weapon type, they will share a single magazine value. However, since the current game model only permits equipping one weapon slot via a singular `equipped_weapon_id` string, this risk is non-existent in practice.
*   **Initialization:**
    *   If a ranged weapon is equipped and its key is not in `currentMagazineByWeaponId`, initialize it to `0` inside `create()` or upon first access in `updateDisplay()`.
    *   This forces the player to perform an initial reload, validating the inventory subtraction and UI update.
*   **Cleanup:**
    *   The map is cleared inside `create()` and on scene end (`endCombatVictory()` / `endSortie()`).
*   **GameState Isolation:**
    *   The magazine state is **not** stored in `GameState` and **not** persisted.
*   **Known Limitation:**
    *   Loaded magazine ammunition is lost across scene transitions (e.g. retreating from combat to the map scene and entering another fight will reset the magazine to `0`). This is a documented limitation until a future persistence decision is approved.

---

## 4. Reload Behavior for PR5d

*   **Action Availability:** Allowed only when `this.state === "awaiting_hero"`.
*   **Plan Computation:** Call `computeReloadPlan` with the active weapon, backpack, and current magazine count.
*   **Disabled Status:** If the plan is not OK (`ok === false`):
    *   Log the disabled reason to the combat log: `Перезарядка: <reason_label>.`
    *   Perform no inventory or magazine mutations, and do not advance the turn.
*   **Success Status:** If the plan is OK:
    *   Deduct `reserveAmmoConsumed` from `player.backpack` stacks using `removeFromStack()`.
    *   Update the magazine state: `currentMagazineByWeaponId.set(weaponId, resultingMagazine)`.
    *   Log the reload success: `Перезарядка: +<amount> патронов <weaponName>.`
    *   Call `updateDisplay()` to refresh UI labels.
    *   Do **not** consume AP or end the turn (reload remains a free action in this PR).

---

## 5. Attack Behavior for PR5d

*   **Ranged Attack Resolution:**
    *   Read current magazine count: `currentMagazineByWeaponId.get(weaponId) ?? 0`.
    *   Read weapon cost per shot using `getAmmoCostForShot()`.
    *   If `currentMagazine >= ammoPerShot`:
        *   Subtract `ammoPerShot` from the runtime magazine state map: `currentMagazineByWeaponId.set(weaponId, currentMagazine - ammoPerShot)`.
        *   Apply normal weapon damage stats.
        *   Do **not** modify or consume backpack stacks.
    *   If `currentMagazine < ammoPerShot` (insufficient ammo):
        *   Do **not** silently fallback to consuming backpack stacks directly.
        *   **Selected Fallback Choice:** Retain the existing weak fallback `Нет патронов — удар прикладом.` (using weak damage `{ damage_min: 1, damage_max: 2 }`), but now it is triggered by an empty magazine rather than an empty backpack.
*   **Melee Attack Resolution:**
    *   Melee attacks remain unchanged and require no magazine checking or consumption.

---

## 6. Inventory Mutation Rules

*   **Isolation of Decrements:** Backpack ammunition stacks are decremented **only** on successful reload actions.
*   **No Attack Decrements:** Attacks must **never** consume or mutate backpack stacks directly for ranged weapons.
*   **No Negative Stacks:** Prevented by `computeReloadPlan` restricting consumption to available reserve stacks.
*   **Zero-Count Stacks:** Stacks that reach `0` count will be completely removed from the backpack array.
*   **No Duplication or Silent Loss:** Validated through calculations using pure helpers.
*   **No Stash Mutation:** The reload action must never modify `baseStash` or the return-to-base loot recovery flow.

---

## 7. UI / Copy Changes

*   **Preview Update:**
    *   The ammo preview bar must no longer say `Магазин: не подключён`.
    *   Instead, display the active count: `Магазин: <current>/<capacity>`.
    *   Display reserve: `Запас: <count>`.
    *   Display reload status: `Перезарядка: готово` or translated reason.
*   **Copy Details:**
    *   Reload button copy: `ПЕРЕЗАРЯДКА`.
    *   Combat log reload success message: `Перезарядка: +<amount> патронов <weaponName>.`
    *   Combat log fallback attack message: `Нет патронов — удар прикладом.`.
    *   AP preview remains unchanged (e.g. `Атака 1 AP: готово`) and does not imply AP cost for reload.

---

## 8. AP Decision

*   **Free Reload Action:** In PR5d, reloading does not consume AP or end the hero's turn.
*   **Temporary Staging:** This free behavior is documented as a temporary staging milestone to test the correctness of magazine state tracking and inventory increments. AP consumption will be wired in M12.5 PR5e/PR6 once the magazine loop is proven stable.
*   **No AP Changes:** Do not modify the AP preview calculations or loop sequence in PR5d.

---

## 9. Required Tests for Future PR5d

The implementation of PR5d must pass the following tests:

*   **Reload Functionality:**
    *   Reload with reserve ammo decrements backpack and increments magazine.
    *   Partial reload consumes all available reserve and leaves magazine partially full.
    *   Reload is disabled when reserve ammo is missing, when magazine is full, or when metadata is invalid.
    *   No mutations occur on disabled reload actions.
*   **Attack Functionality:**
    *   Ranged attack consumes ammunition from the runtime magazine.
    *   Ranged attack does **not** consume ammunition from the backpack.
    *   Empty magazine ranged attack triggers the `Нет патронов — удар прикладом.` fallback.
    *   Melee attacks function normally and do not consume magazine.
*   **UI Updates:**
    *   Ammo preview updates dynamically on reload and ranged attacks.
    *   The label displays `Магазин: <current>/<capacity>` correctly.
*   **Regressions:**
    *   AP preview, enemy intents, victory, defeat, and retreat flows pass unmodified.

---

## 10. Risks

*   **Ammo Duplication/Loss:** Reload could duplicate ammo or delete reserve ammo if backpack update and magazine increment are not executed atomic-style.
*   **Loaded Magazine Loss:** Since state is not saved, players might feel confused if they lose loaded rounds upon entering/exiting combat scenes. This must be documented.
*   **Free Reload Abuse:** Players can reload infinitely for free inside a turn. This is accepted temporarily for PR5d and will be resolved in PR5e.
*   **Duplicate Weapon Key Conflict:** Keying by weapon type means two PM pistols share the same magazine. This is acceptable for current single-weapon equip layouts.

---

## 11. No-Go Conditions

Implementation must stop immediately if:
*   Save schema changes or migrations become required.
*   Mass content or item database rewrites are required.
*   Duplicate weapon instances require complex keying beyond `equipped_weapon_id`.
*   Tests cannot prove zero ammo loss or duplication.
*   Attack migration requires rewriting `CombatEngine` authority.

---

## 12. Explicit Anti-Scope

PR5d must **not** include:
*   Save schema changes or migrations.
*   Cloud/local save persistence modifications.
*   Content database changes (`content/items.json` or recipes).
*   `CombatEngine` runtime authority switch.
*   Weapon durability rewrite.
*   AP system overhaul.
*   Loot collection / return lifecycle modifications.
*   Yandex platform SDK changes.
