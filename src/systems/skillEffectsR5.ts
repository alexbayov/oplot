/**
 * R5 — skill tree effects for post-pivot combat model.
 * Makes previously inert nodes explicit and maps them to combatMath fields.
 * Spec: docs/redesign/R-MASTER.md §R5
 */

export type SkillBranch = "fighter" | "survivor" | "crafter";

export interface SkillNodeDef {
  id: string;
  branch: SkillBranch;
  name_ru: string;
  /** Combat-facing passive effects consumed by combatMath / loop. */
  effects: {
    marksmanship?: number; // adds to marksmanship 0..10 scale
    accuracyMod?: number; // weaponAccuracyMod
    maxHpBonus?: number;
    maxWeightBonus?: number;
    damageMul?: number;
    defenseMul?: number;
    craftSpeedMul?: number;
    lootQtyMul?: number;
    reloadApReduce?: number;
    headPenaltyReduce?: number; // reduces head body penalty
  };
}

/** 24 nodes — all LIVE (no inert). */
export const R5_SKILL_NODES: SkillNodeDef[] = [
  // Fighter (8)
  { id: "f_mark_1", branch: "fighter", name_ru: "Меткость I", effects: { marksmanship: 1 } },
  { id: "f_mark_2", branch: "fighter", name_ru: "Меткость II", effects: { marksmanship: 2 } },
  { id: "f_crit_1", branch: "fighter", name_ru: "Крит I", effects: { damageMul: 1.05 } },
  { id: "f_crit_2", branch: "fighter", name_ru: "Крит II", effects: { damageMul: 1.1 } },
  { id: "f_cover_dmg", branch: "fighter", name_ru: "Огонь из укрытия", effects: { accuracyMod: 5 } },
  { id: "f_reload", branch: "fighter", name_ru: "Быстрая перезарядка", effects: { reloadApReduce: 1 } },
  { id: "f_aimed", branch: "fighter", name_ru: "Прицельный", effects: { headPenaltyReduce: 10 } },
  { id: "f_double", branch: "fighter", name_ru: "Двойной выстрел", effects: { accuracyMod: 3, damageMul: 1.05 } },
  // Survivor (8)
  { id: "s_hp_1", branch: "survivor", name_ru: "Живучесть I", effects: { maxHpBonus: 10 } },
  { id: "s_hp_2", branch: "survivor", name_ru: "Живучесть II", effects: { maxHpBonus: 15 } },
  { id: "s_regen", branch: "survivor", name_ru: "Второе дыхание", effects: { maxHpBonus: 5 } },
  { id: "s_armor", branch: "survivor", name_ru: "Пластины", effects: { defenseMul: 1.1 } },
  { id: "s_med", branch: "survivor", name_ru: "Полевой медик", effects: { maxHpBonus: 5 } },
  { id: "s_bleed", branch: "survivor", name_ru: "Стойкость", effects: { defenseMul: 1.05 } },
  { id: "s_will", branch: "survivor", name_ru: "Железная воля", effects: { maxHpBonus: 10, defenseMul: 1.05 } },
  { id: "s_pack", branch: "survivor", name_ru: "Носильщик", effects: { maxWeightBonus: 5 } },
  // Crafter (8)
  { id: "c_speed_1", branch: "crafter", name_ru: "Скорость крафта I", effects: { craftSpeedMul: 0.9 } },
  { id: "c_speed_2", branch: "crafter", name_ru: "Скорость крафта II", effects: { craftSpeedMul: 0.8 } },
  { id: "c_loot_1", branch: "crafter", name_ru: "Сборщик I", effects: { lootQtyMul: 1.1 } },
  { id: "c_loot_2", branch: "crafter", name_ru: "Сборщик II", effects: { lootQtyMul: 1.2 } },
  { id: "c_salvage", branch: "crafter", name_ru: "Разборщик", effects: { lootQtyMul: 1.05 } },
  { id: "c_modder", branch: "crafter", name_ru: "Оружейник", effects: { accuracyMod: 2 } },
  { id: "c_weight", branch: "crafter", name_ru: "Лёгкий рюкзак", effects: { maxWeightBonus: 3 } },
  { id: "c_master", branch: "crafter", name_ru: "Мастер-верстак", effects: { craftSpeedMul: 0.85, lootQtyMul: 1.05 } },
];

export interface AggregatedSkillEffects {
  marksmanship: number;
  accuracyMod: number;
  maxHpBonus: number;
  maxWeightBonus: number;
  damageMul: number;
  defenseMul: number;
  craftSpeedMul: number;
  lootQtyMul: number;
  reloadApReduce: number;
  headPenaltyReduce: number;
}

export function aggregateSkillEffects(unlockedIds: string[]): AggregatedSkillEffects {
  const out: AggregatedSkillEffects = {
    marksmanship: 0,
    accuracyMod: 0,
    maxHpBonus: 0,
    maxWeightBonus: 0,
    damageMul: 1,
    defenseMul: 1,
    craftSpeedMul: 1,
    lootQtyMul: 1,
    reloadApReduce: 0,
    headPenaltyReduce: 0,
  };

  const byId = new Map(R5_SKILL_NODES.map((n) => [n.id, n]));
  for (const id of unlockedIds) {
    const n = byId.get(id);
    if (!n) continue;
    const e = n.effects;
    out.marksmanship += e.marksmanship ?? 0;
    out.accuracyMod += e.accuracyMod ?? 0;
    out.maxHpBonus += e.maxHpBonus ?? 0;
    out.maxWeightBonus += e.maxWeightBonus ?? 0;
    out.damageMul *= e.damageMul ?? 1;
    out.defenseMul *= e.defenseMul ?? 1;
    out.craftSpeedMul *= e.craftSpeedMul ?? 1;
    out.lootQtyMul *= e.lootQtyMul ?? 1;
    out.reloadApReduce += e.reloadApReduce ?? 0;
    out.headPenaltyReduce += e.headPenaltyReduce ?? 0;
  }

  out.marksmanship = Math.min(10, out.marksmanship);
  return out;
}

export function countLiveNodes(): { total: number; live: number } {
  return { total: R5_SKILL_NODES.length, live: R5_SKILL_NODES.length };
}
