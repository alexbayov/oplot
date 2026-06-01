export type AmmoDisabledReason =
  | "no_ammo_id"
  | "no_reserve_ammo"
  | "magazine_full"
  | "invalid_capacity"
  | "not_ranged_weapon"
  | "unsupported_weapon_metadata";

export interface AmmoStackLike {
  readonly item_id: string;
  readonly count: number;
}

export interface AmmoWeaponStatsLike {
  readonly ammo_id?: unknown;
  readonly ammo_per_shot?: unknown;
  readonly magazine_size?: unknown;
  readonly magazineSize?: unknown;
  readonly magazineCapacity?: unknown;
  readonly caliber?: unknown;
}

export interface AmmoWeaponLike {
  readonly id?: string;
  readonly item_id?: unknown;
  readonly itemId?: unknown;
  readonly weaponId?: unknown;
  readonly baseId?: unknown;
  readonly itemClass?: unknown;
  readonly type?: unknown;
  readonly ammo_id?: unknown;
  readonly ammo_per_shot?: unknown;
  readonly magazine_size?: unknown;
  readonly magazineSize?: unknown;
  readonly magazineCapacity?: unknown;
  readonly caliber?: unknown;
  readonly stats?: AmmoWeaponStatsLike;
  readonly weaponKind?: unknown;
  readonly kind?: unknown;
  readonly class?: unknown;
  readonly category?: unknown;
  readonly slot?: unknown;
  readonly equipSlot?: unknown;
}

export interface WeaponAmmoSpec {
  readonly ammoId: string;
  readonly ammoPerShot: number;
  readonly magazineCapacity: number | null;
  readonly fallbackReason: AmmoDisabledReason | null;
}

export type WeaponAmmoSpecResult =
  | { readonly ok: true; readonly spec: WeaponAmmoSpec }
  | { readonly ok: false; readonly reason: AmmoDisabledReason };

export interface ReloadPlanInput {
  readonly weapon: AmmoWeaponLike | null | undefined;
  readonly backpack: readonly AmmoStackLike[];
  readonly currentMagazine: number;
  readonly magazineCapacity?: number | null;
}

export type ReloadPlanResult =
  | {
      readonly ok: true;
      readonly ammoId: string;
      readonly ammoPerShot: number;
      readonly reloadAmount: number;
      readonly reserveAmmoConsumed: number;
      readonly reserveBefore: number;
      readonly resultingMagazine: number;
      readonly magazineCapacity: number;
      readonly fallbackReason: AmmoDisabledReason | null;
    }
  | {
      readonly ok: false;
      readonly disabledReason: AmmoDisabledReason;
      readonly ammoId?: string;
      readonly reserveBefore?: number;
      readonly resultingMagazine?: number;
      readonly magazineCapacity?: number;
      readonly fallbackReason?: AmmoDisabledReason | null;
    };

const isPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const readPositiveInteger = (value: unknown): number | null => {
  if (!isPositiveFiniteNumber(value)) return null;
  return Math.floor(value);
};

const readPositiveAmmoCost = (value: unknown): number | null => readPositiveInteger(value);

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const KNOWN_CALIBER_AMMO_IDS: Record<string, string> = {
  "9x18": "ammo_9x18",
  "12g": "ammo_12g",
  "12ga": "ammo_12ga",
  "7.62x25": "ammo_762x25",
  "7.62x39": "ammo_762x39",
  "5.45x39": "ammo_545",
  "7.62x54r": "ammo_762x54r",
  ".308": "ammo_308",
};

export const normalizeCaliberAmmoId = (caliber: unknown): string | null => {
  const value = readString(caliber)?.toLowerCase();
  if (!value) return null;
  if (value.startsWith("ammo_")) return value;
  return KNOWN_CALIBER_AMMO_IDS[value] ?? null;
};

const readMagazineCapacity = (weapon: AmmoWeaponLike): number | null =>
  readPositiveInteger(weapon.magazineCapacity) ??
  readPositiveInteger(weapon.magazineSize) ??
  readPositiveInteger(weapon.magazine_size) ??
  readPositiveInteger(weapon.stats?.magazineCapacity) ??
  readPositiveInteger(weapon.stats?.magazineSize) ??
  readPositiveInteger(weapon.stats?.magazine_size);

const normalizeMagazineCount = (value: number, capacity: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(capacity, Math.floor(value)));
};

export const getAmmoCostForShot = (weapon: AmmoWeaponLike | null | undefined): number => {
  if (!weapon) return 1;
  return readPositiveAmmoCost(weapon.ammo_per_shot) ?? readPositiveAmmoCost(weapon.stats?.ammo_per_shot) ?? 1;
};

