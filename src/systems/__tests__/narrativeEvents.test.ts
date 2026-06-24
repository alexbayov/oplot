import { describe, expect, test } from "vitest";
import {
  applyNarrativeChoice,
  canSelectNarrativeChoice,
  eligibleNarrativeEvents,
  pickNarrativeEvent,
  resolveNarrativeChoice,
} from "../narrativeEvents";
import { NARRATIVE_EVENT_CHANCE } from "../../state/balance";
import type { NarrativeEvent, NarrativeEventChoice } from "../../state/types";

const FOREST_LOOT: NarrativeEventChoice = {
  id: "loot",
  text: "",
  outcome: { loot: [{ id: "water", n: 4 }] },
};
const SKIP: NarrativeEventChoice = { id: "skip", text: "", outcome: {} };
const HP_HIT: NarrativeEventChoice = {
  id: "hp",
  text: "",
  outcome: { loot: [{ id: "scrap_metal", n: 2 }], hp_delta: -8 },
};
const BANDAGE_UP: NarrativeEventChoice = {
  id: "bandage_up",
  text: "",
  outcome: { consume_item: "bandage", hp_delta: 5 },
};

const FOREST_ONLY: NarrativeEvent = {
  id: "forest_only",
  zones: ["forest"],
  text: "",
  choices: [FOREST_LOOT, SKIP],
};
const WAREHOUSE_CITY: NarrativeEvent = {
  id: "warehouse_city",
  zones: ["warehouse", "city"],
  text: "",
  choices: [HP_HIT],
};
const UNIVERSAL: NarrativeEvent = {
  id: "universal",
  zones: ["*"],
  text: "",
  choices: [BANDAGE_UP],
};
const EVENTS: NarrativeEvent[] = [FOREST_ONLY, WAREHOUSE_CITY, UNIVERSAL];

/** rng-стаб: отдаёт значения по очереди, затем держит последнее. */
const seq = (...vals: number[]): (() => number) => {
  let i = 0;
  return () => vals[Math.min(i++, vals.length - 1)] ?? 0;
};

describe("eligibleNarrativeEvents", () => {
  test("matches zone-specific and universal events", () => {
    const ids = eligibleNarrativeEvents(EVENTS, "warehouse").map((e) => e.id);
    expect(ids).toEqual(["warehouse_city", "universal"]);
  });

  test("forest gets its event plus universal, not warehouse_city", () => {
    const ids = eligibleNarrativeEvents(EVENTS, "forest").map((e) => e.id);
    expect(ids).toEqual(["forest_only", "universal"]);
  });

  test("zone with no specific event still gets universal", () => {
    const ids = eligibleNarrativeEvents(EVENTS, "factory").map((e) => e.id);
    expect(ids).toEqual(["universal"]);
  });
});

describe("pickNarrativeEvent", () => {
  test("frequency gate fails → null (roll >= chance)", () => {
    const rng = seq(NARRATIVE_EVENT_CHANCE + 0.01);
    expect(pickNarrativeEvent(EVENTS, "forest", rng)).toBeNull();
  });

  test("gate passes → uniform pick over eligible pool", () => {
    // roll 0 passes gate; second roll 0 → index 0 of [forest_only, universal].
    expect(pickNarrativeEvent(EVENTS, "forest", seq(0, 0))?.id).toBe("forest_only");
    // second roll near 1 → last index (universal).
    expect(pickNarrativeEvent(EVENTS, "forest", seq(0, 0.99))?.id).toBe("universal");
  });

  test("gate passes but no eligible events → null", () => {
    expect(pickNarrativeEvent([], "forest", seq(0, 0))).toBeNull();
  });
});

describe("canSelectNarrativeChoice", () => {
  const none = () => 0;
  const plenty = () => 5;

  test("choice without consume_item is always selectable", () => {
    expect(canSelectNarrativeChoice(FOREST_LOOT, none)).toBe(true);
  });

  test("consume choice gated on backpack count", () => {
    expect(canSelectNarrativeChoice(BANDAGE_UP, none)).toBe(false);
    expect(canSelectNarrativeChoice(BANDAGE_UP, plenty)).toBe(true);
  });
});

describe("resolveNarrativeChoice", () => {
  test("maps loot {id,n} → {item_id,count} and passes hp_delta", () => {
    const r = resolveNarrativeChoice(WAREHOUSE_CITY, "hp");
    expect(r.loot).toEqual([{ item_id: "scrap_metal", count: 2 }]);
    expect(r.hp_delta).toBe(-8);
    expect(r.consume).toBeNull();
  });

  test("consume_item surfaces with default count 1", () => {
    const r = resolveNarrativeChoice(UNIVERSAL, "bandage_up");
    expect(r.consume).toEqual({ item_id: "bandage", count: 1 });
    expect(r.hp_delta).toBe(5);
  });

  test("empty outcome (skip) and unknown choice → zero delta", () => {
    const zero = { loot: [], hp_delta: 0, consume: null };
    expect(resolveNarrativeChoice(FOREST_ONLY, "skip")).toEqual(zero);
    expect(resolveNarrativeChoice(FOREST_ONLY, "nope")).toEqual(zero);
  });
});

describe("applyNarrativeChoice", () => {
  const base = () => ({
    hp: 50,
    hp_max: 100,
    backpack: [{ item_id: "bandage", count: 2 }],
    pending_loot: [{ item_id: "water", count: 1 }],
  });

  test("loot merges into pending_loot via addToStack", () => {
    const out = applyNarrativeChoice(base(), {
      loot: [{ item_id: "water", count: 4 }, { item_id: "scrap_metal", count: 2 }],
      hp_delta: 0,
      consume: null,
    });
    expect(out.pending_loot).toEqual([
      { item_id: "water", count: 5 },
      { item_id: "scrap_metal", count: 2 },
    ]);
  });

  test("hp_delta heals and clamps to hp_max", () => {
    expect(applyNarrativeChoice(base(), { loot: [], hp_delta: 80, consume: null }).hp).toBe(100);
  });

  test("hp_delta damage clamps to 0", () => {
    expect(applyNarrativeChoice(base(), { loot: [], hp_delta: -80, consume: null }).hp).toBe(0);
  });

  test("consume removes item when enough in backpack", () => {
    const out = applyNarrativeChoice(base(), {
      loot: [],
      hp_delta: 5,
      consume: { item_id: "bandage", count: 1 },
    });
    expect(out.backpack).toEqual([{ item_id: "bandage", count: 1 }]);
    expect(out.hp).toBe(55);
  });

  test("consume is a no-op when backpack lacks the item; other effects still apply", () => {
    const out = applyNarrativeChoice(base(), {
      loot: [{ item_id: "fuel", count: 1 }],
      hp_delta: 5,
      consume: { item_id: "medkit", count: 1 },
    });
    expect(out.backpack).toEqual([{ item_id: "bandage", count: 2 }]);
    expect(out.pending_loot.some((s) => s.item_id === "fuel")).toBe(true);
    expect(out.hp).toBe(55);
  });

  test("does not mutate the input slice", () => {
    const input = base();
    applyNarrativeChoice(input, {
      loot: [{ item_id: "water", count: 9 }],
      hp_delta: -10,
      consume: { item_id: "bandage", count: 2 },
    });
    expect(input.hp).toBe(50);
    expect(input.backpack).toEqual([{ item_id: "bandage", count: 2 }]);
    expect(input.pending_loot).toEqual([{ item_id: "water", count: 1 }]);
  });
});
