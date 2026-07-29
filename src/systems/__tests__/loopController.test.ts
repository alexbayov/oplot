import { describe, expect, it } from "vitest";
import { runFullLoop } from "../loopController";

describe("loopController R4", () => {
  it("completes a forest depth-1 sortie with fixed rng", () => {
    let i = 0;
    const seq = [0.1, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2];
    const rng = () => {
      const v = seq[i % seq.length];
      i += 1;
      return v;
    };

    const result = runFullLoop(
      "forest",
      1,
      "quiet",
      {
        hp: 100,
        ap: 8,
        level: 3,
        inventory: [{ id: "cloth", count: 4 }],
        maxWeight: 30,
      },
      rng,
    );

    expect(result.sortieZone).toBe("forest");
    expect(result.sortieDepth).toBe(1);
    expect(result.loot.length).toBeGreaterThan(0);
    expect(result.craftResults).toContain("bandage");
    expect(result.baseResourcesDelta.food).toBe(1);
    expect(result.combatLog.length).toBeGreaterThan(0);
  });

  it("rejects invalid depth", () => {
    expect(() =>
      runFullLoop("forest", 9, "greedy", {
        hp: 100,
        ap: 4,
        level: 1,
        inventory: [],
        maxWeight: 30,
      }),
    ).toThrow(/invalid depth/);
  });
});
