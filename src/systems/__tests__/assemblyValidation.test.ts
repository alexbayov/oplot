import { describe, expect, it } from "vitest";
import {
  AssemblyError,
  availableFamilies,
  isStructuralPart,
  validateAssemblyParts,
  weaponFamily,
} from "../assemblyValidation";
import type { ComponentItem } from "../../types";

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
  stats: {},
});

describe("validateAssemblyParts — 3 reason-кода (frozen Model C)", () => {
  it("[] → empty_parts", () => {
    expect(validateAssemblyParts([])).toEqual({
      ok: false,
      reason: "empty_parts",
    });
  });

  it("только mod_* без структуры → no_structural_part", () => {
    expect(validateAssemblyParts([part("mod_pbs1"), part("mod_optic_4x")])).toEqual({
      ok: false,
      reason: "no_structural_part",
    });
  });

  it("дубликат id → duplicate_part", () => {
    expect(validateAssemblyParts([part("pm_frame"), part("pm_frame")])).toEqual({
      ok: false,
      reason: "duplicate_part",
    });
  });

  it("валидно: frame + slide → ok", () => {
    expect(validateAssemblyParts([part("pm_frame"), part("pm_slide")])).toEqual({
      ok: true,
    });
  });

  it("валидно с модом: frame + mod → ok", () => {
    expect(validateAssemblyParts([part("pm_frame"), part("mod_pbs1")])).toEqual({
      ok: true,
    });
  });

  it("структурный через receiver → ok", () => {
    expect(
      validateAssemblyParts([part("akm_receiver"), part("akm_barrel")]),
    ).toEqual({ ok: true });
  });

  it("D7 порядок: дубль mod_* (нет структуры + дубль) → duplicate_part первым", () => {
    // empty → duplicate → no_structural. Дубль идёт раньше.
    expect(validateAssemblyParts([part("mod_pbs1"), part("mod_pbs1")])).toEqual({
      ok: false,
      reason: "duplicate_part",
    });
  });

  it("Set-check блокирует stack-эксплойт (5× pm_frame)", () => {
    const five = Array.from({ length: 5 }, () => part("pm_frame"));
    expect(validateAssemblyParts(five)).toEqual({
      ok: false,
      reason: "duplicate_part",
    });
  });
});

describe("isStructuralPart — frame или receiver", () => {
  it("frame id → true", () => {
    expect(isStructuralPart("pm_frame")).toBe(true);
    expect(isStructuralPart("tt_frame")).toBe(true);
    expect(isStructuralPart("aps_frame")).toBe(true);
  });

  it("receiver id → true (12 семейств)", () => {
    for (const fam of [
      "akm",
      "aks74u",
      "bekas",
      "hunting",
      "izh43",
      "mosin",
      "ppsh",
      "sks",
      "ak74",
      "rpk",
      "saiga",
      "svd",
    ]) {
      expect(isStructuralPart(`${fam}_receiver`)).toBe(true);
    }
  });

  it("non-structural (barrel/slide/bolt/...) → false", () => {
    expect(isStructuralPart("pm_slide")).toBe(false);
    expect(isStructuralPart("akm_barrel")).toBe(false);
    expect(isStructuralPart("svd_bolt")).toBe(false);
  });

  it("mod_* → false", () => {
    expect(isStructuralPart("mod_pbs1")).toBe(false);
    expect(isStructuralPart("mod_optic_4x")).toBe(false);
  });
});

describe("weaponFamily — UI-gate префикс", () => {
  it("семейство = префикс до первого _", () => {
    expect(weaponFamily("pm_frame")).toBe("pm");
    expect(weaponFamily("ak74_barrel")).toBe("ak74");
    expect(weaponFamily("akm_receiver")).toBe("akm");
  });

  it("mod_* → universal", () => {
    expect(weaponFamily("mod_pbs1")).toBe("universal");
    expect(weaponFamily("mod_ext_mag_545")).toBe("universal");
  });
});

describe("availableFamilies — sorted unique без universal (M14-PR1 D6)", () => {
  it("mix семейств + mod_* → universal исключён, sorted ASC, unique", () => {
    const parts = [
      part("pm_slide"),
      part("akm_barrel"),
      part("pm_frame"),
      part("mod_pbs1"),
      part("mod_optic_4x"),
    ];
    expect(availableFamilies(parts)).toEqual(["akm", "pm"]);
  });

  it("только mod_* → []", () => {
    expect(availableFamilies([part("mod_pbs1"), part("mod_light")])).toEqual([]);
  });

  it("дубли партов одного семейства → семейство один раз", () => {
    const parts = [part("pm_frame"), part("pm_slide"), part("pm_magazine")];
    expect(availableFamilies(parts)).toEqual(["pm"]);
  });

  it("[] → []", () => {
    expect(availableFamilies([])).toEqual([]);
  });
});

describe("AssemblyError — несёт reason-код", () => {
  it("поле .reason доступно после throw", () => {
    try {
      throw new AssemblyError("empty_parts");
    } catch (e) {
      expect(e).toBeInstanceOf(AssemblyError);
      expect((e as AssemblyError).reason).toBe("empty_parts");
      expect((e as AssemblyError).name).toBe("AssemblyError");
    }
  });
});
