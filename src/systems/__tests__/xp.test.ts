import { gainXP, isMaxLevel, xpProgress, canLevelUp, xpToNext, xpRequired, MAX_LEVEL, computeOverkillPopups } from "../xp";
import { describe, it, expect } from "vitest";

describe("xpToNext", () => {
  it("returns 40 for level 1", () => expect(xpToNext(1)).toBe(40));
  it("returns 113 for level 2", () => expect(xpToNext(2)).toBe(113));
  it("returns 208 for level 3", () => expect(xpToNext(3)).toBe(208));
  it("returns 447 for level 5", () => expect(xpToNext(5)).toBe(447));
  it("returns 1080 for level 9", () => expect(xpToNext(9)).toBe(1080));
});

describe("xpRequired", () => {
  it("returns 0 for level 1", () => expect(xpRequired(1)).toBe(0));
  it("returns 40 for level 2", () => expect(xpRequired(2)).toBe(40));
  it("returns 153 for level 3", () => expect(xpRequired(3)).toBe(153));
  it("returns 681 for level 5", () => expect(xpRequired(5)).toBe(681));
  it("returns 4442 for level 10", () => expect(xpRequired(10)).toBe(4442));
});

describe("gainXP", () => {
  it("adds XP without level up", () => {
    const result = gainXP(0, 1, 20);
    expect(result.xp_gained).toBe(20);
    expect(result.levelled_up).toBe(false);
    expect(result.level_after).toBe(1);
  });

  it("levels up when crossing threshold", () => {
    const result = gainXP(0, 1, 40);
    expect(result.xp_gained).toBe(40);
    expect(result.levelled_up).toBe(true);
    expect(result.level_after).toBe(2);
  });

  it("handles multiple level ups", () => {
    const result = gainXP(0, 1, 200);
    expect(result.levelled_up).toBe(true);
    expect(result.level_after).toBe(3);
  });

  it("does not exceed MAX_LEVEL", () => {
    const result = gainXP(0, 1, 999999);
    expect(result.level_after).toBe(MAX_LEVEL);
  });

  it("applies xp gain multiplier", () => {
    const result = gainXP(0, 1, 40, 1.15);
    expect(result.xp_gained).toBe(46);
  });

  it("zero multiplier gives zero gain", () => {
    const result = gainXP(0, 1, 40, 0);
    expect(result.xp_gained).toBe(0);
    expect(result.levelled_up).toBe(false);
  });
});

describe("isMaxLevel", () => {
  it("returns false for level 1", () => expect(isMaxLevel(1)).toBe(false));
  it("returns true for MAX_LEVEL", () => expect(isMaxLevel(MAX_LEVEL)).toBe(true));
});

describe("xpProgress", () => {
  it("returns 0 at start of level", () => expect(xpProgress(0, 1)).toBe(0));
  it("returns 0.5 at halfway", () => expect(xpProgress(20, 1)).toBeCloseTo(0.5));
  it("returns 1 at max level", () => expect(xpProgress(999, MAX_LEVEL)).toBe(1));
});

describe("canLevelUp", () => {
  it("returns true when XP sufficient", () => expect(canLevelUp(40, 1)).toBe(true));
  it("returns false when XP insufficient", () => expect(canLevelUp(39, 1)).toBe(false));
  it("returns false at MAX_LEVEL", () => expect(canLevelUp(999999, MAX_LEVEL)).toBe(false));
});

describe("computeOverkillPopups — M5 overkill queue", () => {
  it("single level-up returns 1 popup", () => {
    expect(computeOverkillPopups(1, 2)).toBe(1);
  });

  it("double level-up (overkill XP) returns 2 popups", () => {
    expect(computeOverkillPopups(1, 3)).toBe(2);
  });

  it("triple level-up returns 3 popups", () => {
    expect(computeOverkillPopups(1, 4)).toBe(3);
  });
});
