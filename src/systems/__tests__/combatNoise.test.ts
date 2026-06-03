import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  formatNoiseDelta,
  getNoiseDeltaForAction,
  getNoiseLevelLabel,
  type NoisePreviewAction,
} from "../combatNoise";

const zeroNoiseActions: NoisePreviewAction[] = [
  "empty_magazine_fallback",
  "melee",
  "reload",
  "cover",
  "movement_preview",
  "retreat",
  "medkit",
];

describe("combatNoise", () => {
  test("maps threshold boundaries to noise labels", () => {
    expect(getNoiseLevelLabel(0)).toBe("тихо");
    expect(getNoiseLevelLabel(2)).toBe("тихо");
    expect(getNoiseLevelLabel(3)).toBe("слышно");
    expect(getNoiseLevelLabel(5)).toBe("слышно");
    expect(getNoiseLevelLabel(6)).toBe("опасно");
    expect(getNoiseLevelLabel(8)).toBe("опасно");
    expect(getNoiseLevelLabel(9)).toBe("шум критический");
    expect(getNoiseLevelLabel(999)).toBe("шум критический");
  });

  test("fails safe to quiet for invalid noise values", () => {
    expect(getNoiseLevelLabel(-1)).toBe("тихо");
    expect(getNoiseLevelLabel(Number.NaN)).toBe("тихо");
    expect(getNoiseLevelLabel(Number.POSITIVE_INFINITY)).toBe("тихо");
    expect(getNoiseLevelLabel(Number.NEGATIVE_INFINITY)).toBe("тихо");
    expect(getNoiseLevelLabel(3.5)).toBe("тихо");
  });

  test("returns firearm noise only for valid firearm shot action", () => {
    expect(getNoiseDeltaForAction("valid_firearm_shot")).toBe(2);
  });

  test("returns zero noise for non-firearm or non-committed actions", () => {
    for (const action of zeroNoiseActions) {
      expect(getNoiseDeltaForAction(action)).toBe(0);
    }
  });

  test("formats noise deltas safely", () => {
    expect(formatNoiseDelta(2)).toBe("Шум +2");
    expect(formatNoiseDelta(0)).toBe("Шум +0");
    expect(formatNoiseDelta(-1)).toBe("Шум +0");
    expect(formatNoiseDelta(Number.NaN)).toBe("Шум +0");
    expect(formatNoiseDelta(Number.POSITIVE_INFINITY)).toBe("Шум +0");
    expect(formatNoiseDelta(Number.NEGATIVE_INFINITY)).toBe("Шум +0");
    expect(formatNoiseDelta(1.5)).toBe("Шум +0");
  });

  test("is deterministic across repeated calls", () => {
    const actions: NoisePreviewAction[] = ["valid_firearm_shot", ...zeroNoiseActions];
    const firstDeltas = actions.map((action) => getNoiseDeltaForAction(action));
    const secondDeltas = actions.map((action) => getNoiseDeltaForAction(action));
    const firstLabels = [0, 3, 6, 9].map((noise) => getNoiseLevelLabel(noise));
    const secondLabels = [0, 3, 6, 9].map((noise) => getNoiseLevelLabel(noise));

    expect(secondDeltas).toEqual(firstDeltas);
    expect(secondLabels).toEqual(firstLabels);
    expect(formatNoiseDelta(getNoiseDeltaForAction("valid_firearm_shot"))).toBe("Шум +2");
  });

  test("does not import state, scene, or content modules", () => {
    const sourcePath = resolve(dirname(fileURLToPath(import.meta.url)), "../combatNoise.ts");
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
