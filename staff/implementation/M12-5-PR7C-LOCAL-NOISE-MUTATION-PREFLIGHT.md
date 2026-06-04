# M12.5 PR7c — Local Noise Mutation Preflight

> Docs-only preflight for a future runtime slice. This file does **not** implement noise mutation, does **not** change `CombatScene`, and does **not** change tests/runtime/content.
>
> PR7c must stay local and conservative: mutate scene-local noise only after a validated firearm magazine shot, with no risk hook, no reinforcements, and no encounter director work.

## 1. Current State

Current PR7 state after the noise HUD / preview layer:

- `currentNoise` is scene-local and defaults to `0` on `CombatScene.create()`.
- The noise chip currently stays `Шум: тихо` during gameplay.
- Preview-only `Шум +2` exists for a valid loaded firearm attack preview.
- Runtime noise mutation is not implemented yet.
- No sortie-risk hook is implemented.
- No encounter director or reinforcement system is implemented.
- PR5 ammo/reload/magazine/refund behavior remains the source of truth for valid firearm shot gating.

## 2. PR7c Goal

Future PR7c runtime slice:

- After a valid loaded firearm attack resolves, add the noise delta to `currentNoise`.
- Update the noise chip threshold label after mutation.
- Keep preview refresh non-mutating.
- Keep all noise state scene-local.
- Do not add a sortie-risk hook.
- Do not add reinforcements.
- Do not rewrite or touch the encounter director.

PR7c should make noise visible as a local combat state only; it must not introduce pressure systems or follow-up combat spawns.

## 3. Exact Mutation Rule

Only mutate `currentNoise` when all of these are true:

- Attack is a ranged firearm attack.
- `computeMagazineShotPlan(...)` returns `ok`.
- The attack actually proceeds through the magazine-shot path.
- Runtime magazine ammo is decremented.

Do **not** mutate `currentNoise` when:

- Empty magazine fallback happens.
- Attack is melee.
- Attack is disabled.
- Reload happens.
- Movement preview happens.
- Cover happens.
- Heal happens.
- Retreat happens.
- Victory transition happens.
- Defeat transition happens.

Implementation guidance for the later runtime PR:

1. Reuse the same magazine-shot planning facts already used for attack/magazine consumption.
2. Apply noise only after the shot path is confirmed and magazine decrement is committed.
3. Keep preview text (`Шум +N`) separate from committed `currentNoise` mutation.

## 4. Delta Rule

Initial PR7c delta rule:

- Use `getNoiseDeltaForAction("valid_firearm_shot")`.
- Current expected delta is `+2`.
- Values remain tunable.
- No weapon-specific noise values yet.
- No content-driven noise metadata yet.

Do not add per-weapon balancing or content schema changes in PR7c.

## 5. Threshold Display

After mutation, the chip should display the threshold label for the current scene-local noise value:

| `currentNoise` | Chip copy |
|---:|---|
| `0–2` | `Шум: тихо` |
| `3–5` | `Шум: слышно` |
| `6–8` | `Шум: опасно` |
| `9+` | `Шум критический` |

Note:

- If one shot from `0` adds `+2`, the chip may still stay `Шум: тихо`; this is expected.
- Tests should check numeric `currentNoise` as well as chip text.
- If a future implementation uses helper label formatting, it must preserve the current Russian copy expectations.

## 6. Preview Semantics

Preview remains non-committing:

- `updateActionPreview()` may show `Шум +2` for a valid loaded firearm shot preview.
- Preview refresh must not mutate `currentNoise`.
- Repeated preview refresh must not accumulate noise.
- Disabled attack preview must not apply noise.
- Empty magazine fallback preview must not apply firearm noise.

PR7c must keep a strict boundary between preview deltas and committed action effects.

## 7. Interaction with PR5 Ammo / Reload / Magazine

Firearm noise must be tied to the same valid magazine-shot path as ammo consumption:

- No firearm noise without a valid `computeMagazineShotPlan(...)` success.
- No firearm noise without runtime magazine decrement.
- No ammo duplication.
- No ammo loss.
- Attack after reload still decrements the runtime magazine exactly once.
- Backpack ammo is not consumed directly by attack.
- Refund on retreat remains unchanged.
- Refund on victory remains unchanged.
- Refund on defeat / surrender remains unchanged.
- Reload behavior remains unchanged and does not apply noise in PR7c.

If ammo/refund tests break, stop PR7c runtime implementation and fix the integration plan before proceeding.

## 8. Scene Lifecycle

Noise remains scene-local in PR7c:

- `currentNoise` resets to `0` on `CombatScene.create()`.
- No save persistence.
- No cloud/local save schema changes.
- No refund, restore, or carry-over of noise yet.
- No sortie-level noise state yet.
- No base/return/loot lifecycle changes.

Noise is a local combat HUD value only until a later explicitly approved PR changes that scope.

## 9. Tests Required for Future Runtime PR

Future PR7c runtime implementation must add/keep tests for:

- Initial `currentNoise` is `0` and chip is `Шум: тихо`.
- Loaded PM preview shows `Шум +2` but does not mutate `currentNoise`.
- Valid loaded PM attack increments `currentNoise` by `2`.
- Valid loaded PM attack decrements runtime magazine exactly once.
- Repeated preview before attack does not accumulate noise.
- Empty magazine fallback does not increment `currentNoise`.
- Melee attack does not increment `currentNoise`.
- Reload does not increment `currentNoise`.
- Movement preview does not increment `currentNoise`.
- Cover does not increment `currentNoise`.
- Heal does not increment `currentNoise`.
- Retreat lifecycle remains unchanged.
- Victory lifecycle remains unchanged.
- Defeat / second chance / surrender lifecycle remains unchanged.
- `currentNoise` resets on new scene create.
- Threshold label updates when `currentNoise` reaches `3`, `6`, and `9`, if the test seam can set state safely.

Required regression focus:

- Existing reload/refund tests stay green.
- Existing attack/magazine tests stay green.
- Existing preview non-mutation tests stay green.
- Existing lifecycle tests stay green.

## 10. Anti-Scope

PR7c must not include:

- Risk hook.
- Sortie pressure effects.
- Reinforcements.
- Encounter director changes.
- Save migration.
- Cloud/local save changes.
- Content metadata changes.
- AP changes.
- Movement changes.
- Cover changes.
- Suppression changes.
- Damage formula changes.
- CombatEngine migration.
- Weapon-specific noise balancing.
- UI redesign beyond updating the existing noise chip label.

## 11. No-Go Conditions

Stop the future runtime PR if any of these occur:

- Noise mutation cannot be tied safely to the valid magazine-shot path.
- Preview refresh mutates `currentNoise`.
- Repeated preview refresh accumulates noise.
- Ammo/reload/magazine/refund tests break.
- Retreat/victory/defeat lifecycle tests break.
- Implementation requires save changes.
- Implementation requires content schema changes.
- Implementation requires encounter director changes.
- UI becomes misleading about whether noise has gameplay consequences.
- The change starts introducing risk, pressure, reinforcements, or other non-local effects.
