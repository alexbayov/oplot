import { describe, expect, test } from "vitest";
import {
  chooseMobActionV2,
  createMobRuntimeState,
} from "../mobAI";
import { MARAUDER_FLEE_HP_RATIO } from "../../state/balance";
import { item, mob } from "./_helpers";

const aliveAlly = (
  id: string,
  hp: number,
  behavior_id?: string,
) => {
  const m = behavior_id !== undefined ? mob(id, { behavior_id }) : mob(id);
  const s = createMobRuntimeState(m);
  s.hp = hp;
  return { mob: m, state: s };
};

describe("createMobRuntimeState", () => {
  test("captures damage/speed snapshot from Mob", () => {
    const m = mob("looter_sniper", {
      hp: 22,
      damage_min: 9,
      damage_max: 13,
      base_speed: 95,
    });
    const s = createMobRuntimeState(m);
    expect(s.hp).toBe(22);
    expect(s.hp_max).toBe(22);
    expect(s.damage_min).toBe(9);
    expect(s.damage_max).toBe(13);
    expect(s.base_speed).toBe(95);
    expect(s.turn_count).toBe(0);
    expect(s.berserk_triggered).toBe(false);
    expect(s.cover_active).toBe(false);
  });
});

describe("chooseMobActionV2 — M1 fallback (no behavior_id)", () => {
  test("marauder flees below 30% HP", () => {
    const m = mob("marauder", { hp: 20 });
    const s = createMobRuntimeState(m);
    s.hp = 5;
    expect(
      chooseMobActionV2({
        mob: m,
        state: s,
        allies: [],
        heroEquippedWeapon: null,
      }),
    ).toEqual({ kind: "flee" });
  });

  test("marauder attacks above flee threshold", () => {
    const m = mob("marauder", { hp: 20 });
    const s = createMobRuntimeState(m);
    s.hp = 20 * MARAUDER_FLEE_HP_RATIO + 1;
    expect(
      chooseMobActionV2({
        mob: m,
        state: s,
        allies: [],
        heroEquippedWeapon: null,
      }),
    ).toMatchObject({ kind: "attack", damage_multiplier: 1, ignore_armor_defense: false });
  });

  test("mutant always attacks (plain)", () => {
    const m = mob("mutant", { hp: 40, type: "mutant" });
    const s = createMobRuntimeState(m);
    s.hp = 1;
    expect(
      chooseMobActionV2({
        mob: m,
        state: s,
        allies: [],
        heroEquippedWeapon: null,
      }),
    ).toMatchObject({ kind: "attack", damage_multiplier: 1, ignore_armor_defense: false });
  });
});

describe("ranged_keep_distance — looter_sniper (GDD §5.4.1)", () => {
  const m = mob("looter_sniper", { behavior_id: "ranged_keep_distance" });

  test("×0.5 damage when hero holds a melee weapon", () => {
    const knife = item("knife", "weapon_melee", 0.5);
    const action = chooseMobActionV2({
      mob: m,
      state: createMobRuntimeState(m),
      allies: [],
      heroEquippedWeapon: knife,
    });
    expect(action).toMatchObject({ kind: "attack", damage_multiplier: 0.5, ignore_armor_defense: false });
  });

  test("×1.0 damage when hero holds a ranged weapon", () => {
    const pistol = item("makeshift_pistol", "weapon_ranged", 1.5);
    const action = chooseMobActionV2({
      mob: m,
      state: createMobRuntimeState(m),
      allies: [],
      heroEquippedWeapon: pistol,
    });
    expect(action).toMatchObject({ kind: "attack", damage_multiplier: 1, ignore_armor_defense: false });
  });

  test("×1.0 damage when hero has no weapon equipped", () => {
    const action = chooseMobActionV2({
      mob: m,
      state: createMobRuntimeState(m),
      allies: [],
      heroEquippedWeapon: null,
    });
    expect(action).toMatchObject({ kind: "attack", damage_multiplier: 1 });
  });
});

describe("defensive_cover — armored_guard (GDD §5.4.2)", () => {
  const m = mob("armored_guard", { behavior_id: "defensive_cover" });

  test("alternates attack(turn 1) → cover(turn 2) → attack(turn 3) → cover(turn 4)", () => {
    const s = createMobRuntimeState(m);
    const ctx = { mob: m, state: s, allies: [], heroEquippedWeapon: null };
    const a1 = chooseMobActionV2(ctx);
    expect(a1).toMatchObject({ kind: "attack" });
    expect(s.turn_count).toBe(1);
    expect(s.cover_active).toBe(false);
    const a2 = chooseMobActionV2(ctx);
    expect(a2).toEqual({ kind: "cover" });
    expect(s.turn_count).toBe(2);
    expect(s.cover_active).toBe(true);
    const a3 = chooseMobActionV2(ctx);
    expect(a3).toMatchObject({ kind: "attack" });
    expect(s.cover_active).toBe(false);
    const a4 = chooseMobActionV2(ctx);
    expect(a4).toEqual({ kind: "cover" });
    expect(s.cover_active).toBe(true);
  });
});

