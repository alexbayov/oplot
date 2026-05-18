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
  unlock_condition: string;
}
