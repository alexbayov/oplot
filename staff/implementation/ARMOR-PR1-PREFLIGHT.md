# ARMOR-PR1 Preflight — catalog intrinsic armor affixes

## Scope

Schema-neutral PR. Catalog armor already supports `intrinsic_affixes`, so this pass adds resolver/content/runtime wiring without SAVE_VERSION changes.

## Code-grounded seams

- `armorSchema` already allows `intrinsic_affixes` in `src/systems/itemSchema.ts:184-193`; no schema work is needed.
- Sortie combat currently aggregates armor pieces in `SortieRunScene.snapshotHero` and calls `computeArmorReduction` in `src/scenes/SortieRunScene.ts:138-157`.
- `computeArmorReduction` converts armor `stats.armor_value` into `armor_reduction` in `src/systems/sortieResolve.ts:112-164`.
- Carry weight gates currently read `player.max_weight_kg` directly in inventory/loot scenes; PR1 adds a pure armor resolver first so later UI deltas can use one path.

## Auto-GO defaults selected

- Catalog-intrinsic armor only; no crafted/random armor.
- ArmorStat union is separate from weapon `AffixStat`: `carry_kg | inventory_slots | scavenge_chance | armor_def`.
- `resolveEquippedArmor` is the single-source resolver for armor bonuses.
- Add catalog armor examples in `content/items.json` with intrinsic affixes.

## Invariants

- No M15 durability/repair/disassembly fields are valid armor affix stats.
- Unknown armor affix IDs are skipped and frozen instance values win over registry values.
- SAVE_VERSION remains 9 for this schema-neutral pass.
