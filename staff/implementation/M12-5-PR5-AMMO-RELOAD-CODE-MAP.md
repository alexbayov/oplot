# M12.5 PR 5.0 — Ammo / Reload Code Map

> Status: docs-only audit/code map before PR5 implementation.
>
> This document does **not** implement ammo/reload, does **not** change runtime behavior, does **not** modify `CombatScene`, `CombatEngine`, `ItemRegistry`, content, or save schema.

## 1. Exact current attack / ammo path

### Hero action entry

| Step | File | Function / method | What happens |
|---|---|---|---|
| Hero attack button | `src/scenes/CombatScene.ts` | `create()` | The `АТАКА` button is wired to `this.onHeroAttack()`. |
| State gate | `src/scenes/CombatScene.ts` | `onHeroAttack()` | Returns immediately unless `this.state === "awaiting_hero"`. |
| Target selection | `src/scenes/CombatScene.ts` | `onHeroAttack()` | Finds the first mob with `state.hp > 0` and `!state.fled`; if none exists, calls `advanceTurn()`. |
| Equipped weapon id | `src/scenes/CombatScene.ts` | `onHeroAttack()` | Reads `GameState.player.equipped_weapon_id`. |
| Weapon item resolution | `src/scenes/CombatScene.ts` | `onHeroAttack()` | Resolves `GameState.data.items[player.equipped_weapon_id]`; if missing, returns without action. |
| Melee/ranged classification | `src/scenes/CombatScene.ts` | `onHeroAttack()` | Calls `getMeleeWeaponStats(weaponItem)` and `getRangedWeaponStats(weaponItem)`. |
| Legacy ammo metadata read | `src/systems/combat.ts` | `getRangedWeaponStats(item)` | Reads ranged legacy stats, including `ammo_id` and `ammo_per_shot`, when the item has ranged weapon stats. |
| Reserve ammo check | `src/scenes/CombatScene.ts` | `onHeroAttack()` | For ranged weapons, calls `countInStacks(player.backpack, ranged.ammo_id)`. |
| Ammo spend | `src/scenes/CombatScene.ts` | `onHeroAttack()` | If `ammoHave >= ranged.ammo_per_shot`, mutates `player.backpack` with `removeFromStack(player.backpack, ranged.ammo_id, ranged.ammo_per_shot)`. |
| No-ammo fallback | `src/scenes/CombatScene.ts` | `onHeroAttack()` | If ammo is insufficient, logs `Нет патронов — удар прикладом.` and uses weak fallback damage `{ damage_min: 1, damage_max: 2 }`. |
| Non-ranged fallback | `src/scenes/CombatScene.ts` | `onHeroAttack()` | If weapon is neither melee nor ranged by current helpers, uses weak fallback damage `{ damage_min: 1, damage_max: 2 }`. |
| Damage application | `src/scenes/CombatScene.ts` | `onHeroAttack()` | Calls `applyAttack(weaponStats, targetDefense, target.state.hp, undefined, heroMods.damage_multiplier)`. |
| Combat log | `src/scenes/CombatScene.ts` | `onHeroAttack()` / `log()` | Logs `Герой бьёт ...` after applying damage. The no-ammo fallback log can be overwritten as the last visible line by the later hit log. |
| Turn advance | `src/scenes/CombatScene.ts` | `onHeroAttack()` | Calls `updateDisplay()`, sets `state = "resolving_mobs"`, and schedules `advanceTurn()`. |

### Inventory helpers used by the current path

| File | Function | Current role |
|---|---|---|
| `src/state/GameState.ts` | `countInStacks(stacks, itemId)` | Counts reserve ammo stacks in `player.backpack`. |
| `src/state/GameState.ts` | `removeFromStack(stacks, itemId, count)` | Returns a new stack array after ammo or consumable removal. |
| `src/state/GameState.ts` | `addToStack(stacks, itemId, count)` | Used later for loot/stash merge, not current ammo firing. |

### After-combat state persistence / return path

