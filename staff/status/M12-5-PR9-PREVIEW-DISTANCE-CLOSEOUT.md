# M12.5 PR9 — Preview Distance Boundary Display Closeout

## 1. Status
- PR9 preview distance boundary display layer is fully implemented and merged.
- Pure distance helpers exist in `src/systems/combatDistance.ts`.
- `CombatScene` correctly displays boundary disabled copy (`Ближе 1 AP: уже близко` / `Дальше 1 AP: уже далеко`).
- Movement remains preview-only.
- No real movement is executed.
- No AP consumption occurs on movement.
- No turn ending happens on movement clicks.

## 2. Covered
- **Medium Default**: Distance band initializes to `medium` on combat scene instantiation.
- **Close/Far Boundary Copy**: Dynamic UI updates format correctly to alert the player of boundaries.
- **Boundary Click Logs**: Blocked movements write distinct `Манёвр недоступен: уже близко.` / `уже далеко.` logs.
- **Valid Clicks Preview**: Available directions log the standard preview-only disclaimer without mutating game states.
- **Repeated Refresh Non-Mutation**: Displays and action previews do not accumulate or leak resources.
- **Interaction with Combat Systems**: Ammo, reload, noise delta, cover flag, status preview, and enemy intents remain completely unaffected by distance calculations.
- **Layout Regression**: Verified all 7 action buttons, AP layout, ammo lines, distance chip, cover status, noise chip, and intent render safely under resolution specs.

## 3. Known Limitations
- Distance state is scene-local and is not persisted in saves or across map levels.
- Movement buttons do not mutate distance bands or consume action points yet.
- AP economy remains a visual layout helper and is not an authoritative turn regulator.
- Desktop pointer/hover handlers are absent; interaction remains landscape touch/mobile first.
- Visual/layout validation at 1280×720 requires real browser/manual checking.

## 4. Decision Note
- **Deferred Real Movement**: Moving distance bands and AP-spend mutations are deferred.
- **AP/Turn Authority Pre-requisite**: Do not implement real movement until AP/turn economics (including turn resolution loop and end-turn signals) are decided.
- No end-turn button or AP rewrites are sneaked into this PR.
- No distance-based weapon damage or accuracy modifiers are added.

## 5. Next Options
- **Option A**: Manual browser QA / UI layout pass at 1280×720.
- **Option B**: AP/turn semantics preflight (designing turn resolution and AP enforcement).
- **Option C**: PR9d real movement implementation (only after Option B is approved).

### Recommendation
Pause before real movement; do manual human QA or AP/turn semantics memo first.
