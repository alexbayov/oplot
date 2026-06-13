export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const BACKGROUND_COLOR = "#111210";
export const MAX_WEIGHT_KG = 30;
export const MAX_LEVEL = 5;

/**
 * M11.0 — Weapon Naming Mode.
 *
 * "real"    — реалистичные названия («Пистолет Макарова», «АК-74»).
 * "generic" — обобщённые («9-мм пистолет», «5.45 автомат»).
 *
 * Используется ItemRegistry.itemName(). На случай если Яндекс.Игры
 * заблокирует реалистичные названия — флипаем без правок контента.
 */
export const WEAPON_NAMING_MODE: "real" | "generic" = "real";

/**
 * Текущая версия save-snapshot. Используется migrations.
 * v1 = до M11 (CloudSaveSnapshot без поля version).
 * v2 = M11.0a (новые item IDs, broken_craft, ammo by caliber).
 * v3 = M11.4 (skill tree state).
 * v4 = M13 (PR-1): добавлены baseResources и injuries. Игроки в активной
 *      вылазке откатываются в базу с сохранением HP/инвентаря (бой удалён).
 */
export const SAVE_VERSION = 4 as const;
