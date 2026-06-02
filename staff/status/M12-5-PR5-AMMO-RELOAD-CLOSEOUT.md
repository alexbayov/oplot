# M12.5 PR5 — Ammo/Reload Closeout

## Status

PR5 ammo/reload block is implemented.

Current implementation status:

- Runtime magazine state is scene-local.
- Reload mutates backpack ammo only on successful reload.
- Ranged attack consumes runtime magazine ammo, not backpack ammo directly.
- Scene exit refunds loaded runtime magazine ammo back to backpack.
- Loaded magazine state is not persisted in save schema or cloud save yet.
- Reload still does not consume AP and does not end the player turn.

This closeout records implementation status only. It does not mark M12.5 combat as product-accepted or release-ready.

## What is covered

PR5 now covers:

- pure ammo/reload helpers;
- ammo/reload preview UI;
- reload button / reload affordance;
- magazine-based ranged attack migration;
- runtime magazine refund on scene exit;
- hardening tests for reload and magazine behavior;
- shipped content magazine/ammo contracts;
- `prime_shotgun` magazine contract blocker fixed.

## Known limitations

Known limitations after PR5:

- Magazine state is not persisted across save/load or scene recreation except through refund on scene exit.
- Reload is currently free and non-turn-ending.
- Runtime magazine key uses equipped weapon id, not a unique item instance id.
- `CombatEngine` is still not the runtime source of truth for player-facing combat.
- AP economy is not integrated with reload yet.

## QA notes

Manual QA still needs to validate PR5 behavior in actual browser/runtime smoke:

- reload from backpack reserve;
- ranged attack consuming runtime magazine;
- no direct backpack ammo consumption on ranged attack;
- refund of loaded magazine ammo on victory, defeat, retreat, and other scene exits;
- no console errors in combat smoke.

First 10 minutes smoke is still needed later as part of broader M12.5 acceptance. This document does not imply release acceptance.

## Next recommended block

Next recommended block: **PR6 preflight — cover/suppression/distance bands**.

Do not start PR6 runtime implementation before a PR6 preflight document is reviewed and merged.
