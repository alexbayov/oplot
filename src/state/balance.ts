// Numeric constants from docs/balance.md.
// Single source of truth for runtime systems; values must not diverge from balance.md.

// Global constants (balance.md §Общие константы)
export const HERO_MAX_WEIGHT_KG = 30;
export const MAX_LEVEL = 10;
export const BASE_RETURN_TIME_S = 30;
export const WEIGHT_PENALTY_FACTOR = 1.0;
export const LOOT_LOSS_ON_DEFEAT = 0.5;
export const COVER_DEFENSE_BONUS_PCT = 0.5;
export const DAMAGE_ROLL_MIN = 0.85;
export const DAMAGE_ROLL_MAX = 1.15;
export const MIN_DAMAGE_FLOOR = 1;
export const WEIGHT_INITIATIVE_PENALTY = 50;

// Hero starting stats (balance.md §Hero)
export const HERO_HP_MAX = 100;
export const HERO_ENERGY_MAX = 50;
export const HERO_BASE_SPEED = 100;
export const HERO_START_LEVEL = 1;
export const HERO_START_XP = 0;
export const HERO_START_WEAPON_ID = "knife";
export const HERO_START_ARMOR_ID = "cloth_jacket";
export const HERO_START_BANDAGES = 2;

// XP table — M4 formula: xp_to_next(level) = round(40 * level^1.5).
// M1/M2 formula preserved as xpToNextM1 for reference only.
export const xpToNextM1 = (level: number): number =>
  25 * level * level - 25 * level + 50;

export const xpToNext = (level: number): number =>
  Math.round(40 * Math.pow(level, 1.5));

export const xpRequired = (level: number): number => {
  let total = 0;
  for (let k = 1; k < level; k += 1) {
    total += xpToNext(k);
  }
  return total;
};

// M4 perk pool size (8 JSON perks + 1 hardcoded veteran_conditioning fallback).
export const PERK_POOL_SIZE = 8;
export const PERKS_PER_LEVEL_UP = 3;
export const VETERAN_CONDITIONING_HP_BONUS = 10;

// Marauder flee threshold (GDD §5).
export const MARAUDER_FLEE_HP_RATIO = 0.3;
export const MARAUDER_FLEE_INITIATIVE_PENALTY = 0.05;
