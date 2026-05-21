import type { GameProgress } from "../state/types";
import type { Zone } from "../types";

// GDD §6.4.M3.3: minimal switch on Zone.unlock_condition strings.
// "start" is always unlocked (forest). M3 adds "forest_depth_2_completed" (warehouse)
// and "any_warehouse_sortie_completed" (city). Unknown strings → locked + console warn.
export const evaluateUnlockCondition = (
  condition: string,
  progress: GameProgress,
): boolean => {
  switch (condition) {
    case "start":
      return true;
    case "forest_depth_2_completed":
      return progress.forest_depth_2_completed;
    case "any_warehouse_sortie_completed":
      return progress.any_warehouse_sortie_completed;
    default:
      console.warn(`[zoneUnlock] Unknown unlock_condition: "${condition}" — treated as locked.`);
      return false;
  }
};

// Human-readable unlock hint for MapScene's grey button label.
export const describeUnlockCondition = (condition: string): string => {
  switch (condition) {
    case "start":
      return "Доступно с начала";
    case "forest_depth_2_completed":
      return "успешной вылазки в Лес depth 2";
    case "any_warehouse_sortie_completed":
      return "успешной вылазки на Склад";
    default:
      return condition;
  }
};

// Returns the active sortie metadata + zone, used by ReturnScene to set progress flags
// after a successful return. Centralised so combat scenes don't bake unlock logic.
export const applySortieCompletion = (
  progress: GameProgress,
  zone: Zone,
  depth: 1 | 2 | 3,
  victory: boolean,
): GameProgress => {
  if (!victory) return progress;
  const next: GameProgress = { ...progress };
  if (zone.id === "forest" && depth === 2) {
    next.forest_depth_2_completed = true;
  }
  if (zone.id === "warehouse") {
    next.any_warehouse_sortie_completed = true;
  }
  return next;
};
