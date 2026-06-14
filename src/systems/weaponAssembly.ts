// M13 PR-6a — Weapon Assembly.
//
// Чистый ассемблер: список component-частей → WeaponInstance. Сумма
// per-key вкладов parts[].stats (additive scalar, см. itemSchema
// componentSchema), потом floor (damage_min ≥ 0) и сохранение результата
// в инстанс.
//
// Дисциплина «freeze on assembly» (C4 catch из preflight 6a): stats
// инстанса вычисляются один раз при сборке и хранятся в save. parts
// сохраняется для display/disassembly, но НЕ ре-собирается на load —
// иначе баланс-патч в PR-6b или M14 безмолвно перепишет статы каждого
// существующего сейв-инстанса. Та же save-safety дисциплина что в PR-5.
//
// WeaponInstance тип живёт ЗДЕСЬ, не в types/items.ts (тот файл удалён
// в PR-5 вместе с M11-слоем и не воскрешается). Импорт из этого модуля.

import type { ComponentItem } from "../types";

export interface WeaponInstance {
  /**
   * Уникальный id инстанса, не путать с id шаблонной части. Генерируется
   * при сборке через `nextWeaponInstanceId(rng)` ниже, для save-стабильности.
   */
  id: string;
  /**
   * Имя для UI. До PR-6b (craft UI) — просто «Сборка: {parts.length}
   * частей»; авторский nейминг приедет с UI вместе.
   */
  name_ru: string;
  /** Совпадает со слотом цельных оружий каталога — equip-логика единообразна. */
  slot: "action";
  /**
   * FROZEN при сборке. Re-assemble на load запрещён (см. дисциплину
   * «freeze on assembly» в шапке).
   */
  stats: {
    damage_min: number;
    damage_max: number;
  };
  /** Max durability инстанса — снимок суммы вкладов при сборке (immutable). */
  durability_max: number;
  /** Mutable counter. Уменьшается через `applyDurabilityHit` в durability.ts. */
  durability_current: number;
  /**
   * ID-ы частей, из которых собран инстанс. Хранятся для display
   * (тултип, разборка) и для potential audit (что было использовано).
   * НЕ источник истины для stats — не пересчитываются на load.
   */
  parts: string[];
}

const FLOOR_DAMAGE_MIN = 0;

/**
 * Собирает WeaponInstance из массива component-частей.
 *
 * Сумма-по-ключам аддитивна и коммутативна — порядок частей не влияет
 * на результат (важно для теста commutativity и для предсказуемости
 * UI). Floor применяется ПОСЛЕ суммирования, чтобы отрицательные вклады
 * (облегчающие части) могли компенсировать друг друга на промежуточном
 * этапе перед floor-ом.
 */
export const assembleWeapon = (
  parts: ComponentItem[],
  id: string,
): WeaponInstance => {
  let damageMin = 0;
  let damageMax = 0;
  let durabilityMax = 0;

  for (const part of parts) {
    const c = part.stats;
    if (!c) continue;
    if (typeof c.damage_min === "number") damageMin += c.damage_min;
    if (typeof c.damage_max === "number") damageMax += c.damage_max;
    if (typeof c.durability_max === "number") durabilityMax += c.durability_max;
  }

  damageMin = Math.max(FLOOR_DAMAGE_MIN, damageMin);
  // Защита от неконсистентности вкладов: damage_max не может быть
  // меньше damage_min (иначе sortieResolve формула получит inverted
  // диапазон). Если части собраны так что max < min — клампим.
  damageMax = Math.max(damageMin, damageMax);

  return {
    id,
    name_ru: `Сборка (${parts.length})`,
    slot: "action",
    stats: { damage_min: damageMin, damage_max: damageMax },
    durability_max: durabilityMax,
    durability_current: durabilityMax,
    parts: parts.map((p) => p.id),
  };
};

/**
 * Генерирует id для нового WeaponInstance. Короткий слаг, стабильный
 * на конкретный seeded rng — нужен для save-snapshot инвариантов.
 */
export const nextWeaponInstanceId = (rng: () => number): string => {
  const n = Math.floor(rng() * 1e9)
    .toString(36)
    .padStart(7, "0");
  return `wi_${n}`;
};
