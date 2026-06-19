// M16-PR3 — реестр аффиксов: whitelist-страж, roll-детерминизм/tier-count,
// контрибуция, defensive unknown-id, UI-описание.

import { describe, expect, it } from "vitest";
import {
  AFFIX_REGISTRY,
  AFFIX_TIER2_THRESHOLD,
  affixContribution,
  describeAffix,
  getAffixDef,
  rollAffixes,
  type AffixStat,
} from "../weaponAffixes";
import type { ComponentItem } from "../../types";

const WHITELIST: ReadonlySet<AffixStat> = new Set<AffixStat>([
  "damage_min",
  "damage_max",
  "accuracy",
  "weight_kg",
]);

const part = (id: string, tier: ComponentItem["tier"] = 1): ComponentItem => ({
  kind: "component",
  id,
  name_ru: id,
  tier,
  weight_kg: 0.5,
  zone_origin: "test",
  description_ru: "",
  recipe_id: null,
  fits: "weapon",
  stats: {},
});

// Детерминированный LCG (как в остальных assembly-тестах).
const seedRng = (seed = 0.5): (() => number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

describe("AFFIX_REGISTRY — структурный whitelist (preflight §5)", () => {
  it("каждый аффикс целит только в combat-whitelist (durability/repair/disasm запрещены)", () => {
    for (const def of AFFIX_REGISTRY) {
      expect(WHITELIST.has(def.stat)).toBe(true);
    }
  });

  it("id уникальны и kind ∈ {prefix, suffix}", () => {
    const ids = AFFIX_REGISTRY.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of AFFIX_REGISTRY) {
      expect(["prefix", "suffix"]).toContain(def.kind);
    }
  });

  it("реестр непуст и покрывает обе combat-оси (offense и handling)", () => {
    expect(AFFIX_REGISTRY.length).toBeGreaterThan(0);
    const stats = new Set(AFFIX_REGISTRY.map((a) => a.stat));
    expect(stats.has("accuracy") || stats.has("weight_kg")).toBe(true); // handling
    expect(stats.has("damage_min") || stats.has("damage_max")).toBe(true); // offense
  });
});

describe("affixContribution — поэлементная сумма + defensive", () => {
  it("суммирует по stat из реестра", () => {
    const c = affixContribution([
      { id: "suf_precise", value: 6 },
      { id: "suf_balanced", value: -0.4 },
    ]);
    expect(c.accuracy).toBe(6);
    expect(c.weight_kg).toBeCloseTo(-0.4, 5);
    expect(c.damage_min).toBe(0);
    expect(c.damage_max).toBe(0);
  });

  it("использует frozen value, НЕ реестровый (freeze-on-assembly)", () => {
    // value на инстансе отличается от реестрового — берём инстансный.
    const c = affixContribution([{ id: "suf_precise", value: 99 }]);
    expect(c.accuracy).toBe(99);
  });

  it("unknown id → skip (no-op), не падает", () => {
    const c = affixContribution([
      { id: "__removed_in_future_release__", value: 100 },
      { id: "pre_honed", value: 2 },
    ]);
    expect(c.damage_min).toBe(2); // только известный применён
    expect(c.accuracy).toBe(0);
  });

  it("пустой список → нулевой вклад (zero-regression база)", () => {
    expect(affixContribution([])).toEqual({
      damage_min: 0,
      damage_max: 0,
      accuracy: 0,
      weight_kg: 0,
    });
  });
});

describe("rollAffixes — детерминизм + tier-count (fork D)", () => {
  it("детерминирован на одном seed (save-snapshot стабильность)", () => {
    const parts = [part("pm_frame", 3), part("pm_barrel", 5)];
    const a = rollAffixes(parts, seedRng(0.31));
    const b = rollAffixes(parts, seedRng(0.31));
    expect(a).toEqual(b);
  });

  it("tier 1-2 → не более 1 аффикса", () => {
    const parts = [part("pm_frame", 1), part("pm_slide", 2)];
    for (let seed = 0; seed < 1; seed += 0.07) {
      const rolled = rollAffixes(parts, seedRng(seed));
      expect(rolled.length).toBeLessThanOrEqual(1);
    }
  });

  it(`tier >= ${AFFIX_TIER2_THRESHOLD} → не более 2 аффиксов`, () => {
    const parts = [part("pm_frame", 1), part("akm_receiver", 4)];
    for (let seed = 0; seed < 1; seed += 0.07) {
      const rolled = rollAffixes(parts, seedRng(seed));
      expect(rolled.length).toBeLessThanOrEqual(2);
    }
  });

  it("ролл выбирает без повторов (distinct id) и из реестра", () => {
    const parts = [part("akm_receiver", 5)];
    const ids = AFFIX_REGISTRY.map((a) => a.id);
    for (let seed = 0; seed < 1; seed += 0.05) {
      const rolled = rollAffixes(parts, seedRng(seed));
      const rolledIds = rolled.map((r) => r.id);
      expect(new Set(rolledIds).size).toBe(rolledIds.length); // distinct
      for (const r of rolled) {
        expect(ids).toContain(r.id); // ∈ реестр
        // frozen value == реестровое на момент ролла
        expect(r.value).toBe(getAffixDef(r.id)?.value);
      }
    }
  });

  it("может выпасть 0 аффиксов (ролл включает пустой исход)", () => {
    const parts = [part("pm_frame", 1)];
    let sawEmpty = false;
    for (let seed = 0; seed < 1; seed += 0.03) {
      if (rollAffixes(parts, seedRng(seed)).length === 0) sawEmpty = true;
    }
    expect(sawEmpty).toBe(true);
  });
});

describe("describeAffix — UI", () => {
  it("известный аффикс → name_ru + знаковый эффект", () => {
    expect(describeAffix({ id: "suf_precise", value: 6 })).toEqual({
      name_ru: "точности",
      effect: "+6 точность",
    });
    expect(describeAffix({ id: "suf_balanced", value: -0.4 })).toEqual({
      name_ru: "баланса",
      effect: "-0.4 вес, кг",
    });
  });

  it("unknown id → null (сцена скроет строку)", () => {
    expect(describeAffix({ id: "__nope__", value: 1 })).toBeNull();
  });
});
