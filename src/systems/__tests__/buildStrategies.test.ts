// M16-PR3 — Gate-тест DoD (preflight §7, форк G-A): две из трёх стратегий
// (Стрелок / Танк) СОБИРАЮТСЯ и РАЗЛИЧИМЫ по резолвнутым combat-статам.
//
// Гриндер ВНЕ scope M16 (G-A): его идентичность (+carry/+loot/+scavenge)
// живёт на armor-intrinsic слое и бьёт по carry/loot-экономике, не по
// combat-поверхности оружия — отложено до armor-affix pass (mini-веха / M17).
//
// Дифференциация здесь part-driven и детерминирована (через `assembleWeapon`,
// без affix-rng): доказывает, что СИСТЕМА выражает оба строя по статам.
// Аффиксы — слой вариативности поверх (покрыт в weaponAffixes/weaponDamage
// тестах), не предпосылка различимости.

import { describe, expect, it } from "vitest";
import { assembleWeapon } from "../weaponAssembly";
import {
  resolveEquippedCombat,
  type WeaponCombat,
} from "../weaponDamage";
import { accuracyToPowerFactor, weightToPowerFactor } from "../sortieResolve";
import type { ArmorItem, ComponentItem } from "../../types";
import type { EquippedArmor, EquippedWeapon } from "../../state/types";
import type { Item } from "../../types/item";
import { resolveEquippedArmor } from "../armorAffixes";

const part = (
  id: string,
  stats: { damage_min?: number; damage_max?: number; accuracy?: number; durability_max?: number },
  weight_kg: number,
  tier: ComponentItem["tier"] = 2,
): ComponentItem => ({
  kind: "component",
  id,
  name_ru: id,
  tier,
  weight_kg,
  zone_origin: "test",
  description_ru: "",
  recipe_id: null,
  fits: "weapon",
  stats,
});

// Стрелок: лёгкая + точная сборка (низкий вес, высокая точность, умеренный урон).
const strelokParts: ComponentItem[] = [
  part("pm_frame", { damage_min: 3, damage_max: 5, accuracy: 8, durability_max: 12 }, 0.4),
  part("mod_optic_4x", { damage_min: 2, damage_max: 3, accuracy: 5, durability_max: 4 }, 0.3),
];

// Танк: тяжёлая + бьющая сборка (высокий урон, высокий вес, низкая точность).
const tankParts: ComponentItem[] = [
  part("akm_receiver", { damage_min: 9, damage_max: 14, accuracy: 1, durability_max: 30 }, 1.2),
  part("akm_barrel", { damage_min: 5, damage_max: 8, accuracy: 0, durability_max: 16 }, 1.0),
];


const armor = (
  id: string,
  intrinsic_affixes: { id: string; value: number }[] = [],
): ArmorItem => ({
  kind: "armor",
  id,
  name_ru: id,
  tier: 2,
  weight_kg: 1,
  zone_origin: "test",
  description_ru: "",
  recipe_id: null,
  flavor_ru: "",
  slot: "plate",
  stats: { armor_value: 1 },
  intrinsic_affixes,
});

const items: Record<string, Item> = {};

const resolveBuild = (parts: ComponentItem[], id: string): WeaponCombat => {
  const inst = assembleWeapon(parts, id);
  const eq: EquippedWeapon = { kind: "crafted", id };
  return resolveEquippedCombat(eq, items, [inst]);
};

describe("M16 DoD gate — Стрелок / Танк собираемы и различимы (G-A)", () => {
  it("обе стратегии собираются без ошибок и дают живой combat-резолв", () => {
    const strelok = assembleWeapon(strelokParts, "wi_strelok");
    const tank = assembleWeapon(tankParts, "wi_tank");
    // Собрались (структурная часть присутствует → не throw), живые.
    expect(strelok.durability_current).toBeGreaterThan(0);
    expect(tank.durability_current).toBeGreaterThan(0);
    // Резолв == frozen база (не bare-hands fallback) ⇒ реально экипируемы.
    const sc = resolveEquippedCombat({ kind: "crafted", id: "wi_strelok" }, items, [strelok]);
    expect(sc.damage_max).toBe(strelok.stats.damage_max);
  });

  it("различимы по combat-статам: Стрелок точнее и легче, Танк бьёт сильнее", () => {
    const s = resolveBuild(strelokParts, "wi_strelok");
    const t = resolveBuild(tankParts, "wi_tank");

    // Идентичность Стрелка: выше точность, ниже combat-вес.
    expect(s.accuracy).toBeGreaterThan(t.accuracy);
    expect(s.weight).toBeLessThan(t.weight);

    // Идентичность Танка: выше средний урон.
    const avg = (c: WeaponCombat): number => (c.damage_min + c.damage_max) / 2;
    expect(avg(t)).toBeGreaterThan(avg(s));

    // Профили не совпадают (различимы как объекты).
    expect(s).not.toEqual(t);
  });

  it("различие транслируется в оффенс-факторы (legibility через формулу)", () => {
    const s = resolveBuild(strelokParts, "wi_strelok");
    const t = resolveBuild(tankParts, "wi_tank");
    // Точность Стрелка даёт больший accuracy-множитель оффенса.
    expect(accuracyToPowerFactor(s.accuracy)).toBeGreaterThan(
      accuracyToPowerFactor(t.accuracy),
    );
    // Лёгкость Стрелка — меньший handling-штраф (фактор ≥, т.к. вес штрафует).
    expect(weightToPowerFactor(s.weight)).toBeGreaterThanOrEqual(
      weightToPowerFactor(t.weight),
    );
  });
});


describe("Armor-affix pass gate — Гриндер strategy", () => {
  const armorItems: Record<string, Item> = {
    strelok_armor: armor("strelok_armor"),
    tank_armor: armor("tank_armor"),
    grinder_pack: armor("grinder_pack", [
      { id: "carry_extra", value: 6 },
      { id: "scavenger_eye", value: 0.25 },
    ]),
  };

  const resolveArmor = (equipped: EquippedArmor) => resolveEquippedArmor(equipped, armorItems);

  it("Гриндер отличим от Стрелка/Танка по carry_kg и scavenge_chance", () => {
    const strelokArmor = resolveArmor({ plate: "strelok_armor" });
    const tankArmor = resolveArmor({ plate: "tank_armor" });
    const grinderArmor = resolveArmor({ plate: "grinder_pack" });

    expect(grinderArmor.carry_kg).toBeGreaterThan(strelokArmor.carry_kg);
    expect(grinderArmor.carry_kg).toBeGreaterThan(tankArmor.carry_kg);
    expect(grinderArmor.scavenge_chance).toBeGreaterThan(strelokArmor.scavenge_chance);
    expect(grinderArmor.scavenge_chance).toBeGreaterThan(tankArmor.scavenge_chance);
  });
});
