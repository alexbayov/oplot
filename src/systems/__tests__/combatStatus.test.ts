/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  formatCombatStatusChip,
  formatStatusOverflowChip,
  getCombatStatusDefinition,
  limitCombatStatusesForDisplay,
  normalizeCombatStatusInstance,
  sortCombatStatusesForDisplay,
  type CombatStatusInstance,
} from "../combatStatus";

describe("combatStatus helpers", () => {
  describe("Definitions", () => {
    test("returns correct definitions for all status IDs", () => {
      const bleedDef = getCombatStatusDefinition("bleed");
      expect(bleedDef.labelRu).toBe("Кровь");
      expect(bleedDef.displayPriority).toBe(1);
      expect(bleedDef.target).toBe("both");
      expect(bleedDef.visible).toBe(true);
      expect(bleedDef.isHarmful).toBe(true);
      expect(bleedDef.canStack).toBe(false);
      expect(bleedDef.canRefreshDuration).toBe(true);

      const exposedDef = getCombatStatusDefinition("exposed");
      expect(exposedDef.labelRu).toBe("Открыт");
      expect(exposedDef.displayPriority).toBe(2);

      const suppressedDef = getCombatStatusDefinition("suppressed");
      expect(suppressedDef.labelRu).toBe("Подавлен");
      expect(suppressedDef.displayPriority).toBe(3);
    });

    test("throws error for unknown status ID", () => {
      expect(() => getCombatStatusDefinition("unknown_id" as any)).toThrow();
    });
  });

  describe("Chip formatting", () => {
    test("formats valid status instances correctly", () => {
      expect(formatCombatStatusChip({ id: "bleed", durationTurns: 2 })).toBe("Кровь 2");
      expect(formatCombatStatusChip({ id: "exposed", durationTurns: 1 })).toBe("Открыт 1");
      expect(formatCombatStatusChip({ id: "suppressed", durationTurns: 3 })).toBe("Подавлен 3");
    });

    test("handles zero/negative/NaN/fractional durations safely", () => {
      expect(formatCombatStatusChip({ id: "bleed", durationTurns: 0 })).toBe("Кровь");
      expect(formatCombatStatusChip({ id: "bleed", durationTurns: -2 })).toBe("Кровь");
      expect(formatCombatStatusChip({ id: "bleed", durationTurns: Number.NaN })).toBe("Кровь");
      expect(formatCombatStatusChip({ id: "bleed", durationTurns: 1.5 })).toBe("Кровь");
      expect(formatCombatStatusChip({ id: "bleed", durationTurns: Number.POSITIVE_INFINITY })).toBe("Кровь");
    });
  });

  describe("Normalization", () => {
    test("keeps valid instances intact", () => {
      const input: CombatStatusInstance = {
        id: "bleed",
        durationTurns: 2,
        stacks: 1,
        source: "knife",
      };
      const normalized = normalizeCombatStatusInstance(input);
      expect(normalized).toEqual(input);
    });

    test("returns null for unknown id or non-object input", () => {
      expect(normalizeCombatStatusInstance(null)).toBeNull();
      expect(normalizeCombatStatusInstance("string" as any)).toBeNull();
      expect(normalizeCombatStatusInstance({ id: "unknown_id", durationTurns: 1 })).toBeNull();
    });

    test("normalizes duration turns to 0 if invalid", () => {
      expect(normalizeCombatStatusInstance({ id: "bleed", durationTurns: -1 })).toEqual({
        id: "bleed",
        durationTurns: 0,
      });
      expect(normalizeCombatStatusInstance({ id: "bleed", durationTurns: Number.NaN })).toEqual({
        id: "bleed",
        durationTurns: 0,
      });
      expect(normalizeCombatStatusInstance({ id: "bleed", durationTurns: 1.5 })).toEqual({
        id: "bleed",
        durationTurns: 0,
      });
      expect(normalizeCombatStatusInstance({ id: "bleed" })).toEqual({
        id: "bleed",
        durationTurns: 0,
      });
    });

    test("omits invalid stacks but preserves valid stacks", () => {
      expect(normalizeCombatStatusInstance({ id: "bleed", durationTurns: 1, stacks: -1 })).toEqual({
        id: "bleed",
        durationTurns: 1,
      });
      expect(normalizeCombatStatusInstance({ id: "bleed", durationTurns: 1, stacks: "string" as any })).toEqual({
        id: "bleed",
        durationTurns: 1,
      });
      expect(normalizeCombatStatusInstance({ id: "bleed", durationTurns: 1, stacks: 2 })).toEqual({
        id: "bleed",
        durationTurns: 1,
        stacks: 2,
      });
    });

    test("omits non-string source but preserves string source", () => {
      expect(normalizeCombatStatusInstance({ id: "bleed", durationTurns: 1, source: 123 as any })).toEqual({
        id: "bleed",
        durationTurns: 1,
      });
      expect(normalizeCombatStatusInstance({ id: "bleed", durationTurns: 1, source: "hero" })).toEqual({
        id: "bleed",
        durationTurns: 1,
        source: "hero",
      });
    });
  });

  describe("Sorting", () => {
    test("sorts by displayPriority ascending (bleed -> exposed -> suppressed)", () => {
      const input: CombatStatusInstance[] = [
        { id: "suppressed", durationTurns: 3 },
        { id: "bleed", durationTurns: 1 },
        { id: "exposed", durationTurns: 2 },
      ];
      const sorted = sortCombatStatusesForDisplay(input);
      expect(sorted.map((s) => s.id)).toEqual(["bleed", "exposed", "suppressed"]);
    });

    test("keeps stable order for same priority/id", () => {
      const input: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 2, source: "first" },
        { id: "bleed", durationTurns: 1, source: "second" },
      ];
      const sorted = sortCombatStatusesForDisplay(input);
      expect(sorted).toEqual(input);
    });

    test("does not mutate input array or input objects", () => {
      const input: CombatStatusInstance[] = [
        { id: "suppressed", durationTurns: 3 },
        { id: "bleed", durationTurns: 1 },
      ];
      const inputCopy = JSON.parse(JSON.stringify(input));
      sortCombatStatusesForDisplay(input);
      expect(input).toEqual(inputCopy);
    });
  });

  describe("Limit and overflow", () => {
    test("default maxVisible of 3 returns 3 without overflow", () => {
      const input: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 1 },
        { id: "exposed", durationTurns: 2 },
        { id: "suppressed", durationTurns: 3 },
      ];
      const result = limitCombatStatusesForDisplay(input);
      expect(result.visible).toHaveLength(3);
      expect(result.overflowCount).toBe(0);
    });

    test("4 statuses with maxVisible 3 returns 2 visible + overflowCount 2", () => {
      const input: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 1 },
        { id: "exposed", durationTurns: 2 },
        { id: "suppressed", durationTurns: 3 },
        { id: "suppressed", durationTurns: 4 }, // duplicate id but valid instance
      ];
      const result = limitCombatStatusesForDisplay(input, 3);
      expect(result.visible).toHaveLength(2);
      expect(result.visible.map((s) => s.id)).toEqual(["bleed", "exposed"]);
      expect(result.overflowCount).toBe(2);
    });

    test("maxVisible 2 returns 1 visible + remaining overflowCount", () => {
      const input: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 1 },
        { id: "exposed", durationTurns: 2 },
        { id: "suppressed", durationTurns: 3 },
      ];
      const result = limitCombatStatusesForDisplay(input, 2);
      expect(result.visible).toHaveLength(1);
      expect(result.visible[0]?.id).toBe("bleed");
      expect(result.overflowCount).toBe(2);
    });

    test("maxVisible 0 returns 0 visible + total overflowCount", () => {
      const input: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 1 },
        { id: "exposed", durationTurns: 2 },
      ];
      const result = limitCombatStatusesForDisplay(input, 0);
      expect(result.visible).toHaveLength(0);
      expect(result.overflowCount).toBe(2);
    });

    test("formats status overflow chip safely", () => {
      expect(formatStatusOverflowChip(0)).toBeNull();
      expect(formatStatusOverflowChip(-1)).toBeNull();
      expect(formatStatusOverflowChip(Number.NaN)).toBeNull();
      expect(formatStatusOverflowChip(1)).toBe("+1");
      expect(formatStatusOverflowChip(2)).toBe("+2");
    });
  });

  describe("Static import guard", () => {
    test("does not import state, scene, or content modules", () => {
      const sourcePath = resolve(dirname(fileURLToPath(import.meta.url)), "../combatStatus.ts");
      const source = readFileSync(sourcePath, "utf8");

      expect(source).not.toMatch(/GameState/);
      expect(source).not.toMatch(/CombatScene/);
      expect(source).not.toMatch(/content\//);
      expect(source).not.toMatch(/items\.json/);
      expect(source).not.toMatch(/mobs\.json/);
      expect(source).not.toMatch(/from\s+["']\.\.\/state/);
      expect(source).not.toMatch(/from\s+["']\.\.\/scenes/);
    });
  });
});
