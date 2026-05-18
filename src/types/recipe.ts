import type { ItemTier } from "./item";

export interface RecipeIngredient {
  item_id: string;
  count: number;
}

export interface Recipe {
  id: string;
  result_id: string;
  result_count: number;
  ingredients: RecipeIngredient[];
  tier: ItemTier;
  unlock_condition: string | null;
  craft_time_s: number;
}
