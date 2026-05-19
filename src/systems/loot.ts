import type { Rng } from "./combat";
import type { InventoryStack } from "../state/types";
import type { Mob, Zone, ZoneLevel } from "../types";

const defaultRng: Rng = Math.random;

const rollIntInclusive = (min: number, max: number, rng: Rng): number =>
  Math.floor(rng() * (max - min + 1)) + min;

const pickRandom = <T>(arr: readonly T[], rng: Rng): T | null => {
  if (arr.length === 0) return null;
  const index = Math.min(arr.length - 1, Math.floor(rng() * arr.length));
  return arr[index] ?? null;
};

const addToStacks = (
  stacks: InventoryStack[],
  item_id: string,
  count: number,
): void => {
  const existing = stacks.find((s) => s.item_id === item_id);
  if (existing) {
    existing.count += count;
  } else {
    stacks.push({ item_id, count });
  }
};

// drop_table → InventoryStack[]: roll each entry independently against `chance`,
// then roll count_min..count_max uniformly.
export const generateMobLoot = (mob: Mob, rng: Rng = defaultRng): InventoryStack[] => {
  const result: InventoryStack[] = [];
  for (const entry of mob.drop_table) {
    if (rng() >= entry.chance) continue;
    const min = entry.count_min ?? 1;
    const max = entry.count_max ?? min;
    const count = rollIntInclusive(min, max, rng);
    if (count <= 0) continue;
    addToStacks(result, entry.item_id, count);
  }
  return result;
};

// Roll resource_count units total across zone-level resources.
export const generateZoneLoot = (
  zone: Zone,
  depth: 1 | 2 | 3,
  rng: Rng = defaultRng,
): InventoryStack[] => {
  const level = zone.levels.find((l: ZoneLevel) => l.depth === depth);
  if (!level || level.resources.length === 0) return [];
  const [minCount, maxCount] = level.resource_count;
  const totalUnits = rollIntInclusive(minCount, maxCount, rng);
  const result: InventoryStack[] = [];
  for (let i = 0; i < totalUnits; i += 1) {
    const id = pickRandom(level.resources, rng);
    if (id) addToStacks(result, id, 1);
  }
  return result;
};

// Roll mob ids for the SortieScene encounter sequence:
//   one combat per fight, each combat has enemy_count[min..max] mobs drawn from level.enemies.
export const generateSortieEncounters = (
  zone: Zone,
  depth: 1 | 2 | 3,
  fightsPerDepth: number,
  rng: Rng = defaultRng,
): string[][] => {
  const level = zone.levels.find((l: ZoneLevel) => l.depth === depth);
  if (!level || level.enemies.length === 0) return [];
  const [minE, maxE] = level.enemy_count;
  const encounters: string[][] = [];
  for (let f = 0; f < fightsPerDepth; f += 1) {
    const count = rollIntInclusive(minE, maxE, rng);
    const list: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const id = pickRandom(level.enemies, rng);
      if (id) list.push(id);
    }
    encounters.push(list);
  }
  return encounters;
};
