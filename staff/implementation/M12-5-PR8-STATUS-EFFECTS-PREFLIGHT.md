# M12.5 PR8 — Status Effects Preflight

This preflight document establishes the implementation blueprint for introducing status effects (conditions) in Oplot combat. 

> [!NOTE]
> This is a **docs-only design specification**. No runtime files, content registries, or unit tests are altered by this document.

---

## 1. Current State

* **No status effect system:** Fights do not have active status, buffs, or debuffs.
* **No active status logic:** There is no runtime code for `bleed`, `exposed`, or `suppressed` states.
* **No DoT (Damage over Time) / Stun:** Combat features no ticking damage or turn-skipping actions.
* **No save persistence:** Combat state does not serialize any statuses to `GameState` or database records.
* **Scene authority:** `CombatScene` remains the active runtime source of truth; `CombatEngine` does not govern active combat flow.
* **AP economy is non-authoritative:** AP budget pips and preview indicators are visible, but full AP consumption rules are not strictly enforced across all action paths. Reloading and movement remain free/non-consuming.
* **Movement is preview-only:** Distance buttons log preview-only messages but do not execute changes.
* **Distance is display-only:** Distance is initialized and displays as `"средне"`, having no mechanical gameplay modifiers.

---

## 2. PR8 Goals

The goal of PR8 is to establish the status effects infrastructure safely without risk of regression:
* **Define Status Model:** Draft the TypeScript definitions and structural properties for combat statuses.
* **Render Status Chips:** Implement clean, readable HUD chips displaying statuses on the player card and enemy cards.
* **Support Previewing Statuses:** Render potential status applications on action previews (e.g. `"Шум +2 · Кровь 2"`) without committing mutations.
* **No Real Gameplay Modifiers:** In the first runtime slice, statuses have **no mechanical effect** (no DoT ticks, no damage multipliers, no actions disabled).
* **Test Isolation:** Verify rendering layout, sorting, priorities, and clean exit lifecycles under smoke tests first.

---

## 3. Initial Status IDs

We define the first three status IDs for the status model:

### A. `bleed` (Кровь)
* **Purpose:** Represents ongoing physical trauma and blood loss.
* **Display Label:** `Кровь N` (e.g. `Кровь 2`).
* **Applicability:** Both Hero and Enemies.
* **First PR Behavior:** Display-only chip. No health is decremented.
* **Future Behavior:** Deals low damage (e.g. 1-2 HP) at the end of the target's turn.
* **Risks:** Scope creep toward multi-stage bleeding or interaction with medicine/perks too early.

### B. `exposed` (Открыт)
* **Purpose:** Represents loss of tactical cover/guard, leaving the target vulnerable.
* **Display Label:** `Открыт N` (e.g. `Открыт 1`).
* **Applicability:** Both Hero and Enemies.
* **First PR Behavior:** Display-only chip. Does not change incoming damage.
* **Future Behavior:** Multiplies incoming damage (e.g. +50% damage taken) or ignores defensive cover reduction. Slipped/cleared when cover is taken.
* **Risks:** Intersecting too early with the active cover mechanics and recalculating damage logic inline.

### C. `suppressed` (Подавлен)
* **Purpose:** Represents intense suppression fire, limiting mobility and precision.
* **Display Label:** `Подавлен N` (e.g. `Подавлен 2`).
* **Applicability:** Both Hero and Enemies.
* **First PR Behavior:** Display-only chip. Does not limit action buttons or enemy intents.
* **Future Behavior:** Restricts advanced options (disables Aimed Shot/Rush), decreases accuracy, or decreases AP budget.
* **Risks:** Overwhelming the AI model or interfering with AP checks before they are fully authoritative.

---

## 4. Explicitly Deferred Statuses

The following statuses are deferred to subsequent development blocks:
* **`stun` (Оглушение):** Deferred because the AP economy is not fully authoritative yet; forcing turn skips could easily lead to scene softlocks.
* **`burning` (Горение):** Deferred due to requirements for complex DoT triggers, environment/scenary visual logic, and extinguishing interactions.
* **`infected` (Заражение):** Deferred because long-term disease states require integration with base inventory and sortie recovery/save states.
* **`wounded` (Травма):** Deferred due to long-term stats impact carrying over outside individual battles.
* **`poison` (Отравление):** Deferred to avoid content duplication with `bleed` in early stages.
* **`morale` / `fear` (Паника):** Deferred because it forces modifications to the core AI intent-determination tree.
* **`guarded` / `armored` (В защите / Броня):** Deferred because static or temporary shield status parameters intersect with cover and weapon traits, requiring design parity decisions.

---

## 5. Data Model Proposal

We propose the following clean type definition for the future helper file (`src/systems/combatStatus.ts`):

```typescript
export type CombatStatusId = "bleed" | "exposed" | "suppressed";

export type CombatStatusTarget = "hero" | "enemy" | "both";

export interface CombatStatus {
  id: CombatStatusId;
  labelRu: string;              // "Кровь" | "Открыт" | "Подавлен"
  durationTurns: number;        // Remaining duration in turns
  target: CombatStatusTarget;   
  visible: boolean;             // Visible on HUD panel
  isHarmful: boolean;           // true if debuff (colored red), false if buff (colored green/blue)
  displayPriority: number;      // 1 (bleed), 2 (exposed), 3 (suppressed)
  canStack: boolean;            // Can stack intensity (currently false)
  canRefreshDuration: boolean;  // Re-application resets duration turns
}
```

---

## 6. Storage Proposal

We compare potential storage structures for the status map:

