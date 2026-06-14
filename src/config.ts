export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const BACKGROUND_COLOR = "#111210";
export const MAX_WEIGHT_KG = 30;
export const MAX_LEVEL = 5;

/**
 * Текущая версия save-snapshot. Используется migrations.
 * v1 = до M11 (CloudSaveSnapshot без поля version).
 * v2 = M11.0a (новые item IDs, broken_craft, ammo by caliber).
 * v3 = M11.4 (skill tree state).
 * v4 = M13 (PR-1): добавлены baseResources и injuries. Игроки в активной
 *      вылазке откатываются в базу с сохранением HP/инвентаря (бой удалён).
 * v5 = M13 (PR-6a): equipped_weapon → discriminated catalog|crafted,
 *      equipped_armor_id → 3-slot equipped_armor_ids, новый
 *      crafted_weapons[]. Snapshot не несёт эти поля (pre-existing
 *      ограничение, см. cloudSave.ts) — версия бамп-нута для
 *      будущей персистентности крафта; миграция v4→v5 — no-op stamp.
 */
export const SAVE_VERSION = 5 as const;
