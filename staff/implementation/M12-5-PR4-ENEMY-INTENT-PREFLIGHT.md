# M12.5 PR 4 Preflight — Enemy Intent Display

> Status: docs-only preflight for the future PR 4 implementation.
>
> This document does **not** implement enemy intents, does **not** change runtime behavior, does **not** modify `CombatScene`, and does **not** modify `mobAI` or combat content.

## 1. Current mob action / AI path

Current player-facing mob behavior is still resolved inside `src/scenes/CombatScene.ts` through the legacy scene turn loop.

### Where mob decisions are made now

- `CombatScene.advanceTurn()` pops the next initiative entry from `turnQueue`.
- When the entry is a mob, `CombatScene.runMobTurn(mobIndex)` is called.
- `runMobTurn()` builds the current AI context and calls `chooseMobActionV2()` from `src/systems/mobAI.ts`.
- `chooseMobActionV2()` returns the current executable mob action: `attack`, `cover`, or `flee`.
- `CombatScene` immediately applies the returned outcome:
  - `flee` sets `inst.state.fled = true`, logs escape, updates display, and advances the turn later;
  - `cover` logs cover, updates display, and advances the turn later;
  - `attack` computes armor/cover/perk defense, calls the existing damage formula, mutates player HP, logs damage, runs hit feedback, updates display, and advances the turn later.

### Functions currently involved

- `createMobRuntimeState(mob)` initializes mutable per-fight mob state.
- `computePhaseTransition(mob, runtimeState)` checks boss phase transitions.
- `chooseMobActionV2(ctx)` dispatches mob behavior based on current runtime state, `behavior_id`, phase behavior, allies, and hero equipment.
- `maybeTriggerBerserk(state)` is internal to `mobAI` and mutates berserker stats once when HP is low.

### Mutable fields in `MobRuntimeState`

`MobRuntimeState` is not a pure snapshot. Existing AI selection can mutate it. Future intent preview code must account for these fields:

- `hp`, `hp_max`;
- `damage_min`, `damage_max`;
- `base_speed`;
- `fled`;
- `turn_count`;
- `berserk_triggered`;
- `cover_active`;
- `phase`;
- `phase_transition_done`.

Important: `chooseMobActionV2()` currently mutates `turn_count`, boss phase fields, `cover_active`, and berserker-related stats in some paths. PR 4 must not call it for preview unless a dedicated non-mutating clone/snapshot strategy is used and tested.

### Current executable mob outcomes

Only these outcomes are runtime-authoritative today:

- `attack` — damage is applied in `CombatScene.runMobTurn()` using existing combat math.
- `cover` — current mob cover behavior is logged and turn advances.
- `flee` — current mob is marked fled and turn advances.

PR 4 must display intent before player action, but must not change which outcome the mob later executes.

## 2. Proposed visible intent model for PR 4

PR 4 should add visible/display-only intent previews. These are UI labels/icons/cards, not new AI actions.

| Intent | Player-facing meaning | Runtime behavior in PR 4 |
|---|---|---|
| `attack` | Enemy is likely to attack normally. | Display-only; existing AI still decides actual action. |
| `aim` | Enemy is preparing a stronger or more accurate ranged hit. | Display-only warning if safely inferred from existing data. |
| `rush` | Enemy is pressuring the player or likely to close/attack. | Display-only, no distance mechanics yet. |
| `guard/cover` | Enemy is likely defensive or cover-oriented. | Display-only mapping for cover-like behavior. |
| `reload` | Enemy needs/uses reload cadence. | Future-compatible placeholder only; do not implement reload logic in PR 4. |
| `suppress` | Enemy threatens suppression/pressure. | Future-compatible placeholder only; do not implement suppression. |
| `special` | Enemy has boss/special/unknown behavior worth warning about. | Display-only fallback, no boss overhaul. |
| `flee` | Enemy is likely to flee or has fled. | Display-only warning/fled label; existing flee logic remains authoritative. |

The UI copy should be short enough for 1280×720 landscape and should not compete with the AP preview line.

## 3. Mapping strategy

PR 4 should map current content/runtime signals into visible intents with conservative, deterministic rules.

### Safe baseline mappings

- Legacy/default aggressive mobs with no `behavior_id` → `attack`.
- `behavior: "aggressive"` → `attack` unless a stronger specific rule applies.
- `behavior: "defensive"` or `behavior_id: "defensive_cover"` → `guard/cover`.
- `state.fled === true` → `flee`.
- Marauder below the current legacy flee threshold may display `flee` only if this can be derived without calling mutating AI.
- `behavior_id: "ranged_keep_distance"` → `aim` or `attack` with ranged warning copy.
- `behavior_id: "armor_piercing_ranged"` → `aim` or `special` with armor-piercing warning copy if the wording is concise.
- `behavior_id: "pack_bonus_when_paired"` → `rush` or `attack` with pack pressure warning, based on alive allies if available as read-only input.
- `behavior_id: "berserker_low_hp"` → `rush` or `special`, especially if HP is below the current berserk threshold.
- Boss `phase` / `phase_2_behavior_id` → `special` only as display-compatible warning; no boss overhaul.
- Unknown `behavior_id` → `special` with safe generic label, or `attack` if product wants less alarm.

### Mapping principles

- Prefer being slightly vague over promising an exact next action that the runtime may not execute.
- Do not use intent mapping to rebalance mobs.
- Do not add or edit content behavior IDs.
- Do not make the visible intent runtime-authoritative in PR 4.
- If a rule depends on mutable cadence such as `turn_count`, derive only from the provided read-only snapshot and document possible mismatch.

## 4. Pure adapter requirement

Future PR 4 should introduce a pure/non-mutating adapter such as:

