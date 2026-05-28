import { describe, expect, test, beforeEach } from "vitest";
import {
  loadSkillNodes,
  getAllNodes,
  getNodeById,
  isUnlocked,
  canUnlock,
  unlockNode,
  getPassiveEffects,
  derivePerks,
  migratePerksToSkillNodes,
} from "../SkillTree";
import type { SkillNode } from "../../types/skillNode";

const N = (
  id: string,
  branch: "fighter" | "survivor" | "crafter",
  pos: number,
  requires?: string,
): SkillNode => ({
  id,
  name: id,
  description: id,
  branch,
  position: pos,
  tier: 1,
  kind: "passive",
  requires,
  effects: [{ stat: "accuracy", type: "additive", value: 0.05 }],
});

const TREE: SkillNode[] = [
  N("marks_1", "fighter", 1),
  N("marks_2", "fighter", 2, "marks_1"),
  N("hp_1", "survivor", 1),
  N("hp_2", "survivor", 2, "hp_1"),
];

describe("SkillTree", () => {
  beforeEach(() => loadSkillNodes(TREE));

  test("getAllNodes returns all loaded", () => {
    expect(getAllNodes().length).toBe(4);
  });

  test("getNodeById resolves", () => {
    expect(getNodeById("marks_1")?.branch).toBe("fighter");
    expect(getNodeById("nope")).toBeUndefined();
  });

  test("isUnlocked", () => {
    expect(isUnlocked("marks_1", [])).toBe(false);
    expect(isUnlocked("marks_1", ["marks_1"])).toBe(true);
  });

  test("canUnlock without requires", () => {
    expect(canUnlock("marks_1", [], 1).ok).toBe(true);
  });

  test("canUnlock blocks without skill points", () => {
    expect(canUnlock("marks_1", [], 0).ok).toBe(false);
  });

  test("canUnlock blocks without parent", () => {
    expect(canUnlock("marks_2", [], 1).ok).toBe(false);
    expect(canUnlock("marks_2", ["marks_1"], 1).ok).toBe(true);
  });

  test("unlockNode appends and decrements points", () => {
    const r = unlockNode("marks_1", [], 2);
    expect(r).not.toBeNull();
    expect(r?.unlocked).toContain("marks_1");
    expect(r?.skillPoints).toBe(1);
  });

  test("unlockNode is null if not allowed", () => {
    const r = unlockNode("marks_2", [], 1);
    expect(r).toBeNull();
  });

  test("getPassiveEffects aggregates from unlocked nodes", () => {
    const eff = getPassiveEffects(["marks_1", "marks_2"]);
    expect(typeof eff).toBe("object");
  });

  test("derivePerks returns legacy Perk[] for unlocked", () => {
    const perks = derivePerks(["marks_1"]);
    expect(Array.isArray(perks)).toBe(true);
  });

  test("migratePerksToSkillNodes maps legacy perk ids", () => {
    const r = migratePerksToSkillNodes([{ id: "nonexistent_perk" }]);
    expect(r).toHaveProperty("unlocked");
    expect(r).toHaveProperty("bonusSkillPoints");
    expect(r.bonusSkillPoints).toBe(1); // unknown → bonus point
  });
});
