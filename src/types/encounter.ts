/**
 * Encounter — текстовая встреча между боями (M10.2).
 *
 * Загружается из content/encounters.json. См. taxonomy:
 * docs/redesign/m10/M10.2-encounter-taxonomy.md
 */

export type EncounterCategory =
  | "resource_trade"
  | "moral_choice"
  | "trap"
  | "lore"
  | "skill_check"
  | "npc";

export interface EncounterLoot {
  id: string;
  n: number;
}

export type EncounterRequirement =
  | { type: "has_item"; id: string; min?: number }
  | { type: "has_perk"; id: string }
  | { type: "max_weight_pct"; value: number };

/** Один outcome — взвешенный исход выбора. */
export interface EncounterOutcome {
  weight: number;
  loot?: EncounterLoot[];
  hp_delta?: number;
  time_cost?: number;
  consume_item?: string;
  consume_n?: number;
  trust_delta?: number;
  lore_fragment?: string;
  armor_cond_delta?: number;
  next_fight_initiative_loss?: boolean;
  next_fight_enemy_count_delta?: number;
  next_mob_hp_bonus_pct?: number;
}

export interface EncounterChoice {
  id: string;
  text_ru: string;
  requires?: EncounterRequirement[];
  outcomes: EncounterOutcome[];
}

export interface Encounter {
  id: string;
  category: EncounterCategory;
  /** Зоны где может появиться. ["*"] = универсальный. */
  zones: string[];
  text_ru: string;
  /** Опциональная иллюстрация (asset path). */
  illustration?: string | null;
  /** Множитель частоты появления (0.5 для lore). По умолчанию 1.0. */
  rarity?: number;
  choices: EncounterChoice[];
}
