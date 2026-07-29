import { describe, expect, it } from "vitest";
import { R5_SKILL_NODES, aggregateSkillEffects, countLiveNodes } from "../skillEffectsR5";

describe("skillEffectsR5", () => {
  it("has 24 live nodes", () => {
    const c = countLiveNodes();
    expect(c.total).toBe(24);
    expect(c.live).toBe(24);
    expect(R5_SKILL_NODES).toHaveLength(24);
  });

  it("aggregates fighter marksmanship", () => {
    const a = aggregateSkillEffects(["f_mark_1", "f_mark_2", "f_cover_dmg"]);
    expect(a.marksmanship).toBe(3);
    expect(a.accuracyMod).toBe(5);
  });

  it("multiplies damage and defense", () => {
    const a = aggregateSkillEffects(["f_crit_1", "s_armor"]);
    expect(a.damageMul).toBeCloseTo(1.05);
    expect(a.defenseMul).toBeCloseTo(1.1);
  });
});
