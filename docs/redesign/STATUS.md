# Redesign branch status (auto)

Branch: `redesign/r-series`
PR: https://github.com/alexbayov/oplot/pull/222

## What works in repo
- Design pack: R-MASTER, R0, R2, R3, R5 docs
- 3D boot scene + click move (`src/scenes3d/boot3d.ts`)
- Combat math + tests (`combatMath.ts`)
- Combat UI helpers (`combat3d.ts`)
- Loop controller + tests (`loopController.ts`)
- Skill effects R5 24/24 (`skillEffectsR5.ts`)
- CI workflow (fixed checkout)

## Local / CI command
```bash
git checkout redesign/r-series
npm ci
npm run typecheck
npm run test
npm run build
```

## Play
```bash
npm run dev
# 3D default; legacy 2D: ?mode=2d
```
