import type { Item, Mob, Perk, RadioSignal, Recipe, Zone } from "../types";

export interface InventoryStack {
  item_id: string;
  count: number;
}

// GDD §6.4.M3.3 — minimal progress flags driving Zone.unlock_condition.
// Additive: M1/M2 path (forest "start") doesn't read these fields.
export interface GameProgress {
  forest_depth_2_completed: boolean;
  any_warehouse_sortie_completed: boolean;
  daily_completed: Record<string, number>;
  radio_trust: number;
}

export interface SettingsState {
  sfxMuted: boolean;
  sfxVolume: number;
}

export interface PlayerState {
  hp: number;
  hp_max: number;
  level: number;
  xp: number;
  max_weight_kg: number;
  equipped_weapon_id: string;
  equipped_armor_id: string;
  perks: Perk[];
  backpack: InventoryStack[];
  gas: number;
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
  // M3 GDD §10.M3: radio signals loaded from content/radio.json at boot.
  // Empty array when the file is missing or content count mismatches (soft-warn).
  radioSignals: RadioSignal[];
  perks: Perk[];
}

export interface GameStateShape {
  player: PlayerState;
  data: ContentData;
  currentSortie: SortieState | null;
  baseStash: InventoryStack[];
  // M3 GDD §6.4.M3.3 — unlock flags driving MapScene visibility.
  progress: GameProgress;
  settings: SettingsState;
}
