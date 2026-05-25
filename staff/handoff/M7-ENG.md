# Handoff — Engineer M7

Engineer implements M7 runtime polish and validation. No content, audio asset generation, or docs.

## Preconditions

GD M7 amendment merged and QA Spec M7 APPROVE.

## Deliverables

1. **Audio system:** load `content/sfx.json`, preload 10 assets, play by trigger, fail-soft if missing/unavailable.
2. **Settings:** mute/volume control in existing settings/state pattern.
3. **Animation polish:** implement exactly 16 tween events from GDD/balance §M7; visual only, no gameplay state changes.
4. **Runtime validation:** tolerate/validate 9 zones, 80 items, 42 recipes, 10 SFX refs without M6 hardcodes.
5. **Tests:** exact target **176 vitest** = 164 M6 + 12 M7; cover SFX registry, mute/volume, fail-soft audio, tween hooks, content counts/refs where appropriate.
6. **Status:** update only `staff/status/ENGINEER.md` with commands, test count, build size, recovery note.

## Commands

Run `npm install`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## Forbidden

No `content/*.json`, `assets/*`, `docs/*`, чужие staff. No SDK/cloud/ads/IAP, music/voice, new mobs/bosses/T4, UI redesign. No third-party audio/UI libs without PM approval. No `any`/lazy type escapes.
