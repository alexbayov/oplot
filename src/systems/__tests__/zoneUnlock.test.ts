import { describe, expect, test, vi } from "vitest";
import {
  applySortieCompletion,
  describeUnlockCondition,
  evaluateUnlockCondition,
} from "../zoneUnlock";
import type { GameProgress } from "../../state/types";
import type { Zone } from "../../types";

const emptyProgress = (): GameProgress => ({
  forest_depth_2_completed: false,
  any_warehouse_sortie_completed: false,
  any_forest_sortie_completed: false,
  suburbs_sortie_completed: false,
  warehouse_boss_defeated: false,
  factory_sortie_completed: false,
  city_boss_defeated: false,
  metro_sortie_completed: false,
  daily_completed: {},
  radio_trust: 0,
});

const zone = (id: string, opts: Partial<Zone> = {}): Zone => ({
  id,
  name_ru: id,
  level: 1,
  description_ru: "",
  resources: [],
  mobs: [],
  boss_id: null,
  unique_resources: [],
  levels: [],
  unlock_condition: "start",
  ...opts,
});

describe("evaluateUnlockCondition", () => {
  test('"start" is always unlocked (forest baseline)', () => {
    expect(evaluateUnlockCondition("start", emptyProgress())).toBe(true);
  });

  test("warehouse: locked until forest depth 2 completed", () => {
    const p = emptyProgress();
    expect(evaluateUnlockCondition("forest_depth_2_completed", p)).toBe(false);
    p.forest_depth_2_completed = true;
    expect(evaluateUnlockCondition("forest_depth_2_completed", p)).toBe(true);
  });

  test("city: locked until any warehouse sortie completed", () => {
    const p = emptyProgress();
    expect(evaluateUnlockCondition("any_warehouse_sortie_completed", p)).toBe(false);
    p.any_warehouse_sortie_completed = true;
    expect(evaluateUnlockCondition("any_warehouse_sortie_completed", p)).toBe(true);
  });

  test("unknown condition string → locked + console.warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(evaluateUnlockCondition("future_quest_done", emptyProgress())).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe("describeUnlockCondition", () => {
  test("returns a Russian phrase for known conditions", () => {
    expect(describeUnlockCondition("start")).toContain("начала");
    expect(describeUnlockCondition("forest_depth_2_completed")).toContain("Лес");
    expect(describeUnlockCondition("any_warehouse_sortie_completed")).toContain("Склад");
  });

  test("falls back to the raw condition string when unknown", () => {
    expect(describeUnlockCondition("future_quest_done")).toBe("future_quest_done");
  });
});

describe("applySortieCompletion", () => {
  test("forest depth 2 victory → flips forest_depth_2_completed (immutable)", () => {
    const before = emptyProgress();
    const after = applySortieCompletion(before, zone("forest"), 2, true);
    expect(after.forest_depth_2_completed).toBe(true);
    expect(after.any_warehouse_sortie_completed).toBe(false);
    expect(before.forest_depth_2_completed).toBe(false); // immutability
  });

  test("forest depth 1/3 victory → no forest_depth_2_completed flip", () => {
    expect(
      applySortieCompletion(emptyProgress(), zone("forest"), 1, true).forest_depth_2_completed,
    ).toBe(false);
    expect(
      applySortieCompletion(emptyProgress(), zone("forest"), 3, true).forest_depth_2_completed,
    ).toBe(false);
  });

  test("forest depth 2 defeat → no flag flip", () => {
    const after = applySortieCompletion(emptyProgress(), zone("forest"), 2, false);
    expect(after.forest_depth_2_completed).toBe(false);
  });

  test("warehouse depth 1 victory → flips any_warehouse_sortie_completed", () => {
    const after = applySortieCompletion(emptyProgress(), zone("warehouse"), 1, true);
    expect(after.any_warehouse_sortie_completed).toBe(true);
  });

  test("city victory does not retroactively flip warehouse/forest flags", () => {
    const after = applySortieCompletion(emptyProgress(), zone("city"), 3, true);
    expect(after.forest_depth_2_completed).toBe(false);
    expect(after.any_warehouse_sortie_completed).toBe(false);
  });
});

describe("extended unlock flags (M3+)", () => {
  const conditions = [
    "any_forest_sortie_completed",
    "suburbs_sortie_completed",
    "warehouse_boss_defeated",
    "factory_sortie_completed",
    "city_boss_defeated",
    "metro_sortie_completed",
  ] as const;

  test("each new condition has a human-readable description (no underscores)", () => {
    for (const c of conditions) {
      const desc = describeUnlockCondition(c);
      expect(desc).not.toBe(c); // not the raw ID
      expect(desc).not.toMatch(/_/);
      expect(desc.length).toBeGreaterThan(5);
    }
  });

  test("each new condition is correctly read from progress flags", () => {
    const p = emptyProgress();
    for (const c of conditions) {
      expect(evaluateUnlockCondition(c, p)).toBe(false);
    }
    const all: GameProgress = {
      ...p,
      any_forest_sortie_completed: true,
      suburbs_sortie_completed: true,
      warehouse_boss_defeated: true,
      factory_sortie_completed: true,
      city_boss_defeated: true,
      metro_sortie_completed: true,
    };
    for (const c of conditions) {
      expect(evaluateUnlockCondition(c, all)).toBe(true);
    }
  });

  test("forest victory at any depth → any_forest_sortie_completed", () => {
    for (const d of [1, 2, 3] as const) {
      const after = applySortieCompletion(emptyProgress(), zone("forest"), d, true);
      expect(after.any_forest_sortie_completed).toBe(true);
    }
  });

  test("warehouse depth 3 victory with boss_id → warehouse_boss_defeated", () => {
    const after = applySortieCompletion(
      emptyProgress(),
      zone("warehouse", { boss_id: "warehouse_drone_prime" }),
      3,
      true,
    );
    expect(after.warehouse_boss_defeated).toBe(true);
    expect(after.any_warehouse_sortie_completed).toBe(true);
  });

  test("warehouse depth 1/2 victory → no boss flag", () => {
    for (const d of [1, 2] as const) {
      const after = applySortieCompletion(
        emptyProgress(),
        zone("warehouse", { boss_id: "warehouse_drone_prime" }),
        d,
        true,
      );
      expect(after.warehouse_boss_defeated).toBe(false);
      expect(after.any_warehouse_sortie_completed).toBe(true);
    }
  });

  test("warehouse depth 3 without boss_id → no boss flag", () => {
    const after = applySortieCompletion(emptyProgress(), zone("warehouse"), 3, true);
    expect(after.warehouse_boss_defeated).toBe(false);
  });

  test("city depth 3 with boss_id → city_boss_defeated", () => {
    const after = applySortieCompletion(
      emptyProgress(),
      zone("city", { boss_id: "city_guard_captain" }),
      3,
      true,
    );
    expect(after.city_boss_defeated).toBe(true);
  });

  test("suburbs/factory/metro victory → respective sortie flag", () => {
    const sub = applySortieCompletion(emptyProgress(), zone("suburbs"), 1, true);
    expect(sub.suburbs_sortie_completed).toBe(true);
    const fac = applySortieCompletion(emptyProgress(), zone("factory"), 2, true);
    expect(fac.factory_sortie_completed).toBe(true);
    const met = applySortieCompletion(emptyProgress(), zone("metro"), 3, true);
    expect(met.metro_sortie_completed).toBe(true);
  });

  test("defeat in any extended zone → no flag flipped", () => {
    const zones = ["forest", "warehouse", "suburbs", "city", "factory", "metro"];
    for (const id of zones) {
      const after = applySortieCompletion(
        emptyProgress(),
        zone(id, { boss_id: "x" }),
        3,
        false,
      );
      expect(after).toEqual(emptyProgress());
    }
  });
});
