import { describe, expect, test, vi } from "vitest";
import { softWarnCounts, validateRecipeRefs } from "../dataValidation";
import { item, recipe } from "./_helpers";
import type { ContentData } from "../../state/types";

describe("dataValidation", () => {
  test("softWarnCounts warns when counts mismatch", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const data: ContentData = {
      items: {},
      mobs: {},
      recipes: {},
      zones: {},
      radioSignals: [],
      perks: [],
    };
    softWarnCounts(data, { zones: 9, items: 187, recipes: 71, mobs: 11, sfx: 10 });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test("validateRecipeRefs resolves valid references", () => {
    const data: ContentData = {
      items: { wood: item("wood", "resource", 2) },
      mobs: {},
      recipes: {
        r1: recipe({ id: "r1", result_id: "wood", ingredients: [{ item_id: "wood", count: 1 }] }),
      },
      zones: {},
      radioSignals: [],
      perks: [],
    };
    expect(validateRecipeRefs(data)).toEqual([]);
  });

  test("validateRecipeRefs flags missing result and ingredients", () => {
    const data: ContentData = {
      items: {},
      mobs: {},
      recipes: {
        r1: recipe({ id: "r1", result_id: "missing", ingredients: [{ item_id: "missing", count: 1 }] }),
      },
      zones: {},
      radioSignals: [],
      perks: [],
    };
    const issues = validateRecipeRefs(data);
    expect(issues.length).toBeGreaterThanOrEqual(2);
    expect(issues.some((i) => i.includes("result_id"))).toBe(true);
    expect(issues.some((i) => i.includes("ingredient"))).toBe(true);
  });
});
