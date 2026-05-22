# M4 Summary — Перки и прогрессия

> Handoff file for M4→M5 transition. Reconciled 2026-05-22.

## What M4 delivered

- **XP system** (`src/systems/xp.ts`): `gainXP`, `xpProgress`, `canLevelUp`, `isMaxLevel`. Formula: `round(40 * level^1.5)`, MAX_LEVEL=10. Multi-level-up support (carry-over XP).
- **Perks system** (`src/systems/perks.ts`): `computePerkModifiers`, `hasPerk`, `pickRandomPerks`. Additive stats summed, multiplicative stats multiplied.
- **ProgressionScene** (`src/scenes/ProgressionScene.ts`): level display, XP progress bar, perk list with descriptions, stat summary panel, back button.
- **LevelUpScene** (`src/scenes/LevelUpScene.ts`): overlay popup with 3 perk cards (icon + name + description + stat), click-to-select, `veteran_conditioning` fallback (+10 hp_max) when all 8 perks taken.
- **Perk modifier integration**: combat (damage_multiplier, armor_efficiency), weight (weight_penalty_multiplier), loot (loot_quantity_multiplier), XP award (xp_gain_multiplier via gainXP).
- **CombatScene XP**: `gainXP` on mob kill, `pickRandomPerks` + LevelUpScene launch on level-up.
- **Content**: `content/perks.json` (8 perks: tough_skin, sharp_blade, lean_pack, lucky_scavenger, keen_eye, reinforced_plates, quick_hands, fast_learner), `content/mobs.json` xp_reward updated per balance §M4.
- **Art**: 8 perk icons 64×64 RGBA via deterministic `tools/art/gen_m4_assets.py`. 24.2 KB / 50 KB budget.
- **GDD**: §8 Прогрессия (XP-curve + level-up flow + overkill carry-over + veteran fallback), §6.5 Perk JSON schema (id/name/description/type/stat/value, no prereq/tier/cost/cooldown).
- **Balance**: §M4 XP-curve table L1-10, mob xp_reward (8 mobs), 8 perk values, veteran_conditioning +10 hp_max.
- **M3 NB follow-ups closed**: RadioScene rowHeight 96→120, BootScene preload M3 assets (mob sprites, zone backgrounds, item icons), MobRole enum ("regular"|"boss").

## Metrics

| Metric | Value |
|---|---|
| Vitest | 128 passed (89 M2/M3 baseline + 24 xp + 15 perks) |
| Build size | ~1.5 MB (< 2 MB Yandex limit) |
| Assets total | ~259 KB (81 M1 + 130 M3 + 24 M4 + ~24 M3 preload additions) |
| Asset budget | ≤ 600 KB |
| Scenes | 11 (Boot, Base, Map, Sortie, Combat, Loot, Return, Inventory, Craft, Radio, **Progression**, **LevelUp**) |
| Mobs | 8 (with xp_reward: marauder=18, wild_dog=14, mutant=45, looter_sniper=28, armored_guard=36, fanatic_berserker=42, pack_rat=22, relic_drone=50) |
| Perks | 8 JSON + 1 hardcoded veteran_conditioning fallback |
| XP-curve | `round(40 * level^1.5)`, MAX_LEVEL=10, xpRequired(10)=4442 |
| PR count | 8 merged (#31-#38) |

## PR history

| PR | Role | What |
|---|---|---|
| #31 | PM kickoff | Dashboard + kickoff/handoff materials |
| #32 | GD amendment | GDD §8 + §6.5 + balance §M4 |
| #34 | GD fix | xp_reward option (a): updated §M1/§M3 tables |
| #33 | QA Spec | APPROVE after re-review |
| #35 | Artist | 8 perk icons + gen_m4_assets.py |
| #36 | Content | perks.json + mobs.json xp_reward |
| #37 | Engineer | XP/perks systems + scenes + integration + tests + M3 follow-ups |
| #38 | QA Acceptance | APPROVE — 7/7 checklists PASS |

## Known limitations / M5+ follow-ups

1. **Overkill multi-level-up**: LevelUpScene shows only 1 popup for multi-level-up (GDD §8 specifies popup queue). Player still gets all XP/level benefits. Queue mechanism is M5+ polish.
2. **computePerkModifiers called per attack**: Not cached in CombatScene state; negligible perf impact at current scale. Cache in M5+ if needed.
3. **Perk icons not rendered in LevelUpScene**: Icon PNGs exist on disk but LevelUpScene uses text-only cards. Render perk sprites in M5 UI polish.
4. **Session-only persistence**: Perks/XP stored in GameState (in-memory). Yandex Cloud Saves integration needed for persistence (M8).
5. **MobRole enum added but not consumed**: `type MobRole = "regular" | "boss"` in `src/types/mob.ts` + `role` field on `Mob` interface, but no runtime logic uses it yet. Will be needed for M5 boss system.

## Inherited for M5

- 11 scenes, 128 tests, 1.5 MB build, ~259 KB assets
- 8 mobs, 8 perks, 29 items, 15 recipes, 3 zones
- Full combat loop with AI behaviors + perk modifiers
- XP-curve L1-10, level-up flow with perk selection
- RadioScene M3 UI-stub (signals dismiss only, no rewards/ambush)
- `MobRole` enum ready for boss integration
