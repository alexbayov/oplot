import { describe, expect, it } from "vitest";
import { assembleWeapon, nextWeaponInstanceId } from "../weaponAssembly";
import { AssemblyError } from "../assemblyValidation";
import type { ComponentItem } from "../../types";

const part = (
  id: string,
  contribute: {
    damage_min?: number;
    damage_max?: number;
    accuracy?: number;
    durability_max?: number;
  },
  weight_kg = 0.5,
): ComponentItem => ({
  kind: "component",
  id,
  name_ru: id,
  tier: 1,
  weight_kg,
  zone_origin: "test",
  description_ru: "",
  recipe_id: null,
  fits: "weapon",
  stats: contribute,
});

describe("assembleWeapon — sum по contribute_* (additive scalar)", () => {
  it("суммирует damage_min/max/durability_max по всем партам", () => {
    const w = assembleWeapon(
      [
        part("pm_frame", { damage_min: 1, damage_max: 2, durability_max: 10 }),
        part("pm_slide", { damage_min: 2, damage_max: 4, durability_max: 5 }),
      ],
      "wi_test1",
    );
    expect(w.stats.damage_min).toBe(3);
    expect(w.stats.damage_max).toBe(6);
    expect(w.durability_max).toBe(15);
    expect(w.durability_current).toBe(15);
    expect(w.slot).toBe("action");
    expect(w.parts).toEqual(["pm_frame", "pm_slide"]);
  });

  it("M16-PR1: суммирует accuracy и weight_kg, affixes пустой", () => {
    const w = assembleWeapon(
      [
        part("pm_frame", { damage_min: 1, damage_max: 2, accuracy: 3 }, 0.6),
        part("mod_optic", { accuracy: 4 }, 0.8),
        part("pm_slide", { damage_min: 2, damage_max: 4 }, 0.4),
      ],
      "wi_acc",
    );
    expect(w.stats.accuracy).toBe(7);
    expect(w.weight_kg).toBeCloseTo(1.8);
    expect(w.affixes).toEqual([]);
  });

  it("M16-PR1: парты без accuracy → инстанс accuracy 0 (нейтрально)", () => {
    const w = assembleWeapon(
      [
        part("pm_frame", { damage_min: 1, damage_max: 2, durability_max: 5 }),
        part("pm_slide", { damage_min: 2, damage_max: 3, durability_max: 5 }),
      ],
      "wi_noacc",
    );
    expect(w.stats.accuracy).toBe(0);
    expect(w.weight_kg).toBeCloseTo(1.0);
    expect(w.affixes).toEqual([]);
  });

  it("commutativity: порядок частей не влияет на результат", () => {
    const partsA = [
      part("pm_frame", { damage_min: 1, damage_max: 3, durability_max: 5 }),
      part("pm_slide", { damage_min: 2, damage_max: 4, durability_max: 7 }),
      part("pm_magazine", { damage_min: 0, damage_max: 1, durability_max: 3 }),
    ];
    const partsB = [partsA[2], partsA[0], partsA[1]].filter(
      (p): p is ComponentItem => p !== undefined,
    );
    const w1 = assembleWeapon(partsA, "wi_x");
    const w2 = assembleWeapon(partsB, "wi_x");
    expect(w2.stats).toEqual(w1.stats);
    expect(w2.durability_max).toBe(w1.durability_max);
    expect(w2.durability_current).toBe(w1.durability_current);
  });

  it("determinism: один и тот же ввод → один и тот же результат", () => {
    const parts = [
      part("pm_frame", { damage_min: 1, damage_max: 2, durability_max: 5 }),
      part("pm_slide", { damage_min: 2, damage_max: 3, durability_max: 5 }),
    ];
    const w1 = assembleWeapon(parts, "wi_det");
    const w2 = assembleWeapon(parts, "wi_det");
    expect(w2).toEqual(w1);
  });

  it("пустые stats у партов — суммируются как нули", () => {
    const w = assembleWeapon(
      [
        part("pm_frame", {}),
        part("pm_slide", {}),
        part("pm_magazine", { damage_min: 1, damage_max: 2 }),
      ],
      "wi_empty",
    );
    expect(w.stats.damage_min).toBe(1);
    expect(w.stats.damage_max).toBe(2);
    expect(w.durability_max).toBe(0);
  });

  it("floor damage_min ≥ 0: отрицательная сумма обнуляется", () => {
    const w = assembleWeapon(
      [
        part("pm_frame", { damage_min: 1, damage_max: 5 }),
        part("pm_slide", { damage_min: -10, damage_max: 0 }),
      ],
      "wi_neg",
    );
    expect(w.stats.damage_min).toBe(0);
    expect(w.stats.damage_max).toBe(5);
  });

  it("clamp damage_max ≥ damage_min: inverted range не пропускается", () => {
    const w = assembleWeapon(
      [part("pm_frame", { damage_min: 10, damage_max: 2 })],
      "wi_inv",
    );
    expect(w.stats.damage_min).toBe(10);
    expect(w.stats.damage_max).toBe(10);
  });
});

describe("assembleWeapon — throws AssemblyError на invalid input (PR-6b-2)", () => {
  it("пустой parts → AssemblyError empty_parts (контракт сменился: бросает, не возвращает 0-инстанс)", () => {
    let caught: unknown;
    try {
      assembleWeapon([], "wi_zero");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(AssemblyError);
    expect((caught as AssemblyError).reason).toBe("empty_parts");
  });

  it("дубликат → throws duplicate_part", () => {
    let caught: unknown;
    try {
      assembleWeapon(
        [part("pm_frame", {}), part("pm_frame", {})],
        "wi_dup",
      );
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(AssemblyError);
    expect((caught as AssemblyError).reason).toBe("duplicate_part");
  });

  it("без структурного парта → throws no_structural_part", () => {
    let caught: unknown;
    try {
      assembleWeapon(
        [part("mod_pbs1", {}), part("mod_optic_4x", {})],
        "wi_no_struct",
      );
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(AssemblyError);
    expect((caught as AssemblyError).reason).toBe("no_structural_part");
  });
});

describe("nextWeaponInstanceId", () => {
  it("идентификатор детерминирован для seeded rng", () => {
    const rngA = () => 0.5;
    const rngB = () => 0.5;
    expect(nextWeaponInstanceId(rngA)).toBe(nextWeaponInstanceId(rngB));
  });

  it("разный rng → разные id", () => {
    const a = nextWeaponInstanceId(() => 0.1);
    const b = nextWeaponInstanceId(() => 0.9);
    expect(a).not.toBe(b);
  });

  it("формат wi_<7+ alphanum>", () => {
    const id = nextWeaponInstanceId(() => 0.42);
    expect(id).toMatch(/^wi_[a-z0-9]{7,}$/);
  });
});
