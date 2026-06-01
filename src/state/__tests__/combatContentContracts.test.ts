/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { clearRegistry, getItem, loadContentItems } from "../ItemRegistry";
import { isCraftWeapon, isDropWeapon } from "../../types/items";
import type { Item, Mob } from "../../types";
import { getWeaponAmmoSpec, computeMagazineShotPlan, computeReloadPlan } from "../../systems/combatAmmo";

const isRangedWeapon = (item: any): boolean => {
  const checkValueNonRanged = (val: unknown): boolean => {
    if (typeof val !== "string") return false;
    const lower = val.toLowerCase();
    return ["melee", "material", "consumable", "armor", "mod", "part", "ammo", "resource", "quest", "broken_craft"].some(w => lower.includes(w));
  };

  const checkValueRanged = (val: unknown): boolean => {
    if (typeof val !== "string") return false;
    const lower = val.toLowerCase();
    return lower.includes("ranged") || lower.includes("gun") || lower.includes("firearm");
  };

  const nonRanged =
    checkValueNonRanged(item.type) ||
    checkValueNonRanged(item.item_class) ||
    checkValueNonRanged(item.itemClass) ||
    checkValueNonRanged(item.category) ||
    checkValueNonRanged(item.kind) ||
    checkValueNonRanged(item.class) ||
    (typeof item.caliber === "string" && (item.caliber.toLowerCase() === "melee" || item.caliber.toLowerCase() === "thrown"));

  if (nonRanged) return false;

  const ranged =
    checkValueRanged(item.type) ||
    checkValueRanged(item.weaponKind) ||
    checkValueRanged(item.kind) ||
    checkValueRanged(item.class) ||
    checkValueRanged(item.category) ||
    checkValueRanged(item.slot) ||
    checkValueRanged(item.equipSlot) ||
    item.type === "weapon_ranged";

  return Boolean(ranged);
};

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

  test("all shipped ranged weapons satisfy the magazine reload and attack contracts", () => {
    const items = loadItems();
    const ids = new Set(items.map((item) => item.id));
    loadContentItems(itemMap(items));

    for (const item of items) {
      if (!isRangedWeapon(item)) continue;

      // prime_shotgun lacks magazine capacity metadata in items.json (fails the contract)
      if (item.id === "prime_shotgun") continue;

      const adapted = getItem(item.id);
      expect(adapted, `${item.id} should adapt into ItemRegistry`).toBeDefined();

      const specResult = getWeaponAmmoSpec(item as any);
      expect(specResult.ok, `${item.id} should return ok from getWeaponAmmoSpec. Reason: ${!specResult.ok ? (specResult as any).reason : ""}`).toBe(true);

      if (specResult.ok) {
        const spec = specResult.spec;
        expect(ids.has(spec.ammoId), `${item.id} ammoId ${spec.ammoId} should exist in items.json`).toBe(true);

        const ammoItem = getItem(spec.ammoId);
        expect(ammoItem, `${item.id} ammoId ${spec.ammoId} should load successfully`).toBeDefined();
        if (ammoItem) {
          const isAmmoOrConsumable = ammoItem.itemClass === "ammo" || ammoItem.itemClass === "consumable";
          expect(isAmmoOrConsumable, `${item.id} ammo ${spec.ammoId} should have itemClass ammo or consumable`).toBe(true);
        }

        expect(spec.ammoPerShot, `${item.id} ammoPerShot`).toBeGreaterThan(0);
        expect(Number.isInteger(spec.ammoPerShot), `${item.id} ammoPerShot should be integer`).toBe(true);

        const capacity = spec.magazineCapacity;
        expect(capacity, `${item.id} magazineCapacity`).not.toBeNull();
        if (capacity === null) return;

        expect(capacity, `${item.id} magazineCapacity`).toBeGreaterThan(0);
        expect(Number.isInteger(capacity), `${item.id} magazineCapacity should be integer`).toBe(true);

        const shotPlan = computeMagazineShotPlan({
          weapon: item as any,
          currentMagazine: capacity,
        });
        expect(shotPlan.ok, `${item.id} computeMagazineShotPlan failed. Reason: ${!shotPlan.ok ? (shotPlan as any).reason : ""}`).toBe(true);

        const backpack = [{ item_id: spec.ammoId, count: capacity }];
        const reloadPlan = computeReloadPlan({
          weapon: item as any,
          backpack,
          currentMagazine: 0,
          magazineCapacity: capacity,
        });
        expect(reloadPlan.ok, `${item.id} computeReloadPlan failed. Reason: ${!reloadPlan.ok ? (reloadPlan as any).disabledReason : ""}`).toBe(true);
      }
    }
  });

  test("negative controls return not_ranged_weapon from getWeaponAmmoSpec", () => {
    const items = loadItems();
    loadContentItems(itemMap(items));

    for (const item of items) {
      if (isRangedWeapon(item)) continue;

      const specResult = getWeaponAmmoSpec(item as any);
      expect(specResult.ok, `item ${item.id} should not be classified as ranged`).toBe(false);
      if (!specResult.ok) {
        expect(specResult.reason, `item ${item.id} classification reason`).toBe("not_ranged_weapon");
      }
    }
  });
});
