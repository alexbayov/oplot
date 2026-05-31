import { describe, expect, test } from "vitest";
import {
  DEFAULT_PLAYER_AP,
  createCombatApState,
  formatCombatActionDisabledReason,
  getCombatActionCost,
  getCombatActionDisabledReason,
  resetCombatAp,
} from "../combatAp";

describe("combatAp", () => {
  test("defines PR3 baseline AP costs", () => {
    expect(DEFAULT_PLAYER_AP).toBe(3);
    expect(getCombatActionCost("attack")).toBe(1);
    expect(getCombatActionCost("aimed_shot")).toBe(2);
    expect(getCombatActionCost("cover")).toBe(1);
    expect(getCombatActionCost("heal")).toBe(1);
    expect(getCombatActionCost("retreat")).toBe(2);
    expect(getCombatActionCost("reload")).toBe(1);
  });

  test("creates and resets AP state to the default player turn budget", () => {
    expect(createCombatApState()).toEqual({ current: 3, max: 3 });
    expect(resetCombatAp()).toEqual({ current: 3, max: 3 });
    expect(createCombatApState(4)).toEqual({ current: 4, max: 4 });
  });

  test("reports insufficient AP before an action is selected", () => {
    expect(getCombatActionDisabledReason({ action: "retreat", currentAp: 1 })).toBe("not_enough_ap");
    expect(formatCombatActionDisabledReason("not_enough_ap")).toBe("не хватает AP");
  });

  test("reports missing targets only for targeted attacks", () => {
    expect(getCombatActionDisabledReason({ action: "attack", currentAp: 3, hasValidTarget: false })).toBe("no_valid_target");
    expect(getCombatActionDisabledReason({ action: "cover", currentAp: 3, hasValidTarget: false })).toBeNull();
    expect(formatCombatActionDisabledReason("no_valid_target")).toBe("нет цели");
  });

  test("reports unavailable actions without mutating AP state", () => {
    const ap = createCombatApState();

    expect(getCombatActionDisabledReason({ action: "heal", currentAp: ap.current, available: false })).toBe(
      "action_unavailable",
    );
    expect(formatCombatActionDisabledReason("action_unavailable")).toBe("действие недоступно");
    expect(ap).toEqual({ current: 3, max: 3 });
  });
});
