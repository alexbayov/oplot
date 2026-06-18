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
// M13 PR-5: post-migration `knife` → `craft_knife` (legacy item_class=
// craft, kind=weapon slot=action). cloth_jacket остался с тем же id,
// armor.slot=plate.
export const HERO_START_WEAPON_ID = "craft_knife";
export const HERO_START_ARMOR_ID = "cloth_jacket";
export const HERO_START_BANDAGES = 2;

// ─────────────────────────────────────────────────────────────────────────
// M13 PR-6c — base sim layer (offline accrual)
// ─────────────────────────────────────────────────────────────────────────
// Defaults из preflight §11. Балансовые ставки — тюнятся свободно после
// playtest без изменений в коде/тестах (тесты бьют по invariants, не по
// конкретным числам где это возможно).

/** Грядка: water/цикл (стоимость еды). */
export const GARDEN_WATER_PER_CYCLE = 1;
/** Грядка: food/цикл (накапливается в буфер постройки). */
export const GARDEN_FOOD_PER_CYCLE = 5;
/** Грядка: длина цикла. */
export const GARDEN_CYCLE_MS = 30 * 60 * 1000;
/** Грядка: cap буфера. После заполнения цикл больше не идёт. */
export const GARDEN_CAP = 20;

/** Койка: food/цикл (потребляется из baseResources). */
export const BUNK_FOOD_PER_CYCLE = 1;
/** Койка: hp/цикл (лечит player.hp напрямую, clamp ≤ hp_max). */
export const BUNK_HP_PER_CYCLE = 5;
/** Койка: длина цикла. */
export const BUNK_CYCLE_MS = 10 * 60 * 1000;

/**
 * Максимальное окно офлайн-прогрессии. После 8ч delta клампится — не
 * вознаграждаем бесконечное отсутствие (sortie loop важнее).
 */
export const MAX_OFFLINE_WINDOW_MS = 8 * 60 * 60 * 1000;
/**
 * Минимальное окно для accrual. Открыл-закрыл за минуту — no-op.
 * Гасит спам от частых заходов и F5-refresh.
 */
export const MIN_ACCRUAL_WINDOW_MS = 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────
// M13 PR-6b-3 — Verstak energy gate + generator (bunk-model)
// ─────────────────────────────────────────────────────────────────────────

/** Генератор: fuel/цикл (стоимость энергии). */
export const GENERATOR_FUEL_PER_CYCLE = 1;
/** Генератор: energy/цикл (пишется НАПРЯМУЮ в `baseResources.energy`, без buffer). */
export const GENERATOR_ENERGY_PER_CYCLE = 1;
/** Генератор: длина цикла. Между bunk (10мин) и garden (30мин). */
export const GENERATOR_CYCLE_MS = 5 * 60 * 1000;
/** Verstak-gate: flat cost за каждый успешный `assembleFromStash`. */
export const ASSEMBLE_ENERGY_COST = 5;

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

// ─────────────────────────────────────────────────────────────────────────
// M13 PR-6b-1 — durability wire
// ─────────────────────────────────────────────────────────────────────────

/**
 * Сколько durability_current отнимается с эквипнутого crafted-оружия
 * за один выигранный энкаунтер. Дефолт preflight §8 = 1: при
 * durability_max = 5 (типичная стартовая сборка из 4 партов с
 * `+1 durability` каждая) сборка переживает ~5 победных энкаунтеров.
 * Тюнится свободно — тесты бьют по знаку (decrement-on-won), не
 * по числу.
 */
export const PER_ENCOUNTER_HIT = 1;

// ─────────────────────────────────────────────────────────────────────────
// M15 PR-1 — weapon repair (закрывает C6 repair-debt)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Стоимость починки в металле за 1 очко восстановленной прочности.
 * `repairCost = ceil((durability_max − durability_current) × этого)`.
 * DF1 (Alex GO): ресурс = металл, не энергия — энергия уже гейтит сборку
 * (`ASSEMBLE_ENERGY_COST`), у металла мало стоков, repair даёт ему смысл.
 * Тюнится свободно — тесты бьют по пропорции/знаку, не по числу.
 */
export const METAL_PER_DURABILITY_POINT = 1;

/**
 * DF1b (Alex GO): каждая починка необратимо снижает `durability_max` на
 * это значение — «усталость металла». Делает жизненный цикл оружия
 * конечным: ~durability_max починок → `durability_max` упирается в пол
 * ⇒ единственный путь = разобрать на детали. Без decay repair = вечный
 * 100%-restore и разбор теряет смысл (см. preflight DF1b). Schema-neutral
 * (`durability_max` уже в персисте). decay=0 отключает механику.
 */
export const REPAIR_MAX_DECAY = 1;

// Marauder flee threshold (GDD §5).
export const MARAUDER_FLEE_HP_RATIO = 0.3;
export const MARAUDER_FLEE_INITIATIVE_PENALTY = 0.05;