describe("berserker_low_hp — fanatic_berserker (GDD §5.4.3)", () => {
  const baseMob = mob("fanatic_berserker", {
    behavior_id: "berserker_low_hp",
    hp: 40,
    damage_min: 8,
    damage_max: 12,
    base_speed: 100,
  });

  test("no trigger above 50% HP — original stats intact", () => {
    const s = createMobRuntimeState(baseMob);
    s.hp = 25; // 25/40 = 0.625, above threshold
    chooseMobActionV2({ mob: baseMob, state: s, allies: [], heroEquippedWeapon: null });
    expect(s.berserk_triggered).toBe(false);
    expect(s.damage_min).toBe(8);
    expect(s.damage_max).toBe(12);
    expect(s.base_speed).toBe(100);
  });

  test("triggers below 50% HP: damage ×2, base_speed −30, single-shot", () => {
    const s = createMobRuntimeState(baseMob);
    s.hp = 19; // 19/40 = 0.475 < 0.5
    const a = chooseMobActionV2({
      mob: baseMob,
      state: s,
      allies: [],
      heroEquippedWeapon: null,
    });
    expect(a).toMatchObject({ kind: "attack" });
    expect(s.berserk_triggered).toBe(true);
    expect(s.damage_min).toBe(16);
    expect(s.damage_max).toBe(24);
    expect(s.base_speed).toBe(70);
    // Second turn at even lower HP must NOT re-trigger.
    s.hp = 5;
    chooseMobActionV2({ mob: baseMob, state: s, allies: [], heroEquippedWeapon: null });
    expect(s.damage_min).toBe(16);
    expect(s.damage_max).toBe(24);
    expect(s.base_speed).toBe(70);
  });

  test("base_speed never goes below 0", () => {
    const slowMob = mob("fanatic_berserker", {
      behavior_id: "berserker_low_hp",
      hp: 40,
      damage_min: 8,
      damage_max: 12,
      base_speed: 20,
    });
    const s = createMobRuntimeState(slowMob);
    s.hp = 10;
    chooseMobActionV2({
      mob: slowMob,
      state: s,
      allies: [],
      heroEquippedWeapon: null,
    });
    expect(s.base_speed).toBe(0);
  });
});

describe("pack_bonus_when_paired — pack_rat (GDD §5.4.4)", () => {
  const PACK = "pack_bonus_when_paired";

  test("×1.5 damage when ≥ 2 living pack_rat allies (counting self)", () => {
    const self = aliveAlly("pack_rat", 15, PACK);
    const buddy = aliveAlly("pack_rat", 15, PACK);
    const action = chooseMobActionV2({
      mob: self.mob,
      state: self.state,
      allies: [self, buddy],
      heroEquippedWeapon: null,
    });
    expect(action).toMatchObject({ kind: "attack", damage_multiplier: 1.5 });
  });

  test("×1.0 damage when alone (buddy dead)", () => {
    const self = aliveAlly("pack_rat", 15, PACK);
    const dead = aliveAlly("pack_rat", 0, PACK);
    const action = chooseMobActionV2({
      mob: self.mob,
      state: self.state,
      allies: [self, dead],
      heroEquippedWeapon: null,
    });
    expect(action).toMatchObject({ kind: "attack", damage_multiplier: 1.0 });
  });

  test("non-pack_rat allies don't count toward synergy", () => {
    const self = aliveAlly("pack_rat", 15, PACK);
    const drone = aliveAlly("relic_drone", 28, "armor_piercing_ranged");
    const action = chooseMobActionV2({
      mob: self.mob,
      state: self.state,
      allies: [self, drone],
      heroEquippedWeapon: null,
    });
    expect(action).toMatchObject({ kind: "attack", damage_multiplier: 1.0 });
  });
});

describe("armor_piercing_ranged — relic_drone (GDD §5.4.5)", () => {
  const m = mob("relic_drone", {
    behavior_id: "armor_piercing_ranged",
    type: "mech",
  });

  test("attack ignores target's armor.defense", () => {
    const action = chooseMobActionV2({
      mob: m,
      state: createMobRuntimeState(m),
      allies: [],
      heroEquippedWeapon: null,
    });
    expect(action).toMatchObject({
      kind: "attack",
      damage_multiplier: 1.0,
      ignore_armor_defense: true,
    });
  });
});

describe("unknown behavior_id — soft fallback", () => {
  test("plain attack, no crash", () => {
    const m = mob("ghost_mob", { behavior_id: "definitely_not_real_yet" });
    const action = chooseMobActionV2({
      mob: m,
      state: createMobRuntimeState(m),
      allies: [],
      heroEquippedWeapon: null,
    });
    expect(action).toMatchObject({ kind: "attack", damage_multiplier: 1, ignore_armor_defense: false });
  });
});
