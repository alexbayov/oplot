import { describe, it, expect } from "vitest";
import {
  sortInstancesForDisplay,
  canEquipInstance,
  disassembleInstance,
} from "../craftedWeapons";
import { assembleFromStash } from "../assemblyFlow";
import { countInStacks } from "../../state/GameState";
import { HERO_START_WEAPON_ID } from "../../state/balance";
import type { WeaponInstance } from "../weaponAssembly";
import type { ComponentItem } from "../../types";
import type { EquippedWeapon, InventoryStack } from "../../state/types";

const mk = (
  id: string,
  durability_current = 10,
  parts: string[] = [],
): WeaponInstance => ({
  id,
  name_ru: id,
  slot: "action",
  stats: { damage_min: 1, damage_max: 2 },
  durability_max: 10,
  durability_current,
  parts,
});

const part = (id: string): ComponentItem => ({
  kind: "component",
  id,
  name_ru: id,
  tier: 1,
  weight_kg: 0.5,
  zone_origin: "test",
  description_ru: "",
  recipe_id: null,
  fits: "weapon",
  stats: { damage_min: 1, damage_max: 2, durability_max: 5 },
});

const seedRng = (seed = 0.5): (() => number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

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

describe("disassembleInstance — M14-PR3 (B)", () => {
  it("возвращает части в пустой склад (новый стек на каждую часть)", () => {
    const inst = mk("wi_a", 10, ["pm_frame", "pm_slide"]);
    const r = disassembleInstance("wi_a", [inst], [], null);
    expect(countInStacks(r.baseStash, "pm_frame")).toBe(1);
    expect(countInStacks(r.baseStash, "pm_slide")).toBe(1);
  });

  it("мёрджит в существующий стек (count += 1, не плодит дубль-стек)", () => {
    const inst = mk("wi_a", 10, ["pm_frame"]);
    const stash: InventoryStack[] = [{ item_id: "pm_frame", count: 2 }];
    const r = disassembleInstance("wi_a", [inst], stash, null);
    expect(countInStacks(r.baseStash, "pm_frame")).toBe(3);
    expect(r.baseStash.filter((s) => s.item_id === "pm_frame")).toHaveLength(1);
  });

  it("multi-part: дубликаты id суммируются по count", () => {
    // parts может содержать один id дважды (теоретически) — каждый +1.
    const inst = mk("wi_a", 10, ["mod_grip", "mod_grip", "pm_frame"]);
    const r = disassembleInstance("wi_a", [inst], [], null);
    expect(countInStacks(r.baseStash, "mod_grip")).toBe(2);
    expect(countInStacks(r.baseStash, "pm_frame")).toBe(1);
    expect(r.returned_parts).toEqual(["mod_grip", "mod_grip", "pm_frame"]);
  });

  it("удаляет инстанс из crafted_weapons (остальные нетронуты)", () => {
    const a = mk("wi_a", 10, ["pm_frame"]);
    const b = mk("wi_b", 10, ["tt_frame"]);
    const r = disassembleInstance("wi_a", [a, b], [], null);
    expect(r.crafted_weapons.map((w) => w.id)).toEqual(["wi_b"]);
  });

  it("D4: экипированный crafted → equipped падает в catalog craft_knife", () => {
    const inst = mk("wi_a", 10, ["pm_frame"]);
    const eq: EquippedWeapon = { kind: "crafted", id: "wi_a" };
    const r = disassembleInstance("wi_a", [inst], [], eq);
    expect(r.was_equipped).toBe(true);
    expect(r.equipped_weapon).toEqual({ kind: "catalog", id: HERO_START_WEAPON_ID });
  });

  it("НЕ-экипированный инстанс → equipped нетронут, was_equipped=false", () => {
    const a = mk("wi_a", 10, ["pm_frame"]);
    const b = mk("wi_b", 10, ["tt_frame"]);
    const eq: EquippedWeapon = { kind: "crafted", id: "wi_b" };
    const r = disassembleInstance("wi_a", [a, b], [], eq);
    expect(r.was_equipped).toBe(false);
    expect(r.equipped_weapon).toEqual(eq);
  });

  it("catalog-экипировка (не crafted) → equipped нетронут", () => {
    const inst = mk("wi_a", 10, ["pm_frame"]);
    const eq: EquippedWeapon = { kind: "catalog", id: "ak74" };
    const r = disassembleInstance("wi_a", [inst], [], eq);
    expect(r.was_equipped).toBe(false);
    expect(r.equipped_weapon).toEqual(eq);
  });

  it("D3: сломанный (durability 0) разбирается и возвращает ВСЕ части", () => {
    const inst = mk("wi_a", 0, ["pm_frame", "pm_slide"]);
    const r = disassembleInstance("wi_a", [inst], [], null);
    expect(r.crafted_weapons).toHaveLength(0);
    expect(countInStacks(r.baseStash, "pm_frame")).toBe(1);
    expect(countInStacks(r.baseStash, "pm_slide")).toBe(1);
  });

  it("forward-compat: deprecated part-id (нет в items.json) безопасно создаёт стек, не бросает", () => {
    // QA-кейс Алекса: старый сейв, parts менялись между релизами.
    // `addToStack` — чистая data-операция, каталог не валидирует.
    const inst = mk("wi_a", 10, ["legacy_removed_part", "pm_frame"]);
    const r = disassembleInstance("wi_a", [inst], [], null);
    expect(countInStacks(r.baseStash, "legacy_removed_part")).toBe(1);
    expect(countInStacks(r.baseStash, "pm_frame")).toBe(1);
  });

  it("defensive: неизвестный instanceId → no-op (входы возвращены, returned_parts пуст)", () => {
    const inst = mk("wi_a", 10, ["pm_frame"]);
    const stash: InventoryStack[] = [{ item_id: "bandage", count: 2 }];
    const eq: EquippedWeapon = { kind: "crafted", id: "wi_a" };
    const r = disassembleInstance("wi_missing", [inst], stash, eq);
    expect(r.crafted_weapons.map((w) => w.id)).toEqual(["wi_a"]);
    expect(r.baseStash).toEqual(stash);
    expect(r.equipped_weapon).toEqual(eq);
    expect(r.returned_parts).toEqual([]);
    expect(r.was_equipped).toBe(false);
  });

  it("не мутирует входные массивы (crafted_weapons, baseStash)", () => {
    const inst = mk("wi_a", 10, ["pm_frame"]);
    const crafted = [inst];
    const stash: InventoryStack[] = [{ item_id: "pm_frame", count: 1 }];
    const craftedSnap = JSON.parse(JSON.stringify(crafted));
    const stashSnap = JSON.parse(JSON.stringify(stash));
    disassembleInstance("wi_a", crafted, stash, null);
    expect(crafted).toEqual(craftedSnap);
    expect(stash).toEqual(stashSnap);
  });

  it("round-trip: assembleFromStash → disassembleInstance восстанавливает counts (anchor)", () => {
    // Зеркальный инвариант: consume(remove) затем return(add) → каждый
    // part-id возвращается к исходному count. Сверка через countInStacks,
    // НЕ массив целиком (assemble может схлопнуть стек в 0 → выпасть, а
    // disassemble создаст новый в конце — порядок/структура разойдутся).
    const original: InventoryStack[] = [
      { item_id: "pm_frame", count: 2 },
      { item_id: "pm_slide", count: 1 },
      { item_id: "mod_grip", count: 3 },
      { item_id: "bandage", count: 5 },
    ];
    const parts = [part("pm_frame"), part("pm_slide"), part("mod_grip")];
    const { instance, nextStash } = assembleFromStash(parts, original, seedRng());
    // sanity: сборка действительно списала по 1
    expect(countInStacks(nextStash, "pm_frame")).toBe(1);
    expect(countInStacks(nextStash, "pm_slide")).toBe(0);
    expect(countInStacks(nextStash, "mod_grip")).toBe(2);

    const r = disassembleInstance(instance.id, [instance], nextStash, null);
    for (const id of ["pm_frame", "pm_slide", "mod_grip", "bandage"]) {
      expect(countInStacks(r.baseStash, id)).toBe(countInStacks(original, id));
    }
  });
});
