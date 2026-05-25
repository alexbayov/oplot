# Handoff — Content M6 (Радио и доверие)

> Подробный брифинг для Content Designer на M6. Ты пишешь JSON-контент радио по GD/QA-approved spec. Не пишешь код, ассеты, GDD или balance.

## Preconditions

- GD M6 amendment merged в `m6-integration`.
- QA Spec M6 verdict APPROVE.
- Ты стартуешь параллельно с Engineer M6 и Artist M6.

## Контекст файлов

**Читать:**
1. `staff/CONTEXT.md`
2. `staff/LINKS.md`
3. `staff/status/M6.md`
4. `staff/handoff/M6-CONTENT.md`
5. `staff/handoff/M5-SUMMARY.md`
6. `docs/GDD.md` §10.M6
7. `docs/balance.md` §M6
8. `docs/content-brief.md`
9. `content/radio.json`
10. `content/items.json`, `content/mobs.json`, `content/zones.json` for cross-refs.

## Deliverables

### 1. `content/radio.json`

Update M3 dummy signals into exactly 6 M6 signals:

- 2 `truth`
- 2 `trap`
- 2 `ambiguous`

Each signal must include exact fields from GDD/balance:

- `id`
- `from`
- `subject`
- `body_ru`
- `type`
- `zone_id`
- `options`
- `reward`
- `trap_mob_id`
- `trust_impact`
- `expires_after_sorties`
- `chosen_option`
- `resolved`

### 2. Writing rules

- Choice must be meaningful, not obvious.
- Text tone: harsh realism + black humor, no fantasy/zombies.
- Each signal body 2–4 sentences.
- `respond` and `ignore` labels may be default or more flavorful if GD permits.
- The player should understand risk/reward enough to make a choice, but trap must not be cartoonishly obvious.

### 3. Cross-ref validation

Required before Ready:

- Every `reward.item_id` exists in `content/items.json`.
- Every `trap_mob_id` exists in `content/mobs.json`.
- `trap_mob_id` is regular mob, not boss.
- Every `zone_id` exists in `content/zones.json`.
- Counts exactly match balance §M6.

### 4. Status file

Update only `staff/status/CONTENT.md` with M6 summary, exact counts, validation checklist, PR link.

## Forbidden

- No `src/`, `assets/`, `docs/`, `content/items.json`, `content/mobs.json`, `content/recipes.json`, `content/zones.json` changes unless PM explicitly asks after blocker.
- No new items/mobs/zones/recipes.
- No Yandex SDK/ads reward fields.
- No real-time timestamp fields.
- No faction reputation fields beyond GD-approved global trust.

## Done

- Draft PR early.
- Exactly 6 signals.
- JSON valid.
- Cross-refs valid.
- Status updated.