| Step | File | Function / method | What happens |
|---|---|---|---|
| Victory transition | `src/scenes/CombatScene.ts` | `endCombatVictory()` | Generates mob/zone loot, grants XP, increments `fights_completed`, sets `pending_loot`, and starts `LootScene`. |
| Retreat / defeat end | `src/scenes/CombatScene.ts` | `endSortie(reason)` | Tracks combat outcome, optionally applies loot loss, merges backpack to stash, restores HP, updates radio trust, clears sortie, calls `saveToCloud()`, and starts `BaseScene`. |
| Backpack merge | `src/scenes/CombatScene.ts` | `mergeBackpackToStash()` | Adds every `player.backpack` stack into `GameState.baseStash`, then clears backpack. |
| Cloud persistence call | `src/scenes/CombatScene.ts` | `endSortie(reason)` | Calls `void saveToCloud()` after return/defeat state mutation. PR5 must not touch this. |

## 2. Current data model

### Player state fields

| Field | File / type area | Current meaning for ammo/reload |
|---|---|---|
| `player.equipped_weapon_id` | `src/state/GameState.ts` default player state | String item ID used by `CombatScene` to find the equipped legacy weapon item. |
| `player.equipped_armor_id` | `src/state/GameState.ts` default player state | Used for defense, not ammo. Mentioned because combat attack/defense is nearby. |
| `player.backpack` | `src/state/GameState.ts` default player state / `InventoryStack[]` | Stack array used as reserve ammo source, medkit source, loot carrier, and return-to-stash input. |
| `GameState.baseStash` | `src/state/GameState.ts` | Receives backpack contents on return/defeat lifecycle. Not used directly for firing. |

`InventoryStack` shape is `{ item_id: string; count: number }`. Current ammo spend removes from this stack shape directly.

### Item fields relevant to current and future ammo

| Data | Where | Notes |
|---|---|---|
| `item.type` | `content/items.json` / `src/types` | Legacy `weapon_ranged` drives `getRangedWeaponStats()`. |
| `item.stats.ammo_id` | `content/items.json` legacy stats | Current `CombatScene` uses this as reserve ammo item ID when present. |
| `item.stats.ammo_per_shot` | `content/items.json` legacy stats | Current `CombatScene` uses this as the direct backpack spend amount. |
| `itemClass`, `caliber`, `magazineSize` | M11 item model via `ItemRegistry` | Future-facing model used by registry/engine tooling, not current live scene firing source of truth. |
| `durability`, `durability_max`, `breaksInto` | content + `ItemRegistry` + `durability.ts` | Exists for weapon lifecycle, but current `CombatScene.onHeroAttack()` does not decrement weapon durability. |
| magazine parts such as `*_magazine` | `content/items.json` | Content contains magazine-like parts/mods, but they are not live magazine state. |

### Magazine-like fields already present

| File | Field / function | Current status |
|---|---|---|
| `src/systems/combatTypes.ts` | `CombatActor.magazine`, `CombatActor.magazineMax` | Future actor state shape; not live `CombatScene` source of truth. |
| `src/systems/combatAdapter.ts` | `CombatAdapterPlayerInput.magazine`, `magazineMax` | Snapshot adapter input fields; optional and read-only. |
| `src/systems/combatEngine.ts` | `createActor({ magazineMax })` | Initializes engine actor magazine fields; not wired into live scene. |
| `src/systems/combatEngine.ts` | `resolveHeroAction("reload")` | Sets actor magazine to magazine max; does not consume backpack reserve ammo. |
| `src/systems/combatEngine.ts` | `executeAttack()` | Decrements engine actor magazine; not the current `CombatScene` attack path. |
| `src/state/ItemRegistry.ts` | `computeWeaponStats()` | Computes `magazineSize` from weapon + mod effects; useful for PR5 helper design. |

### Ammo content location

- Ammo and ranged metadata live in `content/items.json`.
- Current content has legacy `weapon_ranged` entries; some have `stats.ammo_id` / `stats.ammo_per_shot`, while many rely on M11-style caliber or adapted registry fallback.
- Content contract tests already check that ranged weapons have either resolving legacy ammo metadata or M11 caliber fallback.

## 3. Current tests touching ammo / combat

