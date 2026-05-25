# M6 Summary — Радио и доверие

**Дата закрытия:** 2026-05-25  
**Integration branch:** `m6-integration`  
**Gate-close:** `m6-integration → main`  
**Verdict:** DONE / APPROVE

## Что вошло

- 6 M6 radio signals в `content/radio.json` (2 truth + 2 trap + 2 ambiguous), заменили 3 M3 dummy.
- `RadioSignal` schema extensions: `type` (truth/trap/ambiguous), `zone_id`, `reward`, `trap_mob_id`, `trust_impact`, `chosen_option`, `resolved`.
- `GameState.progress.radio_trust` — целое число, clamp `[-5, +5]`, default `0`.
- Phaser-free `src/systems/radio.ts`: `resolveRadioChoice` (typed `ResolveStatus`, trust clamp, reward + ambush descriptor), `tickRadioOnReturn` (auto-resolve при `expires_after_sorties == 0`).
- `RadioScene` M6: trust HUD, outcome summary, ambush → CombatScene transition; consequences применяются один раз.
- `ReturnScene` и `CombatScene` — интеграция `tickRadioOnReturn` на возврат из вылазки.
- Rewards добавляют **существующие** M5 items в `baseStash` (без новых типов); ambush использует **существующие** mob ids + текущий CombatScene flow (без новой combat-механики).
- Expiry остаётся sortie-based (no real-time / background timers).
- 4 M6 PNG UI ассета: `radio_truth.png` (4.1 KB), `radio_trap.png` (4.7 KB), `radio_ambiguous.png` (4.3 KB) — 64×64 icons; `radio_panel_bg.png` (13.2 KB) — 256×128 panel accent.
- `tools/art/gen_m6_assets.py` — deterministic Pillow generator (seed=42).
- QA Acceptance: 1 runtime fix cherry-pick'нут в Engineer's PR (ambush `zone_id` берётся из `signal.zone_id`, а не hardcoded `"forest"`).

## PR sequence

| PR | Role | Result |
|---|---|---|
| #48 | PM kickoff | merged |
| #49 | GD amendment | merged |
| #50 | QA Spec | APPROVE / merged |
| #51 | PM status-sync | merged |
| #52 | Content M6 | PM merged в `m6-integration` |
| #53 | Engineer M6 (+ QA fix `c2ccab8`) | PM merged в `m6-integration` |
| #54 | Artist M6 | PM merged в `m6-integration` |
| #55 | QA Acceptance | APPROVE evidence, PM merged в `m6-integration` |

Дополнительно: PR #46 (`qa/m5-acceptance → m5-integration`) закрыт без merge'а как stale (контент уже на `main` через `5feb9b9c` / PR #47).

## Final counts

| Area | Count |
|---|---:|
| Mobs | 11 (не изменилось c M5) |
| Items | 35 (не изменилось c M5) |
| Recipes | 18 (не изменилось c M5) |
| Zones | 3 (не изменилось c M5) |
| Radio signals | **6** (было 3 M3 dummy; 2 truth + 2 trap + 2 ambiguous) |
| Vitest | **164/164 PASS** (152 M5 baseline + 12 M6) |
| M6 assets add | **26.2 KB** / 40 KB M6-budget |
| Project assets total | **456 KB** / 650 KB project-budget |
| Build | clean ≤ 2 MB (Yandex Games budget) |

## QA Acceptance (PR #55) — 3 Gates

QA выполнила локальный octopus-merge всех 3 role-PR (`qa/m6-acceptance-test`):

- **Gate 1 (static):** `typecheck` / `lint` / `vitest 164/164` / `build` — PASS.
- **Gate 2 (runtime):** RadioScene flows, ambush → CombatScene routing, trust state persistence — PASS после 1 fix'а (`ambush zone_id` из `signal.zone_id` вместо hardcoded `"forest"`; commit `f1ab9fa` cherry-pick'нут в Engineer's PR как `c2ccab8`).
- **Gate 3 (spec compliance):** ровно 6 signals (2/2/2), только existing items/mobs, schema совпадает с GDD §10.M6, anti-scope grep clean (нет Yandex SDK / Cloud Saves / Leaderboards / new zones / new mobs / new T4 / modular weapons / skill tree / real-time timers / audio) — PASS.

**Result:** APPROVE. 0 blockers.

## Notes for M7

- M7 стартует с закрытого M6 `main` после gate-close PR.
- Radio system полный; faction-specific reputation (vs одна глобальная `radio_trust`) откладывается на M7+.
- M6 retained anti-scope: нет Yandex SDK / Cloud Saves / Leaderboard / IAP (M8), нет новых зон/мобов/боссов/T4, нет модульного оружия, нет skill tree / active abilities, нет real-time/background timers, нет voice/audio (M7 polish).

## Lessons learned M6 (применять на M7)

- **QA fix cherry-pick pattern**: если QA Acceptance находит runtime bug и патчит его в test-octopus branch, PM cherry-pick'ает fix в Engineer's role-PR (`git cherry-pick` локально → REST API push), а не self-merge role-PR с QA branch. Audit trail чище.
- **QA Acceptance PR merge order**: PM мерджит QA Acceptance PR **последним** (после role-PR'ов) — net delta сводится к QA report file (`staff/status/QA.md` M{N} Acceptance Review section). Этот паттерн чище для audit trail.
- **DoD-precision сработала**: 6 signals exact / 164 vitest / 4 PNG / 26.2 KB / 456 KB — все targets matched без deviation.
- **4-параллельный launch**: Content + Engineer + Artist + QA Acceptance preview могут запуститься одновременно после QA Spec APPROVE; QA Acceptance дожидается role-PR Ready перед octopus-merge dry-run.
- **Status-sync PR**: PM может опубликовать промежуточный `pm/m{N}-status-sync` PR (см. PR #51) для синхронизации dashboards под факт GitHub без блокировки production. Self-merge по делегации Alex'а.
