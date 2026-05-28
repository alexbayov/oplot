import { describe, expect, test, beforeEach } from "vitest";
import {
  CombatEngine,
  createActor,
  createState,
} from "../combatEngine";
import {
  setM11Items,
  clearRegistry,
  createWeaponInstance,
} from "../../state/ItemRegistry";
import type {
  CraftWeapon,
  DropWeapon,
  WeaponPart,
} from "../../types/items";

const knife: CraftWeapon = {
  id: "craft_knife",
  itemClass: "craft",
  tier: 1,
  name_real_ru: "Нож",
  name_generic_ru: "Нож",
  weight_kg: 0.4,
  description_ru: "",
  damageMin: 4,
  damageMax: 4,
  noise: "silent",
  durability: 50,
  breaksInto: "broken_craft_knife",
  caliber: "melee",
};

const pm: DropWeapon = {
  id: "pistol_t2_pm",
  itemClass: "drop",
  tier: 2,
  name_real_ru: "ПМ",
  name_generic_ru: "Пистолет",
  weight_kg: 0.8,
  description_ru: "",
  damageMin: 5,
  damageMax: 5,
  caliber: "9x18",
  noise: "high",
  magazineSize: 8,
  modSlots: ["muzzle"],
  partIds: ["pm_frame", "pm_slide", "pm_magazine"],
};

const pmParts: WeaponPart[] = ["pm_frame", "pm_slide", "pm_magazine"].map(
  (id) => ({
    id,
    itemClass: "part",
    tier: 2,
    name_real_ru: id,
    name_generic_ru: id,
    weight_kg: 0.1,
    description_ru: "",
    weaponId: "pistol_t2_pm",
    slot: (id.split("_")[1] ?? "frame") as WeaponPart["slot"],
  } satisfies WeaponPart),
);

beforeEach(() => {
  clearRegistry();
  setM11Items([knife, pm, ...pmParts]);
});

describe("CombatEngine — turn lifecycle", () => {
  test("startTurn инициализирует initiativeOrder с героем впереди", () => {
    const hero = createActor({
      id: "hero",
      kind: "hero",
      nameRu: "Игрок",
      maxHp: 100,
      equipped: null,
    });
    const mob = createActor({
      id: "marauder1",
      kind: "mob",
      nameRu: "Мародёр",
      maxHp: 20,
    });
    const state = createState({
      zoneId: "forest",
      scenario: "test",
      actors: [hero, mob],
    });
    const engine = new CombatEngine(state, () => 0.5);

    const ctx = engine.startTurn();
    expect(ctx.turn).toBe(1);
    expect(state.initiativeOrder).toEqual(["hero", "marauder1"]);
    expect(state.activeActorId).toBe("hero");
  });

  test("startTurn пропускает мёртвых мобов", () => {
    const hero = createActor({ id: "h", kind: "hero", nameRu: "H", maxHp: 100 });
    const deadMob = createActor({ id: "m1", kind: "mob", nameRu: "M1", maxHp: 10, hp: 0 });
    const aliveMob = createActor({ id: "m2", kind: "mob", nameRu: "M2", maxHp: 10 });
    const state = createState({ zoneId: "f", scenario: "test", actors: [hero, deadMob, aliveMob] });
    const engine = new CombatEngine(state, () => 0.5);

    engine.startTurn();
    expect(state.initiativeOrder).toEqual(["h", "m2"]);
  });
});

