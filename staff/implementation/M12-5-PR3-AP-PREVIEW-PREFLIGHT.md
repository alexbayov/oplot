# M12.5 PR 3 Preflight — AP Model + Action Preview

> Status: docs-only preflight for the future PR 3 implementation.
>
> This document does **not** implement AP, does **not** change runtime behavior, does **not** modify `CombatScene`, and does **not** wire `CombatEngine` into the player-facing combat loop.

## 1. Current action paths in `CombatScene`

Current player-facing combat is still driven by `src/scenes/CombatScene.ts`. PR 3 must treat these paths as the baseline to preserve until a later implementation PR intentionally changes behavior.

### Attack

- Entry point: current hero attack button invokes the existing hero attack path.
- Current behavior:
  - Requires `state === "awaiting_hero"`.
  - Selects the first alive/non-fled mob as the target.
  - Reads the player's currently equipped legacy weapon ID.
  - Uses melee stats directly when a melee weapon is equipped.
  - Uses ranged stats and consumes legacy backpack ammo when a ranged weapon has enough ammo.
  - Falls back to a weak butt/desperate hit when ranged ammo is missing.
  - Applies existing low-level damage calculation.
  - Clears target cover after hit.
  - Logs the result, updates display, moves to mob resolution, and queues turn advance.

### Cover

- Entry point: current cover button invokes the existing cover path.
- Current behavior:
  - Requires `state === "awaiting_hero"`.
  - Sets current sortie `cover_active = true`.
  - Logs the cover message.
  - Moves to mob resolution and queues turn advance.

### Heal / no-heal

- Entry point: current medkit button invokes the existing heal path.
- Current behavior:
  - Requires `state === "awaiting_hero"`.
  - Scans backpack stacks for consumables with `effect_type === "heal"`.
  - Picks the smallest healing item value first.
  - If no healing item exists, logs the existing no-medkit message and does **not** advance the turn.
  - If a healing item exists, consumes one stack item, restores HP up to max HP, logs the result, updates display, moves to mob resolution, and queues turn advance.

### Retreat

- Entry point: current retreat button invokes the existing retreat path.
- Current behavior:
  - Requires `state === "awaiting_hero"`.
  - Sets combat state to ended.
  - If sortie still has unresolved fights, clears cover and returns to `SortieScene`.
  - Otherwise uses the existing end-sortie retreat flow.

### Victory / defeat transitions

- Victory is triggered when all mobs are down or fled.
- Current victory behavior:
  - Tracks `combat_resolved` as won.
  - Generates mob loot and guaranteed boss drops.
  - Grants XP and level-up/skill point effects as currently implemented.
  - Drains zone loot into pending loot.
  - Increments `fights_completed`.
  - Starts `LootScene`, with level-up overlay if applicable.
- Defeat is triggered when player HP reaches zero.
- Current defeat behavior:
  - Shows second-chance rewarded-ad option if not already used.
  - Shows surrender option.
  - Existing defeat end flow applies loot loss, merges backpack to stash, restores HP, ticks radio trust, saves to cloud, clears sortie, and returns to base.

## 2. Proposed minimal AP model

PR 3 should add the smallest AP model that can support preview/UI without changing current outcomes.

- Default player AP per player turn: **3 AP**.
- Quick shot / current basic attack: **1 AP**.
- Aimed shot: **2 AP**.
  - If not fully implemented in PR 3, it should be a preview/action-shell option only or omitted from active controls until it has safe behavior.
- Guard / take cover: **1 AP**.
  - Maps conservatively to the existing cover action.
- Retreat: **2 AP + existing risk/flow**.
  - Must preserve the existing retreat and end-sortie behavior.
- Reload: future placeholder unless current UI already supports it safely.
- Item: current medkit/heal action may be displayed as **1 AP** if wired, but PR 3 must preserve current heal/no-heal behavior exactly.

AP model constraints:

- AP is a UI/action budget, not a combat rebalance in PR 3.
- Existing action results must remain stable.
- If PR 3 cannot safely support multi-action turns without changing current flow, AP may be displayed and validated while actions still end the hero turn as they do now.
- Disabled actions must show a clear reason instead of silently doing nothing.

## 3. Preview-only UI scope

PR 3 preview must stay conservative and avoid becoming a second combat resolver.

Allowed preview UI:

- AP pips for the current player turn.
- Selected action cost.
- Disabled reason, for example:
  - not enough AP;
  - no target;
  - no equipped weapon;
  - no medkit;
  - retreat unavailable in current state.
