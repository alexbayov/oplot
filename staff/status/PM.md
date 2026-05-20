# Status: PM

**Текущая веха:** M3 — Расширение мира
**Статус:** M3_PREPARED (PM kickoff в работе; `m3-integration` создан от свежего `main`; этот PR `pm/m3-kickoff` готовит dashboards и kickoff/handoff материалы под 6 ролей M3)
**Последнее обновление:** 2026-05-20 (после Alex merged M2 gate-close PR #19)
**Текущий gate:** `M3_PREPARED`

## История

- **M0 — Каркас процесса:** DONE 2026-05-18. PR #1.
- **M1 — Технический скелет:** DONE 2026-05-19. Gate-close PR #12 merged Alex'ом в `main`. Полный summary — `staff/handoff/M1-SUMMARY.md`.
- **M2 — Играбельный MVP:** DONE 2026-05-20. Gate-close PR #19 merged Alex'ом в `main`. Полный summary — `staff/handoff/M2-SUMMARY.md`. Core loop полный, 4 системы, 9 сцен, 49 unit-тестов, build 1.5 MB.
- **M3 — Расширение мира:** IN_PROGRESS, PM kickoff 2026-05-20.

## Что планируется на M3

См. `staff/status/M3.md` для полного scope/anti-scope/DoD. Кратко:

- **GD M3 amendment**: §5.4 (5 новых мобов с уникальным AI), §6.4.M3 (2 новые зоны Склад + Город с zone-exclusive ресурсами и unlock_condition), новая §7 (radio system structure — JSON-схема + UI-flow, заглушка для M3 без реальной логики ветвлений). Плюс `balance.md` §M3 (числа).
- **QA Spec M3 review**: ревью GD-amendment, право вето.
- **Параллельно после GD merge + QA Spec APPROVE:**
  - **Content M3**: +15 items (всего 30), +5 mobs (всего 8), +10 recipes (всего 15), +2 zones (всего 3), +2-3 dummy radio signals.
  - **Engineer M3**: multi-zone runtime + 5 mob AI behaviors + RadioScene stub + RadioSignal type + тесты (≥ 56).
  - **Artist M3**: 5 mob sprites + 2 backgrounds + ~10 item icons. Pillow pipeline placeholder-класса.
- **QA Acceptance M3**: full §1–§8 проверка после 3 ready role-PR.
- **PM finalize M3**: gate → M3_DONE, M3-SUMMARY, CHANGELOG.
- **Gate-close M3**: `m3-integration → main`, мерджит Alex.

## Lessons learned M2 (применяются на M3)

- **Token-budget**: план role-сессии **строго 5-7 пунктов** (НЕ 13 как у M2 Engineer). Если больше — разбивать на continuation. Прописано во всех M3 kickoff'ах.
- **Recovery-safe PR**: ранний Draft PR обязателен (после первой 1-2 правки). Прописано во всех M3 kickoff'ах.
- **PAT-hygiene**: PAT только в Authorization header / env var, никогда в URL / echo / print. Прописано во всех M3 kickoff'ах explicitly.
- **Git-proxy 403**: PM-сессия использует org-scope secret `GITHUB_PAT_OPLOT` напрямую через REST API / git auth. Manual PAT не требуется ни для PM, ни для role merges.
- **QA-blocker** на спек-нарушения требует PM-верификации локально (1 раз QA нашла отсутствие ReturnScene на M2) → промо для Engineer M3 явно перечисляет 3 deliverables: multi-zone, 5 mob AI, RadioScene stub.
- **Anti-scope discipline**: каждый kickoff M3 явно перечисляет, что НЕ входит в M3 (перки M4, боссы M5, полная радио-логика M6, модули, Yandex SDK).

## Блокеры

- Нет. PM kickoff PR `pm/m3-kickoff` готовится для merge в `m3-integration`. После merge — следующий шаг GD M3 amendment session.

## PR (активные)

- **Этот PR** `pm/m3-kickoff → m3-integration`: M3 dashboard + 6 kickoff + 6 handoff материалов + PLAN/CONTEXT/LINKS/CHANGELOG update.
- **TBD** GD M3 amendment PR `m3/gd-amendment → m3-integration` — следующий шаг после merge этого PR.
- **TBD** QA Spec M3 PR `qa/m3-spec-review → m3-integration` — после GD PR open.
- **TBD** Content / Engineer / Artist M3 PRs (parallel) — после GD merge + QA Spec APPROVE.
- **TBD** QA Acceptance M3 PR — после 3 role PR Ready.
- **TBD** PM finalize M3 + gate-close M3.

## История PR (закрытые вехи)

- M2 (closed): #14 → main, #15/#16/#17/#18 → m2-integration, #19 (gate-close) → main.
- M1 (closed): #6/#7/#11/#13 → m1-integration, #8/#9/#10/#12 → main.

## Что делать новой PM-сессии (recovery)

1. Прочитай `staff/status/PM.md` (этот файл), `staff/status/M3.md`, `staff/handoff/M2-SUMMARY.md`, `staff/STATE_MACHINE.md`, `staff/PLAN.md`.
2. Проверь статус M3 на GitHub:
   - Если этот PR `pm/m3-kickoff → m3-integration` ещё не смержен — попроси Alex'а смержить.
   - Если смержен — координируй активные role-сессии (см. `staff/status/M3.md` PR-реестр).
3. **Координация ролей M3** (after kickoff merge):
   - Сначала GD M3 amendment (single session).
   - После GD PR open → QA Spec M3 (parallel review).
   - После GD merge + QA Spec APPROVE → Content / Engineer / Artist (3 parallel sessions, каждый ≤ 5-7 действий).
   - После 3 PR Ready → QA Acceptance M3.
   - После QA APPROVE → PM merges все role PR в `m3-integration`, открывает finalize PR (gate → M3_DONE), затем gate-close PR `m3-integration → main` для Alex.
4. **Лессоны M2** (PRESERVED, важны для M3): план role-сессии ≤ 5-7 действий, recovery-safe ранний Draft PR, PAT-hygiene, anti-scope discipline.
5. Не пиши код/контент/ассеты сам. Не self-merge gate-close. PM обновляет только: `staff/status/PM.md`, `staff/status/M{N}.md`, `staff/PLAN.md`, `staff/decisions/CHANGELOG.md`, `staff/decisions/DECISIONS.md`, `staff/handoff/M{N}-SUMMARY.md`, `staff/CONTEXT.md`, `staff/LINKS.md`.
