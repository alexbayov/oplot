# M12.5 Combat Reformat — Implementation Plan

> Status: **implementation plan only**. This file does not mark M12.5 accepted and does not change runtime behavior.
>
> Source spec: `docs/combat/COMBAT-REFORMAT-M12-5.md`.
>
> Release rule: each PR must be small, reviewable, and independently revertible. Do not touch Yandex SDK, ads/IAP, cloud save, loot/return lifecycle, or save migrations unless a later owner-approved risk PR explicitly requires it.

## Current architecture snapshot

- Current player-facing combat is centered in `src/scenes/CombatScene.ts`, which owns Phaser UI, hero buttons, turn queue, mob turns, hero attack/cover/heal/retreat actions, XP/loot/return transitions, second-chance ads, cloud-save calls, and combat logging.
- Existing low-level combat math lives in `src/systems/combat.ts` and should remain the baseline for early parity tests.
- `src/systems/combatEngine.ts` and `src/systems/combatTypes.ts` already provide a future engine/state shape, but they are not yet the runtime source of truth for the scene.
- `src/systems/mobAI.ts` owns current behavior choices and mutable `MobRuntimeState` fields such as HP, cover, turn count, berserk, flee, and boss phase.
- Durability, mod effects, ItemRegistry, and skill tree state exist, but combat currently has mismatches between legacy scene behavior and the newer engine/item model.
- Content sources are `content/mobs.json` and `content/items.json`; M12.5 should add contract coverage before changing combat semantics.

## Global rules for all PRs

- Keep `CombatScene` end lifecycle intact until M12.5 acceptance: victory → loot, defeat/second-chance, retreat/return, XP, radio, cloud-save calls, and existing scene transitions are not part of this reformat.
- Keep platform and monetization code untouched: no Yandex SDK, ads/IAP, banner, cloud save, or telemetry hardening inside M12.5 implementation PRs unless telemetry events are explicitly scoped in a later instrumentation PR.
- Keep content changes minimal and only after content contract tests are in place.
- Do not create feature flags in the plan/safety PR. If a later implementation PR needs a rollback switch, introduce it in that PR with tests and owner approval.
- Do not mark M12.5 accepted until automated gates and first-10-minutes manual QA pass.

## PR 1 — Combat safety harness

### Goal

Create test coverage around the current combat runtime before any gameplay change. This PR must make regressions visible without changing combat behavior.

### Files likely touched

- `src/scenes/__tests__/CombatScene.smoke.test.ts` or equivalent scene harness location.
- `src/systems/__tests__/combat*.test.ts` only for additive coverage if the smoke harness needs shared fixtures.
- `src/state/__tests__/contentIntegration.test.ts` or a new content contract test file.
- Test helpers/fixtures only, if needed.

### Explicit anti-scope

- No gameplay logic changes.
- No `CombatScene` behavior changes except test-only seams if absolutely unavoidable.
- No runtime code refactor, no AP, no intents, no UI redesign.
- No content edits.
- No feature flags.

### Dependencies

- None. This is the first required PR.

### Implementation notes

- Build a seeded combat fixture using existing `GameState.currentSortie`, loaded mobs, and loaded items.
- Cover the actual current scene path, not only `CombatEngine` unit behavior.
- Prefer deterministic RNG/test seams already used in systems tests. If Phaser scene testing is too costly, start with a thin scene smoke harness that validates state transitions and button callbacks around the current scene.
- Add content contract assertions before content-driven combat changes: mob IDs referenced by encounters resolve, mob behavior IDs are known, weapon/ammo references resolve, and weapon-sensitive display names remain generic by default.

### Tests

- Scene smoke: boot a seeded `CombatScene`, render initial hero/enemy/log/action state, execute attack, cover, heal/no-heal, and retreat paths without uncaught errors.
- Current lifecycle smoke: victory reaches the existing loot/next-flow hook; defeat/second-chance path remains reachable without platform changes.
- Content contracts: mobs resolve, behavior IDs are supported by current/future intent mapping, ranged weapons have ammo/caliber-compatible data or documented fallback, and default names are release-safe.

### Acceptance criteria

- Existing runtime behavior is unchanged.
- New tests fail if current attack/cover/retreat/victory/defeat scene flow is broken.
- Content contract tests exist for combat-relevant mobs/items.
- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass.

### Rollback strategy

Revert the PR. Because it is tests-only, rollback should not affect runtime or saves.

### Risk level

