import { describe, expect, it } from "vitest";
import { assembleWeapon, nextWeaponInstanceId } from "../weaponAssembly";
import type { ComponentItem } from "../../types";

const part = (
  id: string,
  contribute: { damage_min?: number; damage_max?: number; durability_max?: number },
): ComponentItem => ({
  kind: "component",
  id,
  name_ru: id,
  tier: 1,
  weight_kg: 0.5,
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
        part("frame", { damage_min: 1, damage_max: 2, durability_max: 10 }),
        part("barrel", { damage_min: 2, damage_max: 4, durability_max: 5 }),
      ],
      "wi_test1",
    );
    expect(w.stats.damage_min).toBe(3);
    expect(w.stats.damage_max).toBe(6);
    expect(w.durability_max).toBe(15);
    expect(w.durability_current).toBe(15);
    expect(w.slot).toBe("action");
    expect(w.parts).toEqual(["frame", "barrel"]);
  });

  it("commutativity: порядок частей не влияет на результат", () => {
    // Свойство которое мотивирует выбор additive (preflight 6a).
    const partsA = [
      part("a", { damage_min: 1, damage_max: 3, durability_max: 5 }),
      part("b", { damage_min: 2, damage_max: 4, durability_max: 7 }),
      part("c", { damage_min: 0, damage_max: 1, durability_max: 3 }),
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
      part("p1", { damage_min: 1, damage_max: 2, durability_max: 5 }),
      part("p2", { damage_min: 2, damage_max: 3, durability_max: 5 }),
    ];
    const w1 = assembleWeapon(parts, "wi_det");
    const w2 = assembleWeapon(parts, "wi_det");
    expect(w2).toEqual(w1);
  });

  it("пустые stats у партов — суммируются как нули", () => {
    const w = assembleWeapon(
      [
        part("empty1", {}),
        part("empty2", {}),
        part("good", { damage_min: 1, damage_max: 2 }),
      ],
      "wi_empty",
    );
    expect(w.stats.damage_min).toBe(1);
    expect(w.stats.damage_max).toBe(2);
    expect(w.durability_max).toBe(0);
  });

  it("floor damage_min ≥ 0: отрицательная сумма обнуляется", () => {
    // Гипотетический «облегчающий» парт с отрицательным damage_min,
    // компенсирующий другую часть. Если общая сумма уходит в минус —
    // floor.
    const w = assembleWeapon(
      [
        part("base", { damage_min: 1, damage_max: 5 }),
        part("strip", { damage_min: -10, damage_max: 0 }),
      ],
      "wi_neg",
    );
    expect(w.stats.damage_min).toBe(0);
    expect(w.stats.damage_max).toBe(5);
  });

  it("clamp damage_max ≥ damage_min: inverted range не пропускается", () => {
    // Защита от неконсистентных вкладов: если parts собрались так что
    // damage_max < damage_min после floor (редкая комбинация), клампим
    // max до min — иначе sortieResolve получит inverted range.
    const w = assembleWeapon(
      [
        part("big_min", { damage_min: 10, damage_max: 2 }),
      ],
      "wi_inv",
    );
    expect(w.stats.damage_min).toBe(10);
    expect(w.stats.damage_max).toBe(10);
  });

  it("пустой parts → нулевой инстанс, не throw", () => {
    const w = assembleWeapon([], "wi_zero");
    expect(w.stats).toEqual({ damage_min: 0, damage_max: 0 });
    expect(w.durability_max).toBe(0);
    expect(w.parts).toEqual([]);
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
