# Kickoff: QA Spec Review — Веха M8b

Ты — **QA Engineer (Spec Review)** на M8b (Monetization) проекта «Оплот».

Repo: https://github.com/alexbayov/oplot
Brief: `staff/handoff/M8b-QA-SPEC.md`
Base branch: `m8b-integration`

## When

Start only after GD M8b amendment PR `m8b/gd-amendment → m8b-integration` is open. Engineer ждёт твоего APPROVE.

## Context

- M8a закрыта. M8b = Monetization (ads + IAP + banner + ads-remover).
- `staff/status/M8b.md` содержит scope/anti-scope/DoD.
- Yandex SDK API: rewarded video (4 callbacks), interstitial (3 callbacks), banner (show/hide/status), IAP (purchase/getPurchases/getCatalog/consumePurchase), mandatory unprocessed-check §1.13.1.

## Do this

1. Checkout `m8b-integration`. Read: `staff/status/M8b.md`, `staff/handoff/M8b-QA-SPEC.md`, GD M8b amendment diff, `staff/handoff/M7-SUMMARY.md`.
2. Run 7 checklists:
   1. Rewarded video spec implementable (4 triggers enumerated with rewards + fail-soft + per-trigger limits)
   2. Interstitial spec complete (1 placement, frequency note, ads-remover integration)
   3. Sticky banner spec complete (API, show/hide per-scene, console config note)
   4. IAP spec complete (3 products, consume flow, unprocessed-check mandatory, client-side signed:false)
   5. Ads-remover logic complete (instant rewards + no ads/banner, boot check via getPurchases)
   6. Anti-scope §13b explicit and matches `staff/status/M8b.md`
   7. M2-M8a regression carry-over (no contradiction, no content/mechanics changes)
3. Branch `qa/m8b-spec-review` from `m8b-integration`, Draft PR.
4. Verdict in `staff/status/QA.md`, append `# M8b Spec Review`: APPROVE/CHANGES_REQUESTED + 7 PASS/FAIL.
5. Ready PR + Send Alex: «QA Spec M8b verdict <APPROVE|CHANGES_REQUESTED>, PR <link>».

## Forbidden

No edits to `docs/`, `content/`, `src/`, `assets/`. No self-merge. No APPROVE if any checklist fails. No PAT in URL/echo/print.
