# Handoff — Content M7

Content implements approved M7 JSON. No code/assets/docs.

## Preconditions

GD M7 amendment merged and QA Spec M7 APPROVE.

## Read

`staff/status/M7.md`, approved `docs/GDD.md` §11.M7, `docs/balance.md` §M7, `docs/content-brief.md`, current `content/*.json`.

## Deliverables

1. **Zones:** expand `content/zones.json` from 3 to exactly 9; add 6 zones; use existing mob ids only.
2. **Items:** expand `content/items.json` from 35 to exactly 80; add 45 items; valid `zone_origin`, weight, tier/rarity/schema fields; no T4.
3. **Recipes:** expand `content/recipes.json` from 18 to exactly 42; add 24 recipes; all ids resolve; T1–T3 boundary.
4. **SFX registry:** create `content/sfx.json` with exactly 10 entries: `id`, `path`, `trigger`, `volume`, `description_ru`; paths target `assets/audio/*` from Artist.
5. **Validation/status:** run JSON/ref validation and update only `staff/status/CONTENT.md`.

## Forbidden

No `src/`, `assets/`, `docs/`, чужие staff. No mobs/bosses/T4/SDK/ads/music/voice. If schema/balance is ambiguous, escalate to PM.
