import type { Perk } from "../types";

export interface PerkModifierResult {
  hp_max_additive: number;
  damage_multiplier: number;
  weight_penalty_multiplier: number;
  loot_quantity_multiplier: number;
  crit_chance_additive: number;
  armor_efficiency_multiplier: number;
  crafting_speed_multiplier: number;
  xp_gain_multiplier: number;
}

const DEFAULT_MODIFIERS: PerkModifierResult = {
  hp_max_additive: 0,
  damage_multiplier: 1.0,
  weight_penalty_multiplier: 1.0,
  loot_quantity_multiplier: 1.0,
  crit_chance_additive: 0,
  armor_efficiency_multiplier: 1.0,
  crafting_speed_multiplier: 1.0,
  xp_gain_multiplier: 1.0,
};

export const computePerkModifiers = (perks: Perk[]): PerkModifierResult => {
  const result = { ...DEFAULT_MODIFIERS };
  for (const perk of perks) {
    switch (perk.stat) {
      case "hp_max":
        if (perk.type === "additive") result.hp_max_additive += perk.value;
        break;
      case "damage":
        if (perk.type === "multiplicative") result.damage_multiplier *= perk.value;
        break;
      case "weight_penalty_multiplier":
        if (perk.type === "multiplicative") result.weight_penalty_multiplier *= perk.value;
        break;
      case "loot_quantity_multiplier":
        if (perk.type === "multiplicative") result.loot_quantity_multiplier *= perk.value;
        break;
      case "crit_chance":
        if (perk.type === "additive") result.crit_chance_additive += perk.value;
        break;
      case "armor_efficiency":
        if (perk.type === "multiplicative") result.armor_efficiency_multiplier *= perk.value;
        break;
      case "crafting_speed_multiplier":
        if (perk.type === "multiplicative") result.crafting_speed_multiplier *= perk.value;
        break;
      case "xp_gain_multiplier":
        if (perk.type === "multiplicative") result.xp_gain_multiplier *= perk.value;
        break;
    }
  }
  return result;
};

export const hasPerk = (perks: Perk[], perkId: string): boolean =>
  perks.some((p) => p.id === perkId);

export const pickRandomPerks = (
  allPerks: Perk[],
  ownedPerks: Perk[],
  count: number,
  rng: () => number = Math.random,
): Perk[] => {
  const ownedIds = new Set(ownedPerks.map((p) => p.id));
  const available = allPerks.filter((p) => !ownedIds.has(p.id));
  if (available.length === 0) return [];
  const shuffled = [...available].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};
