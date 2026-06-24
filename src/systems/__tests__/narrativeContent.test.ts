/**
 * M18-PR3 gate-тесты для content/narrative_events.json.
 *
 * Ловит контент-долг, всплывший на M18-PR1: фантомные зоны, dangling
 * item-id в loot/consume, и зоны без единого события. Резолвер устойчив
 * к мусору, но мусор в контенте — это невидимый игроку лут и пустые зоны.
 */
import { describe, expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { eligibleNarrativeEvents } from "../narrativeEvents";
import type { NarrativeEvent } from "../../state/types";
import type { Item, Zone } from "../../types";

const read = <T>(rel: string): T =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../../", rel), "utf-8")) as T;

const EVENTS = read<{ events: NarrativeEvent[] }>("content/narrative_events.json").events;
const ZONES = read<Zone[]>("content/zones.json");
const ITEM_IDS = new Set(read<Item[]>("content/items.json").map((i) => i.id));
const ZONE_IDS = new Set(ZONES.map((z) => z.id));

describe("narrative_events.json — структура", () => {
  test("каждое событие имеет ≥1 выбор, у каждого выбора есть outcome", () => {
    for (const e of EVENTS) {
      expect(e.choices.length, e.id).toBeGreaterThan(0);
      for (const c of e.choices) expect(c.outcome, `${e.id}/${c.id}`).toBeDefined();
    }
  });

  test("id событий уникальны", () => {
    const ids = EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("narrative_events.json — ссылки разрешаются", () => {
  test("все зоны событий — реальные id из zones.json (или '*')", () => {
    for (const e of EVENTS) {
      for (const z of e.zones) {
        expect(z === "*" || ZONE_IDS.has(z), `${e.id} → zone "${z}"`).toBe(true);
      }
    }
  });

  test("все loot- и consume_item-id существуют в items.json", () => {
    for (const e of EVENTS) {
      for (const c of e.choices) {
        for (const l of c.outcome.loot ?? []) {
          expect(ITEM_IDS.has(l.id), `${e.id}/${c.id} → loot "${l.id}"`).toBe(true);
        }
        if (c.outcome.consume_item) {
          expect(
            ITEM_IDS.has(c.outcome.consume_item),
            `${e.id}/${c.id} → consume "${c.outcome.consume_item}"`,
          ).toBe(true);
        }
      }
    }
  });
});

describe("narrative_events.json — покрытие зон", () => {
  test("у каждой открытой зоны есть ≥1 eligible-событие", () => {
    for (const id of ZONE_IDS) {
      expect(eligibleNarrativeEvents(EVENTS, id).length, `zone "${id}"`).toBeGreaterThan(0);
    }
  });
});

describe("narrative_events.json — fork C", () => {
  test("trust_delta вычищен из контента (механики на доверие нет)", () => {
    const raw = fs.readFileSync(
      path.resolve(__dirname, "../../../content/narrative_events.json"),
      "utf-8",
    );
    expect(raw.includes("trust_delta")).toBe(false);
  });
});
