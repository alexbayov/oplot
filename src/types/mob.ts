// GDD §6.2: "mech" added in M3 (forward-compat) for relic_drone.
// M1 mobs (marauder/wild_dog/mutant) and their checks are unaffected.
export type MobType = "human" | "animal" | "mutant" | "boss" | "mech";

export type MobRole = "regular" | "boss";

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
  role: MobRole;
  zone: string;
  level: number;
  hp: number;
  damage_min: number;
  damage_max: number;
  defense: number;
  base_speed: number;
  xp_reward: number;
  behavior: MobBehavior;
  behavior_id?: string;
  // M5 GDD §9: boss 2-phase fields. Regular mobs omit these.
  phase_threshold?: number;
  phase_2_behavior_id?: string;
  description_ru: string;
  flavor_ru: string;
  drop_table: DropEntry[];
}
