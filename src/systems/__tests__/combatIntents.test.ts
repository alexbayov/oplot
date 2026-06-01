import { describe, expect, test } from "vitest";
import { deriveVisibleEnemyIntent } from "../combatIntents";
import { createMobRuntimeState } from "../mobAI";
import type { Mob } from "../../types";

const makeTestMob = (overrides: Partial<Mob> = {}): Mob => ({
  id: "test-mob",
  name_ru: "Тест-Моб",
  type: "human",
  role: "regular",
  zone: "forest",
  level: 1,
  hp: 20,
  damage_min: 5,
  damage_max: 8,
  defense: 1,
  base_speed: 90,
  xp_reward: 10,
  behavior: "aggressive",
  description_ru: "",
  flavor_ru: "",
  drop_table: [],
  drops: [],
  ...overrides,
});

describe("combatIntents pure adapter", () => {
  test("no behavior_id / aggressive fallback maps to attack", () => {
    const mob = makeTestMob({ behavior_id: undefined });
    const state = createMobRuntimeState(mob);
    const result = deriveVisibleEnemyIntent(mob, state);

    expect(result.intent).toBe("attack");
    expect(result.labelRu).toBe("атака");
    expect(result.confidence).toBe("fallback");
  });

  test("ranged_keep_distance maps to attack with correct label and detail", () => {
    const mob = makeTestMob({ behavior_id: "ranged_keep_distance" });
    const state = createMobRuntimeState(mob);
    const result = deriveVisibleEnemyIntent(mob, state);

    expect(result.intent).toBe("attack");
    expect(result.labelRu).toBe("дальняя атака");
    expect(result.detailRu).toBe("удерживает дистанцию");
    expect(result.confidence).toBe("likely");
  });

  test("armor_piercing_ranged maps to attack with correct label and detail", () => {
    const mob = makeTestMob({ behavior_id: "armor_piercing_ranged" });
    const state = createMobRuntimeState(mob);
    const result = deriveVisibleEnemyIntent(mob, state);

    expect(result.intent).toBe("attack");
    expect(result.labelRu).toBe("бронебойная атака");
    expect(result.detailRu).toBe("игнорирует часть защиты");
    expect(result.confidence).toBe("likely");
  });

  test("pack_bonus_when_paired maps to attack with correct label and detail", () => {
    const mob = makeTestMob({ behavior_id: "pack_bonus_when_paired" });
    const state = createMobRuntimeState(mob);
    const result = deriveVisibleEnemyIntent(mob, state);

    expect(result.intent).toBe("attack");
    expect(result.labelRu).toBe("стайная атака");
    expect(result.detailRu).toBe("опаснее в группе");
    expect(result.confidence).toBe("likely");
  });

  test("defensive_cover maps dynamically to cover or attack", () => {
    const mob = makeTestMob({ behavior_id: "defensive_cover" });
    const state = createMobRuntimeState(mob);

    // Initial turn_count = 0.
    // Next turn count is 1 -> odd -> attack.
    const result1 = deriveVisibleEnemyIntent(mob, state);
    expect(result1.intent).toBe("attack");

    // If turn_count is 1, next turn count is 2 -> even -> cover.
    state.turn_count = 1;
    const result2 = deriveVisibleEnemyIntent(mob, state);
    expect(result2.intent).toBe("guard_cover");
    expect(result2.labelRu).toBe("укрытие");
  });

  test("berserker_low_hp maps dynamically to attack or special", () => {
    const mob = makeTestMob({ behavior_id: "berserker_low_hp" });
    const state = createMobRuntimeState(mob);

    // High HP -> attack
    const result1 = deriveVisibleEnemyIntent(mob, state);
    expect(result1.intent).toBe("attack");
    expect(result1.labelRu).toBe("атака");

    // Low HP (< 50%) -> special (rage)
    state.hp = 9; // 9/20 < 0.5
    const result2 = deriveVisibleEnemyIntent(mob, state);
    expect(result2.intent).toBe("special");
    expect(result2.labelRu).toBe("ярость");
    expect(result2.detailRu).toBe("атака усилена"); // asserts it does not imply a non-attack mechanic
  });

  test("fled state maps to flee", () => {
    const mob = makeTestMob();
    const state = createMobRuntimeState(mob);
    state.fled = true;
    const result = deriveVisibleEnemyIntent(mob, state);

    expect(result.intent).toBe("flee");
    expect(result.labelRu).toBe("сбежал");
    expect(result.confidence).toBe("known");
  });

  test("marauder below flee threshold maps to flee", () => {
    const mob = makeTestMob({ id: "marauder" });
    const state = createMobRuntimeState(mob);
    state.hp = 5; // 5/20 = 25% < 30% threshold
    const result = deriveVisibleEnemyIntent(mob, state);

    expect(result.intent).toBe("flee");
    expect(result.labelRu).toBe("побег");
    expect(result.confidence).toBe("likely");
  });

  test("boss role maps to special and mentions boss threat/phase", () => {
    const mob = makeTestMob({ role: "boss", phase_threshold: 0.5 });
    const state = createMobRuntimeState(mob);

    const result1 = deriveVisibleEnemyIntent(mob, state);
    expect(result1.intent).toBe("special");
    expect(result1.labelRu).toBe("особое");
    expect(result1.detailRu).toBe("босс: особая угроза");

    // Boss in phase 2
    state.phase = 2;
    const result2 = deriveVisibleEnemyIntent(mob, state);
    expect(result2.intent).toBe("special");
    expect(result2.detailRu).toBe("босс: угроза фазы 2");
  });

  test("unknown behavior_id maps to attack fallback", () => {
    const mob = makeTestMob({ behavior_id: "unknown_id" as unknown as undefined });
    const state = createMobRuntimeState(mob);
    const result = deriveVisibleEnemyIntent(mob, state);

    expect(result.intent).toBe("attack");
    expect(result.labelRu).toBe("атака");
    expect(result.confidence).toBe("fallback");
  });

  test("does not mutate inputs", () => {
    const mob = makeTestMob({ id: "marauder", role: "boss", behavior_id: "berserker_low_hp" });
    const state = createMobRuntimeState(mob);

    const mobClone = JSON.parse(JSON.stringify(mob));
    const stateClone = JSON.parse(JSON.stringify(state));

    deriveVisibleEnemyIntent(mob, state);

    expect(mob).toEqual(mobClone);
    expect(state).toEqual(stateClone);
  });
});
