# Handoff — QA Spec Review M8a

QA reviews GD M8a amendment (`docs/GDD.md` §13a + optionally `docs/balance.md` §M8a). Verdict APPROVE or CHANGES_REQUESTED. No spec writing, no code, no content.

## Preconditions

- GD M8a amendment PR `m8a/gd-amendment → m8a-integration` open or merged.
- `staff/status/M8a.md` snapshot read.

## Deliverables

Acceptance review on the GD-amendment with verdict-only output in `staff/status/QA.md` under section `# M8a Spec Review`.

### Checklists (must all pass for APPROVE)

1. **SDK lifecycle spec is implementable**
   - Script tag, init, ready signal, singleton instance — all specified.
   - Fail-soft branches explicit for all 4 failure modes (no network, adblock, script load fail, init reject).
   - No `throw`/`console.error` mandated on failure paths.

2. **Cloud save schema is complete**
   - All `GameState` fields enumerated; no "and others" handwaving.
   - Snapshot size budget specified vs Yandex 200 KB quota.
   - Conflict policy single rule ("remote newer wins by `saved_at`") with no ambiguity.
   - Throttle interval specified as a single number (or single range).
   - Critical save triggers enumerated explicitly (post-sortie / post-craft / post-level-up / settings change / perk choice).
   - Fail-soft behavior matches M7 in-memory behavior.

3. **Locale RU lock is unambiguous**
   - `t(key)` API signature defined.
   - `sdk.environment.i18n.lang` explicitly **ignored** on M8a.
   - Forward hook for EN documented but not implemented.

4. **Mobile-first viewport spec is complete**
   - Viewport meta string exact.
   - Safe-area inset application surfaces enumerated (game container, HUD).
   - iOS audio autoplay unlock gesture spec'd (`touchstart`/`pointerdown`).
   - Portrait-only orientation declared.
   - Double-tap zoom suppression scope (`canvas` only, not whole document).

5. **Settings persistence migration is clear**
   - M7 fields (mute, volume) mapped into cloud-save schema.
   - Defaults specified for first-time players (no remote snapshot).

6. **Anti-scope §13a is explicit and matches `staff/status/M8a.md` Anti-scope**
   - No ads / IAP / leaderboards / achievements / telemetry / new languages / new content / new mechanics / music / voice / UI redesign — all listed.
   - GD §13b (monetization) placeholder reserved for M8b.

7. **M2–M7 regression carry-over**
   - No spec change that contradicts shipped M2–M7 behavior.
   - Audio system from M7 still works identically when SDK absent.
   - Existing 9 zones / 80 items / 42 recipes / 11 mobs / 3 boss / 8 perks / 6 radio / 10 SFX / 16 tweens untouched.

### Verdict format

In `staff/status/QA.md`, append a `# M8a Spec Review` section with:
- Verdict: `APPROVE` or `CHANGES_REQUESTED`.
- Checklist 1–7 results: PASS / FAIL per item.
- Blockers (each one must clear before APPROVE).
- Non-blocking notes (recommendations for Engineer / Acceptance).
- Recovery state.

## Forbidden

- No edits to `docs/`, `content/`, `src/`, `assets/`, other staff files.
- No self-merge.
- No APPROVE if any checklist item fails.
- No PAT in URL / echo / print.

## Acceptance

Only `staff/status/QA.md` changed. PR `qa/m8a-spec-review → m8a-integration`. Draft PR early with Recovery block.
