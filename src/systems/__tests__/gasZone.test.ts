import { describe, expect, test } from "vitest";
import { computeGasDamage, playerHasGasMask } from "../gasZone";
import type { PlayerState } from "../../state/types";
import type { Zone } from "../../types";

// M13 PR-6a: gas_mask мигрирован в armor.slot=helm. Тест ставит
// armorId в helm-слот (а не в plate как было в legacy single-slot equip),
// чтобы playerHasGasMask видел его через equipped_armor_ids.helm.
const makePlayer = (armorId: string, backpackItems: string[] = []): PlayerState => ({
  hp: 100,
  hp_max: 100,
  level: 1,
  xp: 0,
  max_weight_kg: 30,
  equipped_weapon: { kind: "catalog", id: "craft_knife" },
  crafted_weapons: [],
  equipped_armor_ids: { helm: armorId },
  perks: [],
  backpack: backpackItems.map((id) => ({ item_id: id, count: 1 })),
  gas: 5,
});

const makeZone = (isGas: boolean, gasDamage: number): Zone => ({
  id: "warehouse",
  name_ru: "Склад",
  level: 2,
  description_ru: "",
  resources: [],
  mobs: [],
  boss_id: null,
  unique_resources: [],
  levels: [
    {
      depth: 2,
      enemies: [],
      enemy_count: [1, 1],
      resources: [],
      resource_count: [0, 0],
      min_player_level: 1,
      is_gas: isGas,
    },
  ],
  unlock_condition: "start",
  gas_damage_per_turn: gasDamage,
});

describe("computeGasDamage", () => {
  test("forest zone without gas returns 0 damage", () => {
    const zone = makeZone(false, 5);
    const player = makePlayer("cloth_jacket");
    expect(computeGasDamage(zone, 2, player)).toBe(0);
  });

  test("gas zone without gas_mask returns gas_damage_per_turn", () => {
    const zone = makeZone(true, 5);
    const player = makePlayer("cloth_jacket");
    expect(computeGasDamage(zone, 2, player)).toBe(5);
  });

  test("gas zone with gas_mask in armor slot returns 0 damage", () => {
    const zone = makeZone(true, 8);
    const player = makePlayer("gas_mask");
    expect(computeGasDamage(zone, 2, player)).toBe(0);
  });
});

describe("playerHasGasMask", () => {
  test("returns true when gas_mask equipped as armor", () => {
    const player = makePlayer("gas_mask");
    expect(playerHasGasMask(player)).toBe(true);
  });

  test("returns true when gas_mask in backpack", () => {
    const player = makePlayer("cloth_jacket", ["gas_mask"]);
    expect(playerHasGasMask(player)).toBe(true);
  });

  test("returns false when no gas_mask", () => {
    const player = makePlayer("cloth_jacket");
    expect(playerHasGasMask(player)).toBe(false);
  });
});
