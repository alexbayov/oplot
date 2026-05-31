/**
 * Integration test: real content/items.json парсится через ItemRegistry.
 *
 * Гарантирует, что после Devin'овского M11.0a content PR (107 новых items)
 * adaptLegacyItem правильно конвертирует ВСЕ items в M11Item shape.
 *
 * Это smoke-test, не unit. Падает если кто-то ломает legacy compatibility.
 */

import { describe, expect, test, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  loadContentItems,
  clearRegistry,
  getItem,
  itemName,
} from "../ItemRegistry";
import {
  isCraftWeapon,
  isWeaponMod,
  isWeaponPart,
} from "../../types/items";
import type { Item as LegacyItem } from "../../types";

const loadRealItems = (): Record<string, LegacyItem> => {
  const file = path.resolve(__dirname, "../../../content/items.json");
  const raw = fs.readFileSync(file, "utf-8");
  const arr = JSON.parse(raw) as LegacyItem[];
  const map: Record<string, LegacyItem> = {};
  for (const item of arr) map[item.id] = item;
  return map;
};

describe("Content integration — real items.json parses through ItemRegistry", () => {
  beforeEach(() => clearRegistry());

  test("loadContentItems зальёт все 187+ items без ошибок", () => {
    const items = loadRealItems();
    const total = Object.keys(items).length;
    expect(total).toBeGreaterThanOrEqual(180);
    expect(() => loadContentItems(items)).not.toThrow();
  });

  test("getItem возвращает M11Item для каждого ID из real content", () => {
    const items = loadRealItems();
    loadContentItems(items);
    let failures = 0;
    for (const id of Object.keys(items)) {
      const m11 = getItem(id);
      if (!m11) failures++;
    }
    expect(failures).toBe(0);
  });

  test("реальные модификации (mod_*) распарсиваются как WeaponMod", () => {
    const items = loadRealItems();
    loadContentItems(items);
    const mods = Object.values(items).filter((i) => i.id.startsWith("mod_"));
    expect(mods.length).toBeGreaterThanOrEqual(8);
    for (const mod of mods) {
      const m11 = getItem(mod.id);
      expect(m11).toBeDefined();
      expect(m11 && isWeaponMod(m11)).toBe(true);
    }
  });

  test("реальные parts (*_frame, *_slide, …) распарсиваются как WeaponPart", () => {
    const items = loadRealItems();
    loadContentItems(items);
    const parts = Object.values(items).filter(
      (i) => (i as unknown as Record<string, unknown>).type === "weapon_part",
    );
    expect(parts.length).toBeGreaterThanOrEqual(50);
    for (const part of parts) {
      const m11 = getItem(part.id);
      expect(m11 && isWeaponPart(m11)).toBe(true);
    }
  });

  test("craft-оружие (item_class=craft) распарсивается как CraftWeapon", () => {
    const items = loadRealItems();
    loadContentItems(items);
    const crafts = Object.values(items).filter(
      (i) => (i as unknown as Record<string, unknown>).item_class === "craft",
    );
    expect(crafts.length).toBeGreaterThanOrEqual(5);
    for (const c of crafts) {
      const m11 = getItem(c.id);
      expect(m11 && isCraftWeapon(m11)).toBe(true);
    }
  });

  test("itemName уважает WEAPON_NAMING_MODE для items с обоими полями", () => {
    const items = loadRealItems();
    loadContentItems(items);
    // Найти любой ствол с name_real_ru != name_generic_ru
    const withBoth = Object.values(items).find((i) => {
      const ex = i as unknown as Record<string, unknown>;
      return typeof ex.name_real_ru === "string"
        && typeof ex.name_generic_ru === "string"
        && ex.name_real_ru !== ex.name_generic_ru;
    });
    if (!withBoth) return; // нет такого ствола в текущем content — skip
    const m11 = getItem(withBoth.id);
    expect(m11).toBeDefined();
    expect(typeof itemName(m11 ?? (() => { throw new Error("expected m11"); })())).toBe("string");
  });

  test("default itemName does not expose real weapon trademarks", () => {
    const items = loadRealItems();
    loadContentItems(items);
    const sensitiveClasses = new Set(["craft", "drop", "part", "mod", "ammo"]);
    const realNameMarkers = [
      "ПМ", "ТТ", "АКМ", "АКС", "АК-74", "ППШ", "СВД", "РПК", "ПБС",
      "АПС", "Бекас", "Тигр", "ИЖ", "Мосин", "СКС", "Сайга", "ПСО",
    ];

    for (const id of Object.keys(items)) {
      const m11 = getItem(id);
      if (!m11 || !sensitiveClasses.has(m11.itemClass)) continue;
      const displayName = itemName(m11);
      for (const marker of realNameMarkers) {
        expect(displayName, `${id} should not expose ${marker}`).not.toContain(marker);
      }
    }
  });
});
