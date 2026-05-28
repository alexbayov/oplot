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
 * M11.0 — Текущая версия save-snapshot. Используется migrations.
 * v1 = до M11 (CloudSaveSnapshot без поля version).
 * v2 = M11.0a (новые item IDs, broken_craft, ammo by caliber).
 */
export const SAVE_VERSION = 2 as const;
