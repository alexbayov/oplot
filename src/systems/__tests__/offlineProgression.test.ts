/**
 * M13 PR-6c — offline accrual tests.
 *
 * Все 8 invariants из preflight §8 + §9. Чистая функция (без mock-ов
 * Phaser/GameState) — тесты бьют по shape, не по wiring.
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import {
  accrualHasYield,
  accrueBed,
  accrueDecay,
  accrueOffline,
  formatOfflineSummary,
  type AccrualState,
} from "../offlineProgression";
import { createDefaultBuildings } from "../../state/GameState";
import {
  BED_ENERGY_GATE,
  BED_ENERGY_PER_HOUR,
  BED_HP_PER_HOUR,
  BUNK_CYCLE_MS,
  BUNK_FOOD_PER_CYCLE,
  BUNK_HP_PER_CYCLE,
  GARDEN_CAP,
  GARDEN_CYCLE_MS,
  GARDEN_FOOD_PER_CYCLE,
  GARDEN_WATER_PER_CYCLE,
  MAX_OFFLINE_WINDOW_MS,
  MIN_ACCRUAL_WINDOW_MS,
  OFFLINE_ACCUMULATION_CAP_HOURS,
} from "../../state/balance";

const T0 = 1_000_000_000_000; // arbitrary fixed anchor (avoids Date.now drift)

const baseState = (overrides: Partial<AccrualState> = {}): AccrualState => ({
  baseResources: { water: 100, fuel: 0, metal: 0, food: 0, energy: 0 },
  buildings: createDefaultBuildings(),
  hp: 50,
  hp_max: 100,
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("accrueOffline — pure function contract", () => {
  it("no-op при delta < MIN_ACCRUAL_WINDOW_MS (30с)", () => {
    const s = baseState();
    const { state, summary } = accrueOffline(s, T0, T0 + 30 * 1000);
    expect(state).toEqual(s); // state не меняется
    expect(summary.delta_ms).toBe(0);
    expect(summary.garden_food_added).toBe(0);
    expect(summary.bunk_hp_added).toBe(0);
    expect(summary.rolled_back).toBe(false);
  });

  it("rollback при delta < 0 (now < savedAt)", () => {
    // Spy на console.log чтобы тест не шумел (telemetry track падает
    // в console.log при отсутствии ym counter).
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const s = baseState();
    const { state, summary } = accrueOffline(s, T0, T0 - 3_600_000);
    expect(state).toEqual(s);
    expect(summary.rolled_back).toBe(true);
    expect(summary.delta_ms).toBe(0);
  });

  it("NaN/Infinity delta трактуется как rollback (safety)", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const s = baseState();
    const { summary } = accrueOffline(s, Number.NaN, T0);
    expect(summary.rolled_back).toBe(true);
  });

  it("cap window: delta=100ч клампится до 24ч, capped_at_max=true", () => {
    const s = baseState({ baseResources: { water: 1000, fuel: 0, metal: 0, food: 0, energy: 0 } });
    const { summary } = accrueOffline(s, T0, T0 + 100 * 3600 * 1000);
    expect(summary.capped_at_max).toBe(true);
    expect(summary.delta_ms).toBe(MAX_OFFLINE_WINDOW_MS);
    expect(summary.delta_ms).toBe(24 * 3600 * 1000);
  });

  it("garden cap: 100ч offline → буфер ровно GARDEN_CAP, без переполнения", () => {
    const s = baseState({ baseResources: { water: 1000, fuel: 0, metal: 0, food: 0, energy: 0 } });
    const { state, summary } = accrueOffline(s, T0, T0 + 100 * 3600 * 1000);
    const garden = state.buildings.find((b) => b.id === "garden");
    expect(garden?.accumulated_output).toBe(GARDEN_CAP);
    expect(summary.garden_food_added).toBe(GARDEN_CAP);
  });

  it("input-bounded: water=0 → garden 0 цциклов, water не уходит в минус", () => {
    const s = baseState({ baseResources: { water: 0, fuel: 0, metal: 0, food: 0, energy: 0 } });
    const { state, summary } = accrueOffline(s, T0, T0 + 5 * 3600 * 1000);
    expect(summary.garden_food_added).toBe(0);
    expect(summary.garden_water_spent).toBe(0);
    expect(state.baseResources.water).toBe(0); // unchanged, not negative
  });

  it("bunk не превышает hp_max", () => {
    const s = baseState({
      hp: 95,
      hp_max: 100,
      baseResources: { water: 0, fuel: 0, metal: 0, food: 100, energy: 0 },
    });
    const { state, summary } = accrueOffline(s, T0, T0 + 8 * 3600 * 1000);
    expect(state.hp).toBe(100);
    // hp_max=100, hp=95, нужно +5 hp = 1 цикл = 1 food.
    expect(summary.bunk_hp_added).toBe(5);
    expect(summary.bunk_food_spent).toBe(1);
  });

  it("bunk останавливается когда food=0", () => {
    const s = baseState({
      hp: 0,
      hp_max: 100,
      baseResources: { water: 0, fuel: 0, metal: 0, food: 3, energy: 0 },
    });
    const { state, summary } = accrueOffline(s, T0, T0 + 8 * 3600 * 1000);
    expect(summary.bunk_food_spent).toBe(3);
    expect(summary.bunk_hp_added).toBe(15); // 3 цикла × 5 HP
    expect(state.baseResources.food).toBe(0);
    expect(state.hp).toBe(15);
  });

  it("детерминизм: один и тот же вход → один и тот же выход", () => {
    const s = baseState({ baseResources: { water: 20, fuel: 0, metal: 0, food: 30, energy: 0 } });
    const a = accrueOffline(s, T0, T0 + 2 * 3600 * 1000);
    const b = accrueOffline(s, T0, T0 + 2 * 3600 * 1000);
    expect(b.state).toEqual(a.state);
    expect(b.summary).toEqual(a.summary);
  });

  it("ставки матчат балансовые константы (sanity)", () => {
    const s = baseState({
      baseResources: { water: 10, fuel: 0, metal: 0, food: 0, energy: 0 },
      hp: 50,
      hp_max: 100,
    });
    // Ровно 1 цикл грядки: 30 мин offline = 1 цикл = +5 food, −1 water
    const oneGarden = accrueOffline(s, T0, T0 + GARDEN_CYCLE_MS);
    expect(oneGarden.summary.garden_food_added).toBe(GARDEN_FOOD_PER_CYCLE);
    expect(oneGarden.summary.garden_water_spent).toBe(GARDEN_WATER_PER_CYCLE);

    // 30 мин также = 3 цикла койки (10 мин × 3) если есть food. food=0 → 0.
    expect(oneGarden.summary.bunk_food_spent).toBe(0);
    expect(oneGarden.summary.bunk_hp_added).toBe(0);

    // С food=10, 30 мин = 3 цикла койки = -3 food, +15 hp (50→65)
    const withFood = accrueOffline(
      baseState({
        baseResources: { water: 0, fuel: 0, metal: 0, food: 10, energy: 0 },
        hp: 50,
        hp_max: 100,
      }),
      T0,
      T0 + BUNK_CYCLE_MS * 3,
    );
    expect(withFood.summary.bunk_hp_added).toBe(BUNK_HP_PER_CYCLE * 3);
    expect(withFood.summary.bunk_food_spent).toBe(BUNK_FOOD_PER_CYCLE * 3);
  });

  it("min boundary: delta точно MIN_ACCRUAL_WINDOW_MS — accrual идёт", () => {
    const s = baseState();
    const { summary } = accrueOffline(s, T0, T0 + MIN_ACCRUAL_WINDOW_MS);
    expect(summary.delta_ms).toBe(MIN_ACCRUAL_WINDOW_MS);
    // 60с < 10мин (койка) и < 30мин (грядка) → 0 циклов обоих
    expect(summary.garden_food_added).toBe(0);
    expect(summary.bunk_hp_added).toBe(0);
  });
});

describe("accrualHasYield — toast guard", () => {
  it("true если garden или bunk начислили", () => {
    expect(accrualHasYield({
      delta_ms: 1, rolled_back: false, capped_at_max: false,
      garden_food_added: 5, garden_water_spent: 1, bunk_hp_added: 0, bunk_food_spent: 0,
      generator_energy_added: 0, generator_fuel_spent: 0, bed_hp_added: 0, bed_energy_spent: 0,
    })).toBe(true);
    expect(accrualHasYield({
      delta_ms: 1, rolled_back: false, capped_at_max: false,
      garden_food_added: 0, garden_water_spent: 0, bunk_hp_added: 5, bunk_food_spent: 1,
      generator_energy_added: 0, generator_fuel_spent: 0, bed_hp_added: 0, bed_energy_spent: 0,
    })).toBe(true);
  });

  it("false если ничего реально не начислилось", () => {
    expect(accrualHasYield({
      delta_ms: 0, rolled_back: false, capped_at_max: false,
      garden_food_added: 0, garden_water_spent: 0, bunk_hp_added: 0, bunk_food_spent: 0,
      generator_energy_added: 0, generator_fuel_spent: 0, bed_hp_added: 0, bed_energy_spent: 0,
    })).toBe(false);
    expect(accrualHasYield({
      delta_ms: 0, rolled_back: true, capped_at_max: false,
      garden_food_added: 0, garden_water_spent: 0, bunk_hp_added: 0, bunk_food_spent: 0,
      generator_energy_added: 0, generator_fuel_spent: 0, bed_hp_added: 0, bed_energy_spent: 0,
    })).toBe(false);
  });

  it("true если generator начислил energy", () => {
    expect(accrualHasYield({
      delta_ms: 1, rolled_back: false, capped_at_max: false,
      garden_food_added: 0, garden_water_spent: 0, bunk_hp_added: 0, bunk_food_spent: 0,
      generator_energy_added: 3, generator_fuel_spent: 3, bed_hp_added: 0, bed_energy_spent: 0,
    })).toBe(true);
  });
});

// ─── M13 PR-6b-3 generator (bunk-model) ──────────────────────────────

describe("accrueOffline — generator (M13 PR-6b-3)", () => {
  it("(a) energy ВЫРОС в baseResources.energy (не в accumulated_output) — bunk-model", () => {
    const s = baseState({
      baseResources: { water: 0, fuel: 10, metal: 0, food: 0, energy: 0 },
    });
    const r = accrueOffline(s, T0, T0 + 10 * 60_000); // 10 min = 2 cycles
    expect(r.state.baseResources.energy).toBe(2);
    expect(r.summary.generator_energy_added).toBe(2);
    // КЛЮЧЕВОЕ: generator.accumulated_output ОСТАЁТСЯ 0 (D4×D8 trap).
    const gen = r.state.buildings.find((b) => b.id === "generator");
    expect(gen?.accumulated_output).toBe(0);
  });

  it("(b) fuel списан 1:1, не уходит в минус (input-bounded)", () => {
    const s = baseState({
      baseResources: { water: 0, fuel: 2, metal: 0, food: 0, energy: 0 },
    });
    // 1h = 12 cycles теоретически, но fuel=2 ограничивает до 2.
    const r = accrueOffline(s, T0, T0 + 60 * 60_000);
    expect(r.state.baseResources.fuel).toBe(0);
    expect(r.state.baseResources.energy).toBe(2);
    expect(r.summary.generator_fuel_spent).toBe(2);
  });

  it("без fuel → 0 циклов, energy не растёт", () => {
    const s = baseState({
      baseResources: { water: 0, fuel: 0, metal: 0, food: 0, energy: 0 },
    });
    const r = accrueOffline(s, T0, T0 + 10 * 60_000);
    expect(r.state.baseResources.energy).toBe(0);
    expect(r.summary.generator_energy_added).toBe(0);
  });

  it("NaN-guard: baseResources.energy === undefined → 0, не NaN", () => {
    // Синтетический skip-migrate: миграция провалена, energy отсутствует.
    // accrueGenerator должен прочитать `?? 0` и не писать NaN в save.
    const s = baseState({
      baseResources: { water: 0, fuel: 5, metal: 0, food: 0 } as never,
    });
    const r = accrueOffline(s, T0, T0 + 10 * 60_000);
    expect(r.state.baseResources.energy).toBe(2);
    expect(Number.isFinite(r.state.baseResources.energy)).toBe(true);
  });

  it("без generator-building → no-op, energy не пишется", () => {
    // Trap B-вариант-2: миграция провалена, generator отсутствует.
    // accrueGenerator делает findBuilding и возвращает no-op.
    const s = baseState({
      buildings: [
        { id: "garden", accumulated_output: 0 },
        { id: "bunk", accumulated_output: 0 },
      ],
      baseResources: { water: 0, fuel: 10, metal: 0, food: 0, energy: 0 },
    });
    const r = accrueOffline(s, T0, T0 + 10 * 60_000);
    expect(r.state.baseResources.energy).toBe(0);
    expect(r.summary.generator_energy_added).toBe(0);
    // fuel тоже не списан.
    expect(r.state.baseResources.fuel).toBe(10);
  });

  it("fixed-order [generator, garden, bunk]: накопленная energy не влияет на garden/bunk", () => {
    // Здания независимы по storage (gen: fuel, garden: water, bunk: food),
    // но fixed-порядок для детерминизма.
    const s = baseState({
      baseResources: { water: 10, fuel: 5, metal: 0, food: 20, energy: 0 },
      hp: 50,
    });
    const r = accrueOffline(s, T0, T0 + 60 * 60_000);
    expect(r.summary.generator_energy_added).toBeGreaterThan(0);
    expect(r.summary.garden_food_added).toBeGreaterThan(0);
    expect(r.summary.bunk_hp_added).toBeGreaterThan(0);
  });
});


// ─── M17 PR1 bed production tick ───────────────────────────────────────

describe("accrueBed — M17 PR1 hourly bed production", () => {
  it("monotonic by elapsed hours when energy gate is satisfied", () => {
    const s = baseState({
      hp: 50,
      baseResources: { water: 0, fuel: 0, metal: 0, food: 0, energy: BED_ENERGY_GATE },
    });
    const one = accrueBed(s, 1).state.hp;
    const three = accrueBed(s, 3).state.hp;
    expect(three).toBeGreaterThan(one);
  });

  it("caps 100h at exactly 24h × rate", () => {
    const s = baseState({
      hp: 0,
      hp_max: 100,
      baseResources: { water: 0, fuel: 0, metal: 0, food: 0, energy: BED_ENERGY_GATE },
    });
    const r = accrueBed(s, 100);
    expect(r.hp_added).toBe(OFFLINE_ACCUMULATION_CAP_HOURS * BED_HP_PER_HOUR);
  });

  it("energy gate: energy below gate does not heal", () => {
    const s = baseState({
      hp: 50,
      baseResources: { water: 0, fuel: 0, metal: 0, food: 0, energy: BED_ENERGY_GATE - 0.01 },
    });
    const r = accrueBed(s, 10);
    expect(r.state.hp).toBe(s.hp);
    expect(r.hp_added).toBe(0);
  });

  it("idempotency: tick(1h) three times equals tick(3h)", () => {
    const s = baseState({
      hp: 50,
      baseResources: { water: 0, fuel: 0, metal: 0, food: 0, energy: BED_ENERGY_GATE },
    });
    const sequential = [1, 1, 1].reduce((state, hours) => accrueBed(state, hours).state, s);
    const single = accrueBed(s, 3).state;
    expect(sequential).toEqual(single);
  });

  it("accrueOffline elapsed-hours dispatcher includes bed tick", () => {
    const s = baseState({
      hp: 10,
      baseResources: { water: 0, fuel: 0, metal: 0, food: 0, energy: 2 * BED_ENERGY_PER_HOUR },
    });
    const r = accrueOffline(s, 2);
    expect(r.summary.bed_hp_added).toBe(2 * BED_HP_PER_HOUR);
    expect(r.summary.bed_energy_spent).toBe(2 * BED_ENERGY_PER_HOUR);
    expect(r.state.hp).toBe(10 + 2 * BED_HP_PER_HOUR);
  });
});


describe("formatOfflineSummary — M17 PR2 summary dialog text", () => {
  it("includes HP and energy gains for the offline summary dialog", () => {
    const text = formatOfflineSummary({
      delta_ms: 2 * 3600 * 1000,
      rolled_back: false,
      capped_at_max: false,
      garden_food_added: 0,
      garden_water_spent: 0,
      bunk_hp_added: 1,
      bunk_food_spent: 0,
      generator_energy_added: 3,
      generator_fuel_spent: 3,
      bed_hp_added: 2, bed_energy_spent: 0,
    });
    expect(text).toContain("+3 HP");
    expect(text).toContain("+3 energy");
  });
});


describe("accrueDecay — M17 PR3 bed energy sink", () => {
  it("48h dry run drains energy to zero and bed stops healing", () => {
    const s = baseState({
      hp: 0,
      hp_max: 100,
      baseResources: { water: 0, fuel: 0, metal: 0, food: 0, energy: 1 },
    });
    const r = accrueOffline(s, 48);
    expect(r.state.baseResources.energy).toBe(0);
    expect(r.summary.bed_hp_added).toBe(1 / BED_ENERGY_PER_HOUR * BED_HP_PER_HOUR);

    const stopped = accrueOffline(r.state, 1);
    expect(stopped.summary.bed_hp_added).toBe(0);
  });

  it("zero-energy cascade: bed does not heal, generator still produces from fuel", () => {
    const s = baseState({
      hp: 10,
      baseResources: { water: 0, fuel: 2, metal: 0, food: 0, energy: 0 },
    });
    const r = accrueOffline(s, 1);
    expect(r.summary.bed_hp_added).toBe(0);
    expect(r.summary.generator_energy_added).toBe(2);
    expect(r.state.baseResources.energy).toBe(2);
  });

  it("after 12h offline energy below bed gate motivates sortie", () => {
    const s = baseState({
      hp: 0,
      baseResources: { water: 0, fuel: 0, metal: 0, food: 0, energy: BED_ENERGY_GATE },
    });
    const r = accrueOffline(s, 12);
    expect(r.state.baseResources.energy).toBeLessThan(BED_ENERGY_GATE);
  });

  it("accrueDecay is pure and input-bounds energy consumption", () => {
    const s = baseState({
      baseResources: { water: 0, fuel: 0, metal: 0, food: 0, energy: 0.2 },
    });
    const r = accrueDecay(s, 10);
    expect(s.baseResources.energy).toBe(0.2);
    expect(r.state.baseResources.energy).toBe(0);
    expect(r.bed_hours_available).toBe(0.2 / BED_ENERGY_PER_HOUR);
  });
});
