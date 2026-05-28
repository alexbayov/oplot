/**
 * M11.0 — ItemRegistry.
 *
 * Единая точка доступа к предметам. Знает оба формата:
 *   - LEGACY: `src/types/item.ts` Item (текущий items.json)
 *   - M11:    `src/types/items.ts` M11Item (новый items.json после M11.0c)
 *
 * Цель: остальной код (combat, craft, loot, UI) обращается ТОЛЬКО через
 * ItemRegistry. Когда Content Designer допишет новый items.json — переключение
 * прозрачно. До тех пор адаптер docks старые поля в M11Item-shape.
 *
 * Спека: docs/redesign/m11/M11.0-weapons.md §11.
 */

import { WEAPON_NAMING_MODE } from "../config";
import type { Item as LegacyItem } from "../types";
import {
  isBrokenCraft,
  isCraftWeapon,
  isDropWeapon,
  isWeaponMod,
  isWeaponPart,
  type BrokenCraft,
  type Caliber,
  type CraftWeapon,
  type DropWeapon,
  type ItemClass,
  type M11Item,
  type ModSlot,
  type WeaponInstance,
  type WeaponPart,
} from "../types/items";
import { GameState } from "./GameState";

/** Один экземпляр реестра. ItemRegistry — singleton по конструкции (модуль). */
interface Registry {
  byId: Map<string, M11Item>;
}

const registry: Registry = {
  byId: new Map(),
};

/**
 * Загрузить M11-предметы в реестр. Вызывается из BootScene после parse
 * content/items.json (M11.0c). До этого реестр пустой, и `getItem()`
 * fallback'ится на legacy.
 */
export const setM11Items = (items: M11Item[]): void => {
  registry.byId.clear();
  for (const item of items) {
    registry.byId.set(item.id, item);
  }
};

/** Очистить реестр (используется тестами). */
export const clearRegistry = (): void => {
  registry.byId.clear();
};

/**
 * Получить предмет по ID.
 *
 * Сначала смотрим в M11-реестр. Если не нашли — пытаемся адаптировать
 * legacy Item из GameState.data.items (старый items.json).
 *
 * Возвращает `null` если ID не найден ни там, ни там.
 */
export const getItem = (id: string): M11Item | null => {
  const m11 = registry.byId.get(id);
  if (m11) return m11;

  const legacy = GameState.data.items[id];
  if (legacy) return adaptLegacyItem(legacy);

  return null;
};

/** Все известные предметы (для UI каталогов, тестов). */
export const allItems = (): M11Item[] => {
  if (registry.byId.size > 0) return Array.from(registry.byId.values());
  // Fallback на legacy items.
  return Object.values(GameState.data.items).map(adaptLegacyItem);
};

/**
 * Получить отображаемое имя предмета с учётом WEAPON_NAMING_MODE.
 *
 * Для craft / drop / part / mod / ammo:
 *   "real"    → name_real_ru
 *   "generic" → name_generic_ru (если есть, иначе name_real_ru)
 *
 * Для прочего — name_real_ru (resource / consumable не маскируются).
 */
export const itemName = (item: M11Item): string => {
  if (WEAPON_NAMING_MODE === "generic") {
    const cls = item.itemClass;
    if (
      cls === "craft" ||
      cls === "drop" ||
      cls === "part" ||
      cls === "mod" ||
      cls === "ammo"
    ) {
      return item.name_generic_ru || item.name_real_ru;
    }
  }
  return item.name_real_ru;
};

/** Получить имя по ID (удобный shortcut). */
export const itemNameById = (id: string): string => {
  const item = getItem(id);
  return item ? itemName(item) : id;
};

/** Создать новый экземпляр оружия (drop) из набора частей. */
export const createWeaponInstance = (
  itemId: string,
  parts: WeaponPart[],
  rng: () => number = Math.random,
): WeaponInstance | null => {
  const item = getItem(itemId);
  if (!item || !isDropWeapon(item)) return null;

  // Проверка: все требуемые parts на месте.
  const providedIds = parts.map((p) => p.id);
  for (const requiredId of item.partIds) {
    if (!providedIds.includes(requiredId)) return null;
  }

  // maxDurability фиксирован тиром: 50 + tier * 25 (T2=100, T5=175).
  const maxDurability = 50 + item.tier * 25;

  return {
    instanceId: generateInstanceId(rng),
    itemId,
    durability: maxDurability,
    maxDurability,
    mods: {},
  };
};

/**
 * Установить мод в слот.
 *
 * Возвращает обновлённый instance. Если в слоте уже был мод,
 * он возвращается отдельным значением (вызывающий решает что с ним делать).
 */
export const installMod = (
  instance: WeaponInstance,
  modId: string,
): { instance: WeaponInstance; replaced: string | undefined } => {
  const mod = getItem(modId);
  if (!mod || !isWeaponMod(mod)) {
    return { instance, replaced: undefined };
  }
  const weapon = getItem(instance.itemId);
  if (!weapon || !isDropWeapon(weapon)) {
    return { instance, replaced: undefined };
  }
  if (!weapon.modSlots.includes(mod.slot)) {
    return { instance, replaced: undefined };
  }
  if (
    mod.caliberWhitelist.length > 0 &&
    !mod.caliberWhitelist.includes(weapon.caliber)
  ) {
    return { instance, replaced: undefined };
  }

  const replaced = instance.mods[mod.slot];
  const nextMods = { ...instance.mods, [mod.slot]: modId };
  return { instance: { ...instance, mods: nextMods }, replaced };
};

