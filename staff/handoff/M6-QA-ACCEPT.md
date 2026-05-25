# Handoff — QA Acceptance M6 (Радио и доверие)

> Подробный брифинг для QA Engineer на этапе **acceptance review** M6. Ты проверяешь все 3 role-PR (Content / Engineer / Artist) через 3 Gate'а с локальным octopus-merge. Verdict: APPROVE / CHANGES_REQUESTED.

## Preconditions

- 3 role-PR Ready (не Draft): Content M6 (`m6/content`), Engineer M6 (`m6/radio`), Artist M6 (`m6/art`).
- GD M6 amendment + QA Spec M6 already merged/APPROVE.
- Ты последний gate перед PM merge sequence + gate-close.

## Контекст файлов

**Читать:**
1. `staff/CONTEXT.md`
2. `staff/LINKS.md`
3. `staff/status/M6.md`
4. `staff/handoff/M6-QA-ACCEPT.md`
5. `staff/handoff/M6-QA-SPEC.md`
6. `staff/handoff/M6-{GD,CONTENT,ENG,ARTIST}.md`
7. `staff/handoff/M5-SUMMARY.md`
8. `docs/GDD.md`
9. `docs/balance.md`

## Локальный octopus-merge

```bash
git checkout m6-integration && git pull
git checkout -b qa/m6-acceptance-test m6-integration
git fetch origin m6/content m6/radio m6/art
git merge --no-ff origin/m6/content origin/m6/radio origin/m6/art
```

Conflict = blocker. Не резолвить самостоятельно.

## Gate 1: Static

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
du -sk assets
```

Required:
- typecheck clean.
- lint clean.
- vitest count exactly 164.
- 0 failed tests.
- build ≤ 2 MB.
- assets ≤ 650 KB, M6-add ≤ 40 KB if calculable.

## Gate 2: Runtime smoke

Check:
- M2 Forest MVP flow still works.
- M3 map zones + RadioScene opens.
- M4 Progression / LevelUp still works.
- M5 boss/daily/gas/T3 not obviously broken.
- M6:
  - RadioScene shows 6 signals or active subset.
  - Trust starts 0.
  - Respond truth grants reward once and changes trust.
  - Ignore trap resolves without ambush and applies correct trust.
  - Respond trap triggers ambush path or queued ambush descriptor.
  - Ambiguous signal outcome matches spec.
  - Trust clamp works.
  - Resolved signal cannot be exploited for duplicate reward/trust.

## Gate 3: Spec / anti-scope

- `content/radio.json` exactly 6 signals: 2 truth / 2 trap / 2 ambiguous.
- Rewards all existing items.
- Trap mobs all existing regular mobs.
- `radio_trust` state exists and clamp matches GDD/balance.
- `RadioSignal` schema matches GDD.
- 4 artist PNG assets exist + generator works.
- No forbidden features: SDK, ads, cloud save, new zones/mobs/bosses/T4, module weapons, skill tree, real-time timers, faction-specific reputation, new combat mechanics, audio.

## Final report

Write full report in `staff/status/QA.md`:
- Gate 1 results with exact counts.
- Gate 2 runtime smoke notes.
- Gate 3 spec checklist.
- Verdict APPROVE / CHANGES_REQUESTED.

Open PR `qa/m6-acceptance → m6-integration`.
