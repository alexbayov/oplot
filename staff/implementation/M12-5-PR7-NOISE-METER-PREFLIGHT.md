# M12.5 PR7 — Noise Meter Preflight

> Status: **docs-only preflight** for a future PR7 runtime split.
>
> This document does **not** implement a noise meter, does **not** change `CombatScene`, does **not** change combat logic, and does **not** mark M12.5 accepted or release-ready.

## 1. Current state after PR5 / PR6

Current player-facing combat has the PR5 ammo/reload block and PR6 tactical HUD / preview layer in place:

- Ammo/reload/magazine/refund behavior is live in `CombatScene`.
- Ranged attacks consume the scene-local runtime magazine, not backpack reserve directly.
- Reload uses compatible backpack reserve ammo and mutates backpack only on successful reload.
- Scene exit refunds loaded runtime magazine ammo back to backpack.
- Distance/cover/movement HUD exists:
  - distance chip is display-only and defaults to `medium` / `Дистанция: средне`;
  - movement affordances `БЛИЖЕ` / `ДАЛЬШЕ` are preview-only;
  - cover chip `Укрытие` is display-only over the existing hero `cover_active` flag.
- Movement is preview-only: no real distance mutation and no movement AP spend.
- No suppression mechanic exists.
- No real movement exists.
- AP preview exists, but the full AP economy is not wired as the source of truth for all actions.
- Reload still does not consume AP and does not end the player turn.
- `CombatEngine` is still not the runtime authority for player-facing combat.

## 2. PR7 goal

PR7 should add a visible noise meter as a small, testable combat-readability layer:

- deterministic scene-local noise state;
- visible threshold labels;
- future action preview can show noise delta before committing an action;
- runtime risk hooks only if separately approved in a later PR;
- no encounter director rewrite.

Noise should support the M12.5 fantasy of sortie survival under scarcity without introducing hidden punishment or a broad encounter system.

## 3. Proposed noise thresholds

Suggested thresholds for the first implementation. These are **tunable constants**, not final balance values:

| Noise value | English | Russian UI copy | Meaning |
|---:|---|---|---|
| `0–2` | Quiet | `Тихо` | Low risk; quiet actions or early combat. |
| `3–5` | Heard | `Слышно` | The fight is becoming noticeable; warn the player. |
| `6–8` | Dangerous | `Опасно` | Noise is high enough to imply sortie risk if later hooks are approved. |
| `9+` | Overrun | `Шум критический` | Critical noise; should be visibly alarming, but not automatically a new system in PR7a. |

Recommended compact display copy:

- `Шум: тихо`
- `Шум: слышно`
- `Шум: опасно`
- `Шум критический`

The exact numeric thresholds may be adjusted only with tests and clear copy updates.

## 4. Noise sources proposal

Future runtime should keep noise sources simple and readable:

| Action/source | Suggested first delta | Notes |
|---|---:|---|
| Firearm shot | `+1` to `+3` | Depends on weapon archetype / metadata later; must only happen after a valid shot. |
| Suppress / burst | `+2` to `+4` | Future-only; no suppression runtime exists yet. |
| Reload | `0` or `+1` | Prefer low/no noise unless future UX needs a reload tell. |
| Melee / weak fallback | `0` or `+1` | Must not be treated like a firearm shot. |
| Cover / guard | `0` | Existing cover should not create noise in the first slice. |
| Preview-only movement | `0` | Movement is not real yet; do not mutate noise. |
| Real movement, if later approved | `0` or `+1` | Requires separate movement/AP approval first. |
| Retreat | `0` or `+1` | Keep readable and avoid hidden penalties. |
| Medkit / item | `0` or `+1` | No broad item noise model in PR7a. |

Critical constraint: **any firearm noise must respect PR5 magazine rules**. Noise from a firearm shot may only apply after the same checks that allow a valid magazine shot. It must not bypass ammo checks, must not fire on empty-magazine weak fallback, and must not mutate backpack/magazine/refund behavior.

## 5. UI proposal

Use a compact text chip or meter; do not add a large panel/modal.

Recommended first UI:

- a small chip near the existing tactical HUD row, e.g. distance / cover / noise;
- copy: `Шум: тихо`, `Шум: слышно`, `Шум: опасно`, or `Шум критический`;
- optional color emphasis by threshold, but text must remain the primary signal.

The UI must fit alongside:

- AP pips and action preview;
- ammo/magazine preview;
- distance chip;
- cover chip;
- enemy intent display;
- seven-button action bar including preview-only movement buttons.

Do not make critical noise information tooltip-only. Do not obscure existing attack/reload/retreat buttons.

## 6. State model proposal

First implementation should be scene-local and deterministic:

- `currentNoise` starts at `0` / quiet on scene create.
- No save persistence initially.
- No cloud/local save schema changes.
- Reset on every `CombatScene.create()` unless a later approved PR defines carry-over.
- No content-driven noise schema is required for PR7a.
- If helper functions are added, they must be pure and testable.

This mirrors the current incremental approach: add visible local state first, prove tests, and only then consider broader risk hooks.

## 7. Preview behavior

Future action previews may include noise delta copy such as:

- `Шум +1`
- `Шум +2`
- `Шум +0`

