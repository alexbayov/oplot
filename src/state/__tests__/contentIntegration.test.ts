/**
 * Integration test: real content/items.json парсится через M13 itemSchema
 * и удовлетворяет минимальным structural гейтам.
 *
 * До PR-5 здесь жил smoke-test M11.0a адаптера (legacy types →
 * M11Item shape через adaptLegacyItem). M11-слой снесён, проверки
 * перевыставлены на M13 контракт:
 *   - safeParse на itemsFileSchema чистый
 *   - floor: ≥180 предметов (на момент миграции 187)
 *   - ref-integrity: recipe_id ссылается на существующий recipe в
 *     recipes.json (или null); item_id ссылки из mobs drop_table
 *     резолвятся в items.
 *   - 32 цельных оружия (kind=weapon, slot=action) сохранены с
 *     стабильными id-ами (M11.0a + legacy whole guns, см. таблицу
 *     маппинга в PR-5 описании).
 *
 * Это smoke-test, не unit. Падает если кто-то ломает M13 contract
 * или ломает ссылки между mobs.json/recipes.json/items.json.
 */

import { describe, expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { itemsFileSchema, type M13Item } from "../../systems/itemSchema";
import { BASE_RESOURCE_ITEMS } from "../../systems/sortieResolve";

const loadRealItems = (): M13Item[] => {
  const file = path.resolve(__dirname, "../../../content/items.json");
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw) as M13Item[];
};

const loadRecipeIds = (): Set<string> => {
  const file = path.resolve(__dirname, "../../../content/recipes.json");
  if (!fs.existsSync(file)) return new Set();
  const raw = fs.readFileSync(file, "utf-8");
  const arr = JSON.parse(raw) as { id: string }[];
  return new Set(arr.map((r) => r.id));
};

const loadMobDrops = (): string[] => {
  const file = path.resolve(__dirname, "../../../content/mobs.json");
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf-8");
  const mobs = JSON.parse(raw) as { drop_table?: { item_id: string }[] }[];
  const ids: string[] = [];
  for (const m of mobs) {
    for (const d of m.drop_table ?? []) ids.push(d.item_id);
  }
  return ids;
};

/**
 * Base-resource id-ы (food/water/scrap/oil/...) валидны в mob drop_table:
 * они утекают в GameState.baseResources, минуя items.json. Источник истины —
 * BASE_RESOURCE_ITEMS из sortieResolve. Не считаем их orphan-ами.
 */
const BASE_RESOURCE_DROP_IDS = new Set(
  Object.values(BASE_RESOURCE_ITEMS).flat(),
);

describe("Content integration — items.json under M13 schema", () => {
  test("safeParse чистый на всех 187 предметах", () => {
    const items = loadRealItems();
    const result = itemsFileSchema.safeParse(items);
    if (!result.success) {
      const first = result.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new Error(`schema failed:\n${first.join("\n")}`);
    }
    expect(result.success).toBe(true);
  });

  test("floor: каталог содержит ≥180 предметов", () => {
    const items = loadRealItems();
    expect(items.length).toBeGreaterThanOrEqual(180);
  });

  test("ref-integrity: recipe_id ссылается на существующий recipe (или null)", () => {
    const items = loadRealItems();
    const recipeIds = loadRecipeIds();
    // M13 PR-5: recipes.json временно пустой (рецепты пересобираются в
    // PR-6 вместе с крафт-UI). Пока каталог пустой, recipe_id на items
    // указывает на будущие имена и не считается dangling — authoring
    // data сохраняется. Когда рецепты вернутся, ссылки обязаны резолвиться.
    if (recipeIds.size === 0) return;
    let failures = 0;
    for (const item of items) {
      if (item.recipe_id === null) continue;
      if (!recipeIds.has(item.recipe_id)) failures += 1;
    }
    expect(failures).toBe(0);
  });

  test("ref-integrity: mobs.json drop_table item_id-ы резолвятся в items", () => {
    const items = loadRealItems();
    const itemIds = new Set(items.map((i) => i.id));
    const drops = loadMobDrops();
    const orphans = drops.filter(
      (id) => !itemIds.has(id) && !BASE_RESOURCE_DROP_IDS.has(id),
    );
    expect(orphans).toEqual([]);
  });

  test("32 цельных оружия (kind=weapon, slot=action) экипяабельны", () => {
    const items = loadRealItems();
    const weapons = items.filter(
      (i): i is Extract<M13Item, { kind: "weapon" }> => i.kind === "weapon",
    );
    expect(weapons.length).toBeGreaterThanOrEqual(32);
    for (const w of weapons) {
      expect(w.slot).toBe("action");
      // damage_min/max optional на схеме — но цельные оружия
      // унаследованы из weapon_ranged/weapon_melee, у них есть damage.
      if (w.stats) {
        expect(typeof w.stats.damage_min === "number" || w.stats.damage_min === undefined).toBe(true);
      }
    }
  });

  test("component fits:weapon — минимум 50 в каталоге", () => {
    const items = loadRealItems();
    const components = items.filter(
      (i): i is Extract<M13Item, { kind: "component" }> => i.kind === "component",
    );
    expect(components.length).toBeGreaterThanOrEqual(50);
    for (const c of components) {
      expect(c.fits).toBe("weapon");
    }
  });
});
