import { Scene, Mesh, Vector3 } from "@babylonjs/core";
import { GameState } from "../state/GameState";
import { resolveTurn } from "../scenes3d/combat3d";
import { computeHitChance, formatBreakdown } from "../systems/combatMath";

/**
 * R4 — Full loop orchestration (non-rendering controller).
 * Sequence: Sortie -> Combat (R2) -> Loot -> Return -> Craft -> Base.
 * This module is the entry point for a complete session cycle.
 */

export interface LoopResult {
  sortieZone: string;
  sortieDepth: number;
  combatRounds: number;
  loot: string[];
  heroHPAfter: number;
  heroAPAfter: number;
  baseResourcesDelta: Record<string, number>;
  craftResults: string[];
  completed: boolean;
}

export function runFullLoop(
  zoneId: string,
  depth: number,
  goal: "quiet" | "greedy" | "fuel" | "metal" | string,
  heroState: { hp: number; ap: number; level: number; inventory: Array<{ id: string; count: number }>; maxWeight: number },
  baseStash: Array<{ id: string; count: number }>,
): LoopResult {
  // 1) Sortie validation (reuse zone unlock logic)
  if (zoneId === "forest" && depth > 3) throw new Error("forest max depth 3");
  if (zoneId === "warehouse" && depth > 3) throw new Error("warehouse max depth 3 (M5 adds 3)");
  if (zoneId === "city" && depth > 3) throw new Error("city max depth 3");

  // 2) Combat simulation (simplified — real 3D combat handled by combat3d scene)
  // For loop controller: simulate 2-4 rounds based on depth
  const rounds = Math.min(4, Math.max(2, depth + 1));
  let heroHP = heroState.hp;
  let heroAP = heroState.ap;
  const loot: string[] = [];
  const combatLog: string[] = [];

  // Mock enemy per zone/depth (use real mob IDs from content/mobs.json)
  const mockEnemy = { hp: 20 + depth * 10, cover: "none" as const, type: "human" };

  for (let r = 1; r <= rounds; r++) {
    // Player turn: snap shot (2 AP) as baseline
    if (heroAP >= 2) {
      heroAP -= 2;
      const b = computeHitChance({
        baseHit: 60, marksmanship: 5, weaponAccuracyMod: 5,
        distance: 5, optRange: 12, cover: mockEnemy.cover, bodyPart: "torso",
      });
      const hitChance = b.hitChance;
      const rolled = Math.random() * 100 < hitChance;
      if (rolled) {
        const dmg = Math.round(20 + Math.random() * 12); // simplified damage
        mockEnemy.hp -= dmg;
        combatLog.push(`Round ${r}: HIT ${dmg}`);
      } else {
        combatLog.push(`Round ${r}: MISS`);
      }
    } else {
      combatLog.push(`Round ${r}: NO AP`);
    }

    // Enemy turn (simplified)
    if (mockEnemy.hp > 0) {
      heroHP = Math.max(0, heroHP - 8);
      combatLog.push(`Enemy hits: hero HP ${heroHP}`);
    }
  }

  // 3) Loot roll (simplified — real loot from zones.json)
  const lootPool = ["wood", "scrap", "cloth", "food", "gunpowder"];
  for (let i = 0; i < depth + 2; i++) {
    loot.push(lootPool[Math.floor(Math.random() * lootPool.length)]);
  }

  // 4) Weight check
  const lootWeight = loot.length * 2; // approximate
  const overweight = heroState.maxWeight < lootWeight;
  if (overweight && heroHP > 0) {
    // Force drop 50% of loot if overweight (per GDD §3)
    loot.splice(Math.floor(loot.length / 2));
  }

  // 5) Craft (simplified — craft 1 item if ingredients present)
  const craftResults: string[] = [];
  // Example: craft bandage if cloth >= 3
  const clothCount = heroState.inventory.find((i) => i.id === "cloth")?.count ?? 0;
  if (clothCount >= 3 && baseStash.find((i) => i.id === "bandage")?.count < 5) {
    craftResults.push("bandage");
  }

  // 6) Base resources delta (offline progression stub — real logic in offlineProgression.ts)
  const baseDelta: Record<string, number> = { water: 0, fuel: 0, metal: 0, food: 0 };
  if (goal === "fuel") baseDelta.fuel = 1;
  if (goal === "quiet") baseDelta.food = 2;

  return {
    sortieZone: zoneId,
    sortieDepth: depth,
    combatRounds: rounds,
    loot,
    heroHPAfter: heroHP,
    heroAPAfter: heroAP,
    baseResourcesDelta: baseDelta,
    craftResults,
    completed: heroHP > 0,
  };
}
