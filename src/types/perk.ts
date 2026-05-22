export type PerkType = "additive" | "multiplicative" | "percentage";

export type PerkStat =
  | "hp_max"
  | "damage"
  | "weight_penalty_multiplier"
  | "loot_quantity_multiplier"
  | "crit_chance"
  | "armor_efficiency"
  | "crafting_speed_multiplier"
  | "xp_gain_multiplier";

export interface Perk {
  id: string;
  name: string;
  description: string;
  type: PerkType;
  stat: PerkStat;
  value: number;
}
