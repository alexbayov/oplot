import { describe, expect, test } from "vitest";
import { generateMobLoot, generateSortieEncounters, generateZoneLoot } from "../loot";
import { constantRng, mob, sequenceRng } from "./_helpers";
import type { Zone } from "../../types";

describe("generateMobLoot", () => {
  test("returns empty when rng never rolls below chance", () => {
    const m = mob("marauder", {
      drop_table: [
        { item_id: "cloth", chance: 0.6, count_min: 1, count_max: 2 },
      ],
    });
    const loot = generateMobLoot(m, constantRng(0.99));
    expect(loot).toEqual([]);
  });

  test("returns drops when rng always rolls 0", () => {
    const m = mob("marauder", {
      drop_table: [
        { item_id: "cloth", chance: 0.6, count_min: 1, count_max: 2 },
        { item_id: "food", chance: 0.4, count_min: 1, count_max: 1 },
      ],
    });
    // Sequence: chance-check (0=passes), count-roll (0=min), chance-check, count-roll.
    const rng = sequenceRng([0, 0, 0, 0]);
    const loot = generateMobLoot(m, rng);
    expect(loot).toEqual([
      { item_id: "cloth", count: 1 },
      { item_id: "food", count: 1 },
    ]);
  });

  test("rolls counts deterministically with seeded sequence", () => {
    const m = mob("wild_dog", {
      drop_table: [
        { item_id: "leather", chance: 1, count_min: 1, count_max: 3 },
      ],
    });
    // chance(0.0 < 1) passes, count rng 0.99 → max
    const rng = sequenceRng([0, 0.99]);
    const loot = generateMobLoot(m, rng);
    expect(loot).toEqual([{ item_id: "leather", count: 3 }]);
  });
});

describe("generateZoneLoot", () => {
  const zone: Zone = {
    id: "forest",
    name_ru: "Лес",
    level: 1,
    description_ru: "",
    resources: [],
    mobs: [],
    boss_id: null,
    unique_resources: [],
    levels: [
      {
        depth: 1,
        enemies: ["marauder", "wild_dog"],
        enemy_count: [1, 2],
        resources: ["wood", "cloth"],
        resource_count: [2, 4],
        min_player_level: 1,
      },
    ],
    unlock_condition: "",
  };

  test("returns empty when depth not found", () => {
    expect(generateZoneLoot(zone, 3, constantRng(0))).toEqual([]);
  });

  test("aggregates units from resources list", () => {
    // count = round(0 * (4-2+1)) + 2 = 2, then two picks at rng=0 → resources[0] both times.
    const rng = sequenceRng([0, 0, 0]);
    const loot = generateZoneLoot(zone, 1, rng);
    expect(loot).toEqual([{ item_id: "wood", count: 2 }]);
  });

  test("picks last resource when rng ~1", () => {
    // resource_count: rng=0 → 2; picks: rng=0.99 → last index (cloth) twice
    const rng = sequenceRng([0, 0.99, 0.99]);
    const loot = generateZoneLoot(zone, 1, rng);
    expect(loot).toEqual([{ item_id: "cloth", count: 2 }]);
  });
});

describe("generateSortieEncounters", () => {
  const zone: Zone = {
    id: "forest",
    name_ru: "Лес",
    level: 1,
    description_ru: "",
    resources: [],
    mobs: [],
    boss_id: null,
    unique_resources: [],
    levels: [
      {
        depth: 1,
        enemies: ["marauder"],
        enemy_count: [1, 2],
        resources: [],
        resource_count: [0, 0],
        min_player_level: 1,
      },
    ],
    unlock_condition: "",
  };

  test("returns one list per fight, each with enemy_count enemies", () => {
    const encounters = generateSortieEncounters(zone, 1, 2, constantRng(0));
    expect(encounters).toHaveLength(2);
    expect(encounters[0]).toEqual(["marauder"]);
    expect(encounters[1]).toEqual(["marauder"]);
  });
});
