import { describe, expect, test } from "vitest";
import { toRoman, tierColor, formatTierRange } from "../tierBadge";

describe("toRoman", () => {
  test("T1-T5 → I-V", () => {
    expect(toRoman(1)).toBe("I");
    expect(toRoman(2)).toBe("II");
    expect(toRoman(3)).toBe("III");
    expect(toRoman(4)).toBe("IV");
    expect(toRoman(5)).toBe("V");
  });

  test("clamps out-of-range values", () => {
    expect(toRoman(0)).toBe("I");
    expect(toRoman(-5)).toBe("I");
    expect(toRoman(6)).toBe("V");
    expect(toRoman(99)).toBe("V");
  });

  test("rounds fractional tiers", () => {
    expect(toRoman(2.4)).toBe("II");
    expect(toRoman(2.6)).toBe("III");
  });
});

describe("tierColor", () => {
  test("returns int colors for T1-T5", () => {
    for (const t of [1, 2, 3, 4, 5]) {
      const c = tierColor(t);
      expect(typeof c).toBe("number");
      expect(c).toBeGreaterThan(0);
    }
  });

  test("clamps out-of-range", () => {
    expect(tierColor(0)).toBe(tierColor(1));
    expect(tierColor(10)).toBe(tierColor(5));
  });
});

describe("formatTierRange", () => {
  test("single tier collapses", () => {
    expect(formatTierRange([3, 3])).toBe("III");
  });

  test("range uses dash", () => {
    expect(formatTierRange([1, 2])).toBe("I-II");
    expect(formatTierRange([3, 4])).toBe("III-IV");
    expect(formatTierRange([4, 5])).toBe("IV-V");
  });

  test("undefined → empty", () => {
    expect(formatTierRange(undefined)).toBe("");
  });
});
