import { describe, expect, test } from "vitest";
import { applyPassivesToHero } from "../heroPassives";
import type { HeroSnapshot } from "../../types/sortie";
import type { PassiveEffectsBundle } from "../../types/skillNode";

const hero = (over: Partial<HeroSnapshot> = {}): HeroSnapshot => ({
  hp: 80,
  hp_max: 100,
  level: 3,
  weapon_damage_avg: 10,
  weapon_accuracy: 0.2,
  weapon_weight: 2,
  armor_reduction: 0.4,
  skill_combat: 1,
  injuries: [],
  ...over,
});

const bundle = (over: Partial<PassiveEffectsBundle> = {}): PassiveEffectsBundle =>
  ({
    hp_max_bonus: 0,
    max_weight_kg_bonus: 0,
    accuracy_bonus: 0,
    crit_chance_bonus: 0,
    damage_mul: 1,
    defense_mul: 1,
    heal_efficiency_mul: 1,
    loot_quantity_mul: 1,
    death_save_per_combat: 0,
    ...over,
  }) as unknown as PassiveEffectsBundle;

describe("applyPassivesToHero", () => {
  test("neutral bundle leaves the snapshot bit-for-bit", () => {
    const h = hero();
    expect(applyPassivesToHero(h, bundle())).toEqual(h);
  });

  test("accuracy is additive, damage is multiplicative", () => {
    const out = applyPassivesToHero(hero(), bundle({ accuracy_bonus: 0.15, damage_mul: 1.5 }));
    expect(out.weapon_accuracy).toBeCloseTo(0.35, 5);
    expect(out.weapon_damage_avg).toBeCloseTo(15, 5);
  });

  test("defense_mul scales armor_reduction, clamped to 0.9", () => {
    expect(applyPassivesToHero(hero({ armor_reduction: 0.5 }), bundle({ defense_mul: 1.4 })).armor_reduction).toBeCloseTo(0.7, 5);
    // 0.8 * 1.5 = 1.2 → clamp 0.9
    expect(applyPassivesToHero(hero({ armor_reduction: 0.8 }), bundle({ defense_mul: 1.5 })).armor_reduction).toBe(0.9);
  });

  test("does not touch hp_max (already persisted in PR1) or other fields", () => {
    const out = applyPassivesToHero(hero(), bundle({ hp_max_bonus: 50, damage_mul: 2 }));
    expect(out.hp_max).toBe(100);
    expect(out.hp).toBe(80);
    expect(out.level).toBe(3);
  });
});
