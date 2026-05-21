# Status: PM

**Текущая веха:** M3 — Расширение мира (фактически закрыта, ждёт gate-close)
**Статус:** M3_DONE_PENDING_GATE_CLOSE (все 9 M3 PR смержены в `m3-integration`: spec phase #20/#21/#22 + PM align #23/#24 + parallel production #25/#26/#27 + QA Acceptance #28 verdict **APPROVE** + PM finalize #29 — этот PR. После merge этого PR PM откроет gate-close PR `m3-integration → main`, который мерджит Alex/Заказчик.)
**Последнее обновление:** 2026-05-21 (finalize под факт #25/#26/#27/#28 merged в `m3-integration`)
**Текущий gate:** `M3_DONE_PENDING_GATE_CLOSE`

## История

- **M0 — Каркас процесса:** DONE 2026-05-18. PR #1.
- **M1 — Технический скелет:** DONE 2026-05-19. Gate-close PR #12 merged Alex'ом в `main`. Полный summary — `staff/handoff/M1-SUMMARY.md`.
- **M2 — Играбельный MVP:** DONE 2026-05-20. Gate-close PR #19 merged Alex'ом в `main`. Полный summary — `staff/handoff/M2-SUMMARY.md`. Core loop полный, 4 системы, 9 сцен, 49 unit-тестов, build 1.5 MB.
- **M3 — Расширение мира:** фактически DONE, ждёт gate-close PR `m3-integration → main` (мерджит Alex). Полный summary — `staff/handoff/M3-SUMMARY.md`.
  - Spec phase (merged 2026-05-20): PR #20 PM kickoff, PR #21 GD amendment (GDD §5.4 / §6.2 / §6.4.M3 / §10.M3 + balance §M3), PR #22 QA Spec APPROVE.
  - PM align (merged 2026-05-21): PR #23 status-sync (dashboards под факт #20/#21/#22), PR #24 DoD-align items=29 под факт balance §M3.
  - Parallel production (merged 2026-05-21): PR #25 Content (+5 mobs / +14 items / +10 recipes / +2 zones / +3 dummy radio signals), PR #26 Engineer (multi-zone runtime + 5 mob AI + RadioScene stub + 89/89 vitest), PR #27 Artist (5 mob sprites + 14 item icons + 2 backgrounds + radio_icon, 129.8 KB / 500 KB).
  - QA Acceptance (merged 2026-05-21): PR #28 verdict **APPROVE** на октопус-комбинации #25/#26/#27. 3 Gate'а (static / runtime smoke / spec compliance) — все пройдены. 0 blockers / 3 non-blocking M4 follow-ups (RadioScene rowHeight, BootScene M3 preload, MobType:"boss" под M5).
  - Текущий PR (`pm/m3-finalize → m3-integration`, PR #29): finalize — M3-SUMMARY.md, CHANGELOG entry, dashboards (M3.md / PM.md / PLAN / CONTEXT / LINKS / STATE_MACHINE) под факт M3 closed.
  - Следующий шаг: после merge этого PR Alex'ом в `m3-integration` — ПМ открывает gate-close PR `m3-integration → main`; мерджит Alex (НЕ self-merge). После gate-close — M4 kickoff (пишет следующая PM-сессия).

## Что сделано на M3 (итог)

См. `staff/status/M3.md` для полного scope/anti-scope/DoD и `staff/handoff/M3-SUMMARY.md` для фактического summary. Кратко:

- **GD M3 amendment (PR #21)**: GDD §5.4 (5 новых мобов с `behavior_id`), §6.2 (Mob schema + `mech` enum), §6.4.M3 (2 новые зоны Склад + Город с zone-exclusive ресурсами и unlock_condition), §10.M3 (RadioSignal stub: JSON-схема + UI-flow, заглушка для M3 без реальной логики), `balance.md` §M3 (числа).
- **QA Spec M3 review (PR #22)**: verdict APPROVE по 7 чек-листам (вкл. anti-scope + M1-M2 regression).
- **Content M3 (PR #25)**: +5 mobs (всего 8), +14 items (всего 29), +10 recipes (всего 15), +2 zones (всего 3), +3 dummy radio signals. JSON cross-refs валидны, balance.md §M3 сверена, M1 неизменён, forest без `return_time_multiplier` → default 1.0.
- **Engineer M3 (PR #26)**: multi-zone runtime + 5 mob AI behaviors + zoneUnlock + radio + weight zoneMultiplier; 89/89 vitest passed (49 M2 + 40 M3); build clean ~1.5 MB.
- **Artist M3 (PR #27)**: 5 mob sprites (128×128) + 14 item icons (64×64) + 2 backgrounds + radio_icon, детерминистичный `tools/art/gen_m3_assets.py`. M3-add 129.8 KB / 500 KB (26%).
- **QA Acceptance M3 (PR #28)**: локальный octopus-merge всех 3 role-PR + 3 Gate'а (static / runtime smoke / spec compliance) — все PASS. Verdict **APPROVE**. 0 blockers, 3 non-blocking M4 follow-ups (cosmetic).
- **PM finalize M3 (этот PR #29)**: gate → `M3_DONE_PENDING_GATE_CLOSE`, M3-SUMMARY.md, CHANGELOG entry, status-sync всех PM-owned dashboards.
- **Gate-close M3 (TBD)**: после merge этого PR PM откроет `m3-integration → main`; мерджит Alex (НЕ self-merge).

## Lessons learned M2+M3 (применять на M4)

- **Token-budget**: план role-сессии **строго 5-7 пунктов**. На M3 все 3 role-сессии уложились в 5-7 + 1 recovery-fix (Content `b9a215f → 0824db6` accidental staff/ revert restoration) — работает.
- **Recovery-safe PR**: ранний Draft PR обязателен (после первой 1-2 правки). На M3 все 4 role-PR и QA Acceptance открылись как Draft в первые 5-10 минут.
- **PAT-hygiene**: PAT только в Authorization header / env var (через `GIT_ASKPASS` shell-скрипт или direct API call), никогда в URL / echo / print. M3 PM-сессия finalize'а использовала `$GITHUB_PAT_ALEXBAYOV` через GIT_ASKPASS → stdout password-prompt.
- **Git-proxy 403**: PM-сессия между машинами может получить 403 от `git-manager.devin.ai/proxy/github.com/` — это при смене токена между сессиями. Fix: `git -c url.https://github.com/.pushInsteadOf=https://github.com/ -c credential.helper= push` с GIT_ASKPASS, отдающим $GITHUB_PAT_ALEXBAYOV в password-prompt.
- **QA-blocker** на спек-нарушения требует PM-верификации локально. На M3 QA Acceptance не выдала blocker'ов — 3 non-blocking M4 follow-ups (cosmetic).
- **Anti-scope discipline**: каждый kickoff явно перечисляет, что НЕ входит в веху. На M3 anti-scope grep'ом проверен в рамках QA Gate 3 (radio.json без M6-полей, src/ без M4 perks / M5 boss / M6 trust / M7 modules / M8 Yandex SDK).
- **DoD-precision (НОВОЕ из M3)**: в PM kickoff M{N+1} всегда давать точные числа, не «≥X» / «~Y». На M3 DoD «≥30 items / ~15 новых» отъехала от факта balance §M3 (14 новых, итого 29) → потребовался PR #24 DoD-align.
- **Octopus-merge dry-run в QA Acceptance (НОВОЕ из M3)**: QA на M3 сделала локальный octopus-merge всех 3 role-PR (`qa/m3-acceptance-test`) и проверяла static+runtime+spec на комбинации — это поймало бы cross-PR конфликты раньше. Для M4+ kickoff'ов QA Acceptance явно прописываем octopus-merge step.

## Блокеры

- Нет. M3 фактически закрыта в `m3-integration`. Ждёт (а) merge этого PR #29 Alex'ом в `m3-integration`, (б) gate-close PR `m3-integration → main` для Alex.

## PR (активные / плановые)

- **Этот PR** `pm/m3-finalize → m3-integration` (PR #29): finalize — M3-SUMMARY.md, CHANGELOG entry, status-sync всех PM-owned dashboards (M3.md / PM.md / PLAN / CONTEXT / LINKS / STATE_MACHINE) под факт #25/#26/#27/#28 merged.
- **TBD** Gate-close PR `m3-integration → main` — PM открывает после merge этого PR; мерджит Alex/Заказчик (НЕ self-merge).

## История PR (закрытые / смерженные)

- M3 (merged в `m3-integration`, ждёт gate-close): #20 PM kickoff, #21 GD amendment, #22 QA Spec APPROVE, #23 PM status-sync, #24 PM DoD-align items=29, #25 Content, #26 Engineer, #27 Artist, #28 QA Acceptance APPROVE.
- M2 (closed): #14 → main, #15/#16/#17/#18 → m2-integration, #19 (gate-close) → main.
- M1 (closed): #6/#7/#11/#13 → m1-integration, #8/#9/#10/#12 → main.

## Что делать новой PM-сессии (recovery)

1. Прочитай `staff/status/PM.md` (этот файл), `staff/status/M3.md`, `staff/handoff/M3-SUMMARY.md`, `staff/handoff/M2-SUMMARY.md` (как шаблон), `staff/STATE_MACHINE.md`, `staff/PLAN.md`.
2. Проверь статус M3 на GitHub (факт сильнее dashboard'ов):
   - PR #29 `pm/m3-finalize → m3-integration`: если ещё не смержен — попроси Alex'а смержить (он без CI обязательств, только PM-owned стафф-файлы).
   - После merge этого PR — открывай gate-close PR `main ← m3-integration` (мерджит Alex, НЕ self-merge).
   - После gate-close merge — готовь M4 kickoff (перки + прогрессия, PLAN §3).
3. **Координация ролей M3 (фактически закрыта)**: все 3 role-сессии (Content #25, Engineer #26, Artist #27) + QA Acceptance #28 отработали и их PR смержены 2026-05-21. Дополнительные role-сессии НЕ нужны.
4. **Лессоны M2+M3** (PRESERVED, важны для M4): план role-сессии ≤ 5-7 действий, recovery-safe ранний Draft PR + commit/push after each substep + PR Recovery block, PAT-hygiene (Authorization header / GIT_ASKPASS, не в URL), anti-scope discipline, DoD-precision (точные числа, не «≥X»), octopus-merge в QA Acceptance.
5. Не пиши код/контент/ассеты сам. Не self-merge gate-close. PM обновляет только: `staff/status/PM.md`, `staff/status/M{N}.md`, `staff/PLAN.md`, `staff/decisions/CHANGELOG.md`, `staff/decisions/DECISIONS.md`, `staff/handoff/M{N}-SUMMARY.md`, `staff/CONTEXT.md`, `staff/LINKS.md`, `staff/STATE_MACHINE.md` (только §Текущее состояние).
