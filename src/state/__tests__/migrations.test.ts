import { describe, expect, test } from "vitest";
import { migrateSnapshot, _testRemapId, ITEM_MIGRATION_MAP } from "../migrations";
import type { VersionedSnapshot } from "../migrations";
import { SAVE_VERSION } from "../../config";

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
  test("v1 snapshot (no version) gets full chain to v3", () => {
    const v1 = makeV1Snapshot();
    const v2 = migrateSnapshot(v1);
    expect(v2.version).toBe(SAVE_VERSION);
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

  test("v2 snapshot (m11.0 only) gets bumped to current SAVE_VERSION", () => {
    const v2: VersionedSnapshot = {
      ...makeV1Snapshot(),
      version: 2,
      inventory: [{ id: "craft_knife", count: 1 }],
    };
    const result = migrateSnapshot(v2);
    expect(result.version).toBe(SAVE_VERSION);
    expect(result.inventory).toEqual(v2.inventory);
  });

  test("v4 snapshot gets bumped to current SAVE_VERSION (v5 stamp-only)", () => {
    // M13 PR-6a: v4→v5 — version stamp, без поля-данных (snapshot не
    // несёт equipped state, см. migrations.ts:migrateV4ToV5). Тест
    // фиксирует контракт «v4 → SAVE_VERSION без потерь полей».
    const v4: VersionedSnapshot = { ...makeV1Snapshot(), version: 4 };
    const migrated = migrateSnapshot(v4);
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.inventory).toEqual(v4.inventory);
    expect(migrated.baseStash).toEqual(v4.baseStash);
  });

  test("v5 snapshot gets bumped to v6 — hp default, buildings НЕ инжектится", () => {
    // M13 PR-6c: v5→v6 — стампует версию + hp-дефолт. buildings НАМЕРЕННО
    // не инжектится (остаётся undefined), чтобы applySnapshot подставил
    // createDefaultBuildings(). Инжект `[]` сломал бы always-on (§7):
    // `[] ?? default === []` → существующий игрок без построек навсегда.
    const v5: VersionedSnapshot = { ...makeV1Snapshot(), version: 5 };
    const migrated = migrateSnapshot(v5);
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.buildings).toBeUndefined();
    expect(migrated.hp).toBeNull();
    // Все существующие поля сохранены.
    expect(migrated.inventory).toEqual(v5.inventory);
    expect(migrated.baseStash).toEqual(v5.baseStash);
  });

  test("v6 snapshot gets bumped to v7 — equipped_weapon/crafted_weapons НЕ инжектятся", () => {
    // M13 PR-6b-1: v6→v7 — stamp-only. equipped_weapon НАМЕРЕННО
    // не инжектится (остаётся undefined), чтобы applySnapshot подставил
    // createDefaultPlayer().equipped_weapon. Trap A (preflight §5):
    // инжект `null` сломал бы новых игроков, потому что null —
    // валидное «слот пуст после поломки», и applySnapshot его
    // сохраняет; а старый v6-сейв этого намерения не нёс.
    const v6: VersionedSnapshot = {
      ...makeV1Snapshot(),
      version: 6,
      buildings: [
        { id: "garden", accumulated_output: 12 },
        { id: "bunk", accumulated_output: 0 },
      ],
      hp: 73,
    };
    const migrated = migrateSnapshot(v6);
    expect(migrated.version).toBe(SAVE_VERSION);
    expect("equipped_weapon" in migrated).toBe(false);
    expect("crafted_weapons" in migrated).toBe(false);
    // Все существующие поля сохранены 1:1.
    expect(migrated.buildings).toEqual(v6.buildings);
    expect(migrated.hp).toBe(73);
    expect(migrated.inventory).toEqual(v6.inventory);
  });

  test("v7 идемпотентен — повторный запуск ничего не меняет", () => {
    const v7: VersionedSnapshot = {
      ...makeV1Snapshot(),
      version: 7,
      buildings: [
        { id: "garden", accumulated_output: 12 },
        { id: "bunk", accumulated_output: 0 },
      ],
      hp: 73,
      equipped_weapon: { kind: "crafted", id: "wi_a" },
      crafted_weapons: [
        {
          id: "wi_a",
          name_ru: "сборка",
          slot: "action",
          stats: { damage_min: 3, damage_max: 6 },
          durability_max: 5,
          durability_current: 4,
          parts: ["pm_frame"],
        },
      ],
    };
    const migrated = migrateSnapshot(v7);
    expect(migrated).toEqual(v7);
  });

  test("migrateSnapshot идемпотентна на любой версии", () => {
    const v1 = makeV1Snapshot();
    const once = migrateSnapshot(v1);
    const twice = migrateSnapshot(once);
    expect(twice.version).toBe(SAVE_VERSION);
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

describe("v2 -> v3 migration (M11.4 skill tree)", () => {
  test("v2 with legacy perks -> unlockedSkillNodes + skillPoints", () => {
    const v2: VersionedSnapshot = {
      ...makeV1Snapshot(),
      version: 2,
      perks: ["toughness", "scavenger", "unknown_perk"],
    };
    const v4 = migrateSnapshot(v2);
    expect(v4.version).toBe(SAVE_VERSION);
    expect(Array.isArray(v4.unlockedSkillNodes)).toBe(true);
    expect(typeof v4.skillPoints).toBe("number");
  });

  test("v1 -> v4 chain works", () => {
    const v1 = makeV1Snapshot();
    const out = migrateSnapshot(v1);
    expect(out.version).toBe(SAVE_VERSION);
  });

  test("v3 -> v4 sets baseResources and injuries defaults", () => {
    const v3: VersionedSnapshot = {
      ...makeV1Snapshot(),
      version: 3,
      unlockedSkillNodes: ["marks_1"],
      skillPoints: 2,
    };
    const v4 = migrateSnapshot(v3);
    expect(v4.version).toBe(SAVE_VERSION);
    expect(v4.unlockedSkillNodes).toEqual(["marks_1"]);
    expect(v4.skillPoints).toBe(2);
    expect(v4.baseResources).toEqual({ water: 0, fuel: 0, metal: 0, food: 0 });
    expect(v4.injuries).toEqual([]);
  });
});

describe("v3 -> v4 migration (M13 PR-1)", () => {
  test("отсутствие baseResources в v3 → нули в v4", () => {
    const v3: VersionedSnapshot = { ...makeV1Snapshot(), version: 3 };
    const v4 = migrateSnapshot(v3);
    expect(v4.baseResources).toEqual({ water: 0, fuel: 0, metal: 0, food: 0 });
  });

  test("существующие baseResources сохраняются", () => {
    const v3: VersionedSnapshot = {
      ...makeV1Snapshot(),
      version: 3,
      baseResources: { water: 5, fuel: 10, metal: 2, food: 8 },
    };
    const v4 = migrateSnapshot(v3);
    expect(v4.baseResources).toEqual({ water: 5, fuel: 10, metal: 2, food: 8 });
  });

  test("инвентарь и стэш не трогаются", () => {
    const v3: VersionedSnapshot = {
      ...makeV1Snapshot(),
      version: 3,
      inventory: [{ id: "craft_knife", count: 1 }],
      baseStash: [{ id: "scrap_metal", count: 7 }],
    };
    const v4 = migrateSnapshot(v3);
    expect(v4.inventory).toEqual([{ id: "craft_knife", count: 1 }]);
    expect(v4.baseStash).toEqual([{ id: "scrap_metal", count: 7 }]);
  });
});
