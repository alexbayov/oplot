import { describe, expect, test } from "vitest";
import type { SortieState } from "../../state/types";
import type { Mob } from "../../types";
import { buildCombatStateSnapshot } from "../combatAdapter";
import type { MobRuntimeState } from "../mobAI";

const makeMob = (id: string, nameRu: string, overrides: Partial<Mob> = {}): Mob => ({
  id,
  name_ru: nameRu,
  type: "human",
  role: "regular",
  zone: "forest",
  level: 1,
  hp: 20,
  damage_min: 2,
  damage_max: 4,
  defense: 1,
  base_speed: 50,
  xp_reward: 5,
  behavior: "aggressive",
  description_ru: "Test mob",
  flavor_ru: "",
  drop_table: [],
  ...overrides,
});

const makeRuntime = (overrides: Partial<MobRuntimeState> = {}): MobRuntimeState => ({
  hp: 12,
  hp_max: 20,
  damage_min: 2,
  damage_max: 4,
  base_speed: 50,
  fled: false,
  turn_count: 0,
  berserk_triggered: false,
  cover_active: false,
  phase: 1,
  phase_transition_done: false,
  ...overrides,
});

const makeSortie = (overrides: Partial<SortieState> = {}): SortieState => ({
  zone_id: "forest",
  depth: 1,
  fights_total: 2,
  fights_completed: 0,
  encounters: [["marauder", "guard"]],
  zone_loot_remaining: [],
  pending_loot: [],
  cover_active: false,
  ...overrides,
});

describe("buildCombatStateSnapshot", () => {
  test("creates exactly one hero actor and one actor per current mob", () => {
    const state = buildCombatStateSnapshot({
      sortie: makeSortie(),
      player: { hp: 80, hp_max: 100, nameRu: "Игрок" },
      mobs: [
        { mob: makeMob("marauder", "Мародёр"), state: makeRuntime() },
        { mob: makeMob("guard", "Охранник"), state: makeRuntime({ hp: 18, hp_max: 25 }) },
      ],
    });

    expect(state.actors).toHaveLength(3);
    expect(state.actors.filter((actor) => actor.kind === "hero")).toHaveLength(1);
    expect(state.actors.filter((actor) => actor.kind === "mob")).toHaveLength(2);
    expect(state.zoneId).toBe("forest");
    expect(state.scenario).toBe("sortie");
  });

  test("uses stable actor ids traceable to hero and mob indexes", () => {
    const state = buildCombatStateSnapshot({
      sortie: makeSortie(),
      player: { hp: 80, hp_max: 100 },
      mobs: [
        { mob: makeMob("marauder", "Мародёр"), state: makeRuntime() },
        { mob: makeMob("guard", "Охранник"), state: makeRuntime() },
      ],
    });

    expect(state.actors.map((actor) => actor.id)).toEqual([
      "hero",
      "mob:0:marauder",
      "mob:1:guard",
    ]);
    expect(state.targetId).toBe("mob:0:marauder");
  });

  test("maps hp, maxHp, names, cover flags, and phase predictably", () => {
    const state = buildCombatStateSnapshot({
      sortie: makeSortie({ cover_active: true }),
      player: { hp: 44, hp_max: 90, nameRu: "Сталкер" },
      mobs: [
        {
          mob: makeMob("boss", "Босс", { role: "boss" }),
          state: makeRuntime({ hp: 7, hp_max: 30, cover_active: true, phase: 2 }),
        },
      ],
    });

    const hero = state.actors.find((actor) => actor.id === "hero");
    const boss = state.actors.find((actor) => actor.id === "mob:0:boss");

    expect(hero).toMatchObject({
      kind: "hero",
      nameRu: "Сталкер",
      hp: 44,
      maxHp: 90,
      coverActive: true,
      phase: 1,
    });
    expect(boss).toMatchObject({
      kind: "mob",
      nameRu: "Босс",
      hp: 7,
      maxHp: 30,
      coverActive: true,
      phase: 2,
    });
  });

  test("documents M12.5 adapter defaults", () => {
    const state = buildCombatStateSnapshot({
      sortie: makeSortie(),
      player: { hp: 80, hp_max: 100 },
      mobs: [{ mob: makeMob("marauder", "Мародёр"), state: makeRuntime() }],
    });

    for (const actor of state.actors) {
      expect(actor.position).toBe("mid");
      expect(actor.statuses).toEqual([]);
      expect(actor.cooldowns).toEqual({});
      expect(actor.telegraph).toBeNull();
    }
    expect(state.initiativeOrder).toEqual([]);
    expect(state.activeActorId).toBeNull();
    expect(state.environment).toEqual([]);
    expect(state.log).toEqual([]);
  });

  test("missing optional data fails soft with safe defaults", () => {
    const state = buildCombatStateSnapshot({
      sortie: null,
      player: { hp: Number.NaN, hp_max: 0 },
      mobs: [
        {
          mob: makeMob("", ""),
          state: makeRuntime({ hp: Number.NaN, hp_max: 0 }),
        },
      ],
    });

    expect(state.zoneId).toBe("unknown");
    expect(state.targetId).toBe("mob:0:");
    expect(state.actors[0]).toMatchObject({
      id: "hero",
      nameRu: "Герой",
      hp: 0,
      maxHp: 1,
      coverActive: false,
    });
    expect(state.actors[1]).toMatchObject({
      id: "mob:0:",
      nameRu: "Моб 1",
      hp: 20,
      maxHp: 20,
      coverActive: false,
    });
  });

  test("does not mutate sortie, player, mob, or runtime state inputs", () => {
    const sortie = makeSortie({ cover_active: true });
    const player = { hp: 80, hp_max: 100, nameRu: "Игрок" };
    const mob = makeMob("marauder", "Мародёр");
    const runtime = makeRuntime({ hp: 10, cover_active: true, berserk_triggered: true });
    const before = JSON.stringify({ sortie, player, mob, runtime });

    buildCombatStateSnapshot({
      sortie,
      player,
      mobs: [{ mob, state: runtime }],
    });

    expect(JSON.stringify({ sortie, player, mob, runtime })).toBe(before);
  });
});
