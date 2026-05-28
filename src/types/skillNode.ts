/**
 * M11.4 — Skill Tree node type.
 *
 * 24 узла: 3 ветки × 8. 21 пассив + 3 актив (auto-trigger в M11.4, ручной UI в M12.1).
 *
 * Backward compat: каждый узел имеет `legacy_perk` для совместимости с
 * существующим `Perk` интерфейсом (combat.ts, perks.ts, loot.ts читают Perk[]).
 */

export type SkillBranch = "fighter" | "survivor" | "crafter";

export type SkillKind = "passive" | "active";

export type SkillStat =
  // Урон/точность
  | "accuracy"
  | "crit_chance"
  | "cover_damage_bonus"
  | "first_attack_crit_bonus"
  | "free_reload_per_combat"
  | "double_attack_every_n_turns"
  // Выживание
  | "hp_max"
  | "regen_per_turn_in_cover"
  | "armor_efficiency"
  | "heal_efficiency"
  | "death_save_per_combat"
  | "status_resist"
  | "low_hp_damage_bonus"
  | "low_hp_damage_reduction"
  // Барахольщик
  | "loot_quantity_multiplier"
  | "max_weight_kg"
  | "unlock_recipes_tier"
  | "craft_material_save_chance"
  | "free_mod_per_day"
  // Прочее (legacy compat)
  | "damage"
  | "weight_penalty_multiplier"
  | "crafting_speed_multiplier"
  | "xp_gain_multiplier";

export interface SkillEffect {
  stat: SkillStat;
  type: "additive" | "multiplicative" | "percentage";
  value: number;
}

export interface SkillNodeUIButton {
  icon: string;
  cooldown_rounds: number;
  trigger: "auto" | "manual";
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  branch: SkillBranch;
  position: number; // 1..8
  tier: 1 | 2 | 3;
  kind: SkillKind;
  requires?: string;
  effects: SkillEffect[];
  ui_button?: SkillNodeUIButton;
  /** Legacy Perk shape — for backward compat with combat.ts / perks.ts. */
  legacy_perk?: {
    type: "additive" | "multiplicative" | "percentage";
    stat: string;
    value: number;
  };
  icon_key?: string;
}

/** Result of summing all unlocked node effects. */
export interface PassiveEffectsBundle {
  hp_max_bonus: number;
  max_weight_kg_bonus: number;
  accuracy_bonus: number;
  crit_chance_bonus: number;
  damage_mul: number;
  defense_mul: number;
  regen_per_turn_in_cover: number;
  cover_damage_bonus: number;
  heal_efficiency_mul: number;
  loot_quantity_mul: number;
  craft_material_save_chance: number;
  death_save_per_combat: number;
  status_resist_mul: number;
  low_hp_damage_bonus: number;
  low_hp_damage_reduction: number;
  first_attack_crit_bonus: number;
  free_reload_per_combat: number;
  double_attack_every_n_turns: number;
  unlock_recipes_tier: number;
  free_mod_per_day: number;
}
