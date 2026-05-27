import type { GameProgress } from "../state/types";
import type { Zone } from "../types";

// GDD §6.4.M3.3+: switch on Zone.unlock_condition strings.
// All 9 zones' unlock conditions from content/zones.json are wired here.
// Unknown strings → locked + console warn.
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
    case "any_forest_sortie_completed":
      return progress.any_forest_sortie_completed;
    case "suburbs_sortie_completed":
      return progress.suburbs_sortie_completed;
    case "warehouse_boss_defeated":
      return progress.warehouse_boss_defeated;
    case "factory_sortie_completed":
      return progress.factory_sortie_completed;
    case "city_boss_defeated":
      return progress.city_boss_defeated;
    case "metro_sortie_completed":
      return progress.metro_sortie_completed;
    default:
      console.warn(`[zoneUnlock] Unknown unlock_condition: "${condition}" — treated as locked.`);
      return false;
  }
};

// Human-readable unlock hint for MapScene's grey button label.
// Используется в шаблоне "Закрыто. Требуется: <описание>." — поэтому фраза
// должна нормально читаться в родительном падеже.
export const describeUnlockCondition = (condition: string): string => {
  switch (condition) {
    case "start":
      return "Доступно с начала";
    case "forest_depth_2_completed":
      return "успешной вылазки в Лес на глубину 2";
    case "any_warehouse_sortie_completed":
      return "успешной вылазки на Склад";
    case "any_forest_sortie_completed":
      return "успешной вылазки в Лес";
    case "suburbs_sortie_completed":
      return "успешной вылазки в Пригород";
    case "warehouse_boss_defeated":
      return "победы над боссом Склада";
    case "factory_sortie_completed":
      return "успешной вылазки на Завод";
    case "city_boss_defeated":
      return "победы над боссом Города";
    case "metro_sortie_completed":
      return "успешной вылазки в Метро";
    default:
      return condition;
  }
};

// Returns the active sortie metadata + zone, used by ReturnScene to set progress flags
// after a successful return. Centralised so combat scenes don't bake unlock logic.
//
// Соглашение: depth=3 = босс-уровень для зон с boss_id (см. content/zones.json
// и логику CombatScene). Завершение depth=3 в зоне с боссом считается победой
// над боссом этой зоны.
export const applySortieCompletion = (
  progress: GameProgress,
  zone: Zone,
  depth: 1 | 2 | 3,
  victory: boolean,
): GameProgress => {
  if (!victory) return progress;
  const next: GameProgress = { ...progress };

  // Forest
  if (zone.id === "forest") {
    next.any_forest_sortie_completed = true;
    if (depth === 2) next.forest_depth_2_completed = true;
  }

  // Warehouse
  if (zone.id === "warehouse") {
    next.any_warehouse_sortie_completed = true;
    if (depth === 3 && zone.boss_id) next.warehouse_boss_defeated = true;
  }

  // Suburbs
  if (zone.id === "suburbs") {
    next.suburbs_sortie_completed = true;
  }

  // City
  if (zone.id === "city") {
    if (depth === 3 && zone.boss_id) next.city_boss_defeated = true;
  }

  // Factory
  if (zone.id === "factory") {
    next.factory_sortie_completed = true;
  }

  // Metro
  if (zone.id === "metro") {
    next.metro_sortie_completed = true;
  }

  return next;
};
