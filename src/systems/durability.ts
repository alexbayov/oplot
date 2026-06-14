// M13 PR-6a — Weapon durability runtime.
//
// До PR-5 здесь жил M11-вариант (durability per WeaponInstance + crafted
// item_class), снесён вместе с M11-слоем. Возвращается на M13-типах с
// живым потребителем — sortieResolve дёргает один раз за энкаунтер.
//
// Дисциплина:
// - Применяется ТОЛЬКО к crafted `WeaponInstance` (C5 catch). 32
//   каталожных оружия (kind=weapon, id-shared) durability-exempt до тех
//   пор, пока не станут per-instance в каком-то будущем PR. Это
//   осознанная асимметрия: каталог = вечное (несколько id-шных
//   шаблонов), crafted = ломкое (per-instance).
// - Immutable: возвращаем новый инстанс, не мутируем входной (тот же
//   стиль что у assembleWeapon, упрощает рассуждение в snapshotHero).
// - Per-encounter formula: -1 за каждый survived encounter.
//   Depth-scaling отложен в balance-pass PR-6b (см. preflight OP2):
//   модель «оружие чешется быстрее на глубине» правильная геймплейно,
//   но это балансная развилка а не контракт; сейчас -1 чистый и
//   тестируемый.
// - Breakage: при `durability_current ≤ 0` оружие становится сломанным.
//   `isBroken(weapon)` — predicate для snapshotHero / InventoryScene.
//   Сломанный crafted unequip-ается → snapshotHero падает в bare-hands
//   fallback (existing 4/7 default), НЕ forced retreat (preflight OP3).

import type { EquippedWeapon } from "../state/types";
import { HERO_START_WEAPON_ID, PER_ENCOUNTER_HIT } from "../state/balance";
import type { WeaponInstance } from "./weaponAssembly";

/**
 * Применяет ущерб durability к crafted weapon instance после энкаунтера.
 * Floor: durability_current >= 0 (visually «сломан» при ровно 0).
 */
export const applyDurabilityHit = (
  weapon: WeaponInstance,
  delta: number = PER_ENCOUNTER_HIT,
): WeaponInstance => {
  const next = Math.max(0, weapon.durability_current - delta);
  return { ...weapon, durability_current: next };
};

/**
 * True если оружие исчерпало durability и должно быть unequip-нуто.
 * Не throws — это predicate для гейтов в snapshotHero / InventoryScene.
 */
export const isBroken = (weapon: WeaponInstance): boolean =>
  weapon.durability_current <= 0;

/**
 * Результат применения per-encounter durability-удара к эквипу игрока.
 * Pure helper, обходит UI/Phaser — тестируется фикстурами.
 *
 * Семантика:
 * - catalog/null эквип → no-op (broken=false, no rewrite). Каталог
 *   durability-exempt (см. шапку); null = пустой слот, нечего бить.
 * - crafted эквип → находим инстанс в `crafted_weapons` по id, мутируем
 *   его (immutable replace по индексу — список переписывается, инстанс
 *   получает новый durability_current). Если инстанс не найден
 *   (рассинхрон equipped_weapon vs crafted_weapons — теоретически
 *   невозможно при invariants) → no-op, не падаем.
 * - При durability_current ≤ 0 после удара → unequip:
 *   `equipped_weapon = { kind: "catalog", id: HERO_START_WEAPON_ID }`
 *   (= craft_knife, тот же дефолт что у `createDefaultPlayer`).
 *   Сломанный инстанс ОСТАЁТСЯ в crafted_weapons — repair UI (C6,
 *   долг следующего PR) сможет его починить.
 *   `broken=true` сигнализирует caller-у показать тост.
 */
export interface DurabilityHitResult {
  equipped_weapon: EquippedWeapon | null;
  crafted_weapons: WeaponInstance[];
  broken: boolean;
}

export const applyPerEncounterDurabilityHit = (
  equipped_weapon: EquippedWeapon | null,
  crafted_weapons: WeaponInstance[],
  delta: number = PER_ENCOUNTER_HIT,
): DurabilityHitResult => {
  if (!equipped_weapon || equipped_weapon.kind !== "crafted") {
    return { equipped_weapon, crafted_weapons, broken: false };
  }
  const idx = crafted_weapons.findIndex((wi) => wi.id === equipped_weapon.id);
  const target = crafted_weapons[idx];
  if (!target) {
    return { equipped_weapon, crafted_weapons, broken: false };
  }
  const hit = applyDurabilityHit(target, delta);
  const nextCrafted = crafted_weapons.slice();
  nextCrafted[idx] = hit;
  if (isBroken(hit)) {
    return {
      equipped_weapon: { kind: "catalog", id: HERO_START_WEAPON_ID },
      crafted_weapons: nextCrafted,
      broken: true,
    };
  }
  return {
    equipped_weapon,
    crafted_weapons: nextCrafted,
    broken: false,
  };
};
