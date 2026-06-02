# M12.5 PR6 Preflight — Cover / Suppression / Distance Bands

> Status: **docs-only preflight** for a future PR6 runtime split.
>
> This file does not implement cover, suppression, or distance bands. It does not change `CombatScene`, `CombatEngine`, `mobAI`, content, save data, platform integrations, loot/return lifecycle, or AP/ammo behavior.

## 1. Current state after PR5

PR5 ammo/reload is considered closed for implementation planning purposes:

- Ammo/reload/magazine behavior is live in the current scene flow.
- Runtime magazine state is scene-local.
- Reload uses backpack reserve and mutates backpack only after a successful reload.
- Ranged attack consumes runtime magazine ammo, not backpack ammo directly.
- Scene exit refunds loaded runtime magazine ammo back to backpack.
- Enemy intents are visible via a pure intent adapter, but they do not change mob behavior.
- AP display and action preview exist, but reload still has no AP cost and does not end the player turn.
- Current cover behavior exists as legacy/simple cover through the existing cover action.
- There are no player-facing distance bands yet.
- There is no suppression mechanic yet.
- `CombatEngine` is still not the runtime authority for player-facing combat; `CombatScene` remains authoritative.

## 2. PR6 goal

Introduce a minimal no-grid tactical layer:

- distance bands: `close`, `medium`, `far`;
- cover / guard / exposed states;
- suppression as a visible temporary state;
- no grid tactics;
- no pathfinding;
- no terrain geometry;
- no boss overhaul;
- no encounter director rewrite.

The goal is to make combat positioning readable without turning the game into grid tactics or migrating combat authority away from `CombatScene` in this PR.

## 3. Core design decision

Keep PR6 small and reversible:

- Start with scene-local combat tactical state.
- Do not persist distance, cover, guard, exposed, or suppression state unless a later owner-approved risk PR explicitly requires it.
- Do not migrate `CombatEngine` authority in PR6.
- Do not change loot, return, save, cloud save, Yandex/platform, ads/IAP, or scene exit flows.
- Do not change ammo/reload/magazine mutation behavior.
- Only mention distance/suppression in ammo/action preview if the copy is truthful and does not change magazine rules.
- Keep existing PR5 reload/refund tests green before and after any future PR6 runtime work.

## 4. Distance bands proposal

### Bands

Use exactly three no-grid bands:

- `close` — melee threat range and high-risk emergency range.
- `medium` — default firefight range and the safest initial implementation default.
- `far` — ranged advantage / sniper pressure range.

### Default initial band

Default initial band should be `medium` unless a later pre-approved content contract introduces explicit encounter distance metadata. If no metadata exists, `medium` is the safe fallback.

### Move actions

Future PR6 may add two small actions or preview-only affordances:

- **Move closer** — shifts `far → medium` or `medium → close`; disabled at `close`.
- **Move away** — shifts `close → medium` or `medium → far`; disabled at `far`.

These actions must not require pathfinding or geometry. They should only update scene-local band state.

### Weapon archetype interaction

Initial weapon-band interaction should be conservative and explainable:

- melee / knife / improvised melee: strongest at `close`, poor or unavailable at `medium`/`far` unless current behavior already supports fallback;
- pistol: reliable at `close`/`medium`, weaker preview at `far`;
- shotgun: best at `close`, acceptable at `medium`, poor at `far`;
- rifle: best at `medium`/`far`, awkward at `close`;
- automatic / SMG if currently supported: best at `close`/`medium`, noisy/suppression-friendly later;
- improvised ranged weapons: keep current behavior first; do not invent new formulas in PR6.

PR6 should not introduce broad damage rebalance. If band effects are not safely testable, start with display-only distance chips and disabled/preview copy.

### Missing metadata behavior

If weapon, mob, or encounter distance metadata is missing:

