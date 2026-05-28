import type { Item, Mob, Perk, RadioSignal, Recipe, Zone } from "../types";
import type { Encounter } from "../types/encounter";

export interface InventoryStack {
  item_id: string;
  count: number;
}

// GDD §6.4.M3.3 — minimal progress flags driving Zone.unlock_condition.
// Additive: M1/M2 path (forest "start") doesn't read these fields.
export interface GameProgress {
  forest_depth_2_completed: boolean;
  any_warehouse_sortie_completed: boolean;
  any_forest_sortie_completed: boolean;
  suburbs_sortie_completed: boolean;
  warehouse_boss_defeated: boolean;
  factory_sortie_completed: boolean;
  city_boss_defeated: boolean;
  metro_sortie_completed: boolean;
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
  // M10.2: эффекты предыдущего encounter'а, применяются в следующем бою и сбрасываются.
  next_fight_initiative_loss?: boolean;
  next_mob_hp_bonus_pct?: number;
  next_fight_enemy_count_delta?: number;
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
  // M10.2: encounters between fights — loaded from content/encounters.json.
  encounters?: Encounter[];
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
