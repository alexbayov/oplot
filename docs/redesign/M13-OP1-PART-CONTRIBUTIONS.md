# M13 — OP1 part-contribution starting table (Viktor proposes, Alex tunes)

Anchors `componentSchema.stats` contributions for all 68 components, derived from `content/items.json` @ main `2e67aeb`. Machine-readable copy: `M13-OP1-PART-CONTRIBUTIONS.json` (id → {damage_min?, damage_max?, durability_max?}).

## Methodology — exact per-family anchor (better than ±15% band)
The 60 non-mod parts are NOT generic "tiers" — each `*_barrel`/`*_slide`/`*_receiver`/`*_frame`/etc. belongs to ONE weapon family that maps 1:1 to a catalog weapon (e.g. `pm_frame/pm_slide/pm_magazine` → catalog `pm`). So the anchor is EXACT, not a tolerance band:

> **A full crafted build's summed damage band == its catalog twin's exact band.**
> `sum(parts.damage_min) == catalog.damage_min` AND `sum(parts.damage_max) == catalog.damage_max`.

Design consequence (the knob to confirm): a crafted gun has the **same damage** as a found one — the tradeoff is **durability**. Catalog firearms have `durability_max=None` (eternal); crafted ones break (per-encounter −1). If you instead want crafted to be a hair *weaker* than found, scale every family's split down by a factor — but I anchored to parity because the breakability already differentiates them, and parity keeps the math legible.

### Per-part split rule (within a family)
- **DMG part** (the `*_barrel` / `*_slide` / `*_barrels` — the firing part): carries ~75% of damage. This is the rare/important part (lore agrees: "Ствол СВД. Финал-парт", "Ствол АК-74. Редкая деталь").
- **STRUCT part** (the `*_receiver` / `*_frame`): carries ~25% of damage + ~50% of durability.
- **aux parts** (magazine / bolt / stock / scope / bipod / pump / drum): **0 damage**, split the remaining durability. Honest: these don't set caliber/damage; their real effect (capacity, handling) has no consumer in `sortieResolve`.

### Durability targets (pure balance knob, tune freely)
Pistols 45–55, SMG/short 55, rifles/shotguns 60–70, AK-74 75, RPK 80, SVD 90. Distributed receiver 50% / barrel 25% / aux split 25%.

## Mods (8) — only contribute what sortieResolve actually consumes
- `mod_pbs_universal`, `mod_pbs1` (suppressors): **−1 damage_min/max** (real consumer — damage). Assembler floors min ≥ 0, so safe on any build.
- `mod_bayonet` (melee strike), `mod_ext_mag_*` (capacity), `mod_optic_*` / `mod_tac_grip` (accuracy): **{} (0)**. Their real effect (melee/capacity/accuracy/noise) has NO model in sortieResolve yet — same discipline as deferring `contribute_mult` to M14. Wire them when those consumers land.

## Audit-script spec (Alex writes; assertions to implement)
1. **In-band (exact):** for each of the 15 families, sum the parts' `stats.damage_min`/`damage_max`/`durability_max` and assert `== catalog` band + dura target. (All 15 pass exactly in my derivation.)
2. **Floor invariant:** any full build + a suppressor → `assembleWeapon().stats.damage_min >= 0` (assembler floor; never negative).
3. **Sanity:** every crafted full-build `damage_min >= 1`.
4. **Coverage:** all 68 components have a `stats` key after population; the 60 non-mod parts each belong to exactly one family map.