- initialize distance as `medium`;
- keep current attack/reload behavior unchanged;
- show neutral UI copy, e.g. `Дистанция: средняя`;
- do not infer complex range behavior from item names;
- do not edit content to add mass distance metadata in PR6.

### UI copy / chips

Use short chips to avoid layout pressure:

- `Дистанция: близко`
- `Дистанция: средне`
- `Дистанция: далеко`

No geometry, path lines, tile highlights, minimap, or range grid.

## 5. Cover / guard / exposed proposal

### Current legacy cover snapshot

Current scene has an existing cover action and legacy/simple cover state. PR6 must not break that action or its smoke tests.

### Adaptation approach

Treat current cover as the first implementation of `guarded` / `in cover`:

- keep the existing cover button behavior initially;
- add clearer state naming in UI copy only if tests prove old behavior remains stable;
- avoid changing incoming damage formulas in the first slice unless already covered by smoke/unit tests;
- do not remove or rename the current cover path before a compatibility test exists.

### States

Use minimal states:

- `guarded` — player spent the cover/guard action this turn; short defensive state.
- `in cover` — readable cover state if legacy cover maps better to persistent cover.
- `exposed` — temporary vulnerability state, likely from movement, failed retreat, enemy special, or leaving cover later.

### Duration and clearing rules

Start with simple scene-local rules:

- `guarded` should clear after it absorbs/affects the next enemy response or at the next hero turn, whichever is safer and testable.
- `in cover` should follow existing legacy cover clearing unless explicitly changed in a tested sub-PR.
- `exposed` should last one turn by default if introduced.
- State clearing must be covered by smoke/unit tests and must not leak across victory, defeat, retreat, or scene recreation.

### UI chips / copy

Use short chips near the player/enemy status area:

- `Укрытие`
- `Готовность`
- `Открыт`

Avoid long explanatory strings in the main action bar. Use action preview for one-line explanations only.

### Relation to enemy intents

Enemy intent display should remain deterministic and non-mutating. Cover/guard/exposed UI may reference visible intents, e.g. “Укрытие снижает риск от атаки”, but must not re-run or mutate `mobAI` planning.

### Cover button decision

Prefer keeping the current cover button as the same action for PR6. It may be relabeled only if the action outcome remains compatible and tests are updated. Do not split into multiple cover/guard buttons in the first runtime PR unless UI space and tests are clearly safe.

## 6. Suppression proposal

### First version only

Suppression should start narrow:

- visible temporary state;
- short duration;
- predictable clearing;
- no broad morale system;
- no AI rewrite;
- no new content requirement.

### Possible triggers

Future PR6 runtime split may consider:

- player suppress action if enough magazine ammo is available;
- enemy suppress intent already visible through intent adapter if behavior can map safely;
- automatic/SMG-style weapons later, only if current content supports it without mass edits.

### Safe first implementation options

Preferred order:

1. Display-only suppression chip and preview copy, no mechanical effect.
2. Tiny effect with clear tests, e.g. next incoming attack preview warning changes or enemy accuracy modifier only if existing math can isolate it safely.
3. More complex suppression effects only in a later PR after PR6 smoke proves stable.

Any suppression/fire action must consume or require magazine ammo through existing PR5 magazine rules if it becomes a real action. It must not bypass magazine checks or consume backpack reserve directly.

## 7. Interaction with PR5 ammo/reload

PR6 must explicitly preserve PR5 semantics:

- no backpack mutation changes;
- no runtime magazine map shape changes unless separately approved and tested;
- ranged attack ammo behavior must remain magazine-based;
- reload/refund behavior must remain intact;
- scene exit must still refund loaded magazine ammo;
- suppression/fire actions must not bypass magazine rules;
- reload must remain non-AP/non-turn-ending until a later AP-economy PR explicitly changes it.

If any cover/distance/suppression implementation breaks reload, ranged attack magazine consumption, or refund-on-exit tests, stop the PR and split the work smaller.

## 8. UI / 1280×720 plan

