/**
 * M12.0b — Mod Effects Aggregation.
 *
 * Читает установленные на оружие моды (WeaponInstance.mods) и собирает их
 * суммарный эффект для использования в боевых расчётах: damage delta,
 * accuracy delta, noise override, magazine delta.
 *
 * Каждый мод (`WeaponMod` в items.ts) описывает свой `effects` объект.
 * Эта функция складывает effects всех установленных модов.
 */

import { getItem } from "../state/ItemRegistry";
import { isWeaponMod, type WeaponInstance, type WeaponNoise } from "../types/items";

export interface AggregatedModEffects {
  /** Сумма damageDelta всех модов (может быть отрицательной — ПБС). */
  damageDelta: number;
  /** Сумма accuracyDelta всех модов (0..1 шкала, прицел ~+0.2). */
  accuracyDelta: number;
  /** Override уровня шума оружия (silent ПБС перебивает loud стандарт). */
  noiseOverride: WeaponNoise | null;
  /** Сумма magazineDelta (расширенный магазин +5). */
  magazineDelta: number;
}

const EMPTY: AggregatedModEffects = {
  damageDelta: 0,
  accuracyDelta: 0,
  noiseOverride: null,
  magazineDelta: 0,
};

/**
 * Собирает эффекты всех модов установленных на weapon instance.
 *
 * Правила суммирования:
 *  - damageDelta / accuracyDelta / magazineDelta — обычная сумма
 *  - noiseOverride — приоритет: silent > low > medium > high > very_high.
 *    Если ни один мод не задаёт noiseSet — возвращаем null (используется
 *    исходный noise оружия).
 */
export const aggregateModEffects = (
  instance: WeaponInstance | null,
): AggregatedModEffects => {
  if (!instance) return EMPTY;
  const result: AggregatedModEffects = { ...EMPTY };
  let lowestNoise: WeaponNoise | null = null;

  for (const modId of Object.values(instance.mods)) {
    if (!modId) continue;
    const mod = getItem(modId);
    if (!mod || !isWeaponMod(mod)) continue;
    const e = mod.effects;
    result.damageDelta += e.damageDelta ?? 0;
    result.accuracyDelta += e.accuracyDelta ?? 0;
    result.magazineDelta += e.magazineDelta ?? 0;
    if (e.noiseSet) {
      lowestNoise = quieter(lowestNoise, e.noiseSet);
    }
  }

  result.noiseOverride = lowestNoise;
  return result;
};

const NOISE_RANK: Record<WeaponNoise, number> = {
  silent: 0,
  low: 1,
  medium: 2,
  high: 3,
  very_high: 4,
};

const quieter = (a: WeaponNoise | null, b: WeaponNoise): WeaponNoise => {
  if (!a) return b;
  return NOISE_RANK[b] < NOISE_RANK[a] ? b : a;
};