## Full table
| family → catalog (band, crafted dura) | part | role | damage_min | damage_max | durability_max |
|---|---|---|---|---|---|
| pm → pm (5–9, 45) | pm_slide | DMG | +4 | +7 | 11 |
| | pm_frame | STRUCT | +1 | +2 | 23 |
| | pm_magazine | aux | — | — | 11 |
| tt → tt (7–11, 45) | tt_slide | DMG | +5 | +8 | 11 |
| | tt_frame | STRUCT | +2 | +3 | 23 |
| | tt_magazine | aux | — | — | 11 |
| aps → aps (6–10, 55) | aps_slide | DMG | +4 | +8 | 14 |
| | aps_frame | STRUCT | +2 | +2 | 27 |
| | aps_magazine | aux | — | — | 7 |
| | aps_stock | aux | — | — | 7 |
| akm → akm (13–19, 60) | akm_barrel | DMG | +10 | +14 | 15 |
| | akm_receiver | STRUCT | +3 | +5 | 29 |
| | akm_bolt | aux | — | — | 8 |
| | akm_magazine | aux | — | — | 8 |
| aks74u → aks_74u (11–16, 55) | aks74u_barrel | DMG | +8 | +12 | 14 |
| | aks74u_receiver | STRUCT | +3 | +4 | 27 |
| | aks74u_bolt | aux | — | — | 7 |
| | aks74u_magazine | aux | — | — | 7 |
| bekas → bekas (13–19, 65) | bekas_barrel | DMG | +10 | +14 | 16 |
| | bekas_receiver | STRUCT | +3 | +5 | 33 |
| | bekas_pump | aux | — | — | 8 |
| | bekas_stock | aux | — | — | 8 |
| hunting → rifle_t3_hunting (13–19, 70) | hunting_barrel | DMG | +10 | +14 | 18 |
| | hunting_receiver | STRUCT | +3 | +5 | 34 |
| | hunting_bolt | aux | — | — | 9 |
| | hunting_scope | aux | — | — | 9 |
| izh43 → iz_43 (14–21, 65) | izh43_barrels | DMG | +10 | +16 | 16 |
| | izh43_receiver | STRUCT | +4 | +5 | 33 |
| | izh43_stock | aux | — | — | 16 |
| mosin → mosin (15–22, 70) | mosin_barrel | DMG | +11 | +16 | 18 |
| | mosin_receiver | STRUCT | +4 | +6 | 34 |
| | mosin_bolt | aux | — | — | 9 |
| | mosin_stock | aux | — | — | 9 |
| ppsh → ppsh (8–13, 55) | ppsh_barrel | DMG | +6 | +10 | 14 |
| | ppsh_receiver | STRUCT | +2 | +3 | 27 |
| | ppsh_drum | aux | — | — | 7 |
| | ppsh_stock | aux | — | — | 7 |
| sks → sks (12–17, 65) | sks_barrel | DMG | +9 | +13 | 16 |
| | sks_receiver | STRUCT | +3 | +4 | 33 |
| | sks_bolt | aux | — | — | 8 |
| | sks_stock | aux | — | — | 8 |
| ak74 → ak_74 (14–20, 75) | ak74_barrel | DMG | +10 | +15 | 19 |
| | ak74_receiver | STRUCT | +4 | +5 | 38 |
| | ak74_bolt | aux | — | — | 6 |
| | ak74_magazine | aux | — | — | 6 |
| | ak74_stock | aux | — | — | 6 |
| rpk → rpk (15–22, 80) | rpk_barrel | DMG | +11 | +16 | 20 |
| | rpk_receiver | STRUCT | +4 | +6 | 39 |
| | rpk_bipod | aux | — | — | 7 |
| | rpk_bolt | aux | — | — | 7 |
| | rpk_magazine | aux | — | — | 7 |
| saiga → saiga_12 (16–24, 70) | saiga_barrel | DMG | +12 | +18 | 18 |
| | saiga_receiver | STRUCT | +4 | +6 | 34 |
| | saiga_bolt | aux | — | — | 9 |
| | saiga_magazine | aux | — | — | 9 |
| svd → svd (22–32, 90) | svd_barrel | DMG | +16 | +24 | 22 |
| | svd_receiver | STRUCT | +6 | +8 | 44 |
| | svd_bolt | aux | — | — | 8 |
| | svd_magazine | aux | — | — | 8 |
| | svd_stock | aux | — | — | 8 |

**Mods:** `mod_pbs_universal` −1/−1 · `mod_pbs1` −1/−1 · `mod_bayonet`/`mod_ext_mag_545`/`mod_ext_mag_9x18`/`mod_optic_4x`/`mod_pso1`/`mod_tac_grip` = {} (0).
