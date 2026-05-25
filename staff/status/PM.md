# Status: PM

**Текущая веха:** M7 — Полировка и баланс (PM kickoff)
**Статус:** `m7-integration` создана от `main` HEAD `859a652` (M6 gate-close PR #57). PM branch `pm/m7-kickoff` готовит M7 dashboard + 6 kickoff + 6 handoff + dashboard updates.
**Последнее обновление:** 2026-05-25 (M7 kickoff / Variant B Full PLAN §3)
**Текущий gate:** `M7_PREPARED_PENDING_KICKOFF_MERGE → GD_IN_PROGRESS`

## История

- **M0 — Каркас процесса:** DONE 2026-05-18. PR #1.
- **M1 — Технический скелет:** DONE 2026-05-19. Gate-close PR #12 merged Alex'ом в `main`. Полный summary — `staff/handoff/M1-SUMMARY.md`.
- **M2 — Играбельный MVP:** DONE 2026-05-20. Gate-close PR #19 merged Alex'ом в `main`. Полный summary — `staff/handoff/M2-SUMMARY.md`. Core loop полный, 4 системы, 9 сцен, 49 unit-тестов, build 1.5 MB.
- **M3 — Расширение мира:** DONE 2026-05-21. Gate-close PR #30 merged PM по делегации Alex'а в `main`. Полный summary — `staff/handoff/M3-SUMMARY.md`. 3 зоны, 8 мобов, 29 items, 15 recipes, 89/89 vitest.
- **M4 — Перки и прогрессия:** DONE 2026-05-22. Gate-close PR #39 merged в `main`. 128/128 vitest, 1.5 MB build, 8 perks + XP progression. Полный summary — `staff/handoff/M4-SUMMARY.md`.
- **M5 — Боссы и инстансы:** DONE 2026-05-25. Gate-close PR #47 merged PM по делегации Alex'а в `main`. Полный summary — `staff/handoff/M5-SUMMARY.md`. Итоги: 152/152 vitest, 1.48 MB build, 412 KB assets.
- **M6 — Радио и доверие:** DONE 2026-05-25. Gate-close PR #57 merged PM по делегации Alex'а в `main`. Полный summary — `staff/handoff/M6-SUMMARY.md`. Итоги: 6 radio signals, `radio_trust [-5,+5]`, RadioScene M6, ambush routing fix, **164/164 vitest**, project total **456 KB**.
- **M7 — Полировка и баланс:** PM_KICKOFF 2026-05-25. Scope approved by Alex: Variant B / Full PLAN §3.

## M7 scope (Variant B)

См. `staff/status/M7.md` для полного scope/anti-scope/DoD.

- Balance tuning pass for M2–M6 entities and economy.
- UI sounds: exactly 10 short SFX, first project audio layer.
- Animation polish: exactly 16 Phaser tweens, visual only.
- Smoke regression M2–M6.
- 6 new zones → total 9.
- 45 new items → total 80.
- 24 new recipes → total 42.
- Per-zone balance.

## Orchestration sequence M7

1. **[IN PROGRESS]** PM kickoff PR `pm/m7-kickoff → m7-integration`: `staff/status/M7.md`, 6 kickoff files, 6 handoff files, dashboard updates.
2. **[NEXT]** GD M7 amendment: GDD §11.M7 + balance §M7.
3. QA Spec M7 reviews GD amendment.
4. If needed: GD fix + QA Spec re-review.
5. Content + Engineer + Artist parallel after QA Spec APPROVE.
6. QA Acceptance M7: local octopus-merge + 3 Gates.
7. PM merges approved role PRs into `m7-integration`, QA Acceptance last.
8. PM finalize + gate-close `m7-integration → main` per Alex delegation unless changed.

## Lessons learned M2–M6 (применять на M7)

- Role plans must be 5–7 actions max.
- Recovery-safe: early Draft PR, commit/push after each logical substep, PR Recovery block.
- PAT hygiene: Authorization header / `GIT_ASKPASS` only; never URL/echo/print.
- If Devin git proxy returns 403, use direct GitHub transport with PAT header/askpass; do not change global git config.
- DoD precision: exact numbers, not `≥`/`~` for acceptance targets.
- QA Acceptance uses local octopus-merge.
- QA runtime fixes are cherry-picked into the relevant role branch before role-PR merge.
- QA Acceptance PR is merged last so net delta is QA report only.

## Блокеры

- Нет. M7 kickoff materials in progress on `pm/m7-kickoff`.

## PR (активные / плановые)

- **PM kickoff** `pm/m7-kickoff → m7-integration`: dashboard + 6 kickoff + 6 handoff + shared dashboard updates.
- **TBD GD** `m7/gd-amendment → m7-integration`: after kickoff merge.
- **TBD QA Spec** `qa/m7-spec-review → m7-integration`: after GD PR Ready.
- **TBD Content / Engineer / Artist**: parallel after QA Spec APPROVE.
- **TBD QA Acceptance** `qa/m7-acceptance → m7-integration`: after role PRs Ready.
- **TBD gate-close** `m7-integration → main`: after PM finalize, per delegation.

## История PR (закрытые / смерженные)

- **M6 (closed):** #48 PM kickoff, #49 GD amendment, #50 QA Spec APPROVE, #51 PM status-sync, #52 Content, #53 Engineer (+QA fix `c2ccab8`), #54 Artist, #55 QA Acceptance APPROVE, #56 PM finalize, #57 gate-close.
- **M5 (closed):** #40 PM kickoff, #41 GD amendment, #42 QA Spec APPROVE, #43 Artist, #44 Content, #45 Engineer, #46 QA Acceptance APPROVE (closed without merge in M6 stale-cleanup), #47 gate-close.
- **M4 (closed):** #31 PM kickoff, #32 GD amendment, #33 QA Spec CHANGES_REQUESTED, #34 GD fix, #35 QA Spec APPROVE, #36 Content, #37 Engineer, #38 Artist, #39 gate-close.
- **M3 (closed):** #20 PM kickoff, #21 GD amendment, #22 QA Spec APPROVE, #23 PM status-sync, #24 PM DoD-align items=29, #25 Content, #26 Engineer, #27 Artist, #28 QA Acceptance APPROVE, #29 PM finalize, #30 PM gate-close.
- **M2 (closed):** #14 → main, #15/#16/#17/#18 → m2-integration, #19 gate-close.
- **M1 (closed):** #6/#7/#11/#13 → m1-integration, #8/#9/#10/#12 → main.

## Что делать новой PM-сессии (recovery)

1. Прочитай `staff/status/PM.md`, `staff/status/M7.md`, `staff/PLAN.md`, `staff/STATE_MACHINE.md`, `staff/LINKS.md`, `staff/CONTEXT.md`, `staff/handoff/M6-SUMMARY.md`.
2. Verify GitHub fact: `main` HEAD `859a652`, `m7-integration` exists, PM kickoff PR base is `m7-integration`.
3. If kickoff PR not merged: finish/review `pm/m7-kickoff` and merge only when ready.
4. After merge: send Alex the GD M7 prompt from `staff/kickoff/M7-GD.md`.
5. PM edits only staff orchestration/status/handoff/kickoff/dashboard files; do not implement code/content/assets/docs for role scope.