1. **`scene-local map` in `CombatScene` (Selected Decision):**
   * *Description:* Active statuses are kept in a local `Map<string, CombatStatus[]>` keying `"hero"` and target mob IDs.
   * *Pros:* Simple reset on scene exit, completely isolated from `GameState.currentSortie`, zero migration risk for saved games.
   * *Cons:* Not shared directly with core system models.
   * *Verdict:* **Selected.** This is the safest approach for PR8.
2. **`MobRuntimeState`:**
   * *Verdict:* Rejected. Adding status properties to runtime state models increases the risk of serialization failures.
3. **`GameState.currentSortie`:**
   * *Verdict:* Rejected. Broadening global sortie state triggers save-game integration issues.
4. **`CombatEngine`:**
   * *Verdict:* Rejected. The engine does not act as runtime authority yet.

---

## 7. UI Layout on 1280×720 Landscape

* **Enemy Status Panel:** Compact horizontal chips rendered directly below the mob card's HP and Intent copy.
* **Hero Status Panel:** Compact horizontal row of chips displayed near cover, noise, and distance indicators.
* **Chip Limits:** Maximum of **3 status chips** are rendered on any target.
* **Overflow Handling:** If a target has $>3$ active statuses, the HUD displays the 2 highest-priority chips (ranked by `displayPriority`) followed by a `+N` overflow chip (e.g. `+1`).
* **Text Formatting (No Emojis):** Displayed as compact text indicators:
  * `Кровь 2`
  * `Открыт 1`
  * `Подавлен 1`
* **Visual Styling:** Harmful status chips (`isHarmful: true`) are rendered with a red background/text border.

---

## 8. Mutation Rules

To avoid side effects during UI refreshes:
* **Display-only:** Statuses are strictly static displays in the first runtime slice.
* **Preview Isolation:** Generating or refreshing action previews MUST NOT mutate any active status values or durations.
* **No Ticking:** Status durations do not count down automatically during turn resolutions yet.
* **No DoT Application:** Firing/melee does not apply actual ticking damage.
* **Test Seam Authority:** For the first runtime phase, statuses are applied to targets **only via test harness seams** for visual verification.
* **No Persistence:** Statuses are cleared upon scene transition or reset.

---

## 9. Interactions with Existing Systems

* **AP Preview:** Action button previews display potential status outcomes (e.g., `"Атака 1 AP: цель Мародёр · Кровь 2"`), but AP checks remain independent of status modifiers.
* **Reload/Magazine/Refund:** Unspent ammo refunds continue to function safely on scene exits regardless of any active statuses.
* **Enemy Intent:** Statuses do not block or alter intent generation.
* **Cover:** Taking cover will eventually clear `exposed` states, but this linkage is deferred.
* **Distance/Movement:** Movement buttons remain in preview mode.
* **Noise:** Firing valid firearm shots increments local noise independently of active target statuses.
* **Lifecycle:** Entering victory, defeat, or retreat transitions completely wipes the scene-local status map.
* **Save/Cloud:** Cloud saving ignores status states during serialization.
* **CombatEngine:** The scene operates independently of model engine authority.

---

## 10. Future PR Split

We split PR8 implementation into separate commits:
1. **PR8: preflight docs (This PR):** Architectural preflight document.
2. **PR8a: pure status helper/types:** Type definitions and helper functions (`combatStatus.ts`) for adding, sorting, and cleaning statuses.
3. **PR8b: display-only chips:** UI components for hero/enemy status bars, rendering chips under test seam configurations.
4. **PR8c: display hardening:** Smoke tests confirming correct rendering, prioritization, limits (max 3), and layout boundaries.
5. **PR8d: preview-only application copy:** Showing status indicators on action buttons without actual runtime mutation.
6. **PR8e: committed application:** Triggering status applications on action commits (requires separate approval/PR).
7. **PR8f: DoT/duration tick:** Applying tick reductions and health changes (deferred to M13/later).

---

## 11. Tests Required Later

* **Helper Logic Tests:** Verifying label generation, sorting priority, and `+N` overflow logic.
* **HUD Chip Rendering Tests:** Confirming that chips are visible on hero and enemy panels.
* **Preview Non-Mutation Tests:** Asserting that refreshing action previews does not reduce duration turns or add duplicate statuses.
* **Lifecycle Tests:** Ensuring statuses are wiped on victory, defeat, retreat, or scene resets.
* **Regression Tests:** Ensuring that existing ammo count, magazine reload, noise level, cover chip, and intent tests continue to pass.
* **Layout Safeguards:** Verifying no UI overlaps or text crowding occurs under a standard 1280×720 viewport.

---

## 12. Anti-Scope Summary

We explicitly exclude:
* Activating damage-over-time (DoT) effects.
* Implementing stun turn-skipping actions.
* Forcing AP economy checks on free actions.
* Changing distance bands mechanically.
* Altering enemy intents or AI behavior profiles.
* Mutating global sortie risk metrics.
* Spawning risk-based reinforcements.
* Introducing save data migrations or database changes.
* Migrating runtime state authority to `CombatEngine`.

---

## 13. No-Go Conditions

Development MUST stop immediately if:
1. Status display implementation requires database schema or save file modifications.
2. Status previews or chips force changes to core AP or movement preview loops.
3. Rendering `suppressed` indicators requires rewriting `mobAI` behavior patterns.
4. Rendered status chips cause layout overlaps or crowd HUD buttons on a 1280×720 viewport.
5. Action preview refreshes mutate active status counts or duration numbers.
6. Status application tries to implement DoT calculations before display layouts are proven stable.
