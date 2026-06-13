import type { GameProgress } from "../state/types";
import type { Zone } from "../types";

/**
 * M13 PR-2: гейтинг зон.
 *
 * До PR-2 зоны открывались по «было такое-то событие» (`forest_depth_2_completed`,
 * `any_warehouse_sortie_completed` и т.п.). После M13 у нас всего 3 зоны открыты
 * на лаунч, и логика проще: гейтим по уровню героя.
 *
 * `player_level_N` — открыта, когда player.level >= N.
 *
 * Старые строки оставлены для обратной совместимости со старыми сейвами и для
 * 6 архивных зон (см. docs/redesign/archive/m14-zones.md), которые могут
 * вернуться в M14.
 */
export const evaluateUnlockCondition = (
  condition: string,
  progress: GameProgress,
  player_level: number,
): boolean => {
  if (condition === "start") return true;

  const lvlMatch = /^player_level_(\d+)$/.exec(condition);
  if (lvlMatch) {
    const required = Number(lvlMatch[1]);
    return player_level >= required;
  }

  switch (condition) {
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
  if (condition === "start") return "Доступно с начала";
  const lvlMatch = /^player_level_(\d+)$/.exec(condition);
  if (lvlMatch) return `уровня героя ${lvlMatch[1]}`;
  switch (condition) {
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

  // Factory (M13 PR-2 переименована в Промзону)
  if (zone.id === "factory") {
    next.factory_sortie_completed = true;
  }

  return next;
};
