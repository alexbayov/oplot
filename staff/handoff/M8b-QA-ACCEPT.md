# Handoff — QA Acceptance M8b

QA acceptance review на Engineer M8b PR. 3 Gates: dry-run merge + static checks + runtime smoke + spec/anti-scope compliance.

## Preconditions

- Engineer M8b PR `m8b/monetization → m8b-integration` Ready.
- GD M8b amendment merged, QA Spec APPROVE merged.

## 3-Gate Acceptance

### Gate 0 — Merge dry-run

- Локальный merge `m8b/monetization` в `qa/m8b-acceptance-test`
- Conflicts: 0 (only one role-PR)
- Net delta: files, +/- LOC

### Gate 1 — Static checks

- `npm install && npm run typecheck && npm run lint && npm test && npm run build`
- Vitest count: **~210/210** (193 M8a + ~17 M8b)
- JS bundle ≤ 2 MB
- No new assets
- No new npm deps

### Gate 2 — Runtime smoke

**M2-M8a regression (no monetization SDK):**
- Core loop (Base→Map→Sortie→Combat→Loot→Return→Inventory→Craft) works identically to M7/M8a
- No monetization buttons visible (no Yandex iframe, platform unavailable)
- No console.error

**Rewarded video (simulated):**
- ReturnScene: кнопка "×2 лут (реклама)" видна после успешной вылазки; нажатие → реклама → ресурсы удвоены
- CombatScene: кнопка "Второй шанс (реклама)" видна при смерти; нажатие → 50% HP → бой продолжен
- MapScene: кнопки "Сброс дейли (реклама)" и "+1 газ (реклама)" видны при кулдауне/недостатке газа

**Interstitial (simulated):**
- ReturnScene → "Вернуться на базу" → interstitial → BaseScene
- Нет interstitial при disable_ads

**Banner (simulated):**
- BaseScene: banner visible
- CombatScene: banner hidden
- При disable_ads: banner всегда скрыт

**IAP (simulated):**
- Boot check `getPurchases()` runs
- При симуляции `disable_ads` purchase: все ad-кнопки → instant reward, текст обновлён
- Consumable check: `starter_pack` → reward → consume

### Gate 3 — Spec/anti-scope compliance

**Spec compliance:**
- GDD §13b matches scope
- 4 rewarded triggers all present
- 1 interstitial placement present
- Banner show/hide logic correct
- IAP 3 products + consume + unprocessed-check
- Ads-remover logic correct

**Anti-scope grep (0 hits expected):**
```
getLeaderboards
setScore
getAchievements
signed: true
```
- `content/*.json` unchanged
- `package.json` unchanged
- No `any` type escapes
- No `setInterval` for ad calls
- No new content/mechanics

## Verdict format

In `staff/status/QA.md`, append `# M8b Acceptance`:
- Verdict: APPROVE / CHANGES_REQUESTED
- Gate 0-3 results per gate
- Blockers / Non-blocking notes / Recovery state

## Forbidden

No `src/`, `content/`, `assets/`, `docs/` changes. No self-merge. No APPROVE if any Gate blocker. No PAT in URL/echo/print.

## QA fix cherry-pick pattern

If Gate 2/3 finds a runtime bug ≤ 10 LOC, apply locally for verification. PM cherry-picks to Engineer PR before merge.

## Acceptance

PR `qa/m8b-acceptance-test → m8b-integration`. Only `staff/status/QA.md` changed.
