import { describe, expect, test, beforeEach } from "vitest";
import {
  setM11Items,
  clearRegistry,
  getItem,
  itemName,
  createWeaponInstance,
  installMod,
  removeMod,
  computeWeaponStats,
  adaptLegacyItem,
} from "../ItemRegistry";
import { isWeaponInstance } from "../../types/items";
import type {
  CraftWeapon,
  DropWeapon,
  WeaponMod,
  WeaponPart,
} from "../../types/items";
import type { Item as LegacyItem } from "../../types";

const sampleCraft: CraftWeapon = {
  id: "craft_knife",
  itemClass: "craft",
  tier: 1,
  name_real_ru: "Кухонный нож",
  name_generic_ru: "Самодельный нож",
  weight_kg: 0.4,
  description_ru: "Острый.",
  damageMin: 3,
  damageMax: 5,
  noise: "silent",
  durability: 50,
  breaksInto: "broken_craft_knife",
  caliber: "melee",
};

const samplePM: DropWeapon = {
  id: "pistol_t2_pm",
  itemClass: "drop",
  tier: 2,
  name_real_ru: "Пистолет Макарова",
  name_generic_ru: "9-мм пистолет",
  weight_kg: 0.7,
  description_ru: "Компактный, надёжный.",
  damageMin: 5,
  damageMax: 6,
  noise: "high",
  caliber: "9x18",
  magazineSize: 8,
  partIds: ["pm_frame", "pm_slide", "pm_magazine"],
  modSlots: ["muzzle", "magazine"],
};