### Existing coverage

| Test file | Coverage today | Gap |
|---|---|---|
| `src/scenes/__tests__/CombatScene.smoke.test.ts` | Boots seeded combat, verifies attack damages target, cover, heal/no-heal, retreat, victory, defeat, AP preview, intent display. | Seed weapon is melee; does not cover ranged ammo consumption or no-ammo fallback. |
| `src/systems/__tests__/combat.test.ts` | Covers low-level damage, initiative, defense, `applyAttack()`, and legacy mob flee behavior. | Does not cover backpack ammo spend or reload. |
| `src/systems/__tests__/combatEngine.test.ts` | Covers engine-side attack, magazine decrement, empty magazine failure, reload, durability decrement/break in engine state. | Engine is not live scene source of truth; reload does not consume backpack reserve ammo. |
| `src/systems/__tests__/combatAdapter.test.ts` | Covers snapshot actor mapping and magazine default/null fields. | Adapter only; no ammo lifecycle or inventory mutation. |
| `src/systems/__tests__/durability.test.ts` | Covers pure durability helpers and break results. | Not wired to live `CombatScene` attacks. |
| `src/state/__tests__/combatContentContracts.test.ts` | Validates ranged weapons have legacy ammo or M11 caliber fallback; validates weapon/ammo references through `ItemRegistry`. | Does not define canonical reload/magazine behavior or reserve calculations. |
| `src/scenes/__tests__/CombatScene.smoke.test.ts` heal tests | Covers `removeFromStack()` mutation for medkit consumption in backpack. | Not ammo-specific; useful pattern for inventory mutation assertions. |

### Missing or weak coverage before implementation

- No scene smoke for ranged weapon with enough ammo.
- No scene smoke for ranged weapon with missing ammo fallback.
- No test proving current direct backpack ammo spend amount for `ammo_per_shot`.
- No no-duplication/no-loss tests for magazine + reserve state.
- No pure reload helper tests.
- No UI assertion for magazine/reserve/reload disabled reasons.

## 4. Gap list before PR5 implementation

Before implementing ammo/reload, add or plan coverage for:

- Pure helper tests for magazine/reserve calculations.
- Reload disabled reasons:
  - no compatible ammo;
  - magazine full;
  - no ranged weapon;
  - no magazine capacity;
  - not enough AP if reload becomes AP-gated.
- Runtime-only magazine state design.
- Reserve ammo lookup by legacy `ammo_id` and/or M11 caliber.
- Partial reload behavior when reserve is insufficient.
- Empty magazine ranged action behavior:
  - block attack; or
  - explicit weak fallback chosen by design.
- UI assertions for magazine/reserve/reload copy.
- No-duplication tests.
- No-loss tests.
- No-mutation tests for pure helpers.
- Compatibility tests for legacy `ammo_id` / `ammo_per_shot` and M11 caliber fallback.

## 5. Recommended PR5 implementation split

### PR5a — Pure ammo helper + tests only

Allowed scope:

- Add a pure `combatAmmo` helper module.
- Add helper unit tests.
- No `CombatScene` wiring.
- No runtime behavior changes.
- No content/save/schema changes.

Expected helper responsibilities:

- Resolve compatible reserve ammo.
- Calculate magazine/reserve display state.
- Calculate reload amount and inventory delta.
- Return disabled reason codes.
- Prove no mutation of input weapon/inventory snapshots.

### PR5b — CombatScene preview display only

Allowed scope:

- Render magazine/reserve/reload preview in `CombatScene`.
- Show reload disabled reasons.
- Keep reload non-clickable or explicitly unavailable if action wiring is not safe.
- No reload action execution.
- Existing attack behavior remains unchanged.

Required proof:

- Scene smoke verifies preview copy.
- AP preview and enemy intent smoke still pass.
- Existing attack/cover/heal/retreat/victory/defeat smoke still pass.

### PR5c — Reload action wiring if safe

Allowed scope only if PR5a/PR5b are green:

