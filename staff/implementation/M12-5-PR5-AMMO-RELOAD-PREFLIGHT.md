# M12.5 PR 5 Preflight — Ammo / Reload Canonicalization

> Status: docs-only preflight for the future PR 5 implementation.
>
> This document does **not** implement ammo/reload, does **not** change runtime behavior, does **not** modify `CombatScene`, does **not** modify `CombatEngine`, and does **not** change content, `ItemRegistry`, or save schema.

## 1. Current ammo / combat path snapshot

Current player-facing combat is still driven by `src/scenes/CombatScene.ts`. `CombatEngine` and `combatTypes` already contain future-facing magazine/reload fields, but they are not the runtime source of truth for the live scene.

### Equipped weapon lookup

- `CombatScene.onHeroAttack()` reads `GameState.player.equipped_weapon_id`.
- It resolves that ID through `GameState.data.items[player.equipped_weapon_id]`.
- It then checks legacy item stats via `getMeleeWeaponStats()` and `getRangedWeaponStats()` from `src/systems/combat.ts`.
- If no weapon item resolves, the current attack path returns early.

### Current ammo check and spend

The current live scene uses legacy backpack ammo, not weapon-instance magazine state.

- For ranged weapons, `getRangedWeaponStats(weaponItem)` provides `ammo_id` and `ammo_per_shot` when those fields exist on the legacy item stats.
- `CombatScene` checks reserve ammo with `countInStacks(player.backpack, ranged.ammo_id)`.
- If reserve ammo is at least `ammo_per_shot`, `CombatScene` spends ammo immediately with `removeFromStack(player.backpack, ranged.ammo_id, ranged.ammo_per_shot)`.
- If reserve ammo is missing, the current behavior logs `Нет патронов — удар прикладом.` and uses a weak fallback damage range `{ damage_min: 1, damage_max: 2 }`.
- This spend happens inside the attack resolution path, before the existing damage roll is applied.

### Current weapon / ammo UI

- `CombatScene` currently renders HP, weight, enemy HP, AP preview, and enemy intent labels.
- It does not yet render magazine / reserve ammo / reload availability as a canonical combat UI element.
- The AP preview line includes action costs and disabled reasons for existing actions, but reload is not player-facing in `CombatScene` yet.

### Current durability usage

- `src/systems/durability.ts` has pure helpers for weapon durability damage and break consequences.
- `src/systems/combatEngine.ts` has future-facing durability decrement during engine attack resolution.
- Current `CombatScene.onHeroAttack()` does **not** route weapon attacks through `durability.ts` and does **not** decrement weapon-instance durability.
- PR 5 must avoid bundling a durability rewrite with ammo/reload canonicalization.

### Inventory / backpack / stash in combat

- Player combat inventory is represented by `GameState.player.backpack` stacks.
- Current ranged attacks spend ammo directly from `player.backpack` when legacy ammo stats exist.
- Healing also consumes consumables from `player.backpack`.
- Defeat and return flows merge backpack into `GameState.baseStash` or apply loot loss through existing lifecycle functions.
- PR 5 must not alter stash merge, loot return, defeat, cloud save, or sortie lifecycle.

### Future-facing engine/type pieces already present

These pieces exist, but are not live `CombatScene` source of truth:

- `CombatActor.equipped: WeaponInstance | null`.
- `CombatActor.magazine: number | null`.
- `CombatActor.magazineMax: number | null`.
- `ActionKind` includes `reload`.
- `CombatEngine.resolveHeroAction()` has a reload path that fills actor magazine to `magazineMax`.
- `CombatEngine.executeAttack()` decrements magazine and durability for engine actors.
- `ItemRegistry.computeWeaponStats()` can compute magazine size from M11-style weapon/mod data.

PR 5 must treat these as future-compatible scaffolding, not proof that runtime magazine semantics are already canonical in the player-facing scene.

## 2. Canonical future rule for PR 5

PR 5 should establish one player-facing ammo/reload rule and keep it small enough to test safely.

### Canonical rule

