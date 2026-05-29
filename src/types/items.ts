/**
 * M11.0 — Item Model (Weapons Foundation).
 *
 * Расширенная модель предметов под три класса экипировки:
 *   🔨 craft   — самоделы (крафтятся, ломкие, дешёвые, высокий пик)
 *   🎯 drop    — реальное оружие (собирается из parts, надёжное)
 *   🔧 mod     — модификации (крафтятся, навешиваются на drop)
 *   🧩 part    — детали оружия (падают с мобов / scavenge)
 *   🛢️ resource — материалы (лом, ткань, порох, …)
 *   💉 ammo    — патроны (по калибрам)
 *   🩹 consumable — расходники (медкит, бинт, …)
 *   🔧 broken_craft — сломанный самодел (разбирается на верстаке)
 *
 * Спека: docs/redesign/m11/M11.0-weapons.md §1.
 *
 * Совместимость: новые типы НЕ заменяют существующий `src/types/item.ts`,
 * а живут параллельно. ItemRegistry знает оба формата. Старый код остаётся
 * рабочим, новый код использует ItemRegistry.
 */

/** Класс предмета (M11). */
export type ItemClass =
  | "craft"
  | "drop"
  | "mod"
  | "part"
  | "resource"
  | "ammo"
  | "consumable"
  | "broken_craft";

/** Калибр патрона (M11). */
export type Caliber =
  | "9x18"
  | "7.62x25"
  | "5.45x39"
  | "7.62x39"
  | "7.62x54R"
  | ".308"
  | "12ga"
  | "melee"
  | "thrown";

/** Уровень шума при использовании оружия. */
export type WeaponNoise = "silent" | "low" | "medium" | "high" | "very_high";

/** Слоты модификаций на стволе. */
export type ModSlot = "muzzle" | "optic" | "magazine" | "stock" | "grip";

/** Базовые поля любого M11-предмета. */
export interface M11ItemBase {
  /** Generic ID (например "pistol_t1_pm"). Не зависит от naming mode. */
  id: string;
  /** Класс предмета. */
  itemClass: ItemClass;
  /** Тир 1..5. */
  tier: 1 | 2 | 3 | 4 | 5;
  /** Реалистичное название («Пистолет Макарова»). */
  name_real_ru: string;
  /** Обобщённое название («9-мм пистолет»). Используется если WEAPON_NAMING_MODE="generic". */
  name_generic_ru: string;
  /** Вес в кг. */
  weight_kg: number;
  /** Описание (без названия). */
  description_ru: string;
  /** Иконка (asset path). */
  icon?: string;
}

/** Самодел (крафт-оружие). */
export interface CraftWeapon extends M11ItemBase {
  itemClass: "craft";
  damageMin: number;
  damageMax: number;
  noise: WeaponNoise;
  /** Сколько использований до поломки (грубо). */
  durability: number;
  /** Каким `broken_craft` становится при поломке. */
  breaksInto: string;
  /** Калибр (для огнестрельных самоделов) или "melee" / "thrown". */
  caliber: Caliber;
}

/** Сломанный самодел — разбирается на верстаке. */
export interface BrokenCraft extends M11ItemBase {
  itemClass: "broken_craft";
  /** ID базового самодела (для UI и логики разбора). */
  brokenFrom: string;
  /**
   * Рецепт разбора: какие ресурсы получаем (обычно ~30% компонентов крафта).
   * Применяется на верстаке в режиме «разобрать».
   */
  disassembleRecipe: { item_id: string; count: number }[];
}

/** Сборное оружие (drop). Описывает каноническую модель, не конкретный экземпляр. */
export interface DropWeapon extends M11ItemBase {
  itemClass: "drop";
  damageMin: number;
  damageMax: number;
  noise: WeaponNoise;
  caliber: Caliber;
  /** Сколько патронов в магазине (для огнестрела). */
  magazineSize: number;
  /** Список ID parts'ов нужных для сборки. */
  partIds: string[];
  /** Поддерживаемые слоты модификаций. */
  modSlots: ModSlot[];
}

/** Деталь оружия. */
export interface WeaponPart extends M11ItemBase {
  itemClass: "part";
  /** К какому стволу (DropWeapon.id) относится. */
  weaponId: string;
  /** Слот в сборке (frame, slide, barrel, ...). Произвольная строка. */
  slot: string;
}

/** Модификация оружия. */
export interface WeaponMod extends M11ItemBase {
  itemClass: "mod";
  /** На какой слот ставится. */
  slot: ModSlot;
  /** Какие калибры поддерживает. Пустой массив = все. */
  caliberWhitelist: Caliber[];
  /** Изменения характеристик. */
  effects: {
    damageDelta?: number;
    noiseSet?: WeaponNoise;
    magazineDelta?: number;
    accuracyDelta?: number;
  };
  /** Шанс поломки мода при снятии (0..1). По решению Alex = 0.2. */
  removalBreakChance: number;
}

/** Патроны. */
export interface Ammo extends M11ItemBase {
  itemClass: "ammo";
  caliber: Caliber;
  /** Стек / пачка по умолчанию (для drop). */
  stackSize: number;
}

/** Ресурс (материал). */
export interface ResourceM11 extends M11ItemBase {
  itemClass: "resource";
}

/** Расходник (медкит, бинт, граната). */
export interface ConsumableM11 extends M11ItemBase {
  itemClass: "consumable";
  /** Тип эффекта. */
  effectType: "heal" | "ammo_refill" | "buff" | "damage";
  effectValue: number;
  charges: number;
}

/** Union любого M11-предмета. */
export type M11Item =
  | CraftWeapon
  | BrokenCraft
  | DropWeapon
  | WeaponPart
  | WeaponMod
  | Ammo
  | ResourceM11
  | ConsumableM11;

/**
 * Экземпляр собранного DropWeapon в инвентаре игрока.
 *
 * Stack-based item'ы (ammo, resource, part) хранятся обычным `InventoryStack`.
 * А сборное оружие — это уникальный экземпляр с собственными модами и
 * состоянием. Хранится отдельным массивом в инвентаре.
 */
export interface WeaponInstance {
  /** Уникальный ID экземпляра (UUID-like). */
  instanceId: string;
  /** ID базового DropWeapon. */
  itemId: string;
  /** Текущая прочность 0..maxDurability. */
  durability: number;
  /** Максимум прочности (для UI). */
  maxDurability: number;
  /** Установленные моды: slot → mod item id (или undefined). */
  mods: Partial<Record<ModSlot, string>>;
}

/** Type guard для WeaponInstance. */
export const isWeaponInstance = (x: unknown): x is WeaponInstance => {
  if (typeof x !== "object" || x === null) return false;
  const obj = x as Record<string, unknown>;
  return (
    typeof obj.instanceId === "string" &&
    typeof obj.itemId === "string" &&
    typeof obj.durability === "number" &&
    typeof obj.maxDurability === "number" &&
    typeof obj.mods === "object" &&
    obj.mods !== null
  );
};

/** Семейство M11-предметов с боевыми характеристиками. */
export type WeaponLike = CraftWeapon | DropWeapon;

export const isCraftWeapon = (i: M11Item): i is CraftWeapon =>
  i.itemClass === "craft";
export const isDropWeapon = (i: M11Item): i is DropWeapon =>
  i.itemClass === "drop";
export const isBrokenCraft = (i: M11Item): i is BrokenCraft =>
  i.itemClass === "broken_craft";
export const isWeaponPart = (i: M11Item): i is WeaponPart =>
  i.itemClass === "part";
export const isWeaponMod = (i: M11Item): i is WeaponMod =>
  i.itemClass === "mod";
