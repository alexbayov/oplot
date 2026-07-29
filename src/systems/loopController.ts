/**
 * R4 — Full loop orchestration (pure controller).
 * Sequence: Sortie -> Combat -> Loot -> Return -> Craft -> Base.
 * Spec: docs/redesign/R-MASTER.md
 */
import { computeHitChance } from "./combatMath";

export interface LoopHeroState {
  hp: number;
  ap: number;
  level: number;
  inventory: Array<{ id: string; count: number }>;
  maxWeight: number;
}

export interface LoopResult {
  sortieZone: string;
  sortieDepth: number;
  combatRounds: number;
  loot: string[];
  heroHPAfter: number;
  heroAPAfter: number;
  baseResourcesDelta: Record<string, number>;
  craftResults: string[];
  combatLog: string[];
  completed: boolean;
}

export function runFullLoop(
  zoneId: string,
  depth: number,
  goal: "quiet" | "greedy" | "fuel" | "metal" | string,
  heroState: LoopHeroState,
  rng: () => number = Math.random,
): LoopResult {
  if (depth < 1 || depth > 3) {
    throw new Error(`invalid depth: ${depth}`);
  }

  const rounds = Math.min(4, Math.max(2, depth + 1));
  let heroHP = heroState.hp;
  let heroAP = heroState.ap;
  const loot: string[] = [];
  const combatLog: string[] = [];

  const mockEnemy = { hp: 20 + depth * 10, cover: "none" as const };

  for (let r = 1; r <= rounds; r++) {
    if (heroAP >= 2 && mockEnemy.hp > 0) {
      heroAP -= 2;
      const b = computeHitChance({
        baseHit: 60,
        marksmanship: Math.min(10, heroState.level + 2),
        weaponAccuracyMod: 5,
        distance: 5,
        optRange: 12,
        cover: mockEnemy.cover,
        bodyPart: "torso",
      });
      const hit = rng() * 100 < b.hitChance;
      if (hit) {
        const dmg = Math.round(18 + rng() * 14);
        mockEnemy.hp -= dmg;
        combatLog.push(`R${r}: HIT ${dmg} (enemy ${Math.max(0, mockEnemy.hp)} HP)`);
      } else {
        combatLog.push(`R${r}: MISS`);
      }
    } else if (mockEnemy.hp <= 0) {
      combatLog.push(`R${r}: enemy down`);
      break;
    } else {
      combatLog.push(`R${r}: NO AP`);
    }

    if (mockEnemy.hp > 0) {
      const enemyDmg = Math.round(6 + rng() * 6);
      heroHP = Math.max(0, heroHP - enemyDmg);
      combatLog.push(`R${r}: enemy hits ${enemyDmg} (hero ${heroHP} HP)`);
      if (heroHP <= 0) break;
    }
  }

  const lootPool = ["wood", "scrap", "cloth", "food", "gunpowder"];
  for (let i = 0; i < depth + 2; i++) {
    loot.push(lootPool[Math.floor(rng() * lootPool.length)]);
  }

  // Rough weight: 2kg/item; drop half if overweight
  const lootWeight = loot.length * 2;
  if (lootWeight > heroState.maxWeight && heroHP > 0) {
    loot.splice(Math.floor(loot.length / 2));
    combatLog.push("overweight: dropped half loot");
  }

  const craftResults: string[] = [];
  const clothCount = heroState.inventory.find((i) => i.id === "cloth")?.count ?? 0;
  if (clothCount >= 3) {
    craftResults.push("bandage");
  }

  const baseDelta: Record<string, number> = { water: 0, fuel: 0, metal: 0, food: 0 };
  if (goal === "fuel") baseDelta.fuel = depth;
  else if (goal === "metal") baseDelta.metal = depth;
  else if (goal === "quiet") baseDelta.food = depth;
  else baseDelta.water = 1;

  return {
    sortieZone: zoneId,
    sortieDepth: depth,
    combatRounds: rounds,
    loot,
    heroHPAfter: heroHP,
    heroAPAfter: heroAP,
    baseResourcesDelta: baseDelta,
    craftResults,
    combatLog,
    completed: heroHP > 0,
  };
}
