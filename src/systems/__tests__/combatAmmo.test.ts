import { describe, expect, test } from "vitest";
import {
  canReloadMagazine,
  computeAmmoDisabledReason,
  computeReloadPlan,
  getAmmoCostForShot,
  getReserveAmmoCount,
  getWeaponAmmoSpec,
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
    expect(computeAmmoDisabledReason({ weapon: rangedWeapon(), backpack: backpack(4, "ammo_other"), currentMagazine: 0 })).toBe(
      "no_reserve_ammo",
    );
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
});