Low. Main risk is brittle Phaser scene tests; mitigate by keeping smoke tests focused on stable outcomes, not exact pixel layout.

## PR 2 — Combat state adapter

### Goal

Add an adapter from current runtime state into `CombatState` without making `CombatEngine` the scene authority yet.

### Files likely touched

- New `src/systems/combatAdapter.ts` or similar.
- `src/systems/__tests__/combatAdapter.test.ts`.
- Type-only imports from `src/systems/combatTypes.ts`, `src/systems/mobAI.ts`, `src/state/GameState.ts`, and `src/state/ItemRegistry.ts`.

### Explicit anti-scope

- No UI changes.
- No turn-resolution changes.
- No loot/return lifecycle changes.
- No save migration.
- No changes to `content/mobs.json` or `content/items.json`.

### Dependencies

- PR 1 safety harness merged and green.

### Implementation notes

- Convert `GameState.currentSortie` plus current `MobRuntimeState[]` into a `CombatState` snapshot.
- Preserve legacy identifiers: actor IDs should be stable and traceable back to scene mob indexes and player state.
- Preserve current defaults: position can start as `medium`, statuses empty, cooldowns empty, telegraph null, environment empty.
- Do not mutate `GameState` inside the adapter. It should be pure or clearly side-effect-free.
- Provide reverse-mapping helpers only if needed by later PRs; do not wire them into scene resolution yet.

### Tests

- Adapter creates one hero actor and expected mob actors from a seeded sortie.
- Actor HP, max HP, names, cover flags, phase, equipped weapon/magazine defaults, zone ID, and scenario are mapped predictably.
- Missing optional data fails soft with a useful adapter result/error, not an uncaught exception.

### Acceptance criteria

- `CombatState` can be built from current combat runtime without changing player-facing behavior.
- Adapter tests document every temporary default used by M12.5.
- Existing scene smoke tests still pass.

### Rollback strategy

Revert adapter and tests. Since it is not wired as runtime authority, rollback has no gameplay impact.

### Risk level

Low to medium. Risk is introducing a misleading duplicate state; mitigate by documenting that adapter output is read-only until later PRs explicitly wire one action path.

## PR 3 — AP model + action preview

### Goal

Introduce the 3 AP turn budget and preview-only UI shell while conservatively mapping existing actions.

### Files likely touched

- `src/systems/combatEngine.ts` and/or a new AP helper module.
- `src/systems/combatTypes.ts` for AP/preview types if needed.
- `src/scenes/CombatScene.ts` for display-only AP pips and preview panel.
- New/updated engine and scene smoke tests.

### Explicit anti-scope

- No enemy intent display yet.
- No ammo/reload canonicalization yet.
- No distance/cover/suppression rewrite.
- No changes to victory/defeat/loot/return paths.
- No balance/content retuning beyond action cost constants.

### Dependencies

- PR 1 tests and PR 2 adapter.

### Implementation notes

- Start with a small AP model: default 3 AP, action costs documented by the spec.
- Preview panel should be safe and conservative: AP cost, current target, rough damage range if already available, and clear disabled reasons.
- Initially map old actions without changing outcomes: attack consumes the planned AP in the new UI state but should preserve old damage/ammo behavior until PR 5.
- Keep action resolution single-source for current behavior. Avoid duplicating damage math in preview; previews may be approximate and labeled as such until engine migration.

### Tests

- Unit tests for AP cost lookup and insufficient-AP reasons.
- Scene smoke: AP pips render, preview updates for attack/cover/heal/retreat, disabled action explains no AP.
- Existing attack/cover/retreat outcomes remain compatible with PR 1 smoke expectations.

### Acceptance criteria

- Player can see AP and action preview before committing.
- Existing action outcomes do not unexpectedly change.
- No console errors in scene smoke.
- Automated gates pass.

### Rollback strategy

Revert AP UI/model PR. Because end lifecycle and content remain unchanged, rollback returns to the previous action bar.

### Risk level

Medium. `CombatScene` is a god-object; mitigate with minimal UI insertion and no lifecycle rewrites.

## PR 4 — Enemy intent display

### Goal

Map existing mob AI behavior to visible player-facing intents and display those intents on enemy cards before player action.

### Files likely touched

- `src/systems/mobAI.ts` or new `src/systems/combatIntents.ts` adapter.
- `src/systems/combatTypes.ts` for intent types if current `TelegraphIntent` is insufficient.
- `src/scenes/CombatScene.ts` for enemy card/intent display.
- Tests for intent mapping and scene rendering.

