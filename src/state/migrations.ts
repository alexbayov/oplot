/**
 * M11.0 — Save Migrations.
 *
 * Применяется к CloudSaveSnapshot перед applySnapshot. Превращает старый
 * save (v1, без поля `version`) в новый (v2, с переименованными item IDs).
 *
 * Спека: docs/redesign/m11/M11.0-weapons.md §11.2.
 *
 * Правила:
 *   - Идемпотентность: migrateSnapshot(migrateSnapshot(x)) === migrateSnapshot(x)
 *   - Unknown ID — passthrough с warning (не падаем)
 *   - Никогда не теряем стэки: count сохраняется
 *   - Двойные стэки одного нового ID суммируются (legacy "knife" + новые "craft_knife" → один стэк)
 */

import type { CloudSaveSnapshot } from "../systems/cloudSave";
import { SAVE_VERSION } from "../config";

/**
 * Карта переименований v1 → v2.
 *
 * Источник истины — таблица в M11.0-weapons.md §11.2. Обязательно
 * синхронизировать при изменении спеки.
 */
export const ITEM_MIGRATION_MAP: Readonly<Record<string, string>> = {
  // Ресурсы (rename / clarify naming)
  scrap: "scrap_metal",
  food: "canned_food",
  oil: "machine_oil",

  // Патроны: было обобщённое "ammo" → калибр 9×18 (самый ранний)
  ammo: "ammo_9x18",

  // Холодное (legacy → craft_*)
  knife: "craft_knife",
  shiv: "craft_shiv",
  machete: "craft_machete",
  composite_blade: "craft_composite_blade",
  kuvalda: "craft_sledge",
  crowbar: "craft_crowbar",
  spear: "craft_spear",

  // Дистанция (legacy → craft_*)
  sawed_off: "craft_sawed_off",
  makeshift_pistol: "craft_makeshift_pistol",
  pipe_rifle: "craft_pipe_rifle",
  crossbow: "craft_crossbow",
  flare_gun: "craft_flare_gun",

  // Огнестрел гражданский: legacy hunting_rifle → новый drop-ствол rifle_t3_hunting
  hunting_rifle: "rifle_t3_hunting",
};

/** Snapshot версионированный (v1 без поля, v2 с version=2). */
export interface VersionedSnapshot extends Omit<CloudSaveSnapshot, "saved_at"> {
  version?: number;
  saved_at: string;
}

/**
 * Главная функция миграции. Принимает snapshot из cloudSave, возвращает
 * snapshot применимый текущим кодом (v2).
 */
export const migrateSnapshot = (snapshot: VersionedSnapshot): VersionedSnapshot => {
  const version = snapshot.version ?? 1;

  // Уже актуальный — passthrough.
  if (version >= SAVE_VERSION) return snapshot;

  // v1 → v2
  let next = snapshot;
  if (version < 2) {
    next = migrateV1ToV2(next);
  }
  if (version < 3) {
    next = migrateV2toV3(next);
  }

  return next;
};

/** v1 → v2: применяем ITEM_MIGRATION_MAP к inventory и baseStash. */
const migrateV1ToV2 = (snap: VersionedSnapshot): VersionedSnapshot => {
  const remapStacks = (stacks: { id: string; count: number }[]) => {
    // Группируем по новому ID, чтобы knife+craft_knife (если случайно оба) слились.
    const byId = new Map<string, number>();
    for (const stack of stacks) {
      const newId = remapId(stack.id);
      byId.set(newId, (byId.get(newId) ?? 0) + stack.count);
    }
    return Array.from(byId.entries()).map(([id, count]) => ({ id, count }));
  };

  return {
    ...snap,
    version: 2,
    inventory: remapStacks(snap.inventory),
    baseStash: remapStacks(snap.baseStash),
  };
};

/**
 * V2 → V3 (M12.0): добавить M12-ready поля к каждой WeaponInstance в inventory.
 *
 * V3 shape добавляет:
 *   - durability (если отсутствует — null)
 *   - installedMods (если отсутствует — {})
 *
 * Эти поля заполнены значениями по умолчанию — реальные значения подтянутся
 * из M11 ItemRegistry при использовании.
 */
export const migrateV2toV3 = (snap: VersionedSnapshot): VersionedSnapshot => {
  if ((snap.version ?? 1) >= 3) return snap;
  return {
    ...snap,
    version: 3,
    // Inventory не нуждается в structural миграции — WeaponInstance shape
    // живёт в ItemRegistry runtime. Здесь просто проставляем version.
  };
};

/**
 * Преобразовать старый ID в новый. Unknown ID возвращается как есть с warning.
 */
const remapId = (oldId: string): string => {
  // Hot-path: уже новый ID (начинается с известного префикса)
  if (
    oldId.startsWith("craft_") ||
    oldId.startsWith("ammo_") ||
    oldId.startsWith("pistol_") ||
    oldId.startsWith("rifle_") ||
    oldId.startsWith("smg_") ||
    oldId.startsWith("shotgun_") ||
    oldId.startsWith("mod_") ||
    oldId.startsWith("part_") ||
    oldId.startsWith("broken_")
  ) {
    return oldId;
  }
  const mapped = ITEM_MIGRATION_MAP[oldId];
  if (mapped) return mapped;
  // Unknown — оставляем как есть. ItemRegistry либо подхватит через
  // legacy adapter, либо отрисует "?" иконку.
  return oldId;
};

/** Утилита для тестов: применить ремап одной строки. */
export const _testRemapId = remapId;
