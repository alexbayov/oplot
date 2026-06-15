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
import { PERK_MIGRATION_MAP } from "./SkillTree";
import { createDefaultBaseResources } from "./GameState";
import type { BaseResources, BuildingState } from "./types";

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
    next = migrateV2ToV3(next);
  }
  if (version < 4) {
    next = migrateV3ToV4(next);
  }
  if (version < 5) {
    next = migrateV4ToV5(next);
  }
  if (version < 6) {
    next = migrateV5ToV6(next);
  }
  if (version < 7) {
    next = migrateV6ToV7(next);
  }
  if (version < 8) {
    next = migrateV7ToV8(next);
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

/**
 * v2 → v3 (M11.4 + M12.0):
 *   - M11.4: legacy perks[] → unlockedSkillNodes[] + bonus skillPoints для unmapped.
 *   - M12.0: версия проставляется. M11 WeaponInstance в этом слое жил в
 *     ItemRegistry runtime — он снесён в PR-5 целиком вместе с M11-слоем.
 *     Новый M13 WeaponInstance в PR-6a живёт в `systems/weaponAssembly.ts`,
 *     v3 saves его не содержат — для них init-ится пустым массивом в
 *     applySnapshot defaults.
 */
const migrateV2ToV3 = (snap: VersionedSnapshot): VersionedSnapshot => {
  const unlocked: string[] = [];
  let bonus = 0;
  for (const perkId of snap.perks ?? []) {
    const newId = PERK_MIGRATION_MAP[perkId];
    if (newId) {
      unlocked.push(newId);
    } else {
      bonus++;
    }
  }
  return {
    ...snap,
    version: 3,
    unlockedSkillNodes: unlocked,
    skillPoints: bonus,
  };
};

/**
 * v3 → v4 (M13 PR-1: бой в авторесолв):
 *   - Добавляем `baseResources` со стартовыми нулями.
 *   - Добавляем `injuries: []`.
 *   - Любой in-flight `currentSortie` дропается на стороне applySnapshot
 *     (он не сериализуется в snapshot, поэтому миграция тут не нужна,
 *     но мы фиксируем версию, чтобы знать, что это v4).
 *
 * Если в будущем cloud-сейв начнёт сериализовать `currentSortie`, эту
 * миграцию надо расширить: вернуть HP, перенести `taken_consumables` в
 * `inventory`, обнулить sortie. Сейчас же — пустой контракт.
 */
const migrateV3ToV4 = (snap: VersionedSnapshot): VersionedSnapshot => {
  return {
    ...snap,
    version: 4,
    // M13 PR-6b-3: используем createDefaultBaseResources() вместо инлайн-
    // литерала, чтобы новое поле `energy` автоматически попадало в v3→v4
    // путь миграции. v7→v8 в любом случае добивает energy через
    // default-first spread (idempotent), но cleaner — закрыть тип сразу.
    baseResources: snap.baseResources ?? createDefaultBaseResources(),
    injuries: snap.injuries ?? [],
  };
};

/**
 * v4 → v5 (M13 PR-6a: craft core):
 *   - PlayerState реструктурирован: equipped_weapon_id → discriminated
 *     equipped_weapon: {kind:catalog|crafted, id}; equipped_armor_id →
 *     3-slot equipped_armor_ids: {helm?, plate?, strap?}; новое поле
 *     crafted_weapons: WeaponInstance[].
 *   - Snapshot не несёт эти поля (cloudSave сейчас не сериализует
 *     equipped state, см. cloudSave.ts:applySnapshot — оно ресетится
 *     на дефолты при load-е, pre-existing ограничение). Поэтому
 *     миграция тут — version-stamp only, без поля-данных.
 *   - Когда PR-6b/PR-7 расширит cloudSave для персистентности
 *     equipped + crafted (под живой craft UI), эту миграцию переделают
 *     в полноценную: legacy `equipped_weapon_id` → discriminated catalog
 *     wrap; `equipped_armor_id` → slot по armor.slot из каталога;
 *     `crafted_weapons` → []. Дисциплина та же что в PR-5: save-safe,
 *     id-ы стабильны.
 */
const migrateV4ToV5 = (snap: VersionedSnapshot): VersionedSnapshot => {
  return { ...snap, version: 5 };
};

/**
 * v5 → v6 (M13 PR-6c: base sim layer):
 *   - Добавляются `buildings?: BuildingState[]` и `hp?: number` в
 *     CloudSaveSnapshot. Оба optional. Миграция — stamp + hp-дефолт:
 *       buildings: НЕ инжектим. Старые v5 сейвы остаются БЕЗ ключа
 *         `buildings` (undefined). applySnapshot тогда подставит
 *         `createDefaultBuildings()` (грядка+койка always-on per §7).
 *         КРИТИЧНО: инжектить `[]` здесь нельзя — `[] ?? default === []`,
 *         и существующий игрок остался бы навсегда без построек.
 *       hp: snap.hp ?? null — на applySnapshot подтянется `?? hp_max`.
 *         Здесь null чтобы не зашивать hp_max константу в миграцию
 *         (она может меняться через perks/balance).
 *   - Идемпотентно: повторный запуск на v6 ничего не меняет (главный
 *     guard в migrateSnapshot — `if (version >= SAVE_VERSION) return`),
 *     и `snap.buildings` у v6-сейва сохраняется как есть.
 */
const migrateV5ToV6 = (snap: VersionedSnapshot): VersionedSnapshot => {
  return {
    ...snap,
    version: 6,
    hp: snap.hp ?? null,
  };
};

/**
 * v6 → v7 (M13 PR-6b-1: durability-wire persist):
 *   - Добавляются `equipped_weapon?` (EquippedWeapon | null) и
 *     `crafted_weapons?: WeaponInstance[]` в CloudSaveSnapshot. Оба
 *     optional. Миграция — stamp-only: v6-сейв НЕ несёт этих ключей
 *     (undefined), applySnapshot подставит дефолты (catalog craft_knife
 *     для equipped_weapon, [] для crafted_weapons).
 *   - КРИТИЧНО: НЕ инжектим `equipped_weapon: null` здесь. У старого
 *     v6-сейва намерения «слот пуст» нет — он просто не знал про поле.
 *     Дефолт «стартовый craft_knife» правильнее, чем «голые руки».
 *     Соответственно — пишем ТОЛЬКО version, без полей-данных.
 *     applySnapshot отличает «ключа нет» от «ключ есть = null» через
 *     `in`-проверку (Trap A preflight §5).
 *   - Идемпотентно: повторный запуск на v7 → главный guard в
 *     migrateSnapshot возвращает snap до этой строки.
 */
const migrateV6ToV7 = (snap: VersionedSnapshot): VersionedSnapshot => {
  return { ...snap, version: 7 };
};

/**
 * v7 → v8 (M13 PR-6b-3: Verstak energy gate + generator).
 *
 * DATA-FULL (НЕ stamp-only). В отличие от v6→v7, эта миграция реально
 * пишет два поля, и проигнорировать их = тихо мёртвая фича на рантайме:
 *   - `baseResources.energy = 0` — иначе `accrueGenerator` пишет в undefined
 *     ключ объекта, `consumeBaseResource` распространяет NaN, Verstak-gate
 *     читает `< ASSEMBLE_ENERGY_COST` как `false` (т.к. `undefined < N`
 *     даёт `false`), фича висит на «Не хватает энергии» вечно даже после
 *     accrue. И ещё хуже: написание `baseResources.energy` через
 *     `consumeBaseResource("energy", N)` даст `Math.max(0, NaN) = NaN`,
 *     что попадает в save и распространяется.
 *   - `generator` building — `offlineProgression.accrueGenerator` делает
 *     `findBuilding(state.buildings, "generator")` → `if (!gen) return no-op`.
 *     Length-guard в applySnapshot (`length > 0`) НЕ срабатывает на
 *     `[garden, bunk]` (length=2 > 0), массив возвращается без generator
 *     навсегда. Trap B-вариант-2 — описан в preflight §5.
 *
 * Форма миграции:
 *   - `baseResources`: default-first spread → snap values (water/fuel/metal/
 *     food) побеждают, `energy:0` добивается из дефолта. Идемпотентно
 *     (energy=N сохраняется на повторе).
 *   - `buildings`: ensure-by-id. Если массив есть и в нём нет generator —
 *     добавляем. Если массив отсутствует — пропускаем (applySnapshot потом
 *     подставит createDefaultBuildings() который уже включает generator).
 *     Идемпотентно: повторный запуск находит generator и не дублирует.
 *
 * Главный guard в migrateSnapshot (`if (version >= SAVE_VERSION) return`)
 * предотвращает re-entry на v8-snap, но эта миграция всё равно остаётся
 * идемпотентной — for safety.
 */
const ensureBuildingPresent = (
  buildings: BuildingState[],
  id: BuildingState["id"],
): BuildingState[] => {
  if (buildings.some((b) => b.id === id)) return buildings;
  return [...buildings, { id, accumulated_output: 0 }];
};

const migrateV7ToV8 = (snap: VersionedSnapshot): VersionedSnapshot => {
  const baseResources: BaseResources = {
    ...createDefaultBaseResources(),
    ...(snap.baseResources ?? {}),
  };
  const buildings = snap.buildings
    ? ensureBuildingPresent(snap.buildings, "generator")
    : snap.buildings;
  return { ...snap, version: 8, baseResources, buildings };
};
