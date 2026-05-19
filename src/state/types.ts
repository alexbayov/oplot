import type { Item, Mob, Recipe, Zone } from "../types";

export interface InventoryStack {
  item_id: string;
  count: number;
}

export interface PlayerState {
  hp: number;
  hp_max: number;
  level: number;
  xp: number;
  max_weight_kg: number;
  equipped_weapon_id: string;
  equipped_armor_id: string;
  // Backpack carried during a sortie. Empty when on base.
  backpack: InventoryStack[];
}

export interface SortieState {
  zone_id: string;
  depth: 1 | 2 | 3;
  fights_total: number;
  fights_completed: number;
  // All combats for this sortie are rolled up-front so retries can't cherry-pick easy mobs.
  encounters: string[][];
  // Zone resources pre-rolled at sortie start, drained per fight.
  zone_loot_remaining: InventoryStack[];
  // Loot dropped during the most recent combat, presented in LootScene.
  pending_loot: InventoryStack[];
  // Set when hero used "Укрытие"; expires at hero's next turn.
  cover_active: boolean;
}

export interface ContentData {
  items: Record<string, Item>;
  mobs: Record<string, Mob>;
  recipes: Record<string, Recipe>;
  zones: Record<string, Zone>;
}

export interface GameStateShape {
  player: PlayerState;
  data: ContentData;
  currentSortie: SortieState | null;
  baseStash: InventoryStack[];
}
