# M12.5 PR9 Real Movement / Distance Bands Preflight

## 0. Purpose and scope

This is a docs-only preflight for a future PR9 runtime slice that may turn the existing `БЛИЖЕ` / `ДАЛЬШЕ` movement affordances and distance chip into real gameplay.

This document does **not** implement movement, does **not** change runtime, does **not** change tests, and does **not** change content.

## 1. Current state

- `distanceBand` exists in `CombatScene` and currently defaults to `medium` on scene creation.
- The distance chip displays the current band as player-facing copy: `Дистанция: близко`, `Дистанция: средне`, or `Дистанция: далеко`.
- The `БЛИЖЕ` and `ДАЛЬШЕ` action buttons exist in the combat action bar.
- Movement is still preview-only.
- Movement preview does **not** mutate distance.
- Movement preview does **not** consume AP.
- Movement preview does **not** end the turn.
- The AP economy is visible in the HUD, but it is not yet fully authoritative for every combat action.
- Manual/browser QA at 1280×720 is still blocked in Codex and pending for a human environment.

## 2. PR9 goal

Future PR9 runtime work may introduce real movement with these constraints:

- `БЛИЖЕ` moves the hero one distance band toward `close`.
- `ДАЛЬШЕ` moves the hero one distance band toward `far`.
- Real movement should cost **1 AP** if/when distance mutation is approved.
- Movement must not ship as a free action once it mutates distance.
- Movement must be disabled at boundaries:
  - `close` disables `БЛИЖЕ` / closer movement;
  - `far` disables `ДАЛЬШЕ` / away movement.

## 3. Distance model

Future helper/type work should keep the model deliberately small:

```ts
type DistanceBand = "close" | "medium" | "far";
```

Rules:

- Default distance remains `medium` unless encounter metadata is separately approved later.
- Legal progression is `close <-> medium <-> far`.
- Moving closer changes `far -> medium` or `medium -> close`.
- Moving away changes `close -> medium` or `medium -> far`.
- No grid.
- No pathfinding.
- No coordinates.
- No diagonal movement.
- No spatial map.

## 4. AP decision

Real movement must follow one of only two approved states:

1. **Preview-only:** no distance mutation and no AP spend.
2. **Real movement:** distance mutates and movement costs 1 AP.

Do **not** ship distance mutation as a free action.

Because the AP economy is not fully authoritative yet, any PR9 runtime implementation must include explicit AP tests for movement:

- available AP enables movement;
- insufficient AP disables movement;
- movement decrements AP exactly once;
- movement does not spend AP when disabled or blocked by a boundary;
- movement does not accidentally change AP for attack, reload, cover, retreat, or preview refresh.

If AP spend cannot be implemented safely and tested clearly, PR9 must stop at preview/boundary planning and should not mutate distance.

## 5. UI copy

Current preview copy:

- `Ближе 1 AP: предпросмотр`
- `Дальше 1 AP: предпросмотр`
- `Дистанция: близко`
- `Дистанция: средне`
- `Дистанция: далеко`

Future real-movement copy should be explicit and compact:

- `Ближе 1 AP: готово` when closer movement is available.
- `Ближе 1 AP: недоступно` when at `close`, not hero turn, or insufficient AP.
- `Дальше 1 AP: готово` when away movement is available.
- `Дальше 1 AP: недоступно` when at `far`, not hero turn, or insufficient AP.
- Distance chip remains exactly one of:
  - `Дистанция: близко`
  - `Дистанция: средне`
  - `Дистанция: далеко`

Avoid longer explanatory copy in the HUD. Detailed reasons can be captured in tests or logs later if needed, but the first runtime slice should prioritize readability at 1280×720.

## 6. Interactions with combat systems

PR9 runtime work must preserve existing PR5–PR8 behavior unless separately approved:

