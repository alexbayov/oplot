import { describe, expect, test } from "vitest";
import {
  canReloadMagazine,
  computeAmmoDisabledReason,
  computeReloadPlan,
  getAmmoCostForShot,
  getReserveAmmoCount,
  getWeaponAmmoSpec,
  normalizeCaliberAmmoId,
  type AmmoStackLike,
  type AmmoWeaponLike,
} from "../combatAmmo";

const rangedWeapon = (overrides: Partial<AmmoWeaponLike> = {}): AmmoWeaponLike => ({
  id: "test_pistol",
  type: "weapon_ranged",
  stats: {
    ammo_id: "ammo_9x18",
    ammo_per_shot: 1,
    magazine_size: 8,
  },
  ...overrides,
});

const backpack = (count: number, ammoId = "ammo_9x18"): AmmoStackLike[] => [{ item_id: ammoId, count }];

describe("combatAmmo", () => {
  test("computes a full reload when reserve ammo is enough", () => {
    const plan = computeReloadPlan({ weapon: rangedWeapon(), backpack: backpack(12), currentMagazine: 3 });

    expect(plan).toEqual({
      ok: true,
      ammoId: "ammo_9x18",
      ammoPerShot: 1,
      reloadAmount: 5,
      reserveAmmoConsumed: 5,
      reserveBefore: 12,
      resultingMagazine: 8,
      magazineCapacity: 8,
      fallbackReason: null,
    });
    expect(canReloadMagazine({ weapon: rangedWeapon(), backpack: backpack(12), currentMagazine: 3 })).toBe(true);
  });

  test("computes a partial reload when reserve ammo is insufficient", () => {
    const plan = computeReloadPlan({ weapon: rangedWeapon(), backpack: backpack(3), currentMagazine: 0 });

    expect(plan).toMatchObject({
      ok: true,
      reloadAmount: 3,
      reserveAmmoConsumed: 3,
      reserveBefore: 3,
      resultingMagazine: 3,
      magazineCapacity: 8,
    });
  });

  test("computes reload for M11-shaped ranged weapon metadata without legacy type", () => {
    const weapon: AmmoWeaponLike = {
      id: "m11_drop_pistol",
      itemClass: "drop",
      weaponKind: "ranged",
      caliber: "9x18",
      magazineSize: 8,
    };

    const plan = computeReloadPlan({ weapon, backpack: backpack(8, "ammo_9x18"), currentMagazine: 2 });

    expect(plan).toMatchObject({
      ok: true,
      ammoId: "ammo_9x18",
      reloadAmount: 6,
      reserveAmmoConsumed: 6,
      resultingMagazine: 8,
      magazineCapacity: 8,
      fallbackReason: "unsupported_weapon_metadata",
    });
  });

  test("prefers explicit ammo id over caliber metadata", () => {
    const weapon: AmmoWeaponLike = {
      type: "weapon_ranged",
      ammo_id: "ammo_custom",
      caliber: "9x18",
      magazineSize: 4,
    };

    expect(getWeaponAmmoSpec(weapon)).toMatchObject({
      ok: true,
      spec: { ammoId: "ammo_custom" },
    });
    expect(computeReloadPlan({ weapon, backpack: backpack(5, "ammo_custom"), currentMagazine: 0 })).toMatchObject({
      ok: true,
      ammoId: "ammo_custom",
      reloadAmount: 4,
    });
  });

  test("normalizes known caliber strings into backpack ammo ids conservatively", () => {
    expect(normalizeCaliberAmmoId("9x18")).toBe("ammo_9x18");
    expect(normalizeCaliberAmmoId("12g")).toBe("ammo_12g");
    expect(normalizeCaliberAmmoId("12ga")).toBe("ammo_12ga");
    expect(normalizeCaliberAmmoId(" 12GA ")).toBe("ammo_12ga");
    expect(normalizeCaliberAmmoId("7.62x25")).toBe("ammo_762x25");
    expect(normalizeCaliberAmmoId("7.62X25")).toBe("ammo_762x25");
    expect(normalizeCaliberAmmoId("7.62x39")).toBe("ammo_762x39");
    expect(normalizeCaliberAmmoId("5.45x39")).toBe("ammo_545");
    expect(normalizeCaliberAmmoId("7.62x54R")).toBe("ammo_762x54r");
    expect(normalizeCaliberAmmoId(".308")).toBe("ammo_308");
    expect(normalizeCaliberAmmoId(" 7.62x54r ")).toBe("ammo_762x54r");
    expect(normalizeCaliberAmmoId("ammo_9x18")).toBe("ammo_9x18");
    expect(normalizeCaliberAmmoId("AMMO_762X39")).toBe("ammo_762x39");
    expect(normalizeCaliberAmmoId("unknown_caliber")).toBeNull();
  });

  test("computes reload for M11-shaped mapped caliber without naive ammo id fallback", () => {
    const weapon: AmmoWeaponLike = {
      id: "m11_drop_rifle",
      itemClass: "drop",
      weaponKind: "ranged",
      caliber: "7.62x39",
      magazineSize: 30,
    };

    expect(computeReloadPlan({ weapon, backpack: backpack(20, "ammo_762x39"), currentMagazine: 10 })).toMatchObject({
      ok: true,
      ammoId: "ammo_762x39",
      reloadAmount: 20,
      reserveAmmoConsumed: 20,
      resultingMagazine: 30,
      magazineCapacity: 30,
    });
  });


  test("computes reload for M11-shaped shotgun caliber", () => {
    const weapon: AmmoWeaponLike = {
      id: "m11_drop_shotgun",
      itemClass: "drop",
      weaponKind: "ranged",
      caliber: "12ga",
      magazineSize: 5,
    };

    expect(computeReloadPlan({ weapon, backpack: backpack(4, "ammo_12ga"), currentMagazine: 1 })).toMatchObject({
      ok: true,
      ammoId: "ammo_12ga",
      reloadAmount: 4,
      reserveAmmoConsumed: 4,
      resultingMagazine: 5,
      magazineCapacity: 5,
    });
  });

  test("computes reload for M11-shaped 7.62x25 sidearm caliber", () => {
    const weapon: AmmoWeaponLike = {
      id: "m11_drop_sidearm",
      itemClass: "drop",
      weaponKind: "ranged",
      caliber: "7.62x25",
      magazineSize: 8,
    };

    expect(computeReloadPlan({ weapon, backpack: backpack(6, "ammo_762x25"), currentMagazine: 2 })).toMatchObject({
      ok: true,
      ammoId: "ammo_762x25",
      reloadAmount: 6,
      reserveAmmoConsumed: 6,
      resultingMagazine: 8,
      magazineCapacity: 8,
    });
  });

  test("unknown M11 caliber returns no ammo id instead of false no-reserve result", () => {
    const weapon: AmmoWeaponLike = {
      itemClass: "drop",
      weaponKind: "ranged",
      caliber: "4.6x30",
      magazineSize: 20,
    };

    expect(getWeaponAmmoSpec(weapon)).toEqual({ ok: false, reason: "no_ammo_id" });
    expect(computeAmmoDisabledReason({ weapon, backpack: backpack(20, "ammo_4.6x30"), currentMagazine: 0 })).toBe(
      "no_ammo_id",
    );
  });

  test("blank caliber metadata still reports missing ammo id for ranged-like weapons", () => {
    const weapon: AmmoWeaponLike = {
      itemClass: "drop",
      weaponKind: "ranged",
      caliber: "   ",
      magazineSize: 8,
    };

    expect(getWeaponAmmoSpec(weapon)).toEqual({ ok: false, reason: "no_ammo_id" });
    expect(computeAmmoDisabledReason({ weapon, backpack: backpack(8), currentMagazine: 0 })).toBe("no_ammo_id");
  });

  test("non-ranged items without ammo metadata are not reload-capable", () => {
    const item: AmmoWeaponLike = { id: "scrap", type: "material", magazineSize: 8 };

    expect(getWeaponAmmoSpec(item)).toEqual({ ok: false, reason: "not_ranged_weapon" });
    expect(computeAmmoDisabledReason({ weapon: item, backpack: backpack(8), currentMagazine: 0 })).toBe(
      "not_ranged_weapon",
    );
  });

  test("disables reload when magazine is already full", () => {
    expect(computeAmmoDisabledReason({ weapon: rangedWeapon(), backpack: backpack(12), currentMagazine: 8 })).toBe(
      "magazine_full",
    );
    expect(computeReloadPlan({ weapon: rangedWeapon(), backpack: backpack(12), currentMagazine: 8 })).toMatchObject({
      ok: false,
      disabledReason: "magazine_full",
      resultingMagazine: 8,
    });
  });

  test("disables reload when reserve ammo is missing", () => {
    expect(computeAmmoDisabledReason({ weapon: rangedWeapon(), backpack: backpack(0), currentMagazine: 0 })).toBe(
      "no_reserve_ammo",
    );
    expect(
      computeAmmoDisabledReason({ weapon: rangedWeapon(), backpack: backpack(4, "ammo_other"), currentMagazine: 0 }),
    ).toBe("no_reserve_ammo");
  });

  test("disables reload when ranged weapon metadata has no ammo id", () => {
    const weapon = rangedWeapon({ stats: { ammo_per_shot: 1, magazine_size: 8 } });

    expect(getWeaponAmmoSpec(weapon)).toEqual({ ok: false, reason: "no_ammo_id" });
    expect(computeAmmoDisabledReason({ weapon, backpack: backpack(8), currentMagazine: 0 })).toBe("no_ammo_id");
  });

  test("disables reload when magazine capacity is invalid", () => {
    const weapon = rangedWeapon({ stats: { ammo_id: "ammo_9x18", ammo_per_shot: 1, magazine_size: 0 } });

    expect(computeAmmoDisabledReason({ weapon, backpack: backpack(8), currentMagazine: 0 })).toBe("invalid_capacity");
    expect(computeReloadPlan({ weapon, backpack: backpack(8), currentMagazine: 0 })).toMatchObject({
      ok: false,
      disabledReason: "invalid_capacity",
    });
  });

  test("disables reload for melee or missing weapons", () => {
    const melee: AmmoWeaponLike = { id: "knife", type: "weapon_melee" };

    expect(computeAmmoDisabledReason({ weapon: melee, backpack: backpack(8), currentMagazine: 0 })).toBe(
      "not_ranged_weapon",
    );
    expect(computeAmmoDisabledReason({ weapon: null, backpack: backpack(8), currentMagazine: 0 })).toBe(
      "not_ranged_weapon",
    );
  });

  test("does not mutate weapon or backpack input while planning reload", () => {
    const weapon = rangedWeapon();
    const reserve = backpack(12);
    const weaponBefore = structuredClone(weapon);
    const reserveBefore = structuredClone(reserve);

    computeReloadPlan({ weapon, backpack: reserve, currentMagazine: 2 });

    expect(weapon).toEqual(weaponBefore);
    expect(reserve).toEqual(reserveBefore);
  });

  test("reads reserve ammo only from matching positive stacks", () => {
    expect(
      getReserveAmmoCount(
        [
          { item_id: "ammo_9x18", count: 3 },
          { item_id: "ammo_other", count: 99 },
          { item_id: "ammo_9x18", count: -5 },
          { item_id: "ammo_9x18", count: 2.9 },
        ],
        "ammo_9x18",
      ),
    ).toBe(5);
  });

  test("shot ammo cost handles ammo_per_shot safely", () => {
    expect(getAmmoCostForShot(rangedWeapon({ stats: { ammo_id: "ammo_9x18", ammo_per_shot: 2, magazine_size: 8 } }))).toBe(2);
    expect(getAmmoCostForShot(rangedWeapon({ stats: { ammo_id: "ammo_9x18", magazine_size: 8 } }))).toBe(1);
    expect(getAmmoCostForShot(rangedWeapon({ stats: { ammo_id: "ammo_9x18", ammo_per_shot: 0, magazine_size: 8 } }))).toBe(1);
  });

  test("missing ammo_per_shot uses safe one-shot fallback and marks metadata fallback", () => {
    const spec = getWeaponAmmoSpec(rangedWeapon({ stats: { ammo_id: "ammo_9x18", magazine_size: 8 } }));

    expect(spec).toEqual({
      ok: true,
      spec: {
        ammoId: "ammo_9x18",
        ammoPerShot: 1,
        magazineCapacity: 8,
        fallbackReason: "unsupported_weapon_metadata",
      },
    });
  });

  test("legacy ranged PM-like weapon with no magazine_size can compute reload with fallback capacity 8", () => {
    const weapon: AmmoWeaponLike = {
      type: "weapon_ranged",
      ammo_id: "ammo_9x18",
      stats: { ammo_per_shot: 1 },
    };

    const plan = computeReloadPlan({ weapon, backpack: backpack(10, "ammo_9x18"), currentMagazine: 2 });
    expect(plan).toMatchObject({
      ok: true,
      ammoId: "ammo_9x18",
      reloadAmount: 6,
      resultingMagazine: 8,
      magazineCapacity: 8,
      fallbackReason: "unsupported_weapon_metadata",
    });
  });

  test("legacy ranged AKM-like weapon with no magazine_size can compute reload with fallback capacity 30", () => {
    const weapon: AmmoWeaponLike = {
      type: "weapon_ranged",
      caliber: "7.62x39",
    };

    const plan = computeReloadPlan({ weapon, backpack: backpack(40, "ammo_762x39"), currentMagazine: 5 });
    expect(plan).toMatchObject({
      ok: true,
      ammoId: "ammo_762x39",
      reloadAmount: 25,
      resultingMagazine: 30,
      magazineCapacity: 30,
      fallbackReason: "unsupported_weapon_metadata",
    });
  });

  test("explicit magazineSize wins over fallback capacity", () => {
    const weaponWithAmmoPerShot: AmmoWeaponLike = {
      type: "weapon_ranged",
      ammo_id: "ammo_9x18",
      magazineSize: 12,
      ammo_per_shot: 1,
    };
    expect(getWeaponAmmoSpec(weaponWithAmmoPerShot)).toMatchObject({
      ok: true,
      spec: {
        magazineCapacity: 12,
        fallbackReason: null,
      },
    });
  });

  test("unknown ranged caliber with no capacity returns no_ammo_id or invalid_capacity", () => {
    const weaponUnknownCaliber: AmmoWeaponLike = {
      type: "weapon_ranged",
      caliber: "unknown_caliber_999",
    };
    expect(getWeaponAmmoSpec(weaponUnknownCaliber)).toEqual({ ok: false, reason: "no_ammo_id" });

    const weaponNoCapacity: AmmoWeaponLike = {
      type: "weapon_ranged",
      ammo_id: "ammo_unknown_without_fallback",
      ammo_per_shot: 1,
    };
    const spec = getWeaponAmmoSpec(weaponNoCapacity);
    expect(spec).toMatchObject({
      ok: true,
      spec: {
        magazineCapacity: null,
      },
    });
    expect(computeAmmoDisabledReason({ weapon: weaponNoCapacity, backpack: backpack(10, "ammo_unknown_without_fallback"), currentMagazine: 0 })).toBe("invalid_capacity");
  });

  test("item with itemClass: drop, caliber: 9x18, magazineSize: 8 but no ranged signal returns not_ranged_weapon", () => {
    const weapon: AmmoWeaponLike = {
      id: "no_ranged_signal_item",
      itemClass: "drop",
      caliber: "9x18",
      magazineSize: 8,
    };
    expect(getWeaponAmmoSpec(weapon)).toEqual({ ok: false, reason: "not_ranged_weapon" });
  });

  test("cleaver-like item with melee signal + caliber/magazine metadata returns not_ranged_weapon", () => {
    const weapon: AmmoWeaponLike = {
      id: "cleaver",
      type: "weapon_melee",
      caliber: "melee",
      magazineSize: 1,
    };
    expect(getWeaponAmmoSpec(weapon)).toEqual({ ok: false, reason: "not_ranged_weapon" });
  });

  test("if both melee and ranged-ish metadata exist, melee/non-ranged explicit signal wins and returns not_ranged_weapon", () => {
    const weapon: AmmoWeaponLike = {
      id: "conflicting_item",
      type: "weapon_melee",
      weaponKind: "ranged",
      caliber: "9x18",
      magazineSize: 8,
    };
    expect(getWeaponAmmoSpec(weapon)).toEqual({ ok: false, reason: "not_ranged_weapon" });
  });

  test("explicit magazineSize wins over weapon-specific fallback", () => {
    const weapon: AmmoWeaponLike = {
      id: "aps",
      type: "weapon_ranged",
      magazineSize: 12,
      ammo_id: "ammo_9x18",
      ammo_per_shot: 1,
    };
    expect(getWeaponAmmoSpec(weapon)).toMatchObject({
      ok: true,
      spec: {
        magazineCapacity: 12,
        fallbackReason: null,
      },
    });
  });

  test("aps with no magazine_size resolves capacity 20, not ammo_9x18 fallback 8", () => {
    const weapon: AmmoWeaponLike = {
      id: "aps",
      type: "weapon_ranged",
      ammo_id: "ammo_9x18",
    };
    expect(getWeaponAmmoSpec(weapon)).toMatchObject({
      ok: true,
      spec: {
        magazineCapacity: 20,
        fallbackReason: "unsupported_weapon_metadata",
      },
    });
  });

  test("ppsh with no magazine_size resolves capacity 35, not ammo_762x25 fallback 8", () => {
    const weapon: AmmoWeaponLike = {
      id: "ppsh",
      type: "weapon_ranged",
      ammo_id: "ammo_762x25",
    };
    expect(getWeaponAmmoSpec(weapon)).toMatchObject({
      ok: true,
      spec: {
        magazineCapacity: 35,
        fallbackReason: "unsupported_weapon_metadata",
      },
    });
  });

  test("sks with no magazine_size resolves capacity 10, not ammo_762x39 fallback 30", () => {
    const weapon: AmmoWeaponLike = {
      id: "sks",
      type: "weapon_ranged",
      ammo_id: "ammo_762x39",
    };
    expect(getWeaponAmmoSpec(weapon)).toMatchObject({
      ok: true,
      spec: {
        magazineCapacity: 10,
        fallbackReason: "unsupported_weapon_metadata",
      },
    });
  });

  test("saiga_12 with no magazine_size resolves capacity 8, not ammo_12ga fallback 5", () => {
    const weapon: AmmoWeaponLike = {
      id: "saiga_12",
      type: "weapon_ranged",
      ammo_id: "ammo_12ga",
    };
    expect(getWeaponAmmoSpec(weapon)).toMatchObject({
      ok: true,
      spec: {
        magazineCapacity: 8,
        fallbackReason: "unsupported_weapon_metadata",
      },
    });
  });

  test("unknown weapon id with known ammo still uses ammo fallback", () => {
    const weapon: AmmoWeaponLike = {
      id: "unknown_weapon_999",
      type: "weapon_ranged",
      ammo_id: "ammo_9x18",
    };
    expect(getWeaponAmmoSpec(weapon)).toMatchObject({
      ok: true,
      spec: {
        magazineCapacity: 8,
        fallbackReason: "unsupported_weapon_metadata",
      },
    });
  });

  test("unknown weapon id with unknown ammo/caliber returns invalid_capacity or no_ammo_id according to current logic", () => {
    const weaponNoAmmo: AmmoWeaponLike = {
      id: "unknown_weapon_999",
      type: "weapon_ranged",
    };
    expect(getWeaponAmmoSpec(weaponNoAmmo)).toEqual({ ok: false, reason: "no_ammo_id" });

    const weaponUnknownAmmo: AmmoWeaponLike = {
      id: "unknown_weapon_999",
      type: "weapon_ranged",
      ammo_id: "ammo_unknown",
    };
    const spec = getWeaponAmmoSpec(weaponUnknownAmmo);
    expect(spec).toMatchObject({
      ok: true,
      spec: {
        magazineCapacity: null,
      },
    });
    expect(computeAmmoDisabledReason({ weapon: weaponUnknownAmmo, backpack: backpack(10, "ammo_unknown"), currentMagazine: 0 })).toBe("invalid_capacity");
  });

  test("supports alternative weapon ID fields", () => {
    const weaponItemId: AmmoWeaponLike = {
      item_id: "aps",
      type: "weapon_ranged",
      ammo_id: "ammo_9x18",
    };
    expect(getWeaponAmmoSpec(weaponItemId)).toMatchObject({
      ok: true,
      spec: { magazineCapacity: 20 },
    });

    const weaponBaseId: AmmoWeaponLike = {
      baseId: "SKS", // test case insensitivity/normalization
      type: "weapon_ranged",
      ammo_id: "ammo_762x39",
    };
    expect(getWeaponAmmoSpec(weaponBaseId)).toMatchObject({
      ok: true,
      spec: { magazineCapacity: 10 },
    });
  });
});

