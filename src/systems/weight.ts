import { LOOT_LOSS_ON_DEFEAT } from "../state/balance";
import type { InventoryStack } from "../state/types";
import type { Item } from "../types";

// Σ (item.weight_kg * item.count for item in inventory)  — balance.md §Формулы.
export const computeWeight = (
  inventory: InventoryStack[],
  items: Record<string, Item>,
): number => {
  let total = 0;
  for (const stack of inventory) {
    const item = items[stack.item_id];
    if (!item) continue;
    total += item.weight_kg * stack.count;
  }
  return total;
};

// Used by LootScene to gate the «Взять» button per GDD §3 edge-case.
export const canAddItem = (
  currentWeight: number,
  itemId: string,
  count: number,
  maxWeight: number,
  items: Record<string, Item>,
): boolean => {
  const item = items[itemId];
  if (!item) return false;
  return currentWeight + item.weight_kg * count <= maxWeight;
};

interface UnitRef {
  item_id: string;
  weight: number;
}

// Implements GDD §3 «Правило отбрасывания при поражении»:
// drop_weight_target = sum(loot_run.weight_kg) * LOOT_LOSS_ON_DEFEAT;
// drop items in descending weight_per_unit order until dropped weight >= target.
export const applyLootLoss = (
  inventory: InventoryStack[],
  items: Record<string, Item>,
): InventoryStack[] => {
  const totalWeight = computeWeight(inventory, items);
  if (totalWeight <= 0) {
    return inventory.map((stack) => ({ ...stack }));
  }
  const target = totalWeight * LOOT_LOSS_ON_DEFEAT;

  // Expand stacks to per-unit list so we can drop precisely.
  const units: UnitRef[] = [];
  for (const stack of inventory) {
    const item = items[stack.item_id];
    if (!item) continue;
    for (let i = 0; i < stack.count; i += 1) {
      units.push({ item_id: stack.item_id, weight: item.weight_kg });
    }
  }
  // Sort by weight_per_unit desc; deterministic tiebreaker by item_id.
  units.sort(
    (a, b) =>
      b.weight - a.weight || a.item_id.localeCompare(b.item_id),
  );

  let dropped = 0;
  const remaining: UnitRef[] = [];
  for (const unit of units) {
    if (dropped < target) {
      dropped += unit.weight;
    } else {
      remaining.push(unit);
    }
  }

  // Re-aggregate units back into stacks, preserving original order of appearance.
  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const stack of inventory) {
    if (!counts.has(stack.item_id)) {
      counts.set(stack.item_id, 0);
      order.push(stack.item_id);
    }
  }
  for (const unit of remaining) {
    counts.set(unit.item_id, (counts.get(unit.item_id) ?? 0) + 1);
  }
  const result: InventoryStack[] = [];
  for (const id of order) {
    const c = counts.get(id) ?? 0;
    if (c > 0) {
      result.push({ item_id: id, count: c });
    }
  }
  return result;
};