Rules:

- Preview refresh must **not** mutate noise.
- Disabled actions must not show misleading committed noise.
- Empty-magazine firearm actions must not preview firearm noise as if a valid shot will happen.
- Preview must use the same validation path as the action that would later apply the noise.
- Tests must prove `updateDisplay()` / `updateActionPreview()` do not mutate the scene-local noise state.

## 8. Runtime effect / risk hook

Be conservative:

- PR7a should be either display-only meter, or meter plus local deltas for already-valid actions.
- Any sortie-risk / encounter / reinforcement hook must be a later PR and separately approved.
- No encounter director rewrite.
- No loot/return lifecycle changes.
- No radio/progression/cloud-save side effects.

If a minimal risk hook is later approved, it should be explicit, deterministic, and covered by tests. Example future hooks may include retreat-risk modifier or next-fight modifier, but these are **not** PR7a requirements.

## 9. Interaction constraints

PR7 implementation must preserve all existing PR5/PR6 behavior:

- Ammo/reload/magazine/refund behavior unchanged.
- Ranged attack still consumes magazine according to PR5 rules.
- Reload still uses backpack reserve and keeps refund behavior intact.
- Movement remains preview-only unless separately approved.
- Cover chip remains display-only over existing hero cover flag.
- AP behavior unchanged; no AP overhaul.
- Enemy intent display unchanged.
- No suppression wiring.
- No save/content/platform changes.
- No `CombatEngine` runtime-authority migration.

## 10. Future test plan

Required future PR7 tests:

- initial noise is `0` / quiet;
- UI renders the noise chip;
- preview refresh does not mutate noise;
- melee / weak fallback noise behavior is documented and tested if implemented;
- firearm attack increases noise only after a valid magazine shot;
- empty-magazine weak fallback does not apply firearm-shot noise;
- reload noise behavior is documented and tested;
- reload/refund tests remain green;
- movement preview remains preview-only;
- cover chip tests remain green;
- enemy intent tests remain green;
- AP preview tests remain green;
- victory/defeat/retreat lifecycle unchanged;
- no console errors in smoke tests.

Recommended test split:

1. Pure threshold helper tests if a helper module is introduced.
2. `CombatScene` smoke for chip rendering and non-mutating preview refresh.
3. Valid-shot smoke for noise increment tied to magazine consumption.
4. Empty-magazine / weak-fallback smoke proving no firearm noise is applied.
5. Regression smoke for reload/refund, movement preview, cover chip, enemy intent, and lifecycle.

## 11. Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Scope creep into encounter director | Noise can easily become a new spawning/director system. | PR7a must stay local; any sortie-risk hook needs separate approval. |
| Hidden punishment mechanics | Player may not understand why later risk changed. | Always show threshold and `Шум +N` preview before mutation. |
| Breaking magazine attack | Noise tied to firing could bypass PR5 ammo checks. | Apply firearm noise only after valid magazine-shot planning/resolution. |
| Preview mutating state | Existing preview layer must remain non-committal. | Tests for refresh and disabled actions must prove no mutation. |
| UI overcrowding | AP, ammo, distance, cover, intent, movement, and noise compete for 1280×720 space. | Compact chip; no modal; no tooltip-only critical info. |
| Save persistence temptation | Persisted noise would require schema/cloud decisions. | Scene-local only until separately approved. |
| Confusing noise with suppression/intent | Noise is sortie pressure, not enemy suppression. | No suppression wiring in PR7; distinct copy and tests. |

## 12. No-go conditions

Stop PR7 runtime implementation if it:

- requires save migration;
- requires content rewrite;
- requires encounter director rewrite;
- requires `CombatEngine` authority migration;
- breaks ammo/reload/magazine/refund behavior;
- bypasses magazine checks for firearm noise;
- cannot fit cleanly in the 1280×720 HUD;
- cannot prove preview is non-mutating;
- requires platform/cloud/Yandex/ads/IAP changes;
- changes loot/return lifecycle.

## 13. Anti-scope

Explicitly out of scope for PR7:

- real movement implementation;
- suppression implementation;
- AP overhaul or new AP spend rules;
- save/cloud/local persistence changes;
- Yandex/platform/ads/IAP changes;
- content mass edits or new content schema requirements;
- encounter director rewrite;
- reinforcement/spawn system;
- loot/return lifecycle changes;
- `CombatEngine` runtime-authority migration;
- boss overhaul;
- real weapon naming changes.

## Recommended PR7 runtime split

1. **PR7a — display-only noise chip**
   - Scene-local `currentNoise = 0`.
   - Render `Шум: тихо`.
   - Tests prove preview/display refresh is non-mutating.

2. **PR7b — pure noise thresholds / preview deltas**
   - Add pure threshold/delta helper if needed.
   - Preview shows `Шум +N` for valid action categories without mutating state.

3. **PR7c — local noise mutation for valid shots only**
   - Increment noise after valid magazine firearm shots.
   - Empty magazine fallback does not apply firearm-shot noise.
   - Reload/refund and lifecycle tests remain green.

4. **Future approved PR only — risk hook**
   - Add minimal sortie-risk hook only after separate review.
   - No encounter director rewrite.
