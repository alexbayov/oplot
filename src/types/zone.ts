export interface ZoneLevel {
  depth: 1 | 2 | 3;
  enemies: string[];
  enemy_count: [number, number];
  resources: string[];
  resource_count: [number, number];
  min_player_level: number;
  // M5 GDD §9: gas zone flag. If true, gas damage applies per turn unless player has gas_mask.
  is_gas?: boolean;
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
  unlock_condition: string;
  return_time_multiplier?: number;
  // M5 GDD §9: daily instance cooldown in hours (default 24).
  daily_reset_hours?: number;
  // M5 GDD §9: gas damage per turn when inside a gas level without gas_mask.
  gas_damage_per_turn?: number;
}