const getFallbackCapacity = (ammoId: string): number | null => {
  const id = ammoId.toLowerCase();
  if (id.includes("9x18")) return 8;
  if (id.includes("762x25") || id.includes("7.62x25")) return 8;
  if (id.includes("762x39") || id.includes("7.62x39")) return 30;
  if (id.includes("545") || id.includes("5.45")) return 30;
  if (id.includes("12ga") || id.includes("12g")) return 5;
  if (id.includes("762x54r") || id.includes("7.62x54")) return 5;
  if (id.includes("308")) return 5;
  return null;
};

const WEAPON_FALLBACK_CAPACITIES: Record<string, number> = {
  pm: 8,
  aps: 20,
  tt: 8,
  ppsh: 35,
  akm: 30,
  sks: 10,
  saiga_12: 8,
  saiga: 8,
  svd: 10,
  aks_74u: 30,
  aks74u: 30,
  ak_74: 30,
  ak74: 30,
  rpk: 45,
  mosin: 5,
  iz_43: 2,
  iz43: 2,
  bekas: 4,
  rifle_t3_hunting: 5,
};

const getWeaponSpecificFallbackCapacity = (weaponId: string): number | null => {
  return WEAPON_FALLBACK_CAPACITIES[weaponId] ?? null;
};

const getWeaponId = (weapon: AmmoWeaponLike): string | null => {
  const idVal =
    readString(weapon.id) ??
    readString(weapon.item_id) ??
    readString(weapon.itemId) ??
    readString(weapon.weaponId) ??
    readString(weapon.baseId);
  return idVal ? idVal.toLowerCase() : null;
};

const isNonRangedSignal = (weapon: AmmoWeaponLike): boolean => {
  const checkValue = (val: unknown): boolean => {
    if (typeof val !== "string") return false;
    const lower = val.toLowerCase();
    const nonRangedWords = [
      "melee",
      "material",
      "consumable",
      "armor",
      "mod",
      "part",
      "ammo",
      "resource",
      "quest",
      "broken_craft"
    ];
    return nonRangedWords.some((word) => lower.includes(word));
  };

  if (checkValue(weapon.type)) return true;
  if (checkValue(weapon.itemClass)) return true;
  if (checkValue(weapon.category)) return true;
  if (checkValue(weapon.kind)) return true;
  if (checkValue(weapon.class)) return true;

  const caliberVal = weapon.caliber ?? weapon.stats?.caliber;
  if (typeof caliberVal === "string") {
    const lowerCal = caliberVal.toLowerCase();
    if (lowerCal === "melee" || lowerCal === "thrown") {
      return true;
    }
  }

  return false;
};

const hasRangedSignal = (weapon: AmmoWeaponLike): boolean => {
  const checkValue = (val: unknown): boolean => {
    if (typeof val !== "string") return false;
    const lower = val.toLowerCase();
    return lower.includes("ranged") || lower.includes("gun") || lower.includes("firearm");
  };

  if (checkValue(weapon.type)) return true;
  if (checkValue(weapon.weaponKind)) return true;
  if (checkValue(weapon.kind)) return true;
  if (checkValue(weapon.class)) return true;
  if (checkValue(weapon.category)) return true;
  if (checkValue(weapon.slot)) return true;
  if (checkValue(weapon.equipSlot)) return true;

  return false;
};

const isReloadCapableRanged = (weapon: AmmoWeaponLike): boolean => {
  if (isNonRangedSignal(weapon)) {
    return false;
  }
  return hasRangedSignal(weapon);
};

