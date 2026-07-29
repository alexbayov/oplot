# R5 — Progression (24/24 live skill nodes)

> Status: code module landed (`src/systems/skillEffectsR5.ts`).
> Goal: no inert skill nodes. Every unlock changes combat/loop numbers.

## Delivered
- 24 nodes across fighter / survivor / crafter
- Aggregate helper maps unlocks → marksmanship, accuracy, HP, weight, damage/defense muls, craft/loot muls, reload AP, head-aim penalty reduce
- Vitest coverage

## Wiring still needed in existing SkillTree runtime
1. Replace inert coverage list with R5 node ids
2. On unlock, call `aggregateSkillEffects(unlocked)` and push into hero snapshot used by combatMath
3. Head penalty reduce plugs into `computeHitChance` body penalty (next combatMath pass)

## Critic gates
- [ ] 24/24 affect a real field
- [ ] fighter marksmanship moves hit%
- [ ] survivor HP/weight visible on hero sheet
- [ ] crafter loot/craft muls used in loop/craft
