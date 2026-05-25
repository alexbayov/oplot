# M5 Summary — Боссы и инстансы

**Дата закрытия:** 2026-05-25  
**Integration branch:** `m5-integration`  
**Gate-close:** `m5-integration → main`  
**Verdict:** DONE / APPROVE

## Что вошло

- 3 босса: `forest_alpha_mutant`, `warehouse_drone_prime`, `city_guard_captain`.
- 3 boss-drop ресурса: `mutated_gland`, `prime_circuit`, `captain_insignia`.
- 3 T3 предмета и 3 T3 рецепта: `composite_blade`, `prime_shotgun`, `captain_armor`.
- Boss AI 2-phase: `MobRuntimeState.phase`, `computePhaseTransition`, phase-2 behavior swap.
- Daily instance: `daily_completed`, 24h cooldown, MapScene daily entry, ReturnScene completion mark.
- Gas zones: `is_gas`, `gas_damage_per_turn`, gas tick in CombatScene, `gas_mask` protection.
- MobRole runtime: boss fight init, boss HUD overlay, guaranteed boss drops.
- LevelUpScene overkill queue: multiple level-up popups from one XP gain.
- 10 M5 assets: 3 boss sprites, 3 boss-drop icons, 3 T3 icons, 1 gas overlay.

## PR sequence

| PR | Role | Result |
|---|---|---|
| #40 | PM kickoff | merged |
| #41 | GD amendment | merged |
| #42 | QA Spec | APPROVE / merged |
| #43 | Artist | PM merged into `m5-integration` |
| #44 | Content | PM merged into `m5-integration` |
| #45 | Engineer | PM merged into `m5-integration` |
| #46 | QA Acceptance | APPROVE evidence |

## Final counts

| Area | Count |
|---|---:|
| Mobs | 11 (8 regular + 3 boss) |
| Items | 35 |
| Recipes | 18 |
| Zones | 3 |
| Vitest | 152/152 PASS |
| Build | 1.48 MB JS |
| Assets | 412 KB |

## PM verification

Commands run on final `m5-integration` after role merges:

```text
npm run typecheck
npm run lint
npm run test
npm run build
du -sk assets
```

Result: all clean; `npm run test` = 152/152 PASS; `du -sk assets` = 412 KB.

## Notes for M6

- M6 starts from closed M5 main after gate-close.
- Radio remains UI stub; full radio/trust/reward/ambush system is M6 scope.
- M5 retained anti-scope: no module weapons, no Yandex SDK/cloud saves/leaderboards/IAP, no PvP/multiplayer, no animated boss cinematics, no daily reward rotation.
