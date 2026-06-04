# M12.5 PR7c — Local Noise Mutation Closeout

## 1. Status
* **PR7c local noise mutation:** Fully implemented and verified.
* **Scene-local state:** `currentNoise` is completely scene-local, initializing to `0` in `CombatScene.create()` and not persisting to save states or other scenes.
* **Gated mutation:** `currentNoise` mutates *only* after a valid ranged firearm magazine shot is committed.
* **Non-mutating paths:** Previews, reloads, empty-magazine fallbacks, melee attacks, cover action, movement, healing, retreats, and combat lifecycle transitions (victory/defeat/surrender) do not apply or mutate noise.
* **No external pressure systems:** 
  * No sortie risk hook.
  * No encounter director changes.
  * No reinforcement spawns.
  * No save/cloud persistence changes.

---

## 2. What is Covered
* **Shot Mutation:** Firing a valid firearm shot increments `currentNoise` by `+2` (retrieved via `getNoiseDeltaForAction("valid_firearm_shot")`).
* **Noise HUD Updates:** The noise chip dynamically updates its text to match defined thresholds:
  * `0–2` -> `Шум: тихо` (after the first PM shot from 0, noise becomes 2 and the chip remains `Шум: тихо`, as expected)
  * `3–5` -> `Шум: слышно`
  * `6–8` -> `Шум: опасно`
  * `9+` -> `Шум критический` (capitalized, without a colon/prefix)
* **HUD Previews:** The attack action preview shows `Шум +2` on loaded weapons, which is display-only and does not mutate the committed noise.
* **Lifecycles:** Reloading, fallbacks, and retreats/victory refunds function correctly and remain green in the regression test suite.

---

## 3. Known Limitations
* **Sortie Integration:** Noise does not yet affect the global sortie danger level, risk meters, or escape success rates.
* **Reinforcements:** Firing weapons does not trigger reinforcements or alert adjacent cells.
* **Weapon Uniformity:** All firearms share a single uniform noise delta (+2). There is no content-driven per-weapon noise metadata or silencer mods.
* **Resets:** Noise is cleared back to `0` whenever `CombatScene` is created (no carryover between battles).

---

## 4. QA Notes
* **Manual / Browser QA:** Verify the noise chip updates correctly when shooting.
* **HUD Layout:** Verify that the noise chip does not overlap with other HUD elements on a standard 1280×720 viewport.
* **Feedback loop:** Confirm that the HUD does not mislead players into thinking their noise has active sortie risk/reinforcement consequences yet.

---

## 5. Next Options
* **Option A:** PR7d preflight for risk hook only (documentation-only, no runtime).
* **Option B:** PR8 status effects preflight.
* **Option C (Recommended):** Manual QA bugfix pass before introducing more mechanics.

**Recommendation:** 
We strongly recommend **Option C**. We should perform a manual QA pass to verify HUD readability, UI layout under different resolutions, and local shot stability before adding sorting-level risk hooks or reinforcement spawns.
