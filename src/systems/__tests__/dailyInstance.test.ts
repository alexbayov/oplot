import { describe, expect, test } from "vitest";
import { canEnterDailyInstance, markDailyCompleted } from "../dailyInstance";
import type { GameProgress } from "../../state/types";
import type { Zone } from "../../types";

const makeZone = (overrides: Partial<Zone> = {}): Zone => ({
  id: "warehouse",
  name_ru: "Склад",
  level: 2,
  description_ru: "",
  resources: [],
  mobs: [],
  boss_id: "warehouse_boss",
  unique_resources: [],
  levels: [],
  unlock_condition: "forest_depth_2_completed",
  ...overrides,
});

const makeProgress = (dailyCompleted: Record<string, number> = {}): GameProgress => ({
  forest_depth_2_completed: true,
  any_warehouse_sortie_completed: true,
  daily_completed: { ...dailyCompleted },
  radio_trust: 0,
});

describe("canEnterDailyInstance", () => {
  test("returns false when zone has no boss_id", () => {
    const zone = makeZone({ boss_id: null });
    const progress = makeProgress();
    expect(canEnterDailyInstance(progress, zone, 1000000)).toBe(false);
  });

  test("returns false during cooldown period after daily completed", () => {
    const zone = makeZone({ daily_reset_hours: 24 });
    const completedAt = 1000000;
    const progress = makeProgress({ warehouse: completedAt });
    const now = completedAt + 23 * 3600 * 1000;
    expect(canEnterDailyInstance(progress, zone, now)).toBe(false);
  });

  test("returns true after cooldown expires", () => {
    const zone = makeZone({ daily_reset_hours: 24 });
    const completedAt = 1000000;
    const progress = makeProgress({ warehouse: completedAt });
    const now = completedAt + 24 * 3600 * 1000;
    expect(canEnterDailyInstance(progress, zone, now)).toBe(true);
  });
});

describe("markDailyCompleted", () => {
  test("sets daily_completed timestamp for zone", () => {
    const progress = makeProgress();
    markDailyCompleted(progress, "warehouse", 5000);
    expect(progress.daily_completed.warehouse).toBe(5000);
  });
});
