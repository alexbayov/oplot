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
  // M5 GDD §9: T3 recipes require a boss-drop ingredient as gate.
  boss_drop_ingredient?: string;
  // M11.0a content (Devin) — для разделения "Крафт" и "Сборка" в UI.
  recipe_type?: "craft" | "assemble";
  // M11.0a content — true для рецептов крафта модификаций (ПБС, прицел, магазин).
  is_mod?: boolean;
}
