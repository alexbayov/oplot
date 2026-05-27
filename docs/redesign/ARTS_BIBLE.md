# Arts Bible — «Оплот»

> Источник правды для генерации визуальных ассетов.
> Любой ассет должен соответствовать формулам ниже, иначе будет «зоопарк».

---

## 0. ДНК стиля (никогда не убирать из промпта)

```
painterly graphic novel illustration with thick black ink outlines (2-3 px),
dramatic chiaroscuro side lighting, painterly brush strokes.
Restricted palette: dark olive, rust brown, charcoal, sandy beige,
single amber/blood-red accent. AAA mobile game asset quality.
```

Эта формула — наследие утверждённых референсов v1 (hero_canonical, mob_wild_dog,
mob_marauder, mob_pack_rat, bg_forest, ui_combat_landscape, ui_base_landscape).
**НЕ менять без явного решения о новом edition.**

---

## 1. Технические стандарты

| Тип ассета | Финальный размер | Aspect | Прозрачность |
|---|---|---|---|
| Hero (canonical) | 128×128 | 1:1 | да (PNG-32) |
| Mob (обычный) | 128×128 | 1:1 | да |
| Boss | 128×128 | 1:1 | да |
| Background зоны | 800×600 | 4:3 | нет (JPG-quality PNG) |
| Item icon | 64×64 | 1:1 | да |
| Perk icon | 64×64 | 1:1 | да |
| UI mockup (для дизайна, не в build) | 1920×1080 | 16:9 | нет |

**При смене на landscape** (см. DEEPSEEK_SPEC_STAGE2.md) фоны мигрируют на
1280×720 (16:9), всё остальное остаётся идентично.

---

## 2. Формулы промптов по типам

### 2.1. Hero / Survivor character

```
Canonical hero character for post-apocalyptic survival RPG,
full body, standing idle pose, slight 3/4 view facing camera-right.
{appearance: lone russian survivor in olive drab military trench coat over
leather harness, gas mask hanging on chest, fingerless gloves, weathered
boots, leather backpack, pipe rifle slung over shoulder, scarred face,
determined expression, short dark hair}.
{DNA}
Isolated character on flat dark teal background (#1f2a2a),
no environment, full body visible top to bottom.
```

### 2.2. Mob — humanoid (marauder, bandit, mutant)

```
{mob_name} enemy character for post-apocalyptic survival RPG,
full body, standing menacing pose, 3/4 view facing camera-LEFT
(toward hero on opposite side).
{appearance details: armor, weapon, distinguishing features}.
{DNA}
Isolated on flat dark teal background (#1f2a2a), no environment.
```

### 2.3. Mob — creature (dog, rat, drone)

```
{mob_name} creature enemy for post-apocalyptic survival RPG,
full body, {pose: snarling stance / scurrying low / hovering /}, side profile
or 3/4 view facing camera-LEFT.
{appearance: mutated/feral/scavenger features, scarring, exposed flesh, fangs,
eyes, body shape}.
{DNA}
Isolated on flat dark teal background (#1f2a2a), no environment.
```

### 2.4. Background зоны

```
Atmospheric matte painting background for post-apocalyptic survival RPG
combat scene, used as Phaser game backdrop.
{zone description: environment type, distinct landmark, environmental
storytelling details, light source/time of day}.
NO characters, NO UI elements, NO text.
{DNA, modified: visible thick brush strokes, atmospheric depth}.
Composition: horizon line on lower third, atmospheric depth with foreground
silhouettes, mid-ground details, soft background haze.
```

Известные ID зон (для подстановки): forest, warehouse, city, suburbs, school,
factory, hospital, metro, power_plant.

### 2.5. Item icon (оружие, броня, расходник, компонент)

```
Item icon for post-apocalyptic survival RPG inventory grid.
{item: weapon/armor/consumable/component name and details}.
Centered composition on flat dark olive (#2a2e1f) background, top-down or
3/4 view, single object focus, no background environment.
{DNA, modified: thick ink outlines, simplified painted shading for icon
readability at small size}.
Mobile game UI icon asset.
```

### 2.6. Perk icon

```
Perk icon for post-apocalyptic survival RPG skill tree.
{perk_name: symbolic representation — e.g. sharp_blade = stylized dagger,
keen_eye = stylized eye with crosshair}.
Circular composition with subtle painted border, centered on dark teal
gradient background. Bold symbolic silhouette readable at 64px.
{DNA, modified: bold simplified shapes for icon legibility}.
```

### 2.7. UI mockup (для дизайн-документации, не build)

```
Mobile game UI mockup, HORIZONTAL landscape orientation 16:9,
post-apocalyptic survival RPG {scene: combat/base/inventory/craft/...}.
{scene composition: background, characters, UI element layout in detail}.
{DNA}
Russian-language UI labels: {labels}.
```

---

## 3. Контроль качества

Перед добавлением ассета в репо проверить:

- [ ] Стиль матчит ДНК — толстый чёрный аутлайн, painterly brush, палитра
- [ ] Композиция: hero смотрит вправо, мобы смотрят влево
- [ ] Фон cutout-friendly (плоский, контрастный с сабжектом) — для character/icon
- [ ] Прогон через `tools/art/process_painted.py` без артефактов
- [ ] Превью при финальном размере читается (особенно при 64×64 для иконок)

---

## 4. Pipeline (как технически делать)

```bash
# 1. Генерация (вне репо, выгрузить в oplot-redesign/references/)
#    Промпт = ДНК + блок типа + конкретные детали ассета

# 2. Process (последовательно, не параллельно — rembg грузит 176MB модель)
python tools/art/process_painted.py character refs/hero_v2.jpg assets/sprites/hero.png --size 128
python tools/art/process_painted.py background refs/bg_city_v1.jpg assets/backgrounds/city.png --size 800x600
python tools/art/process_painted.py icon refs/item_machete_v1.jpg assets/sprites/items/machete.png --size 64

# 3. Проверка
bun dev      # визуально в игре
bun test     # тесты должны проходить
```

---

## 5. Версионирование ассетов

- Каждое поколение генерации = новый суффикс `_v2`, `_v3` в `references/`
- Утверждённые ассеты в репо без суффикса, последняя версия — текущая
- Старые версии не удаляем, держим в `references/_archive/` для возможного возврата
