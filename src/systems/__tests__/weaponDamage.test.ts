import { describe, it, expect } from "vitest";
import { resolveEquippedDamage, BARE_HANDS_DAMAGE } from "../weaponDamage";
import type { WeaponInstance } from "../weaponAssembly";
import type { Item } from "../../types/item";
import type { EquippedWeapon } from "../../state/types";

// Минимальный catalog-weapon для карты items. Резолвер читает только
// kind + stats.damage_min/max; остальные поля для типа Item.
const weapon = (id: string, stats?: { damage_min?: number; damage_max?: number }): Item =>
  ({
    kind: "weapon",
    id,
    name_ru: id,
    tier: 1,
    weight_kg: 1,
    zone_origin: "test",
    description_ru: "",
    recipe_id: null,
    slot: "action",
    ...(stats ? { stats } : {}),
  }) as Item;

const inst = (
  id: string,
  damage_min: number,
  damage_max: number,
  durability_current = 10,
): WeaponInstance => ({
  id,
  name_ru: id,
  slot: "action",
  stats: { damage_min, damage_max },
  durability_max: 10,
  durability_current,
  parts: [],
});

const items: Record<string, Item> = {
  craft_knife: weapon("craft_knife", { damage_min: 4, damage_max: 7 }),
  akm: weapon("akm", { damage_min: 13, damage_max: 19 }),
  malformed: weapon("malformed", {}), // R2: пустой stats
  partial: weapon("partial", { damage_min: 9 }), // только min
};

describe("resolveEquippedDamage", () => {
  it("null equipped → bare-hands 4/7", () => {
    expect(resolveEquippedDamage(null, items, [])).toEqual(BARE_HANDS_DAMAGE);
    expect(BARE_HANDS_DAMAGE).toEqual({ damage_min: 4, damage_max: 7 });
  });

  it("catalog craft_knife → 4/7 (parity-anchor, читается из items)", () => {
    const eq: EquippedWeapon = { kind: "catalog", id: "craft_knife" };
    expect(resolveEquippedDamage(eq, items, [])).toEqual({ damage_min: 4, damage_max: 7 });
  });

  it("DRIFT-GATE: тюн баланса craft_knife в items → резолвер отдаёт новое значение", () => {
    // Доказывает, что урон читается из items (не хардкод). Поскольку
    // snapshotHero зовёт ТОТ ЖЕ резолвер, бой и арсенал-дельта не разъедутся.
    const tuned: Record<string, Item> = {
      craft_knife: weapon("craft_knife", { damage_min: 5, damage_max: 8 }),
    };
    const eq: EquippedWeapon = { kind: "catalog", id: "craft_knife" };
    expect(resolveEquippedDamage(eq, tuned, [])).toEqual({ damage_min: 5, damage_max: 8 });
  });

  it("catalog akm → 13/19", () => {
    const eq: EquippedWeapon = { kind: "catalog", id: "akm" };
    expect(resolveEquippedDamage(eq, items, [])).toEqual({ damage_min: 13, damage_max: 19 });
  });

  it("R2: catalog с пустым stats {} → bare-hands 4/7 (не undefined, не throw)", () => {
    const eq: EquippedWeapon = { kind: "catalog", id: "malformed" };
    expect(resolveEquippedDamage(eq, items, [])).toEqual({ damage_min: 4, damage_max: 7 });
  });

  it("R2: частично-заполненный stats {damage_min} → min из items, max=bare 7", () => {
    const eq: EquippedWeapon = { kind: "catalog", id: "partial" };
    expect(resolveEquippedDamage(eq, items, [])).toEqual({ damage_min: 9, damage_max: 7 });
  });

  it("catalog id отсутствует в items → bare-hands", () => {
    const eq: EquippedWeapon = { kind: "catalog", id: "ghost" };
    expect(resolveEquippedDamage(eq, items, [])).toEqual({ damage_min: 4, damage_max: 7 });
  });

  it("crafted живой инстанс → его frozen stats", () => {
    const w = inst("w1", 11, 16, 8);
    const eq: EquippedWeapon = { kind: "crafted", id: "w1" };
    expect(resolveEquippedDamage(eq, items, [w])).toEqual({ damage_min: 11, damage_max: 16 });
  });

  it("R3: crafted broken (durability_current=0) → bare-hands 4/7, не его stats", () => {
    const w = inst("w1", 11, 16, 0);
    const eq: EquippedWeapon = { kind: "crafted", id: "w1" };
    expect(resolveEquippedDamage(eq, items, [w])).toEqual({ damage_min: 4, damage_max: 7 });
  });

  it("crafted id отсутствует в списке → bare-hands", () => {
    const eq: EquippedWeapon = { kind: "crafted", id: "ghost" };
    expect(resolveEquippedDamage(eq, items, [])).toEqual({ damage_min: 4, damage_max: 7 });
  });

  it("durability ровно 1 (>0) → stats; durability 0 → bare-hands (граница гейта)", () => {
    const alive = inst("a", 20, 30, 1);
    const dead = inst("d", 20, 30, 0);
    const eqA: EquippedWeapon = { kind: "crafted", id: "a" };
    const eqD: EquippedWeapon = { kind: "crafted", id: "d" };
    expect(resolveEquippedDamage(eqA, items, [alive, dead])).toEqual({ damage_min: 20, damage_max: 30 });
    expect(resolveEquippedDamage(eqD, items, [alive, dead])).toEqual({ damage_min: 4, damage_max: 7 });
  });
});
