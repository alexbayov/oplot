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
  daily_completed: {},
});

const zone = (id: string): Zone => ({
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
  test("forest depth 2 victory → flips forest_depth_2_completed", () => {
    const before = emptyProgress();
    const after = applySortieCompletion(before, zone("forest"), 2, true);
    expect(after.forest_depth_2_completed).toBe(true);
    expect(after.any_warehouse_sortie_completed).toBe(false);
    expect(before.forest_depth_2_completed).toBe(false); // immutability
  });

  test("forest depth 1/3 victory → no flag flip", () => {
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

  test("any warehouse victory → flips any_warehouse_sortie_completed", () => {
    const after = applySortieCompletion(emptyProgress(), zone("warehouse"), 1, true);
    expect(after.any_warehouse_sortie_completed).toBe(true);
  });

  test("city victory does not retroactively flip warehouse/forest flags", () => {
    const after = applySortieCompletion(emptyProgress(), zone("city"), 3, true);
    expect(after.forest_depth_2_completed).toBe(false);
    expect(after.any_warehouse_sortie_completed).toBe(false);
  });
});
