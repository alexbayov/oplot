/**
 * M11.4 — Skill Tree API.
 *
 * Единая точка для:
 *  - Чтения дерева (`getNodes`, `getNodeById`)
 *  - Проверок (`canUnlock`, `isUnlocked`)
 *  - Мутации state (`unlockNode`)
 *  - Расчёта пассивных бонусов (`getPassiveEffects`)
 *  - Backward compat с `Perk[]` (`derivePerks`)
 *
 * Дерево загружается из `content/perks.json` (теперь массив SkillNode).
 * Состояние: `GameState.player.unlockedSkillNodes: string[]` + `GameState.player.skillPoints: number`.
 */

import type {
  PassiveEffectsBundle,
  SkillBranch,
  SkillNode,
} from "../types/skillNode";
import type { Perk } from "../types";

let nodeRegistry = new Map<string, SkillNode>();

/** Загружается из BootScene после parse'а content/perks.json. */
export const loadSkillNodes = (nodes: SkillNode[]): void => {
  nodeRegistry = new Map(nodes.map((n) => [n.id, n]));
};

export const getAllNodes = (): SkillNode[] => Array.from(nodeRegistry.values());

export const getNodeById = (id: string): SkillNode | undefined =>
  nodeRegistry.get(id);

export const getBranchNodes = (branch: SkillBranch): SkillNode[] =>
  getAllNodes()
    .filter((n) => n.branch === branch)
    .sort((a, b) => a.position - b.position);

/** Узлы, которые игрок может прокачать СЛЕДУЮЩИМИ (родитель открыт, сам — нет). */
export const getAvailableNodes = (unlocked: string[]): SkillNode[] => {
  const unlockedSet = new Set(unlocked);
  return getAllNodes().filter((node) => {
    if (unlockedSet.has(node.id)) return false;
    if (!node.requires) return true;
    return unlockedSet.has(node.requires);
  });
};

export const isUnlocked = (nodeId: string, unlocked: string[]): boolean =>
  unlocked.includes(nodeId);

export const canUnlock = (
  nodeId: string,
  unlocked: string[],
  skillPoints: number,
): { ok: true } | { ok: false; reason: string } => {
  const node = getNodeById(nodeId);
  if (!node) return { ok: false, reason: "Узел не найден" };
  if (unlocked.includes(nodeId)) return { ok: false, reason: "Уже открыт" };
  if (node.requires && !unlocked.includes(node.requires)) {
    const parent = getNodeById(node.requires);
    return {
      ok: false,
      reason: `Требуется: ${parent?.name ?? node.requires}`,
    };
  }
  if (skillPoints < 1) return { ok: false, reason: "Нет очка навыков" };
  return { ok: true };
};

/**
 * Атомарно открывает узел.
 * Возвращает обновлённые unlocked[] и skillPoints (но НЕ мутирует state — caller сам присваивает).
 */
export const unlockNode = (
  nodeId: string,
  unlocked: string[],
  skillPoints: number,
): { unlocked: string[]; skillPoints: number; node: SkillNode } | null => {
  const check = canUnlock(nodeId, unlocked, skillPoints);
  if (!check.ok) return null;
  const node = getNodeById(nodeId);
  if (!node) return null;
  return {
    unlocked: [...unlocked, nodeId],
    skillPoints: skillPoints - 1,
    node,
  };
};

