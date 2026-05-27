# Промт для DeepSeek — landscape conversion (Stage 2)

> Скопировать всё ниже линии и отправить DeepSeek'у одним сообщением.
> После выполнения он откроет PR — отревьюю и предложу правки.

---

# Задача

Проект: **alexbayov/oplot** — survival RPG для Яндекс.Игр на Phaser 3 + TypeScript + Vite + Bun. У тебя полный доступ к репо.

Игра сейчас работает в **portrait 360×640**. Нужно перевести в **landscape 1280×720** и переписать UI-каркас сцен под новые мокапы. **Игровая логика не меняется** — трогаем только сцены, конфиг и UI-токены.

## Действия

1. Создай ветку `redesign/landscape-1280x720` от `main`
2. Реализуй изменения из раздела «Изменения» ниже
3. Прогони `bun test` (должно быть зелёным)
4. Прогони `bun build` (без ошибок)
5. Открой PR в `main` со ссылкой на этот промт в описании

## Визуальные референсы (важно)

В `main` лежат painted-мокапы — открой и держи их перед глазами, когда реализуешь сцены:

- `docs/redesign/mockups/combat_landscape.jpg` — **макет CombatScene**. Видно: герой слева, моб справа, turn-order сверху, HP/XP-бары, action-buttons «АТАКА / БЛОК / ПРЕДМЕТ / ОТСТУП» снизу.
- `docs/redesign/mockups/base_landscape.jpg` — **макет BaseScene (Оплот)**. Видно: портрет-карточка слева, главный CTA «В ВЫЛАЗКУ» в центре, меню «СКЛАД / МАСТЕРСКАЯ / РАДИО / ГЕРОЙ» справа, индикатор «ДЕНЬ 12» вверху.

Композиция в этих мокапах = композиция в коде. Не нужно ИДЕНТИЧНО (текстуру панелей и фоны на этом этапе НЕ генерим — это уже сделано painted-ассетами), нужно соответствие планировки.

---

# Изменения

## 1. `src/config.ts`

```ts
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const BACKGROUND_COLOR = "#111210";
export const MAX_WEIGHT_KG = 30;
export const MAX_LEVEL = 5;
```

## 2. `src/main.ts` — Phaser scale config

- `scale.mode = Phaser.Scale.FIT`
- `scale.autoCenter = Phaser.Scale.CENTER_BOTH`
- Никаких `parent` overflow, окно растягивается на весь viewport с letterbox

## 3. `index.html`

- Viewport meta: `width=device-width, initial-scale=1.0, viewport-fit=cover`
- Без `user-scalable=no` (нарушает доступность), но без двойного-тапа зума через CSS `touch-action: manipulation`
- Если есть orientation-lock CSS — снять

## 4. `src/systems/platform.ts`

Если есть Yandex SDK orientation hint — сменить на `landscape`. Если нет — добавить:
```ts
ysdk?.deviceInfo?.isMobile?.() && ysdk.screen?.fullscreen?.request?.();
// и orientation hint = landscape если SDK это поддерживает
```

## 5. `src/ui/layout.ts` — новые layout-токены

Заменить содержимое на:

```ts
import { GAME_WIDTH, GAME_HEIGHT } from "../config";

export const LAYOUT = {
  marginX: 24,
  marginY: 16,
  gutter: 12,

  combat: {
    heroX: 280,        // левая треть
    heroY: 460,
    mobX: 1000,        // правая треть
    mobY: 460,
    spriteScale: 2.5,  // 128px sprite × 2.5 = 320px на экране
    turnBarY: 40,
    actionBarY: 640,
    actionBarH: 64,
  },

  base: {
    portraitCardX: 40,
    portraitCardY: 100,
    portraitCardW: 280,
    portraitCardH: 360,
    ctaX: GAME_WIDTH / 2,
    ctaY: 400,
    ctaW: 320,
    ctaH: 80,
    menuColX: GAME_WIDTH - 240,
    menuColY: 140,
    menuBtnH: 64,
  },

  inventory: {
    gridX: 40,
    gridY: 100,
    cellSize: 96,
    cellsPerRow: 8,
    detailsPanelX: 880,
    detailsPanelY: 100,
    detailsPanelW: 360,
    detailsPanelH: 520,
  },

  topBar: {
    h: 56,
    titleX: GAME_WIDTH / 2,
    rightSlotX: GAME_WIDTH - 24,
    leftSlotX: 24,
  },
} as const;
```

