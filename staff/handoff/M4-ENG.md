# Handoff: Engineer — Веха M4

> **Роль:** Engineer (TS + Phaser 3 + Vitest)
> **Веха:** M4 — Перки и прогрессия
> **Репо:** https://github.com/alexbayov/oplot
> **Базовая ветка:** `m4-integration`
> **Твой PR-branch:** `m4/progression`
> **PR base:** `m4-integration` (НЕ `main`)

---

## Preconditions

- [x] GD M4 amendment merged в `m4-integration` (GDD §Прогрессия + §6.X Perk + balance §M4 готовы).
- [x] QA Spec M4 APPROVE.
- [x] PM сообщил тебе: «Parallel production M4 start».

---

## Контекст: что читать

| Файл | Зачем |
|---|---|
| `staff/roles/ENGINEER.md` | Твоя роль, рабочие правила |
| `staff/status/M4.md` | M4 scope, anti-scope, DoD |
| `staff/handoff/M3-SUMMARY.md` | Унаследованное состояние кода (89 vitest baseline) |
| `docs/GDD.md` §Прогрессия + §6.X | Спека XP-curve + perks + level-up flow |
| `docs/balance.md` §M4 | Точные числа |
| `src/state/GameState.ts` | Существующий state shape |
| `src/scenes/CombatScene.ts` | Точка применения `+damage` / `+crit_chance` / `+armor_efficiency` |
| `src/scenes/CraftScene.ts` | Точка применения `+crafting_speed` |
| `src/scenes/RadioScene.ts` | Для M3 NB follow-up rowHeight 96→120 |
| `src/scenes/BootScene.ts` | Для M3 NB follow-up preload |

---

## Твои deliverables

### 1. `src/systems/xp.ts` (NEW)

```ts
// API (signature эталонный, ты дотачивай):
export function awardXP(state: GameState, amount: number): { newLevel: number; leveledUp: boolean };
export function getNextLevelThreshold(level: number): number;
export function checkLevelUp(state: GameState): boolean;
```

