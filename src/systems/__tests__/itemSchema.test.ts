/**
 * M13 PR-3 gate-тесты для itemSchema.
 *
 * Контракт пока шире наполнения: content/items.json мигрирует в PR-4.
 * Поэтому тестим саму схему happy-path/fail-path сэмплами шести kind-ов.
 * Когда PR-4 переведёт items.json — отдельный тест на пачку.
 */

import { describe, expect, test } from "vitest";
import {
  ARMOR_SLOTS,
  WEAPON_SLOTS,
  itemSchema,
  itemsFileSchema,
} from "../itemSchema";

const baseFields = {
  id: "test_id",
  name_ru: "Тестовый предмет",
  tier: 1 as const,
  weight_kg: 0.5,
  zone_origin: "forest",
  description_ru: "Описание для теста.",
  recipe_id: null,
};

describe("itemSchema — happy-path по каждому kind", () => {
  test("material — без stats или с пустыми", () => {
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "material" }).success,
    ).toBe(true);
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "material", stats: {} })
        .success,
    ).toBe(true);
  });

  test("component — требует fits", () => {
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "component", fits: "weapon" })
        .success,
    ).toBe(true);
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "component", fits: "armor" })
        .success,
    ).toBe(true);
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "component" }).success,
    ).toBe(false);
  });

  test("consumable — требует stats.effect_type/value/charges", () => {
    expect(
      itemSchema.safeParse({
        ...baseFields,
        kind: "consumable",
        stats: { effect_type: "heal", effect_value: 15, charges: 1 },
      }).success,
    ).toBe(true);
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "consumable", stats: {} })
        .success,
    ).toBe(false);
  });

  test("weapon — slot из WEAPON_SLOTS, intrinsic_affixes <=3", () => {
    for (const slot of WEAPON_SLOTS) {
      expect(
        itemSchema.safeParse({ ...baseFields, kind: "weapon", slot }).success,
      ).toBe(true);
    }
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "weapon", slot: "plate" })
        .success,
    ).toBe(false);
    expect(
      itemSchema.safeParse({
        ...baseFields,
        kind: "weapon",
        slot: "barrel",
        intrinsic_affixes: [
          { id: "a", value: 1 },
          { id: "b", value: 2 },
          { id: "c", value: 3 },
          { id: "d", value: 4 },
        ],
      }).success,
    ).toBe(false);
    expect(
      itemSchema.safeParse({
        ...baseFields,
        kind: "weapon",
        slot: "barrel",
        intrinsic_affixes: [
          { id: "a", value: 1 },
          { id: "b", value: 2 },
          { id: "c", value: 3 },
        ],
      }).success,
    ).toBe(true);
  });

  test("armor — slot из ARMOR_SLOTS", () => {
    for (const slot of ARMOR_SLOTS) {
      expect(
        itemSchema.safeParse({ ...baseFields, kind: "armor", slot }).success,
      ).toBe(true);
    }
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "armor", slot: "barrel" })
        .success,
    ).toBe(false);
  });

  test("tool — stats необязательны", () => {
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "tool" }).success,
    ).toBe(true);
    expect(
      itemSchema.safeParse({
        ...baseFields,
        kind: "tool",
        stats: { tool_type: "crowbar", uses: 5 },
      }).success,
    ).toBe(true);
  });
});

describe("itemSchema — fail-path", () => {
  test("неизвестный kind отвергается", () => {
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "ammo" }).success,
    ).toBe(false);
  });

  test("tier вне 1-5 отвергается", () => {
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "material", tier: 0 })
        .success,
    ).toBe(false);
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "material", tier: 6 })
        .success,
    ).toBe(false);
  });

  test("отрицательный weight отвергается", () => {
    expect(
      itemSchema.safeParse({
        ...baseFields,
        kind: "material",
        weight_kg: -1,
      }).success,
    ).toBe(false);
  });

  test("пустой id отвергается", () => {
    expect(
      itemSchema.safeParse({ ...baseFields, kind: "material", id: "" }).success,
    ).toBe(false);
  });
});

describe("itemsFileSchema — массив", () => {
  test("пустой массив валиден", () => {
    expect(itemsFileSchema.safeParse([]).success).toBe(true);
  });

  test("смешанная пачка из шести kind-ов валидна", () => {
    const pack = [
      { ...baseFields, id: "m1", kind: "material" as const },
      {
        ...baseFields,
        id: "c1",
        kind: "component" as const,
        fits: "weapon" as const,
      },
      {
        ...baseFields,
        id: "u1",
        kind: "consumable" as const,
        stats: { effect_type: "heal", effect_value: 10, charges: 1 },
      },
      {
        ...baseFields,
        id: "w1",
        kind: "weapon" as const,
        slot: "barrel" as const,
      },
      {
        ...baseFields,
        id: "a1",
        kind: "armor" as const,
        slot: "plate" as const,
      },
      { ...baseFields, id: "t1", kind: "tool" as const },
    ];
    const res = itemsFileSchema.safeParse(pack);
    if (!res.success) {
      throw new Error(JSON.stringify(res.error.format(), null, 2));
    }
  });
});
