# M12.5 PR6c — Cover / Guard Chip Preflight

> Docs-only preflight. This document prepares the next runtime slice and does not implement cover/guard chips, change `CombatScene`, change cover behavior, change damage/AP/reload/movement behavior, or edit content/save/platform code.

## 1. Current State Snapshot

- The legacy cover button already exists in `CombatScene` as `УКРЫТИЕ`.
- The current cover action is covered by smoke tests and currently:
  - sets the sortie-level `cover_active` flag;
  - logs the existing cover message;
  - moves the scene into mob-resolution flow exactly like the legacy path;
  - is not a new AP economy action beyond the existing preview cost text.
- The distance chip already exists and defaults to `Дистанция: средне`.
- Movement affordances `БЛИЖЕ` / `ДАЛЬШЕ` are preview-only and must remain preview-only in PR6c.
- Ammo/reload/magazine/refund behavior is live from PR5:
  - reload mutates backpack only on successful reload;
  - ranged attack consumes runtime magazine;
  - scene exits refund loaded runtime magazines back to backpack.
- Enemy intent display is already visible and deterministic through the intent adapter, but PR6c must not change intent derivation.
- No suppression mechanic exists yet.
- `CombatEngine` is still not the runtime authority for `CombatScene`.

## 2. Goal

Add a small display/status chip over the existing cover behavior.

The future PR6c runtime slice should:

- show the current cover/guard state in the combat HUD;
- read the existing legacy cover flag/state first;
- avoid introducing new cover mechanics in the first slice;
- keep existing cover action behavior intact;
- avoid damage formula changes;
- avoid AP changes and AP consumption changes;
- avoid turn-loop, victory/defeat/retreat, loot/return, save, platform, content, and reload/refund changes.

## 3. Proposed UI Copy

Recommended first runtime slice: render a chip only when legacy cover is active.

- No cover: **no chip**.
  - Rationale: the combat HUD already has AP, ammo/magazine preview, distance, enemy intent, and seven action buttons. Hiding the inactive chip keeps the 1280×720 layout less crowded.
  - Alternative `Без укрытия` is acceptable only if layout smoke tests prove it does not crowd AP/ammo/intent previews.
- Cover active: `Укрытие`.
  - This should map directly to the existing legacy `cover_active` state.
- Guarded if mapped later: `Готовность`.
  - Do not introduce this in the first runtime slice unless a separate state model is approved.
- Exposed if added later: `Открыт`.
  - Do not implement exposed in PR6c; it belongs to a later scoped PR.

Recommendation: PR6c runtime should start with only the `Укрытие` chip mapped to the existing legacy cover state.

## 4. Mapping to Current Behavior

Current cover state appears to be the sortie-level `cover_active` flag used by `CombatScene`:

- scene create/reset clears `GameState.currentSortie.cover_active` for a new fight;
- `onHeroCover()` sets `cover_active = true` and queues mob resolution;
- mob damage calculation reads `cover_active` when defending the hero;
- retreat/scene-exit paths clear/refund as already implemented;
- enemy mob cover uses separate `MobRuntimeState.cover_active` for enemy-side UI/defense and should not be conflated with hero cover chip.

First runtime PR requirement:

- read existing `GameState.currentSortie?.cover_active` only;
- do not add a new scene-local hero cover state unless the current flag is impossible to display safely;
- do not rename or replace the `УКРЫТИЕ` action in the first slice;
- do not change existing cover log copy, turn transition, or damage calculation.

## 5. Duration / Clearing

The first PR must follow existing cover clearing rules.

- Do not invent a new duration model.
- Do not add “lasts N turns” semantics.
- Do not persist cover across scene recreation unless the current runtime already does so.
- Tests must document the current behavior:
  - initial combat has no cover chip;
  - after cover click, the chip appears while the existing flag is active;
  - the chip clears when the existing flag clears according to current scene flow.

If the current cover clearing behavior is ambiguous, stop and add/adjust tests first rather than changing mechanics.

## 6. Interaction Constraints

PR6c runtime must preserve existing neighboring systems:

- distance chip remains visible and unchanged;
- movement affordances remain preview-only;
- movement clicks still do not mutate distance/AP/state;
- AP preview text remains unchanged;
- reload action, magazine mutation, ranged attack magazine consumption, and refund-on-exit behavior remain unchanged;
- attack/reload/refund smoke tests remain green;
- enemy intent display remains deterministic and non-mutating;
- no suppression UI or suppression state is wired;
- no save/content/platform/lifecycle changes.

## 7. Future Runtime Test Plan

Required tests for the future PR6c runtime implementation:

1. Initial combat shows no cover chip, based on the recommended inactive-copy choice.
   - If runtime chooses `Без укрытия`, tests must assert that exact copy instead.
2. Clicking cover shows `Укрытие` while the existing `cover_active` state is true.
3. Cover chip clears according to existing cover behavior; tests must not assume a new duration.
4. Cover action still changes state/turn exactly as before:
   - `cover_active` behavior unchanged;
   - existing log copy unchanged;
   - state still advances to mob resolution as before.
5. AP preview remains unchanged.
6. Distance chip remains unchanged.
7. Movement affordances remain preview-only and do not mutate distance/AP/state.
8. Reload/attack/refund tests remain green.
9. Enemy intent tests remain green.
10. Victory/defeat/retreat lifecycle remains unchanged.
11. 1280×720 smoke/layout check verifies AP, ammo, distance, cover chip, intent, and buttons remain readable/tappable.

## 8. Risks

- Misunderstanding legacy cover duration and accidentally changing when defense applies.
- Hidden damage formula changes while adding a chip.
- UI overcrowding near AP, ammo/magazine preview, distance, movement affordances, and intent labels.
- Accidental AP integration or AP consumption for cover.
- Cover state leaking across scene exits or scene recreation.
- Confusing hero cover (`GameState.currentSortie.cover_active`) with enemy cover (`MobRuntimeState.cover_active`).
- Conflict with future exposed/suppression semantics if copy becomes too broad now.

## 9. No-Go Conditions

Stop PR6c runtime implementation if any of these become necessary:

- changing damage formulas;
- changing AP costs or consuming AP differently;
- changing save schema or cloud/local save persistence;
- migrating `CombatEngine` to runtime authority;
- changing content;
- changing ammo/reload/magazine/refund behavior;
- changing movement affordances from preview-only;
- breaking attack/reload/refund/movement preview smoke tests;
- overcrowding or unreadable UI at 1280×720.

## 10. Anti-Scope

Explicitly forbidden for PR6c runtime:

- no suppression implementation;
- no exposed implementation yet;
- no real movement;
- no AP consumption changes;
- no damage formula changes;
- no save/content/platform changes;
- no loot/return lifecycle changes;
- no `CombatEngine` migration;
- no enemy intent changes;
- no ammo/reload/refund changes;
- no cover action rename in the first slice.