/**
 * Снять мод из слота. По решению Alex — шанс поломки мода 20% (по умолчанию).
 * Возвращает { instance: без мода, modSurvived: bool, modId }.
 */
export const removeMod = (
  instance: WeaponInstance,
  slot: ModSlot,
  rng: () => number = Math.random,
): { instance: WeaponInstance; modSurvived: boolean; modId: string | null } => {
  const modId = instance.mods[slot];
  if (!modId) {
    return { instance, modSurvived: false, modId: null };
  }
  const mod = getItem(modId);
  const breakChance = mod && isWeaponMod(mod) ? mod.removalBreakChance : 0.2;
  const modSurvived = rng() >= breakChance;

  const nextMods: Partial<Record<ModSlot, string>> = {};
  for (const key of Object.keys(instance.mods) as ModSlot[]) {
    if (key !== slot) nextMods[key] = instance.mods[key];
  }
  return {
    instance: { ...instance, mods: nextMods },
    modSurvived,
    modId,
  };
};

/** Получить итоговые характеристики экземпляра с учётом установленных модов. */
export const computeWeaponStats = (instance: WeaponInstance): {
  damageMin: number;
  damageMax: number;
  caliber: Caliber | null;
  noise: string;
  magazineSize: number;
} | null => {
  const weapon = getItem(instance.itemId);
  if (!weapon || !isDropWeapon(weapon)) return null;

  let damageMin = weapon.damageMin;
  let damageMax = weapon.damageMax;
  let magazineSize = weapon.magazineSize;
  let noise: string = weapon.noise;

  for (const slot of Object.keys(instance.mods) as ModSlot[]) {
    const modId = instance.mods[slot];
    if (!modId) continue;
    const mod = getItem(modId);
    if (!mod || !isWeaponMod(mod)) continue;
    const e = mod.effects;
    if (e.damageDelta) {
      damageMin += e.damageDelta;
      damageMax += e.damageDelta;
    }
    if (e.magazineDelta) magazineSize += e.magazineDelta;
    if (e.noiseSet) noise = e.noiseSet;
  }

  return {
    damageMin,
    damageMax,
    caliber: weapon.caliber,
    noise,
    magazineSize,
  };
};

/** Проверка class predicates re-exported. */
export {
  isBrokenCraft,
  isCraftWeapon,
  isDropWeapon,
  isWeaponMod,
  isWeaponPart,
};

// ─────────────────────────────────────────────────────────────────────
// Legacy adapter
// ─────────────────────────────────────────────────────────────────────

/**
 * Адаптер: преобразовать legacy Item (старый items.json) в M11Item-shape.
 *
 * Это "shim", который работает в M11.0a–c пока Content Designer не
 * заменит items.json полностью. После этого адаптер становится no-op
 * (legacy items.json не используется).
 */
export const adaptLegacyItem = (legacy: LegacyItem): M11Item => {
  const base = {
    id: legacy.id,
    tier: legacy.tier,
    name_real_ru: legacy.name_ru,
    name_generic_ru: legacy.name_ru, // legacy не имеет generic варианта
    weight_kg: legacy.weight_kg,
    description_ru: legacy.description_ru,
  };

  switch (legacy.type) {
    case "weapon_melee": {
      const w: CraftWeapon = {
        ...base,
        itemClass: "craft",
        damageMin: legacy.stats.damage_min,
        damageMax: legacy.stats.damage_max,
        noise: legacy.stats.noise as CraftWeapon["noise"],
        durability: 50,
        breaksInto: `broken_${legacy.id}`,
        caliber: "melee",
      };
      return w;
    }
    case "weapon_ranged": {
      const w: CraftWeapon = {
        ...base,
        itemClass: "craft",
        damageMin: legacy.stats.damage_min,
        damageMax: legacy.stats.damage_max,
        noise: legacy.stats.noise as CraftWeapon["noise"],
        durability: 50,
        breaksInto: `broken_${legacy.id}`,
        // Legacy не имеет каноники калибра — присваиваем по umol heuristic
        // (имя содержит "rifle" → 7.62×39, иначе 9×18). В M11.0c всё переедет.
        caliber: legacy.id.includes("rifle") ? "7.62x39" : "9x18",
      };
      return w;
    }
    case "armor":
    case "consumable":
    case "resource":
    default: {
      const cls: ItemClass =
        legacy.type === "consumable"
          ? "consumable"
          : legacy.type === "armor"
            ? "resource" // legacy armor попадает как "resource" пока не M11.0d
            : "resource";
      return { ...base, itemClass: cls } as M11Item;
    }
  }
};

// ─────────────────────────────────────────────────────────────────────
// Internal
// ─────────────────────────────────────────────────────────────────────

const generateInstanceId = (rng: () => number): string => {
  // Short random ID, достаточно уникальный для одной save-сессии.
  const ts = Date.now().toString(36);
  const rnd = Math.floor(rng() * 1e8)
    .toString(36)
    .padStart(5, "0");
  return `wi_${ts}_${rnd}`;
};

// Re-exports for systems that consume the types alongside the API.
export type { M11Item, WeaponInstance, BrokenCraft, DropWeapon };
