# M12.5 PR7b — Noise Preview Deltas Preflight

> Status: **docs-only preflight** for a future PR7b runtime split.
>
> This document does **not** implement noise helpers, does **not** change `CombatScene`, does **not** change runtime tests/content, and does **not** mark M12.5 accepted or release-ready.

## 1. Current PR7a state

Current PR7a state after the display-only noise chip slice:

- `CombatScene` owns scene-local `currentNoise = 0`.
- The combat HUD renders compact chip copy: `Шум: тихо`.
- Noise is display-only: no action mutates `currentNoise`.
- There are no action noise deltas yet.
- There is no `Шум +N` action preview copy yet.
- There is no firearm, reload, melee, movement, cover, medkit, or retreat noise application.
- There is no risk hook, sortie-risk modifier, reinforcement hook, or encounter director rewrite.
- PR5 ammo/reload/magazine/refund behavior remains the source of truth for ranged attack validity.
- PR6 movement remains preview-only and does not spend AP or change distance.

## 2. PR7b goal

PR7b should add **pure noise threshold / delta helpers** and **preview-only `Шум +N` copy**.

PR7b must still avoid runtime noise application:

- no `currentNoise` mutation;
- no committed firearm noise;
- no reload/melee/movement/cover/medkit/retreat noise application;
- no risk hook;
- no encounter director;
- no save/content/platform changes.

The goal is to let the player see potential noise implications before action noise becomes real in a later PR.

## 3. Helper proposal

Future helper module may be:

```text
src/systems/combatNoise.ts
```

Proposed pure functions:

```ts
getNoiseLevelLabel(noise: number): "тихо" | "слышно" | "опасно" | "шум критический";
getNoiseDeltaForAction(input): number;
formatNoiseDelta(delta: number): string;
```

Helper rules:

- Pure functions only.
- No `GameState` imports.
- No `CombatScene` imports.
- No content JSON imports unless separately approved in a later PR.
- Inputs must be plain and testable.
- Outputs must be deterministic.
- Helpers must not mutate weapon, backpack, magazine, actor, or scene state.

Suggested input shape for `getNoiseDeltaForAction(input)`:

```ts
type NoisePreviewAction =
  | "valid_firearm_shot"
  | "empty_magazine_fallback"
  | "melee"
  | "reload"
  | "cover"
  | "movement_preview"
  | "retreat"
  | "medkit";
```

The helper should receive already-derived action facts rather than deriving them from global state.

## 4. Delta rules proposal

Initial values are **tunable constants**, not final balance:

| Action | Suggested preview delta | Notes |
|---|---:|---|
| Valid firearm shot | `+2` | Default first value. Only show when magazine-shot planning says the shot is valid. |
| Empty-magazine weak fallback | `+0` | Must not be treated as firearm noise. |
| Melee | `+0` or `+1` | Prefer `+0` for first slice unless design wants melee to be audible. |
| Reload | `+0` | Initial PR7b should avoid implying reload has committed noise. |
| Cover | `+0` | Existing cover should stay quiet. |
| Preview-only movement | `+0` | Movement is not real yet. |
| Retreat | `+0` | Keep retreat preview simple until risk hooks are approved. |
| Medkit | `+0` | No broad item noise model in PR7b. |

Recommended first implementation default:

- `valid_firearm_shot` → `2`;
- every other listed action → `0`.

## 5. Critical PR5 interaction

Firearm noise preview must be tied to PR5 magazine validity.

Rules for future implementation:

- Show firearm `Шум +2` only when the same magazine-shot planning path says the shot is valid.
- Do **not** show firearm `Шум +2` for empty magazine fallback.
- Do **not** bypass `computeMagazineShotPlan` or equivalent validated magazine-shot facts.
- Do **not** duplicate attack logic unsafely inside the preview helper.
- Do **not** mutate backpack, magazine, refund state, or ammo reserve.
- Do **not** change reload/refund behavior.

Safe pattern:

1. `CombatScene` or a thin adapter determines whether the current attack preview is a valid magazine shot using existing PR5 ammo helpers.
2. It passes a plain action fact such as `valid_firearm_shot` or `empty_magazine_fallback` into the pure noise helper.
3. The helper returns a number for preview copy only.
4. `currentNoise` remains unchanged in PR7b.

