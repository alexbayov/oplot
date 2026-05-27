# Промт для DeepSeek — landscape conversion (Stage 2)

> Скопировать всё ниже линии и отправить DeepSeek'у одним сообщением.
> После выполнения он откроет PR — отревьюю и предложу правки.

---

# Задача

Проект: **alexbayov/oplot** — survival RPG для Яндекс.Игр на Phaser 3 + TypeScript + Vite + Bun. У тебя полный доступ к репо.

Игра сейчас работает в **portrait 360×640**. Нужно перевести в **landscape 1280×720** и переписать UI-каркас сцен под новые painted-мокапы. **Игровая логика не меняется** — трогаем только сцены, конфиг, UI-токены и пару строк в `index.html` / `systems/platform.ts`.

## Действия

1. Создай ветку `redesign/landscape-1280x720` от `main`
2. Реализуй изменения из раздела «Изменения» ниже
3. Прогони `bun run test` (vitest, должен быть зелёный)
4. Прогони `bun run build` (vite build, без ошибок, bundle < 5 MB)
5. Открой PR в `main`, в описании сошлись на этот промт и шаблон ниже

## Визуальные референсы (обязательно держать перед глазами)

В `main` лежат painted-мокапы (положены отдельным PR):

- `docs/redesign/mockups/combat_landscape.jpg` — **макет CombatScene**. Видно: герой слева, моб справа, turn-order сверху, HP/XP-бары, action-buttons «АТАКА / БЛОК / ПРЕДМЕТ / ОТСТУП» снизу.
- `docs/redesign/mockups/base_landscape.jpg` — **макет BaseScene (Оплот)**. Видно: портрет-карточка слева, главный CTA «В ВЫЛАЗКУ» в центре, меню «СКЛАД / МАСТЕРСКАЯ / РАДИО / ГЕРОЙ» справа, индикатор «ДЕНЬ 12» вверху.

Композиция в мокапах = композиция в коде. Не нужно ИДЕНТИЧНО (текстуру панелей и painted-фоны не перерисовываем — они уже есть в `assets/backgrounds/` и `assets/sprites/`), нужно соответствие планировки.

---

# Что уже сделано — НЕ переделывать

В последних 7 коммитах в `main` уже есть UI-компоненты и эффекты. **Сохрани их API и поведение** (можно правя дефолтные размеры/координаты под landscape, но не удалять):

- `src/ui/components/Badge.ts`, `SceneHeader.ts`, `ItemCard.ts` — компоненты, не удалять
- `src/scenes/sceneUi.ts` — helpers (`createPanel`, `createButton`, `text`) — оставить API, в нём есть **хардкод `.text(180, 64, ...)` (портретный центр)** — это надо починить
- HP/XP-бары с тиками и glow (BaseScene/CombatScene)
- Weight bar (LootScene) с цветовыми зонами
- Target highlight (CombatScene)
- Scanlines overlay
- Floating combat text (всплывающие цифры урона)

Если что-то из перечисленного исчезнет — это регресс.

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

## 2. `src/main.ts` — без изменений

`Phaser.Scale.FIT + autoCenter: CENTER_BOTH` уже настроены, ничего трогать не нужно. После смены `GAME_WIDTH/HEIGHT` в `config.ts` сам подхватит.

## 3. `index.html` — viewport

Сейчас:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

