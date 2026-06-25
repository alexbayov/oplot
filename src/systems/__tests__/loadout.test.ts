import { describe, expect, test } from "vitest";
import {
  allLoadoutPicks,
  buildLoadout,
  defaultLoadoutPicks,
  isLoadoutItem,
  loadoutOptions,
  summarizeLoadout,
} from "../loadout";
import type { InventoryStack } from "../../state/types";
import type { Item } from "../../types";

const item = (id: string, weight_kg: number): Item =>
  ({ id, name_ru: id, kind: "consumable", weight_kg, tier: 1 }) as unknown as Item;

const ITEMS: Record<string, Item> = {
  bandage: item("bandage", 0.1),
  medkit: item("medkit", 0.5),
  water: item("water", 1),
  scrap_metal: item("scrap_metal", 2),
};

const STASH: InventoryStack[] = [
  { item_id: "bandage", count: 5 },
  { item_id: "water", count: 3 },
  { item_id: "scrap_metal", count: 10 },
];

describe("isLoadoutItem", () => {
  test("recognises consumables, rejects materials", () => {
    expect(isLoadoutItem("bandage")).toBe(true);
    expect(isLoadoutItem("water")).toBe(true);
    expect(isLoadoutItem("scrap_metal")).toBe(false);
  });
});

describe("buildLoadout", () => {
  test("takes picked counts into backpack, leaves the rest in stash", () => {
    const r = buildLoadout(STASH, { bandage: 2, water: 1 }, ITEMS, 30);
    expect(r.backpack).toEqual([
      { item_id: "bandage", count: 2 },
      { item_id: "water", count: 1 },
    ]);
    expect(r.keptStash).toEqual([
      { item_id: "bandage", count: 3 },
      { item_id: "water", count: 2 },
      { item_id: "scrap_metal", count: 10 },
    ]);
  });

  test("clamps picks to availability and to >= 0", () => {
    const r = buildLoadout(STASH, { bandage: 99, water: -4 }, ITEMS, 30);
    expect(r.backpack).toEqual([{ item_id: "bandage", count: 5 }]);
    // water pick negative → nothing taken, full stack stays
    expect(r.keptStash.find((s) => s.item_id === "water")).toEqual({
      item_id: "water",
      count: 3,
    });
  });

  test("weight + overCap reflect the carried set against the cap", () => {
    const light = buildLoadout(STASH, { bandage: 2 }, ITEMS, 30);
    expect(light.weightKg).toBeCloseTo(0.2, 5);
    expect(light.overCap).toBe(false);

    const heavy = buildLoadout(STASH, { water: 3 }, ITEMS, 2);
    expect(heavy.weightKg).toBeCloseTo(3, 5); // 3 × 1kg
    expect(heavy.overCap).toBe(true); // 3 > cap 2
  });

  test("does not mutate the input stash", () => {
    const snapshot = JSON.parse(JSON.stringify(STASH));
    buildLoadout(STASH, { bandage: 5 }, ITEMS, 30);
    expect(STASH).toEqual(snapshot);
  });
});

describe("allLoadoutPicks (legacy auto-sweep parity)", () => {
  test("picks every eligible stack at full count, skips materials", () => {
    expect(allLoadoutPicks(STASH)).toEqual({ bandage: 5, water: 3 });
  });

  test("round-trips through buildLoadout to the old behaviour", () => {
    const r = buildLoadout(STASH, allLoadoutPicks(STASH), ITEMS, 30);
    expect(r.backpack).toEqual([
      { item_id: "bandage", count: 5 },
      { item_id: "water", count: 3 },
    ]);
    expect(r.keptStash).toEqual([{ item_id: "scrap_metal", count: 10 }]);
  });
});

describe("defaultLoadoutPicks", () => {
  test("brings up to 2 bandages, nothing else", () => {
    expect(defaultLoadoutPicks(STASH)).toEqual({ bandage: 2 });
  });

  test("caps at available bandages when fewer than 2", () => {
    expect(defaultLoadoutPicks([{ item_id: "bandage", count: 1 }])).toEqual({
      bandage: 1,
    });
  });

  test("empty when no bandages in stash", () => {
    expect(defaultLoadoutPicks([{ item_id: "water", count: 9 }])).toEqual({});
  });
});

describe("loadoutOptions", () => {
  test("returns only eligible non-empty stacks", () => {
    expect(loadoutOptions(STASH)).toEqual([
      { item_id: "bandage", count: 5 },
      { item_id: "water", count: 3 },
    ]);
  });
});

describe("summarizeLoadout", () => {
  test("renders picked eligible items by name, clamped to availability", () => {
    expect(summarizeLoadout(STASH, { bandage: 2, water: 9 }, ITEMS)).toBe(
      "bandage×2 · water×3",
    );
  });

  test("skips zero/negative picks and non-eligible materials", () => {
    expect(summarizeLoadout(STASH, { bandage: 0, scrap_metal: 5 }, ITEMS)).toBe("пусто");
  });

  test("empty picks → 'пусто'", () => {
    expect(summarizeLoadout(STASH, {}, ITEMS)).toBe("пусто");
  });
});