### Explicit anti-scope

- No new mob behaviors yet.
- No loot/return changes.
- No boss overhaul.
- No AP cost rebalance beyond what PR 3 established.
- No content mass rename.

### Dependencies

- PR 1 safety harness.
- PR 3 preview shell is preferred so intents can feed preview text.

### Implementation notes

- Start as an adapter over current `chooseMobActionV2` behavior, not a new AI system.
- Map current actions/behavior IDs to spec intents: attack, flee, guard/cover, aim/ranged danger, rush for animal/rusher-like behavior where supported, suppress/special only if current content can justify it.
- Intent should be stable once shown for the turn unless the player changes conditions in a documented way.
- Keep current mob turn resolution intact until later PRs intentionally consume intent output.

### Tests

- Unit tests mapping behavior IDs and archetypes to visible intents.
- Scene smoke: each enemy card shows intent label/icon/text before hero action.
- Regression: current mob damage/flee/cover flow remains unchanged where intent is display-only.

### Acceptance criteria

- Player sees enemy intent before choosing an action.
- Intent labels are concise and deterministic for seeded combat.
- Existing mobAI behavior tests still pass.
- No loot/return/platform changes.

### Rollback strategy

Revert intent display/mapping PR. Combat falls back to AP/action preview without visible enemy intents.

### Risk level

Medium. Risk is AI double-evaluation mutating `MobRuntimeState`; mitigate by making intent derivation pure or by introducing a non-mutating preview function separate from `chooseMobActionV2`.

## PR 5 — Ammo/reload canonicalization

### Goal

Unify ranged combat around magazine + backpack ammo by caliber, reload AP, and clear empty-magazine behavior.

### Files likely touched

- `src/systems/combatEngine.ts`.
- `src/systems/combatTypes.ts` for ammo/reload request/result fields if needed.
- `src/scenes/CombatScene.ts` for weapon panel, reload action, and disabled reasons.
- `src/state/ItemRegistry.ts` only if read-only helpers are needed for caliber/magazine lookup.
- Tests for ammo/reload behavior.

### Explicit anti-scope

- No content rewrite or mass item rename.
- No save migration unless separately approved as a dedicated risk.
- No cloud/local save changes.
- No durability break consequences beyond preserving existing behavior until PR 8 or a dedicated durability PR.

### Dependencies

- PR 1 safety harness.
- PR 2 adapter.
- PR 3 AP model.

### Implementation notes

- Canonical rule: firing consumes magazine; reload consumes compatible backpack ammo by caliber and costs AP.
- Define fallback for empty magazine: block ranged action with a clear reason or allow explicitly labeled weak butt/desperate melee if the owner chooses that route.
- Keep legacy inventory stack manipulation localized and tested.
- Add a temporary compatibility path for legacy ranged items that still use `ammo_id`/`ammo_per_shot`, mapping them to caliber/reserve ammo without content churn.

### Tests

- Magazine decreases on shot.
- Reload consumes backpack ammo by caliber and fills up to magazine cap.
- Partial reload works when reserve ammo is insufficient.
- Empty magazine blocks ranged attack or triggers the chosen weak fallback.
- Wrong/missing caliber fails gracefully with UI reason.
- Scene smoke covers attack → reload → attack.

### Acceptance criteria

- Ammo and reload are understandable in UI and deterministic in tests.
- Existing backpack ammo is not silently lost or duplicated.
- No save corruption or migration requirement is introduced.
- Automated gates pass.

### Rollback strategy

Revert ammo PR. Because content IDs and save schema are unchanged, rollback returns to legacy backpack-per-shot behavior.

### Risk level

High. This changes core combat resources and bridges legacy item data with M11 weapon instances. Mitigate with focused tests and no unrelated combat balance changes.

## PR 6 — Cover/suppression/distance bands

### Goal

Introduce close/medium/far distance and simple guarded/in cover/exposed/suppressed states without grid tactics.

### Files likely touched

- `src/systems/combatTypes.ts` for distance/status state shape if needed.
- `src/systems/combatEngine.ts` or dedicated resolver helpers.
- `src/systems/mobAI.ts` or intent adapter only if existing behaviors need distance-aware mapping.
- `src/scenes/CombatScene.ts` for chips/indicators and action availability.
- Tests for distance and cover state transitions.

### Explicit anti-scope

