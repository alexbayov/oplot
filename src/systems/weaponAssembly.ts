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
import { AssemblyError, validateAssemblyParts } from "./assemblyValidation";

/**
 * M16 PR-1: случайный аффикс, замороженный на инстансе при сборке.
 * Форма `{id, value}` совпадает с `intrinsicAffixSchema` (itemSchema) —
 * id ссылается на запись реестра аффиксов, `value` — выкаченная (rolled)
 * и замороженная величина. Реестр (id → какой stat модифицирует) и
 * сам roll приедут в M16-PR3; в PR1 массив всегда `[]`.
 *
 * Whitelist потребителей аффиксов (`damage/accuracy/weight`) и его
 * compile-time enforcement через узкий union живут в реестре PR3 —
 * см. M16-PREFLIGHT §5. Аффиксы НЕ трогают durability/repair/disassembly
 * (петля M15 неприкосновенна).
 */
export interface WeaponAffix {
  id: string;
  value: number;
}

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
    /**
     * M16 PR-1: additive accuracy, сумма `part.stats.accuracy`. FROZEN.
     * Входит в оффенс через `accuracyToPowerFactor` (sortieResolve).
     */
    accuracy: number;
  };
  /**
   * M16 PR-1: combat-вес ствола = sum(part.weight_kg). FROZEN при сборке
   * (НЕ пересчитывается из parts на load — freeze-on-assembly, C4).
   * Входит в оффенс через `weightToPowerFactor`. Это НЕ инвентарный
   * carry-вес (тот считается отдельно из `weight_kg` каталога/предметов).
   */
  weight_kg: number;
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
  /**
   * M16 PR-1: замороженные random-аффиксы. Тип заведён сейчас (forward-
   * shape всей вехи), заполняется roll'ом в PR3. PR1 всегда `[]`.
   */
  affixes: WeaponAffix[];
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
  // M13 PR-6b-2: первой строкой — замороженный 3-reason validate. Invalid
  // parts → throws с reason-кодом; UI ловит и локализует через `t()`.
  const validation = validateAssemblyParts(parts);
  if (!validation.ok) throw new AssemblyError(validation.reason);

  let damageMin = 0;
  let damageMax = 0;
  let accuracy = 0;
  let weightKg = 0;
  let durabilityMax = 0;

  for (const part of parts) {
    const c = part.stats;
    // weight_kg живёт на commonItemFields, не в contribute-stats —
    // суммируем напрямую (combat-вес = сумма веса частей, M16-PR1).
    if (typeof part.weight_kg === "number") weightKg += part.weight_kg;
    if (!c) continue;
    if (typeof c.damage_min === "number") damageMin += c.damage_min;
    if (typeof c.damage_max === "number") damageMax += c.damage_max;
    if (typeof c.accuracy === "number") accuracy += c.accuracy;
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
    stats: { damage_min: damageMin, damage_max: damageMax, accuracy },
    weight_kg: weightKg,
    durability_max: durabilityMax,
    durability_current: durabilityMax,
    parts: parts.map((p) => p.id),
    // M16-PR1: affix-roll приедет в PR3 (rng уже прокинут в assemblyFlow).
    affixes: [],
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
