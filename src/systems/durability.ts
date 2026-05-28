/**
 * M11.0 — Durability & Breakage.
 *
 * Что происходит при поломке оружия (по решению Alex, вопрос 4):
 *   🔨 Самодел (craft):  превращается в broken_craft → можно разобрать на верстаке
 *   🎯 Дроп (drop): экземпляр уничтожается, parts возвращаются 30% от исходных
 *
 * Спека: docs/redesign/m11/M11.0-questions-resolved.md §4.
 */

import type { InventoryStack } from "../state/types";
import { addToStack } from "../state/GameState";
import { getItem, isCraftWeapon, isDropWeapon } from "../state/ItemRegistry";
import type { WeaponInstance } from "../types/items";

/** Результат поломки самодела. */
export interface CraftBreakResult {
  inventory: InventoryStack[];
  /** ID broken_craft, появившегося в инвентаре. */
  brokenItemId: string;
}

/**
 * Самодел израсходовал durability → ломается → в инвентаре появляется
 * `broken_<id>` (один экземпляр).
 *
 * Стак самодела при этом уменьшается на 1 (логика расхода). Если стак
 * был = 1, он удаляется автоматически (см. removeFromStack).
 */
export const onCraftWeaponBreak = (
  weaponId: string,
  inventory: InventoryStack[],
): CraftBreakResult | null => {
  const weapon = getItem(weaponId);
  if (!weapon || !isCraftWeapon(weapon)) return null;

  const brokenItemId = weapon.breaksInto;
  const nextInventory = addToStack(inventory, brokenItemId, 1);
  return { inventory: nextInventory, brokenItemId };
};

/** Результат поломки сборного оружия. */
export interface DropBreakResult {
  inventory: InventoryStack[];
  /** Возвращённые части (item_id + count). */
  returnedParts: { item_id: string; count: number }[];
}

/**
 * Сборный ствол сломан → instance уничтожается → возвращается ~30% частей.
 *
 * "30%" реализовано как: для каждой части с вероятностью 0.3 кидаем её
 * обратно в инвентарь.
 */
export const onDropWeaponBreak = (
  instance: WeaponInstance,
  inventory: InventoryStack[],
  rng: () => number = Math.random,
): DropBreakResult | null => {
  const weapon = getItem(instance.itemId);
  if (!weapon || !isDropWeapon(weapon)) return null;

  const returned: { item_id: string; count: number }[] = [];
  let nextInventory = inventory;
  for (const partId of weapon.partIds) {
    if (rng() < 0.3) {
      nextInventory = addToStack(nextInventory, partId, 1);
      returned.push({ item_id: partId, count: 1 });
    }
  }
  return { inventory: nextInventory, returnedParts: returned };
};

/**
 * Уменьшить durability экземпляра на n. Возвращает обновлённый instance
 * и флаг `broken` если durability стало <= 0.
 */
export const damageWeapon = (
  instance: WeaponInstance,
  n: number,
): { instance: WeaponInstance; broken: boolean } => {
  const next = Math.max(0, instance.durability - n);
  return {
    instance: { ...instance, durability: next },
    broken: next <= 0,
  };
};
