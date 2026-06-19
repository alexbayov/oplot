# M17-PR2 Preflight — offline accrual summary

## Scope

Schema-neutral PR. `CloudSaveSnapshot` already persists `saved_at`, so M17-PR2 reuses the existing timestamp and does not bump `SAVE_VERSION`.

## Code-grounded seams

- `CloudSaveSnapshot.saved_at` is already required in `src/systems/cloudSave.ts:13-23` and `serializeGameState` writes `new Date().toISOString()` in `src/systems/cloudSave.ts:83-98`.
- `applySnapshot` already parses `migrated.saved_at`, calls `accrueOffline`, and stores `pendingAccrualSummary` in `src/systems/cloudSave.ts:221-236`.
- BaseScene already consumes the pending summary once in `src/scenes/BaseScene.ts:592-608`; this PR upgrades that one-shot toast into a simple OK dialog.
- The existing schema-neutral guard still pins `SAVE_VERSION === 9` in `src/state/__tests__/migrations.test.ts:411-412`.

## Auto-GO defaults selected

- Existing `saved_at` means no `last_offline_tick_ms` field and no v9→v10 migration.
- Anti-AFK clamp moves to 24h via `MAX_OFFLINE_WINDOW_MS`.
- Summary UI is a plain text dialog with an `Ок` button; no new art.

## Invariants

- SAVE-DISCIPLINE: no schema bump, no migration path, guard remains version 9.
- Offline accrual remains pure in `offlineProgression`; UI formatting/dialog is separate from state mutation.
