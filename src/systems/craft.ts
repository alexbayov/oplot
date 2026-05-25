import { countInStacks, removeFromStack, addToStack } from "../state/GameState";
import type { InventoryStack } from "../state/types";
import type { Item, Recipe } from "../types";

export interface MissingIngredient {
  item_id: string;
  need: number;
  have: number;
}

export interface CraftCheck {
  ok: boolean;
  missing: MissingIngredient[];
}

// can_craft(recipe, inventory) = ∀ ingredient ∈ recipe.ingredients:
//                                inventory.count(ingredient.item_id) >= ingredient.count
export const canCraft = (
  recipe: Recipe,
  inventory: InventoryStack[],
): CraftCheck => {
  const missing: MissingIngredient[] = [];
  for (const ingredient of recipe.ingredients) {
    const have = countInStacks(inventory, ingredient.item_id);
    if (have < ingredient.count) {
      missing.push({
        item_id: ingredient.item_id,
        need: ingredient.count,
        have,
      });
    }
  }
  return { ok: missing.length === 0, missing };
};

export interface CraftResult {
  inventory: InventoryStack[];
}

// apply_craft: atomically remove ingredients, then add result_id * result_count.
// Throws if not craftable — callers should check canCraft first.
export const applyCraft = (
  recipe: Recipe,
  inventory: InventoryStack[],
): CraftResult => {
  const check = canCraft(recipe, inventory);
  if (!check.ok) {
    throw new Error(
      `Cannot craft ${recipe.id}: missing ${check.missing.map((m) => `${m.item_id} ${m.have}/${m.need}`).join(", ")}`,
    );
  }
  let next = inventory.map((stack) => ({ ...stack }));
  for (const ingredient of recipe.ingredients) {
    next = removeFromStack(next, ingredient.item_id, ingredient.count);
  }
  next = addToStack(next, recipe.result_id, recipe.result_count);
  return { inventory: next };
};

// Localised "what's missing" string for UI hints.
export const formatMissing = (
  missing: MissingIngredient[],
  items: Record<string, Item>,
): string =>
  missing
    .map((m) => {
      const item = items[m.item_id];
      const name = item ? item.name_ru : m.item_id;
      return `${name} ${m.have}/${m.need}`;
    })
    .join(", ");

export const canCraftWithBossDrop = (
  recipe: Recipe,
  inventory: InventoryStack[],
): CraftCheck => {
  const base = canCraft(recipe, inventory);
  if (!base.ok) return base;
  if (recipe.tier === 3 && recipe.boss_drop_ingredient) {
    const have = countInStacks(inventory, recipe.boss_drop_ingredient);
    if (have < 1) {
      return {
        ok: false,
        missing: [
          { item_id: recipe.boss_drop_ingredient, need: 1, have },
        ],
      };
    }
  }
  return base;
};
