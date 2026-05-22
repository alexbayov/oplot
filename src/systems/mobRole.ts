import type { Mob } from "../types";
import type { InventoryStack } from "../state/types";
import { createMobRuntimeState, type MobRuntimeState } from "./mobAI";

export interface BossFightInit {
  isBoss: boolean;
  runtimeState: MobRuntimeState;
  guaranteedLoot: InventoryStack[];
}

export const initBossFight = (mob: Mob): BossFightInit => {
  const isBoss = mob.role === "boss";
  const runtimeState = createMobRuntimeState(mob);
  const guaranteedLoot: InventoryStack[] = isBoss
    ? mob.drop_table
        .filter((d) => d.chance >= 1.0)
        .map((d) => ({
          item_id: d.item_id,
          count: d.count_min ?? 1,
        }))
    : [];
  return { isBoss, runtimeState, guaranteedLoot };
};

export const getBossGuaranteedDrops = (mob: Mob): InventoryStack[] => {
  if (mob.role !== "boss") return [];
  return mob.drop_table
    .filter((d) => d.chance >= 1.0)
    .map((d) => ({
      item_id: d.item_id,
      count: d.count_min ?? 1,
    }));
};
