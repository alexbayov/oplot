import { describe, expect, test } from "vitest";
import {
  activeSignals,
  tickRadioOnReturn,
  resolveRadioChoice,
} from "../radio";
import type { RadioSignal } from "../../types";

const sig = (overrides: Partial<RadioSignal> = {}): RadioSignal => ({
  id: "r1",
  from: "unknown",
  subject: "test",
  body_ru: "тестовое сообщение",
  type: "truth",
  zone_id: "forest",
  options: [
    { id: "respond", label_ru: "Откликнуться" },
    { id: "ignore", label_ru: "Игнорировать" },
  ],
  reward: null,
  trap_mob_id: null,
  trust_impact: { respond: 2, ignore: -1 },
  expires_after_sorties: 3,
  chosen_option: null,
  resolved: false,
  ...overrides,
});

describe("activeSignals", () => {
  test("filters out resolved and expired signals", () => {
    const list: RadioSignal[] = [
      sig({ id: "a" }),
      sig({ id: "b", resolved: true }),
      sig({ id: "c", expires_after_sorties: 0 }),
      sig({ id: "d", expires_after_sorties: -1 }),
      sig({ id: "e" }),
    ];
    expect(activeSignals(list).map((s) => s.id)).toEqual(["a", "e"]);
  });

  test("returns empty list when input is empty", () => {
    expect(activeSignals([])).toEqual([]);
  });
});

describe("tickRadioOnReturn", () => {
  test("decrements expires_after_sorties and returns updated trust", () => {
    const list = [sig({ id: "a", expires_after_sorties: 3 })];
    const trust = tickRadioOnReturn(list, 0);
    expect(list[0]?.expires_after_sorties).toBe(2);
    expect(list[0]?.resolved).toBe(false);
    expect(trust).toBe(0);
  });

  test("auto-resolves when counter reaches 0 with ignore trust impact", () => {
    const list = [
      sig({ id: "a", expires_after_sorties: 1, trust_impact: { respond: 2, ignore: -1 } }),
    ];
    const trust = tickRadioOnReturn(list, 2);
    expect(list[0]?.resolved).toBe(true);
    expect(list[0]?.chosen_option).toBeNull();
    expect(trust).toBe(1);
  });

  test("does not decrement already-resolved signals", () => {
    const list = [sig({ id: "a", expires_after_sorties: 3, resolved: true })];
    tickRadioOnReturn(list, 0);
    expect(list[0]?.expires_after_sorties).toBe(3);
    expect(list[0]?.resolved).toBe(true);
  });

  test("auto-resolves leftover already-zero non-resolved signals (defensive)", () => {
    const list = [sig({ id: "a", expires_after_sorties: 0, resolved: false })];
    const trust = tickRadioOnReturn(list, 0);
    expect(list[0]?.resolved).toBe(true);
    expect(trust).toBe(-1);
  });

  test("clamps trust to [-5, +5] on expiry ignore impact", () => {
    const list = [
      sig({ id: "a", expires_after_sorties: 0, resolved: false, trust_impact: { respond: 2, ignore: -1 } }),
    ];
    const trust = tickRadioOnReturn(list, -5);
    expect(trust).toBe(-5);
  });
});

