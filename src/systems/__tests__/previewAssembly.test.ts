// M14-PR1 (F3) — unit-тесты pure preview-хелпера `previewAssembly`.
//
// previewAssembly считает статы кандидата через `assembleWeapon` (G2:
// единственный санкционированный путь к статам, без дублирующей суммы) и
// ловит AssemblyError → discriminated `{ ok:false, reason }`. Достижимые
// из UI invalid-состояния: empty_parts (ничего не выбрано), no_structural
// (только mod_*). duplicate_part из UI недостижим (выбор — Set<id>), но
// покрыт ради exhaustiveness reason-union.
//
// Инвариант G2/D7: preview НЕ мутирует вход и НЕ персистит ничего —
// чистый re-call даёт идентичный результат (кейс 6).

import { describe, expect, it } from "vitest";
import { previewAssembly } from "../assemblyFlow";
import { assembleWeapon } from "../weaponAssembly";
import type { ComponentItem } from "../../types";

// M16-PR2: factory принимает accuracy-вклад и override веса детали, чтобы
// покрыть полную combat-поверхность preview (damage/accuracy/weight).
const part = (
  id: string,
  contribute: {
    damage_min?: number;
    damage_max?: number;
    accuracy?: number;
    durability_max?: number;
  } = {},
  weight_kg = 0.5,
): ComponentItem => ({
  kind: "component",
  id,
  name_ru: id,
  tier: 1,
  weight_kg,
  zone_origin: "test",
  description_ru: "",
  recipe_id: null,
  fits: "weapon",
  stats: contribute,
});

describe("previewAssembly — invalid (достижимые из UI)", () => {
  it("[] → ok:false empty_parts", () => {
    expect(previewAssembly([])).toEqual({ ok: false, reason: "empty_parts" });
  });

  it("только mod_* (нет структуры) → ok:false no_structural_part", () => {
    const r = previewAssembly([part("mod_pbs1"), part("mod_optic_4x")]);
    expect(r).toEqual({ ok: false, reason: "no_structural_part" });
  });

  it("дубликат id (из UI недостижим, exhaustiveness) → ok:false duplicate_part", () => {
    const r = previewAssembly([part("pm_frame"), part("pm_frame")]);
    expect(r).toEqual({ ok: false, reason: "duplicate_part" });
  });
});

describe("previewAssembly — ok (frozen stats)", () => {
  it("frame + slide → ok со статами = поэлементная сумма вкладов", () => {
    const r = previewAssembly([
      part("pm_frame", { damage_min: 1, damage_max: 2, durability_max: 10 }),
      part("pm_slide", { damage_min: 2, damage_max: 4, durability_max: 5 }),
    ]);
    expect(r).toEqual({
      ok: true,
      // M16-PR2: accuracy=0 (детали без вклада), weight_kg=1.0 (2×0.5).
      stats: { damage_min: 3, damage_max: 6, accuracy: 0 },
      weight_kg: 1,
      durability_max: 15,
    });
  });

  it("receiver-семейство → ok (структурный через _receiver)", () => {
    const r = previewAssembly([
      part("akm_receiver", { damage_min: 5, damage_max: 9, durability_max: 30 }),
      part("akm_barrel", { damage_min: 3, damage_max: 5, durability_max: 12 }),
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.stats).toEqual({ damage_min: 8, damage_max: 14, accuracy: 0 });
      expect(r.durability_max).toBe(42);
    }
  });

  it("M16-PR2: accuracy и combat-вес суммируются в preview", () => {
    const r = previewAssembly([
      part("pm_frame", { damage_min: 2, damage_max: 4, accuracy: 3 }, 0.8),
      part("pm_barrel", { damage_min: 1, damage_max: 3, accuracy: 5 }, 0.6),
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.stats.accuracy).toBe(8); // 3 + 5
      expect(r.weight_kg).toBeCloseTo(1.4, 5); // 0.8 + 0.6
    }
  });

  it("additive-инвариант: damage_min = Σ вкладов после floor ≥0 (PR-6a контракт)", () => {
    // Отрицательный вклад облегчающей части компенсируется до floor.
    const r = previewAssembly([
      part("pm_frame", { damage_min: 4, damage_max: 6, durability_max: 8 }),
      part("mod_light", { damage_min: -10, damage_max: -10, durability_max: 0 }),
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      // damage_min floor → 0; damage_max клампится до ≥ damage_min.
      expect(r.stats.damage_min).toBe(0);
      expect(r.stats.damage_max).toBeGreaterThanOrEqual(r.stats.damage_min);
    }
  });
});

describe("previewAssembly — parity с assembleWeapon (§3 PR2)", () => {
  // Суть §3: единый summation-helper ⇒ preview бит-в-бит == то, что
  // assembleWeapon производит из тех же parts. Per-field (НЕ
  // toEqual(instance)): preview не несёт id/name/parts/affixes/
  // durability_current — только combat-поверхность. preview.stats
  // зеркалит instance.stats целиком {damage_min,damage_max,accuracy};
  // weight_kg/durability_max — отдельные top-level поля.
  it("каждое поле preview совпадает с тем, что assembleWeapon даёт из тех же parts", () => {
    const parts = [
      part("pm_frame", { damage_min: 3, damage_max: 6, accuracy: 2, durability_max: 20 }, 0.8),
      part("pm_barrel", { damage_min: 4, damage_max: 7, accuracy: 5, durability_max: 12 }, 0.6),
    ];
    const preview = previewAssembly(parts);
    const instance = assembleWeapon(parts, "wi_parity");
    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.stats).toEqual(instance.stats);
      expect(preview.weight_kg).toBe(instance.weight_kg);
      expect(preview.durability_max).toBe(instance.durability_max);
    }
  });
});

describe("previewAssembly — purity (G2/D7)", () => {
  it("не мутирует входной массив и идемпотентен на re-call", () => {
    const parts = [
      part("pm_frame", { damage_min: 1, damage_max: 2, durability_max: 10 }),
      part("pm_slide", { damage_min: 2, damage_max: 4, durability_max: 5 }),
    ];
    const snapshotIds = parts.map((p) => p.id);
    const first = previewAssembly(parts);
    const second = previewAssembly(parts);
    expect(second).toEqual(first);
    // вход не тронут (ни порядок, ни содержимое)
    expect(parts.map((p) => p.id)).toEqual(snapshotIds);
  });
});
