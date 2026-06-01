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
  readonly itemClass?: unknown;
  readonly type?: unknown;
  readonly ammo_id?: unknown;
  readonly ammo_per_shot?: unknown;
  readonly magazine_size?: unknown;
  readonly magazineSize?: unknown;
  readonly magazineCapacity?: unknown;
  readonly caliber?: unknown;
  readonly stats?: AmmoWeaponStatsLike;
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

const hasStringField = (value: unknown): boolean => typeof value === "string";

export const normalizeCaliberAmmoId = (caliber: unknown): string | null => {
  const value = readString(caliber);
  if (!value) return null;
  return value.startsWith("ammo_") ? value : `ammo_${value}`;
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

export const getWeaponAmmoSpec = (weapon: AmmoWeaponLike | null | undefined): WeaponAmmoSpecResult => {
  if (!weapon) {
    return { ok: false, reason: "not_ranged_weapon" };
  }

  const magazineCapacity = readMagazineCapacity(weapon);
  const hasAmmoField = hasStringField(weapon.ammo_id) || hasStringField(weapon.stats?.ammo_id);
  const hasCaliberField = hasStringField(weapon.caliber) || hasStringField(weapon.stats?.caliber);
  const hasLegacyRangedType = weapon.type === "weapon_ranged";
  const hasRangedPlanningMetadata = magazineCapacity !== null && (hasAmmoField || hasCaliberField);

  if (!hasLegacyRangedType && !hasRangedPlanningMetadata) {
    return { ok: false, reason: "not_ranged_weapon" };
  }

  const explicitAmmoId = readString(weapon.ammo_id) ?? readString(weapon.stats?.ammo_id);
  const ammoId =
    explicitAmmoId ?? normalizeCaliberAmmoId(weapon.caliber) ?? normalizeCaliberAmmoId(weapon.stats?.caliber);
  if (!ammoId) {
    return { ok: false, reason: "no_ammo_id" };
  }

  const rawAmmoPerShot = readPositiveAmmoCost(weapon.ammo_per_shot) ?? readPositiveAmmoCost(weapon.stats?.ammo_per_shot);
  const ammoPerShot = rawAmmoPerShot ?? 1;
  const fallbackReason: AmmoDisabledReason | null = rawAmmoPerShot ? null : "unsupported_weapon_metadata";

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