const sampleParts: WeaponPart[] = ["pm_frame", "pm_slide", "pm_magazine"].map(
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

const sampleSuppressor: WeaponMod = {
  id: "mod_suppressor_9x18",
  itemClass: "mod",
  tier: 3,
  name_real_ru: "Глушитель ПБС-1",
  name_generic_ru: "Глушитель",
  weight_kg: 0.2,
  description_ru: "Тише, но слабее.",
  slot: "muzzle",
  caliberWhitelist: ["9x18"],
  effects: { damageDelta: -1, noiseSet: "silent" },
  removalBreakChance: 0.2,
};

beforeEach(() => {
  clearRegistry();
  setM11Items([sampleCraft, samplePM, sampleSuppressor, ...sampleParts]);
});

describe("ItemRegistry", () => {
  test("getItem returns registered M11 items", () => {
    const pm = getItem("pistol_t2_pm");
    expect(pm).not.toBeNull();
    expect(pm?.itemClass).toBe("drop");
  });

  test("getItem returns null for unknown ID", () => {
    expect(getItem("nonexistent")).toBeNull();
  });

  test("itemName uses generic release-safe name by default", async () => {
    // Release default is generic to avoid real TM names on Yandex Games.
    expect(itemName(samplePM)).toBe("9-мм пистолет");
  });

  test("itemName falls back to safe generic text when generic name is missing", () => {
    const missingGeneric = { ...samplePM, name_generic_ru: "" };
    expect(itemName(missingGeneric)).toBe("Оружие T2");
    expect(itemName(missingGeneric)).not.toContain("Пистолет Макарова");
  });

  test("createWeaponInstance requires all parts", () => {
    const rng = () => 0.5;
    const onlyTwo = sampleParts.slice(0, 2);
    expect(createWeaponInstance("pistol_t2_pm", onlyTwo, rng)).toBeNull();
  });

  test("createWeaponInstance builds valid instance with all parts", () => {
    const rng = () => 0.5;
    const inst = createWeaponInstance("pistol_t2_pm", sampleParts, rng);
    expect(inst).not.toBeNull();
    expect(isWeaponInstance(inst)).toBe(true);
    expect(inst?.itemId).toBe("pistol_t2_pm");
    expect(inst?.maxDurability).toBe(100); // 50 + 2*25
    expect(inst?.durability).toBe(100);
    expect(inst?.mods).toEqual({});
  });

  test("installMod attaches mod to correct slot", () => {
    const inst = createWeaponInstance("pistol_t2_pm", sampleParts, () => 0.5) ?? (() => { throw new Error("expected instance"); })();
    const { instance, replaced } = installMod(inst, "mod_suppressor_9x18");
    expect(replaced).toBeUndefined();
    expect(instance.mods.muzzle).toBe("mod_suppressor_9x18");
  });

  test("installMod rejects wrong caliber", () => {
    const wrongCaliberMod: WeaponMod = {
      ...sampleSuppressor,
      id: "mod_762_suppressor",
      caliberWhitelist: ["7.62x39"],
    };
    setM11Items([sampleCraft, samplePM, wrongCaliberMod, ...sampleParts]);
    const inst = createWeaponInstance("pistol_t2_pm", sampleParts, () => 0.5) ?? (() => { throw new Error("expected instance"); })();
    const { instance, replaced } = installMod(inst, "mod_762_suppressor");
    expect(replaced).toBeUndefined();
    expect(instance.mods.muzzle).toBeUndefined();
  });

  test("removeMod returns mod with break chance", () => {
    const inst = createWeaponInstance("pistol_t2_pm", sampleParts, () => 0.5) ?? (() => { throw new Error("expected instance"); })();
    const { instance: withMod } = installMod(inst, "mod_suppressor_9x18");

    // rng returning 0.5 → 0.5 >= 0.2 → modSurvived = true
    const result = removeMod(withMod, "muzzle", () => 0.5);
    expect(result.modSurvived).toBe(true);
    expect(result.modId).toBe("mod_suppressor_9x18");
    expect(result.instance.mods.muzzle).toBeUndefined();

    // rng returning 0.05 → 0.05 < 0.2 → modSurvived = false (broken on removal)
    const broken = removeMod(withMod, "muzzle", () => 0.05);
    expect(broken.modSurvived).toBe(false);
  });

  test("computeWeaponStats applies mod effects", () => {
    const inst = createWeaponInstance("pistol_t2_pm", sampleParts, () => 0.5) ?? (() => { throw new Error("expected instance"); })();
    const { instance: withMod } = installMod(inst, "mod_suppressor_9x18");

    const stats = computeWeaponStats(withMod);
    expect(stats).not.toBeNull();
    expect(stats?.damageMin).toBe(4); // 5 - 1
    expect(stats?.damageMax).toBe(5); // 6 - 1
    expect(stats?.noise).toBe("silent");
  });

  test("adapted legacy weapon without generic name uses safe fallback", () => {
    const legacy: LegacyItem = {
      id: "legacy_pm",
      name_ru: "ПМ",
      type: "weapon_melee",
      tier: 2,
      zone_origin: "forest",
      weight_kg: 0.7,
      description_ru: "Legacy weapon without name_generic_ru.",
      flavor_ru: "",
      recipe_id: null,
      stats: {
        damage_min: 4,
        damage_max: 6,
        attack_speed: 1,
        noise: "high",
      },
    };
    const adapted = adaptLegacyItem(legacy);
    expect(itemName(adapted)).toBe("Оружие T2");
    expect(itemName(adapted)).not.toContain("ПМ");
  });

  test("adaptLegacyItem converts legacy weapon to CraftWeapon", () => {
    const legacy: LegacyItem = {
      id: "knife",
      name_ru: "Кухонный нож",
      type: "weapon_melee",
      tier: 1,
      zone_origin: "forest",
      weight_kg: 0.4,
      description_ru: "Острый.",
      flavor_ru: "",
      recipe_id: null,
      stats: {
        damage_min: 3,
        damage_max: 5,
        attack_speed: 1,
        noise: "low",
      },
    };
    const adapted = adaptLegacyItem(legacy);
    expect(adapted.itemClass).toBe("craft");
    expect((adapted as CraftWeapon).damageMin).toBe(3);
    expect((adapted as CraftWeapon).damageMax).toBe(5);
    expect((adapted as CraftWeapon).caliber).toBe("melee");
  });
});
