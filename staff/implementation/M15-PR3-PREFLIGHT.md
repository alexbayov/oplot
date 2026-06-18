# M15-PR3 — Arsenal stat-delta — PREFLIGHT ADDENDUM (D-PR3 → Variant B)

> Аддендум к `M15-PREFLIGHT.md §8`. Базовый префлайт уже GO'd (M15 = 3 PR
> последовательно). Этот документ фиксирует **изменение решения D-PR3** после
> код-ревизии — с GO Алекса (2026-06-19).

## 0. Контекст: почему меняем D-PR3

`M15-PREFLIGHT.md §8.2` фиксировал guard: «equipped = catalog или null →
сравнивать не с чем, показываем абсолютные статы без дельты».

**Эта посылка ложна по коду.** `SortieRunScene.snapshotHero` (`:113-141`)
резолвит урон эквип-оружия ОДНИМ путём для всех трёх веток:
- `catalog` → `items[id].stats.damage_min/max` (defensive `typeof === "number"`);
- `crafted` → `inst.stats` при `durability_current > 0`;
- `null` / broken / missing → bare-hands fallback `4/7`.

ВСЕ 32 catalog-оружия несут `damage_min/max` (`content/items.json`); стартовый
`craft_knife` = `4/7`. То есть «сравнить не с чем» неверно: catalog-урон
сравним и в бою РЕАЛЬНО используется. Доминирующий ранний кейс — герой
эквипирован catalog-ножом, собирает первый ствол и хочет видеть
«5–9 vs 4–7 → +1/+2», а не голые «5–9». Vector A (guard) блокирует дельту
ровно там, где она нужнее всего.

## 1. Решение — Variant B (GO Алекса)

`statDelta` сравнивает кандидата против **резолвнутого baseline'а эквипа,
зеркалящего бой 1:1**. Дельта показывается ВСЕГДА и всегда code-true.
Damage-only ограничение из D-PR3 сохраняется (accuracy/weight/durability — НЕ
path для PR3, в бой не идут до M16).

## 2. Три рейлинга (условие GO)

**R1 — Single source-of-truth для резолва урона.** Switch
`catalog→items / crafted→inst / null|broken→4/7` НЕ дублируется. Выносится в
чистый `resolveEquippedDamage(eq, items, crafted) → {damage_min, damage_max}`
(новый `src/systems/weaponDamage.ts`, экспорт + `BARE_HANDS_DAMAGE = {4,7}`).
Вызывается ИЗ `snapshotHero` И из delta-helper'а. Если baseline 4/7 или путь
резолва когда-нибудь тюнится — оба места едут синхронно. Это рефактор-value-add
самого PR3 (combat-код тач намеренный, согласован).

**R2 — Defensive parity 1:1.** В резолвере буквально повторяем
`typeof w.stats.damage_min === "number"` (НЕ `?? 4`), чтобы малформед
catalog-стат падал в bare-hands ровно как в бою. Юнит-тест: catalog со
`stats: {}` → дельта от `4/7`, не от `undefined`, без throw.

**R3 — Broken-кандидат резолвится через 4/7.** Кандидат-инстанс с
`durability_current <= 0` в бою даёт `4/7` (catalog-fallback), не свои `stats`.
Дельта на сломанном кандидате считается от `4/7`. Юнит-тест: broken candidate
vs equipped → дельта от bare-hands; оба broken → дельта `0/0`.

## 3. Контракт хелперов

```
// systems/weaponDamage.ts
BARE_HANDS_DAMAGE = { damage_min: 4, damage_max: 7 }
resolveEquippedDamage(eq: EquippedWeapon|null, items, crafted) -> {damage_min, damage_max}
  // catalog: items[id], kind==="weapon", typeof-guard на каждое поле
  // crafted: crafted.find(id), durability_current > 0 ? inst.stats : bare-hands
  // null/missing/broken: bare-hands 4/7

// systems/craftedWeapons.ts  (statDelta живёт здесь, §8.1)
weaponStatDelta(candidate: WeaponInstance, equipped, items, crafted) -> {
  candidate:  {damage_min, damage_max},   // ЭФФЕКТИВНЫЙ (broken→4/7) через resolveEquippedDamage({kind:"crafted",id:candidate.id},...)
  equipped:   {damage_min, damage_max},   // ЭФФЕКТИВНЫЙ
  delta_min, delta_max,                   // candidate - equipped
  is_equipped_self,                       // equipped==crafted && same id → метка «Экипировано», не нулевая дельта
  candidate_broken,                       // для UI-ноты «в бою 4–7»
}
```

## 4. Рендер (CraftedWeaponsScene.renderDetailPanel)

После строки «Урон: min–max» (frozen stats):
- `is_equipped_self` → метка «✓ Экипировано» (без дельты).
- иначе → строка `vs экип.: {±dmin} / {±dmax}`, каждое значение цветом по знаку
  (>0 зелёный / <0 красный / 0 серый).
- `candidate_broken` → нота «сломано — в бою 4–7» (дельта от 4/7).
Smoke: панель не падает при любом equip-state (catalog / crafted / null / broken).

## 5. Drift-гейт (тесты)

- Паритет: `resolveEquippedDamage(catalog craft_knife)` == `{4,7}`; тюн мока
  (`damage_min: 5`) → резолвер отдаёт 5 (доказывает чтение из items, не хардкод).
- Поскольку `snapshotHero` теперь ЗОВЁТ `resolveEquippedDamage`, разъехаться с
  боем структурно нельзя — это и есть смысл R1.
- statDelta: catalog-equipped (knife) vs crafted-candidate; crafted-equipped;
  null-equipped→от 4/7; self→is_equipped_self; broken candidate→от 4/7;
  оба broken→0/0; defensive `stats:{}`.

## 6. Границы

SAVE_VERSION = 8, без bump, без новых полей (`cloudSave.ts` нетронут). Файлы:
`+weaponDamage.ts`, `SortieRunScene.ts` (snapshotHero рефактор), `craftedWeapons.ts`
(+statDelta), `CraftedWeaponsScene.ts` (рендер), тесты. PR3 — финальный в M15.
