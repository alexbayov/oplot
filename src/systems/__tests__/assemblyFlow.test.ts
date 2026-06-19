import { describe, expect, it } from "vitest";
import { assembleFromStash } from "../assemblyFlow";
import { AssemblyError } from "../assemblyValidation";
import type { ComponentItem } from "../../types";
import type { InventoryStack } from "../../state/types";

const part = (
  id: string,
  contribute: { damage_min?: number; damage_max?: number; durability_max?: number } = {},
): ComponentItem => ({
  kind: "component",
  id,
  name_ru: id,
  tier: 1,
  weight_kg: 0.5,
  zone_origin: "test",
  description_ru: "",
  recipe_id: null,
  fits: "weapon",
  stats: contribute,
});

const seedRng = (seed = 0.5): (() => number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

describe("assembleFromStash — pure orchestrator", () => {
  it("consume снимает ровно по 1 каждого выбранного парта", () => {
    const stash: InventoryStack[] = [
      { item_id: "pm_frame", count: 1 },
      { item_id: "pm_slide", count: 1 },
      { item_id: "bandage", count: 3 },
    ];
    const { instance, nextStash } = assembleFromStash(
      [
        part("pm_frame", { damage_min: 2, damage_max: 5, durability_max: 10 }),
        part("pm_slide", { damage_min: 1, damage_max: 3, durability_max: 5 }),
      ],
      stash,
      seedRng(),
    );
    expect(instance.stats).toEqual({ damage_min: 3, damage_max: 8, accuracy: 0 });
    expect(instance.durability_max).toBe(15);
    expect(nextStash.find((s) => s.item_id === "pm_frame")).toBeUndefined();
    expect(nextStash.find((s) => s.item_id === "pm_slide")).toBeUndefined();
    expect(nextStash.find((s) => s.item_id === "bandage")?.count).toBe(3);
  });

  it("consume не мутирует входной стеш", () => {
    const stash: InventoryStack[] = [
      { item_id: "pm_frame", count: 2 },
      { item_id: "pm_slide", count: 1 },
    ];
    const snapshot = JSON.parse(JSON.stringify(stash));
    assembleFromStash([part("pm_frame"), part("pm_slide")], stash, seedRng());
    expect(stash).toEqual(snapshot);
  });

  it("частичная сборка из стека (count>1): остаток сохраняется", () => {
    const stash: InventoryStack[] = [{ item_id: "pm_frame", count: 3 }];
    const { nextStash } = assembleFromStash(
      [part("pm_frame", { damage_min: 1, damage_max: 2, durability_max: 5 })],
      stash,
      seedRng(),
    );
    expect(nextStash.find((s) => s.item_id === "pm_frame")?.count).toBe(2);
  });

  it("атомарность: throw на отсутствующем парте → nextStash == входной стеш (ref-equal)", () => {
    const stash: InventoryStack[] = [
      { item_id: "pm_frame", count: 1 },
      // pm_slide отсутствует — это defensive integrity case
    ];
    const snapshot = JSON.parse(JSON.stringify(stash));
    expect(() =>
      assembleFromStash(
        [part("pm_frame"), part("pm_slide")],
        stash,
        seedRng(),
      ),
    ).toThrow(/missing part/i);
    // Сам стеш не должен быть мутирован после throw.
    expect(stash).toEqual(snapshot);
  });

  it("атомарность: даже если первая часть есть, отсутствие второй НЕ съедает первую", () => {
    const stash: InventoryStack[] = [
      { item_id: "pm_frame", count: 1 },
      { item_id: "mod_pbs1", count: 0 } as InventoryStack, // count: 0 = считается отсутствующим
    ];
    const snapshot = JSON.parse(JSON.stringify(stash));
    expect(() =>
      assembleFromStash(
        [part("pm_frame"), part("mod_pbs1")],
        stash,
        seedRng(),
      ),
    ).toThrow(/missing part/i);
    expect(stash).toEqual(snapshot);
  });

  it("проброс AssemblyError из validate (пусто) — invalid input до consume", () => {
    const stash: InventoryStack[] = [{ item_id: "pm_frame", count: 1 }];
    const snapshot = JSON.parse(JSON.stringify(stash));
    expect(() => assembleFromStash([], stash, seedRng())).toThrow(AssemblyError);
    expect(stash).toEqual(snapshot);
  });
});
