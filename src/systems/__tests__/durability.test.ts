import { describe, expect, it } from "vitest";
import { applyDurabilityHit, applyPerEncounterDurabilityHit, isBroken } from "../durability";
import { HERO_START_WEAPON_ID } from "../../state/balance";
import type { EquippedWeapon } from "../../state/types";
import type { WeaponInstance } from "../weaponAssembly";

const make = (currentDur: number, maxDur = 10): WeaponInstance => ({
  id: "wi_test",
  name_ru: "Тест",
  slot: "action",
  stats: { damage_min: 1, damage_max: 2 },
  durability_max: maxDur,
  durability_current: currentDur,
  parts: [],
});

describe("applyDurabilityHit — per-encounter decrement", () => {
  it("дефолт -1 за вызов", () => {
    const w = make(5);
    const after = applyDurabilityHit(w);
    expect(after.durability_current).toBe(4);
  });

  it("кастомный delta", () => {
    const w = make(10);
    const after = applyDurabilityHit(w, 3);
    expect(after.durability_current).toBe(7);
  });

  it("immutable — исходный инстанс не мутирован", () => {
    const w = make(5);
    applyDurabilityHit(w);
    expect(w.durability_current).toBe(5);
  });

  it("floor: не уходит ниже 0", () => {
    const w = make(1);
    const after = applyDurabilityHit(w, 10);
    expect(after.durability_current).toBe(0);
  });

  it("durability_max не меняется при decrement-е", () => {
    const w = make(5, 20);
    const after = applyDurabilityHit(w);
    expect(after.durability_max).toBe(20);
  });

  it("остальные поля инстанса сохраняются", () => {
    const w: WeaponInstance = {
      id: "wi_keep",
      name_ru: "Сохрани меня",
      slot: "action",
      stats: { damage_min: 3, damage_max: 7 },
      durability_max: 50,
      durability_current: 25,
      parts: ["a", "b"],
    };
    const after = applyDurabilityHit(w, 5);
    expect(after.id).toBe(w.id);
    expect(after.name_ru).toBe(w.name_ru);
    expect(after.slot).toBe(w.slot);
    expect(after.stats).toEqual(w.stats);
    expect(after.parts).toEqual(w.parts);
  });
});

describe("isBroken", () => {
  it("оружие с durability_current > 0 не сломано", () => {
    expect(isBroken(make(1))).toBe(false);
    expect(isBroken(make(100))).toBe(false);
  });

  it("durability_current = 0 → сломано", () => {
    expect(isBroken(make(0))).toBe(true);
  });

  it("полный декремент → breakage", () => {
    // Композиция: применяем hit-ы пока не сломается. Проверяет интеграцию
    // applyDurabilityHit + isBroken в одном flow (тот flow что вызовет
    // sortieResolve после энкаунтера).
    let w = make(3);
    expect(isBroken(w)).toBe(false);
    w = applyDurabilityHit(w);
    w = applyDurabilityHit(w);
    expect(isBroken(w)).toBe(false);
    w = applyDurabilityHit(w);
    expect(isBroken(w)).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────
// M13 PR-6b-1: applyPerEncounterDurabilityHit (caller — SortieRunScene
// после won-энкаунтера). Тесты через фикстуры, без Phaser.
// ───────────────────────────────────────────────────────────────────
describe("applyPerEncounterDurabilityHit", () => {
  const inst = (id: string, currentDur: number, maxDur = 5): WeaponInstance => ({
    id,
    name_ru: `сборка ${id}`,
    slot: "action",
    stats: { damage_min: 2, damage_max: 5 },
    durability_max: maxDur,
    durability_current: currentDur,
    parts: ["pm_frame", "pm_barrel"],
  });

  it("crafted+won → durability_current уменьшается на дефолт 1", () => {
    const wi = inst("wi_a", 5);
    const eq: EquippedWeapon = { kind: "crafted", id: "wi_a" };
    const out = applyPerEncounterDurabilityHit(eq, [wi]);
    expect(out.broken).toBe(false);
    expect(out.equipped_weapon).toEqual(eq);
    expect(out.crafted_weapons[0]?.durability_current).toBe(4);
    // immutable вход
    expect(wi.durability_current).toBe(5);
  });

  it("catalog+won → no-op (durability-exempt)", () => {
    // 32 каталожных оружия не имеют durability — bullet точно
    // не должен упасть и не должен ничего поменять.
    const eq: EquippedWeapon = { kind: "catalog", id: HERO_START_WEAPON_ID };
    const wi = inst("wi_b", 3);
    const out = applyPerEncounterDurabilityHit(eq, [wi]);
    expect(out.broken).toBe(false);
    expect(out.equipped_weapon).toEqual(eq);
    expect(out.crafted_weapons[0]?.durability_current).toBe(3);
  });

  it("null эквип → no-op", () => {
    // Намеренно пустой слот после поломки — нечего бить, не падаем.
    const out = applyPerEncounterDurabilityHit(null, []);
    expect(out.broken).toBe(false);
    expect(out.equipped_weapon).toBeNull();
    expect(out.crafted_weapons).toEqual([]);
  });

  it("durability_current → 0 → breakage: unequip в craft_knife, инстанс остаётся", () => {
    // Repair-долг C6: сломанный инстанс остаётся в crafted_weapons,
    // его можно будет починить в craft UI. Equip падает в стартовый
    // catalog craft_knife (тот же дефолт что у createDefaultPlayer).
    const wi = inst("wi_c", 1);
    const eq: EquippedWeapon = { kind: "crafted", id: "wi_c" };
    const out = applyPerEncounterDurabilityHit(eq, [wi]);
    expect(out.broken).toBe(true);
    expect(out.equipped_weapon).toEqual({ kind: "catalog", id: HERO_START_WEAPON_ID });
    expect(out.crafted_weapons).toHaveLength(1);
    expect(out.crafted_weapons[0]?.id).toBe("wi_c");
    expect(out.crafted_weapons[0]?.durability_current).toBe(0);
  });

  it("crafted эквип, но инстанс не найден в массиве → no-op (рассинхрон не валит)", () => {
    // Теоретически невозможно при invariants, но если случится —
    // тихо no-op, не throw. Drift-guard через invariant-check
    // отдельно (см. assembler/craft tests).
    const eq: EquippedWeapon = { kind: "crafted", id: "wi_ghost" };
    const out = applyPerEncounterDurabilityHit(eq, []);
    expect(out.broken).toBe(false);
    expect(out.equipped_weapon).toEqual(eq);
    expect(out.crafted_weapons).toEqual([]);
  });
});