PR6 must fit the existing landscape 1280×720 UI without overcrowding.

Priority order:

1. Keep AP preview readable.
2. Keep ammo/magazine preview readable.
3. Keep enemy intent visible.
4. Add one compact distance chip.
5. Add compact cover/suppression/exposed status chips.
6. Keep action buttons tappable.

Recommended layout approach:

- Use chips instead of paragraphs: `Дистанция: средне`, `Укрытие`, `Подавлен`, `Открыт`.
- Put player tactical chips near player HP/AP/ammo status, not inside every button label.
- Put enemy tactical chips near enemy cards/intent labels.
- Keep action preview to one short line; if it wraps or crowds reload/ammo copy, split PR6 into display-only chips first.
- Do not add new large panels, modal tooltips, or extra rows that reduce touch target safety.

## 9. Test plan for future PR6

Future PR6 runtime implementation should add tests for:

- default distance is `medium`;
- move closer updates `far → medium → close` and disables at `close`;
- move away updates `close → medium → far` and disables at `far`;
- cover/guard state applies and clears predictably;
- exposed state applies and clears predictably if introduced;
- suppression state applies and clears predictably if introduced;
- ranged attack still consumes runtime magazine;
- reload/refund tests remain green;
- enemy intent display tests remain green;
- AP preview tests remain green;
- victory, defeat, retreat, loot/return lifecycle remains unchanged;
- no console errors in combat smoke;
- mobile/1280×720 smoke if feasible in the existing test harness.

Do not rely on exact pixel layout assertions. Prefer text/chip existence, state transitions, and lifecycle invariants.

## 10. Risks

- `CombatScene` is a god-object: UI, turn loop, damage, loot, return, ads, save hooks, and smoke paths are tightly coupled.
- UI overcrowding can hide AP, ammo, intent, or action buttons on 1280×720.
- Hidden status complexity can create state leaks across turns or scene exits.
- Duration bugs can leave cover/suppression/exposed stuck forever or cleared too early.
- Scope creep into grid tactics/pathfinding would exceed PR6.
- Ammo/refund behavior can regress if suppression/fire actions bypass PR5 magazine helpers.
- Enemy intent determinism can break if PR6 re-runs mutating `mobAI` logic for preview.
- Save persistence temptation can expand a small tactical PR into schema/cloud risk.

## 11. No-go conditions

Stop implementation if PR6 requires any of the following:

- save migration;
- cloud/local save changes;
- content rewrite or mass content metadata edits;
- `CombatEngine` authority migration;
- grid tactics, tile coordinates, terrain geometry, or pathfinding;
- changes that break ammo/reload/refund tests;
- UI that cannot fit in 1280×720 with readable AP/ammo/intent/action controls;
- tactical state that tests cannot isolate from victory/defeat/retreat lifecycle.

## 12. Anti-scope

PR6 must explicitly forbid:

- save schema changes;
- cloud/local save changes;
- Yandex SDK, ads/IAP, platform, banner, or cloud-save changes;
- loot/return lifecycle changes;
- boss overhaul;
- grid tactics/pathfinding;
- encounter director rewrite;
- AP overhaul;
- reload AP-cost integration;
- broad ammo/reload rewrites;
- new content mass edits;
- real weapon naming changes;
- broad damage formula rebalance;
- making `CombatEngine` the runtime authority.

## Recommended PR6 runtime split

If this preflight is accepted, split PR6 runtime work into small reviewable steps:

1. **PR6a — scene-local tactical state + distance chip**: default `medium`, display-only chip, no action behavior changes.
2. **PR6b — move closer / move away preview and tests**: state transitions only, no damage rebalance.
3. **PR6c — cover/guard/exposed chip hardening**: adapt existing cover path without changing lifecycle.
4. **PR6d — suppression display-only or tiny-effect spike**: only after AP/ammo/intent/reload smoke stays green.

Do not start PR6 runtime implementation until this preflight is reviewed and merged.
