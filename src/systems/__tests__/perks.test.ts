import { computePerkModifiers, hasPerk, pickRandomPerks } from "../perks";
import type { Perk } from "../../types";
import { describe, it, expect } from "vitest";

const P = {
  tough_skin: { id: "tough_skin", name: "Закалённая кожа", description: "+15 HP", type: "additive" as const, stat: "hp_max" as const, value: 15 },
  sharp_blade: { id: "sharp_blade", name: "Острое лезвие", description: "+15% dmg", type: "multiplicative" as const, stat: "damage" as const, value: 1.15 },
  lean_pack: { id: "lean_pack", name: "Лёгкая сумка", description: "-15% weight", type: "multiplicative" as const, stat: "weight_penalty_multiplier" as const, value: 0.85 },
  lucky_scavenger: { id: "lucky_scavenger", name: "Удачливый", description: "+20% loot", type: "multiplicative" as const, stat: "loot_quantity_multiplier" as const, value: 1.20 },
  keen_eye: { id: "keen_eye", name: "Острый глаз", description: "+5% crit", type: "additive" as const, stat: "crit_chance" as const, value: 0.05 },
  reinforced_plates: { id: "reinforced_plates", name: "Усиленные", description: "+15% armor", type: "multiplicative" as const, stat: "armor_efficiency" as const, value: 1.15 },
  quick_hands: { id: "quick_hands", name: "Быстрые руки", description: "-10% craft", type: "multiplicative" as const, stat: "crafting_speed_multiplier" as const, value: 0.90 },
  fast_learner: { id: "fast_learner", name: "Быстрая обучаемость", description: "+15% xp", type: "multiplicative" as const, stat: "xp_gain_multiplier" as const, value: 1.15 },
};

const ALL: Perk[] = Object.values(P);

describe("computePerkModifiers", () => {
  it("returns defaults for empty perks", () => {
    const m = computePerkModifiers([]);
    expect(m.hp_max_additive).toBe(0);
    expect(m.damage_multiplier).toBe(1.0);
    expect(m.xp_gain_multiplier).toBe(1.0);
  });

  it("stacks additive hp_max", () => {
    const m = computePerkModifiers([P.tough_skin]);
    expect(m.hp_max_additive).toBe(15);
  });

  it("applies multiplicative damage", () => {
    const m = computePerkModifiers([P.sharp_blade]);
    expect(m.damage_multiplier).toBeCloseTo(1.15);
  });

  it("applies weight penalty reduction", () => {
    const m = computePerkModifiers([P.lean_pack]);
    expect(m.weight_penalty_multiplier).toBeCloseTo(0.85);
  });

  it("applies loot quantity bonus", () => {
    const m = computePerkModifiers([P.lucky_scavenger]);
    expect(m.loot_quantity_multiplier).toBeCloseTo(1.20);
  });

  it("stacks additive crit_chance", () => {
    const m = computePerkModifiers([P.keen_eye]);
    expect(m.crit_chance_additive).toBeCloseTo(0.05);
  });

  it("applies armor efficiency", () => {
    const m = computePerkModifiers([P.reinforced_plates]);
    expect(m.armor_efficiency_multiplier).toBeCloseTo(1.15);
  });

  it("applies crafting speed", () => {
    const m = computePerkModifiers([P.quick_hands]);
    expect(m.crafting_speed_multiplier).toBeCloseTo(0.90);
  });

  it("applies xp gain multiplier", () => {
    const m = computePerkModifiers([P.fast_learner]);
    expect(m.xp_gain_multiplier).toBeCloseTo(1.15);
  });

  it("stacks multiple multiplicative perks", () => {
    const m = computePerkModifiers([P.sharp_blade, P.fast_learner]);
    expect(m.damage_multiplier).toBeCloseTo(1.15);
    expect(m.xp_gain_multiplier).toBeCloseTo(1.15);
  });
});

describe("hasPerk", () => {
  it("returns false when perk not owned", () => {
    expect(hasPerk([], "tough_skin")).toBe(false);
  });

  it("returns true when perk owned", () => {
    expect(hasPerk([P.tough_skin], "tough_skin")).toBe(true);
  });
});

describe("pickRandomPerks", () => {
  it("returns empty when all perks owned", () => {
    const result = pickRandomPerks(ALL, ALL, 3);
    expect(result).toHaveLength(0);
  });

  it("returns up to count perks", () => {
    const result = pickRandomPerks(ALL, [], 3);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("returns only unowned perks", () => {
    const owned = [P.tough_skin];
    const result = pickRandomPerks(ALL, owned, 3);
    expect(result.every((p) => p.id !== "tough_skin")).toBe(true);
  });
});
