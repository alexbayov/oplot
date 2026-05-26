# Project Context — Oplot

> Короткая память проекта для любой новой Devin-сессии. Если нужно больше деталей, переходи по `staff/LINKS.md`.

## Что это

«Оплот» — mobile-first HTML5 survival RPG для Яндекс.Игр.

- Stack target: Phaser 3 + TypeScript + Vite + Yandex Games SDK.
- Core fantasy: вылазки за ресурсами, вес как риск/жадность, крафт, пошаговый бой, развитие оплота.
- Текущая рабочая модель: мульти-сессионная команда под управлением PM/оркестратора.

## Источники правды

| Что | Файл |
|---|---|
| Процесс и роли | `staff/TEAM.md`, `staff/PROCESS.md`, `staff/ORCHESTRATION.md` |
| Текущий gate (M8a — kickoff) | `staff/status/M8a.md`, `staff/handoff/M7-SUMMARY.md` |
| Завершённая веха M7 | `staff/status/M7.md`, `staff/handoff/M7-SUMMARY.md` |
| Завершённая веха M6 | `staff/status/M6.md`, `staff/handoff/M6-SUMMARY.md` |
| Завершённая веха M5 | `staff/status/M5.md`, `staff/handoff/M5-SUMMARY.md` |
| Завершённая веха M4 | `staff/status/M4.md`, `staff/handoff/M4-SUMMARY.md` |
| Завершённая веха M3 | `staff/status/M3.md`, `staff/handoff/M3-SUMMARY.md` |
| Завершённая веха M2 | `staff/status/M2.md`, `staff/handoff/M2-SUMMARY.md` |
| Завершённая веха M1 | `staff/status/M1.md`, `staff/handoff/M1-SUMMARY.md` |
| State machine | `staff/STATE_MACHINE.md` |
| План вех | `staff/PLAN.md` |
| Механики | `docs/GDD.md` |
| Числа и баланс | `docs/balance.md` |
| Контент | `content/*.json` |
| Визуальный стиль | `docs/style-guide.md`, `assets/` |

## Главные правила

- Роль работает только в своей зоне ответственности.
- Роль обновляет только свой `staff/status/{ROLE}.md` и PR recovery block.
- PM обновляет `staff/status/M{N}.md`, `PLAN.md`, `CHANGELOG.md` и общий статус.
- QA всегда отдельная сессия от той роли, которую проверяет.
- PR не self-merge. Мерджит PM после нужного gate.

## Текущий snapshot (M8b — kickoff)

_Last reconciled with GitHub: 2026-05-25 (`main` HEAD `c88f395` after M8a gate-close PR #71; M8b kickoff branch `pm/m8b-kickoff`)._

- **Веха M8b — Монетизация:** rewarded video (×4 triggers: ×2 loot, second chance, daily reset, gas refill), interstitial (×1 placement: post-sortie), sticky banner (bottom, scene-aware), IAP (3 products: disable_ads, starter_pack, gas_pack + unprocessed-check §1.13.1), ads-remover logic. Yandex SDK API research complete — all API signatures documented.
- **Активная ветка:** PM kickoff `pm/m8b-kickoff → main`. После merge — `m8b-integration` (long-lived до M8b gate-close).
- **Следующие шаги (PM):** merge PM kickoff PR в `main` → создать `m8b-integration` → GD §13b amendment по `staff/kickoff/M8b-GD.md`.
- **Текущий gate:** `M8b_PM_KICKOFF_PR_OPEN → after-merge → GD_IN_PROGRESS`.
- Owners M8b: Engineer + QA + GD (Content/Artist не участвуют).
- Скоуп/anti-scope/DoD — `staff/status/M8b.md`. Anti-scope: no leaderboards/achievements, no server-side IAP, no telemetry, no new content/mechanics, no UI redesign.
- **M8a (Платформа и персистентность) — DONE.** gate-close PR #71. platform.ts/cloudSave.ts/locale.ts/audioUnlock.ts готовы. SDK singleton доступен.

## Закрытые вехи

- **M8a — Платформа и персистентность:** закрыта 2026-05-25 gate-close PR #71 (`m8a-integration → main`, merged). Итоги: platform.ts (4 fail-soft modes), cloudSave.ts (7 triggers, throttle 10s), locale.ts t(), audioUnlock.ts, mobile-first viewport, 193/193 vitest, JS 1.49 MB.
- **M7 — Полировка и баланс:** закрыта 2026-05-25 gate-close PR #65 (`m7-integration → main`, merged Alex'ом). Полный summary — `staff/handoff/M7-SUMMARY.md`. Итоги: 9 zones, 80 items, 42 recipes, 10 SFX, 16 tween events, 176/176 vitest, JS 1.49 MB, project assets 524 KB.
- **M6 — Радио и доверие:** закрыта 2026-05-25 gate-close PR #57 (`m6-integration → main`, PM merge по делегации Alex'а). Полный summary — `staff/handoff/M6-SUMMARY.md`. Итоги: 6 radio signals, `radio_trust [-5,+5]`, RadioScene M6 + ambush, 164/164 vitest, 456 KB assets.
- **M5 — Боссы и инстансы:** закрыта 2026-05-25 gate-close PR #47 (`m5-integration → main`, PM merge по делегации Alex'а). Полный summary — `staff/handoff/M5-SUMMARY.md`. Итоги: 3 босса, boss drops, T3 craft, daily instances, gas zones, MobRole runtime, 152 vitest, 1.48 MB build, 412 KB assets.
- **M4 — Перки и прогрессия:** закрыта 2026-05-22 gate-close PR #39 (`m4-integration → main`, PM merge по делегации Alex'а). Полный summary — `staff/handoff/M4-SUMMARY.md`. Итоги: 11 scenes, 128 vitest, 1.5 MB build, ~259 KB assets, 8 перков + veteran_conditioning fallback, XP-curve L1-10, ProgressionScene + LevelUpScene.
- **M3 — Расширение мира:** закрыта 2026-05-21 gate-close PR #30 (`m3-integration → main`). Полный summary — `staff/handoff/M3-SUMMARY.md`.
- **M2 — Играбельный MVP:** закрыта 2026-05-20 gate-close PR #19 (`m2-integration → main`). Полный summary — `staff/handoff/M2-SUMMARY.md`.
- **M1 — Технический скелет:** закрыта 2026-05-19 gate-close PR #12 (`m1-integration → main`). Полный summary — `staff/handoff/M1-SUMMARY.md`.
