# M12.5 PR8 — Display-Only Status Chips Closeout

This document summarizes the status of the PR8 display-only combat status chips implementation and defines the coverage, limits, manual QA notes, and next development steps.

---

## 1. Implementation Status

We have implemented the foundational status rendering layer within the combat interface.

* **Status Chips**: Renders player (hero) and enemy status chips using pure helpers in `src/systems/combatStatus.ts`.
* **Scene-Local Storage**: All active statuses are stored inside `CombatScene`'s private `combatStatusesByTarget` map, keyed by `"hero"` and the mob's stable identifier (`inst.mob.id`).
* **Seam for Testing**: A public test seam method `setCombatStatusesForTest(targetKey, statuses)` allows configuring statuses inside smoke and unit tests.
* **No Gameplay Interactions (Strictly Display-Only)**:
  * No status application from combat/attacks.
  * No duration ticking (durations are static).
  * No Damage over Time (DoT) or status-induced health changes.
  * No stun, turn skips, or action constraints.
  * No modifications to AP preview, enemy intents, weapon damage, ammo count, noise level, or cover properties.
  * No modifications to game save state, content registry files, or external platform wrappers.

---

## 2. Verified Test Coverage

The following properties have been thoroughly hardened under `src/scenes/__tests__/CombatScene.smoke.test.ts` to ensure layout safety and zero regressions:

1. **Initial Render**: No status text elements display by default. Existing AP, ammo, distance, cover, noise, and enemy intent indicators are unaffected.
2. **Hero Status Chip Render**: Verified text rendering format (`Кровь 2 · Открыт 1 · Подавлен 3`) with assertions proving no mutations to AP, player backpack, or weapon magazines.
3. **Enemy Status Chip Render**: Verified status text shows up correctly on the first alive mob's HP/intent card.
4. **Overflow Formatting**: Verified that up to 3 chips render directly, and any additional active statuses result in 2 visible chips followed by an overflow indicator (e.g., `+2` for 4 statuses, `+3` for 5 statuses).
5. **Sorting Priority**: Verifies that status order adheres to display priorities (`bleed` (1) $\to$ `exposed` (2) $\to$ `suppressed` (3)) yielding correct chip ordering regardless of application order.
6. **Non-Mutation on Refresh**: Repeated calls to `updateDisplay` and `updateActionPreview` leave stored statuses completely unchanged and intact.
7. **Invalid Status normalization**: Malformed entries passed through the test seam (such as unknown IDs, negative durations, fractional values, or NaNs) are safely ignored or normalized without crashes.
8. **Gameplay Non-Mutation Matrix**: Confirmed that executing reload, firearm attack, empty-magazine fallback, movement preview, taking cover, healing, and retreat actions do not mutate or clear active status lists.
9. **Lifecycle Clearing**: Verifies that status map entries are cleared upon scene instantiation, and that statuses do not carry over between sorties.
10. **Dead/Fled Mobs Guard**: Mobs that are fled or dead do not render status chips.
11. **Duplicate Mob ID Risk**: Documented that keying status by content ID (`inst.mob.id`) means duplicate mob instances in the same fight currently share the same status display. This is noted as a display seam limitation acceptable for the display-only layer.
12. **HUD Regression Guard**: Confirmed all seven action buttons render exactly once, and AP, ammo, distance, cover, noise, and enemy intent remain visible and correct under statuses.

---

## 3. Known Limitations

* **No Gameplay Actions**: Statuses are currently set only through the test seam; no attacks or effects apply them dynamically.
* **Ticking / DoT**: Durations do not tick down and no health/damage effects are calculated.
* **Content ID Keying**: If an encounter contains multiple mobs of the same type (same `mob.id`), they will share the same status chips. To support per-instance statuses in the future, a unique instance key or index must be added to the runtime state.
* **Visual Testing**: Visual alignment is verified under fake game objects, but manual verification is required on the real 1280×720 viewport.

---

## 4. Manual QA Notes

* **Resolution Check**: Ensure the viewport is set to 1280×720 landscape.
* **Overlap Verification**:
  * Verify the hero status row is centered at `actionY - 110` (just above the distance label at `actionY - 90`) and has no overlap with HUD elements.
  * Verify enemy status chips (at `enemyY + 32` below HP bars) are readable and that consecutive mob HP cards do not overlap (since spacing increases from 40 to 52 px when statuses render).
* **Console Safety**: Open dev tools and confirm no warnings or errors are thrown during display refreshes.

---

## 5. Next Steps & Options

* **Option A (Recommended)**: Implement PR8d preview-only status application copy (displaying preview text like `Шум +2 · Кровь 2` on action buttons when hovering).
* **Option B**: Pass a brief manual QA bugfix cycle to adjust layouts if overlaps occur on specific devices.
* **Option C**: Proceed to PR9 (AP / movement preflight) to align movement buttons with game mechanics.

> [!IMPORTANT]
> Do not attempt to implement DoT, stun, or AP mutators in the next PR. Keep the status application layers isolated until preview copy and visual layout issues are completely stabilized.