- Ranged weapons use a **magazine**.
- Backpack stores **reserve ammo** by compatible caliber / ammo ID.
- Firing a ranged weapon consumes **magazine ammo**, not reserve ammo directly.
- Reload consumes compatible reserve ammo from `GameState.player.backpack`.
- Reload costs AP.
- Empty magazine blocks ranged attack or uses an explicitly selected weak fallback; it must not silently change behavior.
- UI must show:
  - current magazine ammo;
  - magazine capacity;
  - reserve ammo count;
  - reload availability;
  - disabled reason when reload or ranged attack cannot be used.
- No save migration unless explicitly approved in a separate risk PR.

### Copy / UI rule

Player copy must be truthful and compact:

- `Магазин 3/8 · запас 12`.
- `Перезарядка 1 AP: готово`.
- `Перезарядка 1 AP: нет патронов`.
- `Атака 1 AP: пустой магазин`.

Exact wording can change in implementation, but the UI must expose the state clearly before the click.

## 3. Compatibility strategy

PR 5 must preserve the old model until the new model is fully covered by tests.

### Legacy content compatibility

- Existing legacy ranged items may use `stats.ammo_id` and `stats.ammo_per_shot`.
- Some current content may rely on M11 `caliber` / magazine metadata adapted through `ItemRegistry` rather than legacy `ammo_id`.
- Some legacy/hybrid entries may have incomplete magazine metadata.
- Content contract tests already allow either resolving legacy `ammo_id` or M11 caliber fallback for ranged weapons.

### Runtime compatibility

- Existing inventories may not have any persistent magazine state.
- If a weapon instance has no magazine data, PR 5 must use safe temporary runtime defaults.
- Safe defaults must be deterministic and test-covered; examples:
  - derive magazine capacity from `ItemRegistry.computeWeaponStats()` when a M11 weapon instance exists;
  - derive one-shot temporary magazine from legacy `ammo_per_shot` only if no better data exists;
  - display an explicit fallback reason if magazine capacity cannot be inferred.
- First implementation should keep magazine state runtime-local unless a separate save/schema risk PR is approved.

### Save / cloud compatibility

- No persistent schema change in first implementation.
- No save migration in PR 5.
- No cloud/local save behavior change.
- No automatic conversion of backpack ammo into weapon-instance magazine state in saved data.

### Content compatibility

- No content rewrite.
- No mass rename.
- No item ID migration.
- No `ItemRegistry` rewrite in PR 5 unless a tiny read-only helper is explicitly needed and covered by tests.

## 4. Implementation proposal for future PR 5

Future PR 5 should be split into small reviewable pieces inside one PR or into multiple smaller PRs if any step expands.

### Step 1 — Pure ammo helper module

Add a pure helper module, for example `src/systems/combatAmmo.ts`, with no `GameState` mutation:

- resolve compatible reserve ammo for a weapon;
- calculate magazine / reserve display state;
- calculate reload amount;
- return disabled reasons for reload and ranged attack;
- return the planned inventory delta without applying it.

### Step 2 — Unit tests for calculations

Before wiring UI, add tests for:

- full reload;
- partial reload;
- wrong ammo;
- missing ammo;
- empty magazine attack disabled / fallback selection;
- no mutation of input stacks or weapon snapshot.

### Step 3 — Reload preview disabled reasons

Extend AP/action preview only after helpers are stable:

- show magazine and reserve;
- show reload cost;
- show reload disabled reason;
- do not execute reload yet.

### Step 4 — Minimal CombatScene display wiring

Wire display into `CombatScene` with minimal surface area:

- no turn-loop changes;
- no damage formula changes;
- no victory/defeat/loot/return changes;
- no cloud/platform changes;
- keep AP preview and enemy intent labels readable.

### Step 5 — Reload action only if safe

Only after preview and helper tests are green:

- add a reload action path if it can be implemented without lifecycle changes;
- consume reserve ammo through a single tested inventory-delta helper;
- update runtime-local magazine state;
- preserve old attack outcome until tests prove parity.

### Step 6 — Preserve old attack outcome until parity is proven

Do not remove the current legacy `ammo_id` / `ammo_per_shot` fallback until tests prove:

- equivalent ammo availability in supported content;
- no ammo duplication;
- no ammo loss;
- clear empty-magazine behavior;
- existing CombatScene smoke still passes.

## 5. Explicit anti-scope

PR 5 must not include:

