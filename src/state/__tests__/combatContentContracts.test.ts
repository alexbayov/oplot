import { describe, expect, test, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { clearRegistry, getItem, loadContentItems } from "../ItemRegistry";
import { isCraftWeapon, isDropWeapon } from "../../types/items";
import type { Item, Mob } from "../../types";

type RawItem = Item & Record<string, unknown>;

type RawMob = Mob & Record<string, unknown>;

const readJson = <T>(relativePath: string): T => {
  const fullPath = path.resolve(__dirname, "../../..", relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf-8")) as T;
};

const loadItems = (): RawItem[] => readJson<RawItem[]>("content/items.json");

const loadMobs = (): RawMob[] => readJson<RawMob[]>("content/mobs.json");

const itemMap = (items: RawItem[]): Record<string, Item> => {
  const result: Record<string, Item> = {};
  for (const item of items) result[item.id] = item;
  return result;
};

const supportedBehaviorIds = new Set([
  "ranged_keep_distance",
  "defensive_cover",
  "berserker_low_hp",
  "pack_bonus_when_paired",
  "armor_piercing_ranged",
]);

beforeEach(() => {
  clearRegistry();
});

describe("M12.5 combat content contracts", () => {
  test("content/mobs.json parses with unique resolvable mob ids", () => {
    const mobs = loadMobs();
    expect(mobs.length).toBeGreaterThan(0);

    const ids = new Set<string>();
    for (const mob of mobs) {
      expect(mob.id).toBeTruthy();
      expect(ids.has(mob.id), `duplicate mob id: ${mob.id}`).toBe(false);
      ids.add(mob.id);
      expect(mob.hp, `${mob.id} hp`).toBeGreaterThan(0);
      expect(mob.damage_min, `${mob.id} damage_min`).toBeGreaterThanOrEqual(0);
      expect(mob.damage_max, `${mob.id} damage_max`).toBeGreaterThanOrEqual(mob.damage_min);
      expect(mob.base_speed, `${mob.id} base_speed`).toBeGreaterThanOrEqual(0);
    }
  });

  test("mob behavior ids are supported by current AI or future intent mapping", () => {
    const mobs = loadMobs();

    for (const mob of mobs) {
      const behaviorId = typeof mob.behavior_id === "string" ? mob.behavior_id : undefined;
      const phaseBehaviorId = typeof mob.phase_2_behavior_id === "string" ? mob.phase_2_behavior_id : undefined;
      if (behaviorId) {
        expect(supportedBehaviorIds.has(behaviorId), `${mob.id} behavior_id ${behaviorId}`).toBe(true);
      }
      if (phaseBehaviorId) {
        expect(supportedBehaviorIds.has(phaseBehaviorId), `${mob.id} phase_2_behavior_id ${phaseBehaviorId}`).toBe(true);
      }
    }
  });

  test("mob loot references resolve to content/items.json ids", () => {
    const items = loadItems();
    const mobs = loadMobs();
    const ids = new Set(items.map((item) => item.id));
    const migratedAliases = new Set(
      items
        .map((item) => item._migrated_from)
        .filter((id): id is string => typeof id === "string"),
    );

    for (const mob of mobs) {
      for (const drop of mob.drop_table) {
        expect(
          ids.has(drop.item_id) || migratedAliases.has(drop.item_id),
          `${mob.id} drop_table ${drop.item_id}`,
        ).toBe(true);
      }
      for (const drop of mob.drops ?? []) {
        expect(ids.has(drop.id), `${mob.id} drops ${drop.id}`).toBe(true);
      }
    }
  });

  test("ranged weapons have ammo or caliber-compatible fallback data", () => {
    const items = loadItems();
    const legacyItems = itemMap(items);
    const ids = new Set(items.map((item) => item.id));
    loadContentItems(legacyItems);

    for (const item of items) {
      if (item.type !== "weapon_ranged") continue;

      const ammoId = typeof item.stats.ammo_id === "string" ? item.stats.ammo_id : undefined;
      const m11 = getItem(item.id);
      const m11Caliber = m11 && (isCraftWeapon(m11) || isDropWeapon(m11)) ? m11.caliber : null;

      expect(
        Boolean(ammoId && ids.has(ammoId)) || Boolean(m11Caliber),
        `${item.id} should have a resolving legacy ammo_id or M11 caliber`,
      ).toBe(true);
    }
  });

  test("weapon and ammo references resolve through ItemRegistry", () => {
    const items = loadItems();
    loadContentItems(itemMap(items));

    for (const item of items) {
      const m11 = getItem(item.id);
      expect(m11, `${item.id} should adapt into ItemRegistry`).toBeDefined();

      if (item.type === "weapon_ranged" && typeof item.stats.ammo_id === "string") {
        expect(getItem(item.stats.ammo_id), `${item.id} ammo ${item.stats.ammo_id}`).toBeDefined();
      }
    }
  });

  test("weapon-sensitive items expose a non-empty display name through ItemRegistry", () => {
    const items = loadItems();
    loadContentItems(itemMap(items));
    const sensitiveClasses = new Set(["craft", "drop", "part", "mod", "ammo"]);

    for (const item of items) {
      const m11 = getItem(item.id);
      if (!m11 || !sensitiveClasses.has(m11.itemClass)) continue;

      const displayName = m11.name_generic_ru || m11.name_real_ru;
      expect(displayName.trim(), `${item.id} display name`).not.toBe("");
    }
  });
});