Поменять на:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover" />
```

(убрать только `user-scalable=no` — нарушает accessibility; `maximum-scale=1.0` оставить чтобы не было pinch-zoom; против двойного-тапа добавить в основной CSS `body { touch-action: manipulation; }`).

## 4. `src/systems/platform.ts` — orientation lock

В файле уже есть type `screen?.orientation?.lock(orientation: string): Promise<void>`. Добавь явный вызов в `initPlatform()`:

```ts
try {
  await ysdk?.screen?.orientation?.lock?.("landscape");
} catch (_) {
  // не критично — fallback на CSS rotate prompt
}
```

Вызывать **после** `YaGames.init()`, до резолва `initPlatform()`.

## 5. `src/ui/layout.ts` — обновить + дополнить (НЕ заменять файл)

⚠️ **Не удалять существующие экспорты!** Они импортируются 12 сценами:
`W, H, CX, CY, SAFE, SAFE_X, SAFE_Y, SAFE_W, SAFE_H, HEADER_Y, ACTION_ZONE_Y, CONTENT_Y_START, CONTENT_Y_END, GRID, gridSlot, BTN`.

Что сделать:
1. Сохрани все эти экспорты, но обнови **значения** под новые размеры 1280×720:
   - `SAFE.bottom` уменьшить с `64` до `24` (на landscape Яндекс sticky banner меньше мешает)
   - `HEADER_Y` оставить `52` (по-прежнему верхняя полоса)
   - `ACTION_ZONE_Y` пересчитается автоматически из новой `H`
   - `GRID.cols` поднять с `5` до `8` (на landscape в инвентаре помещается больше)
   - `GRID.startX` поднять с `40` до `60`
   - `BTN.main.w` поднять с `220` до `260`, `wide.w` с `300` до `360`
2. **Дополнительно** добавить новый экспорт `LAYOUT` с per-scene токенами:

```ts
export const LAYOUT = {
  marginX: 24,
  marginY: 16,
  gutter: 12,

  combat: {
    heroX: 280, heroY: 460, mobX: 1000, mobY: 460,
    spriteScale: 2.5,
    turnBarY: 40,
    actionBarY: 640, actionBarH: 64,
  },
  base: {
    portraitCardX: 40, portraitCardY: 100, portraitCardW: 280, portraitCardH: 360,
    ctaX: W / 2, ctaY: 400, ctaW: 320, ctaH: 80,
    menuColX: W - 240, menuColY: 140, menuBtnH: 64,
  },
  inventory: {
    gridX: 40, gridY: 100, cellSize: 96, cellsPerRow: 8,
    detailsPanelX: 880, detailsPanelY: 100, detailsPanelW: 360, detailsPanelH: 520,
  },
  topBar: {
    h: 56,
    titleX: W / 2,
    rightSlotX: W - 24,
    leftSlotX: 24,
  },
} as const;
```

## 6. `src/scenes/sceneUi.ts` — починить хардкод

В файле есть строки вида `.text(180, 64, title, ...)` — `180` это `360/2` (старый центр по X). Заменить на `CX` (импорт из `../ui/layout`), либо на параметр функции. Пройтись по всему файлу и убрать хардкоды.

## 7. Сцены — переписать под landscape

Приоритет (коммитить по 1-2 сцены за раз):

1. **`src/scenes/CombatScene.ts`** ← главная, см. мокап `combat_landscape.jpg`
2. **`src/scenes/BaseScene.ts`** ← главная, см. мокап `base_landscape.jpg`
3. `src/scenes/BootScene.ts` — loading bar по центру
4. `src/scenes/MapScene.ts` — горизонтальная сетка вместо столбца
5. `src/scenes/SortieScene.ts` — кнопки в ряд
6. `src/scenes/LootScene.ts` — список лута + weight bar (сохранить!) + кнопки
7. `src/scenes/ReturnScene.ts` — итоги вылазки
8. `src/scenes/InventoryScene.ts` — грид слева, details справа (см. `LAYOUT.inventory`)
9. `src/scenes/CraftScene.ts` — рецепты слева, материалы/превью справа
10. `src/scenes/LevelUpScene.ts`, `ProgressionScene.ts`, `RadioScene.ts` — две колонки

Принципы для каждой сцены:
- Все хардкодные `(x, y)` ищи и заменяй на `LAYOUT.<scene>.*` (или `W`, `H`, `CX`, `CY`)
- Где вертикальное стекирование (4-6 кнопок столбцом) — пересобери в 2 колонки или в action-bar внизу
- Background-спрайты стрейчатся: `bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT)` (или `(W, H)`)
- Спрайты персонажей: `sprite.setScale(LAYOUT.combat.spriteScale)`

---

# Acceptance criteria

- [ ] `bun run dev` запускается, canvas 1280×720, без overflow
- [ ] Полный happy-path проходим без visual breaks: BootScene → BaseScene → MapScene → SortieScene → CombatScene (бой с обычным мобом) → LootScene → ReturnScene → BaseScene
- [ ] Бой с боссом отрабатывает (Forest Alpha Mutant в Forest depth=3)
- [ ] Inventory + Craft + Radio + LevelUp + Progression — все открываются, кликаются, не ломаются
- [ ] Кнопки кликаются, текст не вылазит за панели, спрайты не растянуты криво
- [ ] Сохранены: Badge/SceneHeader/ItemCard компоненты, weight bar, target highlight, scanlines, glow, floating combat text
- [ ] `bun run test` — все 213 тестов зелёные
- [ ] `bun run build` — без ошибок, итоговый bundle < 5 MB
- [ ] Композиция CombatScene и BaseScene соответствует мокапам `docs/redesign/mockups/*.jpg`

---

# Что НЕ делать

- НЕ менять `content/*.json`
- НЕ менять `src/systems/*.ts` (combat, weight, craft, loot, mobAI, perks, xp, banner, audio, ads, iap, ...) — кроме `platform.ts` в указанной строке
- НЕ менять `src/state/GameState.ts`
- НЕ менять ассеты в `assets/` (они уже painted-версии)
- НЕ добавлять новые npm-пакеты
- НЕ удалять компоненты/эффекты из раздела «Что уже сделано»
- НЕ удалять Pillow-генераторы `tools/art/gen_m*_assets.py` (мёртвый код, не трогаем)
- НЕ делать наследование/композицию рефакторинг сценических классов — точечные правки

---

# PR description (используй такой шаблон)

```markdown
## Stage 2: Landscape conversion 1280×720

Переводит игру из portrait 360×640 в landscape 1280×720 с UI-foundation
под painted-мокапы из `docs/redesign/mockups/`.

Изменения:
- `src/config.ts` — новые GAME_WIDTH/GAME_HEIGHT (1280×720)
- `index.html` — убрал `user-scalable=no`
- `src/ui/layout.ts` — обновил значения старых экспортов + добавил LAYOUT
- `src/scenes/sceneUi.ts` — убрал хардкод `(180, 64, ...)`
- `src/scenes/*.ts` — переписал 12 сцен под landscape
- `src/systems/platform.ts` — orientation.lock("landscape")

Логика не тронута. Все компоненты (Badge, SceneHeader, ItemCard, weight bar,
target highlight, scanlines, glow, floating text) сохранены.

213 тестов зелёные. Bundle < 5 MB.

Closes (частично) #79.
```