- Content rewrite.
- Save migration.
- Cloud save changes.
- Local save schema changes.
- Loot/return lifecycle changes.
- Durability rewrite.
- Weapon instance schema migration.
- Enemy intent changes.
- Distance bands.
- Noise meter or sortie-risk hooks.
- Status mechanics or status overhaul.
- Balance retuning.
- Yandex SDK / ads / IAP / platform changes.
- `CombatEngine` runtime authority switch.
- `ItemRegistry` rewrite.
- Mass content rename or real-weapon naming changes.

## 6. Required tests for future PR 5

### Ammo helper unit tests

- Ranged weapon with enough reserve ammo can reload to magazine capacity.
- Partial reload works when reserve ammo is insufficient.
- Wrong ammo gives a disabled reason.
- Missing ammo gives a disabled reason.
- Empty magazine blocks ranged attack or the selected weak fallback is explicit.
- Ammo is not duplicated between magazine and reserve.
- Reserve ammo is not silently lost.
- Pure helpers do not mutate input weapon snapshots or inventory stacks.

### Scene smoke / integration tests

- Existing attack smoke still passes.
- Existing cover smoke still passes.
- Existing heal/no-heal smoke still passes.
- Existing retreat smoke still passes.
- Existing victory/defeat lifecycle smoke still passes.
- AP preview tests still pass.
- Enemy intent smoke tests still pass.
- Reload preview renders truthful magazine/reserve/disabled copy.

### Content contract tests

- Ranged weapons have either legacy ammo metadata or documented M11 caliber fallback.
- Ammo items referenced by legacy `ammo_id` resolve.
- Caliber-compatible reserve ammo can be found or the fallback is explicitly documented.
- Missing metadata fails a test with an actionable message or is listed as intentional fallback.

## 7. Risks

### Inventory corruption

Reload changes both magazine state and backpack stacks. A bad implementation can duplicate ammo, delete reserve ammo, or leave negative counts.

Mitigation: use pure inventory-delta helpers and no-mutation tests before applying deltas.

### Save / schema pressure

Persistent magazine state is tempting, but adding it can force save migration and cloud compatibility work.

Mitigation: PR 5 starts with runtime-local state and no schema migration unless separately approved.

### Duplicate ammo state between scene and engine

`CombatScene` currently uses backpack ammo directly while `CombatEngine` already has actor magazine fields.

Mitigation: define canonical helper semantics first and do not make `CombatEngine` runtime-authoritative in PR 5.

### Magazine / backpack mismatch

Reserve ammo by `ammo_id` and future caliber matching can disagree if content metadata is incomplete.

Mitigation: keep compatibility fallbacks explicit and test content contracts.

### UI clutter near AP / intent preview

AP preview and enemy intent already use screen space. Ammo UI can overload the 1280×720 layout.

Mitigation: use compact copy and avoid adding multiple long lines.

### Durability interaction

Durability and ammo both belong to weapon feel, but combining them increases blast radius.

Mitigation: no durability rewrite in PR 5; only document future interaction points.

### Content metadata gaps

Some ranged items may lack legacy ammo metadata or M11 magazine/caliber data.

Mitigation: content contract tests should catch gaps or document safe runtime fallback.

## 8. Acceptance criteria for future PR 5

PR 5 can be accepted only if all are true:

- PR is small and test-covered.
- No save migration.
- No content rewrite.
- No cloud/local save behavior changes.
- Ammo/reload preview is truthful.
- Reload disabled reasons are visible before click.
- No ammo duplication.
- No silent reserve ammo loss.
- Existing combat outcome/lifecycle smoke tests still pass.
- AP preview tests still pass.
- Enemy intent tests still pass.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run test` passes.
- `npm run build` passes.

## Recommended future PR 5 checklist

Before implementation:

- Confirm PR 3/3.1 AP preview tests are green.
- Confirm PR 4/4.1 enemy intent tests are green.
- Inventory all ranged weapon ammo metadata and decide fallback policy.

During implementation:

- Add pure ammo helper tests first.
- Add reload disabled-reason tests before UI wiring.
- Keep magazine state runtime-local.
- Keep old CombatScene attack path behavior stable until parity tests pass.

Before merge:

- Verify `git diff --name-status origin/main...HEAD` contains only intended PR 5 files.
- Run full automated gates.
- Confirm no save/content/platform/lifecycle files changed.
