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

import type { WeaponInstance } from "./weaponAssembly";

const PER_ENCOUNTER_HIT = 1;

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
