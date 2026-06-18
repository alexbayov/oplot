import { describe, it, expect } from "vitest";
import {
  sortInstancesForDisplay,
  canEquipInstance,
  disassembleInstance,
  disassembleRefund,
} from "../craftedWeapons";
import { assembleFromStash } from "../assemblyFlow";
import { countInStacks } from "../../state/GameState";
import {
  HERO_START_WEAPON_ID,
  DISASSEMBLE_RECOVERY_RATE,
} from "../../state/balance";
import type { WeaponInstance } from "../weaponAssembly";
import type { ComponentItem } from "../../types";
import type { EquippedWeapon, InventoryStack } from "../../state/types";

const mk = (
  id: string,
  durability_current = 10,
  parts: string[] = [],
): WeaponInstance => ({
  id,
  name_ru: id,
  slot: "action",
  stats: { damage_min: 1, damage_max: 2 },
  durability_max: 10,
  durability_current,
  parts,
});

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

const seedRng = (seed = 0.5): (() => number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

// M15-PR2 (DF2): tierOf инжектится в disassembleInstance/disassembleRefund.
// Дефолт — все части tier 1 (drop-порядок тогда решают structural-флаг + id).
const flatTier = (): number => 1;
const tierMap =
  (m: Record<string, number>) =>
  (id: string): number =>
    m[id] ?? 1;

describe("sortInstancesForDisplay", () => {
  it("returns [] for empty input", () => {
    expect(sortInstancesForDisplay([], null)).toEqual([]);
  });

  it("orders newest→oldest by ARRAY ORDER, not by inst.id (D6 anchor)", () => {
    // Якорь D6: id `wi_<random36>` не несёт timestamp. Порядок вставки
    // (append = newest last) — единственный источник «новизны». Подобраны
    // id так, что любая сортировка по inst.id (asc ИЛИ desc) ИЛИ забытый
    // reverse дадут результат, отличный от ожидаемого.
    //   insertion (oldest→newest): wi_m, wi_z, wi_a
    const input = [mk("wi_m"), mk("wi_z"), mk("wi_a")];
    const out = sortInstancesForDisplay(input, null).map((w) => w.id);
    expect(out).toEqual(["wi_a", "wi_z", "wi_m"]); // reverse of array (newest first)
    // защита от ложно-зелёного: ни один лексикографический порядок не совпадает
    expect(out).not.toEqual(["wi_a", "wi_m", "wi_z"]); // НЕ lexicographic asc
    expect(out).not.toEqual(["wi_z", "wi_m", "wi_a"]); // НЕ lexicographic desc
    expect(out).not.toEqual(["wi_m", "wi_z", "wi_a"]); // НЕ array-as-is (forgot reverse)
  });

  it("floats equipped to front, rest stay newest→oldest", () => {
    // insertion: wi_a(oldest), wi_b, wi_c(newest); экипирован самый старый
    const input = [mk("wi_a"), mk("wi_b"), mk("wi_c")];
    const out = sortInstancesForDisplay(input, "wi_a").map((w) => w.id);
    expect(out).toEqual(["wi_a", "wi_c", "wi_b"]);
  });

  it("ignores equippedId that is not in the list", () => {
    const input = [mk("wi_a"), mk("wi_b")];
    const out = sortInstancesForDisplay(input, "wi_zzz").map((w) => w.id);
    expect(out).toEqual(["wi_b", "wi_a"]);
  });

  it("does not mutate the input array", () => {
    const input = [mk("wi_a"), mk("wi_b")];
    sortInstancesForDisplay(input, "wi_b");
    expect(input.map((w) => w.id)).toEqual(["wi_a", "wi_b"]);
  });
});

describe("canEquipInstance", () => {
  it("true when durability_current > 0", () => {
    expect(canEquipInstance(mk("wi_a", 5))).toBe(true);
  });

  it("false when broken (durability_current === 0)", () => {
    expect(canEquipInstance(mk("wi_a", 0))).toBe(false);
  });
});


describe("disassembleRefund — M15-PR2 (DF2 лоссовый возврат)", () => {
  it("пустой parts → []", () => {
    expect(disassembleRefund([], flatTier)).toEqual([]);
  });

  it("min-1 floor: 1-партовый инстанс возвращает РОВНО 1, не 0 (Alex QA-инвариант)", () => {
    // floor(1 × 0.5) = 0 → max(1, 0) = 1. Без min-1 был бы feel-bad zero.
    const out = disassembleRefund(["pm_frame"], flatTier);
    expect(out).toHaveLength(1);
    expect(out).toEqual(["pm_frame"]);
  });

  it("K = floor(N × RATE), НЕ round/ceil (N=3, RATE=0.5 → 1, не 2)", () => {
    const out = disassembleRefund(["a_frame", "mod_x", "mod_y"], flatTier);
    expect(out).toHaveLength(Math.max(1, Math.floor(3 * DISASSEMBLE_RECOVERY_RATE)));
    expect(out).toHaveLength(1);
  });

  it("K ≤ N и K ≥ 1 для любого N≥1 (инвариант)", () => {
    for (let n = 1; n <= 8; n++) {
      const parts = Array.from({ length: n }, (_, i) => `mod_${i}`);
      const k = disassembleRefund(parts, flatTier).length;
      expect(k).toBeGreaterThanOrEqual(1);
      expect(k).toBeLessThanOrEqual(n);
    }
  });

  it("возвращённое — всегда подмножество входа", () => {
    const parts = ["a_frame", "mod_x", "b_receiver", "mod_y"];
    const out = disassembleRefund(parts, flatTier);
    for (const id of out) expect(parts).toContain(id);
  });

  it("drop-order: non-structural выбрасывается ПЕРВЫМ, structural остаётся", () => {
    // N=2 → K=1. mod_x non-structural, pm_frame structural → оставляем frame.
    const out = disassembleRefund(["mod_x", "pm_frame"], flatTier);
    expect(out).toEqual(["pm_frame"]);
  });

  it("drop-order: внутри одного класса — tier ASC (низкий тир выбрасывается)", () => {
    const out = disassembleRefund(
      ["mod_low", "mod_high"],
      tierMap({ mod_low: 1, mod_high: 3 }),
    );
    expect(out).toEqual(["mod_high"]);
  });

  it("drop-order: при равном классе и тире — tiebreak по id ASC (детерминизм)", () => {
    const out = disassembleRefund(["mod_a", "mod_b"], flatTier);
    expect(out).toEqual(["mod_b"]);
  });

  it("детерминизм: два вызова дают идентичный результат (нет rng)", () => {
    const parts = ["mod_x", "pm_frame", "mod_y", "tt_receiver"];
    expect(disassembleRefund(parts, flatTier)).toEqual(
      disassembleRefund(parts, flatTier),
    );
  });

  it("structural приоритетнее любого тира non-structural (порядок ключей)", () => {
    // K=1: даже высокотировый mod проигрывает structural (флаг старше тира).
    const out = disassembleRefund(
      ["mod_pricey", "pm_frame"],
      tierMap({ mod_pricey: 5, pm_frame: 1 }),
    );
    expect(out).toEqual(["pm_frame"]);
  });

  it("дубликаты id: одинаковые части суммируются в возврате", () => {
    // N=4 одинаковых non-structural → K=2 → возврат 2 идентичных.
    const out = disassembleRefund(
      ["mod_grip", "mod_grip", "mod_grip", "mod_grip"],
      flatTier,
    );
    expect(out).toEqual(["mod_grip", "mod_grip"]);
  });
});

describe("disassembleInstance — M14-PR3 (B) + M15-PR2 lossy", () => {
  it("возвращает (лоссово) части: structural остаётся, non-structural — лом", () => {
    // N=2 → K=1. pm_slide non-structural выбрасывается, pm_frame остаётся.
    const inst = mk("wi_a", 10, ["pm_frame", "pm_slide"]);
    const r = disassembleInstance("wi_a", [inst], [], null, flatTier);
    expect(countInStacks(r.baseStash, "pm_frame")).toBe(1);
    expect(countInStacks(r.baseStash, "pm_slide")).toBe(0);
    expect(r.returned_parts).toEqual(["pm_frame"]);
  });

  it("мёрджит в существующий стек (count += 1, не плодит дубль-стек)", () => {
    // N=1 → K=1 (min-1): единственная часть возвращается и мёрджится.
    const inst = mk("wi_a", 10, ["pm_frame"]);
    const stash: InventoryStack[] = [{ item_id: "pm_frame", count: 2 }];
    const r = disassembleInstance("wi_a", [inst], stash, null, flatTier);
    expect(countInStacks(r.baseStash, "pm_frame")).toBe(3);
    expect(r.baseStash.filter((s) => s.item_id === "pm_frame")).toHaveLength(1);
  });

  it("multi-part: возвращённые дубликаты id суммируются по count", () => {
    // N=4 одинаковых non-structural → K=2 → на склад уходит 2× mod_grip.
    const inst = mk("wi_a", 10, ["mod_grip", "mod_grip", "mod_grip", "mod_grip"]);
    const r = disassembleInstance("wi_a", [inst], [], null, flatTier);
    expect(countInStacks(r.baseStash, "mod_grip")).toBe(2);
    expect(r.returned_parts).toEqual(["mod_grip", "mod_grip"]);
  });

  it("D3: сломанный (durability 0) разбирается штатно (инстанс удалён, structural возвращён)", () => {
    const inst = mk("wi_a", 0, ["pm_frame", "pm_slide"]);
    const r = disassembleInstance("wi_a", [inst], [], null, flatTier);
    expect(r.crafted_weapons).toHaveLength(0);
    expect(countInStacks(r.baseStash, "pm_frame")).toBe(1);
    expect(countInStacks(r.baseStash, "pm_slide")).toBe(0);
  });

  it("удаляет инстанс из crafted_weapons (остальные нетронуты)", () => {
    const a = mk("wi_a", 10, ["pm_frame"]);
    const b = mk("wi_b", 10, ["tt_frame"]);
    const r = disassembleInstance("wi_a", [a, b], [], null, flatTier);
    expect(r.crafted_weapons.map((w) => w.id)).toEqual(["wi_b"]);
  });

  it("D4: экипированный crafted → equipped падает в catalog craft_knife", () => {
    const inst = mk("wi_a", 10, ["pm_frame"]);
    const eq: EquippedWeapon = { kind: "crafted", id: "wi_a" };
    const r = disassembleInstance("wi_a", [inst], [], eq, flatTier);
    expect(r.was_equipped).toBe(true);
    expect(r.equipped_weapon).toEqual({ kind: "catalog", id: HERO_START_WEAPON_ID });
  });

  it("НЕ-экипированный инстанс → equipped нетронут, was_equipped=false", () => {
    const a = mk("wi_a", 10, ["pm_frame"]);
    const b = mk("wi_b", 10, ["tt_frame"]);
    const eq: EquippedWeapon = { kind: "crafted", id: "wi_b" };
    const r = disassembleInstance("wi_a", [a, b], [], eq, flatTier);
    expect(r.was_equipped).toBe(false);
    expect(r.equipped_weapon).toEqual(eq);
  });

  it("catalog-экипировка (не crafted) → equipped нетронут", () => {
    const inst = mk("wi_a", 10, ["pm_frame"]);
    const eq: EquippedWeapon = { kind: "catalog", id: "ak74" };
    const r = disassembleInstance("wi_a", [inst], [], eq, flatTier);
    expect(r.was_equipped).toBe(false);
    expect(r.equipped_weapon).toEqual(eq);
  });

  it("forward-compat: deprecated part-id безопасно создаёт стек, не бросает", () => {
    // QA-кейс Алекса: старый сейв, parts менялись между релизами. Берём
    // 1-партовый инстанс (min-1 гарантирует возврат именно его) и проверяем
    // что addToStack не падает на неизвестном id (каталог не валидируется).
    const inst = mk("wi_a", 10, ["legacy_removed_part"]);
    const r = disassembleInstance("wi_a", [inst], [], null, flatTier);
    expect(countInStacks(r.baseStash, "legacy_removed_part")).toBe(1);
  });

  it("defensive: неизвестный instanceId → no-op (входы возвращены, returned_parts пуст)", () => {
    const inst = mk("wi_a", 10, ["pm_frame"]);
    const stash: InventoryStack[] = [{ item_id: "bandage", count: 2 }];
    const eq: EquippedWeapon = { kind: "crafted", id: "wi_a" };
    const r = disassembleInstance("wi_missing", [inst], stash, eq, flatTier);
    expect(r.crafted_weapons.map((w) => w.id)).toEqual(["wi_a"]);
    expect(r.baseStash).toEqual(stash);
    expect(r.equipped_weapon).toEqual(eq);
    expect(r.returned_parts).toEqual([]);
    expect(r.was_equipped).toBe(false);
  });

  it("не мутирует входные массивы (crafted_weapons, baseStash)", () => {
    const inst = mk("wi_a", 10, ["pm_frame"]);
    const crafted = [inst];
    const stash: InventoryStack[] = [{ item_id: "pm_frame", count: 1 }];
    const craftedSnap = JSON.parse(JSON.stringify(crafted));
    const stashSnap = JSON.parse(JSON.stringify(stash));
    disassembleInstance("wi_a", crafted, stash, null, flatTier);
    expect(crafted).toEqual(craftedSnap);
    expect(stash).toEqual(stashSnap);
  });

  it("round_trip_lossy: assembleFromStash → disassembleInstance — MONOTONIC (counts не растут)", () => {
    // M15-PR2: бывший round-trip-anchor намеренно стал лоссовым. Инвариант
    // теперь monotonic (НЕ точное равенство): для каждого id
    // count(after) ≤ count(before), плюс СТРОГО меньше суммарно (доказывает
    // что возврат реально лоссовый, а не вырожденный lossless).
    const original: InventoryStack[] = [
      { item_id: "pm_frame", count: 2 },
      { item_id: "pm_slide", count: 1 },
      { item_id: "mod_grip", count: 3 },
      { item_id: "bandage", count: 5 },
    ];
    const parts = [part("pm_frame"), part("pm_slide"), part("mod_grip")];
    const { instance, nextStash } = assembleFromStash(parts, original, seedRng());
    expect(countInStacks(nextStash, "pm_frame")).toBe(1);
    expect(countInStacks(nextStash, "pm_slide")).toBe(0);
    expect(countInStacks(nextStash, "mod_grip")).toBe(2);

    const r = disassembleInstance(instance.id, [instance], nextStash, null, flatTier);

    const ids = ["pm_frame", "pm_slide", "mod_grip", "bandage"];
    for (const id of ids) {
      expect(countInStacks(r.baseStash, id)).toBeLessThanOrEqual(
        countInStacks(original, id),
      );
    }
    const sumBefore = ids.reduce((s, id) => s + countInStacks(original, id), 0);
    const sumAfter = ids.reduce((s, id) => s + countInStacks(r.baseStash, id), 0);
    expect(sumAfter).toBeLessThan(sumBefore); // строго лоссово
  });
});