describe("CombatEngine — resolveHeroAction attack", () => {
  test("атака мили оружием наносит урон цели", () => {
    const knifeInst = createWeaponInstance("craft_knife", [], () => 0.5);
    const hero = createActor({
      id: "h",
      kind: "hero",
      nameRu: "H",
      maxHp: 100,
      equipped: knifeInst,
    });
    const mob = createActor({ id: "m", kind: "mob", nameRu: "M", maxHp: 20 });
    const state = createState({ zoneId: "f", scenario: "test", actors: [hero, mob] });
    const engine = new CombatEngine(state, () => 0.5);

    engine.startTurn();
    const result = engine.resolveHeroAction({
      actorId: "h",
      kind: "attack",
      targetId: "m",
    });
    expect(result.ok).toBe(true);
    expect(mob.hp).toBe(16);
    expect(state.log.some((e) => e.kind === "attack")).toBe(true);
  });

  test("атака ranged оружием тратит магазин", () => {
    const pmInst = createWeaponInstance("pistol_t2_pm", pmParts, () => 0.5);
    const hero = createActor({
      id: "h",
      kind: "hero",
      nameRu: "H",
      maxHp: 100,
      equipped: pmInst,
      magazineMax: 8,
    });
    const mob = createActor({ id: "m", kind: "mob", nameRu: "M", maxHp: 20 });
    const state = createState({ zoneId: "f", scenario: "test", actors: [hero, mob] });
    const engine = new CombatEngine(state, () => 0.5);

    engine.startTurn();
    engine.resolveHeroAction({ actorId: "h", kind: "attack", targetId: "m" });
    expect(hero.magazine).toBe(7);
  });

  test("атака с пустым магазином → failure с просьбой перезарядить", () => {
    const pmInst = createWeaponInstance("pistol_t2_pm", pmParts, () => 0.5);
    const hero = createActor({
      id: "h",
      kind: "hero",
      nameRu: "H",
      maxHp: 100,
      equipped: pmInst,
      magazineMax: 8,
    });
    hero.magazine = 0;
    const mob = createActor({ id: "m", kind: "mob", nameRu: "M", maxHp: 20 });
    const state = createState({ zoneId: "f", scenario: "test", actors: [hero, mob] });
    const engine = new CombatEngine(state, () => 0.5);

    engine.startTurn();
    const result = engine.resolveHeroAction({ actorId: "h", kind: "attack", targetId: "m" });
    expect(result.ok).toBe(false);
    expect(result.reasonRu).toContain("Магазин");
    expect(mob.hp).toBe(20);
  });

  test("атака мёртвой цели → failure", () => {
    const knifeInst = createWeaponInstance("craft_knife", [], () => 0.5);
    const hero = createActor({ id: "h", kind: "hero", nameRu: "H", maxHp: 100, equipped: knifeInst });
    const mob = createActor({ id: "m", kind: "mob", nameRu: "M", maxHp: 10, hp: 0 });
    const state = createState({ zoneId: "f", scenario: "test", actors: [hero, mob] });
    const engine = new CombatEngine(state, () => 0.5);

    engine.startTurn();
    const result = engine.resolveHeroAction({ actorId: "h", kind: "attack", targetId: "m" });
    expect(result.ok).toBe(false);
  });

  test("убийство моба логируется и rosterChanged=true", () => {
    const knifeInst = createWeaponInstance("craft_knife", [], () => 0.5);
    const hero = createActor({ id: "h", kind: "hero", nameRu: "H", maxHp: 100, equipped: knifeInst });
    const mob = createActor({ id: "m", kind: "mob", nameRu: "M", maxHp: 3 });
    const state = createState({ zoneId: "f", scenario: "test", actors: [hero, mob] });
    const engine = new CombatEngine(state, () => 0.5);

    engine.startTurn();
    const result = engine.resolveHeroAction({ actorId: "h", kind: "attack", targetId: "m" });
    expect(result.ok).toBe(true);
    expect(mob.hp).toBe(0);
    expect(result.rosterChanged).toBe(true);
    expect(state.log.some((e) => e.kind === "kill")).toBe(true);
  });
});

describe("CombatEngine — endTurn phases & status", () => {
  test("checkPhaseTransition переводит моба в фазу 2 при <=50% HP", () => {
    const hero = createActor({ id: "h", kind: "hero", nameRu: "H", maxHp: 100 });
    const mob = createActor({ id: "m", kind: "mob", nameRu: "M", maxHp: 100, hp: 40 });
    const state = createState({ zoneId: "f", scenario: "test", actors: [hero, mob] });
    const engine = new CombatEngine(state, () => 0.5);

    engine.endTurn();
    expect(mob.phase).toBe(2);
    expect(state.log.some((e) => e.kind === "phase_shift")).toBe(true);
  });

  test("tickStatuses уменьшает remaining и снимает истёкшие", () => {
    const hero = createActor({ id: "h", kind: "hero", nameRu: "H", maxHp: 100 });
    hero.statuses = [
      { id: "bleed", remaining: 2, source: "knife", stacks: 1 },
      { id: "stun", remaining: 1, source: "club", stacks: 1 },
      { id: "frenzy", remaining: -1, source: "perk", stacks: 1 },
    ];
    const state = createState({ zoneId: "f", scenario: "test", actors: [hero] });
    const engine = new CombatEngine(state, () => 0.5);

    engine.endTurn();
    const ids = hero.statuses.map((s) => s.id);
    expect(ids).toEqual(["bleed", "frenzy"]);
    const bleed = hero.statuses[0];
    expect(bleed?.remaining).toBe(1);
  });

  test("endTurn возвращает victory когда все мобы мертвы", () => {
    const hero = createActor({ id: "h", kind: "hero", nameRu: "H", maxHp: 100 });
    const mob = createActor({ id: "m", kind: "mob", nameRu: "M", maxHp: 10, hp: 0 });
    const state = createState({ zoneId: "f", scenario: "test", actors: [hero, mob] });
    const engine = new CombatEngine(state, () => 0.5);

    const result = engine.endTurn();
    expect(result.combatEnded).toBe(true);
    expect(result.outcome).toBe("victory");
  });

  test("endTurn возвращает defeat когда герой мёртв", () => {
    const hero = createActor({ id: "h", kind: "hero", nameRu: "H", maxHp: 100, hp: 0 });
    const mob = createActor({ id: "m", kind: "mob", nameRu: "M", maxHp: 10 });
    const state = createState({ zoneId: "f", scenario: "test", actors: [hero, mob] });
    const engine = new CombatEngine(state, () => 0.5);

    const result = engine.endTurn();
    expect(result.combatEnded).toBe(true);
    expect(result.outcome).toBe("defeat");
  });
});

describe("CombatEngine — stub actions", () => {
  test("ability/reload/consumable/move/cover возвращают failure (готовы к M12.0b+)", () => {
    const hero = createActor({ id: "h", kind: "hero", nameRu: "H", maxHp: 100 });
    const state = createState({ zoneId: "f", scenario: "test", actors: [hero] });
    const engine = new CombatEngine(state, () => 0.5);
    engine.startTurn();

    for (const kind of ["ability", "reload", "consumable", "move", "cover"] as const) {
      const r = engine.resolveHeroAction({ actorId: "h", kind });
      expect(r.ok).toBe(false);
      expect(r.reasonRu).toContain("M12");
    }
  });
});
