import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  DEFAULT_DISTANCE_BAND,
  canMoveDistance,
  computeDistanceMovePlan,
  formatDistanceChip,
  formatDistanceMovePreview,
  getDistanceBandLabel,
  getDistanceBandLabelRu,
  getDistanceChipText,
  getDistanceMoveButtonLabel,
  getDistanceMoveDisabledReason,
  getDistanceMoveDisabledReasonLabel,
  getNextDistanceBand,
  normalizeDistanceBand,
  normalizeDistanceMoveDirection,
  type DistanceBand,
  type DistanceMoveDirection,
} from "../combatDistance";

describe("combatDistance", () => {
  test("normalizes valid and invalid distance bands", () => {
    expect(DEFAULT_DISTANCE_BAND).toBe("medium");
    expect(normalizeDistanceBand("close")).toBe("close");
    expect(normalizeDistanceBand("medium")).toBe("medium");
    expect(normalizeDistanceBand("far")).toBe("far");

    expect(normalizeDistanceBand("near")).toBeNull();
    expect(normalizeDistanceBand("CLOSE")).toBeNull();
    expect(normalizeDistanceBand(0)).toBeNull();
    expect(normalizeDistanceBand(null)).toBeNull();
    expect(normalizeDistanceBand(undefined)).toBeNull();
  });

  test("formats exact Russian labels and chip copy", () => {
    expect(getDistanceBandLabelRu("close")).toBe("близко");
    expect(getDistanceBandLabelRu("medium")).toBe("средне");
    expect(getDistanceBandLabelRu("far")).toBe("далеко");

    expect(getDistanceChipText("close")).toBe("Дистанция: близко");
    expect(getDistanceChipText("medium")).toBe("Дистанция: средне");
    expect(getDistanceChipText("far")).toBe("Дистанция: далеко");

    expect(getDistanceBandLabel("medium")).toBe(getDistanceBandLabelRu("medium"));
    expect(formatDistanceChip("far")).toBe(getDistanceChipText("far"));
  });

  test("normalizes valid and invalid move directions", () => {
    expect(normalizeDistanceMoveDirection("closer")).toBe("closer");
    expect(normalizeDistanceMoveDirection("away")).toBe("away");

    expect(normalizeDistanceMoveDirection("close")).toBeNull();
    expect(normalizeDistanceMoveDirection("farther")).toBeNull();
    expect(normalizeDistanceMoveDirection(1)).toBeNull();
    expect(normalizeDistanceMoveDirection(null)).toBeNull();
    expect(normalizeDistanceMoveDirection(undefined)).toBeNull();
  });

  test("returns exact next distance band for all six band/direction pairs", () => {
    expect(getNextDistanceBand("close", "closer")).toBeNull();
    expect(getNextDistanceBand("close", "away")).toBe("medium");
    expect(getNextDistanceBand("medium", "closer")).toBe("close");
    expect(getNextDistanceBand("medium", "away")).toBe("far");
    expect(getNextDistanceBand("far", "closer")).toBe("medium");
    expect(getNextDistanceBand("far", "away")).toBeNull();
  });

  test("reports boundary and invalid disabled reasons", () => {
    expect(getDistanceMoveDisabledReason("close", "closer")).toBe("already_close");
    expect(getDistanceMoveDisabledReason("far", "away")).toBe("already_far");
    expect(getDistanceMoveDisabledReason("unknown", "closer")).toBe("invalid_distance");
    expect(getDistanceMoveDisabledReason("medium", "sideways")).toBe("invalid_direction");

    expect(getDistanceMoveDisabledReason("close", "away")).toBeNull();
    expect(getDistanceMoveDisabledReason("medium", "closer")).toBeNull();
    expect(getDistanceMoveDisabledReason("medium", "away")).toBeNull();
    expect(getDistanceMoveDisabledReason("far", "closer")).toBeNull();

    expect(canMoveDistance("close", "closer")).toBe(false);
    expect(canMoveDistance("far", "away")).toBe(false);
    expect(canMoveDistance("medium", "closer")).toBe(true);
  });

  test("formats disabled reason labels", () => {
    expect(getDistanceMoveDisabledReasonLabel("already_close")).toBe("уже близко");
    expect(getDistanceMoveDisabledReasonLabel("already_far")).toBe("уже далеко");
    expect(getDistanceMoveDisabledReasonLabel("invalid_distance")).toBe("неизвестная дистанция");
    expect(getDistanceMoveDisabledReasonLabel("invalid_direction")).toBe("неизвестное направление");
  });

  test("computes ok move plans with default and custom AP costs", () => {
    expect(computeDistanceMovePlan({ current: "medium", direction: "closer" })).toEqual({
      ok: true,
      from: "medium",
      to: "close",
      direction: "closer",
      apCost: 1,
    });

    expect(computeDistanceMovePlan({ current: "close", direction: "away", apCost: 2 })).toEqual({
      ok: true,
      from: "close",
      to: "medium",
      direction: "away",
      apCost: 2,
    });

    expect(computeDistanceMovePlan({ current: "far", direction: "closer", apCost: 0 })).toEqual({
      ok: true,
      from: "far",
      to: "medium",
      direction: "closer",
      apCost: 0,
    });
  });

  test("computes blocked move plans for boundaries and invalid input", () => {
    expect(computeDistanceMovePlan({ current: "close", direction: "closer" })).toEqual({
      ok: false,
      from: "close",
      direction: "closer",
      reason: "already_close",
      apCost: 1,
    });

    expect(computeDistanceMovePlan({ current: "far", direction: "away" })).toEqual({
      ok: false,
      from: "far",
      direction: "away",
      reason: "already_far",
      apCost: 1,
    });

    expect(computeDistanceMovePlan({ current: "bad", direction: "away" })).toEqual({
      ok: false,
      from: null,
      direction: "away",
      reason: "invalid_distance",
      apCost: 1,
    });

    expect(computeDistanceMovePlan({ current: "medium", direction: "bad" })).toEqual({
      ok: false,
      from: "medium",
      direction: null,
      reason: "invalid_direction",
      apCost: 1,
    });
  });

  test("normalizes invalid AP cost to the default while preserving valid integers", () => {
    expect(computeDistanceMovePlan({ current: "medium", direction: "away", apCost: Number.NaN }).apCost).toBe(1);
    expect(computeDistanceMovePlan({ current: "medium", direction: "away", apCost: Number.POSITIVE_INFINITY }).apCost).toBe(1);
    expect(computeDistanceMovePlan({ current: "medium", direction: "away", apCost: Number.NEGATIVE_INFINITY }).apCost).toBe(1);
    expect(computeDistanceMovePlan({ current: "medium", direction: "away", apCost: 1.5 }).apCost).toBe(1);
    expect(computeDistanceMovePlan({ current: "medium", direction: "away", apCost: -1 }).apCost).toBe(1);
    expect(computeDistanceMovePlan({ current: "medium", direction: "away", apCost: 0 }).apCost).toBe(0);
    expect(computeDistanceMovePlan({ current: "medium", direction: "away", apCost: 3 }).apCost).toBe(3);
  });

  test("formats exact move preview strings", () => {
    expect(formatDistanceMovePreview("closer", computeDistanceMovePlan({ current: "medium", direction: "closer" }))).toBe(
      "Ближе 1 AP: готово",
    );
    expect(formatDistanceMovePreview("away", computeDistanceMovePlan({ current: "medium", direction: "away", apCost: 2 }))).toBe(
      "Дальше 2 AP: готово",
    );
    expect(formatDistanceMovePreview("closer", computeDistanceMovePlan({ current: "close", direction: "closer" }))).toBe(
      "Ближе 1 AP: уже близко",
    );
    expect(formatDistanceMovePreview("away", computeDistanceMovePlan({ current: "far", direction: "away" }))).toBe(
      "Дальше 1 AP: уже далеко",
    );
    expect(formatDistanceMovePreview("closer", computeDistanceMovePlan({ current: "bad", direction: "closer" }))).toBe(
      "Ближе 1 AP: неизвестная дистанция",
    );
    expect(formatDistanceMovePreview("away", computeDistanceMovePlan({ current: "medium", direction: "bad" }))).toBe(
      "Дальше 1 AP: неизвестное направление",
    );
  });

  test("formats exact movement button labels", () => {
    expect(getDistanceMoveButtonLabel("closer")).toBe("БЛИЖЕ");
    expect(getDistanceMoveButtonLabel("away")).toBe("ДАЛЬШЕ");
  });

  test("does not mutate input objects and is deterministic across repeated calls", () => {
    const input = { current: "medium", direction: "away", apCost: 2 } satisfies {
      current: DistanceBand;
      direction: DistanceMoveDirection;
      apCost: number;
    };
    const before = { ...input };
    const firstPlan = computeDistanceMovePlan(input);
    const secondPlan = computeDistanceMovePlan(input);

    expect(input).toEqual(before);
    expect(secondPlan).toEqual(firstPlan);
    expect(getNextDistanceBand("medium", "away")).toBe(getNextDistanceBand("medium", "away"));
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
