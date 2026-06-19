// M13 PR-6c — Offline progression accrual.
//
// Закрывает loop-gap который я давно флагал: baseResources только аккумулирует
// от вылазок (`ReturnScene` делает `baseResources[x] += loot`), но
// `consumeBaseResource` существовал с PR-1 без вызовов. PR-6c наконец-то
// дёргает: грядка дренит water → накапливает food в свой буфер; койка
// дренит food → лечит player.hp напрямую.
//
// Чистая функция без зависимостей от Phaser/GameState — принимает входное
// состояние, возвращает выходное + summary что было начислено. Это даёт:
//   - детерминизм (одинаковые входы → одинаковый выход)
//   - тестируемость без mock-ов BaseScene
//   - callerу решать что делать с summary (показывать toast или нет)
//
// Триггерится:
//   (a) на загрузке внутри applySnapshot (anchor = migrated.saved_at)
//   (b) на входе в BaseScene (anchor = последний сейв)
// Без setInterval / per-frame тика — ленивый pull на user-action.
//
// Time source: anchor = saved_at из CloudSaveSnapshot (ISO, уже пишется).
// ysdk.serverTime не существует в YaGamesSDK — preflight §3 подтвердил.
// Клиентские часы эксплойтятся, но ограничены капом 8ч + min-60s + rollback.

import {
  BUNK_CYCLE_MS,
  BUNK_FOOD_PER_CYCLE,
  BED_ENERGY_GATE,
  BED_HP_PER_HOUR,
  BUNK_HP_PER_CYCLE,
  GARDEN_CAP,
  GARDEN_CYCLE_MS,
  GARDEN_FOOD_PER_CYCLE,
  GARDEN_WATER_PER_CYCLE,
  GENERATOR_CYCLE_MS,
  GENERATOR_ENERGY_PER_CYCLE,
  GENERATOR_FUEL_PER_CYCLE,
  MAX_OFFLINE_WINDOW_MS,
  MIN_ACCRUAL_WINDOW_MS,
  OFFLINE_ACCUMULATION_CAP_HOURS,
} from "../state/balance";
import { consumeBaseResource } from "../state/GameState";
import type { BaseResources, BuildingState } from "../state/types";
import { track } from "./telemetry";

/**
 * Снимок что accrueOffline начислил. Возвращается ВСЕГДА — включая
 * no-op (`delta < min`) и rollback (`delta < 0`). В этих случаях все
 * *_added/*_spent = 0, флаги показывают почему был skip. Caller сам
 * решает показывать toast или нет (правило: только если что-то реально
 * начислилось).
 */
export interface AccrualSummary {
  /** Фактическое окно (после max-clamp). 0 при rollback/no-op. */
  delta_ms: number;
  /** True если delta < 0 — клиентские часы откатились назад. */
  rolled_back: boolean;
  /** True если delta превысила MAX_OFFLINE_WINDOW_MS и была заклампена. */
  capped_at_max: boolean;
  /** Food накопленный грядкой в свой буфер за этот accrual. */
  garden_food_added: number;
  /** Water потраченный грядкой за этот accrual. */
  garden_water_spent: number;
  /** HP вылеченный койкой за этот accrual (clamp ≤ hp_max). */
  bunk_hp_added: number;
  /** Food потраченный койкой за этот accrual. */
  bunk_food_spent: number;
  /** M13 PR-6b-3: energy накопленная генератором в `baseResources.energy`
   * НАПРЯМУЮ (bunk-model, без buffer). */
  generator_energy_added: number;
  /** M13 PR-6b-3: fuel потраченный генератором за этот accrual. */
  generator_fuel_spent: number;
  /** M17 PR1: HP added by bed hourly production (energy-gated, no consumption). */
  bed_hp_added: number;
}

/**
 * Состояние которое accrueOffline принимает и возвращает. Subset
 * GameStateShape — только поля которые accrual трогает. Pure-функция
 * не лезет в GameState напрямую.
 */
export interface AccrualState {
  baseResources: BaseResources;
  buildings: BuildingState[];
  /** player.hp — мутируется койкой. */
  hp: number;
  /** player.hp_max — верхний clamp для койки. */
  hp_max: number;
}

