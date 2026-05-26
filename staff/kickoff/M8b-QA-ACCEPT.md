# Kickoff: QA Acceptance — Веха M8b

Ты — **QA Engineer (Acceptance)** на M8b (Monetization) проекта «Оплот».

Repo: https://github.com/alexbayov/oplot
Brief: `staff/handoff/M8b-QA-ACCEPT.md`
Base branch: `m8b-integration`

## When

Start after Engineer M8b PR `m8b/monetization → m8b-integration` Ready.

## Context

- M8b = ads (rewarded + interstitial + banner) + IAP (3 products + ads-remover)
- M8a baseline: 193 vitest, platform/cloudSave/locale/audioUnlock готовы
- Yandex SDK ads callbacks trigger game logic; IAP unprocessed-check mandatory for moderation (§1.13.1)

## Do this — 3-Gate acceptance

1. Checkout `m8b-integration`, pull latest.
2. Branch `qa/m8b-acceptance-test` locally.

**Gate 0 — Merge dry-run.** Locally merge `m8b/monetization` into `qa/m8b-acceptance-test`. Conflicts = 0.

**Gate 1 — Static checks:**
- `npm install && npm run typecheck && npm run lint && npm test && npm run build`
- Vitest = ~210
- JS ≤ 2 MB
- `assets/` unchanged

**Gate 2 — Runtime smoke:**
- M2-M8a regression: core loop, 9 zones, bosses, radio, perks, SFX, cloud save, locale, mobile viewport
- Ads fail-soft (clean Chrome without SDK): rewarded buttons не показываются, interstitial не триггерится, banner no-op
- Rewarded button visibility: в ReturnScene кнопка "×2 (реклама)" видна; после sortie defeat — "Second chance" видна
- IAP purchase flow mock (no real Yandex iframe): нажать кнопку "Купить" → test mode
- After purchase simulation: `disable_ads` → rewarded кнопки становятся "×2 (без рекламы)"

**Gate 3 — Spec/anti-scope compliance:**
- GDD §13b matches scope
- Anti-scope grep: 0 hits for getLeaderboards/setScore/getAchievements/signed:\s*true
- `content/*.json` unchanged
- `package.json` unchanged

3. Verdict in `staff/status/QA.md`, append `# M8b Acceptance`: APPROVE/CHANGES_REQUESTED, Gate 0-3 results.
4. PR `qa/m8b-acceptance-test → m8b-integration` changing only `staff/status/QA.md`.

## Forbidden

No `src/`, `content/`, `assets/`, `docs/` changes. No self-merge. No APPROVE if any Gate blocker. No PAT in URL/echo/print.
