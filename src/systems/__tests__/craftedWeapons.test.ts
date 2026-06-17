import { describe, it, expect } from "vitest";
import { sortInstancesForDisplay, canEquipInstance } from "../craftedWeapons";
import type { WeaponInstance } from "../weaponAssembly";

const mk = (id: string, durability_current = 10): WeaponInstance => ({
  id,
  name_ru: id,
  slot: "action",
  stats: { damage_min: 1, damage_max: 2 },
  durability_max: 10,
  durability_current,
  parts: [],
});

describe("sortInstancesForDisplay", () => {
  it("returns [] for empty input", () => {
    expect(sortInstancesForDisplay([], null)).toEqual([]);
  });

  it("orders newest→oldest by ARRAY ORDER, not by inst.id (D6 anchor)", () => {
    // Якорь D6: id `wi_<random36>` не несёт timestamp. Порядок вставки
    // (append = newest last) — единственный источник «новизны». Подобраны
    // id так, что любая сортировка по inst.id (asc ИЛИ desc) ИЛИ забытый
    // reverse дадут результат, отличный от ожидаемого.
    //   insertion (oldest→newest): wi_m, wi_z, wi_a
    const input = [mk("wi_m"), mk("wi_z"), mk("wi_a")];
    const out = sortInstancesForDisplay(input, null).map((w) => w.id);
    expect(out).toEqual(["wi_a", "wi_z", "wi_m"]); // reverse of array (newest first)
    // защита от ложно-зелёного: ни один лексикографический порядок не совпадает
    expect(out).not.toEqual(["wi_a", "wi_m", "wi_z"]); // НЕ lexicographic asc
    expect(out).not.toEqual(["wi_z", "wi_m", "wi_a"]); // НЕ lexicographic desc
    expect(out).not.toEqual(["wi_m", "wi_z", "wi_a"]); // НЕ array-as-is (forgot reverse)
  });

  it("floats equipped to front, rest stay newest→oldest", () => {
    // insertion: wi_a(oldest), wi_b, wi_c(newest); экипирован самый старый
    const input = [mk("wi_a"), mk("wi_b"), mk("wi_c")];
    const out = sortInstancesForDisplay(input, "wi_a").map((w) => w.id);
    expect(out).toEqual(["wi_a", "wi_c", "wi_b"]);
  });

  it("ignores equippedId that is not in the list", () => {
    const input = [mk("wi_a"), mk("wi_b")];
    const out = sortInstancesForDisplay(input, "wi_zzz").map((w) => w.id);
    expect(out).toEqual(["wi_b", "wi_a"]);
  });

  it("does not mutate the input array", () => {
    const input = [mk("wi_a"), mk("wi_b")];
    sortInstancesForDisplay(input, "wi_b");
    expect(input.map((w) => w.id)).toEqual(["wi_a", "wi_b"]);
  });
});

describe("canEquipInstance", () => {
  it("true when durability_current > 0", () => {
    expect(canEquipInstance(mk("wi_a", 5))).toBe(true);
  });

  it("false when broken (durability_current === 0)", () => {
    expect(canEquipInstance(mk("wi_a", 0))).toBe(false);
  });
});
