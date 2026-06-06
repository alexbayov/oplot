import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  DEFAULT_DISTANCE_BAND,
  canMoveDistance,
  formatDistanceChip,
  getDistanceBandLabel,
  getNextDistanceBand,
  type DistanceBand,
} from "../combatDistance";

describe("combatDistance", () => {
  test("keeps medium as the default distance band", () => {
    expect(DEFAULT_DISTANCE_BAND).toBe("medium");
  });

  test("formats distance labels and chip copy", () => {
    expect(getDistanceBandLabel("close")).toBe("близко");
    expect(getDistanceBandLabel("medium")).toBe("средне");
    expect(getDistanceBandLabel("far")).toBe("далеко");

    expect(formatDistanceChip("close")).toBe("Дистанция: близко");
    expect(formatDistanceChip("medium")).toBe("Дистанция: средне");
    expect(formatDistanceChip("far")).toBe("Дистанция: далеко");
  });

  test("moves exactly one band closer without crossing the close boundary", () => {
    expect(getNextDistanceBand("far", "closer")).toBe("medium");
    expect(getNextDistanceBand("medium", "closer")).toBe("close");
    expect(getNextDistanceBand("close", "closer")).toBe("close");
  });

  test("moves exactly one band away without crossing the far boundary", () => {
    expect(getNextDistanceBand("close", "away")).toBe("medium");
    expect(getNextDistanceBand("medium", "away")).toBe("far");
    expect(getNextDistanceBand("far", "away")).toBe("far");
  });

  test("reports movement boundary availability", () => {
    expect(canMoveDistance("close", "closer")).toBe(false);
    expect(canMoveDistance("medium", "closer")).toBe(true);
    expect(canMoveDistance("far", "closer")).toBe(true);

    expect(canMoveDistance("close", "away")).toBe(true);
    expect(canMoveDistance("medium", "away")).toBe(true);
    expect(canMoveDistance("far", "away")).toBe(false);
  });

  test("is deterministic across repeated calls", () => {
    const bands: DistanceBand[] = ["close", "medium", "far"];
    const firstCloser = bands.map((band) => getNextDistanceBand(band, "closer"));
    const secondCloser = bands.map((band) => getNextDistanceBand(band, "closer"));
    const firstAway = bands.map((band) => getNextDistanceBand(band, "away"));
    const secondAway = bands.map((band) => getNextDistanceBand(band, "away"));

    expect(secondCloser).toEqual(firstCloser);
    expect(secondAway).toEqual(firstAway);
    expect(bands.map((band) => formatDistanceChip(band))).toEqual([
      "Дистанция: близко",
      "Дистанция: средне",
      "Дистанция: далеко",
    ]);
  });

  test("does not import state, scene, content, or AP modules", () => {
    const sourcePath = resolve(dirname(fileURLToPath(import.meta.url)), "../combatDistance.ts");
    const source = readFileSync(sourcePath, "utf8");

    expect(source).not.toMatch(/GameState/);
    expect(source).not.toMatch(/CombatScene/);
    expect(source).not.toMatch(/content\//);
    expect(source).not.toMatch(/items\.json/);
    expect(source).not.toMatch(/mobs\.json/);
    expect(source).not.toMatch(/combatAp/);
    expect(source).not.toMatch(/from\s+["']\.\.\/state/);
    expect(source).not.toMatch(/from\s+["']\.\.\/scenes/);
  });
});
