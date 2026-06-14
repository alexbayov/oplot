import { describe, expect, test } from "vitest";
import {
  BASE_RETURN_TIME_S,
  HERO_MAX_WEIGHT_KG,
  WEIGHT_PENALTY_FACTOR,
} from "../../state/balance";
import {
  applyLootLoss,
  canAddItem,
  computeReturnTime,
  computeWeight,
} from "../weight";
import { item } from "./_helpers";
import type { Item } from "../../types";

const idx = (...items: Item[]): Record<string, Item> => {
  const out: Record<string, Item> = {};
  for (const it of items) out[it.id] = it;
  return out;
};

describe("computeWeight", () => {
  test("returns 0 for empty inventory", () => {
    expect(computeWeight([], idx())).toBe(0);
  });

  test("sums count * weight_kg per stack", () => {
    const items = idx(
      item("wood", "material", 2),
      item("cloth", "material", 1),
    );
    const inventory = [
      { item_id: "wood", count: 3 },
      { item_id: "cloth", count: 4 },
    ];
    expect(computeWeight(inventory, items)).toBe(3 * 2 + 4 * 1);
  });

  test("skips unknown item_ids", () => {
    const items = idx(item("wood", "material", 2));
    expect(
      computeWeight(
        [
          { item_id: "wood", count: 1 },
          { item_id: "ghost", count: 99 },
        ],
        items,
      ),
    ).toBe(2);
  });
});

describe("canAddItem", () => {
  const items = idx(item("wood", "material", 2));

  test("true when fits exactly", () => {
    expect(canAddItem(28, "wood", 1, 30, items)).toBe(true);
  });

  test("false when exceeds max_weight", () => {
    expect(canAddItem(29, "wood", 1, 30, items)).toBe(false);
  });

  test("false for unknown item_id", () => {
    expect(canAddItem(0, "ghost", 1, 30, items)).toBe(false);
  });

  test("handles count > 1", () => {
    expect(canAddItem(0, "wood", 15, 30, items)).toBe(true);
    expect(canAddItem(0, "wood", 16, 30, items)).toBe(false);
  });
});

describe("computeReturnTime", () => {
  // balance.md §Формулы:
  // return_time_s = BASE_RETURN_TIME_S * (1 + (cur/max) * WEIGHT_PENALTY_FACTOR).
  // With defaults BASE_RETURN_TIME_S=30, WEIGHT_PENALTY_FACTOR=1.0, HERO_MAX_WEIGHT_KG=30.
  test("zero weight → base return time (30s)", () => {
    expect(computeReturnTime(0, HERO_MAX_WEIGHT_KG)).toBe(BASE_RETURN_TIME_S);
  });

  test("half weight (15/30) → 45s", () => {
    // 30 * (1 + 0.5 * 1.0) = 45.
    expect(computeReturnTime(15, HERO_MAX_WEIGHT_KG)).toBe(
      BASE_RETURN_TIME_S * (1 + 0.5 * WEIGHT_PENALTY_FACTOR),
    );
    expect(computeReturnTime(15, HERO_MAX_WEIGHT_KG)).toBe(45);
  });

  test("full weight (30/30) → 60s", () => {
    // 30 * (1 + 1.0 * 1.0) = 60.
    expect(computeReturnTime(30, HERO_MAX_WEIGHT_KG)).toBe(
      BASE_RETURN_TIME_S * (1 + 1.0 * WEIGHT_PENALTY_FACTOR),
    );
    expect(computeReturnTime(30, HERO_MAX_WEIGHT_KG)).toBe(60);
  });

  // M3 GDD §6.4.M3.4 / balance.md §M3: warehouse=1.2, city=1.5, forest default=1.0.
  test("default multiplier (1.0) matches no-arg call (forest backward-compat)", () => {
    expect(computeReturnTime(0, HERO_MAX_WEIGHT_KG, 1.0)).toBe(
      computeReturnTime(0, HERO_MAX_WEIGHT_KG),
    );
    expect(computeReturnTime(15, HERO_MAX_WEIGHT_KG, 1.0)).toBe(
      computeReturnTime(15, HERO_MAX_WEIGHT_KG),
    );
  });

  test("warehouse multiplier 1.2: zero weight → 36s, half → 54s", () => {
    expect(computeReturnTime(0, HERO_MAX_WEIGHT_KG, 1.2)).toBe(BASE_RETURN_TIME_S * 1.2);
    expect(computeReturnTime(15, HERO_MAX_WEIGHT_KG, 1.2)).toBeCloseTo(
      BASE_RETURN_TIME_S * 1.2 * (1 + 0.5 * WEIGHT_PENALTY_FACTOR),
    );
  });

  test("city multiplier 1.5: zero weight → 45s, full → 90s", () => {
    expect(computeReturnTime(0, HERO_MAX_WEIGHT_KG, 1.5)).toBe(BASE_RETURN_TIME_S * 1.5);
    expect(computeReturnTime(30, HERO_MAX_WEIGHT_KG, 1.5)).toBe(
      BASE_RETURN_TIME_S * 1.5 * (1 + 1.0 * WEIGHT_PENALTY_FACTOR),
    );
  });

  test("maxWeight ≤ 0 edge case still respects multiplier", () => {
    expect(computeReturnTime(0, 0, 1.5)).toBe(BASE_RETURN_TIME_S * 1.5);
    expect(computeReturnTime(0, -1, 1.2)).toBe(BASE_RETURN_TIME_S * 1.2);
  });
});

describe("applyLootLoss", () => {
  test("matches GDD example: wood 3x2kg + cloth 4x1kg → cloth 4 remains", () => {
    const items = idx(
      item("wood", "material", 2),
      item("cloth", "material", 1),
    );
    const inventory = [
      { item_id: "wood", count: 3 },
      { item_id: "cloth", count: 4 },
    ];
    const after = applyLootLoss(inventory, items);
    expect(after).toEqual([{ item_id: "cloth", count: 4 }]);
  });

  test("returns empty when inventory empty", () => {
    expect(applyLootLoss([], idx())).toEqual([]);
  });

  test("drops at least half of weight; remaining weight < total", () => {
    const items = idx(
      item("a", "material", 5),
      item("b", "material", 3),
      item("c", "material", 1),
    );
    const inventory = [
      { item_id: "a", count: 2 },
      { item_id: "b", count: 3 },
      { item_id: "c", count: 5 },
    ];
    const total = computeWeight(inventory, items);
    const after = applyLootLoss(inventory, items);
    const remaining = computeWeight(after, items);
    expect(total - remaining).toBeGreaterThanOrEqual(total * 0.5);
    expect(remaining).toBeLessThan(total);
  });

  test("uniform-weight items: drops first half deterministically by id order", () => {
    const items = idx(
      item("a", "material", 1),
      item("b", "material", 1),
    );
    const inventory = [
      { item_id: "a", count: 4 },
      { item_id: "b", count: 4 },
    ];
    const after = applyLootLoss(inventory, items);
    // total 8, target 4. tied weight → alphabetical (a before b), drops 4× "a".
    expect(after).toEqual([{ item_id: "b", count: 4 }]);
  });
});
