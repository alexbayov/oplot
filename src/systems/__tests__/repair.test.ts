import { describe, expect, it } from "vitest";
import { attemptRepair, repairCost } from "../repair";
import {
  METAL_PER_DURABILITY_POINT,
  REPAIR_MAX_DECAY,
} from "../../state/balance";
import type { WeaponInstance } from "../weaponAssembly";

const make = (currentDur: number, maxDur = 10): WeaponInstance => ({
  id: "wi_test",
  name_ru: "Тест",
  slot: "action",
  stats: { damage_min: 1, damage_max: 2, accuracy: 0 },
  weight_kg: 0,
  durability_max: maxDur,
  durability_current: currentDur,
  parts: [],
  affixes: [],
});

describe("repairCost — пропорционально пробою", () => {
  it("полностью сломанное (0/10) = 10 × rate", () => {
    expect(repairCost(make(0, 10))).toBe(10 * METAL_PER_DURABILITY_POINT);
  });

  it("лёгкий износ (8/10) = 2 × rate", () => {
    expect(repairCost(make(8, 10))).toBe(2 * METAL_PER_DURABILITY_POINT);
  });

  it("целое (10/10) = 0", () => {
    expect(repairCost(make(10, 10))).toBe(0);
  });

  it("монотонно: больше пробой → дороже", () => {
    expect(repairCost(make(2, 10))).toBeGreaterThan(repairCost(make(7, 10)));
  });
});

describe("attemptRepair — ветки gate'а", () => {
  it("not_found когда инстанс undefined", () => {
    expect(attemptRepair(undefined, 999).kind).toBe("not_found");
  });

  it("already_full когда current >= max", () => {
    expect(attemptRepair(make(10, 10), 999).kind).toBe("already_full");
  });

  it("no_resource когда металла меньше стоимости — металл не упомянут как потраченный", () => {
    const r = attemptRepair(make(0, 10), 3);
    expect(r.kind).toBe("no_resource");
    if (r.kind === "no_resource") {
      expect(r.required).toBe(repairCost(make(0, 10)));
      expect(r.available).toBe(3);
    }
  });

  it("ok при достатке: восстановление до (просевшего) max", () => {
    const before = make(0, 10);
    const r = attemptRepair(before, 999);
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      const expectedMax = 10 - REPAIR_MAX_DECAY;
      expect(r.instance.durability_max).toBe(expectedMax);
      expect(r.instance.durability_current).toBe(expectedMax);
      expect(r.metal_spent).toBe(repairCost(before)); // по СТАРОМУ пробою
    }
  });

  it("atomic: only ok несёт metal_spent (не-ok ветки поля metal_spent не имеют)", () => {
    const noRes = attemptRepair(make(0, 10), 0);
    expect("metal_spent" in noRes).toBe(false);
    const full = attemptRepair(make(10, 10), 999);
    expect("metal_spent" in full).toBe(false);
  });

  it("immutable: входной инстанс не мутирован", () => {
    const before = make(0, 10);
    const snapshot = { ...before };
    attemptRepair(before, 999);
    expect(before).toEqual(snapshot);
  });

  it("round-trip: после ok оружие больше не isBroken-able (current > 0)", () => {
    const r = attemptRepair(make(0, 10), 999);
    if (r.kind === "ok") {
      expect(r.instance.durability_current).toBeGreaterThan(0);
    }
  });
});

describe("attemptRepair — lifecycle decay (DF1b)", () => {
  it("decay снижает durability_max ровно на REPAIR_MAX_DECAY", () => {
    const r = attemptRepair(make(0, 10), 999);
    if (r.kind === "ok") {
      expect(r.instance.durability_max).toBe(10 - REPAIR_MAX_DECAY);
    }
  });

  it("конечный horizon: max упирается в пол → beyond_repair", () => {
    // durability_max <= REPAIR_MAX_DECAY ⇒ decay уничтожил бы потолок.
    // При REPAIR_MAX_DECAY=1 это max=1 (сломанное, current=0).
    const terminal = make(0, REPAIR_MAX_DECAY);
    const r = attemptRepair(terminal, 999);
    // decay=0 отключает horizon (max=0 уже degenerate); при decay>=1 — beyond_repair.
    if (REPAIR_MAX_DECAY >= 1) {
      expect(r.kind).toBe("beyond_repair");
    }
  });

  it("повторные ремонты монотонно роняют потолок к терминалу", () => {
    if (REPAIR_MAX_DECAY < 1) return; // decay=0 — horizon выключен
    let inst = make(2, 10);
    let prevMax = inst.durability_max;
    for (let i = 0; i < 20; i += 1) {
      const r = attemptRepair(inst, 9999);
      if (r.kind === "beyond_repair") break;
      expect(r.kind).toBe("ok");
      if (r.kind !== "ok") break;
      expect(r.instance.durability_max).toBeLessThan(prevMax);
      prevMax = r.instance.durability_max;
      // снова «ломаем» для следующей итерации (пробой = 1 очко).
      inst = { ...r.instance, durability_current: r.instance.durability_max - 1 };
    }
    // Дошли до терминального состояния, а не крутились вечно.
    expect(prevMax).toBeLessThanOrEqual(REPAIR_MAX_DECAY);
  });
});
