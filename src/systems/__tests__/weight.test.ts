import { describe, expect, test } from "vitest";
import { applyLootLoss, canAddItem, computeWeight } from "../weight";
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
      item("wood", "resource", 2),
      item("cloth", "resource", 1),
    );
    const inventory = [
      { item_id: "wood", count: 3 },
      { item_id: "cloth", count: 4 },
    ];
    expect(computeWeight(inventory, items)).toBe(3 * 2 + 4 * 1);
  });

  test("skips unknown item_ids", () => {
    const items = idx(item("wood", "resource", 2));
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
  const items = idx(item("wood", "resource", 2));

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

describe("applyLootLoss", () => {
  test("matches GDD example: wood 3x2kg + cloth 4x1kg → cloth 4 remains", () => {
    const items = idx(
      item("wood", "resource", 2),
      item("cloth", "resource", 1),
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
      item("a", "resource", 5),
      item("b", "resource", 3),
      item("c", "resource", 1),
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
      item("a", "resource", 1),
      item("b", "resource", 1),
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
