import type { Item, Mob, Recipe } from "../../types";

// Seeded LCG used by tests to make RNG-dependent systems deterministic.
export const seededRng = (seed: number): (() => number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
};

// Always returns the same value — handy for boundary tests.
export const constantRng = (value: number): (() => number) => () => value;

// Sequence RNG — returns next value each call, loops at end.
export const sequenceRng = (values: number[]): (() => number) => {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
};

export const item = (
  id: string,
  type: Item["type"],
  weight_kg: number,
  extra: Partial<Item> = {},
): Item => {
  const base = {
    id,
    name_ru: id,
    type,
    tier: 1 as const,
    zone_origin: "test",
    weight_kg,
    description_ru: "",
    flavor_ru: "",
    recipe_id: null,
    ...extra,
  };
  if (type === "resource") {
    return { ...base, type, stats: {} };
  }
  if (type === "weapon_melee") {
    return {
      ...base,
      type,
      stats: {
        damage_min: 1,
        damage_max: 1,
        attack_speed: 100,
        noise: "low" as const,
      },
    };
  }
  if (type === "weapon_ranged") {
    return {
      ...base,
      type,
      stats: {
        damage_min: 1,
        damage_max: 1,
        attack_speed: 100,
        noise: "low" as const,
        ammo_id: "ammo_pistol",
        ammo_per_shot: 1,
      },
    };
  }
  if (type === "armor") {
    return {
      ...base,
      type,
      stats: { defense: 1 },
    };
  }
  return {
    ...base,
    type: "consumable",
    stats: {
      effect_type: "heal" as const,
      effect_value: 10,
      charges: 1,
    },
  };
};

export const mob = (id: string, overrides: Partial<Mob> = {}): Mob => ({
  id,
  name_ru: id,
  type: "human",
  role: "regular",
  zone: "forest",
  level: 1,
  hp: 10,
  damage_min: 1,
  damage_max: 1,
  defense: 0,
  base_speed: 80,
  xp_reward: 5,
  behavior: "aggressive",
  description_ru: "",
  flavor_ru: "",
  drop_table: [],
  ...overrides,
});

export const recipe = (overrides: Partial<Recipe>): Recipe => ({
  id: "r",
  result_id: "x",
  result_count: 1,
  ingredients: [],
  tier: 1,
  unlock_condition: null,
  craft_time_s: 0,
  boss_drop_ingredient: undefined,
  ...overrides,
});
