import type { InventoryStack, PlayerState } from "../state/types";
import type { Zone } from "../types";

export const playerHasGasMask = (player: PlayerState): boolean => {
  // M13 PR-6a: gas_mask мигрирован в armor.slot=helm (PR-5 D-armor
  // table). До PR-6a жил один equipped_armor_id; сейчас 3-slot,
  // gas_mask должен сидеть конкретно в helm. Проверяем оба пути:
  // надетый в helm-слот + в рюкзаке.
  if (player.equipped_armor_ids.helm === "gas_mask") return true;
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
