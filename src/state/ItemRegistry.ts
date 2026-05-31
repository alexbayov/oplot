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
  type Ammo,
  type BrokenCraft,
  type Caliber,
  type CraftWeapon,
  type DropWeapon,
  type ItemClass,
  type M11Item,
  type ModSlot,
  type WeaponInstance,
  type WeaponMod,
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
 *   "generic" → name_generic_ru; если поле отсутствует в старом/битом
 *               контенте, используем безопасный generic fallback без реальных ТМ.
 *
 * Для прочего — name_real_ru (resource / consumable не маскируются).
 */
export const itemName = (item: M11Item): string => {
  if (WEAPON_NAMING_MODE === "generic") {
    const cls = item.itemClass;
    if (isWeaponNamingSensitiveClass(cls)) {
      return item.name_generic_ru || releaseSafeFallbackName(item);
    }
  }
  return item.name_real_ru;
};

const isWeaponNamingSensitiveClass = (cls: ItemClass): boolean => {
  return (
    cls === "craft" ||
    cls === "drop" ||
    cls === "part" ||
    cls === "mod" ||
    cls === "ammo"
  );
};

const releaseSafeFallbackName = (item: M11Item): string => {
  switch (item.itemClass) {
    case "ammo":
      return `Патрон ${item.caliber}`;
    case "part":
      return `Деталь оружия T${item.tier}`;
    case "mod":
      return `Модификация оружия T${item.tier}`;
    case "craft":
    case "drop":
      return `Оружие T${item.tier}`;
    default:
      return `Предмет T${item.tier}`;
  }
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
  if (!item) return null;

  // CraftWeapon — durability с item, нет parts/mods validation
  if (isCraftWeapon(item)) {
    return {
      instanceId: generateInstanceId(rng),
      itemId,
      durability: item.durability,
      maxDurability: item.durability,
      mods: {},
    };
  }

  // DropWeapon — нужны все required parts
  if (isDropWeapon(item)) {
    const providedIds = parts.map((p) => p.id);
    for (const requiredId of item.partIds) {
      if (!providedIds.includes(requiredId)) return null;
    }
    const maxDurability = 50 + item.tier * 25;
    return {
      instanceId: generateInstanceId(rng),
      itemId,
      durability: maxDurability,
      maxDurability,
      mods: {},
    };
  }

  return null;
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
 * Поддерживает ДВА формата:
 *   1. Чистый legacy (M9-M10): только `type`, `stats`, `name_ru`
 *   2. Гибрид M11.0a (Devin content): legacy `type` + M11 поля
 *      (`item_class`, `caliber`, `name_real_ru`, `name_generic_ru`,
 *      `durability_max`, `mod_slot`, `fits_weapons`)
 *
 * Когда есть `item_class` — он приоритетнее heuristic'и над `type`.
 * Это позволяет M11.0c content замещать legacy без переписывания адаптера.
 */
export const adaptLegacyItem = (legacy: LegacyItem): M11Item => {
  // Гибридный доступ к Devin'овским extra-полям (snake_case в JSON).
  const ex = legacy as unknown as Record<string, unknown>;

  const itemClassRaw = typeof ex.item_class === "string" ? ex.item_class : undefined;
  const nameReal = typeof ex.name_real_ru === "string" ? ex.name_real_ru : legacy.name_ru;
  const nameGeneric = typeof ex.name_generic_ru === "string" ? ex.name_generic_ru : "";
  const caliberRaw = typeof ex.caliber === "string" ? (ex.caliber as Caliber) : undefined;
  const durabilityMax = typeof ex.durability_max === "number" ? ex.durability_max : 50;
  const modSlotRaw = typeof ex.mod_slot === "string" ? (ex.mod_slot as ModSlot) : undefined;
  // Devin использует `type` за пределами legacy enum для новых классов:
  const typeRaw = typeof ex.type === "string" ? ex.type : legacy.type;

  const base = {
    id: legacy.id,
    tier: legacy.tier,
    name_real_ru: nameReal,
    name_generic_ru: nameGeneric,
    weight_kg: legacy.weight_kg,
    description_ru: legacy.description_ru,
  };

  // === Гибрид M11: используем item_class явно ===
  if (itemClassRaw === "craft") {
    const stats = (legacy.stats ?? {}) as Record<string, unknown>;
    const dmgMin = typeof stats.damage_min === "number" ? stats.damage_min : 1;
    const dmgMax = typeof stats.damage_max === "number" ? stats.damage_max : 2;
    const w: CraftWeapon = {
      ...base,
      itemClass: "craft",
      damageMin: dmgMin,
      damageMax: dmgMax,
      noise: (typeof stats.noise === "string" ? stats.noise : "loud") as CraftWeapon["noise"],
      durability: durabilityMax,
      breaksInto: `broken_${legacy.id}`,
      caliber: caliberRaw ?? "melee",
    };
    return w;
  }

  if (itemClassRaw === "drop") {
    const stats = (legacy.stats ?? {}) as Record<string, unknown>;
    const dmgMin = typeof stats.damage_min === "number" ? stats.damage_min : 1;
    const dmgMax = typeof stats.damage_max === "number" ? stats.damage_max : 2;
    const magSize = typeof ex.magazine_size === "number" ? ex.magazine_size : 8;
    const w: DropWeapon = {
      ...base,
      itemClass: "drop",
      damageMin: dmgMin,
      damageMax: dmgMax,
      noise: (typeof stats.noise === "string" ? stats.noise : "loud") as DropWeapon["noise"],
      caliber: caliberRaw ?? "9x18",
      magazineSize: magSize,
      partIds: Array.isArray(ex.part_ids)
        ? (ex.part_ids as string[])
        : Array.isArray(ex.parts_required)
          ? (ex.parts_required as string[])
          : [],
      modSlots: Array.isArray(ex.mod_slots)
        ? (ex.mod_slots as ModSlot[])
        : [],
    };
    return w;
  }

  if (itemClassRaw === "part" || typeRaw === "weapon_part") {
    const p: WeaponPart = {
      ...base,
      itemClass: "part",
      weaponId: typeof ex.weapon_id === "string"
        ? ex.weapon_id
        : typeof ex.part_of === "string"
          ? ex.part_of
          : "",
      slot: typeof ex.slot === "string"
        ? ex.slot
        : typeof ex.part_kind === "string"
          ? ex.part_kind
          : "other",
    };
    return p;
  }

  if (itemClassRaw === "modification" || itemClassRaw === "mod" || typeRaw === "modification") {
    const stats = (legacy.stats ?? {}) as Record<string, unknown>;
    const effects: WeaponMod["effects"] = {};
    if (typeof stats.damage_delta === "number") effects.damageDelta = stats.damage_delta;
    if (typeof stats.magazine_delta === "number") effects.magazineDelta = stats.magazine_delta;
    if (typeof stats.accuracy_delta === "number") effects.accuracyDelta = stats.accuracy_delta;
    if (typeof stats.noise_set === "string") {
      effects.noiseSet = stats.noise_set as WeaponMod["effects"]["noiseSet"];
    }
    const m: WeaponMod = {
      ...base,
      itemClass: "mod",
      slot: modSlotRaw ?? "muzzle",
      caliberWhitelist: Array.isArray(ex.caliber_whitelist)
        ? (ex.caliber_whitelist as Caliber[])
        : [],
      effects,
      removalBreakChance: typeof ex.removal_break_chance === "number"
        ? ex.removal_break_chance
        : 0.2,
    };
    return m;
  }

  if (itemClassRaw === "ammo" || typeRaw === "ammo") {
    const a: Ammo = {
      ...base,
      itemClass: "ammo",
      caliber: caliberRaw ?? "9x18",
      stackSize: typeof ex.stack_size === "number" ? ex.stack_size : 100,
    };
    return a;
  }

  if (itemClassRaw === "broken_craft") {
    const b: BrokenCraft = {
      ...base,
      itemClass: "broken_craft",
      brokenFrom: typeof ex.broken_from === "string" ? ex.broken_from : legacy.id.replace(/^broken_/, ""),
      disassembleRecipe: Array.isArray(ex.disassemble_recipe)
        ? (ex.disassemble_recipe as { item_id: string; count: number }[])
        : Array.isArray(ex.disassemble_yield)
          ? (ex.disassemble_yield as { item_id: string; count: number }[])
          : [],
    };
    return b;
  }

  // === Чистый legacy fallback (M9-M10 формат, без item_class) ===
  switch (legacy.type) {
    case "weapon_melee": {
      const w: CraftWeapon = {
        ...base,
        itemClass: "craft",
        damageMin: legacy.stats.damage_min,
        damageMax: legacy.stats.damage_max,
        noise: legacy.stats.noise as CraftWeapon["noise"],
        durability: durabilityMax,
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
        durability: durabilityMax,
        breaksInto: `broken_${legacy.id}`,
        caliber: caliberRaw ?? (legacy.id.includes("rifle") ? "7.62x39" : "9x18"),
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
          : "resource";
      return { ...base, itemClass: cls } as M11Item;
    }
  }
};

/**
 * Загрузить весь content (items из ContentData) в registry через адаптер.
 *
 * Вызывается из GameState.setContent. После этого `getItem(id)` возвращает
 * M11Item shape для всех загруженных предметов.
 */
export const loadContentItems = (items: Record<string, LegacyItem>): void => {
  registry.byId.clear();
  for (const item of Object.values(items)) {
    const adapted = adaptLegacyItem(item);
    registry.byId.set(adapted.id, adapted);
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
