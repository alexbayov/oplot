# Handoff: Engineer — Веха M1

> **Роль:** Engineer
> **Веха:** M1 — Технический скелет
> **Репо:** https://github.com/alexbayov/oplot
> **Ветка для PR:** `m1/eng-bootstrap`

---

## Preconditions

- [x] Game Designer PR смержен (GDD.md + balance.md заполнены)
- [x] QA Spec Review: APPROVE

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/roles/ENGINEER.md` | Твоя роль, зона ответственности, DoD |
| `staff/prompts/M1.md` | Полное ТЗ вехи M1 |
| `docs/GDD.md` | Механики — реализуешь по этому документу |
| `docs/balance.md` | Числа и формулы |

---

## Твои deliverables

### 1. Инициализация проекта

```bash
npm init -y
npm install phaser
npm install -D typescript vite @types/node vitest eslint prettier
```

### 2. Конфигурация

#### `package.json` — scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

#### `tsconfig.json`:
- `strict: true`
- `target: "ES2020"`
- `module: "ESNext"`
- `moduleResolution: "bundler"`
- Включить `src/`

#### `vite.config.ts`:
- Базовый конфиг для Phaser 3
- `base: "./"` (для Яндекс.Игр)

#### `.eslintrc.cjs` или `eslint.config.js`:
- TypeScript support
- Строгие правила

### 3. Структура `src/`

```
src/
├── main.ts              # Phaser.Game config, запуск
├── config.ts            # Константы: GAME_WIDTH, GAME_HEIGHT, цвета
├── types/
│   ├── index.ts         # Реэкспорт
│   ├── item.ts          # interface Item (из GDD JSON-схемы)
│   ├── mob.ts           # interface Mob
│   ├── recipe.ts        # interface Recipe
│   └── zone.ts          # interface Zone
├── scenes/
│   ├── BootScene.ts     # Preload ассетов → переход на BaseScene
│   ├── BaseScene.ts     # Экран базы: кнопки "В вылазку", "Крафт", "Инвентарь"
│   ├── MapScene.ts      # Выбор зоны: 1 кнопка "Лес"
│   ├── SortieScene.ts   # Экран вылазки (заглушка: текст + кнопка "Бой")
│   ├── CombatScene.ts   # Экран боя (заглушка: текст + кнопки действий)
│   ├── InventoryScene.ts # Экран инвентаря (заглушка: список предметов)
│   └── CraftScene.ts    # Экран крафта (заглушка: список рецептов)
└── utils/
    └── loader.ts        # Загрузка JSON из content/
```

### 4. `src/main.ts`

```typescript
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { BaseScene } from "./scenes/BaseScene";
// ... остальные сцены

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 360,   // mobile-first
  height: 640,
  parent: "game",
  backgroundColor: "#1A1A1A",
  scene: [BootScene, BaseScene, MapScene, SortieScene, CombatScene, InventoryScene, CraftScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
```

### 5. Сцены-заглушки

Каждая сцена содержит:
- Текст-заголовок (название экрана)
- Кнопки навигации (переход на другие сцены)
- Placeholder-контент (цветные прямоугольники вместо спрайтов)

**BootScene:** загружает ассеты (если есть) → переход на BaseScene
**BaseScene:** "ОПЛОТ" + кнопки: В вылазку, Крафт, Инвентарь
**MapScene:** карта (текст "ЛЕС" + кнопка "Войти")
**SortieScene:** текст "Вылазка: Лес Лв1" + кнопка "Бой"
**CombatScene:** текст "Бой" + кнопки: Атака, Укрытие, Аптечка + текст HP
**InventoryScene:** текст "Инвентарь" + список (пустой) + кнопка "Назад"
**CraftScene:** текст "Мастерская" + список рецептов (заглушка) + кнопка "Назад"

### 6. `src/types/`

Типы должны точно соответствовать JSON-схемам из GDD.md. Прочитай GDD перед написанием типов.

### 7. `public/index.html`

Минимальный HTML:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Оплот</title>
  <style>body { margin: 0; background: #1A1A1A; }</style>
</head>
<body>
  <div id="game"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

---

## Definition of Done (твой чек-лист перед PR)

- [ ] `npm run dev` — запускается, в браузере видно экран "Оплот"
- [ ] `npm run build` — билд проходит без ошибок
- [ ] `npm run lint` — без ошибок
- [ ] `npm run typecheck` — без ошибок
- [ ] Все 7 сцен существуют и переключаются
- [ ] Типы в `src/types/` соответствуют GDD JSON-схемам
- [ ] `.gitignore` содержит `node_modules/`, `dist/`
- [ ] Размер `dist/` < 1 МБ (только код, без ассетов)

---

## FORBIDDEN

- ❌ НЕ реализуй игровую логику (бой, лут, крафт) — только заглушки UI
- ❌ НЕ подключай Yandex SDK (это M6)
- ❌ НЕ добавляй анимации
- ❌ НЕ добавляй звуки
- ❌ НЕ используй сторонние UI-библиотеки (только Phaser built-in)
- ❌ НЕ мерджи свой PR сам

---

## Процедура

1. Клонируй репо, прочитай все файлы из таблицы «Контекст»
2. Напиши план → отправь заказчику блокирующим
3. После апрува — создай ветку `m1/eng-bootstrap`
4. Инициализируй проект, напиши код
5. Проверь `npm run dev/build/lint/typecheck`
6. Коммит → PR в main
7. Обнови `staff/status/ENGINEER.md`
8. Сообщи заказчику: «PR готов»
