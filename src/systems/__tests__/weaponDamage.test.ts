import { describe, it, expect } from "vitest";
import {
  resolveEquippedCombat,
  resolveEquippedDamage,
  BARE_HANDS_DAMAGE,
} from "../weaponDamage";
import { ACCURACY_BASELINE } from "../../state/balance";
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
  stats: { damage_min, damage_max, accuracy: 0 },
  weight_kg: 0,
  durability_max: 10,
  durability_current,
  parts: [],
  affixes: [],
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

// ─────────────────────────────────────────────────────────────────────
// M16 PR-1: resolveEquippedCombat — расширяет резолв до accuracy + веса.
// damage-проекция идентична resolveEquippedDamage (тонкая обёртка).
// ─────────────────────────────────────────────────────────────────────
describe("resolveEquippedCombat", () => {
  // crafted-инстанс с заданными accuracy/weight (фабрика `inst` даёт 0/0).
  const craftedFull = (
    id: string,
    accuracy: number,
    weight_kg: number,
    durability_current = 10,
  ): WeaponInstance => ({
    id,
    name_ru: id,
    slot: "action",
    stats: { damage_min: 11, damage_max: 16, accuracy },
    weight_kg,
    durability_max: 10,
    durability_current,
    parts: [],
    affixes: [],
  });

  it("null (голые руки) → bare-hands damage + baseline accuracy + вес 0", () => {
    expect(resolveEquippedCombat(null, items, [])).toEqual({
      damage_min: BARE_HANDS_DAMAGE.damage_min,
      damage_max: BARE_HANDS_DAMAGE.damage_max,
      accuracy: ACCURACY_BASELINE,
      weight: 0,
    });
  });

  it("catalog без accuracy → baseline accuracy; combat-вес каталога = 0", () => {
    const eq: EquippedWeapon = { kind: "catalog", id: "akm" };
    expect(resolveEquippedCombat(eq, items, [])).toEqual({
      damage_min: 13,
      damage_max: 19,
      accuracy: ACCURACY_BASELINE,
      weight: 0,
    });
  });

  it("catalog с accuracy в stats → читается; вес всё равно 0", () => {
    const withAcc: Record<string, Item> = {
      scoped: {
        kind: "weapon",
        id: "scoped",
        name_ru: "scoped",
        tier: 1,
        weight_kg: 5, // инвентарный вес каталога — НЕ combat-вес
        zone_origin: "test",
        description_ru: "",
        recipe_id: null,
        slot: "action",
        stats: { damage_min: 10, damage_max: 14, accuracy: 7 },
      } as Item,
    };
    const eq: EquippedWeapon = { kind: "catalog", id: "scoped" };
    expect(resolveEquippedCombat(eq, withAcc, [])).toEqual({
      damage_min: 10,
      damage_max: 14,
      accuracy: 7,
      weight: 0,
    });
  });

  it("crafted живой → frozen accuracy + combat-вес инстанса", () => {
    const w = craftedFull("w1", 5, 2.3, 8);
    const eq: EquippedWeapon = { kind: "crafted", id: "w1" };
    expect(resolveEquippedCombat(eq, items, [w])).toEqual({
      damage_min: 11,
      damage_max: 16,
      accuracy: 5,
      weight: 2.3,
    });
  });

  it("crafted broken (durability 0) → bare-hands, accuracy/вес обнуляются", () => {
    const w = craftedFull("w1", 5, 2.3, 0);
    const eq: EquippedWeapon = { kind: "crafted", id: "w1" };
    expect(resolveEquippedCombat(eq, items, [w])).toEqual({
      damage_min: BARE_HANDS_DAMAGE.damage_min,
      damage_max: BARE_HANDS_DAMAGE.damage_max,
      accuracy: ACCURACY_BASELINE,
      weight: 0,
    });
  });

  it("resolveEquippedDamage — damage-проекция combat (паритет R1)", () => {
    const w = craftedFull("w1", 9, 4.0, 6);
    const eq: EquippedWeapon = { kind: "crafted", id: "w1" };
    const combat = resolveEquippedCombat(eq, items, [w]);
    expect(resolveEquippedDamage(eq, items, [w])).toEqual({
      damage_min: combat.damage_min,
      damage_max: combat.damage_max,
    });
  });

  // ── M16-PR3: применение аффиксов (effective = frozen база (+) аффиксы) ──
  describe("M16-PR3 affix application", () => {
    const withAffixes = (
      affixes: WeaponInstance["affixes"],
      base = { damage_min: 11, damage_max: 16, accuracy: 5 },
      weight_kg = 2.0,
    ): WeaponInstance => ({
      id: "wa",
      name_ru: "wa",
      slot: "action",
      stats: { ...base },
      weight_kg,
      durability_max: 10,
      durability_current: 10,
      parts: [],
      affixes,
    });

    it("пустые аффиксы → frozen база без изменений (zero-regression)", () => {
      const w = withAffixes([]);
      const eq: EquippedWeapon = { kind: "crafted", id: "wa" };
      expect(resolveEquippedCombat(eq, items, [w])).toEqual({
        damage_min: 11,
        damage_max: 16,
        accuracy: 5,
        weight: 2.0,
      });
    });

    it("аффиксы складываются с базой по своему stat (через реестр)", () => {
      // suf_precise: accuracy +6; pre_heavy: damage_max +3; suf_balanced: weight -0.4
      const w = withAffixes([
        { id: "suf_precise", value: 6 },
        { id: "pre_heavy", value: 3 },
        { id: "suf_balanced", value: -0.4 },
      ]);
      const eq: EquippedWeapon = { kind: "crafted", id: "wa" };
      const c = resolveEquippedCombat(eq, items, [w]);
      expect(c.damage_min).toBe(11);
      expect(c.damage_max).toBe(19); // 16 + 3
      expect(c.accuracy).toBe(11); // 5 + 6
      expect(c.weight).toBeCloseTo(1.6, 5); // 2.0 - 0.4
    });

    it("frozen.stats НЕ мутируется — повторный резолв стабилен", () => {
      const w = withAffixes([{ id: "pre_heavy", value: 3 }]);
      const eq: EquippedWeapon = { kind: "crafted", id: "wa" };
      const first = resolveEquippedCombat(eq, items, [w]);
      const second = resolveEquippedCombat(eq, items, [w]);
      expect(second).toEqual(first);
      expect(w.stats).toEqual({ damage_min: 11, damage_max: 16, accuracy: 5 }); // вход цел
    });

    it("отрицательный affix не уводит ниже floor (damage≥0, max≥min, acc≥0, weight≥0)", () => {
      const w = withAffixes(
        [
          { id: "suf_precise", value: -999 }, // accuracy → floor 0
          { id: "pre_honed", value: -999 }, // damage_min → floor 0
          { id: "pre_heavy", value: -999 }, // damage_max → clamp ≥ min
          { id: "suf_balanced", value: -999 }, // weight → floor 0
        ],
        { damage_min: 3, damage_max: 5, accuracy: 2 },
        1.0,
      );
      const eq: EquippedWeapon = { kind: "crafted", id: "wa" };
      const c = resolveEquippedCombat(eq, items, [w]);
      expect(c.damage_min).toBe(0);
      expect(c.damage_max).toBe(0); // clamp ≥ damage_min(0)
      expect(c.damage_max).toBeGreaterThanOrEqual(c.damage_min);
      expect(c.accuracy).toBe(0);
      expect(c.weight).toBe(0);
    });

    it("R3: сломанный инстанс с аффиксами → bare-hands, аффиксы игнорируются", () => {
      const w = withAffixes([{ id: "pre_heavy", value: 3 }]);
      w.durability_current = 0;
      const eq: EquippedWeapon = { kind: "crafted", id: "wa" };
      expect(resolveEquippedCombat(eq, items, [w])).toEqual({
        damage_min: BARE_HANDS_DAMAGE.damage_min,
        damage_max: BARE_HANDS_DAMAGE.damage_max,
        accuracy: ACCURACY_BASELINE,
        weight: 0,
      });
    });

    it("unknown affix id → no-op (старый сейв не ломает резолв)", () => {
      const w = withAffixes([{ id: "__removed__", value: 50 }]);
      const eq: EquippedWeapon = { kind: "crafted", id: "wa" };
      expect(resolveEquippedCombat(eq, items, [w])).toEqual({
        damage_min: 11,
        damage_max: 16,
        accuracy: 5,
        weight: 2.0,
      });
    });
  });
});
