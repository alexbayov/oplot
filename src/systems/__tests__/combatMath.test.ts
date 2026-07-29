import { describe, expect, it } from "vitest";
import {
  computeHitChance,
  formatBreakdown,
  rollDamage,
  rollHit,
} from "../systems/combatMath";

describe("combatMath R2", () => {
  it("base torso open field ~ skill 5 weapon +5", () => {
    const b = computeHitChance({
      marksmanship: 5,
      weaponAccuracyMod: 5,
      distance: 4,
      optRange: 12,
      cover: "none",
      bodyPart: "torso",
    });
    expect(b.hitChance).toBe(80);
  });

  it("full cover and head aim drop chance hard", () => {
    const b = computeHitChance({
      marksmanship: 3,
      weaponAccuracyMod: 5,
      distance: 10,
      optRange: 8,
      cover: "full",
      bodyPart: "head",
    });
    expect(b.hitChance).toBe(5);
  });

  it("flank ignores cover", () => {
    const covered = computeHitChance({
      marksmanship: 5,
      weaponAccuracyMod: 0,
      distance: 5,
      optRange: 12,
      cover: "full",
      bodyPart: "torso",
    });
    const flank = computeHitChance({
      marksmanship: 5,
      weaponAccuracyMod: 0,
      distance: 5,
      optRange: 12,
      cover: "full",
      flanked: true,
      bodyPart: "torso",
    });
    expect(flank.hitChance - covered.hitChance).toBe(40);
  });

  it("distance penalty beyond opt range", () => {
    const near = computeHitChance({
      marksmanship: 0,
      weaponAccuracyMod: 0,
      distance: 5,
      optRange: 12,
      cover: "none",
      bodyPart: "torso",
    });
    const far = computeHitChance({
      marksmanship: 0,
      weaponAccuracyMod: 0,
      distance: 20,
      optRange: 12,
      cover: "none",
      bodyPart: "torso",
    });
    expect(near.hitChance - far.hitChance).toBe(16);
  });

  it("rollHit respects chance with fixed rng", () => {
    expect(rollHit(50, () => 0.49)).toBe(true);
    expect(rollHit(50, () => 0.5)).toBe(false);
  });

  it("head multiplies damage", () => {
    const torso = rollDamage({
      dmgMin: 20,
      dmgMax: 20,
      bodyPart: "torso",
      crit: false,
      armor: 0,
      rng: () => 0,
    });
    const head = rollDamage({
      dmgMin: 20,
      dmgMax: 20,
      bodyPart: "head",
      crit: true,
      armor: 0,
      rng: () => 0,
    });
    expect(torso).toBe(20);
    expect(head).toBe(50);
  });

  it("armor mitigates with floor 1", () => {
    const d = rollDamage({
      dmgMin: 10,
      dmgMax: 10,
      bodyPart: "torso",
      crit: false,
      armor: 100,
      rng: () => 0,
    });
    expect(d).toBe(1);
  });

  it("formatBreakdown is readable", () => {
    const b = computeHitChance({
      marksmanship: 2,
      weaponAccuracyMod: 5,
      distance: 3,
      optRange: 12,
      cover: "half",
      bodyPart: "arms",
    });
    const s = formatBreakdown(b);
    expect(s).toContain("%");
    expect(s).toContain("cover");
  });
});