- **Attack preview:** movement must not hide or corrupt attack preview copy, including AP, target, noise, and status preview text.
- **Reload/magazine:** movement must not mutate backpack reserve, runtime magazine state, reload plans, shot plans, or refund behavior.
- **Noise:** movement must not apply firearm noise. If a future movement noise delta is desired, it must be a separate approved PR; initial PR9 real movement should keep noise unchanged.
- **Status preview:** movement must not apply statuses and must not turn preview-only status copy into active chips.
- **Cover:** movement must not change the existing `Укрытие` chip behavior or hero cover flag semantics unless a separate cover-distance interaction is approved.
- **Enemy intent:** movement must not rewrite enemy intent derivation or mob AI.
- **Retreat/victory/defeat:** movement must not change scene lifecycle, sortie return, surrender, second chance, victory, or defeat flows.
- **Save/cloud persistence:** distance remains scene-local unless a later save migration is explicitly approved.
- **CombatEngine authority:** `CombatEngine` is still not the runtime authority for `CombatScene`; PR9 must not quietly migrate combat resolution into the engine.

## 7. Weapon/distance modifiers

Do not implement weapon/distance modifiers in the first real movement slice.

Future options, only after separate approval:

- melee performs better at `close`;
- pistols prefer `close` / `medium`;
- rifles prefer `medium` / `far`;
- shotguns prefer `close`;
- `far` may reduce melee effectiveness.

No damage modifier, accuracy modifier, hit chance system, range table, or content-driven weapon distance metadata should be included in the first PR9 real movement runtime slice unless separately approved.

## 8. Enemy movement

Enemy movement is deferred.

The first PR9 runtime slice must not include:

- enemy AI rewrite;
- `mobAI` distance decisions;
- enemy chase behavior;
- enemy kite behavior;
- automatic enemy distance changes;
- encounter director changes.

If enemy movement becomes necessary, it should receive its own preflight and test plan after player movement is stable.

## 9. Future PR split

Recommended PR9 split:

1. **PR9a — pure distance helper/types.** Add minimal pure helpers for bands, labels, boundaries, and next/previous movement. No scene wiring.
2. **PR9b — display hardening / boundary preview.** Keep movement preview-only, but make boundary states explicit and test HUD copy.
3. **PR9c — real movement with AP spend.** Mutate distance by one band and decrement AP exactly once, with strict tests.
4. **PR9d — hardening.** Add regression coverage around reload/magazine/noise/status/cover/intent/lifecycle preservation.
5. **PR9 closeout.** Document what shipped and what remains deferred.

## 10. Tests required later

Future runtime PRs must include tests for:

- pure helper next/previous band behavior;
- boundary disabled behavior at `close` and `far`;
- movement costs 1 AP when it mutates distance;
- insufficient AP disables movement;
- movement changes exactly one band per action;
- movement does not mutate backpack reserve;
- movement does not mutate runtime magazine state;
- movement does not mutate current noise unless separately approved;
- movement does not mutate active statuses or status preview state;
- movement does not apply status effects;
- attack still works after movement;
- reload still works after movement;
- cover still works after movement;
- retreat/victory/defeat lifecycle remains unchanged;
- no save/content/platform files change.

## 11. Anti-scope

PR9 must not include:

- grid movement;
- pathfinding;
- coordinates;
- enemy AI movement;
- mob chase/kite logic;
- weapon damage modifiers;
- accuracy system;
- content metadata edits;
- save migration;
- cloud/local save schema changes;
- CombatEngine migration;
- real movement if AP cost is not implemented and tested.

## 12. No-go conditions

Stop the runtime PR if any of these become true:

- real movement would be free;
- AP cannot be safely decremented and tested;
- UI becomes overcrowded at 1280×720;
- movement requires save schema changes;
- movement requires content metadata changes;
- movement requires enemy AI rewrite;
- distance modifiers sneak into the first movement slice;
- movement breaks reload/magazine/refund behavior;
- movement breaks noise/status/cover/intent preview behavior;
- movement changes retreat/victory/defeat lifecycle.
