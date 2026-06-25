/**
 * M20-PR3 gate: фиксирует, какие узлы дерева ещё инертны (открываются, но
 * не меняют игру). Не даёт молча добавить мёртвый узел — новый узел обязан
 * либо трогать живое поле бандла, либо быть осознанно внесён сюда.
 */
import { describe, expect, test, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { loadSkillNodes } from "../../state/SkillTree";
import { isNodeLive, partitionNodesByLiveness } from "../skillEffectCoverage";
import type { SkillNode } from "../../types/skillNode";

const NODES = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../../content/perks.json"), "utf-8"),
) as SkillNode[];

/**
 * Узлы, чьи эффекты ещё не доходят до геймплея. Группы — это и есть
 * бэклог/деsign-fork (см. docs/ROADMAP.md, секция M20):
 *  - removed-tactical: эффекты механик, снесённых пивотом M13 (cover/reload/
 *    ходы/regen). Дома в авто-резолве нет — нужен design-call (репурпоз/ретайр).
 *  - crit: крита в авто-резолве нет; либо EV-уплотнение урона, либо репурпоз.
 *  - economy: loot/heal — провести в rollLoot / консумы (следующий пакет).
 *  - survival: death_save / low_hp / status_resist — в KO/injury.
 *  - crafting: recipes/material_save — в craft-систему.
 */
const PENDING_NODES = new Set<string>([
  // crit (нет крита в авто-резолве)
  "crit_1",
  "crit_2",
  "aimed_shot",
  // removed-tactical (пивот M13 снёс пошаговый бой/укрытия/перезарядку)
  "cover_dmg",
  "quick_reload",
  "double_tap",
  "regen_cover",
  "bleed_immune",
  "iron_will",
  "free_mod",
  // economy (провести в следующий пакет)
  "extra_loot_1",
  "extra_loot_2",
  "med_boost",
  // survival
  "last_breath",
  // crafting
  "recipe_t2",
  "recipe_t3",
  "craft_eff",
]);

describe("skillEffectCoverage gate", () => {
  beforeEach(() => loadSkillNodes(NODES));

  test("inert nodes exactly match the documented PENDING set", () => {
    const { inert } = partitionNodesByLiveness(NODES);
    expect(new Set(inert)).toEqual(PENDING_NODES);
  });

  test("every live node touches a consumed bundle field", () => {
    const { live } = partitionNodesByLiveness(NODES);
    expect(live.length).toBeGreaterThan(0);
    for (const id of live) expect(isNodeLive(id), id).toBe(true);
  });

  test("no node is both live and pending", () => {
    const { live } = partitionNodesByLiveness(NODES);
    for (const id of live) expect(PENDING_NODES.has(id), id).toBe(false);
  });
});