## 6. Preview semantics

Future `updateActionPreview()` may show `Шум +N`, but only as non-committed preview copy.

Rules:

- Preview must not mutate `currentNoise`.
- Disabled actions must not show committed noise.
- Disabled attack because of no target / wrong state / unavailable weapon should not show firearm noise.
- Empty-magazine weak fallback should either show no delta or explicit `Шум +0`, depending on copy choice.
- No action applies noise in PR7b.
- Attack, reload, movement, cover, heal, retreat, victory, defeat, and refund flows must remain behaviorally unchanged.

## 7. UI placement / copy

Keep the existing chip unchanged:

```text
Шум: тихо
```

Add delta copy only into existing action preview text, not a new panel/modal.

Example for a valid loaded firearm shot:

```text
Атака 1 AP: цель Мародёр · Шум +2
```

Examples for fallback/disabled actions:

```text
Атака 1 AP: цель Мародёр · Шум +0
Атака 1 AP: действие недоступно
```

Copy constraints:

- Must fit in the existing action preview area at 1280×720.
- Must not obscure AP pips, ammo/magazine preview, distance chip, cover chip, noise chip, enemy intent, or seven-button action bar.
- Avoid noisy/long explanations in the HUD. Detailed explanation can wait for later UX polish.

## 8. Test plan for future runtime PR7b

Required future tests:

### Helper tests

- `getNoiseLevelLabel(0)` returns `тихо`.
- `getNoiseLevelLabel(3)` returns `слышно`.
- `getNoiseLevelLabel(6)` returns `опасно`.
- `getNoiseLevelLabel(9)` returns `шум критический`.
- `getNoiseDeltaForAction(valid_firearm_shot)` returns `2`.
- Empty-magazine fallback returns `0`.
- Melee/reload/cover/movement/retreat/medkit return chosen initial values.
- `formatNoiseDelta(2)` returns `Шум +2`.
- `formatNoiseDelta(0)` returns `Шум +0` or empty string, according to chosen copy.
- Helpers are pure and do not mutate inputs.

### Scene smoke / preview tests

- Loaded PM attack preview shows `Шум +2` only when magazine shot is valid.
- Empty-magazine ranged attack preview does not show firearm delta.
- Reload preview shows `Шум +0` or no delta according to chosen copy.
- Movement preview remains `Шум +0` or no delta and remains preview-only.
- `updateActionPreview()` does not mutate `currentNoise`.
- Attack/reload/movement/cover still do not mutate `currentNoise` in PR7b.
- Existing reload/refund tests remain green.
- Existing intent/AP/distance/cover/noise chip tests remain green.
- Victory/defeat/retreat lifecycle remains unchanged.
- No console errors in smoke tests.

## 9. Anti-scope

Explicitly out of scope for PR7b:

- `currentNoise` mutation;
- committed firearm noise;
- committed reload/melee/movement/cover/medkit/retreat noise;
- risk hook;
- encounter director;
- reinforcement/spawn system;
- save/cloud/local persistence changes;
- content mass edits or new content schema;
- AP changes;
- movement changes;
- suppression implementation;
- damage changes;
- ammo/reload/magazine/refund behavior changes;
- loot/return lifecycle changes;
- Yandex/platform/ads/IAP changes;
- `CombatEngine` runtime-authority migration.

## 10. No-go conditions

Stop PR7b implementation if:

- preview requires runtime mutation;
- preview cannot determine valid firearm shot without duplicating attack logic unsafely;
- implementation wants content schema changes;
- UI becomes unreadable at 1280×720;
- helper needs `GameState`;
- helper needs direct content JSON imports;
- preview risks changing backpack/magazine/refund semantics;
- tests cannot prove `currentNoise` remains unchanged.

## Recommended PR7b implementation split

1. **PR7b.1 — pure helper + tests**
   - Add `combatNoise.ts` with thresholds, action deltas, formatting.
   - No `CombatScene` wiring.

2. **PR7b.2 — attack preview wiring**
   - Show `Шум +2` for valid loaded firearm attack preview only.
   - Empty-magazine fallback shows no firearm delta.
   - No noise mutation.

3. **PR7b.3 — hardening**
   - Add scene smoke coverage for no mutation across refresh, reload, movement, cover, attack, fallback, and lifecycle.
