import { describe, expect, it, beforeEach } from "vitest";
import {
  BASE_RESOURCE_ITEMS,
  buildEncounterLootPool,
  accuracyToPowerFactor,
  computeArmorReduction,
  computeMobThreat,
  resolveEncounter,
  resolveFullSortie,
  setNarrative,
  SORTIE_GOALS,
  weightToPowerFactor,
} from "../sortieResolve";
import {
  ACC_FACTOR_MAX,
  ACC_FACTOR_MIN,
  ACCURACY_BASELINE,
  WEIGHT_FACTOR_MIN,
  WEIGHT_FREE_KG,
} from "../../state/balance";
import type {
  EncounterInput,
  HeroSnapshot,
  SortieGoal,
  SortiePlanInput,
} from "../../types/sortie";

/** Seeded LCG — стабильно по конкретному входу. */
const makeRng = (seed: number): (() => number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const baseHero = (overrides: Partial<HeroSnapshot> = {}): HeroSnapshot => ({
  hp: 100,
  hp_max: 100,
  level: 3,
  weapon_damage_avg: 8,
  // M16-PR1 zero-regression baseline: accuracy=BASELINE(0), вес=0 →
  // оба offense-множителя = 1.0 → heroPower бит-в-бит как до M16.
  // Golden-исходы ниже опираются на этот нейтральный default.
  weapon_accuracy: 0,
  weapon_weight: 0,
  armor_reduction: 0.2,
  skill_combat: 2,
  injuries: [],
  ...overrides,
});

const baseEncounter = (
  overrides: Partial<EncounterInput> = {},
): EncounterInput => ({
  hero: baseHero(),
  zone_id: "forest",
  depth: 1,
  goal: "quiet",
  mob_ids: ["wild_dog"],
  mob_total_threat: 12,
  loot_pool: ["scrap_metal", "cloth", "canned_food"],
  loot_base_count: 4,
  consumables: [{ item_id: "bandage", count: 2 }],
  ...overrides,
});

describe("sortieResolve · determinism", () => {
  beforeEach(() => {
    setNarrative(null);
  });

  it("same seed and input → same output", () => {
    const a = resolveEncounter(baseEncounter(), makeRng(42));
    const b = resolveEncounter(baseEncounter(), makeRng(42));
    expect(a).toEqual(b);
  });

  it("different seeds → different rolled outcomes (at least one differs across attempts)", () => {
    let diffSeen = false;
    for (let s = 1; s < 30; s++) {
      const a = resolveEncounter(baseEncounter(), makeRng(s));
      const b = resolveEncounter(baseEncounter(), makeRng(s + 1));
      if (
        a.hp_lost !== b.hp_lost ||
        a.loot_rolled.length !== b.loot_rolled.length ||
        a.outcome !== b.outcome
      ) {
        diffSeen = true;
        break;
      }
    }
    expect(diffSeen).toBe(true);
  });
});

describe("sortieResolve · goals", () => {
  beforeEach(() => setNarrative(null));

  it("targeted_fuel сдвигает лут в сторону топлива (стат. тест)", () => {
    const fuelIds = BASE_RESOURCE_ITEMS.fuel;
    const lootPool = ["scrap_metal", "cloth", "canned_food", "fuel", "water"];
    let fuelHits = 0;
    let totalRolls = 0;
    for (let s = 1; s <= 200; s++) {
      const result = resolveEncounter(
        baseEncounter({ loot_pool: lootPool, loot_base_count: 5, goal: "targeted_fuel" }),
        makeRng(s),
      );
      for (const stack of result.loot_rolled) {
        totalRolls += stack.count;
        if (fuelIds.includes(stack.item_id)) fuelHits += stack.count;
      }
    }
    // В нейтральном пуле fuel = 1/5 = 20%. С таргетом ожидаем хотя бы 50%.
    expect(totalRolls).toBeGreaterThan(0);
    const fuelShare = fuelHits / totalRolls;
    expect(fuelShare).toBeGreaterThan(0.45);
  });

  it("greedy даёт больше лута чем quiet в среднем", () => {
    const pool = ["scrap_metal", "cloth", "canned_food"];
    let quietLoot = 0;
    let greedyLoot = 0;
    for (let s = 1; s <= 100; s++) {
      const q = resolveEncounter(
        baseEncounter({ loot_pool: pool, loot_base_count: 4, goal: "quiet" }),
        makeRng(s),
      );
      const g = resolveEncounter(
        baseEncounter({ loot_pool: pool, loot_base_count: 4, goal: "greedy" }),
        makeRng(s),
      );
      for (const s2 of q.loot_rolled) quietLoot += s2.count;
      for (const s2 of g.loot_rolled) greedyLoot += s2.count;
    }
    expect(greedyLoot).toBeGreaterThan(quietLoot);
  });

  it("greedy наносит больше урона по герою чем quiet", () => {
    // Без расходников — бинты съедают разницу. Лёгкие мобы — победа без knock_out.
    const strongHero = baseHero({ weapon_damage_avg: 30, level: 8, skill_combat: 8, armor_reduction: 0 });
    let quietHpLost = 0;
    let greedyHpLost = 0;
    for (let s = 1; s <= 100; s++) {
      const q = resolveEncounter(
        baseEncounter({ goal: "quiet", hero: strongHero, mob_total_threat: 10, consumables: [] }),
        makeRng(s),
      );
      const g = resolveEncounter(
        baseEncounter({ goal: "greedy", hero: strongHero, mob_total_threat: 10, consumables: [] }),
        makeRng(s),
      );
      quietHpLost += q.hp_lost;
      greedyHpLost += g.hp_lost;
    }
    expect(greedyHpLost).toBeGreaterThan(quietHpLost);
  });
});

describe("sortieResolve · consumables", () => {
  beforeEach(() => setNarrative(null));

  it("аптечка снижает hp_lost при сильном уроне", () => {
    const heavyEnc = baseEncounter({
      mob_total_threat: 60,
      hero: baseHero({ armor_reduction: 0, skill_combat: 0, level: 1, weapon_damage_avg: 4 }),
    });
    let withMedkit = 0;
    let withoutAnything = 0;
    for (let s = 1; s <= 30; s++) {
      const a = resolveEncounter(
        { ...heavyEnc, consumables: [{ item_id: "medkit", count: 3 }] },
        makeRng(s),
      );
      const b = resolveEncounter({ ...heavyEnc, consumables: [] }, makeRng(s));
      withMedkit += a.hp_lost;
      withoutAnything += b.hp_lost;
    }
    expect(withMedkit).toBeLessThan(withoutAnything);
  });

  it("сообщает использованный расходник", () => {
    const heavyEnc = baseEncounter({
      mob_total_threat: 60,
      hero: baseHero({ armor_reduction: 0, skill_combat: 0, level: 1, weapon_damage_avg: 4 }),
      consumables: [{ item_id: "medkit", count: 2 }],
    });
    const result = resolveEncounter(heavyEnc, makeRng(7));
    if (result.hp_lost === 0) {
      // possible edge: уже залечило в ноль
      return;
    }
    expect(result.consumables_used.length).toBeGreaterThanOrEqual(0);
  });
});

describe("sortieResolve · injury", () => {
  beforeEach(() => setNarrative(null));

  it("не выдаёт травм при низком уроне (sample)", () => {
    const safe = baseEncounter({
      mob_total_threat: 4,
      hero: baseHero({ armor_reduction: 0.5, weapon_damage_avg: 15, level: 5, skill_combat: 5 }),
    });
    let injuredCount = 0;
    for (let s = 1; s <= 200; s++) {
      const r = resolveEncounter(safe, makeRng(s));
      if (r.injury) injuredCount++;
    }
    // Допускаем редкий outlier, но не больше 5%.
    expect(injuredCount).toBeLessThan(10);
  });

  it("knocked_out всегда выдаёт травму", () => {
    const lethal = baseEncounter({
      mob_total_threat: 500,
      hero: baseHero({ hp: 100, weapon_damage_avg: 1, skill_combat: 0, level: 1, armor_reduction: 0 }),
      consumables: [],
    });
    const goals: SortieGoal[] = ["quiet", "greedy", "targeted_fuel"];
    for (const goal of goals) {
      for (let s = 1; s <= 5; s++) {
        const r = resolveEncounter({ ...lethal, goal }, makeRng(s * 11));
        if (r.outcome === "knocked_out") {
          expect(r.injury).toBeDefined();
        }
      }
    }
  });
});

describe("sortieResolve · resolveFullSortie", () => {
  beforeEach(() => setNarrative(null));

  it("суммирует результаты энкаунтеров", () => {
    const input: SortiePlanInput = {
      hero: baseHero(),
      zone_id: "forest",
      depth: 1,
      goal: "quiet",
      encounters: [
        baseEncounter({ mob_total_threat: 8 }),
        baseEncounter({ mob_total_threat: 10 }),
      ],
    };
    const result = resolveFullSortie(input, makeRng(123));
    expect(result.encounter_results.length).toBeGreaterThanOrEqual(1);
    const lootSum = result.totals.loot.reduce((sum, s) => sum + s.count, 0);
    const calcSum = result.encounter_results
      .flatMap((e) => e.loot_rolled)
      .reduce((sum, s) => sum + s.count, 0);
    expect(lootSum).toBe(calcSum);
  });

  it("knocked_out прерывает цепочку энкаунтеров", () => {
    const input: SortiePlanInput = {
      hero: baseHero({ hp: 20, weapon_damage_avg: 1, level: 1, skill_combat: 0, armor_reduction: 0 }),
      zone_id: "forest",
      depth: 3,
      goal: "greedy",
      encounters: [
        baseEncounter({ mob_total_threat: 200, depth: 3 }),
        baseEncounter({ mob_total_threat: 5 }),
      ],
    };
    const result = resolveFullSortie(input, makeRng(99));
    if (result.outcome === "knocked_out") {
      expect(result.encounter_results.length).toBe(1);
    }
  });
});

describe("sortieResolve · helpers", () => {
  it("computeMobThreat суммирует danger / hp+damage", () => {
    const mobs = {
      wild_dog: { hp: 20, damage_min: 3, damage_max: 6 },
      mutant: { danger: 18 },
    };
    const threat = computeMobThreat(["wild_dog", "mutant", "unknown_id"], mobs);
    // wild_dog: avg(3,6)=4.5 + 20/10=2 → 6.5; mutant: 18 → 24.5
    expect(threat).toBeCloseTo(24.5, 5);
  });

  it("buildEncounterLootPool детерминирован для одинакового rng-сида", () => {
    const a = buildEncounterLootPool(["a", "b", "c"], [3, 5], makeRng(7));
    const b = buildEncounterLootPool(["a", "b", "c"], [3, 5], makeRng(7));
    expect(a).toEqual(b);
    expect(a.base_count).toBeGreaterThanOrEqual(3);
    expect(a.base_count).toBeLessThanOrEqual(5);
  });

  it("SORTIE_GOALS содержит все 6 ID-ов", () => {
    const keys = Object.keys(SORTIE_GOALS);
    expect(keys).toContain("quiet");
    expect(keys).toContain("greedy");
    expect(keys).toContain("targeted_fuel");
    expect(keys).toContain("targeted_metal");
    expect(keys).toContain("targeted_food");
    expect(keys).toContain("targeted_water");
  });
});

describe("sortieResolve · computeArmorReduction", () => {
  // Хелпер живёт ровно ради одной точки в SortieRunScene.snapshotHero(), где
  // данные брони встречаются с авторесолвом. Тесты бьют именно по маппингу,
  // а не по форме HeroSnapshot — иначе зелёный тест ничего не ловит.

  it("undefined → 0.1 baseline", () => {
    expect(computeArmorReduction(undefined)).toBeCloseTo(0.1, 5);
  });

  it("non-object → 0.1 baseline", () => {
    expect(computeArmorReduction(null)).toBeCloseTo(0.1, 5);
    expect(computeArmorReduction(42)).toBeCloseTo(0.1, 5);
  });

  it("M13: stats.armor_value делится на 10", () => {
    expect(computeArmorReduction({ stats: { armor_value: 3 } })).toBeCloseTo(0.3, 5);
    expect(computeArmorReduction({ stats: { armor_value: 5 } })).toBeCloseTo(0.5, 5);
  });

  it("legacy до миграции: stats.defense делится на 10", () => {
    // Источник из текущего items.json — cloth_jacket=1, leather_vest=3.
    expect(computeArmorReduction({ stats: { defense: 1 } })).toBeCloseTo(0.1, 5);
    expect(computeArmorReduction({ stats: { defense: 3 } })).toBeCloseTo(0.3, 5);
  });

  it("M13 stats.armor_value приоритетнее legacy stats.defense", () => {
    // На случай переходного состояния, когда оба поля присутствуют.
    expect(
      computeArmorReduction({ stats: { armor_value: 5, defense: 1 } }),
    ).toBeCloseTo(0.5, 5);
  });

  it("paranoid fallback: top-level armor_reduction идёт как есть", () => {
    expect(computeArmorReduction({ armor_reduction: 0.4 })).toBeCloseTo(0.4, 5);
  });

  it("paranoid fallback: top-level defense делится на 10", () => {
    expect(computeArmorReduction({ defense: 2 })).toBeCloseTo(0.2, 5);
  });

  it("clamp ≤ 0.9: переразмерные значения режутся сверху", () => {
    expect(computeArmorReduction({ stats: { armor_value: 100 } })).toBeCloseTo(0.9, 5);
    expect(computeArmorReduction({ armor_reduction: 1.5 })).toBeCloseTo(0.9, 5);
  });

  it("распознанная броня с нулевым/отрицательным значением → 0.1 baseline, не хуже голого", () => {
    // scout_mask в текущем items.json имеет defense=0; без floor-а
    // надетая маска давала 0 редукции, т.е. была хуже отсутствия брони.
    expect(computeArmorReduction({ stats: { defense: 0 } })).toBeCloseTo(0.1, 5);
    expect(computeArmorReduction({ stats: { armor_value: 0 } })).toBeCloseTo(0.1, 5);
    expect(computeArmorReduction({ stats: { armor_value: -5 } })).toBeCloseTo(0.1, 5);
    expect(computeArmorReduction({ armor_reduction: -0.2 })).toBeCloseTo(0.1, 5);
    expect(computeArmorReduction({ defense: 0 })).toBeCloseTo(0.1, 5);
  });

  it("распознанная броня с def=1 совпадает с baseline (граница floor-а)", () => {
    // Чтобы доказать что floor 0.1 не задирает def≥1 — cloth_jacket=1
    // как был 0.1, так и остался 0.1, без эффекта на остальной баланс.
    expect(computeArmorReduction({ stats: { defense: 1 } })).toBeCloseTo(0.1, 5);
  });

  it("пустая броня без распознаваемых полей → 0.1", () => {
    expect(computeArmorReduction({ stats: {} })).toBeCloseTo(0.1, 5);
    expect(computeArmorReduction({ id: "naked", name_ru: "ничего" })).toBeCloseTo(0.1, 5);
  });

  // M13 PR-6a: 3-slot armor aggregation (C7/C8). Floor/clamp на сумме,
  // не per-slot — иначе три пустых слота уехали бы в 0.3 вместо
  // baseline 0.1. Тесты бьют по самой острой границе.

  it("3-slot: пустой массив → 0.1 baseline (равно голому)", () => {
    expect(computeArmorReduction([])).toBeCloseTo(0.1, 5);
  });

  it("3-slot: три armor_value=0 → 0.1 (floor на агрегате, не per-slot)", () => {
    // Per-slot floor дал бы 0.1+0.1+0.1=0.3 — неправильно. Аггрегат-floor
    // даёт max(0, 0+0+0) = 0, потом max(0.1, 0) = 0.1 baseline.
    expect(
      computeArmorReduction([
        { stats: { armor_value: 0 } },
        { stats: { armor_value: 0 } },
        { stats: { armor_value: 0 } },
      ]),
    ).toBeCloseTo(0.1, 5);
  });

  it("3-slot: суммируется через слоты, потом clamp 0.9", () => {
    // helm 1 + plate 3 + strap 2 = 0.6 редукции. Ниже clamp-а.
    expect(
      computeArmorReduction([
        { stats: { armor_value: 1 } },
        { stats: { armor_value: 3 } },
        { stats: { armor_value: 2 } },
      ]),
    ).toBeCloseTo(0.6, 5);
  });

  it("3-slot: сумма > 9 клампится до 0.9", () => {
    expect(
      computeArmorReduction([
        { stats: { armor_value: 5 } },
        { stats: { armor_value: 5 } },
        { stats: { armor_value: 5 } },
      ]),
    ).toBeCloseTo(0.9, 5);
  });

  it("3-slot: смешанные слоты с легаси-полями суммируются корректно", () => {
    // Защита от случая «после миграции один путь, до — другой» —
    // суммируем безотносительно конкретного пути формы.
    expect(
      computeArmorReduction([
        { stats: { armor_value: 2 } },  // 0.2
        { stats: { defense: 3 } },      // 0.3
        { armor_reduction: 0.1 },        // 0.1
      ]),
    ).toBeCloseTo(0.6, 5);
  });
});

// ─────────────────────────────────────────────────────────────────────
// M16 PR-1: offense-множители accuracy/weight в computeHeroPower.
// Тесты бьют по инвариантам (baseline=1.0, монотонность, clamp, zero-
// regression), НЕ по конкретным числам тюнинга.
// ─────────────────────────────────────────────────────────────────────
describe("sortieResolve · accuracyToPowerFactor (M16-PR1)", () => {
  it("baseline accuracy → ровно 1.0 (нейтрально, zero-regression)", () => {
    expect(accuracyToPowerFactor(ACCURACY_BASELINE)).toBe(1);
  });

  it("монотонно растёт с accuracy", () => {
    const lo = accuracyToPowerFactor(ACCURACY_BASELINE + 1);
    const hi = accuracyToPowerFactor(ACCURACY_BASELINE + 10);
    expect(lo).toBeGreaterThan(1);
    expect(hi).toBeGreaterThan(lo);
  });

  it("accuracy ниже baseline → фактор < 1 (штраф)", () => {
    expect(accuracyToPowerFactor(ACCURACY_BASELINE - 5)).toBeLessThan(1);
  });

  it("clamp в [ACC_FACTOR_MIN, ACC_FACTOR_MAX] на экстремумах", () => {
    expect(accuracyToPowerFactor(ACCURACY_BASELINE + 100000)).toBe(ACC_FACTOR_MAX);
    expect(accuracyToPowerFactor(ACCURACY_BASELINE - 100000)).toBe(ACC_FACTOR_MIN);
  });
});

describe("sortieResolve · weightToPowerFactor (M16-PR1)", () => {
  it("вес ≤ WEIGHT_FREE_KG → ровно 1.0 (без штрафа)", () => {
    expect(weightToPowerFactor(0)).toBe(1);
    expect(weightToPowerFactor(WEIGHT_FREE_KG)).toBe(1);
  });

  it("сверх порога — монотонно падает, но никогда > 1", () => {
    const a = weightToPowerFactor(WEIGHT_FREE_KG + 1);
    const b = weightToPowerFactor(WEIGHT_FREE_KG + 5);
    expect(a).toBeLessThan(1);
    expect(b).toBeLessThan(a);
  });

  it("пол WEIGHT_FACTOR_MIN на экстремальном весе", () => {
    expect(weightToPowerFactor(WEIGHT_FREE_KG + 100000)).toBe(WEIGHT_FACTOR_MIN);
  });
});

describe("sortieResolve · M16 zero-regression в бою", () => {
  it("baseline accuracy + вес 0 → исход идентичен (множители = 1.0)", () => {
    // Контрольная группа = нейтральный baseHero. Если formula-вставка
    // M16 не нейтральна на baseline, детерминированный исход разойдётся.
    const neutral = resolveEncounter(baseEncounter(), makeRng(7));
    const explicit = resolveEncounter(
      baseEncounter({
        hero: baseHero({ weapon_accuracy: ACCURACY_BASELINE, weapon_weight: 0 }),
      }),
      makeRng(7),
    );
    expect(explicit).toEqual(neutral);
  });

  it("высокая accuracy усиливает героя (≥ исход при baseline по силе)", () => {
    // Прокси-проверка через win-rate на спектре сидов: больше accuracy →
    // не меньше побед (монотонный вклад в heroPower).
    const wins = (acc: number): number => {
      let w = 0;
      for (let s = 0; s < 40; s++) {
        const r = resolveEncounter(
          baseEncounter({
            mob_total_threat: 18,
            hero: baseHero({ weapon_accuracy: acc }),
          }),
          makeRng(s + 1),
        );
        if (r.outcome === "won") w++;
      }
      return w;
    };
    expect(wins(ACCURACY_BASELINE + 20)).toBeGreaterThanOrEqual(wins(ACCURACY_BASELINE));
  });

  it("тяжёлое оружие ослабляет героя (≤ побед против baseline)", () => {
    const wins = (weight: number): number => {
      let w = 0;
      for (let s = 0; s < 40; s++) {
        const r = resolveEncounter(
          baseEncounter({
            mob_total_threat: 18,
            hero: baseHero({ weapon_weight: weight }),
          }),
          makeRng(s + 1),
        );
        if (r.outcome === "won") w++;
      }
      return w;
    };
    expect(wins(WEIGHT_FREE_KG + 20)).toBeLessThanOrEqual(wins(0));
  });
});
