export interface ZoneLevel {
  depth: 1 | 2 | 3;
  enemies: string[];
  enemy_count: [number, number];
  resources: string[];
  resource_count: [number, number];
  min_player_level: number;
}

export interface Zone {
  id: string;
  name_ru: string;
  level: number;
  description_ru: string;
  resources: string[];
  mobs: string[];
  boss_id: string | null;
  unique_resources: string[];
  levels: ZoneLevel[];
  // GDD §6.4 / §6.4.M3: "start" | "forest_depth_2_completed" | "any_warehouse_sortie_completed".
  unlock_condition: string;
  // GDD §6.4.M3 / balance.md §M3: optional multiplier applied to BASE_RETURN_TIME_S.
  // Default 1.0 (forest omits the field → M1/M2 formula is unchanged).
  return_time_multiplier?: number;
}
