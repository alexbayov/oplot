# M12.5 First 10 Minutes Combat QA Evidence

## Status

- **Date/time:** 2026-06-06 11:14 UTC.
- **Branch/commit:** `docs/m12-5-first-combat-qa-evidence` from `main` at `e694797` (`Merge pull request #174 from alexbayov/test/combat-harden-status-preview-copy`).
- **Build command used:** `npm run build`.
- **Browser/dev command used:** `npm run preview -- --host 127.0.0.1 --port 4173`; served `http://127.0.0.1:4173/` and verified HTTP 200 with `curl -I --max-time 10 http://127.0.0.1:4173/`.
- **Viewport used:** Requested 1280×720 browser QA, but no usable browser was available in this environment. `npx playwright install chromium` failed with CDN 403, and Ubuntu `chromium-browser` installed only the snap launcher, which reported that the chromium snap was not installed / snapd was not usable in the container.
- **Result:** **Fail (environment-blocked)** for manual/browser QA. Automated gates passed and the production preview server responded, but visual/interactive first-10-minutes combat QA could not be completed here.

## Automated gates

| Command | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` | Pass | `tsc --noEmit` completed successfully. |
| `npm run lint` | Pass | ESLint completed successfully. |
| `npm run test` | Pass | 41 test files passed, 553 tests passed. Existing platform fail-soft warnings about unavailable YaGames/ads/IAP/cloud-save were printed during tests. |
| `npm run build` | Pass with warning | `tsc && vite build` completed successfully. Vite emitted the existing chunk-size warning for the main bundle. |
| `npm run preview -- --host 127.0.0.1 --port 4173` | Pass | Vite preview served `http://127.0.0.1:4173/`. |
| `curl -I --max-time 10 http://127.0.0.1:4173/` | Pass | HTTP 200 OK from the preview server. |
| `npx playwright install chromium` | Fail (environment) | Browser download failed with CDN 403, so Playwright could not provide a Chromium binary. |
| `chromium-browser --version` | Fail (environment) | Ubuntu package installed the snap launcher only; it reported that the chromium snap was not installed / snapd was not usable. |

## Manual QA evidence

| Area | Expected | Observed | Result | Notes |
| --- | --- | --- | --- | --- |
| Initial HUD | AP preview / AP pips, magazine line, ammo reserve line, `Дистанция: средне`, `Шум: тихо`, enemy intent, and all seven action buttons are visible/readable. | Not observed in browser because no usable browser could be launched. | Not run | Needs manual browser pass at 1280×720. |
| 1280×720 layout | No major text overlap; bottom action bar tappable/readable; AP/ammo/distance/cover/noise/status/intent do not collide; Russian text readable. | Not observed in browser because no usable browser could be launched. | Not run | This is the primary blocked portion of the checklist. |
| Action buttons | `АТАКА`, `УКРЫТИЕ`, `АПТЕЧКА`, `ПЕРЕЗАРЯДКА`, `БЛИЖЕ`, `ДАЛЬШЕ`, `ОТСТУП` are all visible and tappable. | Not observed in browser because no usable browser could be launched. | Not run | Automated smoke coverage exists, but this evidence file does not claim manual tap validation. |
| AP preview | AP pips / AP preview are visible and do not mutate during preview-only interactions. | Not observed in browser because no usable browser could be launched. | Not run | Covered by automated tests, but manual visual QA remains required. |
| Ammo/magazine | Magazine and reserve lines are visible and readable. | Not observed in browser because no usable browser could be launched. | Not run | Needs manual readable-layout confirmation. |
| Reload | Reload button exists; reload does not consume AP; reload fills magazine from backpack reserve. | Not observed in browser because no usable browser could be launched. | Not run | Automated tests cover behavior; manual QA remains required. |
| Ranged attack | Valid loaded firearm preview can show `Шум +2`; attack consumes magazine, not backpack directly; turn advances as before. | Not observed in browser because no usable browser could be launched. | Not run | Automated tests cover preview/behavior; manual QA remains required. |
| Empty magazine fallback | Ranged attack without reload falls back to weak bash / no crash; no backpack ammo consumed; no firearm `Шум +2`. | Not observed in browser because no usable browser could be launched. | Not run | Automated tests cover this path; manual QA remains required. |
| Movement preview | `БЛИЖЕ` / `ДАЛЬШЕ` log preview-only movement message; distance and AP do not change; no turn advance. | Not observed in browser because no usable browser could be launched. | Not run | Automated tests cover preview-only semantics; manual tap/readability QA remains required. |
| Cover | `УКРЫТИЕ` action works as before; cover chip appears as `Укрытие`; cover does not mutate noise/status preview unexpectedly. | Not observed in browser because no usable browser could be launched. | Not run | Automated tests cover behavior; manual QA remains required. |
| Noise | Initial `Шум: тихо`; valid firearm preview shows `Шум +2`; valid firearm shot increases local noise if reachable; no sortie-risk/reinforcement behavior implied. | Not observed in browser because no usable browser could be launched. | Not run | Automated tests cover current noise mechanics; manual QA remains required. |
| Status chips / status preview | No active status chips by default; preview copy remains visually distinct from active chips; no text implies status is already applied. | Not observed in browser because no usable browser could be launched. | Not run | PR8/PR8d smoke tests cover copy semantics; visual QA remains required. |
| Retreat/victory/defeat if reachable | Retreat/victory/defeat transitions remain safe and refund behavior appears correct if reachable. | Not observed in browser because no usable browser could be launched. | Not run | Automated lifecycle tests remain green; manual browser route still required. |
| Console errors | No blocker-level `console.error`; no softlocks after attack/cover/reload/retreat/victory/defeat. | Not observed in browser because no usable browser could be launched. | Not run | Test run printed expected platform fail-soft warnings, not browser console evidence. |

## Findings

### Blockers

- **Manual/browser QA blocked by environment:** no usable Chromium/Firefox browser was available. Playwright Chromium download failed with CDN 403, and the Ubuntu `chromium-browser` package only provided a snap launcher that could not run Chromium in this container.

### Major issues

- Not assessed manually. No gameplay blocker was observed from automated gates, but browser interaction was not available.

### Minor issues

- `npm run build` still emits the known Vite chunk-size warning for the main bundle. This is not new in this QA pass.
- `npm run test` still prints expected fail-soft warnings around unavailable YaGames/platform services in the local test environment.

### UX notes

- A human/manual browser QA pass is still required at 1280×720 to verify HUD readability, touch target plausibility, button tap behavior, status preview copy width, and combat loop feel.
- Because no visual browser pass was possible here, this document should not be used as evidence that first-10-minutes combat UX is acceptable.

## Screenshots / artifacts

- Screenshots were **not captured** because no usable browser could be launched.
- Preview server HTTP evidence: `curl -I --max-time 10 http://127.0.0.1:4173/` returned HTTP 200 OK.

## Acceptance note

This QA evidence does **not** mark M12.5 release-ready by itself.
It only records an attempted manual/browser pass after PR5–PR8 plus successful automated gates and preview-server availability.
Because browser QA was environment-blocked, M12.5 remains blocked on a real manual/human 1280×720 combat QA pass before any release-readiness claim.

## Recommendation

**Pause for manual human QA.** Run the same checklist in a real browser/device environment with a 1280×720 viewport before proceeding to release-readiness claims or additional mechanics. If manual QA finds issues, split them into separate small bugfix PRs; otherwise proceed to the next approved preflight.
