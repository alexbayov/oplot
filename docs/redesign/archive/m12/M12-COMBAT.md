# M12 — «Combat Overhaul» (полный / MAX)

> Версия: v1 (master plan)
> Автор: Zo · PM: Alex
> Дата: 2026-05-28
> Источник идеи: [`IDEAS.md` § B-2](IDEAS.md#b-2-боёвка-с-активными-приёмами) (вариант MAX)

---

## Цель вехи

Сделать **боевой режим** тем, ради чего игрок возвращается. Сейчас бой — это «нажми атаку 6 раз». После M12 бой — это **мини-головоломка** с реальными решениями каждый ход: кого бить, чем бить, какой приём, когда укрыться, когда выпить стим, когда переместиться, использовать ли окружение.

Берём **полный MAX из B-2 IDEAS.md** — все 9 пунктов. M11.0d (UI установки модов), M11.4 (skill tree активные узлы) — сливаются с подвехами M12.

---

## Диагноз

| Что | Сейчас | После M12 |
|---|---|---|
| Action bar | 4 статичные кнопки | 1-2 главных + до 5 weapon abilities + 3 расходника |
| Targeting | бьёт первого живого | клик по портрету моба |
| Влияние оружия | только damage_min/max | calibre, magazineSize, noise, mod effects, durability |
| Статус-эффекты | 0 | 6 (bleed, stun, expose, fear, burn, frenzy) |
| Позиция в бою | не существует | 3 ряда (front/mid/back) |
| Окружение | пусто | 0-3 объекта (бочка, машина, тело) |
| Фазы мобов | только боссы | все мобы (триггер 50% HP) |
| Crit система | нет | base 5% + scope + telegraph |
| Лут | per fight (в конце) | per kill (опционально, mid-fight loot) |
| Камера | статичная | shake/zoom на крит/фазу |
| Музыка | 1 трек | 4 слоя (calm/combat/lowhp/boss) |
| Telegraph мобов | скрыт в коде | иконки над портретом |
| Initiative | пересчитывается | timeline visible на 5 ходов вперёд |

---

## Архитектура: State Machine

Бой получает чистую state machine:

```
combat_start → turn_start → action_select → action_resolve → status_tick →
  → next_turn (loop) | combat_end (victory|defeat|retreat)
```

Каждый actor (hero + mobs) — entity со state:
- `hp`, `maxHp`, `position` (front/mid/back)
- `equipped` (weapon instance with mods)
- `magazine`, `cooldowns: Map<abilityId, number>`
- `statuses: StatusInstance[]`
- `phase: 1 | 2`, `telegraph: AbilityId | null`

Все М11 поля (caliber, magazineSize, mods) **впервые становятся** runtime state.

---

## 8 подвех

### M12.0 — Foundation (calc engine + state)
M11 поля доходят до боя. Targeting UI. HP бары. Ammo per fight. Mod effects.
**~2 недели, 3 PR.** Без неё всё остальное не имеет смысла.
→ [`m12/M12.0-foundation.md`](m12/M12.0-foundation.md)

### M12.1 — Statuses & Active Abilities
6 статусов (bleed/stun/expose/fear/burn/frenzy). Weapon skill bar — 1 активный приём на ствол.
**~3 недели, 3 PR.** Сюда сливается M11.4 активные узлы.
→ [`m12/M12.1-statuses-abilities.md`](m12/M12.1-statuses-abilities.md)

### M12.2 — Consumables & Mob Signatures
3 расходника (стим/бинт/дымовая). Mob telegraph (иконки 🎯🛡️💨). Каждый моб получает signature ability.
**~2 недели, 2 PR.**
→ [`m12/M12.2-consumables-signatures.md`](m12/M12.2-consumables-signatures.md)

### M12.3 — Position & Environment
3 ряда боя. Move как action. 0-3 environment объектов на встречу (бочка, машина, тело).
**~3 недели, 3 PR.** Самая рискованная подвеха — крупный UX перепил.
→ [`m12/M12.3-position-environment.md`](m12/M12.3-position-environment.md)

### M12.4 — Mob Phases & Initiative Timeline
Все мобы получают фазу 2 при 50% HP. Initiative timeline видна на 5 ходов вперёд.
**~2 недели, 2 PR.**
→ [`m12/M12.4-phases-initiative.md`](m12/M12.4-phases-initiative.md)

### M12.5 — Crit & Loot Per Kill
Crit система (base + scope + telegraph). Лут с каждого моба сразу после смерти, опционально подобрать в бою.
**~1.5 недели, 2 PR.**
→ [`m12/M12.5-crit-loot.md`](m12/M12.5-crit-loot.md)

### M12.6 — Polish (camera/sound/music)
Camera shake на крит, zoom на фазу. 4-слойная музыка. SFX для всех новых action'ов.
**~1.5 недели, 2 PR.** Финальный «feel»-полишинг.
→ [`m12/M12.6-polish.md`](m12/M12.6-polish.md)

### M12.7 — Docs Sync (обязательный финал)
GDD, balance.md, content-brief, ui-ux-plan — всё под новый бой. Без этого M13+ старует на устаревшей доке.
**~3 дня, 1 PR.**
→ [`m12/M12.7-docs-sync.md`](m12/M12.7-docs-sync.md)

**ИТОГО: 8 подвех, ~18 PR, ~3 месяца focused работы.**


---

## Перепланировка M11

С приходом M12 (MAX) у M11 меняется shape — некоторые подвехи сливаются или переезжают:

| M11 подвеха | Было | Стало |
|---|---|---|
| **M11.0c** Assemble UI | ✅ закрыта PR #100 | — |
| **M11.0d** Mod install UI | планировалась отдельной | **сливается в M12.0** (UI слотов + applyAttack читает моды) |
| **M11.0e** Mob drops | ✅ закрыта PR #99 | — |
| **M11.1** Tier system | планировалась | **остаётся**, нужна для M12 (mob T требует weapon T) |
| **M11.2** Точка (open-zone) | планировалась | **переносится на M13** — без живого боя локации скучны |
| **M11.3** Зачистка (dungeon) | планировалась | **переносится на M13** |
| **M11.4** Skill tree | планировалась | **остаётся**, но активные узлы переезжают в M12.1 |
| **M11.5** Docs Sync | планировалась | **остаётся**, делается перед M12 |

**Новый порядок:**
1. M11.1 (тиры, 3 дня)
2. M11.4 пассивная часть (1.5 недели)
3. M11.5 docs sync (3 дня)
4. **M12 целиком (3 месяца)**
5. M13 = бывшие M11.2 + M11.3 (Точка + Зачистка) поверх живого боя

---

## Три класса игроцких действий (новый action bar)

Action bar превращается из 4 статичных кнопок в **динамический набор**:

| Класс | Описание | Сколько в одном ходу | Источник |
|---|---|---|---|
| 🟢 **Main** | АТАКА, приём оружия, перезарядка, MOVE, использовать env | **1 в ход** | weapon + position |
| 🟡 **Free** | бесплатный шаг (с перком), быстрое окружение | до 1 в ход | perks |
| 🔵 **Reactive** | укрытие, расходник, передача хода | до 2 в ход | inventory |

**Пример хода:** «Шаг назад (free, перк Lightfoot) → выпить стим (reactive) → очередь из АКМ по сапёру (main).»

---

## 3 правила управления техдолгом

Те же что в M11, проверенные:

### 1. CombatEngine как фасад
Весь бой за пределами CombatScene идёт через `src/systems/combatEngine.ts`. Сцена — тонкая viewmodel. Старая `combat.ts` остаётся как low-level calc, новый combatEngine оборачивает.

### 2. Save migration v2 → v3 с первого PR
Активные cooldowns, statuses, position не существовали в v2. Migration делается в M12.0, не позже. Иначе старые сейвы крашатся.

### 3. GDD как контракт
Любое изменение combat механики ИЛИ описано в `M12-COMBAT.md` / sub-spec, ИЛИ это рефакторинг без mechanic-change. Никаких «по дороге решил, что bleed теперь 7% а не 5%».

---

## Риски и митигация

| Риск | Вероятность | Митигация |
|---|---|---|
| Перегруз UI (слишком много кнопок) | 🟡 средняя | M12.0 кладёт максимум 6-7 кнопок одновременно; всё лишнее в submenu |
| Position UI ломает существующий layout | 🟡 средняя | M12.3 — отдельная подвеха с отдельным prototype-PR'ом |
| Balance ломается (всё OP/UP) | 🔴 высокая | GD сидит на каждой подвехе, отдельный M12.4-balance.md с эталонными боями |
| Mobile UX (приёмы не помещаются) | 🟡 средняя | Action bar на мобиле — горизонтальный scroll или 2 ряда |
| Старые сейвы крашатся | 🟢 низкая | Migration с первого PR, integration test |
| 3 месяца — слишком долго | 🟡 средняя | После каждой подвехи играбельный билд; можно остановиться на любой точке |

---

## Acceptance вехи в целом

Веха M12 закрыта когда **5 из 6** следующих утверждений истинны:

1. Игрок может объяснить разницу между ПМ и АКМ в бою (не «АК лучше», а «АК-очередь по 3 мобам, ПМ для тихого устранения»)
2. Игрок хотя бы раз использовал статус-эффект осмысленно («навёл expose → бил с +50%»)
3. Игрок передвигался по позициям в бою хотя бы 3 раза за вылазку
4. Игрок использовал расходник в критический момент (стим, дымовая)
5. Игрок видел telegraph моба и среагировал (укрылся / убил первым)
6. После победы игрок чувствует, что **управлял** боем, а не наблюдал

→ Если 5 из 6 — веха закрыта.

---

## Связанные документы

- [`m12/M12.0-foundation.md`](m12/M12.0-foundation.md) — calc engine, state, M11 wire-up, targeting, HP bars
- [`m12/M12.1-statuses-abilities.md`](m12/M12.1-statuses-abilities.md) — 6 статусов, weapon skill bar, активные приёмы
- [`m12/M12.2-consumables-signatures.md`](m12/M12.2-consumables-signatures.md) — стим/бинт/дымовая, telegraph иконки, signatures
- [`m12/M12.3-position-environment.md`](m12/M12.3-position-environment.md) — 3 ряда, move action, env-объекты
- [`m12/M12.4-phases-initiative.md`](m12/M12.4-phases-initiative.md) — фазы всех мобов, initiative timeline
- [`m12/M12.5-crit-loot.md`](m12/M12.5-crit-loot.md) — crit формула, лут per kill
- [`m12/M12.6-polish.md`](m12/M12.6-polish.md) — camera, SFX, dynamic music
- [`m12/M12.7-docs-sync.md`](m12/M12.7-docs-sync.md) — синхронизация GDD/balance/UI-UX

---

## Команда и роли

Все 5 ролей из `staff/TEAM.md` нужны. Промпты для запуска подсессий по каждой подвехе — отдельно в `staff/kickoff/M12.X-{ROLE}.md` (стартовые шаблоны для M12.0 — после мерджа этого мастер-плана).

| Роль | Ответственность в M12 | Самая нагруженная подвеха |
|---|---|---|
| **GD** (Game Designer) | Балансировка чисел, формулы crit/status, эталонные бои | M12.1, M12.4, M12.5 |
| **Content Designer** | Активные приёмы в items.json, signatures в mobs.json, env-объекты | M12.1, M12.2, M12.3 |
| **Artist** | Иконки приёмов, статусов, телеграфов, env-спрайты, camera FX | M12.2, M12.3, M12.6 |
| **Engineer (Zo)** | Все системы — engine, status manager, skill bar UI, position layer, initiative timeline | все подвехи |
| **QA** (Spec + Accept) | Verdict перед каждой подвехой + acceptance после | все подвехи |
