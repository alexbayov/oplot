import { describe, expect, it } from "vitest";
import { applyDurabilityHit, isBroken } from "../durability";
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
