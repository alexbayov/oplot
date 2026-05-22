import type { InventoryStack, PlayerState } from "../state/types";
import type { Zone } from "../types";

export const playerHasGasMask = (player: PlayerState): boolean => {
  if (player.equipped_armor_id === "gas_mask") return true;
  return player.backpack.some((s: InventoryStack) => s.item_id === "gas_mask");
};

export const computeGasDamage = (
  zone: Zone,
  depth: 1 | 2 | 3,
  player: PlayerState,
): number => {
  const level = zone.levels.find((l) => l.depth === depth);
  if (!level?.is_gas) return 0;
  if (playerHasGasMask(player)) return 0;
  return zone.gas_damage_per_turn ?? 0;
};
