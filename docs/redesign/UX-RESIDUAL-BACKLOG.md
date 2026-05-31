# UX Residual Backlog — post #79

> Date: 2026-05-30
> Scope: decision note for GitHub issue #79 (`UI/UX redesign: юзабельный интерфейс`).
> Rule: no gameplay/balance changes here; this is a QA/backlog artifact.

## Recommendation

**Recommendation: keep issue #79 closed.**

The original #79 scope was to replace the placeholder/text-rectangle UI with a usable visual hierarchy, readable buttons/panels, item grids/cards, painted/landscape scene presentation, hover/touch feedback, and scene-specific UI treatment. Current `main` has enough evidence that the original redesign scope is closed:

- Redesign milestone is recorded as closed in `staff/PLAN.md`: landscape 1280×720, painted backgrounds/icons, painted UI helpers, rich inventory tooltips, and zone unlock fixes.
- `README.md` and `staff/CONTEXT.md` now identify landscape 1280×720 as the current runtime target.
- M10 added painted world map, painted base scene/hotspots, encounter UX, return ritual, and telemetry/scene-stack foundation.
- M11/M12 implementation is merged, but product acceptance is still pending; any remaining UX work should be tracked as **M11/M12 QA hardening / release readiness**, not as the original broad UI redesign issue.

## What closed the original scope

| Original #79 concern | Current evidence in repo | Status |
|---|---|---|
| Buttons indistinguishable from text / no hierarchy | Shared UI helpers and components under `src/ui/`, scene headers, panels, large buttons, landscape layout tokens | Closed for original redesign |
| Inventory as unreadable text list | `InventoryScene` uses item cards/grid-style presentation and rich tooltip/card helpers | Closed for original redesign |
| Map as plain list/cards | `MapScene` is a painted world map with interactive pins/tooltips | Closed for original redesign |
| Base layout was placeholder | `BaseScene` is a painted refuge scene with interactive hotspots/tooltips | Closed for original redesign |
| No hover/active/touch feedback | UI helpers/scenes use interactive states/tweens/tooltips/hotspots | Closed for original redesign |
| Mobile/landscape target unclear | Runtime target is now landscape 1280×720 with `Scale.FIT` | Closed for original redesign |
| Combat needed better readability | Combat has painted background, hero/enemy panels, action bar, HP/info panels; M12 acceptance still must verify readability | Residual QA polish, not #79 blocker |

## Draft GitHub issue comment

```md
Issue #79 can remain closed.

Why: the original broad UI/UX redesign request (“text and rectangles” → usable interface) has been addressed by the Redesign + M10 work already present in `main`:

- Redesign closed: landscape 1280×720, painted backgrounds/icons, painted UI helpers, rich inventory tooltips, zone unlock fixes.
- M10 closed: painted world map with pins/tooltips, painted base scene with hotspots, encounter UX, return ritual, scene-stack/telemetry foundation.
- Current repo status: M11/M12 implementation is merged, but product acceptance is pending QA hardening.

I recommend keeping #79 closed and tracking remaining work as residual UX QA polish under M11/M12 release readiness instead of reopening the original broad redesign issue.

Residual checklist to track separately:

1. Combat readability in first 10 minutes: HP/status/action-bar clarity on 1280×720 mobile landscape.
2. M12 status/ability tooltips: readable labels, durations, and effect explanations.
3. Skill tree touch targets and prerequisite feedback.
4. Inventory/craft tier badges and durability/mod/ammo metadata readability.
5. Yandex ad/IAP/cloud-save UI states: loading, error, unavailable/offline fallback.
6. Long Russian strings/clipping pass across Base/Map/Combat/Inventory/Craft/SkillTree.
7. Screenshot evidence pass for release checklist.

Suggested follow-up issue title if needed: `UX QA polish / residual issues`.
```

## Residual UX QA checklist

Use this list only for QA hardening/release readiness. Do **not** reopen broad redesign scope unless one of these fails as a release blocker.

### UX-1 — Combat first-10-minutes readability

- [ ] On mobile landscape 1280×720, action bar buttons are readable and tappable.
- [ ] Hero/enemy HP and current turn are understandable without reading the full combat log.
- [ ] Combat log does not overlap critical controls.
- [ ] Defeat/victory/retreat transitions have visible feedback and do not look like dead clicks.

### UX-2 — M12 status / ability feedback

- [ ] Status effects show visible labels/icons or text that explains what changed.
- [ ] Duration/stack information is readable where statuses persist.
- [ ] Ability/signature actions provide enough feedback to understand who acted and what happened.
- [ ] Damage, heal, durability, ammo, and modifier effects are visible in combat feedback.

### UX-3 — Skill tree usability

- [ ] Skill nodes meet tap target expectations on mobile landscape.
- [ ] Locked prerequisites are visibly different from unlocked/available nodes.
- [ ] Failed unlock attempts show a clear reason: missing prerequisite, level, points, or other requirement.
- [ ] Persistence/save reload does not make the UI look inconsistent.

### UX-4 — Inventory / craft / item metadata

- [ ] Tier badges T1–T5 are readable on item cards.
- [ ] Durability/mod/ammo/caliber metadata does not overflow cards/tooltips.
- [ ] Generic release-safe names fit in common item-card widths.
- [ ] Craft ingredient/result cards clearly distinguish enough/missing resources.

### UX-5 — Map / base hotspot clarity

- [ ] Base hotspots have clear hover/tap labels and cannot be confused with background art.
- [ ] Map pins/tooltips remain readable for locked/unlocked/boss/daily states.
- [ ] Long zone names/descriptions do not clip on 1280×720.

### UX-6 — Yandex platform UI states

- [ ] Cloud save loading/error/offline states are understandable and non-blocking.
- [ ] Rewarded ad unavailable/error states explain whether reward was granted or not.
- [ ] Interstitial transitions do not hide important post-sortie state changes.
- [ ] IAP purchase, restore/unprocessed purchase, and unavailable catalog states have clear feedback.

### UX-7 — Text overflow / localization pass

- [ ] Long Russian strings fit in scene headers, buttons, cards, and tooltips.
- [ ] No critical labels are hidden by safe-area, banner, or Scale.FIT resizing.
- [ ] Font hierarchy remains consistent: title/body/action.

### UX-8 — Release evidence

- [ ] Capture screenshots for Base, Map, Sortie, Combat, Loot, Return, Inventory, Craft, Radio, SkillTree/Progression.
- [ ] Capture one short mobile landscape smoke video covering base → sortie → combat → loot/return.
- [ ] Attach known residuals to M11/M12 QA acceptance, not to #79.

## Non-goals

- No gameplay logic changes.
- No balance changes.
- No new mechanics.
- No broad redesign reset; this is polish/QA only.