- No grid/pathfinding/geometry.
- No boss overhaul.
- No large encounter system changes.
- No loot/return lifecycle changes.
- No new skill tree branch.

### Dependencies

- PR 3 AP model.
- PR 4 intent display.
- PR 5 ammo/reload is recommended before suppression consumes ammo.

### Implementation notes

- Distance changes one band per move action and costs 1 AP.
- Cover and guard remain binary/short-duration states. Avoid terrain geometry.
- Suppression should have a narrow first implementation: cancel or weaken `aim/rush`, reduce AP/options briefly, and be visible.
- Preserve current `cover_active` semantics through adapter shims until new states own the behavior.

### Tests

- Unit tests for distance modifiers by weapon archetype.
- Guarded/in cover/exposed/suppressed transition tests.
- Scene smoke: move changes distance chip; cover/guard changes defense preview; suppression changes enemy/player options without soft-locks.
- Existing mobAI cover behavior still maps correctly.

### Acceptance criteria

- Player can see distance and cover/suppression states.
- States have clear duration/clearing rules.
- No grid-like behavior is introduced.
- Automated gates pass.

### Rollback strategy

Revert this PR. AP, intents, and ammo/reload can remain if they were merged separately.

### Risk level

High. This changes tactical decision semantics and UI density. Mitigate by keeping states simple and visible.

## PR 7 — Noise meter

### Goal

Add a visible noise meter with simple thresholds and a minimal combat/sortie-risk hook.

### Files likely touched

- New `src/systems/combatNoise.ts` or similar.
- `src/systems/combatEngine.ts` for action noise deltas if engine owns the action.
- `src/scenes/CombatScene.ts` for meter and preview deltas.
- Existing sortie/encounter code only if the minimal hook is owner-approved and isolated.
- Tests for thresholds and hook behavior.

### Explicit anti-scope

- No new large encounter director.
- No rewrite of sortie generation or loot/return lifecycle.
- No Yandex/platform changes.
- No content mass retuning.

### Dependencies

- PR 3 preview shell.
- PR 5 ammo/reload for firearm noise accuracy.
- PR 6 distance/suppression if suppress noise is included.

### Implementation notes

- Start with deterministic thresholds: Quiet, Heard, Dangerous, Overrun.
- Action preview shows noise delta before confirmation.
- Minimal risk hook should be easy to explain and revert, e.g. retreat risk modifier or next-fight modifier flag. Do not create a new reinforcement system unless split into a later PR.
- Ensure quiet/melee/guard actions can keep noise low so the meter creates decisions, not inevitable punishment.

### Tests

- Unit tests for noise delta by action/archetype.
- Threshold transition tests.
- Preview tests: action shows expected noise delta.
- Minimal hook tests: high noise affects the selected risk field and low noise does not.
- Scene smoke: meter renders and updates without console errors.

### Acceptance criteria

- Noise is visible, previewed, and affects at least one documented risk.
- Noise does not rewrite the sortie loop.
- Player can understand threshold changes through UI/log text.
- Automated gates pass.

### Rollback strategy

Revert noise PR. Previous combat behavior remains intact because the hook is isolated and small.

### Risk level

Medium to high. Risk is scope creep into encounter generation; mitigate by using one minimal hook and deferring broader systems.

## PR 8 — Status effects + skill adapter

### Goal

Implement visible minimal statuses and integrate existing passive skill effects through explicit adapters, without a skill tree overhaul.

### Files likely touched

- `src/systems/combatEngine.ts` and/or new status resolver helpers.
- `src/systems/combatTypes.ts` for status metadata if current shape is insufficient.
- `src/systems/perks.ts` or a new combat skill adapter if needed.
- `src/state/SkillTree.ts` only for read-only integration helpers, not tree redesign.
- `src/scenes/CombatScene.ts` for status chips/tooltips.
- Tests for statuses and skill adapters.

### Explicit anti-scope

- No new skill tree branch.
- No progression overhaul.
- No save migration unless absolutely required and separately approved.
- No hidden status modifiers without UI.
- No boss overhaul.

### Dependencies

- PR 3 AP/preview.
- PR 4 intents.
- PR 6 cover/suppression/distance for shared status vocabulary.

### Implementation notes

- Implement only visible statuses from the design spec: bleed, stun, exposed, suppressed, guarded, wounded, jammed.
- Each status needs duration, effect, display text/icon, and test expectation.
- Skill adapter should read existing unlocked skills/perks and expose explicit combat modifiers to preview/resolution.
- Keep one tactical perk example small and testable if owner approves; otherwise wire only existing passives.

