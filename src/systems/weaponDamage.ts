// M15-PR3 — единый источник истины для резолва урона эквип-оружия.
//
// До PR-3 switch «catalog → items / crafted → inst / null|broken → 4/7» жил
// инлайном в `SortieRunScene.snapshotHero` (:113-141). Арсенальная stat-delta
// (PR-3, Variant B) должна сравнивать кандидата против ТОГО ЖЕ урона, что
// реально уходит в бой — иначе дельта врёт. Чтобы паритет не протух на первом
// же тюне baseline'а, резолв вынесен сюда и зовётся ОБОИМИ местами
// (snapshotHero + weaponStatDelta). См. M15-PR3-PREFLIGHT.md R1.
import { ACCURACY_BASELINE } from "../state/balance";
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
 * M16 PR-1: полный combat-блок эквип-оружия — damage + accuracy + combat-вес.
 * accuracy/weight потребляются `computeHeroPower` (offense множители).
 * - bare-hands / null / сломанный crafted → accuracy = ACCURACY_BASELINE,
 *   weight = 0 ⇒ factor 1.0 ⇒ нейтрально (zero regression).
 * - catalog: accuracy из `items[id].stats.accuracy` (typeof-guard, M16 не
 *   заполняет → BASELINE); combat-weight каталога = 0 (см. preflight §6-B).
 */
export interface WeaponCombat {
  damage_min: number;
  damage_max: number;
  accuracy: number;
  weight: number;
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
  const { damage_min, damage_max } = resolveEquippedCombat(eq, items, crafted);
  return { damage_min, damage_max };
}

/**
 * M16 PR-1: полный combat-резолв (damage + accuracy + combat-вес). Тот же
 * единый путь (R1, продолжение M15-PR3): зовётся из `snapshotHero` (бой)
 * И из арсенальной дельты/preview. `resolveEquippedDamage` — тонкая
 * обёртка над этим резолвером (damage-проекция для legacy-вызовов).
 */
export function resolveEquippedCombat(
  eq: EquippedWeapon | null,
  items: Record<string, Item>,
  crafted: readonly WeaponInstance[],
): WeaponCombat {
  let damage_min: number = BARE_HANDS_DAMAGE.damage_min;
  let damage_max: number = BARE_HANDS_DAMAGE.damage_max;
  let accuracy: number = ACCURACY_BASELINE;
  let weight = 0;

  if (eq) {
    if (eq.kind === "catalog") {
      const w = items[eq.id];
      if (w && w.kind === "weapon" && w.stats) {
        if (typeof w.stats.damage_min === "number") damage_min = w.stats.damage_min;
        if (typeof w.stats.damage_max === "number") damage_max = w.stats.damage_max;
        if (typeof w.stats.accuracy === "number") accuracy = w.stats.accuracy;
      }
      // combat-weight каталога = 0 (preflight §6-B): found-стволы не несут
      // handling-штрафа в M16; их trade-off — вечная прочность.
    } else {
      const inst = crafted.find((wi) => wi.id === eq.id);
      if (inst && inst.durability_current > 0) {
        damage_min = inst.stats.damage_min;
        damage_max = inst.stats.damage_max;
        accuracy = inst.stats.accuracy;
        weight = inst.weight_kg;
      }
      // else: broken / missing — bare-hands (R3), accuracy=BASELINE, weight=0.
    }
  }

  return { damage_min, damage_max, accuracy, weight };
}
