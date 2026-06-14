import type { Item, ItemKind, Mob, Recipe } from "../../types";

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

// M13 test factory: строит Item per kind с дефолтными stats. До PR-5
// принимал legacy `type` ("weapon_melee"/"weapon_ranged"/"armor"/...) и
// собирал legacy stats; теперь kind-discriminator + сужённые stats.
// Все потребители (sortie тесты, craft тесты) пользуются дефолтами
// либо переопределяют их через `extra`.
const base = (id: string, weight_kg: number) => ({
  id,
  name_ru: id,
  tier: 1 as const,
  zone_origin: "test",
  weight_kg,
  description_ru: "",
  flavor_ru: "",
  recipe_id: null,
});

export const item = (
  id: string,
  kind: ItemKind,
  weight_kg: number,
  extra: Record<string, unknown> = {},
): Item => {
  const b = base(id, weight_kg);
  switch (kind) {
    case "material":
      return { ...b, kind, stats: {}, ...extra } as Item;
    case "component":
      return { ...b, kind, fits: "weapon", stats: {}, ...extra } as Item;
    case "weapon":
      return {
        ...b,
        kind,
        slot: "action",
        stats: { damage_min: 1, damage_max: 1 },
        ...extra,
      } as Item;
    case "armor":
      return {
        ...b,
        kind,
        slot: "plate",
        stats: { armor_value: 1 },
        ...extra,
      } as Item;
    case "consumable":
      return {
        ...b,
        kind,
        stats: { effect_type: "heal", effect_value: 10, charges: 1 },
        ...extra,
      } as Item;
    case "tool":
      return { ...b, kind, stats: { tool_type: "test" }, ...extra } as Item;
  }
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
