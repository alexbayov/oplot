// M15-PR3 — единый источник истины для резолва урона эквип-оружия.
//
// До PR-3 switch «catalog → items / crafted → inst / null|broken → 4/7» жил
// инлайном в `SortieRunScene.snapshotHero` (:113-141). Арсенальная stat-delta
// (PR-3, Variant B) должна сравнивать кандидата против ТОГО ЖЕ урона, что
// реально уходит в бой — иначе дельта врёт. Чтобы паритет не протух на первом
// же тюне baseline'а, резолв вынесен сюда и зовётся ОБОИМИ местами
// (snapshotHero + weaponStatDelta). См. M15-PR3-PREFLIGHT.md R1.
import type { EquippedWeapon } from "../state/types";
import type { Item } from "../types/item";
import type { WeaponInstance } from "./weaponAssembly";

/**
 * Урон голыми руками — fallback при null / сломанном / отсутствующем оружии.
 * Совпадает с историческим инлайном snapshotHero (OP3 default до PR-6a).
 */
export const BARE_HANDS_DAMAGE = { damage_min: 4, damage_max: 7 } as const;

export interface WeaponDamage {
  damage_min: number;
  damage_max: number;
}

/**
 * Резолвит средне-боевой урон эквип-оружия. Один путь для всех веток —
 * source-of-truth для боя (snapshotHero) И для арсенальной дельты.
 *
 * - catalog: `items[id].stats` при `kind === "weapon"`; per-field
 *   `typeof === "number"` guard (R2) — малформед стат падает в bare-hands,
 *   ровно как в бою (НЕ `?? 4`, чтобы частично-заполненный stats уважался).
 * - crafted: замороженные `inst.stats` при `durability_current > 0`;
 *   сломанный (`<= 0`) / отсутствующий → bare-hands (R3).
 * - null: bare-hands.
 */
export function resolveEquippedDamage(
  eq: EquippedWeapon | null,
  items: Record<string, Item>,
  crafted: readonly WeaponInstance[],
): WeaponDamage {
  let damage_min: number = BARE_HANDS_DAMAGE.damage_min;
  let damage_max: number = BARE_HANDS_DAMAGE.damage_max;

  if (eq) {
    if (eq.kind === "catalog") {
      const w = items[eq.id];
      if (w && w.kind === "weapon" && w.stats) {
        if (typeof w.stats.damage_min === "number") damage_min = w.stats.damage_min;
        if (typeof w.stats.damage_max === "number") damage_max = w.stats.damage_max;
      }
    } else {
      const inst = crafted.find((wi) => wi.id === eq.id);
      if (inst && inst.durability_current > 0) {
        damage_min = inst.stats.damage_min;
        damage_max = inst.stats.damage_max;
      }
      // else: broken / missing — bare-hands (R3), как в snapshotHero.
    }
  }

  return { damage_min, damage_max };
}
