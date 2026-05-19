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
  // Remaining enemy ids for the next CombatScene encounter.
  current_enemies: string[];
  // Resources pre-rolled for the depth, drained as the player progresses.
  zone_loot_pool: InventoryStack[];
  // Loot dropped during the current/just-finished combat, shown in LootScene.
  pending_loot: InventoryStack[];
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
