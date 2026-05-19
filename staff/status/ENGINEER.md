# Status: Engineer

**Текущая веха:** M1 — Технический скелет
**Статус:** DONE_PENDING_QA_ACCEPT
**Последнее обновление:** 2026-05-18

## Что сделано

- Создан PR #7 `m1/eng-bootstrap` → `main`: https://github.com/alexbayov/oplot/pull/7
- PR содержит Phaser 3 + TypeScript + Vite bootstrap:
  - `package.json`, `package-lock.json`
  - `tsconfig.json`, `vite.config.ts`
  - `eslint.config.js`, `.prettierrc.json`
  - root `index.html`
  - `src/main.ts`, `src/config.ts`
  - 7 scene placeholders: Boot/Base/Map/Sortie/Combat/Inventory/Craft
  - `src/types/` для Item/Mob/Recipe/Zone
  - `src/utils/loader.ts`
- В PR описаны локальные checks:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run dev -- --host 127.0.0.1`
  - `npm audit`
- В PR-комментарии приложен runtime navigation test с записью и screenshots.

## Что НЕ сделано

- PR #7 ещё не смержен.
- Игровая логика боя, лута, веса, крафта и прогрессии не реализована — это вне M1 scope.
- Content JSON ещё не интегрирован в сцены.
- Yandex Games SDK не подключён — это M8.

## Блокеры

- Ждёт QA Acceptance вместе с Content и Artist PR.
- Artist PR отсутствует и блокирует общий M1 QA Acceptance gate.

## PR

- https://github.com/alexbayov/oplot/pull/7
