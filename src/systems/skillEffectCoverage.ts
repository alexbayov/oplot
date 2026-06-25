/**
 * skillEffectCoverage (M20-PR3) — какие узлы дерева реально влияют на
 * геймплей, а какие пока инертны.
 *
 * История: `getPassiveEffects` считает весь бандл, но геймплей потребляет
 * лишь часть полей. После M20-PR1 (hp/вес персистентно) и M20-PR2
 * (accuracy/damage/defense в бою) «живыми» считаются узлы, чей эффект
 * трогает одно из этих пяти полей. Остальные узлы открываются, но пока
 * не меняют игру — это явный бэклог (economy / survival / crafting) и
 * design-fork (crit + эффекты снесённых пивотом тактик-механик).
 *
 * Гейт-тест (skillEffectCoverage.test) фиксирует список инертных узлов,
 * чтобы новый узел нельзя было молча добавить мёртвым: он обязан либо
 * трогать живое поле, либо быть осознанно внесён в список ожидающих.
 */
import { getPassiveEffects } from "../state/SkillTree";
import type { SkillNode } from "../types/skillNode";

/** Узел «живой», если его пассив трогает поле бандла, потребляемое геймплеем. */
export const isNodeLive = (nodeId: string): boolean => {
  const b = getPassiveEffects([nodeId]);
  return (
    b.hp_max_bonus !== 0 ||
    b.max_weight_kg_bonus !== 0 ||
    b.accuracy_bonus !== 0 ||
    b.damage_mul !== 1 ||
    b.defense_mul !== 1
  );
};

export const partitionNodesByLiveness = (
  nodes: SkillNode[],
): { live: string[]; inert: string[] } => {
  const live: string[] = [];
  const inert: string[] = [];
  for (const n of nodes) (isNodeLive(n.id) ? live : inert).push(n.id);
  return { live, inert };
};
