// M15 PR-1 — Weapon repair. Закрывает C6 repair-debt: до этого PR
// сломанный crafted-инстанс (`durability_current ≤ 0`) молча unequip-ался
// в craft_knife и навсегда оставался мёртвым грузом в `crafted_weapons[]`
// (см. durability.ts шапку). Теперь его можно починить за металл.
//
// Дисциплина (зеркало assemblyFlow.ts):
// - Pure: вся логика gate'а здесь, UI (CraftedWeaponsScene) не дублирует.
// - Immutable: вход не мутируется, возвращается новый инстанс.
// - Atomic: металл списан ⟺ оружие починено (только `ok` несёт metal_spent).
// - ТОЛЬКО crafted `WeaponInstance` (каталог durability-exempt, как durability).

import { METAL_PER_DURABILITY_POINT, REPAIR_MAX_DECAY } from "../state/balance";
import type { WeaponInstance } from "./weaponAssembly";

/**
 * Стоимость починки в металле. Пропорциональна «пробою» — сколько очков
 * прочности нужно вернуть от текущего до максимума (DF1, Alex GO).
 * Полностью сломанное (0/10) при rate=1 = 10 металла; лёгкий износ
 * (8/10) = 2. Чистая функция. `durability_current` всегда ≥ 0
 * (applyDurabilityHit floor-ит), так что результат ≥ 0.
 */
export const repairCost = (inst: WeaponInstance): number =>
  Math.ceil(
    (inst.durability_max - inst.durability_current) * METAL_PER_DURABILITY_POINT,
  );

/**
 * Discriminated union результата попытки починки — зеркало
 * `AssemblyAttemptResult`. Только `ok` несёт `metal_spent`; остальные
 * ветки металл НЕ трогают (atomic invariant). Discriminator `already_full`
 * (а не `not_broken`) точен под D2: триггер = «целое, чинить нечего»,
 * не «не сломано».
 */
export type RepairAttemptResult =
  | { kind: "ok"; instance: WeaponInstance; metal_spent: number }
  | { kind: "no_resource"; required: number; available: number }
  | { kind: "already_full" }
  | { kind: "beyond_repair" }
  | { kind: "not_found" };

/**
 * Pure gate починки. Порядок проверок строгий (как `attemptAssembly`):
 *   1. inst отсутствует → `not_found` (defensive: рассинхрон UI/state).
 *   2. `durability_current >= durability_max` → `already_full`
 *      (D2: чинить можно при `< max`, целое — нечего).
 *   3. `durability_max <= REPAIR_MAX_DECAY` → `beyond_repair`: decay увёл
 *      бы потолок в 0/негатив. Оружие — лом, единственный путь разобрать
 *      (DF1b: конечный horizon жизненного цикла).
 *   4. `metal < cost` → `no_resource` (gate; металл не тронут).
 *   5. `ok`: новый инстанс — `durability_max` снижен на `REPAIR_MAX_DECAY`
 *      (DF1b «усталость металла»), `durability_current` = новому
 *      (просевшему) max = полный restore до нового потолка. `metal_spent`
 *      = cost по СТАРОМУ пробою (платишь за полный ремонт; decay — налог
 *      усталости сверху). При decay=0 — чистый 100%-restore без horizon.
 *
 * Immutable: вход не мутируется.
 */
export const attemptRepair = (
  inst: WeaponInstance | undefined,
  metal_available: number,
): RepairAttemptResult => {
  if (!inst) {
    return { kind: "not_found" };
  }
  if (inst.durability_current >= inst.durability_max) {
    return { kind: "already_full" };
  }
  if (inst.durability_max <= REPAIR_MAX_DECAY) {
    return { kind: "beyond_repair" };
  }
  const cost = repairCost(inst);
  if (metal_available < cost) {
    return { kind: "no_resource", required: cost, available: metal_available };
  }
  const nextMax = inst.durability_max - REPAIR_MAX_DECAY;
  const repaired: WeaponInstance = {
    ...inst,
    durability_max: nextMax,
    durability_current: nextMax,
  };
  return { kind: "ok", instance: repaired, metal_spent: cost };
};
