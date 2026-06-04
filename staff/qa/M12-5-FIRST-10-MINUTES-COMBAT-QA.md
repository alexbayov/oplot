# M12.5 First 10 Minutes Combat QA Checklist

> Manual/browser QA runbook for the first 10 minutes of combat after PR5/PR6/PR7.
>
> This checklist creates QA evidence only. It is **not** release acceptance, **not** M12.5 acceptance, and does **not** request gameplay changes.

## 1. Scope

Use this checklist to manually verify the first 10 minutes of player-facing combat in a browser build.

In scope:

- Browser/manual first-10-minutes combat QA.
- Visual/readability checks for the current combat HUD and preview layer.
- Smoke checks for melee, ranged, reload, movement preview, cover, retreat, victory, and defeat paths.
- Evidence collection for blockers or follow-up PRs.

Out of scope:

- Release acceptance.
- M12.5 product acceptance.
- Gameplay tuning or new mechanics.
- Runtime/code/content/test changes.

## 2. Build / Run Prerequisites

Before manual QA, run the automated gates from a clean branch/build:

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`

Local browser run:

- Development server: `npm run dev` (package script: `vite`).
- Production smoke: `npm run build` then `npm run preview` (package script: `vite preview`).
- If scripts change later, verify the current commands in `package.json` before QA.

Record:

| Field | Value |
|---|---|
| Commit / build | TBD |
| Tester | TBD |
| Date | TBD |
| Browser / device | TBD |
| Viewport | 1280×720 landscape |
| Console capture link | TBD |
| Screenshots/video link | TBD |

## 3. Screen / Readability Checks at 1280×720

Set the browser viewport to **1280×720 landscape** and enter combat.

Verify visible/readable:

- [ ] AP pips / AP preview are visible and readable.
- [ ] Ammo / magazine / reserve line is visible and readable.
- [ ] Distance chip is visible (`Дистанция: средне` in current default state).
- [ ] Movement buttons `БЛИЖЕ` and `ДАЛЬШЕ` are visible.
- [ ] Cover chip `Укрытие` appears when cover is active.
- [ ] Noise chip `Шум: тихо` is visible.
- [ ] Attack preview shows `Шум +2` only after a valid loaded firearm preview.
- [ ] Enemy intent is visible and readable.
- [ ] All seven action buttons are visible and tappable: `АТАКА`, `УКРЫТИЕ`, `АПТЕЧКА`, `ПЕРЕЗАРЯДКА`, `БЛИЖЕ`, `ДАЛЬШЕ`, `ОТСТУП`.

Evidence to capture:

- Screenshot before reload.
- Screenshot after reload with `Шум +2` visible in valid firearm attack preview.
- Screenshot with `Укрытие` active.
- Screenshot or short video proving all seven buttons are tappable.

## 4. Combat Interaction Checks

Run a melee combat smoke first.

- [ ] Start combat with melee weapon equipped.
- [ ] `АТАКА` works and damages/advances combat as before.
- [ ] `УКРЫТИЕ` works and shows `Укрытие` chip.
- [ ] Heal behavior is unchanged:
  - [ ] no medkit path shows expected no-heal/no-item behavior;
  - [ ] medkit path heals and advances/resolves as before, if available.
- [ ] `ОТСТУП` works and returns to the expected sortie/base flow.
- [ ] Victory transition works and reaches the expected loot/return flow.
- [ ] Defeat / second chance / surrender path works and does not softlock.

Expected result:

- No softlocks.
- No blocker `console.error`.
- Combat lifecycle remains unchanged by preview HUD additions.

## 5. Ammo / Reload Checks

Use PM or another ranged weapon with matching ammo.

- [ ] Before reload: magazine shows `0/<capacity>` and reserve ammo is visible.
- [ ] Reload: backpack reserve decreases and runtime magazine increases.
- [ ] Attack after reload: magazine decreases by the shot cost, backpack reserve does **not** decrease directly.
- [ ] Empty magazine attack: weak fallback occurs and no backpack ammo is consumed.
- [ ] Retreat after reload refunds unspent loaded magazine ammo.
- [ ] Victory after reload refunds unspent loaded magazine ammo before transition.
- [ ] Defeat / surrender after reload refunds unspent loaded magazine ammo where the path is reachable.

Evidence to capture:

- Before reload ammo line.
- After reload ammo line.
- After one ranged attack ammo line.
- Retreat/victory/defeat refund result.

## 6. Noise Preview Checks

Current PR7 state is preview/display only.

- [ ] `Шум: тихо` chip is visible in combat.
- [ ] Loaded valid firearm attack preview shows `Шум +2`.
- [ ] Empty magazine fallback does **not** show `Шум +2`.
- [ ] Melee preview/action does **not** show firearm `Шум +2`.
- [ ] Reload preview/action does **not** show firearm `Шум +2`.
- [ ] Movement preview (`БЛИЖЕ` / `ДАЛЬШЕ`) does **not** show firearm `Шум +2`.
- [ ] Cover preview/action does **not** show firearm `Шум +2`.
- [ ] Actual noise does not visibly progress yet; `Шум: тихо` staying visible is expected for current scope.

Expected result:

- `Шум +2` is preview-only and appears only for a valid loaded firearm attack preview.
- No action applies runtime noise yet.
- No sortie risk, reinforcement, or encounter director behavior appears because none is implemented yet.

## 7. Movement / Cover Checks

Movement is currently preview-only.

- [ ] Clicking `БЛИЖЕ` logs the preview-only message.
- [ ] Clicking `ДАЛЬШЕ` logs the preview-only message.
- [ ] Distance does not change yet; this is expected.
- [ ] Movement does not consume AP; this is expected for current scope.
- [ ] Movement does not end the hero turn.
- [ ] Cover chip reads the existing hero cover flag only.
- [ ] Enemy cover state does not create the hero `Укрытие` chip.

Expected movement message:

```text
Манёвр пока в предпросмотре: перемещение не тратит AP и не меняет дистанцию.
```

## 8. Regression Watchlist

Mark any of these as blockers for follow-up triage:

- [ ] UI overcrowding at 1280×720.
- [ ] Buttons not tappable or overlapping.
- [ ] Text overlap / clipped Russian strings.
- [ ] Noise preview is misleading or appears on the wrong action.
- [ ] Ammo duplication.
- [ ] Ammo loss.
- [ ] Refund missing on retreat/victory/defeat transition.
- [ ] `console.error` during normal combat flow.
- [ ] Softlock after attack.
- [ ] Softlock after retreat.
- [ ] Softlock after victory.
- [ ] Softlock after defeat / second chance / surrender.
- [ ] Unexpected save/cloud calls during local combat smoke.

## 9. Pass / Fail Template

Use this table while testing. Add rows as needed.

| Area | Check | Expected | Actual | Pass/Fail | Notes |
|---|---|---|---|---|---|
| Build | `npm run typecheck` | Pass | TBD | TBD |  |
| Build | `npm run lint` | Pass | TBD | TBD |  |
| Build | `npm run test` | Pass | TBD | TBD |  |
| Build | `npm run build` | Pass | TBD | TBD |  |
| HUD | 1280×720 readability | AP/ammo/distance/cover/noise/intent readable | TBD | TBD |  |
| HUD | Seven action buttons | All visible and tappable | TBD | TBD |  |
| Melee | Attack | Works as before | TBD | TBD |  |
| Cover | `Укрытие` | Chip appears when cover active | TBD | TBD |  |
| Heal | No-heal / heal | Existing behavior unchanged | TBD | TBD |  |
| Retreat | Retreat flow | Returns without softlock | TBD | TBD |  |
| Victory | Victory transition | Loot/return flow works | TBD | TBD |  |
| Defeat | Second chance / surrender | Works without softlock | TBD | TBD |  |
| Ammo | Before reload | `0/<capacity>` + reserve visible | TBD | TBD |  |
| Ammo | Reload | Reserve decreases, magazine increases | TBD | TBD |  |
| Ammo | Attack after reload | Magazine decreases, backpack does not | TBD | TBD |  |
| Ammo | Empty magazine fallback | Weak fallback, no backpack consumption | TBD | TBD |  |
| Ammo | Refund | Unspent magazine refunded on transition | TBD | TBD |  |
| Noise | Loaded firearm preview | Shows `Шум +2` | TBD | TBD |  |
| Noise | Empty/melee/reload/move/cover | Does not show firearm `Шум +2` | TBD | TBD |  |
| Movement | `БЛИЖЕ` / `ДАЛЬШЕ` | Preview-only log, no distance/AP change | TBD | TBD |  |
| Console | Normal combat smoke | No blocker `console.error` | TBD | TBD |  |

## 10. Exit Criteria

This checklist is complete when:

- [ ] Automated gates are recorded.
- [ ] Manual first-10-minutes combat smoke has evidence.
- [ ] Screenshots/video cover the main HUD states.
- [ ] Console status is recorded.
- [ ] Any failures are filed as separate small PRs/issues with reproduction notes.

Important:

- Passing this checklist can produce QA evidence.
- Passing this checklist does **not** by itself mean M12.5 is accepted.
- Passing this checklist does **not** by itself mean release readiness.
- Failures should become separate small PRs rather than broad combat rewrites.
