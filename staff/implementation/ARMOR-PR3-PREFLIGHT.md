# ARMOR-PR3 Preflight — Grinder gate + roadmap + determinism fold-in

## Scope

Schema-neutral PR. Closes the Grinder strategy proof on top of ARMOR-PR1/PR2 and folds in the M16 assembleFromStash determinism pin.

## Code-grounded seams

- Strategy gate tests live in `src/systems/__tests__/buildStrategies.test.ts:1-110` and currently prove Strelok/Tank only.
- Armor bonuses resolve through `resolveEquippedArmor` in `src/systems/armorAffixes.ts:78-133`, so Grinder proof uses that resolver directly.
- `assembleFromStash` consumes rng in id-before-affixes order in `src/systems/assemblyFlow.ts:68-74`; fold-in pins `(parts, seed) -> (instance.id, affixes)` as one snapshot.
- Roadmap still lists Grinder as post-armor-affix work in `docs/ROADMAP.md:100-120` and speculative armor-affix in `docs/ROADMAP.md:130-140`.

## Auto-GO defaults selected

- Grinder identity = crafted weapon any + armor with high carry/scavenge.
- Prove Grinder carry/scavenge is greater than Strelok/Tank armor baselines.
- Update ROADMAP to reflect 3/3 strategy closure by the armor-affix pass and remove armor-intrinsic affixes from M18+ speculation.
- Fold in combined assembleFromStash determinism pin.

## Invariants

- Schema-neutral: no SAVE_VERSION bump.
- SINGLE-SOURCE: Grinder proof reads `resolveEquippedArmor`, not duplicated affix math.
- Determinism pin guards rng consumer order without asserting balance numbers.