export interface AccrualResult {
  state: AccrualState;
  summary: AccrualSummary;
}

const EMPTY_SUMMARY: AccrualSummary = {
  delta_ms: 0,
  rolled_back: false,
  capped_at_max: false,
  garden_food_added: 0,
  garden_water_spent: 0,
  generator_energy_added: 0,
  generator_fuel_spent: 0,
  bed_hp_added: 0,
  bunk_hp_added: 0,
  bunk_food_spent: 0,
};


export interface BedAccrualBalance {
  hpPerHour: number;
  energyGate: number;
  capHours: number;
}

export const DEFAULT_BED_ACCRUAL_BALANCE: BedAccrualBalance = {
  hpPerHour: BED_HP_PER_HOUR,
  energyGate: BED_ENERGY_GATE,
  capHours: OFFLINE_ACCUMULATION_CAP_HOURS,
};

const findBuilding = (
  buildings: BuildingState[],
  id: BuildingState["id"],
): BuildingState | undefined => buildings.find((b) => b.id === id);

const replaceBuilding = (
  buildings: BuildingState[],
  next: BuildingState,
): BuildingState[] =>
  buildings.map((b) => (b.id === next.id ? next : b));

/**
 * Считает грядку: накапливает food в `buildings[garden].accumulated_output`.
 * Cap-bounded (≤ GARDEN_CAP), input-bounded (≤ available water / cost).
 *
 * Возвращает новый state + что начислили (для summary).
 */
const accrueGarden = (
  state: AccrualState,
  deltaMs: number,
): {
  state: AccrualState;
  food_added: number;
  water_spent: number;
} => {
  const garden = findBuilding(state.buildings, "garden");
  if (!garden) return { state, food_added: 0, water_spent: 0 };

  const theoreticalCycles = Math.floor(deltaMs / GARDEN_CYCLE_MS);
  const capRemainingFood = GARDEN_CAP - garden.accumulated_output;
  const capRemainingCycles = Math.floor(
    capRemainingFood / GARDEN_FOOD_PER_CYCLE,
  );
  const inputBoundedCycles = Math.floor(
    state.baseResources.water / GARDEN_WATER_PER_CYCLE,
  );

  const cycles = Math.max(
    0,
    Math.min(theoreticalCycles, capRemainingCycles, inputBoundedCycles),
  );
  if (cycles === 0) return { state, food_added: 0, water_spent: 0 };

  const water_spent = cycles * GARDEN_WATER_PER_CYCLE;
  const food_added = cycles * GARDEN_FOOD_PER_CYCLE;

  return {
    state: {
      ...state,
      baseResources: consumeBaseResource(state.baseResources, "water", water_spent),
      buildings: replaceBuilding(state.buildings, {
        ...garden,
        accumulated_output: garden.accumulated_output + food_added,
      }),
    },
    food_added,
    water_spent,
  };
};

/**
 * M13 PR-6b-3 — Считает генератор: потребляет fuel, пишет energy НАПРЯМУЮ
 * в `baseResources.energy` (bunk-model, без buffer).
 *
 * D4 в preflight: симметрично койке, а НЕ грядке. Если бы energy копилась
 * в `generator.accumulated_output` без UI-collect, Verstak-gate всегда
 * видел бы 0 → фича мёртвая (юниты не ловят, accrue logic зелёный, gate
 * зелёный, но connection между ними сломан).
 *
 * NaN-guard: `state.baseResources.energy ?? 0` на чтение. Если миграция
 * провалена и energy === undefined, мы не пишем NaN в save — `Math.max(0,
 * undefined + N) === Math.max(0, NaN) === NaN` распространяется. Defensive
 * read закрывает Trap C (preflight §5).
 *
 * Generator-only path: если building `generator` отсутствует (старый сейв
 * без миграции), no-op. Это Trap B-вариант-2: миграция должна закрыть
 * этот путь, но если она провалена, не пишем мусор в state.
 */
