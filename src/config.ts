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
 * v6 = M13 (PR-6c): base sim layer — buildings[] (грядка/койка)
 *      персистится с буфером накопленной еды, hp персистится (раньше
 *      ресетился в hp_max на каждый load). Миграция v5→v6 даёт
 *      buildings: [] (offline progression на новой сессии не накопит,
 *      потому что нет buildings — sane default) и hp: hp_max (=
 *      существующее поведение, нулевая регрессия).
 * v7 = M13 (PR-6b-1): durability-wire persist — equipped_weapon
 *      (discriminated catalog|crafted, nullable) и crafted_weapons[]
 *      переезжают в cloud-снапшот. Миграция v6→v7 — stamp-only:
 *      старые v6-сейвы не несут полей; applySnapshot подставит
 *      createDefaultPlayer().equipped_weapon (catalog craft_knife)
 *      и crafted_weapons: []. Trap A: `null` у equipped_weapon —
 *      валидное «слот пуст», проверяем через `in`, не `?? default`,
 *      иначе `null ?? default` стёр бы намеренно пустой слот.
 */
export const SAVE_VERSION = 8 as const;
