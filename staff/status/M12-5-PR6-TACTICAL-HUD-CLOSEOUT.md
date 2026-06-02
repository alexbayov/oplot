# M12.5 PR6 — Tactical HUD / Preview Layer Closeout

> Docs-only closeout. This file records current PR6 tactical HUD / preview-layer status and does not mark M12.5 accepted or release-ready.

## 1. Status

- PR6 tactical HUD / preview layer is implemented.
- Distance chip is implemented as display-only and defaults to `medium` (`Дистанция: средне`).
- Movement affordances `БЛИЖЕ` / `ДАЛЬШЕ` are implemented as preview-only.
- Cover chip `Укрытие` is implemented as display-only over the existing hero cover flag.
- No real movement is implemented.
- No suppression is implemented.
- No exposed/guard state model is implemented.
- No AP consumption changes are implemented.

## 2. What Is Covered

- Distance UI chip.
- Movement preview buttons and preview-only copy.
- Movement hardening tests.
- Cover chip over existing hero `cover_active` behavior.
- Cover hardening tests.
- Preservation of ammo/reload/magazine/refund behavior.
- Preservation of enemy intent display.
- Preservation of AP preview.

## 3. Known Limitations

- Movement does not change distance yet.
- Movement does not consume AP yet.
- Reload remains free and non-turn-ending from PR5.
- Distance state is scene-local and always defaults to `medium` on scene create.
- Cover chip only reflects the existing hero cover flag.
- No suppression mechanics are implemented.
- No exposed mechanics are implemented.
- No guard state model is implemented.
- `CombatEngine` is still not runtime authority.

## 4. QA Notes

- Browser/manual smoke is still needed at 1280×720.
- Manual validation should verify the seven-button action bar remains tappable.
- Manual validation should verify AP, ammo/magazine, distance, cover, and enemy intent readability together.
- This closeout does not imply release acceptance.
- This closeout does not mark M12.5 as accepted.

## 5. Next Recommended Options

- Option A: PR6d real movement with 1 AP, only if AP spend is explicitly approved and covered by tests.
- Option B: PR6d suppression preflight/display-only only, if suppression remains non-mechanical.
- Option C: close PR6 as the HUD-preview layer and move to PR7 noise meter preflight.

Recommendation: do not implement real movement without explicit AP spend tests proving movement costs 1 AP, cannot bypass insufficient AP, and does not break attack/reload/refund/lifecycle behavior.