const accrueGenerator = (
  state: AccrualState,
  deltaMs: number,
): {
  state: AccrualState;
  energy_added: number;
  fuel_spent: number;
} => {
  const generator = findBuilding(state.buildings, "generator");
  if (!generator) return { state, energy_added: 0, fuel_spent: 0 };

  const theoreticalCycles = Math.floor(deltaMs / GENERATOR_CYCLE_MS);
  const inputBoundedCycles = Math.floor(
    state.baseResources.fuel / GENERATOR_FUEL_PER_CYCLE,
  );

  const cycles = Math.max(0, Math.min(theoreticalCycles, inputBoundedCycles));
  if (cycles === 0) return { state, energy_added: 0, fuel_spent: 0 };

  const fuel_spent = cycles * GENERATOR_FUEL_PER_CYCLE;
  const energy_added = cycles * GENERATOR_ENERGY_PER_CYCLE;

  // NaN-guard на чтение: undefined ?? 0 = 0. Распространение NaN в save
  // закрыто здесь, не на consume-site (consumeBaseResource не знает про
  // defaults).
  const currentEnergy = state.baseResources.energy ?? 0;

  return {
    state: {
      ...state,
      baseResources: {
        ...consumeBaseResource(state.baseResources, "fuel", fuel_spent),
        energy: currentEnergy + energy_added,
      },
    },
    energy_added,
    fuel_spent,
  };
};


/**
 * M17 PR1 — bed production tick. The bed heals HP at an hourly rate when
 * the base has enough energy. PR1 gates on energy only; PR3 will add
 * consumption/decay. Pure function: returns a new state and never mutates
 * the input state.
 */
export const accrueBed = (
  state: AccrualState,
  elapsedHours: number,
  balance: BedAccrualBalance = DEFAULT_BED_ACCRUAL_BALANCE,
): { state: AccrualState; hp_added: number } => {
  const bed = findBuilding(state.buildings, "bunk");
  if (!bed) return { state, hp_added: 0 };
  if (!Number.isFinite(elapsedHours) || elapsedHours <= 0) {
    return { state, hp_added: 0 };
  }
  if ((state.baseResources.energy ?? 0) < balance.energyGate) {
    return { state, hp_added: 0 };
  }

  const cappedHours = Math.min(elapsedHours, balance.capHours);
  const hpDeficit = Math.max(0, state.hp_max - state.hp);
  const hp_added = Math.min(hpDeficit, cappedHours * balance.hpPerHour);
  if (hp_added <= 0) return { state, hp_added: 0 };

  return {
    state: {
      ...state,
      hp: Math.min(state.hp_max, state.hp + hp_added),
    },
    hp_added,
  };
};

/**
 * Считает койку: потребляет food, лечит player.hp напрямую (clamp ≤ hp_max).
 *
 * В отличие от грядки, не имеет буфера — выход = HP. Это диктует discount
 * порядок (грядка перед койкой не помогла бы койке: койка читает
 * baseResources.food, грядка пишет в свой буфер, нужно тапнуть для трансфера).
 */
const accrueBunk = (
  state: AccrualState,
  deltaMs: number,
): {
  state: AccrualState;
  hp_added: number;
  food_spent: number;
} => {
  const theoreticalCycles = Math.floor(deltaMs / BUNK_CYCLE_MS);
  const hpDeficit = state.hp_max - state.hp;
  const capRemainingCycles = Math.floor(hpDeficit / BUNK_HP_PER_CYCLE);
  const inputBoundedCycles = Math.floor(
    state.baseResources.food / BUNK_FOOD_PER_CYCLE,
  );

  const cycles = Math.max(
    0,
    Math.min(theoreticalCycles, capRemainingCycles, inputBoundedCycles),
  );
  if (cycles === 0) return { state, hp_added: 0, food_spent: 0 };

  const food_spent = cycles * BUNK_FOOD_PER_CYCLE;
  const hp_added = cycles * BUNK_HP_PER_CYCLE;

  return {
    state: {
      ...state,
      baseResources: consumeBaseResource(state.baseResources, "food", food_spent),
      hp: Math.min(state.hp_max, state.hp + hp_added),
    },
    hp_added,
    food_spent,
  };
};