describe("resolveRadioChoice", () => {
  const validItems = new Set(["bandage", "electronics", "scrap", "medical_supplies"]);
  const validMobs = new Set(["marauder", "fanatic_berserker", "looter_sniper", "pack_rat"]);

  test("truth respond: reward + trust, no ambush", () => {
    const list = [
      sig({
        id: "r1",
        type: "truth",
        reward: { item_id: "bandage", count: 2 },
        trap_mob_id: null,
        trust_impact: { respond: 2, ignore: -1 },
      }),
    ];
    const result = resolveRadioChoice(list, "r1", "respond", 0, [], validItems, validMobs);
    expect(result.status).toBe("OK");
    expect(result.trustBefore).toBe(0);
    expect(result.trustAfter).toBe(2);
    expect(result.rewardAdded).toEqual({ item_id: "bandage", count: 2 });
    expect(result.ambushMobId).toBeNull();
    expect(list[0]?.resolved).toBe(true);
    expect(list[0]?.chosen_option).toBe("respond");
  });

  test("trap respond: ambush + trust, no reward", () => {
    const list = [
      sig({
        id: "r2",
        type: "trap",
        reward: null,
        trap_mob_id: "marauder",
        trust_impact: { respond: -2, ignore: 1 },
      }),
    ];
    const result = resolveRadioChoice(list, "r2", "respond", 0, [], validItems, validMobs);
    expect(result.status).toBe("OK");
    expect(result.trustAfter).toBe(-2);
    expect(result.rewardAdded).toBeNull();
    expect(result.ambushMobId).toBe("marauder");
  });

  test("ambiguous respond: reward + ambush + trust", () => {
    const list = [
      sig({
        id: "r3",
        type: "ambiguous",
        reward: { item_id: "scrap", count: 3 },
        trap_mob_id: "looter_sniper",
        trust_impact: { respond: 1, ignore: -1 },
      }),
    ];
    const result = resolveRadioChoice(list, "r3", "respond", 0, [], validItems, validMobs);
    expect(result.status).toBe("OK");
    expect(result.trustAfter).toBe(1);
    expect(result.rewardAdded).toEqual({ item_id: "scrap", count: 3 });
    expect(result.ambushMobId).toBe("looter_sniper");
  });

  test("ignore on any type: no reward, no ambush, trust only", () => {
    const list = [
      sig({
        id: "r4",
        type: "trap",
        reward: null,
        trap_mob_id: "marauder",
        trust_impact: { respond: -2, ignore: 1 },
      }),
    ];
    const result = resolveRadioChoice(list, "r4", "ignore", 0, [], validItems, validMobs);
    expect(result.status).toBe("OK");
    expect(result.trustAfter).toBe(1);
    expect(result.rewardAdded).toBeNull();
    expect(result.ambushMobId).toBeNull();
  });

  test("already resolved signal returns ALREADY_RESOLVED", () => {
    const list = [
      sig({ id: "r5", resolved: true, chosen_option: "respond" }),
    ];
    const result = resolveRadioChoice(list, "r5", "respond", 0, [], validItems, validMobs);
    expect(result.status).toBe("ALREADY_RESOLVED");
    expect(result.trustBefore).toBe(0);
    expect(result.trustAfter).toBe(0);
  });

  test("trust clamps at +5", () => {
    const list = [
      sig({ id: "r6", trust_impact: { respond: 2, ignore: -1 } }),
    ];
    const result = resolveRadioChoice(list, "r6", "respond", 4, [], validItems, validMobs);
    expect(result.trustAfter).toBe(5);
  });

  test("trust clamps at -5", () => {
    const list = [
      sig({
        id: "r7",
        type: "trap",
        trust_impact: { respond: -2, ignore: 1 },
      }),
    ];
    const result = resolveRadioChoice(list, "r7", "respond", -4, [], validItems, validMobs);
    expect(result.trustAfter).toBe(-5);
  });

  test("missing reward item_id returns REWARD_SKIPPED", () => {
    const list = [
      sig({
        id: "r8",
        type: "truth",
        reward: { item_id: "nonexistent_item", count: 1 },
        trust_impact: { respond: 2, ignore: -1 },
      }),
    ];
    const result = resolveRadioChoice(list, "r8", "respond", 0, [], validItems, validMobs);
    expect(result.status).toBe("REWARD_SKIPPED");
    expect(result.rewardAdded).toBeNull();
  });

  test("missing trap_mob_id returns AMBUSH_SKIPPED", () => {
    const list = [
      sig({
        id: "r9",
        type: "trap",
        reward: null,
        trap_mob_id: "nonexistent_mob",
        trust_impact: { respond: -2, ignore: 1 },
      }),
    ];
    const result = resolveRadioChoice(list, "r9", "respond", 0, [], validItems, validMobs);
    expect(result.status).toBe("AMBUSH_SKIPPED");
    expect(result.ambushMobId).toBeNull();
  });

  test("ambiguous with both missing returns REWARD_SKIPPED", () => {
    const list = [
      sig({
        id: "r10",
        type: "ambiguous",
        reward: { item_id: "nonexistent_item", count: 1 },
        trap_mob_id: "nonexistent_mob",
        trust_impact: { respond: 1, ignore: 0 },
      }),
    ];
    const result = resolveRadioChoice(list, "r10", "respond", 0, [], validItems, validMobs);
    expect(result.status).toBe("REWARD_SKIPPED");
    expect(result.rewardAdded).toBeNull();
    expect(result.ambushMobId).toBeNull();
  });

  test("resolve unknown signal id returns ALREADY_RESOLVED", () => {
    const list = [sig({ id: "r1" })];
    const result = resolveRadioChoice(list, "nonexistent", "respond", 0, [], validItems, validMobs);
    expect(result.status).toBe("ALREADY_RESOLVED");
  });

  test("double resolve returns ALREADY_RESOLVED and no trust change", () => {
    const list = [
      sig({ id: "r11", trust_impact: { respond: 2, ignore: -1 } }),
    ];
    const first = resolveRadioChoice(list, "r11", "respond", 0, [], validItems, validMobs);
    expect(first.trustAfter).toBe(2);
    const second = resolveRadioChoice(list, "r11", "respond", first.trustAfter, [], validItems, validMobs);
    expect(second.status).toBe("ALREADY_RESOLVED");
    expect(second.trustAfter).toBe(first.trustAfter);
  });

  test("tickRadioOnReturn two signals with different trust impacts", () => {
    const list = [
      sig({ id: "a", expires_after_sorties: 1, trust_impact: { respond: 2, ignore: -1 } }),
      sig({ id: "b", expires_after_sorties: 1, trust_impact: { respond: 1, ignore: 0 } }),
    ];
    const trust = tickRadioOnReturn(list, 3);
    expect(trust).toBe(2);
    expect(list[0]?.resolved).toBe(true);
    expect(list[1]?.resolved).toBe(true);
  });

  test("resolveRadioChoice on empty signals list returns ALREADY_RESOLVED", () => {
    const result = resolveRadioChoice([], "any", "respond", 0, [], new Set(), new Set());
    expect(result.status).toBe("ALREADY_RESOLVED");
  });
});
