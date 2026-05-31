# Status: Content

## Current status (2026-05-30)

- **Current phase:** M11/M12 QA hardening + release readiness.
- **Role responsibility:** support QA by validating content data used by M11/M12 runtime: item names/classes, tiers, drops, mobs, encounters, recipes, and release-safe generic display names.
- **Immediate next actions:**
  1. Check QA-reported missing/invalid content IDs in items, mobs, recipes, zones, encounters.
  2. Verify M11/M12 item/content counts and naming are consistent with release-safe Yandex requirements.
  3. Avoid adding new content until QA acceptance blockers are resolved.
- **Blockers / risks:** invalid content references can block combat/loot acceptance; real/recognizable weapon names must stay hidden from runtime release display.

## Archive / history below

## Архив: M7 content work

Branch: `m7/content`
Base: `m7-integration`

## Done

- Added 6 new zones to `content/zones.json`: `suburbs`, `school`, `factory`, `hospital`, `metro`, `power_plant`.
- Added 45 new items to `content/items.json`: 12 T1 zone-exclusive resources + 33 T2 gear/consumables.
- Added 24 new recipes to `content/recipes.json`, each using ≥1 new-zone resource.
- Created `content/sfx.json` with 10 SFX entries (schema/path strings only; no physical asset requirement).
- `boss_id=null` for all 6 new zones; existing `forest`/`warehouse`/`city` bosses untouched.
- No `fights_per_depth` added to `zones.json` — field absent, per existing schema.

## Counts

| Entity | Count | Status |
|---|---|---|
| zones | 9 | OK |
| items | 80 | OK |
| recipes | 42 | OK |
| sfx | 10 | OK |

## Validation

```bash
python3 /tmp/oplot/m7_content.py
python3 -m json.tool content/zones.json
python3 -m json.tool content/items.json
python3 -m json.tool content/recipes.json
python3 -m json.tool content/sfx.json
```

All checks passed (unique IDs, recipe ingredients exist in items, zone mobs exist in mobs.json, valid zone_origin values, SFX paths are valid strings targeting `assets/audio/<id>.wav`).

## PR

Draft: https://github.com/alexbayov/oplot/pull/62

## Ready

Content M7 PR Ready.
