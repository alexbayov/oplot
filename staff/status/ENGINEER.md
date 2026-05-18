# Status: Engineer

**Текущая веха:** M1
**Статус:** DONE_PENDING_REVIEW
**Последнее обновление:** 2026-05-18

## Что сделано
- Проверен push-доступ перед работой: прямой GitHub transport с `GITHUB_TOKEN_OPLOT` прошёл dry-run `HEAD -> auth-check-eng-m1`.
- Инициализирован Phaser 3 + TypeScript + Vite bootstrap:
  - `package.json`, `package-lock.json`
  - `tsconfig.json`, `vite.config.ts`
  - `eslint.config.js`, `.prettierrc.json`
  - root `index.html`
- Добавлены npm scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`.
- Добавлены строгие типы из `docs/GDD.md` §6:
  - `src/types/item.ts`
  - `src/types/mob.ts`
  - `src/types/recipe.ts`
  - `src/types/zone.ts`
  - `src/types/index.ts`
- Для мобов и оружия используются `damage_min` / `damage_max`, не одиночный `damage`.
- Добавлен `src/config.ts`:
  - `GAME_WIDTH = 360`
  - `GAME_HEIGHT = 640`
  - `BACKGROUND_COLOR = "#1A1A1A"`
  - `MAX_WEIGHT_KG = 30`
  - `MAX_LEVEL = 5`
- Добавлены Phaser scene placeholders без игровой логики:
  - `BootScene`
  - `BaseScene`
  - `MapScene`
  - `SortieScene`
  - `CombatScene`
  - `InventoryScene`
  - `CraftScene`
  - helper `sceneUi`
- Добавлена безопасная типизированная утилита `src/utils/loader.ts`.
- `src/main.ts` создаёт Phaser config 360×640, `FIT` / `CENTER_BOTH`, scene array.
- `content/*.json`, `docs`, `assets`, `staff/handoff` не изменялись.

## Проверки
- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run build` — pass
- `npm run dev -- --host 127.0.0.1` — стартует, Vite отдаёт `http://127.0.0.1:5173/`
- `npm audit` — pass, 0 vulnerabilities

## Что НЕ сделано
- Игровая логика боя, лута, веса, крафта и прогрессии не реализована — по M1 scope это только UI/navigation placeholders.
- Content JSON не подключён к сценам — будет подключаться на следующих инженерных вехах.
- Yandex Games SDK не подключён — вне M1 scope.

## Блокеры
- Нет.

## PR
- Будет открыт в `main` из ветки `m1/eng-bootstrap`.
