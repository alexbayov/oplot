import {
  COVER_DEFENSE_BONUS_PCT,
  DAMAGE_ROLL_MAX,
  DAMAGE_ROLL_MIN,
  MARAUDER_FLEE_HP_RATIO,
  MIN_DAMAGE_FLOOR,
  WEIGHT_INITIATIVE_PENALTY,
} from "../state/balance";
import type {
  ArmorStats,
  Item,
  Mob,
  MobType,
  WeaponMeleeStats,
  WeaponRangedStats,
} from "../types";

export type Rng = () => number;

const defaultRng: Rng = Math.random;

// Returns a number in [a, b] (inclusive), matching GDD's random_uniform semantics.
export const randomUniform = (a: number, b: number, rng: Rng = defaultRng): number =>
  a + (b - a) * rng();

// First roll: weapon's flat damage roll. Used by both hero and mobs.
export const rollWeaponDamage = (
  damage_min: number,
  damage_max: number,
  rng: Rng = defaultRng,
): number => randomUniform(damage_min, damage_max, rng);

// Second roll: common spread, multiplies the weapon roll.
export const rollDamageMultiplier = (rng: Rng = defaultRng): number =>
  randomUniform(DAMAGE_ROLL_MIN, DAMAGE_ROLL_MAX, rng);

// initiative_hero = base_speed - (cur_weight / max_weight) * 50; overweight -> 0
// initiative_mob  = mob.base_speed
export const calcHeroInitiative = (
  baseSpeed: number,
  curWeight: number,
  maxWeight: number,
): number => {
  if (curWeight > maxWeight) return 0;
  if (maxWeight <= 0) return baseSpeed;
  return baseSpeed - (curWeight / maxWeight) * WEIGHT_INITIATIVE_PENALTY;
};

// Defense against an incoming attack. coverActive adds +50% of armor.defense.
// vs_melee_bonus applies only if attacker is "animal" (GDD §6 / balance.md §Брони);
// M3 "mech" (relic_drone) is ranged + non-animal so the bonus never triggers (§5.4.5).
export const calcDefenseAgainst = (
  armor: ArmorStats | null,
  attackerType: MobType,
  coverActive: boolean,
): number => {
  if (!armor) return 0;
  let base = armor.defense;
  if (attackerType === "animal" && armor.vs_melee_bonus) {
    base += armor.vs_melee_bonus;
  }
  if (coverActive) {
    base += armor.defense * COVER_DEFENSE_BONUS_PCT;
  }
  return base;
};

export const calcFinalDamage = (
  weaponRoll: number,
  multiplier: number,
  defense: number,
): number => Math.max(MIN_DAMAGE_FLOOR, weaponRoll * multiplier - defense);

export interface AttackResult {
  damage_dealt: number;
  defender_hp_after: number;
  floored: boolean;
}

// Pure attack resolution: roll → apply roll → subtract defense → floor.
export const applyAttack = (
  weapon: WeaponMeleeStats | WeaponRangedStats | { damage_min: number; damage_max: number },
  defenseValue: number,
  defenderHp: number,
  rng: Rng = defaultRng,
): AttackResult => {
  const base = rollWeaponDamage(weapon.damage_min, weapon.damage_max, rng);
  const mul = rollDamageMultiplier(rng);
  const raw = base * mul - defenseValue;
  const damage = Math.max(MIN_DAMAGE_FLOOR, raw);
  return {
    damage_dealt: damage,
    defender_hp_after: Math.max(0, defenderHp - damage),
    floored: raw < MIN_DAMAGE_FLOOR,
  };
};

export interface MobAction {
  type: "attack" | "flee";
}

// AI per GDD §5: marauder flees at <30% HP, others always attack.
export const chooseMobAction = (mob: Mob, currentHp: number): MobAction => {
  if (mob.id === "marauder" && currentHp / mob.hp < MARAUDER_FLEE_HP_RATIO) {
    return { type: "flee" };
  }
  return { type: "attack" };
};

// Helper to read item-type-narrowed weapon stats off Item without `any`.
export const getMeleeWeaponStats = (item: Item): WeaponMeleeStats | null =>
  item.type === "weapon_melee" ? item.stats : null;

export const getRangedWeaponStats = (item: Item): WeaponRangedStats | null =>
  item.type === "weapon_ranged" ? item.stats : null;

export const getArmorStats = (item: Item): ArmorStats | null =>
  item.type === "armor" ? item.stats : null;
