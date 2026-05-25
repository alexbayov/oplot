# Status: PM

**Текущая веха:** M6 — Радио и доверие (DONE, gate-close pending)
**Статус:** Все M6 role-PR смержены в `m6-integration` (HEAD `e32d622` после PR #55 мерджа). QA Acceptance APPROVE. PM finalize PR `pm/m6-finalize → m6-integration` подготовлен (этот status отражает его содержание). Следующий PM-шаг: self-merge finalize PR → открыть gate-close PR `m6-integration → main` → self-merge по продолжению M3+M4+M5 делегации Alex'а.
**Последнее обновление:** 2026-05-25 (M6 PM finalize — M6-SUMMARY + CHANGELOG + dashboards)
**Текущий gate:** `M6_DONE_PENDING_GATE_CLOSE`

## История

- **M0 — Каркас процесса:** DONE 2026-05-18. PR #1.
- **M1 — Технический скелет:** DONE 2026-05-19. Gate-close PR #12 merged Alex'ом в `main`. Полный summary — `staff/handoff/M1-SUMMARY.md`.
- **M2 — Играбельный MVP:** DONE 2026-05-20. Gate-close PR #19 merged Alex'ом в `main`. Полный summary — `staff/handoff/M2-SUMMARY.md`. Core loop полный, 4 системы, 9 сцен, 49 unit-тестов, build 1.5 MB.
- **M3 — Расширение мира:** DONE 2026-05-21. Gate-close PR #30 merged PM по делегации Alex'а в `main`. Полный summary — `staff/handoff/M3-SUMMARY.md`. 3 зоны, 8 мобов, 29 items, 15 recipes, 89/89 vitest.
- **M4 — Перки и прогрессия:** DONE 2026-05-22. Gate-close PR #39 merged в `main`. 128/128 vitest, 1.5 MB build, 8 perks + XP progression. Полный summary — `staff/handoff/M4-SUMMARY.md`.
- **M5 — Боссы и инстансы:** DONE 2026-05-25. Gate-close PR #47 merged PM по делегации Alex'а в `main`. Полный summary — `staff/handoff/M5-SUMMARY.md`. Итоги: 152/152 vitest, 1.48 MB build, 412 KB assets.
- **M6 — Радио и доверие:** DONE 2026-05-25 (gate-close pending). Полный summary — `staff/handoff/M6-SUMMARY.md`. Итоги: 6 radio signals (2 truth + 2 trap + 2 ambiguous), `RadioSignal` schema extensions, `radio_trust` `[-5,+5]`, Phaser-free `src/systems/radio.ts`, RadioScene M6 + ambush интеграция в CombatScene, **164/164 vitest** (152 M5 + 12 M6), 4 PNG ассета **26.2 KB / 40 KB** M6-budget, project total **456 KB / 650 KB**, build clean. QA Acceptance APPROVE с 1 fix'ом (`f1ab9fa` cherry-pick'нут в Engineer's PR как `c2ccab8`). `m6-integration` HEAD `e32d622` post-#55.

## Что делает PM на M6 (фактическое исполнение — все шаги done кроме gate-close)

См. `staff/status/M6.md` для полного scope/anti-scope/DoD. Orchestration sequence:

1. **[DONE]** PM kickoff PR #48 → merged в `m6-integration` (HEAD `d5779c6`).
2. **[DONE]** GD M6 amendment PR #49 → merged (`b17ac0c`).
3. **[DONE]** QA Spec M6 PR #50 verdict APPROVE → merged (`8935f39`).
4. **[N/A]** GD fix loop — не понадобился (QA Spec APPROVE на первой итерации).
5. **[DONE]** PM status-sync PR #51 → self-merged (`ee203f1`).
6. **[DONE]** Parallel production: Content PR #52 / Engineer PR #53 / Artist PR #54 реализованы 3 параллельными Devin-сессиями; QA Acceptance preview поднялась параллельно (4-launch).
7. **[DONE]** QA Acceptance PR #55 → 3-Gate APPROVE; 1 runtime fix `f1ab9fa` (ambush `zone_id` из `signal.zone_id` вместо hardcoded `"forest"`).
8. **[DONE]** PM merge sequence — cherry-pick `f1ab9fa` → push as `c2ccab8` на `origin/m6/radio` → merge #52 (`da79c5f`) → merge #53 (`d34e488`) → merge #54 (`9bd75d5`) → merge #55 (`e32d622`).
9. **[IN PROGRESS]** PM finalize PR `pm/m6-finalize → m6-integration` (этот) — `staff/handoff/M6-SUMMARY.md` (new), CHANGELOG M6-closed entry, M6.md gate → `M6_DONE_PENDING_GATE_CLOSE`, PM.md M6 → DONE history. Self-merge по делегации.
10. **[NEXT]** PM gate-close PR `m6-integration → main`. Self-merge по продолжению M3+M4+M5 делегации Alex'а. Закрывает M6.

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

- Нет. QA Acceptance M6 APPROVE (PR #55 merged в `m6-integration`); PM finalize PR готов к self-merge по делегации Alex'а.

## PR (активные / плановые)

- **PM finalize** (этот) `pm/m6-finalize → m6-integration`: `staff/handoff/M6-SUMMARY.md` + CHANGELOG M6-closed entry + M6.md gate update + PM.md history. Self-merge по делегации.
- **TBD gate-close** `m6-integration → main`: после merge'а finalize PR. Self-merge.

## История PR (закрытые / смерженные)

- **M6 (closed in `m6-integration`, gate-close pending):** #48 PM kickoff, #49 GD amendment, #50 QA Spec APPROVE, #51 PM status-sync, #52 Content, #53 Engineer (+QA fix `c2ccab8`), #54 Artist, #55 QA Acceptance APPROVE. Stale: #46 closed without merge.
- **M5 (closed):** #40 PM kickoff, #41 GD amendment, #42 QA Spec APPROVE, #43 Artist, #44 Content, #45 Engineer, #46 QA Acceptance APPROVE (closed without merge in M6 stale-cleanup), #47 gate-close (PM по делегации Alex'а).
- **M4 (closed):** #31 PM kickoff, #32 GD amendment, #33 QA Spec CHANGES_REQUESTED, #34 GD fix, #35 QA Spec APPROVE, #36 Content, #37 Engineer, #38 Artist, далее QA Acceptance + finalize + #39 gate-close.
- **M3 (closed):** #20 PM kickoff, #21 GD amendment, #22 QA Spec APPROVE, #23 PM status-sync, #24 PM DoD-align items=29, #25 Content, #26 Engineer, #27 Artist, #28 QA Acceptance APPROVE, #29 PM finalize, #30 PM gate-close M3 (PM по делегации Alex'а).
- **M2 (closed):** #14 → main, #15/#16/#17/#18 → m2-integration, #19 (gate-close) → main.
- **M1 (closed):** #6/#7/#11/#13 → m1-integration, #8/#9/#10/#12 → main.

## Что делать новой PM-сессии (recovery)

1. Прочитай `staff/status/PM.md` (этот файл), `staff/status/M6.md`, `staff/handoff/M6-SUMMARY.md`, `staff/STATE_MACHINE.md`, `staff/PLAN.md`.
2. Проверь статус M6 на GitHub (факт сильнее dashboard'ов):
   - PR #48/#49/#50/#51/#52/#53/#54/#55: все **merged** в `m6-integration` (HEAD `e32d622` post-#55).
   - PM finalize PR `pm/m6-finalize → m6-integration`: если Ready → self-merge по делегации. Если merged → open gate-close PR `m6-integration → main` и self-merge.
   - После gate-close → M7 kickoff (PLAN §3 next milestone).
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