/**
 * Главная функция accrual. Применяет грядку + койку за `delta` времени.
 *
 * Порядок зданий фиксирован [garden, bunk] для детерминизма (они
 * независимы по storage — грядка пишет в свой буфер, койка читает
 * baseResources.food), но порядок зафиксирован чтобы убрать класс
 * багов «порядок зданий влияет на результат» из теста и кодревью.
 *
 * Edge cases (preflight §8):
 * - delta < 0 (rollback): summary.rolled_back=true, телеметрия, 0 accrual
 * - delta < MIN_ACCRUAL_WINDOW_MS: no-op (refresh-spam guard)
 * - delta > MAX_OFFLINE_WINDOW_MS: clamp, capped_at_max=true
 * - !isFinite(delta): treated as rollback (NaN/Infinity safety)
 */
export const accrueOffline = (
  state: AccrualState,
  savedAtMsOrElapsedHours: number,
  nowMs?: number,
): AccrualResult => {
  const rawDelta = nowMs === undefined
    ? savedAtMsOrElapsedHours * 60 * 60 * 1000
    : nowMs - savedAtMsOrElapsedHours;
  if (!Number.isFinite(rawDelta) || rawDelta < 0) {
    track("offline_rollback", { raw_delta_ms: Number.isFinite(rawDelta) ? rawDelta : -1 });
    return { state, summary: { ...EMPTY_SUMMARY, rolled_back: true } };
  }
  if (rawDelta < MIN_ACCRUAL_WINDOW_MS) {
    return { state, summary: { ...EMPTY_SUMMARY } };
  }
  const capped = rawDelta > MAX_OFFLINE_WINDOW_MS;
  const delta = Math.min(rawDelta, MAX_OFFLINE_WINDOW_MS);

  // M13 PR-6b-3: fixed-order [generator, garden, bunk] для детерминизма.
  // Здания независимы по storage (generator: fuel→energy, garden:
  // water→buffer, bunk: food→hp), порядок не влияет на резалт, но
  // зафиксирован чтобы убрать класс «порядок зданий влияет» из
  // тестов и ревью.
  const generatorResult = accrueGenerator(state, delta);
  const gardenResult = accrueGarden(generatorResult.state, delta);
  const bunkResult = accrueBunk(gardenResult.state, delta);
  const bedResult = accrueBed(bunkResult.state, delta / (60 * 60 * 1000));

  return {
    state: bedResult.state,
    summary: {
      delta_ms: delta,
      rolled_back: false,
      capped_at_max: capped,
      garden_food_added: gardenResult.food_added,
      garden_water_spent: gardenResult.water_spent,
      generator_energy_added: generatorResult.energy_added,
      generator_fuel_spent: generatorResult.fuel_spent,
      bed_hp_added: bedResult.hp_added,
      bunk_hp_added: bunkResult.hp_added,
      bunk_food_spent: bunkResult.food_spent,
    },
  };
};

/** True если в summary что-то реально начислилось (для toast-гарда). */
export const accrualHasYield = (summary: AccrualSummary): boolean =>
  summary.garden_food_added > 0 ||
  summary.bunk_hp_added > 0 ||
  summary.bed_hp_added > 0 ||
  summary.generator_energy_added > 0;


/**
 * M17 PR2 — plain-text offline summary for the BaseScene dialog.
 * Kept pure/exported so tests can assert the UI contract without Phaser.
 */
export const formatOfflineSummary = (summary: AccrualSummary): string => {
  const parts: string[] = [];
  const hours = Math.round(summary.delta_ms / (60 * 60 * 1000));
  parts.push(`Пока вас не было (${hours} ч):`);

  const hpAdded = summary.bunk_hp_added + summary.bed_hp_added;
  if (hpAdded > 0) parts.push(`+${hpAdded} HP`);
  if (summary.generator_energy_added > 0) {
    parts.push(`+${summary.generator_energy_added} energy`);
  }
  if (summary.garden_food_added > 0) {
    parts.push(`+${summary.garden_food_added} еды`);
  }

  const spent: string[] = [];
  if (summary.garden_water_spent > 0) spent.push(`${summary.garden_water_spent} воды`);
  if (summary.bunk_food_spent > 0) spent.push(`${summary.bunk_food_spent} еды`);
  if (summary.generator_fuel_spent > 0) spent.push(`${summary.generator_fuel_spent} топлива`);
  if (spent.length > 0) parts.push(`Потрачено: ${spent.join(", ")}`);

  return parts.join(". ");
};