- Approximate damage text only if already available from current logic and item stats.
- Existing action labels and current target text may be reused.

Rules for approximate damage preview:

- No new damage formulas.
- Do not duplicate the full combat math pipeline.
- If current logic cannot provide a safe preview, show a qualitative label or omit damage preview.
- Preview must not mutate `GameState`, sortie, mobs, inventory, cooldowns, or logs.

## 4. Explicit anti-scope

PR 3 must not include:

- Enemy intents.
- Ammo canonicalization.
- Distance bands.
- Noise meter or sortie-risk noise hooks.
- Status overhaul.
- New damage formulas.
- New enemy AI behavior.
- Loot/return lifecycle changes.
- Yandex SDK, ads/IAP, banner, platform, cloud save, or telemetry changes.
- Save migration.
- Content changes.
- CombatEngine runtime authority switch.
- CombatScene end-lifecycle rewrite.

## 5. Required tests for PR 3

PR 3 must add/extend tests before or alongside implementation.

### Unit tests

- AP cost lookup:
  - quick shot = 1 AP;
  - aimed shot = 2 AP;
  - guard/take cover = 1 AP;
  - retreat = 2 AP;
  - item/reload placeholder costs are either documented or unavailable.
- Insufficient AP disabled reason:
  - returns a stable reason string/code;
  - does not mutate state.
- AP reset per player turn:
  - starts at 3 AP on a player turn;
  - resets cleanly on the next player turn;
  - does not reset during mob resolution.

### Scene smoke / integration tests

- Preview renders without changing the actual action result.
- Selecting/hovering preview does not mutate player HP, mob HP, backpack, sortie cover, pending loot, or logs.
- Current attack smoke still passes.
- Current cover smoke still passes.
- Current heal/no-heal smoke still passes if item preview is included.
- Current retreat smoke still passes.
- Victory/defeat lifecycle tests still pass.
- No lifecycle changes: victory still reaches `LootScene`, defeat still exposes second-chance/surrender.

## 6. Risk notes

### `CombatScene` god-object risk

`CombatScene` currently owns UI, action dispatch, turn loop, damage resolution, logs, victory/defeat, loot, ads, cloud save, and scene transitions. PR 3 must keep the patch small and avoid unrelated cleanup.

Mitigation:

- Add isolated AP/preview helpers where possible.
- Touch `CombatScene` only for display and action gating in the future implementation PR.
- Keep end-condition and transition functions untouched.

### Preview must not duplicate combat math

Duplicating damage math in preview can desync from actual attack resolution.

Mitigation:

- Preview should use existing item stat ranges only when safe.
- Avoid rolling RNG in preview.
- Do not call mutating action methods to calculate preview.

### AP UI desync risk

AP pips can mislead the player if they do not match actual action availability.

Mitigation:

- Centralize AP cost lookup.
- Centralize disabled-reason checks.
- Test action availability and displayed AP cost together.

### Old outcomes must remain stable

PR 3 is not a rebalance PR. Current action outcomes must remain unchanged until later AP/intents/ammo/distance PRs intentionally change them.

Mitigation:

- Keep current smoke tests passing.
- Add preview-specific no-mutation tests.
- Avoid multi-action behavior changes unless explicitly accepted for PR 3.

## 7. Acceptance criteria for future PR 3

PR 3 can be accepted only if all are true:

- Player sees AP pips and a clear action preview.
- Player sees selected action cost.
- Disabled actions show an understandable reason.
- Old action outcomes are unchanged.
- Preview interaction does not mutate combat state.
- Current attack, cover, heal/no-heal, retreat, victory, and defeat smoke tests still pass.
- No console errors in normal smoke.
- Safety harness passes.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run test` passes.
- `npm run build` passes.

## 8. PR 3 implementation checklist

Before implementation starts:

- Confirm PR 1 safety harness is green.
- Confirm PR 2 combat adapter remains read-only and is not made runtime authority.
- Confirm no content or platform tasks are bundled into PR 3.

During implementation:

- Add AP helper tests first.
- Add preview/no-mutation tests before wiring UI.
- Keep UI labels concise for 1280×720 landscape.
- Avoid any save, loot, cloud, ad, or platform code path.

Before merge:

- Run full automated gates.
- Verify `git diff --name-status` contains only intended PR 3 files.
- Verify player-facing action outcomes remain stable against the safety harness.
