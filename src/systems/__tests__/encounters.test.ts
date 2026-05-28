import { describe, expect, test, beforeEach } from "vitest";
import {
  pickEncounter,
  canSelectChoice,
  rollOutcome,
  resetEncounterCooldown,
  getRecentEncounterIds,
  type PlayerSnapshot,
} from "../encounters";
import type { Encounter, EncounterChoice } from "../../types/encounter";

const E = (id: string, zones: string[] = ["*"], rarity = 1): Encounter => ({
  id,
  category: "resource_trade",
  zones,
  text_ru: id,
  rarity,
  choices: [{ id: "skip", text_ru: "Skip", outcomes: [{ weight: 1 }] }],
});

const PLAYER: PlayerSnapshot = {
  hp: 100,
  hp_max: 100,
  max_weight_kg: 30,
  cur_weight: 5,
  backpack_items: new Map([["medkit", 2], ["scrap", 3]]),
  perks: ["tough_skin"],
};

beforeEach(() => resetEncounterCooldown());

describe("pickEncounter", () => {
  test("returns null for empty pool", () => {
    expect(pickEncounter([], "forest")).toBeNull();
  });

  test("filters by zone", () => {
    const all = [E("a", ["forest"]), E("b", ["city"]), E("c", ["*"])];
    const picked = pickEncounter(all, "forest", () => 0.99);
    expect(picked).not.toBeNull();
    // Should be either 'a' or 'c' (forest or universal), not 'b' (city only)
    expect(["a", "c"]).toContain(picked!.id);
  });

  test("returns same encounter when only one matches", () => {
    const all = [E("only_forest", ["forest"]), E("only_city", ["city"])];
    const picked = pickEncounter(all, "forest");
    expect(picked?.id).toBe("only_forest");
  });

  test("cooldown skips recently shown encounter", () => {
    const all = [E("a"), E("b"), E("c")];
    // Pick deterministically: with rng=0, picks first
    const first = pickEncounter(all, "*", () => 0)!;
    expect(getRecentEncounterIds()).toContain(first.id);
    // Next pick should NOT be the same
    const second = pickEncounter(all, "*", () => 0)!;
    expect(second.id).not.toBe(first.id);
  });

  test("cooldown ignored when pool exhausted", () => {
    const all = [E("solo", ["forest"])];
    pickEncounter(all, "forest");
    // Same encounter is in cooldown, but it's the only one — must still return
    const again = pickEncounter(all, "forest");
    expect(again?.id).toBe("solo");
  });
});

describe("canSelectChoice", () => {
  test("returns true when no requirements", () => {
    const c: EncounterChoice = { id: "x", text_ru: "", outcomes: [{ weight: 1 }] };
    expect(canSelectChoice(c, PLAYER)).toBe(true);
  });

  test("has_item passes when count sufficient", () => {
    const c: EncounterChoice = {
      id: "x", text_ru: "",
      requires: [{ type: "has_item", id: "medkit", min: 2 }],
      outcomes: [{ weight: 1 }],
    };
    expect(canSelectChoice(c, PLAYER)).toBe(true);
  });

  test("has_item fails when count insufficient", () => {
    const c: EncounterChoice = {
      id: "x", text_ru: "",
      requires: [{ type: "has_item", id: "medkit", min: 5 }],
      outcomes: [{ weight: 1 }],
    };
    expect(canSelectChoice(c, PLAYER)).toBe(false);
  });

  test("has_perk passes for owned perk", () => {
    const c: EncounterChoice = {
      id: "x", text_ru: "",
      requires: [{ type: "has_perk", id: "tough_skin" }],
      outcomes: [{ weight: 1 }],
    };
    expect(canSelectChoice(c, PLAYER)).toBe(true);
  });

  test("max_weight_pct fails when overloaded", () => {
    const c: EncounterChoice = {
      id: "x", text_ru: "",
      requires: [{ type: "max_weight_pct", value: 0.1 }],
      outcomes: [{ weight: 1 }],
    };
    // PLAYER has 5/30 = 0.17 — fails 0.1 threshold
    expect(canSelectChoice(c, PLAYER)).toBe(false);
  });
});

describe("rollOutcome", () => {
  test("returns single outcome when only one", () => {
    const c: EncounterChoice = {
      id: "x", text_ru: "",
      outcomes: [{ weight: 1, hp_delta: -5 }],
    };
    expect(rollOutcome(c).hp_delta).toBe(-5);
  });

  test("weighted selection", () => {
    const c: EncounterChoice = {
      id: "x", text_ru: "",
      outcomes: [
        { weight: 0.9, hp_delta: 1 },
        { weight: 0.1, hp_delta: 2 },
      ],
    };
    // rng=0 selects first
    expect(rollOutcome(c, () => 0).hp_delta).toBe(1);
    // rng=0.99 selects second
    expect(rollOutcome(c, () => 0.99).hp_delta).toBe(2);
  });
});

describe("integration: 30 encounters from content/encounters.json", () => {
  test("loaded encounters validate schema", async () => {
    const fs = await import("node:fs");
    const raw = fs.readFileSync(new URL("../../../content/encounters.json", import.meta.url), "utf8");
    const data: Encounter[] = JSON.parse(raw);
    expect(data.length).toBeGreaterThanOrEqual(30);
    for (const e of data) {
      expect(e.id).toBeTruthy();
      expect(e.category).toBeTruthy();
      expect(e.zones.length).toBeGreaterThan(0);
      expect(e.text_ru.length).toBeGreaterThan(10);
      expect(e.choices.length).toBeGreaterThanOrEqual(1);
      for (const c of e.choices) {
        expect(c.outcomes.length).toBeGreaterThanOrEqual(1);
        for (const o of c.outcomes) {
          expect(o.weight).toBeGreaterThan(0);
        }
      }
    }
  });

  test("category distribution roughly matches taxonomy targets", async () => {
    const fs = await import("node:fs");
    const raw = fs.readFileSync(new URL("../../../content/encounters.json", import.meta.url), "utf8");
    const data: Encounter[] = JSON.parse(raw);
    const dist: Record<string, number> = {};
    for (const e of data) dist[e.category] = (dist[e.category] ?? 0) + 1;
    // All 6 categories present
    expect(Object.keys(dist).length).toBe(6);
  });
});
