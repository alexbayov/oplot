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
  // GDD §6.2 / §5.4.6: optional unique AI pattern id. M1 mobs omit this and fall
  // back to chooseMobAction by `id`. M3 mobs set one of the §5.4.6 enum strings.
  behavior_id?: string;
  description_ru: string;
  flavor_ru: string;
  drop_table: DropEntry[];
}
