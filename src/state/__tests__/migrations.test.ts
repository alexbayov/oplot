import { describe, expect, test } from "vitest";
import { migrateSnapshot, _testRemapId, ITEM_MIGRATION_MAP } from "../migrations";
import type { VersionedSnapshot } from "../migrations";

const makeV1Snapshot = (
  overrides: Partial<VersionedSnapshot> = {},
): VersionedSnapshot => ({
  level: 3,
  xp: 150,
  perks: ["toughness"],
  inventory: [
    { id: "knife", count: 1 },
    { id: "ammo", count: 20 },
    { id: "scrap", count: 5 },
  ],
  baseStash: [{ id: "wood", count: 3 }],
  radio_trust: 0,
  resolvedSignals: [],
  settings: { mute: false, volume: 1 },
  saved_at: new Date().toISOString(),
  ...overrides,
});

describe("migrateSnapshot v1 → v2", () => {
  test("v1 snapshot (no version) gets migrated to current SAVE_VERSION (3)", () => {
    const v1 = makeV1Snapshot();
    const migrated = migrateSnapshot(v1);
    expect(migrated.version).toBe(3);
  });

  test("knife → craft_knife", () => {
    const v1 = makeV1Snapshot();
    const v2 = migrateSnapshot(v1);
    expect(v2.inventory.find((s) => s.id === "craft_knife")).toBeDefined();
    expect(v2.inventory.find((s) => s.id === "knife")).toBeUndefined();
  });

  test("ammo (generic) → ammo_9x18", () => {
    const v1 = makeV1Snapshot();
    const v2 = migrateSnapshot(v1);
    const ammo = v2.inventory.find((s) => s.id === "ammo_9x18");
    expect(ammo).toBeDefined();
    expect(ammo?.count).toBe(20);
  });

  test("scrap → scrap_metal", () => {
    const v1 = makeV1Snapshot();
    const v2 = migrateSnapshot(v1);
    expect(v2.inventory.find((s) => s.id === "scrap_metal")?.count).toBe(5);
  });

  test("unchanged IDs pass through (wood)", () => {
    const v1 = makeV1Snapshot();
    const v2 = migrateSnapshot(v1);
    expect(v2.baseStash.find((s) => s.id === "wood")?.count).toBe(3);
  });

  test("unknown ID passes through (no crash)", () => {
    const v1 = makeV1Snapshot({
      inventory: [{ id: "mystery_unknown_thing", count: 7 }],
    });
    const v2 = migrateSnapshot(v1);
    expect(v2.inventory[0]?.id).toBe("mystery_unknown_thing");
    expect(v2.inventory[0]?.count).toBe(7);
  });

  test("idempotent: migrate twice = migrate once", () => {
    const v1 = makeV1Snapshot();
    const first = migrateSnapshot(v1);
    const second = migrateSnapshot(first);
    expect(second).toEqual(first);
  });

  test("v2 snapshot upgrades to v3", () => {
    const v2: VersionedSnapshot = { ...makeV1Snapshot(), version: 2 };
    const migrated = migrateSnapshot(v2);
    expect(migrated.version).toBe(3);
  });

  test("v3 snapshot passes through unchanged", () => {
    const v3: VersionedSnapshot = { ...makeV1Snapshot(), version: 3 };
    const migrated = migrateSnapshot(v3);
    expect(migrated.version).toBe(3);
  });

  test("migrateSnapshot идемпотентна на любой версии", () => {
    const v1 = makeV1Snapshot();
    const once = migrateSnapshot(v1);
    const twice = migrateSnapshot(once);
    expect(twice.version).toBe(3);
    expect(twice).toEqual(once);
  });

  test("knife + craft_knife in same v1 save → merged into one stack", () => {
    const v1 = makeV1Snapshot({
      inventory: [
        { id: "knife", count: 1 },
        { id: "craft_knife", count: 2 },
      ],
    });
    const v2 = migrateSnapshot(v1);
    const merged = v2.inventory.filter((s) => s.id === "craft_knife");
    expect(merged.length).toBe(1);
    expect(merged[0]?.count).toBe(3);
  });

  test("_testRemapId handles all entries in ITEM_MIGRATION_MAP", () => {
    for (const [oldId, newId] of Object.entries(ITEM_MIGRATION_MAP)) {
      expect(_testRemapId(oldId)).toBe(newId);
    }
  });

  test("_testRemapId already-new prefix returns unchanged", () => {
    expect(_testRemapId("craft_machete")).toBe("craft_machete");
    expect(_testRemapId("pistol_t2_pm")).toBe("pistol_t2_pm");
    expect(_testRemapId("ammo_5x45")).toBe("ammo_5x45");
  });
});