```ts
export interface CombatIntentPreview {
  readonly intent: "attack" | "aim" | "rush" | "guard_cover" | "reload" | "suppress" | "special" | "flee";
  readonly labelRu: string;
  readonly detailRu?: string;
  readonly confidence: "known" | "likely" | "fallback";
}

export const deriveVisibleEnemyIntent = (input: CombatIntentPreviewInput): CombatIntentPreview => {
  // pure mapping only
};
```

Requirements:

- Must not call `chooseMobActionV2()` directly on live `MobRuntimeState`.
- Must not mutate `turn_count`, `cover_active`, `berserk_triggered`, boss `phase`, damage, speed, HP, or fled state.
- Must accept explicit read-only input: mob content, mob runtime snapshot, allies snapshot if needed, hero weapon type if needed.
- Must return safe fallback labels for unknown or incomplete data.
- Must be unit-tested for no mutation using deep-cloned before/after objects.

If future implementation needs exact parity with `chooseMobActionV2()`, it should either:

1. add a dedicated pure planning function in a separate PR; or
2. run `chooseMobActionV2()` only against cloned state and document that preview is still approximate.

Option 1 is safer. Option 2 is acceptable only if tests prove source state is unchanged and copy text says “likely”.

## 5. CombatScene UI scope for PR 4

Allowed UI scope:

- Add enemy intent text/icon/card near each enemy card or enemy HP row.
- Keep copy compact, for example:
  - `Намерение: атака`;
  - `Намерение: укрытие`;
  - `Намерение: может сбежать`;
  - `Намерение: особое`.
- Reuse existing enemy panel/card area where possible.
- Keep AP preview readable; do not overcrowd the bottom action bar.

Forbidden UI/runtime changes:

- Do not change mob action resolution.
- Do not change damage formulas.
- Do not change turn order or initiative.
- Do not change AP costs, AP display, or AP consumption.
- Do not change victory/defeat/loot/return lifecycle.
- Do not change content.
- Do not wire `CombatEngine` as runtime source of truth.

## 6. Tests required for PR 4

### Unit tests

- Intent mapping for every currently supported `behavior_id`:
  - no `behavior_id` / aggressive fallback;
  - `ranged_keep_distance`;
  - `defensive_cover`;
  - `berserker_low_hp`;
  - `pack_bonus_when_paired`;
  - `armor_piercing_ranged`.
- Unknown behavior fallback produces a stable safe label.
- Fled state maps to visible `flee`.
- Boss/phase-compatible input maps to `special` without changing boss state.
- Adapter does not mutate `MobRuntimeState` or mob content.

### Scene smoke tests

- Seeded `CombatScene` renders enemy intent text for the current mob.
- Existing attack smoke still passes.
- Existing cover smoke still passes.
- Existing heal/no-heal smoke still passes.
- Existing retreat smoke still passes.
- Existing victory/defeat lifecycle smoke still passes.
- AP preview tests from PR 3/3.1 still pass.

### Content contract tests

- Every behavior ID in `content/mobs.json` maps to an intent or explicit fallback.
- Phase 2 behavior IDs map to an intent or explicit fallback.
- No content edits are required for PR 4 acceptance.

## 7. Risks

### Double-evaluating AI and mutating state

Calling current AI selection for preview can increment `turn_count`, trigger berserk, set cover, or transition boss phase before the actual mob turn.

Mitigation: use a pure intent adapter and no-mutation tests.

### Intent does not match actual mob action

Visible intent can mislead the player if it promises an exact action while current runtime AI later chooses another action due to cadence, HP thresholds, phase changes, or alive allies.

Mitigation: use “likely” copy when intent is derived from behavior rather than an already-decided action.

### UI overcrowding near AP preview

AP preview already uses action-bar-adjacent text. Enemy intent must not turn the combat screen into dense debug output.

Mitigation: place compact labels near enemy cards/HP rows and avoid multi-line paragraphs.

### Boss/special scope creep

Boss phase behavior can tempt a boss overhaul.

Mitigation: map boss/special only to display-compatible warning labels in PR 4.

### Content behavior IDs not mapped

Future content can introduce unknown `behavior_id` values.

Mitigation: add a content contract fallback test and safe `special` or `attack` fallback label.

## 8. Acceptance criteria for future PR 4

PR 4 can be accepted only if all are true:

- Enemy intent is visible before player action.
- Current mob behavior outcomes are unchanged.
- Intent adapter is pure/non-mutating.
- Existing attack/cover/heal/retreat/victory/defeat smoke tests still pass.
- AP preview tests still pass.
- No lifecycle/platform/save/content changes are included.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run test` passes.
- `npm run build` passes.

## 9. Anti-scope

PR 4 must not include:

- New mob AI.
- Behavior retuning.
- Content edits.
- Boss overhaul.
- Ammo/reload canonicalization.
- Distance bands.
- Noise meter or sortie-risk hooks.
- Status effects or status overhaul.
- AP consumption.
- Damage formula changes.
- Turn-loop changes.
- Loot/return lifecycle changes.
- Yandex/platform/cloud save/ads/IAP changes.
- Save migration.
- `CombatEngine` runtime authority switch.

## Recommended PR 4 implementation checklist

Before implementation:

- Confirm PR 3/3.1 AP preview tests are green.
- Confirm content behavior IDs are known or covered by fallback.
- Decide concise Russian labels for each visible intent.

During implementation:

- Add pure intent adapter and unit tests first.
- Add no-mutation tests before any `CombatScene` rendering.
- Add scene smoke assertion for intent text.
- Keep the actual mob action path untouched.

Before merge:

- Verify `git diff --name-status origin/main...HEAD` contains only intended PR 4 files.
- Run full automated gates.
- Confirm player-facing combat outcomes remain stable against the safety harness.