export const getWeaponAmmoSpec = (weapon: AmmoWeaponLike | null | undefined): WeaponAmmoSpecResult => {
  if (!weapon) {
    return { ok: false, reason: "not_ranged_weapon" };
  }

  if (!isReloadCapableRanged(weapon)) {
    return { ok: false, reason: "not_ranged_weapon" };
  }

  const explicitCapacity = readMagazineCapacity(weapon);

  const explicitAmmoId = readString(weapon.ammo_id) ?? readString(weapon.stats?.ammo_id);
  const ammoId =
    explicitAmmoId ?? normalizeCaliberAmmoId(weapon.caliber) ?? normalizeCaliberAmmoId(weapon.stats?.caliber);
  if (!ammoId) {
    return { ok: false, reason: "no_ammo_id" };
  }

  const rawAmmoPerShot = readPositiveAmmoCost(weapon.ammo_per_shot) ?? readPositiveAmmoCost(weapon.stats?.ammo_per_shot);
  const ammoPerShot = rawAmmoPerShot ?? 1;

  const hasCapacityField =
    (weapon.magazineCapacity !== undefined && weapon.magazineCapacity !== null) ||
    (weapon.magazineSize !== undefined && weapon.magazineSize !== null) ||
    (weapon.magazine_size !== undefined && weapon.magazine_size !== null) ||
    (weapon.stats?.magazineCapacity !== undefined && weapon.stats?.magazineCapacity !== null) ||
    (weapon.stats?.magazineSize !== undefined && weapon.stats?.magazineSize !== null) ||
    (weapon.stats?.magazine_size !== undefined && weapon.stats?.magazine_size !== null);

  let magazineCapacity = explicitCapacity;
  if (magazineCapacity === null && !hasCapacityField) {
    const weaponId = getWeaponId(weapon);
    const weaponFallback = weaponId ? getWeaponSpecificFallbackCapacity(weaponId) : null;
    if (weaponFallback !== null) {
      magazineCapacity = weaponFallback;
    } else {
      const ammoFallbackVal = getFallbackCapacity(ammoId);
      if (ammoFallbackVal !== null) {
        magazineCapacity = ammoFallbackVal;
      }
    }
  }

  const hasCapacityFallback = explicitCapacity === null && magazineCapacity !== null;
  const hasAmmoPerShotFallback = rawAmmoPerShot === null;
  const fallbackReason: AmmoDisabledReason | null = (hasCapacityFallback || hasAmmoPerShotFallback)
    ? "unsupported_weapon_metadata"
    : null;

  return {
    ok: true,
    spec: {
      ammoId,
      ammoPerShot,
      magazineCapacity,
      fallbackReason,
    },
  };
};

export const getReserveAmmoCount = (backpack: readonly AmmoStackLike[], ammoId: string): number =>
  backpack.reduce((total, stack) => {
    if (stack.item_id !== ammoId || !Number.isFinite(stack.count) || stack.count <= 0) return total;
    return total + Math.floor(stack.count);
  }, 0);

export const computeAmmoDisabledReason = (input: ReloadPlanInput): AmmoDisabledReason | null => {
  const specResult = getWeaponAmmoSpec(input.weapon);
  if (!specResult.ok) return specResult.reason;

  const capacity = input.magazineCapacity ?? specResult.spec.magazineCapacity;
  if (!isPositiveFiniteNumber(capacity)) return "invalid_capacity";

  const magazineCapacity = Math.floor(capacity);
  const currentMagazine = normalizeMagazineCount(input.currentMagazine, magazineCapacity);
  if (currentMagazine >= magazineCapacity) return "magazine_full";

  const reserveBefore = getReserveAmmoCount(input.backpack, specResult.spec.ammoId);
  if (reserveBefore <= 0) return "no_reserve_ammo";

  return null;
};

export const canReloadMagazine = (input: ReloadPlanInput): boolean => computeAmmoDisabledReason(input) === null;

export const computeReloadPlan = (input: ReloadPlanInput): ReloadPlanResult => {
  const specResult = getWeaponAmmoSpec(input.weapon);
  if (!specResult.ok) return { ok: false, disabledReason: specResult.reason };

  const capacity = input.magazineCapacity ?? specResult.spec.magazineCapacity;
  if (!isPositiveFiniteNumber(capacity)) {
    return { ok: false, disabledReason: "invalid_capacity", ammoId: specResult.spec.ammoId, fallbackReason: specResult.spec.fallbackReason };
  }

  const magazineCapacity = Math.floor(capacity);
  const currentMagazine = normalizeMagazineCount(input.currentMagazine, magazineCapacity);
  if (currentMagazine >= magazineCapacity) {
    return {
      ok: false,
      disabledReason: "magazine_full",
      ammoId: specResult.spec.ammoId,
      reserveBefore: getReserveAmmoCount(input.backpack, specResult.spec.ammoId),
      resultingMagazine: currentMagazine,
      magazineCapacity,
      fallbackReason: specResult.spec.fallbackReason,
    };
  }

  const reserveBefore = getReserveAmmoCount(input.backpack, specResult.spec.ammoId);
  if (reserveBefore <= 0) {
    return {
      ok: false,
      disabledReason: "no_reserve_ammo",
      ammoId: specResult.spec.ammoId,
      reserveBefore,
      resultingMagazine: currentMagazine,
      magazineCapacity,
      fallbackReason: specResult.spec.fallbackReason,
    };
  }

  const missingInMagazine = magazineCapacity - currentMagazine;
  const reloadAmount = Math.min(missingInMagazine, reserveBefore);

  return {
    ok: true,
    ammoId: specResult.spec.ammoId,
    ammoPerShot: specResult.spec.ammoPerShot,
    reloadAmount,
    reserveAmmoConsumed: reloadAmount,
    reserveBefore,
    resultingMagazine: currentMagazine + reloadAmount,
    magazineCapacity,
    fallbackReason: specResult.spec.fallbackReason,
  };
};
