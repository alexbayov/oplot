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

/**
 * M13 PR-2: loot-профиль зоны. Сдвигает выпадение под категории ресурсов базы.
 *
 * Каждая категория — water | fuel | metal | food — мапится в item_id через
 * `BASE_RESOURCE_ITEMS` (см. sortieResolve.ts). Категория `other` ловит всё,
 * что не входит ни в одну базовую категорию (wood, cloth, ammo и т.п.).
 *
 * Алгоритм: rollLoot катит категорию по этим весам, потом случайный item_id из
 * пересечения зональных ресурсов и items этой категории. Если в зоне нет
 * подходящих item для выпавшей категории — fallback на равномерный выбор.
 */
export type ZoneLootCategory = "water" | "fuel" | "metal" | "food" | "other";

export interface ZoneLootProfile {
  /** Веса категорий. Не обязаны суммироваться к 1 — нормализуются. */
  base_weights: Partial<Record<ZoneLootCategory, number>>;
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
  /** M11.1 — диапазон тиров мобов и лута в зоне, например [1, 2] или [4, 5]. */
  zone_tier_range?: [number, number];
  /** M13 PR-2: loot-профиль под ресурсы базы. */
  loot_profile?: ZoneLootProfile;
}
