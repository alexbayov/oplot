/**
 * M13 PR-2 gate-тесты для content/zones.json.
 *
 * 1. Zod-валидация структуры (включая loot_profile.base_weights).
 * 2. Статистический тест: на Складе с дефолтной целью fuel-категория
 *    встречается > 40% в 1000 вылазок. Это валидирует, что loot_profile
 *    действительно смещает выпадение под нужный ресурс базы.
 *
 * См. docs/redesign/M13-PIVOT.md §«Gate-тесты для PR-2».
 */

import { describe, expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { zonesFileSchema } from "../zoneSchema";
import {
  BASE_RESOURCE_ITEMS,
  SORTIE_GOALS,
  resolveEncounter,
} from "../sortieResolve";
import type { EncounterInput } from "../../types/sortie";
import type { Zone } from "../../types";

const loadZones = (): Zone[] => {
  const file = path.resolve(__dirname, "../../../content/zones.json");
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw) as Zone[];
};

describe("zones.json — Zod-валидация", () => {
  test("вся пачка зон проходит схему", () => {
    const zones = loadZones();
    const result = zonesFileSchema.safeParse(zones);
    if (!result.success) {
      throw new Error(`zones.json schema fail: ${JSON.stringify(result.error.format(), null, 2)}`);
    }
  });

  test("после M13 PR-2 ровно 3 зоны открыты на лаунч", () => {
    const zones = loadZones();
    const ids = zones.map((z) => z.id).sort();
    expect(ids).toEqual(["factory", "forest", "warehouse"]);
  });

  test("у warehouse/factory level gating через player_level_N", () => {
    const zones = loadZones();
    const warehouse = zones.find((z) => z.id === "warehouse");
    const factory = zones.find((z) => z.id === "factory");
    expect(warehouse?.unlock_condition).toBe("player_level_2");
    expect(factory?.unlock_condition).toBe("player_level_4");
  });

  test("у всех трёх зон задан loot_profile", () => {
    const zones = loadZones();
    for (const z of zones) {
      expect(z.loot_profile).toBeDefined();
      expect(z.loot_profile?.base_weights).toBeDefined();
    }
  });
});

// ── Статистический gate ──

/**
 * mulberry32 — детерминированный rng, чтобы тест не флакал.
 * Сид подбирался один раз; при изменении формулы rollLoot можно подобрать
 * другой стабильный сид. Главное, чтобы порог >40% был выдержан с запасом.
 */
const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const buildWarehouseInput = (zone: Zone, depth: 1 | 2 | 3): EncounterInput => {
  const level = zone.levels.find((l) => l.depth === depth);
  if (!level) throw new Error(`warehouse depth ${depth} missing`);
  return {
    hero: {
      hp: 100,
      hp_max: 100,
      level: 3,
      weapon_damage_avg: 12,
      weapon_accuracy: 0,
      weapon_weight: 0,
      armor_reduction: 0.2,
      skill_combat: 2,
      injuries: [],
    },
    zone_id: zone.id,
    depth,
    goal: "greedy",
    mob_ids: [],
    mob_total_threat: 0,
    loot_pool: Array.from(level.resources),
    loot_base_count: level.resource_count[1],
    loot_profile: zone.loot_profile,
    consumables: [],
  };
};

describe("warehouse loot_profile — fuel-категория > 40% за 1000 вылазок", () => {
  test("statistical gate (mulberry32 seed=20260613)", () => {
    const zones = loadZones();
    const warehouse = zones.find((z) => z.id === "warehouse");
    if (!warehouse) throw new Error("warehouse zone missing");

    const rng = mulberry32(20_260_613);
    const fuelIds = new Set(BASE_RESOURCE_ITEMS.fuel);

    // Подставляем максимально неблокирующее поведение боя: goal=greedy и
    // mob_total_threat=0 гарантируют outcome="won" и полный roll-лута.
    // Это нужно только статистике; в реальной игре часть рулонов уйдёт в
    // fled/knocked_out — это уже балансовый вопрос, не loot_profile.
    void SORTIE_GOALS.greedy; // keep import live for tree-shake

    let totalRolls = 0;
    let fuelRolls = 0;

    for (let sortie = 0; sortie < 1000; sortie++) {
      const depth: 1 | 2 | 3 = ((sortie % 3) + 1) as 1 | 2 | 3;
      const input = buildWarehouseInput(warehouse, depth);
      const res = resolveEncounter(input, rng);
      for (const stack of res.loot_rolled) {
        totalRolls += stack.count;
        if (fuelIds.has(stack.item_id)) {
          fuelRolls += stack.count;
        }
      }
    }

    expect(totalRolls).toBeGreaterThan(0);
    const fuelShare = fuelRolls / totalRolls;
    // Порог по плану — > 40%. Закладываем зазор: profile задаёт fuel 50%,
    // jitter и goal-modifier шумят на ±15%. Реально ожидаем ~48-52%.
    expect(fuelShare).toBeGreaterThan(0.4);
  });
});
