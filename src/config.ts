export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const BACKGROUND_COLOR = "#111210";
export const MAX_WEIGHT_KG = 30;
export const MAX_LEVEL = 5;

/**
 * M11.0 — Weapon Naming Mode.
 *
 * "generic" — release/Yandex-safe default: обобщённые названия
 *             без реальных торговых марок («9-мм пистолет», «5.45 автомат»).
 * "real"    — optional dev/internal mode для реалистичных названий
 *             («Пистолет Макарова», «АК-74»); включать только если владелец
 *             проекта явно разрешил player-facing реальные названия.
 *
 * Используется ItemRegistry.itemName(). Для релиза на Яндекс.Играх
 * default обязан оставаться "generic".
 */
export const WEAPON_NAMING_MODE: "real" | "generic" = "generic";

/**
 * M11.0 — Текущая версия save-snapshot. Используется migrations.
 * v1 = до M11 (CloudSaveSnapshot без поля version).
 * v2 = M11.0a (новые item IDs, broken_craft, ammo by caliber).
 */
export const SAVE_VERSION = 3 as const;
