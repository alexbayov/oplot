import { describe, expect, test } from "vitest";
import { applyCraft, canCraft, formatMissing } from "../craft";
import { item, recipe } from "./_helpers";
import type { Item } from "../../types";

const items = ((): Record<string, Item> => {
  const arr = [
    item("wood", "resource", 1),
    item("cloth", "resource", 0.5),
    item("scrap", "resource", 0.5),
    item("gunpowder", "resource", 0.5),
    item("pistol", "weapon_ranged", 1.5),
  ];
  const out: Record<string, Item> = {};
  for (const it of arr) out[it.id] = it;
  return out;
})();

const bandageRecipe = recipe({
  id: "recipe_bandage",
  result_id: "bandage",
  result_count: 1,
  ingredients: [{ item_id: "cloth", count: 2 }],
});

const pistolRecipe = recipe({
  id: "recipe_pistol",
  result_id: "pistol",
  result_count: 1,
  ingredients: [
    { item_id: "wood", count: 2 },
    { item_id: "scrap", count: 3 },
    { item_id: "gunpowder", count: 1 },
  ],
});

describe("canCraft", () => {
  test("happy path returns ok and empty missing", () => {
    const stash = [{ item_id: "cloth", count: 2 }];
    const result = canCraft(bandageRecipe, stash);
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test("missing one ingredient — fewer than required", () => {
    const stash = [{ item_id: "cloth", count: 1 }];
    const result = canCraft(bandageRecipe, stash);
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([
      { item_id: "cloth", need: 2, have: 1 },
    ]);
  });

  test("missing one of three ingredients (wood absent)", () => {
    const stash = [
      { item_id: "scrap", count: 3 },
      { item_id: "gunpowder", count: 1 },
    ];
    const result = canCraft(pistolRecipe, stash);
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([
      { item_id: "wood", need: 2, have: 0 },
    ]);
  });

  test("missing one of three (scrap insufficient)", () => {
    const stash = [
      { item_id: "wood", count: 2 },
      { item_id: "scrap", count: 1 },
      { item_id: "gunpowder", count: 1 },
    ];
    const result = canCraft(pistolRecipe, stash);
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([
      { item_id: "scrap", need: 3, have: 1 },
    ]);
  });

  test("missing multiple ingredients", () => {
    const stash = [{ item_id: "wood", count: 1 }];
    const result = canCraft(pistolRecipe, stash);
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([
      { item_id: "wood", need: 2, have: 1 },
      { item_id: "scrap", need: 3, have: 0 },
      { item_id: "gunpowder", need: 1, have: 0 },
    ]);
  });
});

describe("applyCraft", () => {
  test("removes ingredients, adds result", () => {
    const stash = [{ item_id: "cloth", count: 5 }];
    const result = applyCraft(bandageRecipe, stash);
    expect(result.inventory).toEqual([
      { item_id: "cloth", count: 3 },
      { item_id: "bandage", count: 1 },
    ]);
  });

  test("stacks onto existing result", () => {
    const stash = [
      { item_id: "cloth", count: 4 },
      { item_id: "bandage", count: 2 },
    ];
    const result = applyCraft(bandageRecipe, stash);
    expect(result.inventory).toEqual([
      { item_id: "cloth", count: 2 },
      { item_id: "bandage", count: 3 },
    ]);
  });

  test("throws when not craftable", () => {
    const stash = [{ item_id: "cloth", count: 1 }];
    expect(() => applyCraft(bandageRecipe, stash)).toThrow(
      /Cannot craft/,
    );
  });
});

describe("formatMissing", () => {
  test("formats with russian names from items map", () => {
    const itemsLocal: Record<string, Item> = {
      wood: { ...items.wood, name_ru: "Древесина" },
    };
    expect(
      formatMissing([{ item_id: "wood", need: 2, have: 0 }], itemsLocal),
    ).toBe("Древесина 0/2");
  });

  test("falls back to item_id when not in items map", () => {
    expect(
      formatMissing([{ item_id: "ghost", need: 1, have: 0 }], {}),
    ).toBe("ghost 0/1");
  });
});
