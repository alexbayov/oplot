import { describe, expect, test, beforeEach } from "vitest";
import {
  onCraftWeaponBreak,
  onDropWeaponBreak,
  damageWeapon,
} from "../durability";
import { setM11Items, clearRegistry, createWeaponInstance } from "../../state/ItemRegistry";
import type {
  CraftWeapon,
  DropWeapon,
  WeaponPart,
} from "../../types/items";

const craftKnife: CraftWeapon = {
  id: "craft_knife",
  itemClass: "craft",
  tier: 1,
  name_real_ru: "Нож",
  name_generic_ru: "Нож",
  weight_kg: 0.4,
  description_ru: "",
  damageMin: 3,
  damageMax: 5,
  noise: "silent",
  durability: 50,
  breaksInto: "broken_craft_knife",
  caliber: "melee",
};

const pm: DropWeapon = {
  id: "pistol_t2_pm",
  itemClass: "drop",
  tier: 2,
  name_real_ru: "ПМ",
  name_generic_ru: "9-мм пистолет",
  weight_kg: 0.7,
  description_ru: "",
  damageMin: 5,
  damageMax: 6,
  noise: "high",
  caliber: "9x18",
  magazineSize: 8,
  partIds: ["pm_frame", "pm_slide", "pm_magazine"],
  modSlots: ["muzzle", "magazine"],
};

const pmParts: WeaponPart[] = ["pm_frame", "pm_slide", "pm_magazine"].map(
  (id) => ({
    id,
    itemClass: "part",
    tier: 2,
    name_real_ru: id,
    name_generic_ru: id,
    weight_kg: 0.1,
    description_ru: "",
    weaponId: "pistol_t2_pm",
    slot: id,
  }),
);

beforeEach(() => {
  clearRegistry();
  setM11Items([craftKnife, pm, ...pmParts]);
});

describe("durability", () => {
  test("onCraftWeaponBreak adds broken_craft to inventory", () => {
    const inventory = [{ item_id: "craft_knife", count: 1 }];
    const result = onCraftWeaponBreak("craft_knife", inventory);
    expect(result).not.toBeNull();
    expect(result?.brokenItemId).toBe("broken_craft_knife");
    expect(
      result?.inventory.find((s) => s.item_id === "broken_craft_knife")?.count,
    ).toBe(1);
  });

  test("onCraftWeaponBreak returns null for non-craft items", () => {
    const inventory: { item_id: string; count: number }[] = [];
    const result = onCraftWeaponBreak("pistol_t2_pm", inventory);
    expect(result).toBeNull();
  });

  test("onDropWeaponBreak returns ~30% parts deterministically", () => {
    const inst = createWeaponInstance("pistol_t2_pm", pmParts, () => 0.5) ?? (() => { throw new Error("expected instance"); })();
    // rng=0.1 → 0.1 < 0.3 → каждая часть возвращается (100% в этом тесте)
    const result = onDropWeaponBreak(inst, [], () => 0.1);
    expect(result).not.toBeNull();
    expect(result?.returnedParts.length).toBe(3);

    // rng=0.9 → 0.9 >= 0.3 → ни одна часть не возвращается
    const noneReturned = onDropWeaponBreak(inst, [], () => 0.9);
    expect(noneReturned?.returnedParts.length).toBe(0);
  });

  test("damageWeapon decrements durability and signals break at 0", () => {
    const inst = createWeaponInstance("pistol_t2_pm", pmParts, () => 0.5) ?? (() => { throw new Error("expected instance"); })();
    expect(inst.durability).toBe(100);

    const { instance: dmg1, broken: b1 } = damageWeapon(inst, 30);
    expect(dmg1.durability).toBe(70);
    expect(b1).toBe(false);

    const { instance: dmg2, broken: b2 } = damageWeapon(dmg1, 100);
    expect(dmg2.durability).toBe(0);
    expect(b2).toBe(true);
  });
});