### Tests

- Unit tests for every status tick/effect/expiry.
- Engine tests for status application and resolution order.
- Skill adapter tests for passive modifiers and one once-per-combat tactical effect if implemented.
- Scene smoke: status chips render and previews mention relevant status/skill effects.

### Acceptance criteria

- Statuses are visible, previewable, and deterministic.
- Skill effects that affect combat are visible in previews/logs.
- Existing skill tree data is not redesigned.
- Automated gates pass.

### Rollback strategy

Revert status/skill PR. Earlier AP/intent/ammo/cover changes remain reviewable separately.

### Risk level

High. Statuses can create hidden complexity and save pressure. Mitigate with combat-local duration rules and no persistence changes unless separately approved.

## PR 9 — First 10 minutes polish + QA gate

### Goal

Tune the first 1–3 fights and mobile landscape UI so the new combat hook is understandable, then document QA evidence without marking accepted prematurely.

### Files likely touched

- `src/scenes/CombatScene.ts` for layout polish and text clarity.
- Small balance constants only if test/QA evidence supports them.
- Minimal combat content tuning only if required and covered by content contract tests.
- `staff/status/M11-M12.md` or M12.5 QA artifact for evidence updates.
- `docs/combat/COMBAT-REFORMAT-M12-5.md` only if implementation discoveries require spec clarification.

### Explicit anti-scope

- No new combat systems.
- No platform/Yandex SDK, ads/IAP, cloud save, or loot/return lifecycle changes.
- No boss overhaul.
- No mass content rename.
- Do not mark M12.5 accepted without real QA PASS evidence.

### Dependencies

- PRs 1–8 merged and green, or explicitly scoped down by owner decision.

### Implementation notes

- Focus on the first 10 minutes: intent comprehension, AP readability, ammo/reload clarity, cover/suppression clarity, noise warning, and retreat affordance.
- Mobile landscape 1280×720 is the target. Avoid tooltip-only critical information.
- Keep fights short and readable; prefer wording/layout fixes over deeper mechanics at this stage.
- Record QA evidence separately from implementation commits.

### Tests

- Scene smoke at 1280×720 for first-fight layout.
- Regression tests from PR 1 remain green.
- Content contract tests still pass after any small tuning.
- Manual QA checklist: first 1–3 fights recorded, no `console.error`, no blocker UX issue, clear player lessons.

### Acceptance criteria

- First 10 minutes teach intent, AP, ammo/reload, cover, noise, and retreat.
- No blocker UX issue on mobile landscape.
- No console errors in normal smoke.
- Automated gates pass.
- Manual QA evidence is recorded as PASS before any release/GO claim.

### Rollback strategy

Revert polish/tuning PR. If implementation PRs remain stable, only first-10-minutes tuning/layout is rolled back.

### Risk level

Medium. Most systems are already in place, but late tuning can destabilize UX/content. Mitigate with small changes and QA evidence.

## Cross-PR risk register

| Risk | Level | Mitigation |
|---|---|---|
| `CombatScene` regression | High | PR 1 smoke harness first; no end-lifecycle rewrite. |
| Duplicate state divergence between scene and engine | High | PR 2 adapter is read-only; wire one action path at a time later. |
| Ammo/reload corrupts inventory expectations | High | Tests for magazine, reserve ammo, partial reload, empty magazine, and no duplication/loss. |
| Status effects become hidden complexity | High | Visible chips, previews, duration tests, and no hidden modifiers. |
| Noise scope creeps into encounter rewrite | Medium/High | One minimal risk hook; defer large systems. |
| Mobile UI overcrowding | Medium/High | 1280×720 smoke tests and first-10-minutes QA. |
| Save migration pressure | Medium | Avoid persistent schema changes unless separately approved. |
| Boss overhaul temptation | Medium | Boss/miniboss only future-compatible; no overhaul. |

## Final M12.5 acceptance gate

M12.5 remains **not accepted** until all are true:

- All PR-level automated tests pass.
- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` are green.
- Scene smoke covers normal combat, victory, defeat/second-chance, reload, retreat, and first-fight layout.
- Content contracts pass for combat mobs/items.
- First-10-minutes manual QA has PASS evidence.
- No `console.error` appears in normal smoke.
- Loot/return lifecycle, cloud save, Yandex SDK, ads/IAP, and release-safe naming remain intact.
