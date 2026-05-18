export type ItemType =
  | "resource"
  | "weapon_melee"
  | "weapon_ranged"
  | "armor"
  | "consumable";

export type ItemTier = 1 | 2 | 3 | 4 | 5;

export type NoiseLevel = "low" | "medium" | "high";

export interface ResourceStats {}

export interface WeaponMeleeStats {
  damage_min: number;
  damage_max: number;
  attack_speed: number;
  noise: NoiseLevel;
}

export interface WeaponRangedStats {
  damage_min: number;
  damage_max: number;
  attack_speed: number;
  noise: NoiseLevel;
  ammo_id: string;
  ammo_per_shot: number;
}

export interface ArmorStats {
  defense: number;
  evasion_bonus_pct?: number;
  vs_melee_bonus?: number;
}

export interface ConsumableStats {
  effect_type: "heal" | "ammo_refill";
  effect_value: number;
  charges: number;
}

export type ItemStats =
  | ResourceStats
  | WeaponMeleeStats
  | WeaponRangedStats
  | ArmorStats
  | ConsumableStats;

interface ItemBase {
  id: string;
  name_ru: string;
  type: ItemType;
  tier: ItemTier;
  zone_origin: string;
  weight_kg: number;
  description_ru: string;
  flavor_ru: string;
  recipe_id: string | null;
  stats: ItemStats;
}

export type ResourceItem = ItemBase & {
  type: "resource";
  stats: ResourceStats;
};

export type WeaponMeleeItem = ItemBase & {
  type: "weapon_melee";
  stats: WeaponMeleeStats;
};

export type WeaponRangedItem = ItemBase & {
  type: "weapon_ranged";
  stats: WeaponRangedStats;
};

export type ArmorItem = ItemBase & {
  type: "armor";
  stats: ArmorStats;
};

export type ConsumableItem = ItemBase & {
  type: "consumable";
  stats: ConsumableStats;
};

export type Item =
  | ResourceItem
  | WeaponMeleeItem
  | WeaponRangedItem
  | ArmorItem
  | ConsumableItem;
