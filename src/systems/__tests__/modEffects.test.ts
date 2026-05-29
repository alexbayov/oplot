import { describe, expect, test, beforeEach } from "vitest";
import { aggregateModEffects } from "../modEffects";
import { setM11Items, clearRegistry } from "../../state/ItemRegistry";
import type { DropWeapon, WeaponMod, WeaponInstance } from "../../types/items";

const pm: DropWeapon = {
  id: "pm", itemClass: "drop", tier: 2,
  name_real_ru: "ПМ", name_generic_ru: "Пистолет T2",
  caliber: "9x18", damageMin: 5, damageMax: 7, description_ru: "ПМ",
  noise: "high", magazineSize: 8,
weight_kg: 0.8,
  partIds: [], modSlots: ["muzzle", "optic", "magazine"],
};

const pbs: WeaponMod = {
  id: "mod_pbs", itemClass: "mod", tier: 2,
  name_real_ru: "ПБС", name_generic_ru: "Глушитель",
  slot: "muzzle", caliberWhitelist: ["9x18"],
  effects: { damageDelta: -1, noiseSet: "silent" }, description_ru: "ПБС глушитель",
  removalBreakChance: 0.2, weight_kg: 0.2,
};

const scope: WeaponMod = {
  id: "mod_scope", itemClass: "mod", tier: 2,
  name_real_ru: "Прицел", name_generic_ru: "Прицел",
  slot: "optic", caliberWhitelist: ["9x18"],
  effects: { accuracyDelta: 0.2 }, description_ru: "Прицел",
  removalBreakChance: 0.2, weight_kg: 0.15,
};

const extMag: WeaponMod = {
  id: "mod_mag", itemClass: "mod", tier: 2,
  name_real_ru: "Расш.магазин", name_generic_ru: "Магазин",
  slot: "magazine", caliberWhitelist: ["9x18"],
  effects: { magazineDelta: 5 }, description_ru: "Расширенный магазин",
  removalBreakChance: 0.2, weight_kg: 0.1,
};

const baseInstance = (mods: WeaponInstance["mods"] = {}): WeaponInstance => ({
  instanceId: "inst1",
  itemId: "pm",
  durability: 100,
  maxDurability: 100,
  mods,
});

describe("aggregateModEffects", () => {
  beforeEach(() => {
    clearRegistry();
    setM11Items([pm, pbs, scope, extMag]);
  });

  test("null instance → empty effects", () => {
    const e = aggregateModEffects(null);
    expect(e.damageDelta).toBe(0);
    expect(e.noiseOverride).toBeNull();
  });

  test("no mods installed → empty effects", () => {
    const e = aggregateModEffects(baseInstance());
    expect(e.damageDelta).toBe(0);
    expect(e.magazineDelta).toBe(0);
    expect(e.accuracyDelta).toBe(0);
    expect(e.noiseOverride).toBeNull();
  });

  test("ПБС → damageDelta -1, noise silent", () => {
    const e = aggregateModEffects(baseInstance({ muzzle: "mod_pbs" }));
    expect(e.damageDelta).toBe(-1);
    expect(e.noiseOverride).toBe("silent");
  });

  test("ПБС + прицел + расш.магазин — все эффекты складываются", () => {
    const e = aggregateModEffects(baseInstance({
      muzzle: "mod_pbs",
      optic: "mod_scope",
      magazine: "mod_mag",
    }));
    expect(e.damageDelta).toBe(-1);
    expect(e.accuracyDelta).toBeCloseTo(0.2);
    expect(e.magazineDelta).toBe(5);
    expect(e.noiseOverride).toBe("silent");
  });

  test("undefined mod ID in slot — игнорируется", () => {
    const e = aggregateModEffects(baseInstance({ muzzle: undefined }));
    expect(e.damageDelta).toBe(0);
    expect(e.noiseOverride).toBeNull();
  });
});
