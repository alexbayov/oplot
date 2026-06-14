// M13 PR-5: thin pass-through над GameState.data.items.
//
// До PR-5 здесь жил M11-слой (adaptLegacyItem + WeaponInstance + assembly
// + isCraftWeapon/isDropWeapon + setM11Items) — переходная архитектура
// которая знала «оба формата» и адаптировала legacy items под крафтовый
// граф. M13 убирает таксономию-двойняшку: items.json теперь под itemSchema,
// рантайм-код читает `kind` напрямую.
//
// Что унесли в PR-5 вместе с M11-слоем:
//   - M11Item / WeaponInstance / CraftWeapon / DropWeapon / WeaponPart /
//     WeaponMod / BrokenCraft типы (src/types/items.ts)
//   - createWeaponInstance / installMod / isCraftWeapon / isDropWeapon /
//     isWeaponMod / isWeaponPart / isBrokenCraft / setM11Items
//   - adaptLegacyItem (M11→M11 адаптер)
//   - durability.ts (рантайм системы прочности, 0 геймплей-вызовов)
//   - modEffects.ts (агрегация эффектов модов, 0 геймплей-вызовов)
//   - itemName() с WEAPON_NAMING_MODE веткой (M13 несёт только name_ru)
//
// Что вернётся в PR-6 (краф-UI, base loop): сборка стволов из component
// fits:weapon, моды, durability — всё пересобирается на M13 типах с
// живым потребителем.

import type { Item } from "../types";
import { GameState } from "./GameState";

/**
 * Получить предмет каталога по id.
 *
 * После M11-сноса это тонкая обёртка над `GameState.data.items[id]` —
 * остаётся как одна точка входа для тестов и UI, чтобы при следующей
 * миграции (если будет ещё одна за PR-6) можно было поменять источник
 * в одном месте.
 */
export const getItem = (id: string): Item | null => {
  return GameState.data.items[id] ?? null;
};

/**
 * Все известные предметы каталога (для UI каталогов, тестов).
 */
export const allItems = (): Item[] => {
  return Object.values(GameState.data.items);
};

/**
 * Отображаемое имя предмета. M13 несёт только `name_ru` (М11-я ветка
 * по `WEAPON_NAMING_MODE` / `name_real_ru` / `name_generic_ru` снесена
 * вместе с M11 — генерик-нейминг для Яндекс.Игр пересоберётся в PR-6+
 * если/когда понадобится). Сейчас просто прокси.
 */
export const itemName = (item: Pick<Item, "name_ru">): string => item.name_ru;

/**
 * Загрузить каталог items в GameState. После M11-сноса остаётся как
 * вызов из GameState.setContent — обратной совместимости ради (чтобы
 * не править GameState и не плодить дифф). Внутри ничего не делает:
 * GameState.data.items уже содержит мапу из ContentData.
 */
export const loadContentItems = (_items: Record<string, Item>): void => {
  void _items;
};
