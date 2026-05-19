export type MobType = "human" | "animal" | "mutant" | "boss";

export type MobBehavior = "aggressive" | "defensive" | "passive" | "ambush";

export interface DropEntry {
  item_id: string;
  chance: number;
  count_min?: number;
  count_max?: number;
}

export interface Mob {
  id: string;
  name_ru: string;
  type: MobType;
  zone: string;
  level: number;
  hp: number;
  damage_min: number;
  damage_max: number;
  defense: number;
  base_speed: number;
  xp_reward: number;
  behavior: MobBehavior;
  description_ru: string;
  flavor_ru: string;
  drop_table: DropEntry[];
}
