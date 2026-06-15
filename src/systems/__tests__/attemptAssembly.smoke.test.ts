// M13 PR-6b-3 — Smoke harness для G4 atomic energy×parts ordering.
//
// `tryAssemble` в `WeaponAssemblyScene` зовёт `attemptAssembly`
// напрямую как единственный gate-aware путь. Эта тест-сьюта закрывает
// (c)/(d) из preflight §11 — UI-state plumbing trap'ы которые юниты
// над pure layer не ловили в 6b-2 (см. #191 P1 selection-wipe).
//
// Адаптировано из Viktor'ова `smoke_assembly.ts` шаблона для 6b-2,
// но без Phaser-stubbing — после рефактора в `attemptAssembly` всё
// pure, jsdom/spectorjs не нужны. Тот же CONTROL-инвариант
// (preflight §11): зелёный валиден только если pre-fix падает.
//
// Конкретно покрыто:
//   (c) При energy < cost: attemptAssembly возвращает `no_energy`,
//       parts/stash не тронуты. Кнопка UI disabled (см. WeaponAssemblyScene
//       renderPartSelector — code-review, не runtime тест).
//   (d) Atomic energy×parts: 4 комбинации (ok, partsBad, energyBad,
//       bothBad). Энергия списана ⟺ оружие создано.

import { describe, expect, it } from "vitest";
import { attemptAssembly } from "../assemblyFlow";
import type { ComponentItem } from "../../types";
import type { InventoryStack } from "../../state/types";

const COST = 5;
const part = (id: string): ComponentItem => ({
  kind: "component",
  id,
  name_ru: id,
  tier: 1,
  weight_kg: 0.5,
  zone_origin: "test",
  description_ru: "",
  recipe_id: null,
  fits: "weapon",
  stats: { damage_min: 1, damage_max: 2, durability_max: 5 },
});

const rng = (): number => 0.5;

const validParts: ComponentItem[] = [part("pm_frame"), part("pm_slide")];
const invalidParts: ComponentItem[] = []; // empty → AssemblyError empty_parts
const fullStash: InventoryStack[] = [
  { item_id: "pm_frame", count: 1 },
  { item_id: "pm_slide", count: 1 },
];

describe("smoke: attemptAssembly — (c) Verstak gate", () => {
  it("energy < cost → no_energy, parts/stash не тронуты", () => {
    const r = attemptAssembly(validParts, fullStash, 4, COST, rng);
    expect(r.kind).toBe("no_energy");
    if (r.kind === "no_energy") {
      expect(r.required).toBe(COST);
      expect(r.available).toBe(4);
    }
    // CONTROL — pre-fix (gate отсутствует) бы попытался collect parts.
    // Мы не можем проверить «не съели» прямо здесь (caller не вызывал
    // assemble), но семантически `no_energy` блокирует на entry.
    expect(fullStash[0]?.count).toBe(1);
  });

  it("energy === cost → разрешено (boundary inclusive)", () => {
    const r = attemptAssembly(validParts, fullStash, COST, COST, rng);
    expect(r.kind).toBe("ok");
  });

  it("energy === cost - 1 → блок (boundary exclusive)", () => {
    const r = attemptAssembly(validParts, fullStash, COST - 1, COST, rng);
    expect(r.kind).toBe("no_energy");
  });
});

describe("smoke: attemptAssembly — (d) atomic energy×parts (4 combinations)", () => {
  it("energy ok + parts ok → assembled + energy_spent=cost", () => {
    const r = attemptAssembly(validParts, fullStash, 10, COST, rng);
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.energy_spent).toBe(COST);
      expect(r.instance.parts).toEqual(["pm_frame", "pm_slide"]);
      // nextStash съел оба парта.
      expect(r.nextStash.find((s) => s.item_id === "pm_frame")).toBeUndefined();
      expect(r.nextStash.find((s) => s.item_id === "pm_slide")).toBeUndefined();
    }
  });

  it("energy ok + parts bad → invalid, БЕЗ energy_spent (energy НЕ списана)", () => {
    const r = attemptAssembly(invalidParts, fullStash, 10, COST, rng);
    expect(r.kind).toBe("invalid");
    if (r.kind === "invalid") {
      expect(r.reason).toBe("empty_parts");
    }
    // Семантика: energy_spent отсутствует на этой ветке discriminated
    // union (TypeScript guarantees). Caller буквально не может списать
    // (нет поля), что и есть инвариант «energy списана ⟺ оружие создано».
  });

  it("energy bad + parts ok → no_energy first (порядок в attemptAssembly)", () => {
    const r = attemptAssembly(validParts, fullStash, 0, COST, rng);
    expect(r.kind).toBe("no_energy");
    // Parts не валидируются — gate первый, дёшевый.
  });

  it("energy bad + parts bad → no_energy (gate срабатывает раньше валидатора)", () => {
    const r = attemptAssembly(invalidParts, fullStash, 0, COST, rng);
    expect(r.kind).toBe("no_energy");
  });

  it("stash атомарность: parts ok, missing in stash → bubbles up (defensive)", () => {
    // assembleFromStash throws plain Error на missing part (6b-2 contract).
    // attemptAssembly re-throws (не маскирует integrity-bug под invalid).
    const emptyStash: InventoryStack[] = [];
    expect(() =>
      attemptAssembly(validParts, emptyStash, 10, COST, rng),
    ).toThrow(/missing part/i);
  });

  it("CONTROL: dup parts (валидатор отбракует) → invalid duplicate_part, НЕ ok", () => {
    // Pre-fix симуляция: если бы attemptAssembly клал energy_spent ДО
    // assembleFromStash, dup parts проскользнули бы с energy списанной.
    // Текущая реализация: pre-check energy, потом assembleFromStash
    // (валидатор первой строкой) → throws → invalid.
    const dup: ComponentItem[] = [part("pm_frame"), part("pm_frame")];
    const stashTwo: InventoryStack[] = [{ item_id: "pm_frame", count: 2 }];
    const r = attemptAssembly(dup, stashTwo, 10, COST, rng);
    expect(r.kind).toBe("invalid");
    if (r.kind === "invalid") {
      expect(r.reason).toBe("duplicate_part");
    }
  });
});
