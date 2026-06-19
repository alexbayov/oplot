import type { EquippedArmor } from "../state/types";
import type { ArmorItem, Item } from "../types";

// ArmorStat is intentionally disjoint from weapon AffixStat and M15 durability loop.
export type ArmorStat = "carry_kg" | "inventory_slots" | "scavenge_chance" | "armor_def";

export interface ArmorIntrinsicAffix {
  id: string;
  value?: number;
}

export interface ArmorAffixDef {
  id: string;
  stat: ArmorStat;
  value: number;
  name_ru: string;
}

export interface ArmorContribution {
  carry_kg: number;
  inventory_slots: number;
  scavenge_chance: number;
  armor_def: number;
}

export interface ResolvedArmor extends ArmorContribution {
  armor_reduction: number;
}

export const ARMOR_AFFIX_DEFS: readonly ArmorAffixDef[] = [
  { id: "carry_extra", stat: "carry_kg", value: 2, name_ru: "Грузовые лямки" },
  { id: "scavenger_eye", stat: "scavenge_chance", value: 0.15, name_ru: "Глаз скавенджера" },
  { id: "pocket_grid", stat: "inventory_slots", value: 2, name_ru: "Карманная сетка" },
  { id: "reinforced_plate", stat: "armor_def", value: 1, name_ru: "Усиленная пластина" },
] as const;

export const ARMOR_AFFIX_BY_ID = new Map<string, ArmorAffixDef>(
  ARMOR_AFFIX_DEFS.map((def) => [def.id, def]),
);

export const getArmorAffixDef = (id: string): ArmorAffixDef | undefined =>
  ARMOR_AFFIX_BY_ID.get(id);

export const emptyArmorContribution = (): ArmorContribution => ({
  carry_kg: 0,
  inventory_slots: 0,
  scavenge_chance: 0,
  armor_def: 0,
});

export const armorContribution = (
  affixes: readonly ArmorIntrinsicAffix[] | undefined,
): ArmorContribution => {
  const out = emptyArmorContribution();
  for (const affix of affixes ?? []) {
    const def = getArmorAffixDef(affix.id);
    if (!def) continue;
    out[def.stat] += affix.value ?? def.value;
  }
  return out;
};

const isArmorItem = (item: Item | undefined): item is ArmorItem =>
  item?.kind === "armor";

const equippedArmorPieces = (
  equipped: EquippedArmor,
  items: Record<string, Item>,
): ArmorItem[] =>
  [equipped.helm, equipped.plate, equipped.strap]
    .filter((id): id is string => typeof id === "string")
    .map((id) => items[id])
    .filter(isArmorItem);

const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, n));

export const resolveEquippedArmor = (
  equipped: EquippedArmor,
  items: Record<string, Item>,
): ResolvedArmor => {
  const pieces = equippedArmorPieces(equipped, items);
  const total = emptyArmorContribution();
  let armorValue = 0;

  for (const piece of pieces) {
    armorValue += piece.stats?.armor_value ?? 0;
    const contribution = armorContribution(piece.intrinsic_affixes);
    total.carry_kg += contribution.carry_kg;
    total.inventory_slots += contribution.inventory_slots;
    total.scavenge_chance += contribution.scavenge_chance;
    total.armor_def += contribution.armor_def;
  }

  const armor_reduction = clamp(Math.max(0.1, (armorValue + total.armor_def) / 10), 0, 0.9);
  return { ...total, armor_reduction };
};

export const computeMaxWeightWithArmor = (
  baseMaxWeight: number,
  equipped: EquippedArmor,
  items: Record<string, Item>,
): number => baseMaxWeight + resolveEquippedArmor(equipped, items).carry_kg;

export interface ArmorStatDelta {
  candidate: ResolvedArmor;
  equipped: ResolvedArmor;
  delta_carry_kg: number;
  delta_inventory_slots: number;
  delta_scavenge_chance: number;
  delta_armor_def: number;
}

export const armorStatDelta = (
  candidate: ArmorItem,
  equipped: EquippedArmor,
  items: Record<string, Item>,
): ArmorStatDelta => {
  const nextEquipped: EquippedArmor = {
    ...equipped,
    [candidate.slot]: candidate.id,
  };
  const candidateResolved = resolveEquippedArmor(nextEquipped, items);
  const equippedResolved = resolveEquippedArmor(equipped, items);
  return {
    candidate: candidateResolved,
    equipped: equippedResolved,
    delta_carry_kg: candidateResolved.carry_kg - equippedResolved.carry_kg,
    delta_inventory_slots: candidateResolved.inventory_slots - equippedResolved.inventory_slots,
    delta_scavenge_chance: candidateResolved.scavenge_chance - equippedResolved.scavenge_chance,
    delta_armor_def: candidateResolved.armor_def - equippedResolved.armor_def,
  };
};
