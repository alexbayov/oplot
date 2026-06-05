# M12.5 PR8d Preflight — Preview-Only Status Application Copy

This preflight document establishes the implementation blueprint for introducing preview-only status application indicators in the combat action preview line.

> [!NOTE]
> This is a **docs-only design specification**. No runtime files, content registries, or unit tests are altered by this document.

---

## 1. Current State

* **Status Helpers**: Pure types and formatters exist in `src/systems/combatStatus.ts`.
* **Display-Only Chips**: Active status chips render on the hero and active enemy cards.
* **Scene-Local Map**: Active statuses are stored in a private `combatStatusesByTarget` map inside `CombatScene`.
* **Test Seam Hook**: Statuses are configured only via the test seam (`setCombatStatusesForTest`) in tests.
* **No Dynamic Gameplay Logic**:
  * No runtime actions apply statuses.
  * No status durations tick down.
  * No Damage over Time (DoT) or stun turn-skipping.
  * No changes to AP costs, weapon damage, cover calculations, or enemy intents.
* **Content ID Keying Limit**: Since mobs lack instance IDs, multiple mobs of the same type share identical status displays.

---

## 2. PR8d Goal

The goal of PR8d is to display potential status outcomes in the action button hover preview text without executing any modifications:
* **Preview Indicator**: Append status preview text (e.g., `· Кровь 2`) to the action preview line when actions are hovered.
* **Example Output**: `Атака 1 AP: цель Мародёр · Кровь 2` or `Атака 1 AP: цель Мародёр · Шум +2 · Кровь 2` (with firearm noise).
* **Strict Non-Mutation**: The status is strictly text-based. No status instance is added to `combatStatusesByTarget` during preview rendering or action execution.
* **No Runtime side-effects**: Durations do not tick down, no damage is applied, and no AP/intent variables are altered.

---

## 3. Source of Preview Copy

To minimize risk and prevent scope creep:
* **Conservative Rule**: We will not introduce status descriptors inside item registry files or JSON content definitions.
* **No Metadata Schema Alterations**: Registry JSON files (`items.json`, `mobs.json`) must remain unchanged.
* **Test Seam/Fixture Configuration**: The scene will read potential status outcomes from a scene-local preview mapping configured via test seams, or fall back to a hardcoded test fixture (e.g. associating the active ranged weapon's attack with a preview-only `bleed` or `exposed` outcome for testing).
* **Future Work**: Deep integration with item traits or weapon mods will be deferred to a subsequent committed application preflight.

---

## 4. Target Key Decision

* **Limitation**: Currently, statuses key off content IDs (`inst.mob.id`), which causes duplication issues when duplicate mobs exist.
* **Safety Rules for Preview**:
  * The preview text target description will continue to reference the `firstAlive` display target's name (e.g. `цель Мародёр`).
  * No state mutation is executed during the preview phase.
  * If a stable, per-instance runtime identifier (e.g., an array index or unique instance token) is introduced in the future, the status map key must migrate to it before real status application is implemented.

---

## 5. Exact No-Mutation Rules

Generating or updating the action preview label **must not** mutate:
1. `combatStatusesByTarget` map contents.
2. `durationTurns` counters of any active status instance.
3. `currentNoise` levels.
4. `currentAp` balances.
5. `currentMagazineByWeaponId` or backpack reserves.
6. `enemy intent` definitions.
7. Active `cover`, `distanceBand`, or movement flags.

---

## 6. UI Copy Proposal

To fit the 1280×720 landscape action preview bar:
* **Format**: Compact text chips separated by middle dots (` · `).
* **Examples**:
  * Melee/Ranged basic: `Атака 1 AP: цель Мародёр · Кровь 2`
  * Firearm with noise: `Атака 1 AP: цель Мародёр · Шум +2 · Кровь 2`
  * Cover status: `Атака 1 AP: цель Мародёр · Открыт 1`
* **Copy Constraints**:
  * Limit to a maximum of **one** future status preview in the action line.
  * Use plain chip copy (`Кровь 2`, `Открыт 1`). Avoid words like "получит" or "наложит" to prevent implying that actual mutation occurs.
  * Do not use emojis in the action preview string.

---

## 7. System Interactions

We must preserve the existing HUD behavior:
* **Firearm Noise**: Valid firearm shots must continue to preview `Шум +2`.
* **Empty Magazine Fallback**: Fallback melee attacks (bash) must not show firearm noise (`Шум +2`) or firearm-configured status previews.
* **Seam Dependency**: Melee weapon attacks will only display status preview copy if explicitly configured in the seam.
* **Button Exclusions**: Reload, movement, cover, heal, and retreat button previews must not show status application copy unless separately approved.
* **AP Rules**: The AP cost prefix (e.g. `Атака 1 AP`) must remain unaltered.

---

## 8. Future Tests Required

Smoke tests in `CombatScene.smoke.test.ts` must verify:
1. **Configured Preview**: Status preview copy appears in the action text *only* when configured via seam or test fixture.
2. **Non-Mutation**: Repeated hovering/refreshing of action previews does not insert statuses into the active map or decrement active status durations.
3. **No Duplication**: Repeated preview updates do not append duplicate status preview chips to the label.
4. **Combined Indicators**: Ranged weapon previews display both `Шум +2` and the potential status chip (e.g., `Шум +2 · Кровь 2`) correctly.
5. **Fallback Safety**: Fallback attacks display only the default bash message, skipping firearm noise and firearm-configured status previews.
6. **HUD Integrity**: Existing active status chips on the player and enemy cards remain displayed and unaffected.
7. **Regression Guard**: All existing tests for AP previews, ammo counts, cover, noise level, and enemy intent remain green.

---

## 9. Anti-Scope

The following items are strictly deferred to subsequent phases:
* **Actual Application**: No statuses are added to the active scene map after clicking buttons.
* **DoT/Stun**: No tick-down logic or health depletion.
* **JSON Metadata**: No changes to item configuration schemas.
* **AI/Intent Modifiers**: Statuses do not influence AI decisions.
* **Database/Save Migrations**: No serialization or persistent storage updates.
* **CombatEngine Migration**: CombatScene remains the runtime authority.

---

## 10. No-Go Conditions

Development **MUST** stop immediately if:
1. Preview logic requires changing JSON content files or item schemas.
2. Generating preview strings mutates the active status maps.
3. Action commits attempt to apply statuses or tick down durations.
4. Preview copy uses content-id keying for mutating gameplay state.
5. Viewport layout is broken or preview text overlaps HUD components.
6. Copy layout implies that statuses are active when they are only previewed.