- Add reload action path using the pure helper inventory delta.
- Consume reserve ammo from backpack.
- Update runtime-local magazine state.
- Cost AP only if the current AP model is ready for safe consumption; otherwise keep reload outside player-facing actions.
- No save schema change.

Required proof:

- Full reload test.
- Partial reload test.
- Wrong/missing ammo disabled test.
- No ammo duplication/loss test.

### PR5d — Attack consumes magazine instead of backpack directly

Only after parity tests prove safety:

- Ranged attack spends magazine ammo.
- Backpack reserve is only changed by reload.
- Empty magazine behavior is explicit.
- Old direct `ammo_id` / `ammo_per_shot` backpack spend is removed or kept only as documented fallback.

Required proof:

- Current old outcomes remain stable where intended.
- No hidden inventory loss.
- No hidden ammo duplication.
- No lifecycle/platform/save/content files changed.

## 6. High-risk lines / functions

| Risk area | File | Function / line area | Why risky |
|---|---|---|---|
| Direct ammo mutation | `src/scenes/CombatScene.ts` | `onHeroAttack()` around `removeFromStack(player.backpack, ranged.ammo_id, ranged.ammo_per_shot)` | Incorrect replacement can duplicate or delete ammo. |
| No-ammo fallback | `src/scenes/CombatScene.ts` | `onHeroAttack()` around `Нет патронов — удар прикладом.` | This is current behavior; changing it silently changes player-facing outcomes. |
| Combat log order | `src/scenes/CombatScene.ts` | `onHeroAttack()` and `log()` | No-ammo fallback log can be followed by hit log; tests need to account for visible/log ordering. |
| Backpack healing mutation | `src/scenes/CombatScene.ts` | `onHeroHeal()` | Uses same `removeFromStack()` style; do not regress item consumption while adding ammo helpers. |
| Return/defeat lifecycle | `src/scenes/CombatScene.ts` | `endSortie()`, `mergeBackpackToStash()` | Touching these risks loot/stash/save behavior. |
| Cloud persistence | `src/scenes/CombatScene.ts` | `endSortie()` calling `saveToCloud()` | Ammo implementation must not require cloud save changes. |
| Engine magazine state | `src/systems/combatEngine.ts` | `resolveHeroAction("reload")`, `executeAttack()` | Existing engine semantics do not consume backpack reserve ammo; do not assume parity. |
| Actor magazine fields | `src/systems/combatTypes.ts` | `CombatActor.magazine`, `magazineMax` | Future shape only; not current runtime truth. |
| Registry magazine size | `src/state/ItemRegistry.ts` | `computeWeaponStats()` | Useful helper, but touching registry can expand scope. |
| Durability helpers | `src/systems/durability.ts` | `damageWeapon()` and break helpers | Durability is related but should not be bundled with PR5 ammo/reload. |
| Content metadata gaps | `content/items.json` | `weapon_ranged`, `ammo_id`, `ammo_per_shot`, caliber/magazine fields | Missing metadata must be handled by fallback/tests, not mass content edits in PR5. |

## 7. No-go conditions for implementation

Stop PR5 implementation if any of these become true:

- A save schema change is required.
- A content rewrite or mass item migration is required.
- Cloud save / local save behavior must be changed.
- Ammo duplication risk cannot be proven resolved by tests.
- Reserve ammo loss risk cannot be proven resolved by tests.
- Current no-ammo fallback behavior is unclear or product has not decided block-vs-fallback.
- Tests cannot prove no inventory loss.
- Tests cannot cover legacy `ammo_id` and M11 caliber fallback paths.
- Implementation requires touching loot/return lifecycle.
- Implementation requires making `CombatEngine` the runtime source of truth in the same PR.

## 8. Minimum evidence before coding PR5a

Before any runtime implementation starts, collect or add:

- A list of current ranged weapons with legacy `ammo_id` / `ammo_per_shot` or M11 caliber fallback.
- A test fixture for a ranged weapon with enough reserve ammo.
- A test fixture for a ranged weapon with insufficient reserve ammo.
- A test fixture for wrong ammo in backpack.
- A test fixture for missing magazine metadata fallback.
- Expected Russian disabled reason copy for reload and empty magazine.