## 6. `src/ui/sceneUi.ts` + `src/ui/components/`

API оставить, дефолты подкрутить под landscape:
- HP/XP-бары: высота 14px, ширина параметризуется (бой = 220px, инвентарь = 140px)
- Кнопки: высота 56px, padding-X 24px, font-size 18px Oswald
- Панели: border-radius 8px (рисуем через `Graphics`), border 2px, fill через токены из `ui/tokens.ts`

## 7. Сцены — переписать под landscape

Приоритет (делать в этом порядке, коммитить по 1-2 за раз):

1. **`CombatScene.ts`** ← главная, см. мокап `combat_landscape.jpg`
2. **`BaseScene.ts`** ← главная, см. мокап `base_landscape.jpg`
3. `BootScene.ts` — proportions only (loading bar по центру)
4. `MapScene.ts` — карта зон, горизонтальная сетка вместо столбца
5. `SortieScene.ts` — выбор глубины вылазки, кнопки в ряд
6. `LootScene.ts` — список лута + кнопки «взять/оставить»
7. `ReturnScene.ts` — итоги вылазки
8. `InventoryScene.ts` — грид слева, детали справа (см. `LAYOUT.inventory`)
9. `CraftScene.ts` — рецепты слева, материалы/превью справа
10. `LevelUpScene.ts`, `ProgressionScene.ts`, `RadioScene.ts` — diagonal или две колонки

Принципы для каждой сцены:
- Все хардкодные `(x, y)` ищем и заменяем на `LAYOUT.<scene>.*`
- Где вертикальное стекирование (4-6 кнопок столбцом) — пересобрать в 2 колонки или в action-bar внизу
- Background-спрайты стрейчатся: `bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT)`
- Спрайты персонажей: `sprite.setScale(LAYOUT.combat.spriteScale)`

---

# Acceptance criteria

- [ ] `bun dev` запускается, canvas 1280×720, без overflow
- [ ] Полный happy-path проходим без visual breaks: BootScene → BaseScene → MapScene → SortieScene → CombatScene (бой с мобом) → LootScene → ReturnScene → BaseScene
- [ ] Все кнопки кликаются, текст не вылазит за панели, спрайты не растянуты
- [ ] Бой с боссом тоже работает (try Forest Alpha Mutant в Forest depth=3)
- [ ] `bun test` зелёный
- [ ] `bun build` без ошибок, итоговый bundle < 5 MB
- [ ] На мобиле через Yandex SDK preview всё центрируется с letterbox (если хост — landscape phone)
- [ ] Композиция CombatScene и BaseScene соответствует мокапам

---

# Что НЕ делать

- НЕ менять `content/*.json`
- НЕ менять `src/systems/*.ts` (combat, weight, craft, loot, mobAI, perks, xp, etc.)
- НЕ менять `src/state/GameState.ts`
- НЕ менять ассеты в `assets/` (они уже painted-версии)
- НЕ добавлять новые npm-пакеты
- НЕ делать рефакторинг сцен в наследование/композицию — точечные правки
- НЕ удалять старые Pillow-генераторы `tools/art/gen_m*_assets.py` (мёртвый код, оставим на следующий этап)

---

# PR description (используй такой шаблон)

```markdown
## Stage 2: Landscape conversion 1280×720

Переводит игру из portrait 360×640 в landscape 1280×720 с UI-foundation
под painted-мокапы из `docs/redesign/mockups/`.

Изменения:
- `src/config.ts` — новые GAME_WIDTH/GAME_HEIGHT
- `src/main.ts` — Phaser.Scale.FIT
- `src/ui/layout.ts` — новые layout-токены под landscape
- `src/ui/sceneUi.ts` + components — дефолты под landscape
- `src/scenes/*.ts` — все 12 сцен переписаны под новую планировку
- `src/systems/platform.ts` — Yandex SDK orientation hint

Логика не тронута. Все тесты зелёные.

Closes (частично) #79.
```