- `getNextLevelThreshold` использует формулу из `balance.md` §M4 (например, `50 * level^1.5`).
- `awardXP` модифицирует `state.player.xp`, проверяет `checkLevelUp`, если true — увеличивает `state.player.level` и возвращает `{ leveledUp: true, newLevel }`.
- Overkill XP — carry over (по GDD §1.3, если GD выбрал иначе — следуй GDD).
- Unit-tests (vitest) **≥ 10**:
  - Базовое накопление XP.
  - Достижение threshold → level-up trigger.
  - Multi-level overkill (если выбран carry over: XP=999 даёт несколько level-up'ов).
  - `xp_gain_multiplier` perk применяется (см. п. 2).
  - Edge case: level=0 / xp=0.

### 2. `src/systems/perks.ts` (NEW)

```ts
export function applyPerk(state: GameState, perkId: PerkId): void;
export function getModifier(state: GameState, stat: PerkStat): number;
```

- `applyPerk` пушит `perkId` в `state.player.perks[]`. Идемпотентность: если уже взят — no-op (или throw — выбери и зафиксируй).
- `getModifier(state, stat)` возвращает aggregated multiplier для данного stat:
  - Сумма всех `additive` перков для этого stat'а.
  - Произведение всех `multiplicative` перков.
  - (Если `percentage` — конверт в multiplicative по GDD §6.X.)
  - Если у игрока нет перков с этим stat'ом — вернуть 1.0 (для multiplicative) или 0 (для additive).
- Импорт `content/perks.json` — runtime.
- Unit-tests (vitest) **≥ 10**:
  - `getModifier` без перков (baseline).
  - 1 additive perk применён.
  - 1 multiplicative perk применён.
  - 2 перка одного stat'а stacked.
  - Перки разных stat'ов не пересекаются.
  - Edge case: пустой `perks[]`.

### 3. `src/scenes/ProgressionScene.ts` (NEW)

Phaser scene (можно standalone сцена `ProgressionScene` или таб на `BaseScene` — выбери по UX). Отображает:

- Текущий уровень (текст: «Уровень: 3»).
- XP-bar (прямоугольник: `current_xp / threshold_to_next_level`).
- Список взятых перков (вертикальный list: icon 64×64 + name + description).

Кнопка «Назад» возвращает на BaseScene / предыдущую сцену.

Минимальная стилистика — соответствует существующим scenes (RadioScene / CraftScene). Не нужно красиво — нужно функционально.

### 4. `src/scenes/LevelUpScene.ts` (NEW)

Phaser scene popup. Открывается через `scene.launch('LevelUpScene', { perks: 3-random-perks })` когда `checkLevelUp(state)` true. Отображает:

- Заголовок «Новый уровень! Уровень N».
- 3 карточки с перками (icon + name + description).
- Каждая карточка кликабельна → вызывает `applyPerk(state, perkId)` + `scene.stop()` + возврат на исходную сцену.

Trigger:
- В точках вызова `awardXP` (после kill моба в CombatScene → `awardXP(state, mob.xp_reward)`) — если возвращается `leveledUp: true`:
  ```ts
  const candidates = randomPickThreePerksNotYetTaken(state);
  this.scene.launch('LevelUpScene', { perks: candidates });
  ```

### 5. Интеграция модификаторов

В существующих системах применяй `getModifier`:

- **`src/scenes/CombatScene.ts`** (или `src/systems/combat.ts` если выделено):
  - Урон игрока: `baseDamage * getModifier(state, 'damage')`.
  - Crit roll: `baseCrit + getModifier(state, 'crit_chance')` (или новая отдельная roll если `getModifier` возвращает additive).
  - Защита: `mitigation * getModifier(state, 'armor_efficiency')`.
- **`src/systems/weight.ts`** (return penalty):
  - `returnTimePenalty * getModifier(state, 'weight_penalty_multiplier')`.
- **`src/systems/craft.ts`** (или CraftScene):
  - `craftTime * getModifier(state, 'crafting_speed_multiplier')`.
- **`src/systems/loot.ts`** (drop generation):
  - `dropCount * getModifier(state, 'loot_quantity_multiplier')` (round).
- **При награждении XP за kill:**
  - `awardXP(state, mob.xp_reward * getModifier(state, 'xp_gain_multiplier'))`.

### 6. `src/state/GameState.ts` — extend

```ts
interface PlayerState {
  // существующие поля (hp, max_weight, backpack, baseStash, ...)
  xp: number;          // NEW
  level: number;       // NEW (start 1)
  perks: PerkId[];     // NEW (start [])
}
```

Init values при new game: `xp: 0, level: 1, perks: []`.

### 7. 3 M3 NB follow-ups (fold в этот PR)

- **`src/scenes/RadioScene.ts`:** `rowHeight = 96` → `rowHeight = 120`. Скриншот / визуально проверить, что 3 dummy signals не наезжают.
- **`src/scenes/BootScene.ts`:** добавить в `preload()` ALL M3 ассеты (mob sprites: marauder/wild_dog/mutant + 5 M3 mobs; item icons: 14 M3 items; zone backgrounds: warehouse + city; radio_icon). Цель — устранить lazy load в RadioScene / MapScene.
- **`src/types/mob.ts`** (или где-то в `src/types/`): экспортировать `export type MobRole = "regular" | "boss"`. Мигрировать existing string literal placeholder в `src/systems/zoneUnlock.ts` на enum.

### 8. Тесты

Все 89 M3 vitest passed (49 M2 + 40 M3) + новые M4 ≥ 20 (≥ 10 xp + ≥ 10 perks) = total ≥ 109. Все green.

### 9. Build

`npm run build` clean, bundle ≤ 2 MB (мониторь — добавление 2 scenes должно стоить < 100 KB).

---

## Definition of Done (твой чек-лист перед PR)

- [ ] `src/systems/xp.ts` + tests.
- [ ] `src/systems/perks.ts` + tests.
- [ ] `src/scenes/ProgressionScene.ts`.
- [ ] `src/scenes/LevelUpScene.ts`.
- [ ] Интеграция модификаторов в combat / weight / craft / loot.
- [ ] `GameState.player.{xp, level, perks}` добавлены.
- [ ] 3 M3 NB follow-ups закрыты (RadioScene rowHeight, BootScene preload, MobRole enum).
- [ ] 89 M3 vitest + M4 ≥ 20 = ≥ 109 passed.
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build` — все clean.
- [ ] Runtime smoke: 7-step Forest MVP + multi-zone unlock + M4 level-up flow (убить моба → XP → popup → выбор перка → ProgressionScene показывает) — работает.
- [ ] `staff/status/ENGINEER.md` обновлён под M4.
- [ ] PR описание содержит scope, anti-scope, что нового, test count + Recovery block.

---

## FORBIDDEN

- Self-merge. Push в `main` / `m4-integration` напрямую.
- PAT в URL / echo / print.
- Изменять `content/*.json` (это вотчина Content). Если тебе нужно изменение `perks.json` — PR comment Content'у.
- Изменять `assets/*` (это вотчина Artist). Если тебе нужен новый ассет — PR comment Artist'у.
- Изменять `docs/*` (это вотчина GD). Если в спеке ambiguity — PM-эскалация.
- Изменять чужие `staff/status/*.md`.
- M5+ фичи: **skill tree (поинты + ноды + prereq'и) — anti-scope M4**. Только flat 8 пассивных перков из JSON. Активные ability / cooldowns — anti-scope M4 (M5+).
- Боссы (M5), полная радио-логика (M6), модули оружия, Yandex SDK (M8), сторонние UI-библиотеки, анимации, звуки.
- План > 7 пунктов (разбивай на continuation).

---

## Процедура

1. Клонируй репо, `git checkout m4-integration`. Прогони baseline `npm install && npm run test` — должно быть 89 vitest passed.
2. Прочитай файлы из «Контекст».
3. Напиши план (**строго 5-7 пунктов**), отправь Alex'у блокирующим.
4. После апрува — `git checkout -b m4/progression`. Первый commit (например, `src/systems/xp.ts` skeleton + 1 тест) + push + Draft PR (recovery-safe).
5. Допиши porциями: xp.ts → perks.ts → ProgressionScene → LevelUpScene → integration → M3 follow-ups. После каждого подшага — commit + push.
6. Прогони все `npm` команды + runtime smoke (Chrome devtools, реальный playthrough M2+M3+M4).
7. Обнови `staff/status/ENGINEER.md`.
8. Flip Draft → Ready. Сообщи Alex'у блокирующим: «Engineer M4 PR <ссылка>».

Token-budget: эта задача — ~30 минут чтения + 3-5 часов письма кода. **Самая большая роль M4.** Точно нужны continuation'ы — push partial после каждого подшага, PM подхватывает.
