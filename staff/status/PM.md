# Status: PM

**Текущая веха:** M3 — Расширение мира
**Статус:** QA_SPEC_APPROVED → PARALLEL_PRODUCTION_READY (M3 spec фаза закрыта: PR #20 PM kickoff + PR #21 GD M3 amendment + PR #22 QA Spec APPROVE все смержены в `m3-integration`. Этот PR `pm/m3-status-sync` приводит dashboards под факт GitHub. Следующий шаг — параллельный запуск Content + Engineer + Artist; после старта role-сессий gate переходит в `PARALLEL_PRODUCTION_IN_PROGRESS`.)
**Последнее обновление:** 2026-05-21 (status-sync под факт GitHub: #20/#21/#22 merged)
**Текущий gate:** `QA_SPEC_APPROVED → PARALLEL_PRODUCTION_READY`

## История

- **M0 — Каркас процесса:** DONE 2026-05-18. PR #1.
- **M1 — Технический скелет:** DONE 2026-05-19. Gate-close PR #12 merged Alex'ом в `main`. Полный summary — `staff/handoff/M1-SUMMARY.md`.
- **M2 — Играбельный MVP:** DONE 2026-05-20. Gate-close PR #19 merged Alex'ом в `main`. Полный summary — `staff/handoff/M2-SUMMARY.md`. Core loop полный, 4 системы, 9 сцен, 49 unit-тестов, build 1.5 MB.
- **M3 — Расширение мира:** IN_PROGRESS.
  - PM kickoff PR #20 merged 2026-05-20 (`pm/m3-kickoff → m3-integration`).
  - GD M3 amendment PR #21 merged 2026-05-20 (`m3/gd-amendment → m3-integration`): GDD §5.4 / §6.2 / §6.4.M3 / §10.M3 + balance §M3.
  - QA Spec Review PR #22 merged 2026-05-20 (`qa/m3-spec-review → m3-integration`): verdict APPROVE по 7 чек-листам.
  - Текущий PR (`pm/m3-status-sync → m3-integration`): status-sync dashboards под факт GitHub.
  - Следующий шаг: запустить Content / Engineer / Artist параллельно (см. соответствующие `staff/kickoff/M3-*.md`).

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

- Нет. M3 spec фаза закрыта. M3-integration готов к parallel-production. Ожидаю от Alex запуска Content + Engineer + Artist role-сессий.

## PR (активные / плановые)

- **Этот PR** `pm/m3-status-sync → m3-integration`: status-sync dashboard под факт GitHub (#20/#21/#22 merged); подготовка к parallel-production launch.
- **TBD** Content M3 PR `m3/content → m3-integration` — запускается параллельно с Engineer/Artist.
- **TBD** Engineer M3 PR `m3/world → m3-integration` — запускается параллельно с Content/Artist.
- **TBD** Artist M3 PR `m3/art → m3-integration` — запускается параллельно с Content/Engineer.
- **TBD** QA Acceptance M3 PR `qa/m3-acceptance → m3-integration` — после 3 role PR Ready.
- **TBD** PM finalize M3 → gate-close M3.

## История PR (закрытые / смерженные)

- M3 spec phase (merged in m3-integration): #20 PM kickoff, #21 GD amendment, #22 QA Spec APPROVE.
- M2 (closed): #14 → main, #15/#16/#17/#18 → m2-integration, #19 (gate-close) → main.
- M1 (closed): #6/#7/#11/#13 → m1-integration, #8/#9/#10/#12 → main.

## Что делать новой PM-сессии (recovery)

1. Прочитай `staff/status/PM.md` (этот файл), `staff/status/M3.md`, `staff/handoff/M2-SUMMARY.md`, `staff/STATE_MACHINE.md`, `staff/PLAN.md`, `staff/kickoff/M3-CONTENT.md`, `staff/kickoff/M3-ENG.md`, `staff/kickoff/M3-ARTIST.md`, `staff/kickoff/M3-QA-ACCEPT.md`.
2. Проверь статус M3 на GitHub (факт сильнее dashboard'ов):
   - Этот PR `pm/m3-status-sync → m3-integration` ещё не смержен — попроси Alex'а смержить (он без CI обязательств, только стафф-файлы).
   - После merge — запускай параллельные role-сессии Content + Engineer + Artist.
3. **Координация ролей M3** (спек-фаза закрыта, осталась production-фаза):
   - Распараллельте Content / Engineer / Artist (3 sessions, каждый план ≤ 5-7 действий). Каждый открывает ранний Draft PR в `m3-integration` + commit/push после каждого под-шага + PR Recovery block.
   - После 3 PR Ready → QA Acceptance M3 (`staff/kickoff/M3-QA-ACCEPT.md`).
   - После QA APPROVE → PM merges все role PR в `m3-integration`, открывает finalize PR (gate → M3_DONE), затем gate-close PR `m3-integration → main` для Alex.
4. **Лессоны M2** (PRESERVED, важны для M3): план role-сессии ≤ 5-7 действий, recovery-safe ранний Draft PR + commit/push after each substep + PR Recovery block, PAT-hygiene, anti-scope discipline.
5. Не пиши код/контент/ассеты сам. Не self-merge gate-close. PM обновляет только: `staff/status/PM.md`, `staff/status/M{N}.md`, `staff/PLAN.md`, `staff/decisions/CHANGELOG.md`, `staff/decisions/DECISIONS.md`, `staff/handoff/M{N}-SUMMARY.md`, `staff/CONTEXT.md`, `staff/LINKS.md`.