/** Сумма пассивных эффектов всех открытых узлов. */
export const getPassiveEffects = (unlocked: string[]): PassiveEffectsBundle => {
  const bundle: PassiveEffectsBundle = {
    hp_max_bonus: 0,
    max_weight_kg_bonus: 0,
    accuracy_bonus: 0,
    crit_chance_bonus: 0,
    damage_mul: 1.0,
    defense_mul: 1.0,
    regen_per_turn_in_cover: 0,
    cover_damage_bonus: 0,
    heal_efficiency_mul: 1.0,
    loot_quantity_mul: 1.0,
    craft_material_save_chance: 0,
    death_save_per_combat: 0,
    status_resist_mul: 1.0,
    low_hp_damage_bonus: 0,
    low_hp_damage_reduction: 0,
    first_attack_crit_bonus: 0,
    free_reload_per_combat: 0,
    double_attack_every_n_turns: 0,
    unlock_recipes_tier: 1,
    free_mod_per_day: 0,
  };

  for (const id of unlocked) {
    const node = getNodeById(id);
    if (!node) continue;
    for (const eff of node.effects) {
      switch (eff.stat) {
        case "hp_max":
          bundle.hp_max_bonus += eff.value;
          break;
        case "max_weight_kg":
          bundle.max_weight_kg_bonus += eff.value;
          break;
        case "accuracy":
          bundle.accuracy_bonus += eff.value;
          break;
        case "crit_chance":
          bundle.crit_chance_bonus += eff.value;
          break;
        case "damage":
          bundle.damage_mul *= eff.value;
          break;
        case "armor_efficiency":
          bundle.defense_mul *= eff.value;
          break;
        case "regen_per_turn_in_cover":
          bundle.regen_per_turn_in_cover += eff.value;
          break;
        case "cover_damage_bonus":
          bundle.cover_damage_bonus += eff.value;
          break;
        case "heal_efficiency":
          bundle.heal_efficiency_mul *= eff.value;
          break;
        case "loot_quantity_multiplier":
          bundle.loot_quantity_mul *= eff.value;
          break;
        case "craft_material_save_chance":
          bundle.craft_material_save_chance += eff.value;
          break;
        case "death_save_per_combat":
          bundle.death_save_per_combat += eff.value;
          break;
        case "status_resist":
          bundle.status_resist_mul *= eff.value;
          break;
        case "low_hp_damage_bonus":
          bundle.low_hp_damage_bonus += eff.value;
          break;
        case "low_hp_damage_reduction":
          bundle.low_hp_damage_reduction += eff.value;
          break;
        case "first_attack_crit_bonus":
          bundle.first_attack_crit_bonus = Math.max(
            bundle.first_attack_crit_bonus,
            eff.value,
          );
          break;
        case "free_reload_per_combat":
          bundle.free_reload_per_combat += eff.value;
          break;
        case "double_attack_every_n_turns":
          // Меньшее N = чаще — берём минимум среди открытых
          bundle.double_attack_every_n_turns =
            bundle.double_attack_every_n_turns === 0
              ? eff.value
              : Math.min(bundle.double_attack_every_n_turns, eff.value);
          break;
        case "unlock_recipes_tier":
          bundle.unlock_recipes_tier = Math.max(
            bundle.unlock_recipes_tier,
            eff.value,
          );
          break;
        case "free_mod_per_day":
          bundle.free_mod_per_day += eff.value;
          break;
        // Legacy stat fallbacks (для миграции с плоских перков)
        case "weight_penalty_multiplier":
        case "crafting_speed_multiplier":
        case "xp_gain_multiplier":
          // Реализованы в существующем perks.ts через legacy_perk
          break;
      }
    }
  }
  return bundle;
};

/**
 * Деривация Perk[] для обратной совместимости с существующим
 * `computePerkModifiers` (см. src/systems/perks.ts).
 *
 * Каждый открытый узел даёт один legacy-Perk эквивалент.
 */
export const derivePerks = (unlocked: string[]): Perk[] => {
  const perks: Perk[] = [];
  for (const id of unlocked) {
    const node = getNodeById(id);
    if (!node || !node.legacy_perk) continue;
    perks.push({
      id: node.id,
      name: node.name,
      description: node.description,
      type: node.legacy_perk.type,
      stat: node.legacy_perk.stat as Perk["stat"],
      value: node.legacy_perk.value,
    });
  }
  return perks;
};

// ── Migration (v2 → v3): старые плоские perks → unlocked node ids ─────

/** Старое имя перка (M9-M11.0e) → новый node ID. */
export const PERK_MIGRATION_MAP: Record<string, string> = {
  tough_skin: "hp_1",
  sharp_blade: "cover_dmg",
  lean_pack: "weight_1",
  lucky_scavenger: "extra_loot_1",
  keen_eye: "crit_1",
  reinforced_plates: "armor_eff",
  quick_hands: "craft_eff",
  fast_learner: "marks_1",
};

/**
 * Конвертирует старые `perks: Perk[]` → новый `unlockedSkillNodes: string[]`.
 * Сохраняет порядок миграции, валидирует что node ID существует.
 * Возвращает также число skillPoints, которое нужно дать игроку (1 на каждый старый perk, чтобы можно было перераспределить).
 */
export const migratePerksToSkillNodes = (
  oldPerks: { id: string }[],
): { unlocked: string[]; bonusSkillPoints: number } => {
  const unlocked: string[] = [];
  let bonus = 0;
  for (const p of oldPerks) {
    const newId = PERK_MIGRATION_MAP[p.id];
    if (!newId) {
      bonus += 1; // неизвестный перк → отдаём очко
      continue;
    }
    if (!getNodeById(newId)) {
      bonus += 1;
      continue;
    }
    if (!unlocked.includes(newId)) unlocked.push(newId);
  }
  return { unlocked, bonusSkillPoints: bonus };
};
