# Status: PM

**Текущая веха:** M6 — Радио и доверие (QA Spec APPROVE, awaiting GD amendment merge)
**Статус:** M5 закрыта в `main` (gate-close PR #47, HEAD `0af8ad4`). M6 kickoff merged (PR #48 в `m6-integration`, HEAD `d5779c6`). GD M6 amendment PR #49 Ready, QA Spec M6 PR #50 verdict **APPROVE**. Следующий PM-шаг: merge PR #49 + #50 в `m6-integration`, закрыть stale PR #46, запустить parallel production (Content + Engineer + Artist M6).
**Последнее обновление:** 2026-05-25 (M6 QA Spec APPROVE PR #50, status-sync)
**Текущий gate:** `M6_QA_SPEC_APPROVED → PM_AMENDMENT_MERGE → M6_PRODUCTION_START`

## История

- **M0 — Каркас процесса:** DONE 2026-05-18. PR #1.
- **M1 — Технический скелет:** DONE 2026-05-19. Gate-close PR #12 merged Alex'ом в `main`. Полный summary — `staff/handoff/M1-SUMMARY.md`.
- **M2 — Играбельный MVP:** DONE 2026-05-20. Gate-close PR #19 merged Alex'ом в `main`. Полный summary — `staff/handoff/M2-SUMMARY.md`. Core loop полный, 4 системы, 9 сцен, 49 unit-тестов, build 1.5 MB.
- **M3 — Расширение мира:** DONE 2026-05-21. Gate-close PR #30 merged PM по делегации Alex'а в `main`. Полный summary — `staff/handoff/M3-SUMMARY.md`. 3 зоны, 8 мобов, 29 items, 15 recipes, 89/89 vitest.
- **M4 — Перки и прогрессия:** DONE 2026-05-22. Gate-close PR #39 merged в `main`. 128/128 vitest, 1.5 MB build, 8 perks + XP progression. Полный summary — `staff/handoff/M4-SUMMARY.md`.
- **M5 — Боссы и инстансы:** DONE 2026-05-25. Gate-close PR #47 merged PM по делегации Alex'а в `main`. Полный summary — `staff/handoff/M5-SUMMARY.md`. Итоги: 152/152 vitest, 1.48 MB build, 412 KB assets.
- **M6 — Радио и доверие (in progress):**
  - `m6-integration` создана от `main` HEAD `0af8ad4`.
  - PR #48 `pm/m6-kickoff → m6-integration` — **merged** (HEAD `d5779c6`).
  - PR #49 `m6/gd-amendment → m6-integration` — Ready, `mergeable_state: clean` (GDD §10.M6 full radio/trust + schema extensions + balance §M6).
  - PR #50 `qa/m6-spec-review → m6-integration` — Ready, **verdict APPROVE** (все 7 чек-листов PASS).
  - **Текущий gate:** `M6_QA_SPEC_APPROVED → PM_AMENDMENT_MERGE → M6_PRODUCTION_START`.
  - **Следующий шаг PM:** merge #49 (GD amendment) → #50 (QA Spec report) в `m6-integration`, закрыть stale PR #46 (qa/m5-acceptance — контент уже на `main` через PR #47, ветка m5-integration archive), затем запустить 3 параллельные role-сессии (Content M6 / Engineer M6 / Artist M6) с промптами из `staff/kickoff/M6-{CONTENT,ENG,ARTIST}.md`.

## Что делает PM на M6 (план + текущая позиция)

См. `staff/status/M6.md` для полного scope/anti-scope/DoD. Кратко orchestration sequence:

1. **[DONE]** PM kickoff (PR #48) — M6 dashboard + 6 kickoff + 6 handoff + shared dashboards update. Merged в `m6-integration` (HEAD `d5779c6`).
2. **[DONE]** GD M6 amendment (PR #49 Ready) — GDD §10.M6 full radio/trust + schema extensions (`type`/`zone_id`/`reward`/`trap_mob_id`/`trust_impact`/`chosen_option`/`resolved`) + balance §M6 (trust matrix + 6 signal archetypes + ambush + anti-scope).
3. **[DONE]** QA Spec M6 (PR #50, verdict APPROVE) — все 7 чек-листов PASS, 0 blocker'ов, 3 non-blocking notes (UI-flow recommendation / expiry-on-defeat design choice / trust UX feedback).
4. **[SKIPPED — N/A]** GD fix loop (нужен только при QA CHANGES_REQUESTED, не применимо).
5. **[NEXT — PM action]** Merge PR #49 (GD amendment) → PR #50 (QA Spec report) в `m6-integration` по продолжению M3+M4+M5 делегации Alex'а; закрыть stale PR #46 (qa/m5-acceptance — контент уже на `main` через PR #47).
6. **[BLOCKED on step 5]** Parallel production — Alex запускает 3 параллельные Devin-сессии после PM merge'а #49+#50:
   - Content M6 PR: `m6/content → m6-integration` (`content/radio.json` → exactly 6 signals: 2 truth + 2 trap + 2 ambiguous).
   - Engineer M6 PR: `m6/radio → m6-integration` (radio outcomes + `GameState.progress.radio_trust` clamped `[-5,+5]` + RadioScene consequences + 12 vitest, target total 164/164).
   - Artist M6 PR: `m6/art → m6-integration` (4 PNG UI ассета, M6-add ≤ 40 KB, total ≤ 650 KB).
7. **[BLOCKED on step 6]** QA Acceptance M6 (`qa/m6-acceptance → m6-integration`) — локальный octopus-merge 3 role-PR + 3 Gate'а (static / runtime / spec).
8. **[BLOCKED on step 7 APPROVE]** PM merge sequence — после QA APPROVE PM мерджит Artist → Content → Engineer (или нейтральный порядок) + QA Acceptance PR в `m6-integration`.
9. **[BLOCKED on step 8]** PM finalize — `pm/m6-finalize → m6-integration` (M6-SUMMARY + CHANGELOG + dashboards). Self-merge.
10. **[BLOCKED on step 9]** PM gate-close — `m6-integration → main`. Self-merge (по продолжению M3+M4+M5 делегации Alex'а).

## Lessons learned M2+M3 (применять на M4)

- **Token-budget**: план role-сессии **строго 5-7 пунктов**. На M3 все 3 role-сессии уложились в 5-7 + 1 recovery-fix — работает.
- **Recovery-safe PR**: ранний Draft PR обязателен (после первой 1-2 правки). На M3 все 4 role-PR и QA Acceptance открылись как Draft в первые 5-10 минут.
- **PAT-hygiene**: PAT только в Authorization header / env var (через `GIT_ASKPASS` shell-скрипт или direct API call), никогда в URL / echo / print. M3+M4 PM-сессии используют `$GITHUB_PAT_ALEXBAYOV` через GIT_ASKPASS → stdout password-prompt.
- **Git-proxy 403**: PM-сессия между машинами может получить 403 от `git-manager.devin.ai/proxy/github.com/` — это при смене токена между сессиями. Fix: `git -c url.https://github.com/.pushInsteadOf=https://github.com/ -c credential.helper= push` с GIT_ASKPASS, отдающим $GITHUB_PAT_ALEXBAYOV в password-prompt. **Применено для `m4-integration` push в M4 kickoff (PR #31).**
- **QA-blocker** на спек-нарушения требует PM-верификации локально. На M3 QA Acceptance не выдала blocker'ов — 3 non-blocking M4 follow-ups (cosmetic) fold'нуты в Engineer M4 scope.
- **Anti-scope discipline**: каждый kickoff явно перечисляет, что НЕ входит в веху. На M4 anti-scope: skill tree (M5+ refactor), активные ability (M5+), боссы (M5), полная радио-логика (M6), Yandex SDK (M8).
- **DoD-precision (НОВОЕ из M3)**: в PM kickoff M{N+1} всегда давать точные числа, не «≥X» / «~Y». M4 kickoff даёт точное число «8 перков» и точную таблицу для balance §M4.
- **Octopus-merge dry-run в QA Acceptance (НОВОЕ из M3)**: QA на M3 сделала локальный octopus-merge всех 3 role-PR (`qa/m3-acceptance-test`). M4 QA Acceptance handoff явно прописывает octopus-merge step.
- **Merge delegation (НОВОЕ из M3)**: Alex явно делегировал PM-сессии merge gate-close PR в `main` («гитпат выдам свой если надо — мерж на тебе»). Это отступление от стандартной STATE_MACHINE-политики. M4 продолжает делегацию, если Alex не изменит политику явно.
- **Skill-tree evolution (НОВОЕ из M4 kickoff)**: GDD M4 amendment явно зафиксирует, что skill tree (поинты + ноды + prereq'и) — M5+ refactor path. M4 умышленно делает простой JSON schema (flat 8 пассивных перков), чтобы M5 refactor был аддитивным (добавление полей `prereq` / `tier` / `cost`). Это предотвращает double-work и фиксирует boundary.

## Блокеры

- Нет. QA Spec M6 APPROVE (PR #50); PM amendment merge sequence разрешён по делегации Alex'а.

## PR (активные / плановые)

- **#46** `qa/m5-acceptance → m5-integration`: QA Acceptance M5 — APPROVE report. **STALE.** Контент уже на `main` через commit `5feb9b9c` (M5 gate-close PR #47). Рекомендация: close без merge'а.
- **#49** `m6/gd-amendment → m6-integration`: GD M6 amendment — Ready, mergeable_state `clean`. **Next: PM merge** после Alex go-ahead.
- **#50** `qa/m6-spec-review → m6-integration`: QA Spec M6 verdict APPROVE — Ready, mergeable_state `clean`. **Next: PM merge** после Alex go-ahead.
- **TBD** `m6/content → m6-integration`: Content M6 — pending (parallel production after #49+#50 merged).
- **TBD** `m6/radio → m6-integration`: Engineer M6 — pending (parallel production).
- **TBD** `m6/art → m6-integration`: Artist M6 — pending (parallel production).
- **TBD** `qa/m6-acceptance → m6-integration`: QA Acceptance M6 — pending (после 3 role-PR Ready).
- **TBD** gate-close `m6-integration → main`.

## История PR (закрытые / смерженные)

- **M5 (closed):** #40 PM kickoff, #41 GD amendment, #42 QA Spec APPROVE, #43 Artist, #44 Content, #45 Engineer, #46 QA Acceptance APPROVE (открыт остаточно, см. блок «PR активные»), #47 gate-close (PM по делегации Alex'а).
- **M4 (closed):** #31 PM kickoff, #32 GD amendment, #33 QA Spec CHANGES_REQUESTED, #34 GD fix, #35 QA Spec APPROVE, #36 Content, #37 Engineer, #38 Artist, далее QA Acceptance + finalize + #39 gate-close.
- **M3 (closed):** #20 PM kickoff, #21 GD amendment, #22 QA Spec APPROVE, #23 PM status-sync, #24 PM DoD-align items=29, #25 Content, #26 Engineer, #27 Artist, #28 QA Acceptance APPROVE, #29 PM finalize, #30 PM gate-close M3 (PM по делегации Alex'а).
- **M2 (closed):** #14 → main, #15/#16/#17/#18 → m2-integration, #19 (gate-close) → main.
- **M1 (closed):** #6/#7/#11/#13 → m1-integration, #8/#9/#10/#12 → main.

## Что делать новой PM-сессии (recovery)

1. Прочитай `staff/status/PM.md` (этот файл), `staff/status/M6.md`, `staff/handoff/M5-SUMMARY.md`, `staff/STATE_MACHINE.md`, `staff/PLAN.md`.
2. Проверь статус M6 на GitHub (факт сильнее dashboard'ов):
   - PR #48 `pm/m6-kickoff → m6-integration`: **merged**.
   - PR #49 `m6/gd-amendment → m6-integration`: Ready.
   - PR #50 `qa/m6-spec-review → m6-integration`: verdict **APPROVE**, Ready.
   - PR #46 `qa/m5-acceptance → m5-integration`: stale (контент на `main` через `5feb9b9c`), close без merge'а.
   - Если все три M6-условия выполнены → выполнить PM merge sequence #49 → #50 в `m6-integration`.
   - Затем запустить 3 параллельные Devin-сессии (Content/Engineer/Artist M6) с промптами из `staff/kickoff/M6-{CONTENT,ENG,ARTIST}.md`.
3. **Лессоны M2+M3** (PRESERVED, важны для M4): план role-сессии ≤ 5-7 действий, recovery-safe ранний Draft PR + commit/push after each substep + PR Recovery block, PAT-hygiene (Authorization header / GIT_ASKPASS, не в URL), anti-scope discipline, DoD-precision (точные числа, не «≥X»), octopus-merge в QA Acceptance, merge delegation (PM мерджит по явному указанию Alex'а), skill-tree evolution (M5+ refactor).
4. **Git-proxy 403 workaround:**
   ```bash
   # /tmp/git-askpass.sh уже создан в snapshot'е (если нет — пересоздай):
   cat > /tmp/git-askpass.sh <<'EOF'
   #!/bin/bash
   case "$1" in
     Username*) echo "x-access-token";;
     Password*) echo "$GITHUB_PAT_ALEXBAYOV";;
   esac
   EOF
   chmod +x /tmp/git-askpass.sh

   # Push команда:
   GIT_ASKPASS=/tmp/git-askpass.sh GIT_TERMINAL_PROMPT=0 \
   git -c "url.https://github.com/.pushInsteadOf=https://github.com/" \
       -c credential.helper= \
       push origin <branch>
   ```
5. Не пиши код/контент/ассеты сам. PM обновляет только: `staff/status/PM.md`, `staff/status/M{N}.md`, `staff/PLAN.md`, `staff/decisions/CHANGELOG.md`, `staff/decisions/DECISIONS.md`, `staff/handoff/M{N}-SUMMARY.md`, `staff/CONTEXT.md`, `staff/LINKS.md`, `staff/STATE_MACHINE.md` (только §Текущее состояние), `staff/kickoff/M{N}-*.md`, `staff/handoff/M{N}-*.md` (для нового веха только).
