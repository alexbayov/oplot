# M12.5 PR7 — Noise HUD / Preview Layer Closeout

> Status: **docs-only closeout** for the current PR7 noise HUD / preview layer.
>
> This document does **not** mark M12.5 accepted, does **not** imply release readiness, and does **not** claim that noise mutates gameplay state or affects sortie risk.

## 1. Status

The current PR7 block has implemented the noise HUD / preview layer only.

Implemented:

- The compact noise chip `Шум: тихо` is visible in combat.
- `CombatScene` has scene-local `currentNoise`, which defaults to `0`.
- `src/systems/combatNoise.ts` exists as a pure helper for threshold labels, preview deltas, and delta formatting.
- Valid loaded firearm attack preview can show `Атака 1 AP: цель <enemy> · Шум +2`.
- Empty-magazine fallback does not show firearm `Шум +2`.
- Disabled attack does not show firearm `Шум +2`.
- Melee, reload, movement preview, and cover do not show firearm `Шум +2`.

Not implemented:

- `currentNoise` does not mutate during actual gameplay yet.
- There is no real noise accumulation after shots.
- There is no threshold progression in runtime combat.
- There is no sortie-risk hook.
- There is no encounter director or reinforcement system.
- There is no save/cloud persistence for noise.
- There is no content-driven noise metadata.

## 2. What is covered

The PR7 noise HUD / preview layer covers:

- Display-only noise chip rendering.
- `currentNoise = 0` default behavior.
- Pure helper coverage for threshold labels, action deltas, and formatting.
- Preview-only firearm delta for valid loaded firearm attack preview.
- PR5 magazine-validity constraint: `Шум +2` appears only when the magazine shot plan is valid.
- Empty-magazine fallback and disabled attack do not receive firearm noise delta.
- Hardening tests proving preview/display refresh does not mutate noise.
- Hardening tests proving reload, movement preview, cover, attack preview, and fallback do not mutate `currentNoise`.
- Preservation of ammo/reload/magazine/refund behavior.
- Preservation of AP preview behavior.
- Preservation of movement preview behavior.
- Preservation of cover chip behavior.
- Preservation of enemy intent display.
- Preservation of victory/defeat/retreat lifecycle behavior.

## 3. Known limitations

Current limitations are intentional:

- `currentNoise` remains `0` during actual gameplay.
- The noise chip therefore remains `Шум: тихо` in the current runtime.
- `Шум +2` is preview-only and does not apply noise after an attack.
- There is no runtime threshold progression from quiet to heard/dangerous/critical.
- There is no sortie-risk hook.
- There is no reinforcement or encounter-director integration.
- There is no save persistence for noise state.
- There is no content-driven noise metadata for weapons/actions.
- Reload remains free and non-turn-ending from the PR5 block.
- Movement remains preview-only from the PR6 block.
- The AP model is still not a fully authoritative action economy.
- `CombatEngine` is still not runtime authority for player-facing combat.

## 4. QA notes

Manual/browser QA is still required before any release or M12.5 acceptance claim.

Recommended manual checks:

- Run a 1280×720 combat smoke pass.
- Verify `Шум: тихо` remains readable with AP, ammo/magazine, distance, cover, and enemy intent UI.
- Verify `Атака 1 AP: цель <enemy> · Шум +2` is readable and not overcrowded.
- Verify the seven-button action bar remains tappable.
- Verify reload/attack/movement/cover interactions do not visually obscure the noise chip.
- Verify no `console.error` appears during normal combat smoke.

This closeout does not imply release readiness.

## 5. Next recommended options

### Option A — PR7c preflight for local noise mutation

Prepare a docs-only preflight for applying local `currentNoise` mutation after valid firearm shots.

Required guardrails:

- Only valid magazine firearm shots may mutate noise.
- Empty-magazine fallback must not apply firearm-shot noise.
- Preview must remain non-mutating.
- PR5 magazine/refund tests must remain green.
- No sortie-risk hook in the same PR.

### Option B — Keep PR7 as HUD-preview layer and move to PR8 status effects preflight

This is viable if the next priority is visible status effects rather than noise mechanics.

### Option C — Run first-10-minutes QA before more mechanics

This is recommended if UI readability or combat teaching is becoming the bottleneck.

## Recommendation

Do **not** implement a sortie-risk hook before local noise mutation is tested.

Do **not** implement local noise mutation unless PR5 magazine/refund tests remain green and the empty-magazine fallback remains explicitly protected.

Do **not** mark M12.5 accepted until the global M12.5 acceptance gate is satisfied.
