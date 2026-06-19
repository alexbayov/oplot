import { describe, expect, it } from "vitest";
import { SAVE_VERSION } from "../../config";
import type { ArmorItem } from "../../types";
import {
  ARMOR_AFFIX_DEFS,
  armorContribution,
  armorStatDelta,
  computeMaxWeightWithArmor,
  resolveEquippedArmor,
  type ArmorStat,
} from "../armorAffixes";

const armor = (id: string, armor_value = 0, intrinsic_affixes?: { id: string; value: number }[]): ArmorItem => ({
  kind: "armor",
  id,
  name_ru: id,
  tier: 1,
  weight_kg: 1,
  zone_origin: "universal",
  description_ru: id,
  recipe_id: null,
  flavor_ru: id,
  slot: "plate",
  stats: { armor_value },
  intrinsic_affixes,
});

describe("armorAffixes", () => {
  it("registry stats are structurally inside ArmorStat union", () => {
    const allowed = new Set<ArmorStat>(["carry_kg", "inventory_slots", "scavenge_chance", "armor_def"]);
    expect(ARMOR_AFFIX_DEFS.every((def) => allowed.has(def.stat))).toBe(true);
  });

  it("frozen value on instance wins over registry value", () => {
    expect(armorContribution([{ id: "carry_extra", value: 99 }]).carry_kg).toBe(99);
  });

  it("unknown affix id is skipped", () => {
    expect(armorContribution([{ id: "missing_affix", value: 99 }])).toEqual({
      carry_kg: 0,
      inventory_slots: 0,
      scavenge_chance: 0,
      armor_def: 0,
    });
  });

  it("resolveEquippedArmor zero-regression for armor without intrinsic affixes", () => {
    const items = { vest: armor("vest", 3) };
    expect(resolveEquippedArmor({ plate: "vest" }, items).armor_reduction).toBeCloseTo(0.3, 5);
    expect(resolveEquippedArmor({ plate: "vest" }, items).carry_kg).toBe(0);
  });

  it("more carry_kg increases max weight", () => {
    const items = { pack: armor("pack", 0, [{ id: "carry_extra", value: 3 }]) };
    expect(computeMaxWeightWithArmor(30, { plate: "pack" }, items)).toBeGreaterThan(30);
  });


  it("armorStatDelta fields match resolveEquippedArmor parity", () => {
    const items = {
      plain: armor("plain", 1),
      pack: armor("pack", 1, [{ id: "carry_extra", value: 3 }, { id: "scavenger_eye", value: 0.2 }]),
    };
    const delta = armorStatDelta(items.pack, { plate: "plain" }, items);
    const directCandidate = resolveEquippedArmor({ plate: "pack" }, items);
    const directEquipped = resolveEquippedArmor({ plate: "plain" }, items);
    expect(delta.candidate).toEqual(directCandidate);
    expect(delta.equipped).toEqual(directEquipped);
    expect(delta.delta_carry_kg).toBe(directCandidate.carry_kg - directEquipped.carry_kg);
    expect(delta.delta_scavenge_chance).toBe(directCandidate.scavenge_chance - directEquipped.scavenge_chance);
  });

  it("armorStatDelta zero affixes produce zero bonus deltas", () => {
    const items = { plain: armor("plain", 1), other: armor("other", 2) };
    const delta = armorStatDelta(items.other, { plate: "plain" }, items);
    expect(delta.delta_carry_kg).toBe(0);
    expect(delta.delta_inventory_slots).toBe(0);
    expect(delta.delta_scavenge_chance).toBe(0);
    expect(delta.delta_armor_def).toBe(0);
  });

  it("SAVE_VERSION stays pinned for schema-neutral armor pass", () => {
    expect(SAVE_VERSION).toBe(9);
  });
});
