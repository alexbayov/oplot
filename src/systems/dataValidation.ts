import type { ContentData } from "../state/types";
import type { Zone } from "../types";
import { zonesFileSchema } from "./zoneSchema";

export interface CountExpectations {
  zones: number;
  items: number;
  recipes: number;
  mobs: number;
  sfx: number;
}

export const M7_EXPECTED: CountExpectations = {
  // M13 PR-2: zones ужаты с 9 до 3 (forest/warehouse/factory). Остальные 6 —
  // в docs/redesign/archive/m14-zones.md до M14.
  zones: 3,
  items: 187,
  recipes: 71,
  mobs: 11,
  sfx: 10,
};

export const softWarnCounts = (
  data: ContentData,
  expected: CountExpectations = M7_EXPECTED,
): void => {
  if (!import.meta.env.DEV) return;
  const itemsCount = Object.keys(data.items).length;
  const mobsCount = Object.keys(data.mobs).length;
  const recipesCount = Object.keys(data.recipes).length;
  const zonesCount = Object.keys(data.zones).length;

  const issues: string[] = [];
  if (zonesCount !== expected.zones) {
    issues.push(`zones=${zonesCount} (expected ${expected.zones})`);
  }
  if (itemsCount !== expected.items) {
    issues.push(`items=${itemsCount} (expected ${expected.items})`);
  }
  if (recipesCount !== expected.recipes) {
    issues.push(`recipes=${recipesCount} (expected ${expected.recipes})`);
  }
  if (mobsCount !== expected.mobs) {
    issues.push(`mobs=${mobsCount} (expected ${expected.mobs})`);
  }
  if (issues.length > 0) {
    console.warn(
      `[dataValidation] Content count mismatch (soft): ${issues.join(", ")}`,
    );
  }
};

export const validateZoneShapes = (zones: Zone[]): string[] => {
  const result = zonesFileSchema.safeParse(zones);
  if (result.success) return [];
  return result.error.issues.map(
    (i) => `${i.path.join(".") || "<root>"}: ${i.message}`,
  );
};

export const validateRecipeRefs = (data: ContentData): string[] => {
  const issues: string[] = [];
  for (const recipe of Object.values(data.recipes)) {
    if (!data.items[recipe.result_id]) {
      issues.push(`Recipe ${recipe.id} result_id ${recipe.result_id} missing`);
    }
    for (const ing of recipe.ingredients) {
      if (!data.items[ing.item_id]) {
        issues.push(
          `Recipe ${recipe.id} ingredient ${ing.item_id} missing`,
        );
      }
    }
    if (recipe.boss_drop_ingredient && !data.items[recipe.boss_drop_ingredient]) {
      issues.push(
        `Recipe ${recipe.id} boss_drop_ingredient ${recipe.boss_drop_ingredient} missing`,
      );
    }
  }
  return issues;
};
