import { describe, expect, test } from "vitest";
import {
  applyAttack,
  calcDefenseAgainst,
  calcFinalDamage,
  calcHeroInitiative,
  chooseMobAction,
  randomUniform,
  rollDamageMultiplier,
  rollWeaponDamage,
} from "../combat";
import {
  COVER_DEFENSE_BONUS_PCT,
  DAMAGE_ROLL_MAX,
  DAMAGE_ROLL_MIN,
  MIN_DAMAGE_FLOOR,
  WEIGHT_INITIATIVE_PENALTY,
} from "../../state/balance";
import { constantRng, mob, sequenceRng } from "./_helpers";
import type { ArmorStats } from "../../types";

describe("randomUniform", () => {
  test("returns lower bound when rng returns 0", () => {
    expect(randomUniform(2, 10, constantRng(0))).toBe(2);
  });

  test("returns upper bound when rng approaches 1", () => {
    expect(randomUniform(2, 10, constantRng(1))).toBe(10);
  });
});

describe("rollWeaponDamage / rollDamageMultiplier", () => {
  test("weapon damage stays within [min, max]", () => {
    const rng = sequenceRng([0, 0.5, 1]);
    expect(rollWeaponDamage(4, 7, rng)).toBe(4);
    expect(rollWeaponDamage(4, 7, rng)).toBe(5.5);
    expect(rollWeaponDamage(4, 7, rng)).toBe(7);
  });

  test("multiplier stays within DAMAGE_ROLL_MIN..MAX", () => {
    expect(rollDamageMultiplier(constantRng(0))).toBeCloseTo(DAMAGE_ROLL_MIN);
    expect(rollDamageMultiplier(constantRng(1))).toBeCloseTo(DAMAGE_ROLL_MAX);
  });
});

describe("calcHeroInitiative", () => {
  test("no weight → base_speed", () => {
    expect(calcHeroInitiative(100, 0, 30)).toBe(100);
  });

  test("half weight → base - half penalty", () => {
    expect(calcHeroInitiative(100, 15, 30)).toBeCloseTo(
      100 - 0.5 * WEIGHT_INITIATIVE_PENALTY,
    );
  });

  test("full weight → base - full penalty", () => {
    expect(calcHeroInitiative(100, 30, 30)).toBeCloseTo(
      100 - WEIGHT_INITIATIVE_PENALTY,
    );
  });

  test("overweight → 0", () => {
    expect(calcHeroInitiative(100, 31, 30)).toBe(0);
  });
});

describe("calcDefenseAgainst", () => {
  const armor: ArmorStats = { defense: 4, vs_melee_bonus: 1 };

  test("no armor → 0", () => {
    expect(calcDefenseAgainst(null, "human", false)).toBe(0);
  });

  test("vs_melee_bonus applies only against animal", () => {
    expect(calcDefenseAgainst(armor, "human", false)).toBe(4);
    expect(calcDefenseAgainst(armor, "animal", false)).toBe(4 + 1);
    expect(calcDefenseAgainst(armor, "mutant", false)).toBe(4);
  });

  test("cover adds 50% of armor defense (not bonus)", () => {
    expect(calcDefenseAgainst(armor, "human", true)).toBeCloseTo(
      4 + 4 * COVER_DEFENSE_BONUS_PCT,
    );
    expect(calcDefenseAgainst(armor, "animal", true)).toBeCloseTo(
      4 + 1 + 4 * COVER_DEFENSE_BONUS_PCT,
    );
  });
});

describe("calcFinalDamage", () => {
  test("floors to MIN_DAMAGE_FLOOR when defense exceeds raw", () => {
    expect(calcFinalDamage(2, 1, 100)).toBe(MIN_DAMAGE_FLOOR);
  });

  test("normal damage subtracts defense", () => {
    expect(calcFinalDamage(6, 1, 2)).toBe(4);
  });
});

describe("applyAttack", () => {
  test("dealer hits floored damage when defense huge", () => {
    const rng = sequenceRng([0.5, 0.5]);
    const result = applyAttack({ damage_min: 2, damage_max: 4 }, 100, 50, rng);
    expect(result.damage_dealt).toBe(MIN_DAMAGE_FLOOR);
    expect(result.defender_hp_after).toBe(50 - MIN_DAMAGE_FLOOR);
    expect(result.floored).toBe(true);
  });

  test("defender_hp_after never below 0", () => {
    const rng = sequenceRng([1, 1]);
    const result = applyAttack({ damage_min: 1000, damage_max: 1000 }, 0, 10, rng);
    expect(result.defender_hp_after).toBe(0);
  });
});

describe("chooseMobAction", () => {
  test("marauder flees below 30% HP", () => {
    const m = mob("marauder", { hp: 20 });
    expect(chooseMobAction(m, 19).type).toBe("attack");
    expect(chooseMobAction(m, 5).type).toBe("flee");
  });

  test("wild_dog always attacks", () => {
    const m = mob("wild_dog", { hp: 12 });
    expect(chooseMobAction(m, 1).type).toBe("attack");
  });

  test("mutant always attacks", () => {
    const m = mob("mutant", { hp: 40 });
    expect(chooseMobAction(m, 1).type).toBe("attack");
  });
});
