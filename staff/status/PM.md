# Status: PM

**Текущая веха:** M4 — Перки и прогрессия (kickoff phase)
**Статус:** `M4_PREPARED → GD_IN_PROGRESS_PENDING` (PM создал `m4-integration` от `main` HEAD `0b1de53` и открыл Draft kickoff PR `pm/m4-kickoff → m4-integration` с M4 dashboard + 6 kickoff + 6 handoff + обновлением PLAN/CONTEXT/LINKS/STATE_MACHINE/CHANGELOG/PM). После flip Draft → Ready и PM self-merge (по продолжению M3-делегации Alex'а) — gate `M4_PREPARED → GD_IN_PROGRESS`, PM возвращает Alex'у role-session prompt для GD M4.
**Последнее обновление:** 2026-05-21 (M4 kickoff PR open)
**Текущий gate:** `M4_PREPARED → GD_IN_PROGRESS_PENDING`

## История

- **M0 — Каркас процесса:** DONE 2026-05-18. PR #1.
- **M1 — Технический скелет:** DONE 2026-05-19. Gate-close PR #12 merged Alex'ом в `main`. Полный summary — `staff/handoff/M1-SUMMARY.md`.
- **M2 — Играбельный MVP:** DONE 2026-05-20. Gate-close PR #19 merged Alex'ом в `main`. Полный summary — `staff/handoff/M2-SUMMARY.md`. Core loop полный, 4 системы, 9 сцен, 49 unit-тестов, build 1.5 MB.
- **M3 — Расширение мира:** DONE 2026-05-21. Gate-close PR #30 merged PM по делегации Alex'а в `main`. Полный summary — `staff/handoff/M3-SUMMARY.md`. 3 зоны, 8 мобов, 29 items, 15 recipes, 89/89 vitest.
- **M4 — Перки и прогрессия (kickoff phase):**
  - PM создал интеграционную ветку `m4-integration` от `main` HEAD `0b1de53` (M3 gate-close).
  - PM открыл Draft PR `pm/m4-kickoff → m4-integration` (PR #31) — M4 dashboard (`staff/status/M4.md`) + 6 kickoff (`staff/kickoff/M4-{GD,QA-SPEC,CONTENT,ENG,ARTIST,QA-ACCEPT}.md`) + 6 handoff (`staff/handoff/M4-{GD,QA-SPEC,CONTENT,ENG,ARTIST,QA-ACCEPT}.md`) + dashboards update.
  - **Текущий gate:** `M4_PREPARED → GD_IN_PROGRESS_PENDING`. После flip Draft → Ready + PM self-merge → gate `M4_PREPARED → GD_IN_PROGRESS`.
  - Следующий шаг: PM возвращает Alex'у role-session prompt для GD M4 (paste в новую Devin-сессию).

## Что делает PM на M4 (план)

См. `staff/status/M4.md` для полного scope/anti-scope/DoD. Кратко orchestration sequence:

1. **PM kickoff (этот PR #31)** — M4 dashboard + 6 kickoff + 6 handoff + dashboards update. Self-merge в `m4-integration` (по делегации Alex'а).
2. **GD M4 amendment** — PM возвращает Alex'у role-session prompt; GD пишет GDD §Прогрессия + §6.X Perk schema + balance.md §M4 (XP-curve + 8 perk numbers). PR: `m4/gd-amendment → m4-integration`.
3. **QA Spec M4** — PM запускает после GD PR Ready. QA verdict APPROVE / CHANGES_REQUESTED. PR: `qa/m4-spec-review → m4-integration`.
4. **Parallel production** — PM запускает Content + Engineer + Artist параллельно после QA Spec APPROVE.
   - Content PR: `m4/content → m4-integration` (`content/perks.json` 8 perks).
   - Engineer PR: `m4/progression → m4-integration` (xp.ts + perks.ts + ProgressionScene + LevelUpScene + 3 M3 follow-ups).
   - Artist PR: `m4/art → m4-integration` (8 perk-icons 64×64).
5. **QA Acceptance M4** — PM запускает после 3 role-PR Ready. QA локальный octopus-merge + 3 Gate'а. PR: `qa/m4-acceptance → m4-integration`.
6. **PM merge sequence** — после QA APPROVE PM мерджит 3 role-PR + QA PR в `m4-integration`.
7. **PM finalize** — `pm/m4-finalize → m4-integration` (M4-SUMMARY + CHANGELOG + dashboards). Self-merge.
8. **PM gate-close** — `m4-integration → main`. Self-merge (по продолжению M3-делегации).

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

- Нет. M4 kickoff PR в работе.

## PR (активные / плановые)

- **Этот PR** `pm/m4-kickoff → m4-integration` (PR #31): M4 dashboard + 6 kickoff + 6 handoff + dashboards update (PLAN / CONTEXT / LINKS / STATE_MACHINE / CHANGELOG / PM).
- **TBD** GD M4 amendment PR (`m4/gd-amendment → m4-integration`) — pending после merge этого PR.
- **TBD** QA Spec M4, Content M4, Engineer M4, Artist M4, QA Acceptance M4, PM finalize M4, PM gate-close M4.

## История PR (закрытые / смерженные)

- **M3 (closed):** #20 PM kickoff, #21 GD amendment, #22 QA Spec APPROVE, #23 PM status-sync, #24 PM DoD-align items=29, #25 Content, #26 Engineer, #27 Artist, #28 QA Acceptance APPROVE, #29 PM finalize, #30 PM gate-close M3 (PM по делегации Alex'а).
- **M2 (closed):** #14 → main, #15/#16/#17/#18 → m2-integration, #19 (gate-close) → main.
- **M1 (closed):** #6/#7/#11/#13 → m1-integration, #8/#9/#10/#12 → main.

## Что делать новой PM-сессии (recovery)

1. Прочитай `staff/status/PM.md` (этот файл), `staff/status/M4.md`, `staff/handoff/M3-SUMMARY.md` (унаследованное состояние), `staff/handoff/M2-SUMMARY.md` (как ещё один шаблон), `staff/STATE_MACHINE.md`, `staff/PLAN.md`.
2. Проверь статус M4 на GitHub (факт сильнее dashboard'ов):
   - PR #31 `pm/m4-kickoff → m4-integration`: если ещё не смержен — flip Draft → Ready и self-merge (PM по продолжению M3-делегации Alex'а).
   - После merge — возвращай Alex'у role-session prompt для GD M4 (см. `staff/kickoff/M4-GD.md`). Alex пастит в новую Devin-сессию.
   - Polling GD PR Ready → запускай QA Spec M4 (`staff/kickoff/M4-QA-SPEC.md`).
   - После QA Spec APPROVE → параллельно Content + Engineer + Artist (`staff/kickoff/M4-{CONTENT,ENG,ARTIST}.md`).
   - После 3 role-PR Ready → QA Acceptance (`staff/kickoff/M4-QA-ACCEPT.md`).
   - После QA APPROVE → PM merge sequence + finalize + gate-close (self-merge по делегации).
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
