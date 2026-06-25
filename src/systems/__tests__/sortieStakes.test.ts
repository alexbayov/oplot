import { describe, expect, test } from "vitest";
import { formatGoalRisk, survivesKnockout } from "../sortieStakes";
import { LOOT_LOSS_ON_DEFEAT } from "../../state/balance";
import { SORTIE_GOALS } from "../sortieResolve";
import type { InventoryStack } from "../../state/types";

describe("survivesKnockout", () => {
  test("keeps the (1 - LOOT_LOSS_ON_DEFEAT) share, floored", () => {
    // sanity: this test assumes the default 0.5 split
    expect(LOOT_LOSS_ON_DEFEAT).toBe(0.5);
    const stacks: InventoryStack[] = [
      { item_id: "scrap_metal", count: 4 },
      { item_id: "water", count: 3 }, // floor(1.5) = 1
    ];
    expect(survivesKnockout(stacks)).toEqual([
      { item_id: "scrap_metal", count: 2 },
      { item_id: "water", count: 1 },
    ]);
  });

  test("drops stacks that floor to zero", () => {
    expect(survivesKnockout([{ item_id: "bandage", count: 1 }])).toEqual([]);
  });

  test("empty input → empty output, input not mutated", () => {
    const input: InventoryStack[] = [{ item_id: "fuel", count: 2 }];
    const snapshot = JSON.parse(JSON.stringify(input));
    survivesKnockout(input);
    expect(input).toEqual(snapshot);
  });
});

describe("formatGoalRisk", () => {
  test("shows hp and loot modifiers for a plain goal", () => {
    expect(formatGoalRisk(SORTIE_GOALS.quiet)).toBe("Урон ×0.75 · Лут ×0.85");
  });

  test("greedy reads as higher risk and reward", () => {
    expect(formatGoalRisk(SORTIE_GOALS.greedy)).toBe("Урон ×1.25 · Лут ×1.3");
  });

  test("targeted goal appends a localized bias", () => {
    expect(formatGoalRisk(SORTIE_GOALS.targeted_metal)).toBe(
      "Урон ×1 · Лут ×0.9 · уклон: металл",
    );
  });
});
