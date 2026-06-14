/**
 * M13 PR-6a — audit-тест на наполнение component.stats (contribute_*).
 *
 * Заземляет 4 invariants из OP1 spec
 * (docs/redesign/M13-OP1-PART-CONTRIBUTIONS.md):
 *
 *   1. In-band exact. Для каждого из 15 семейств:
 *      sum(parts.damage_min) === catalog.damage_min
 *      sum(parts.damage_max) === catalog.damage_max
 *      sum(parts.durability_max) === dura_target
 *   2. Floor invariant. Любая full-build + suppressor →
 *      assembleWeapon().stats.damage_min >= 0.
 *   3. Sanity. Каждый full-build damage_min >= 1.
 *   4. Coverage. Все 68 components имеют stats; каждый из 60 non-mod
 *      партов принадлежит ровно одному family-map.
 *
 * Source of truth для чисел вкладов: docs/redesign/M13-OP1-part-contributions.json
 * (формат `{id: {damage_min?, damage_max?, durability_max?}}`). Populate-
 * скрипт `tools/migrations/populate_part_contributions.mjs` мерджит её
 * в content/items.json. Этот тест читает обе таблицы и держит их в
 * синхроне (любое расхождение → красный тест).
 */

import { describe, expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { assembleWeapon } from "../../systems/weaponAssembly";
import type { M13Item } from "../../systems/itemSchema";

const loadItems = (): M13Item[] => {
  const file = path.resolve(__dirname, "../../../content/items.json");
  return JSON.parse(fs.readFileSync(file, "utf-8")) as M13Item[];
};

const loadContributions = (): Record<
  string,
  { damage_min?: number; damage_max?: number; durability_max?: number }
> => {
  const file = path.resolve(
    __dirname,
    "../../../docs/redesign/M13-OP1-part-contributions.json",
  );
  return JSON.parse(fs.readFileSync(file, "utf-8"));
};

/**
 * Family-map: каталожное оружие → массив парт-id-ов, плюс ожидаемый
 * durability target. Источник — таблица в M13-OP1-PART-CONTRIBUTIONS.md.
 * Каталог.damage_min/max и dura подтянутся ниже из реальных данных.
 */
interface FamilyDef {
  catalogId: string;
  partIds: readonly string[];
  durabilityTarget: number;
}

const FAMILIES: readonly FamilyDef[] = [
  { catalogId: "pm", partIds: ["pm_slide", "pm_frame", "pm_magazine"], durabilityTarget: 45 },
  { catalogId: "tt", partIds: ["tt_slide", "tt_frame", "tt_magazine"], durabilityTarget: 45 },
  { catalogId: "aps", partIds: ["aps_slide", "aps_frame", "aps_magazine", "aps_stock"], durabilityTarget: 55 },
  { catalogId: "akm", partIds: ["akm_barrel", "akm_receiver", "akm_bolt", "akm_magazine"], durabilityTarget: 60 },
  { catalogId: "aks_74u", partIds: ["aks74u_barrel", "aks74u_receiver", "aks74u_bolt", "aks74u_magazine"], durabilityTarget: 55 },
  { catalogId: "bekas", partIds: ["bekas_barrel", "bekas_receiver", "bekas_pump", "bekas_stock"], durabilityTarget: 65 },
  { catalogId: "rifle_t3_hunting", partIds: ["hunting_barrel", "hunting_receiver", "hunting_bolt", "hunting_scope"], durabilityTarget: 70 },
  { catalogId: "iz_43", partIds: ["izh43_barrels", "izh43_receiver", "izh43_stock"], durabilityTarget: 65 },
  { catalogId: "mosin", partIds: ["mosin_barrel", "mosin_receiver", "mosin_bolt", "mosin_stock"], durabilityTarget: 70 },
  { catalogId: "ppsh", partIds: ["ppsh_barrel", "ppsh_receiver", "ppsh_drum", "ppsh_stock"], durabilityTarget: 55 },
  { catalogId: "sks", partIds: ["sks_barrel", "sks_receiver", "sks_bolt", "sks_stock"], durabilityTarget: 65 },
  { catalogId: "ak_74", partIds: ["ak74_barrel", "ak74_receiver", "ak74_bolt", "ak74_magazine", "ak74_stock"], durabilityTarget: 75 },
  { catalogId: "rpk", partIds: ["rpk_barrel", "rpk_receiver", "rpk_bipod", "rpk_bolt", "rpk_magazine"], durabilityTarget: 80 },
  { catalogId: "saiga_12", partIds: ["saiga_barrel", "saiga_receiver", "saiga_bolt", "saiga_magazine"], durabilityTarget: 70 },
  { catalogId: "svd", partIds: ["svd_barrel", "svd_receiver", "svd_bolt", "svd_magazine", "svd_stock"], durabilityTarget: 90 },
];

const SUPPRESSOR_IDS = ["mod_pbs_universal", "mod_pbs1"] as const;

describe("M13 OP1 — part contributions audit", () => {
  const items = loadItems();
  const itemById = new Map(items.map((i) => [i.id, i]));
  const contributions = loadContributions();

  test("(coverage) все 68 component-предметов имеют stats после populate", () => {
    const components = items.filter((i) => i.kind === "component");
    expect(components.length).toBe(68);
    const withoutStats = components.filter(
      (c) => !c.stats || typeof c.stats !== "object",
    );
    expect(withoutStats).toEqual([]);
  });

  test("(coverage) каждый из 60 non-mod партов есть ровно в одной family-map", () => {
    const familyPartIds = new Set<string>();
    for (const f of FAMILIES) {
      for (const id of f.partIds) {
        expect(familyPartIds.has(id)).toBe(false); // no dup across families
        familyPartIds.add(id);
      }
    }
    // Все парты из FAMILIES реально существуют в каталоге как component.
    for (const id of familyPartIds) {
      const it = itemById.get(id);
      expect(it).toBeDefined();
      expect(it?.kind).toBe("component");
    }
    // 60 non-mod component'ов = 68 component - 8 mod_*.
    const nonModComponents = items.filter(
      (i) => i.kind === "component" && !i.id.startsWith("mod_"),
    );
    expect(nonModComponents.length).toBe(60);
    expect(familyPartIds.size).toBe(60);
  });

  test("(in-band exact) sum(parts.damage/dura) === catalog band для всех 15 семейств", () => {
    for (const family of FAMILIES) {
      const catalog = itemById.get(family.catalogId);
      expect(catalog, `catalog ${family.catalogId} not found`).toBeDefined();
      if (catalog?.kind !== "weapon") {
        throw new Error(`catalog ${family.catalogId} is kind ${catalog?.kind}, expected weapon`);
      }
      const parts = family.partIds.map((id) => {
        const it = itemById.get(id);
        if (it?.kind !== "component") {
          throw new Error(`part ${id} is kind ${it?.kind}, expected component`);
        }
        return it;
      });
      const sumMin = parts.reduce(
        (acc, p) => acc + (p.stats?.damage_min ?? 0),
        0,
      );
      const sumMax = parts.reduce(
        (acc, p) => acc + (p.stats?.damage_max ?? 0),
        0,
      );
      const sumDura = parts.reduce(
        (acc, p) => acc + (p.stats?.durability_max ?? 0),
        0,
      );
      expect(sumMin, `family ${family.catalogId} damage_min sum mismatch`).toBe(
        catalog.stats?.damage_min,
      );
      expect(sumMax, `family ${family.catalogId} damage_max sum mismatch`).toBe(
        catalog.stats?.damage_max,
      );
      expect(sumDura, `family ${family.catalogId} dura sum mismatch`).toBe(
        family.durabilityTarget,
      );
    }
  });

  test("(floor invariant) full build + suppressor → assembled damage_min >= 0", () => {
    for (const family of FAMILIES) {
      const parts = family.partIds.map((id) => {
        const it = itemById.get(id);
        if (it?.kind !== "component") throw new Error(`part ${id} missing`);
        return it;
      });
      for (const suppressorId of SUPPRESSOR_IDS) {
        const sup = itemById.get(suppressorId);
        if (sup?.kind !== "component") throw new Error(`suppressor ${suppressorId} missing`);
        const w = assembleWeapon([...parts, sup], "wi_audit_sup");
        expect(
          w.stats.damage_min,
          `${family.catalogId} + ${suppressorId} damage_min went negative`,
        ).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test("(sanity) full build для каждого семейства даёт damage_min >= 1", () => {
    for (const family of FAMILIES) {
      const parts = family.partIds.map((id) => {
        const it = itemById.get(id);
        if (it?.kind !== "component") throw new Error(`part ${id} missing`);
        return it;
      });
      const w = assembleWeapon(parts, "wi_audit_sanity");
      expect(w.stats.damage_min, `${family.catalogId} sanity damage_min`).toBeGreaterThanOrEqual(1);
    }
  });

  test("(spec sync) JSON-таблица содержит ровно те же id и числа что в items.json", () => {
    // Защита от расхождения source-of-truth между docs/.../part-contributions.json
    // и content/items.json (если кто-то меняет цифры вручную в items.json, не
    // запустив populate-скрипт). Любая дивергенция → красный тест.
    for (const [id, entry] of Object.entries(contributions)) {
      const it = itemById.get(id);
      if (!it || it.kind !== "component") {
        throw new Error(`spec lists ${id} but it's not a component in items.json`);
      }
      const itStats = (it.stats ?? {}) as {
        damage_min?: number;
        damage_max?: number;
        durability_max?: number;
      };
      expect(itStats.damage_min, `${id} damage_min divergence`).toBe(entry.damage_min);
      expect(itStats.damage_max, `${id} damage_max divergence`).toBe(entry.damage_max);
      expect(itStats.durability_max, `${id} durability_max divergence`).toBe(
        entry.durability_max,
      );
    }
  });
});
