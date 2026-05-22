import { describe, expect, test } from "vitest";
import { initBossFight } from "../mobRole";
import { mob } from "./_helpers";

describe("initBossFight", () => {
  test("boss mob initializes with phase 1", () => {
    const boss = mob("warehouse_boss", {
      role: "boss",
      type: "boss",
      hp: 100,
      phase_threshold: 0.5,
    });
    const result = initBossFight(boss);
    expect(result.isBoss).toBe(true);
    expect(result.runtimeState.phase).toBe(1);
    expect(result.runtimeState.phase_transition_done).toBe(false);
  });

  test("regular mob does not trigger boss-fight init", () => {
    const regular = mob("marauder", { role: "regular" });
    const result = initBossFight(regular);
    expect(result.isBoss).toBe(false);
    expect(result.guaranteedLoot).toEqual([]);
  });

  test("boss mob guaranteed drops from drop_table chance=1.0 entries", () => {
    const boss = mob("test_boss", {
      role: "boss",
      type: "boss",
      drop_table: [
        { item_id: "boss_core", chance: 1.0, count_min: 1, count_max: 1 },
        { item_id: "scrap", chance: 0.5, count_min: 1, count_max: 2 },
      ],
    });
    const result = initBossFight(boss);
    expect(result.guaranteedLoot).toEqual([
      { item_id: "boss_core", count: 1 },
    ]);
  });
});
