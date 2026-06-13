import { describe, expect, test, vi } from "vitest";
import {
  applySortieCompletion,
  describeUnlockCondition,
  evaluateUnlockCondition,
} from "../zoneUnlock";
import type { GameProgress } from "../../state/types";
import type { Zone } from "../../types";

const emptyProgress = (): GameProgress => ({
  forest_depth_2_completed: false,
  any_warehouse_sortie_completed: false,
  any_forest_sortie_completed: false,
  suburbs_sortie_completed: false,
  warehouse_boss_defeated: false,
  factory_sortie_completed: false,
  city_boss_defeated: false,
  metro_sortie_completed: false,
  daily_completed: {},
  radio_trust: 0,
});

const zone = (id: string, opts: Partial<Zone> = {}): Zone => ({
  id,
  name_ru: id,
  level: 1,
  description_ru: "",
  resources: [],
  mobs: [],
  boss_id: null,
  unique_resources: [],
  levels: [],
  unlock_condition: "start",
  ...opts,
});

describe("evaluateUnlockCondition", () => {
  test('"start" always unlocked', () => {
    expect(evaluateUnlockCondition("start", emptyProgress(), 1)).toBe(true);
    expect(evaluateUnlockCondition("start", emptyProgress(), 99)).toBe(true);
  });

  test("player_level_N: locked below, unlocked at and above", () => {
    const p = emptyProgress();
    expect(evaluateUnlockCondition("player_level_2", p, 1)).toBe(false);
    expect(evaluateUnlockCondition("player_level_2", p, 2)).toBe(true);
    expect(evaluateUnlockCondition("player_level_2", p, 5)).toBe(true);
    expect(evaluateUnlockCondition("player_level_4", p, 3)).toBe(false);
    expect(evaluateUnlockCondition("player_level_4", p, 4)).toBe(true);
  });

  test("legacy: forest_depth_2_completed still gates from progress flags (back-compat)", () => {
    const p = emptyProgress();
    expect(evaluateUnlockCondition("forest_depth_2_completed", p, 1)).toBe(false);
    p.forest_depth_2_completed = true;
    expect(evaluateUnlockCondition("forest_depth_2_completed", p, 1)).toBe(true);
  });

  test("unknown condition → locked + console.warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(evaluateUnlockCondition("future_quest_done", emptyProgress(), 99)).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe("describeUnlockCondition", () => {
  test('"start" → читаемая фраза', () => {
    expect(describeUnlockCondition("start")).toContain("начала");
  });

  test("player_level_N → описание содержит номер уровня", () => {
    expect(describeUnlockCondition("player_level_2")).toContain("2");
    expect(describeUnlockCondition("player_level_4")).toContain("4");
  });

  test("legacy фразы остались (back-compat для архивных зон)", () => {
    expect(describeUnlockCondition("forest_depth_2_completed")).toContain("Лес");
    expect(describeUnlockCondition("any_warehouse_sortie_completed")).toContain("Склад");
  });

  test("unknown → fallback на сырую строку", () => {
    expect(describeUnlockCondition("future_quest_done")).toBe("future_quest_done");
  });
});

describe("applySortieCompletion (M13 PR-2 — 3 живые зоны)", () => {
  test("forest depth 2 victory → forest_depth_2_completed (immutable)", () => {
    const before = emptyProgress();
    const after = applySortieCompletion(before, zone("forest"), 2, true);
    expect(after.forest_depth_2_completed).toBe(true);
    expect(after.any_forest_sortie_completed).toBe(true);
    expect(before.forest_depth_2_completed).toBe(false);
  });

  test("forest depth 1/3 victory → any_forest_sortie_completed, без depth_2 флага", () => {
    for (const d of [1, 3] as const) {
      const after = applySortieCompletion(emptyProgress(), zone("forest"), d, true);
      expect(after.any_forest_sortie_completed).toBe(true);
      expect(after.forest_depth_2_completed).toBe(false);
    }
  });

  test("forest depth 2 defeat → ничего не флипается", () => {
    const after = applySortieCompletion(emptyProgress(), zone("forest"), 2, false);
    expect(after).toEqual(emptyProgress());
  });

  test("warehouse depth 1/2 victory → any_warehouse_sortie_completed, без boss-флага", () => {
    for (const d of [1, 2] as const) {
      const after = applySortieCompletion(
        emptyProgress(),
        zone("warehouse", { boss_id: "warehouse_drone_prime" }),
        d,
        true,
      );
      expect(after.any_warehouse_sortie_completed).toBe(true);
      expect(after.warehouse_boss_defeated).toBe(false);
    }
  });

  test("warehouse depth 3 victory с boss_id → warehouse_boss_defeated", () => {
    const after = applySortieCompletion(
      emptyProgress(),
      zone("warehouse", { boss_id: "warehouse_drone_prime" }),
      3,
      true,
    );
    expect(after.warehouse_boss_defeated).toBe(true);
    expect(after.any_warehouse_sortie_completed).toBe(true);
  });

  test("warehouse depth 3 без boss_id → no boss flag", () => {
    const after = applySortieCompletion(emptyProgress(), zone("warehouse"), 3, true);
    expect(after.warehouse_boss_defeated).toBe(false);
  });

  test("factory (Промзона) победа на любой глубине → factory_sortie_completed", () => {
    for (const d of [1, 2, 3] as const) {
      const after = applySortieCompletion(emptyProgress(), zone("factory"), d, true);
      expect(after.factory_sortie_completed).toBe(true);
    }
  });

  test("архивные зоны (suburbs/city/metro) больше не флипают флаги", () => {
    // M13 PR-2: суши/город/метро не открыты на карте, ветки в applySortieCompletion
    // удалены. Если кто-то синтетически прокинет такую зону через систему, флаги
    // остаются нулями — это безопасный no-op, не падение.
    const sub = applySortieCompletion(emptyProgress(), zone("suburbs"), 1, true);
    expect(sub).toEqual(emptyProgress());
    const city = applySortieCompletion(
      emptyProgress(),
      zone("city", { boss_id: "city_guard_captain" }),
      3,
      true,
    );
    expect(city).toEqual(emptyProgress());
    const met = applySortieCompletion(emptyProgress(), zone("metro"), 3, true);
    expect(met).toEqual(emptyProgress());
  });

  test("поражение в любой зоне → ничего не флипается", () => {
    for (const id of ["forest", "warehouse", "factory"]) {
      const after = applySortieCompletion(
        emptyProgress(),
        zone(id, { boss_id: "x" }),
        3,
        false,
      );
      expect(after).toEqual(emptyProgress());
    }
  });
});

describe("legacy unlock-condition strings (back-compat для архивных зон)", () => {
  const conditions = [
    "any_forest_sortie_completed",
    "suburbs_sortie_completed",
    "warehouse_boss_defeated",
    "factory_sortie_completed",
    "city_boss_defeated",
    "metro_sortie_completed",
  ] as const;

  test("каждая legacy строка читается из progress без warn", () => {
    const p = emptyProgress();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    for (const c of conditions) {
      expect(evaluateUnlockCondition(c, p, 1)).toBe(false);
    }
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();

    const all: GameProgress = {
      ...p,
      any_forest_sortie_completed: true,
      suburbs_sortie_completed: true,
      warehouse_boss_defeated: true,
      factory_sortie_completed: true,
      city_boss_defeated: true,
      metro_sortie_completed: true,
    };
    for (const c of conditions) {
      expect(evaluateUnlockCondition(c, all, 1)).toBe(true);
    }
  });

  test("каждая legacy фраза имеет human-readable description без подчёркиваний", () => {
    for (const c of conditions) {
      const desc = describeUnlockCondition(c);
      expect(desc).not.toBe(c);
      expect(desc).not.toMatch(/_/);
      expect(desc.length).toBeGreaterThan(5);
    }
  });
});
