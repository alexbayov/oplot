# Project Context — Oplot

> Короткая память проекта для новых Codex/Devin-сессий. Если нужен полный список ссылок, см. `staff/LINKS.md`.

## Что это

«Оплот» — HTML5 survival RPG для Яндекс.Игр на Phaser 3 + TypeScript + Vite + Yandex Games SDK.

Runtime target сейчас: **landscape 1280×720** (`src/config.ts`, `Scale.FIT`). Старые portrait/mobile-first формулировки в ранних GDD/handoff/status документах — **historical/obsolete** и не должны переопределять текущий landscape-канон.

## Source-of-truth порядок

1. **Текущий статус проекта:** этот файл + `staff/PLAN.md`.
2. **Процесс/роли:** `staff/PROCESS.md`, `staff/ORCHESTRATION.md`, `staff/TEAM.md`.
3. **Игровые правила/баланс:** `docs/GDD.md`, `docs/balance.md`.
4. **Контент:** `content/*.json`.
5. **Реальная runtime-истина:** `src/`, `assets/`, `package.json` и тесты.
6. **Historical only:** старые `staff/status/*`, `staff/handoff/*`, ранние redesign/GDD секции про portrait/mobile-first или незакрытые планы, если они конфликтуют с текущим snapshot ниже.

## Current snapshot (2026-05-30)

**Канон:** M0–M10 closed. Redesign closed. M11/M12 implementation has been merged to `main`, but M11/M12 are **not product-accepted** until QA finalization.

- **Current phase:** M11/M12 QA hardening + release readiness.
- **Combat Overhaul:** implementation exists in `main`, but requires acceptance testing before it can be announced as player-facing complete.
- **M11 documentation caveat:** `docs/redesign/M11-CORE-LOOP.md` and `docs/redesign/M11-NARRATIVE-PROGRESSION.md` both exist; do not treat either as proof that M11 is only “planning”. Runtime implementation has already landed, while product acceptance remains pending.
- **M12 documentation caveat:** M12 plans/specs describe the intended combat overhaul, but the release decision is still gated by QA acceptance.
- **Release readiness still needs:** acceptance testing, Yandex Draft checks for cloud save / ads / IAP, and green `typecheck`, `lint`, `test`, `build` gates.

## Closed milestones summary

- **M0–M10:** closed.
- **Redesign:** closed; landscape 1280×720 + painted pass is the current visual/runtime target.
- **M11/M12:** implementation merged to `main`; product acceptance pending.

## Do next

1. Run M11/M12 QA hardening and acceptance checks.
2. Verify Yandex Draft platform flows: SDK init, cloud save, ads, IAP, orientation/LoadingAPI.
3. Keep release gates green: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
4. Only after QA acceptance: update docs from “implementation merged / acceptance pending” to “product accepted”.
