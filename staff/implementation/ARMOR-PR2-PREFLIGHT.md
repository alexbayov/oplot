# ARMOR-PR2 Preflight — armor stat delta UI

## Scope

Schema-neutral PR. Builds on ARMOR-PR1 `resolveEquippedArmor`; no save or content schema changes.

## Code-grounded seams

- `resolveEquippedArmor` is the single-source armor resolver in `src/systems/armorAffixes.ts:78-103`.
- Inventory armor cycling currently renders the plate slot and swaps the next armor item in `src/scenes/InventoryScene.ts:350-369`.
- Weapon stat delta precedent lives in `src/systems/craftedWeapons.ts:214-229`: pure helper returns candidate/equipped values plus per-field delta.

## Auto-GO defaults selected

- Add pure `armorStatDelta(candidate, equipped, items)` in `armorAffixes.ts` and have InventoryScene render from that helper.
- Show carry/slots/scavenge/def deltas for the next armor swap candidate.
- Zero affixes stay zero deltas.

## Invariants

- SINGLE-SOURCE: UI delta calls `resolveEquippedArmor`; no duplicate affix summation in scene code.
- Schema-neutral: SAVE_VERSION remains unchanged.
