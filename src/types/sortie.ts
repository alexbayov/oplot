// M13: типы для авторесолва вылазки.
// Источник: docs/redesign/M13-PIVOT.md §«Авторесолв с decision surface».

import type { InventoryStack } from "../state/types";

/** Цель вылазки, выбранная игроком в SortieScene. Влияет на формулу и лут. */
export type SortieGoal =
  | "quiet"
  | "greedy"
  | "targeted_fuel"
  | "targeted_metal"
  | "targeted_food"
  | "targeted_water";

export interface SortieGoalDef {
  id: SortieGoal;
  name_ru: string;
  description_ru: string;
  /** Множитель урона по герою. <1 = бережём, >1 = больно. */
  hp_damage_modifier: number;
  /** Множитель количества лута. <1 = меньше, >1 = больше. */
  loot_count_modifier: number;
  /** Если задан, лут смещается в сторону этого ресурса базы. */
  loot_bias?: BaseResourceId;
}

export type BaseResourceId = "water" | "fuel" | "metal" | "food";

export interface InjuryState {
  kind: "arm" | "leg" | "head";
  /** Игровых дней до выздоровления. */
  duration_days: number;
}

/** Снимок героя для расчёта одного энкаунтера. Без Phaser-зависимостей. */
export interface HeroSnapshot {
  hp: number;
  hp_max: number;
  level: number;
  /** Средний урон оружия за ход (weapon.damage_min..max усреднённый). */
  weapon_damage_avg: number;
  /** Снижение урона броней в [0..0.9]. */
  armor_reduction: number;
  /** Уровень навыка боя в [0..10]; на старте M13 = level/2. */
  skill_combat: number;
  injuries: InjuryState[];
}

export interface EncounterInput {
  hero: HeroSnapshot;
  zone_id: string;
  depth: 1 | 2 | 3;
  goal: SortieGoal;
  /** ID мобов в этом энкаунтере (любой длины, обычно 1-3). */
  mob_ids: string[];
  /** danger-метрика мобов: суммарная угроза за стычку. Считается до вызова. */
  mob_total_threat: number;
  /** Список ресурсов в этом энкаунтере для loot roll-а. */
  loot_pool: string[];
  /** Сколько единиц лута бросается до модификаторов цели. */
  loot_base_count: number;
  /** Сколько бинтов/аптечек у героя сейчас (применяются автоматом). */
  consumables: InventoryStack[];
}

export interface EncounterResult {
  narrative_lines: string[];
  hp_lost: number;
  loot_rolled: InventoryStack[];
  /** Что из расходников съели в этом энкаунтере. */
  consumables_used: InventoryStack[];
  injury?: InjuryState;
  outcome: "won" | "fled" | "knocked_out";
}

export interface SortiePlanInput {
  hero: HeroSnapshot;
  zone_id: string;
  depth: 1 | 2 | 3;
  goal: SortieGoal;
  encounters: EncounterInput[];
}

export interface SortiePlanResult {
  goal_intro: string;
  return_intro: string;
  encounter_results: EncounterResult[];
  /** Сводно: суммарное HP_lost, суммарный лут, число завершённых энкаунтеров. */
  totals: {
    hp_lost: number;
    loot: InventoryStack[];
    consumables_used: InventoryStack[];
    encounters_completed: number;
  };
  outcome: "success" | "retreat" | "knocked_out";
}
