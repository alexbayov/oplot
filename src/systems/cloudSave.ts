import { GameState, createDefaultBaseResources, createDefaultBuildings } from "../state/GameState";
import type { BaseResources, BuildingState, InventoryStack, SettingsState, PlayerInjury } from "../state/types";
import { getPlatform } from "./platform";
import { t } from "./locale";
import { SAVE_VERSION } from "../config";
import { migrateSnapshot } from "../state/migrations";
import { derivePerks } from "../state/SkillTree";
import { accrueOffline, type AccrualSummary } from "./offlineProgression";

export const MIN_CLOUD_SAVE_INTERVAL_MS = 10_000;

export interface CloudSaveSnapshot {
  level: number;
  xp: number;
  perks: string[];
  inventory: { id: string; count: number }[];
  baseStash: { id: string; count: number }[];
  radio_trust: number;
  resolvedSignals: string[];
  settings: { mute: boolean; volume: number };
  saved_at: string;
  gas?: number;
  /** M11.0: version поля. v1 (legacy, no field) → v2 (M11.0a) → v3 (M11.4). */
  version?: number;
  /** M11.4: skill tree state. */
  unlockedSkillNodes?: string[];
  skillPoints?: number;
  /** M13: ресурсы базы. v4+. */
  baseResources?: BaseResources;
  /** M13: травмы. v4+. */
  injuries?: PlayerInjury[];
  /**
   * M13 PR-6c: persisted base buildings (грядка/койка). v6+.
   * Optional — v5 сейвы получают `?? []` в миграции, потом
   * applySnapshot мержит с `createDefaultBuildings()` через fallback.
   */
  buildings?: BuildingState[];
  /**
   * M13 PR-6c: hp персистится с v6. До v6 hp ресетился в hp_max на
   * каждый load (createDefaultPlayer default). Optional — v5 сейвы
   * получают `null` в миграции, applySnapshot затем фолбэкает на hp_max
   * (= prior behavior, zero regression).
   */
  hp?: number | null;
  // Optional for backward-compat with saves predating the unlock-flag fix.
  // Missing keys are treated as false on load.
  progress_flags?: {
    forest_depth_2_completed?: boolean;
    any_warehouse_sortie_completed?: boolean;
    any_forest_sortie_completed?: boolean;
    suburbs_sortie_completed?: boolean;
    warehouse_boss_defeated?: boolean;
    factory_sortie_completed?: boolean;
    city_boss_defeated?: boolean;
    metro_sortie_completed?: boolean;
  };
}

let lastSaveTime = 0;

export function serializeGameState(): CloudSaveSnapshot {
  const { player, baseStash, baseResources, progress, settings } = GameState;
  return {
    version: SAVE_VERSION,
    level: player.level,
    xp: player.xp,
    perks: player.perks.map((p) => p.id),
    inventory: player.backpack.map((s) => ({ id: s.item_id, count: s.count })),
    baseStash: baseStash.map((s) => ({ id: s.item_id, count: s.count })),
    radio_trust: progress.radio_trust,
    resolvedSignals: GameState.data.radioSignals
      .filter((s) => s.resolved)
      .map((s) => s.id),
    settings: { mute: settings.sfxMuted, volume: settings.sfxVolume },
    saved_at: new Date().toISOString(),
    gas: player.gas,
    unlockedSkillNodes: player.unlockedSkillNodes ?? [],
    skillPoints: player.skillPoints ?? 0,
    baseResources,
    injuries: player.injuries ?? [],
    // M13 PR-6c: persist buildings + hp (см. comments on type).
    buildings: GameState.buildings,
    hp: player.hp,
    progress_flags: {
      forest_depth_2_completed: progress.forest_depth_2_completed,
      any_warehouse_sortie_completed: progress.any_warehouse_sortie_completed,
      any_forest_sortie_completed: progress.any_forest_sortie_completed,
      suburbs_sortie_completed: progress.suburbs_sortie_completed,
      warehouse_boss_defeated: progress.warehouse_boss_defeated,
      factory_sortie_completed: progress.factory_sortie_completed,
      city_boss_defeated: progress.city_boss_defeated,
      metro_sortie_completed: progress.metro_sortie_completed,
    },
  };
}

export function deserializeSnapshot(
  snapshot: CloudSaveSnapshot,
): {
  backpack: InventoryStack[];
  baseStash: InventoryStack[];
  settings: SettingsState;
  level: number;
  xp: number;
  radio_trust: number;
} {
  return {
    level: snapshot.level,
    xp: snapshot.xp,
    radio_trust: snapshot.radio_trust,
    backpack: snapshot.inventory.map((i) => ({
      item_id: i.id,
      count: i.count,
    })),
    baseStash: snapshot.baseStash.map((i) => ({
      item_id: i.id,
      count: i.count,
    })),
    settings: {
      sfxMuted: snapshot.settings.mute,
      sfxVolume: snapshot.settings.volume,
    },
  };
}

export function applySnapshot(snapshot: CloudSaveSnapshot): void {
  // M11.0: migrate before apply. v1 saves (no version field) → v2.
  const migrated = migrateSnapshot(snapshot) as CloudSaveSnapshot;
  const { level, xp, backpack, baseStash, settings, radio_trust } =
    deserializeSnapshot(migrated);

  GameState.player.level = level;
  GameState.player.xp = xp;
  GameState.player.backpack = backpack;
  GameState.baseStash = baseStash;
  GameState.settings = settings;
  GameState.progress.radio_trust = radio_trust;
  // M13: восстановить ресурсы базы и травмы (если в сейве есть).
  GameState.baseResources = migrated.baseResources ?? createDefaultBaseResources();
  GameState.player.injuries = migrated.injuries ?? [];
  // M11.4: restore skill tree state и пересчитать legacy perks для combat/loot/craft.
  GameState.player.unlockedSkillNodes = migrated.unlockedSkillNodes ?? [];
  GameState.player.skillPoints = migrated.skillPoints ?? 0;
  GameState.player.perks = derivePerks(GameState.player.unlockedSkillNodes);
  // Restore unlock flags; missing keys default to false.
  const flags = migrated.progress_flags ?? {};
  GameState.progress.forest_depth_2_completed = flags.forest_depth_2_completed ?? false;
  GameState.progress.any_warehouse_sortie_completed = flags.any_warehouse_sortie_completed ?? false;
  GameState.progress.any_forest_sortie_completed = flags.any_forest_sortie_completed ?? false;
  GameState.progress.suburbs_sortie_completed = flags.suburbs_sortie_completed ?? false;
  GameState.progress.warehouse_boss_defeated = flags.warehouse_boss_defeated ?? false;
  GameState.progress.factory_sortie_completed = flags.factory_sortie_completed ?? false;
  GameState.progress.city_boss_defeated = flags.city_boss_defeated ?? false;
  GameState.progress.metro_sortie_completed = flags.metro_sortie_completed ?? false;
  if (migrated.gas !== undefined) {
    GameState.player.gas = migrated.gas;
  }

  for (const signal of GameState.data.radioSignals) {
    if (migrated.resolvedSignals.includes(signal.id)) {
      signal.resolved = true;
    }
  }

  // M13 PR-6c: восстановить buildings + hp, потом прогнать accrueOffline
  // от saved_at до now. Summary прячется в module-level var и забирается
  // через consumePendingAccrualSummary() — BaseScene показывает тост
  // только при наличии yield (accrualHasYield()).
  // Always-on per preflight §7: каждый сейв ДОЛЖЕН иметь грядку+койку.
  // Length-guard (не просто `??`): старые v5 сейвы, мигрированные с
  // `buildings: []`, иначе застряли бы с нулём построек (`[] ?? x === []`).
  GameState.buildings =
    migrated.buildings && migrated.buildings.length > 0
      ? migrated.buildings
      : createDefaultBuildings();
  GameState.player.hp =
    typeof migrated.hp === "number"
      ? Math.max(0, Math.min(GameState.player.hp_max, migrated.hp))
      : GameState.player.hp_max;

  const savedAtMs = Date.parse(migrated.saved_at);
  if (Number.isFinite(savedAtMs)) {
    const result = accrueOffline(
      {
        baseResources: GameState.baseResources,
        buildings: GameState.buildings,
        hp: GameState.player.hp,
        hp_max: GameState.player.hp_max,
      },
      savedAtMs,
      Date.now(),
    );
    GameState.baseResources = result.state.baseResources;
    GameState.buildings = result.state.buildings;
    GameState.player.hp = result.state.hp;
    pendingAccrualSummary = result.summary;
  }

  lastSaveTime = Date.now();
}

/**
 * M13 PR-6c: захваченный summary последнего accrueOffline на load.
 * BaseScene забирает его через consumePendingAccrualSummary() и показывает
 * тост. Pattern: эксклюзивно load-путь — BaseScene-entry refresh имеет свой
 * accrue с подавлением тоста.
 */
let pendingAccrualSummary: AccrualSummary | null = null;

export function consumePendingAccrualSummary(): AccrualSummary | null {
  const s = pendingAccrualSummary;
  pendingAccrualSummary = null;
  return s;
}

export function resolveConflict(
  local: CloudSaveSnapshot | null,
  remote: CloudSaveSnapshot | null,
): CloudSaveSnapshot | null {
  if (!remote) return local;
  if (!local) return remote;
  return new Date(remote.saved_at).getTime() >=
    new Date(local.saved_at).getTime()
    ? remote
    : local;
}

export async function saveToCloud(): Promise<void> {
  const platform = getPlatform();
  if (!platform.available || !platform.player) return;

  const now = Date.now();
  if (now - lastSaveTime < MIN_CLOUD_SAVE_INTERVAL_MS) return;
  lastSaveTime = now;

  const snapshot = serializeGameState();
  try {
    await platform.player.setData(
      snapshot as unknown as Record<string, unknown>,
      true,
    );
  } catch {
    console.warn(`[cloudSave] ${t("cloud_save_error")}`);
  }
}

export async function saveToCloudImmediate(): Promise<void> {
  const platform = getPlatform();
  if (!platform.available || !platform.player) return;

  const snapshot = serializeGameState();
  try {
    await platform.player.setData(
      snapshot as unknown as Record<string, unknown>,
      true,
    );
    lastSaveTime = Date.now();
  } catch {
    console.warn(`[cloudSave] ${t("cloud_save_error")}`);
  }
}

/**
 * Whitelist ключей, запрашиваемых у `player.getData()`. Yandex getData(keys)
 * возвращает ТОЛЬКО перечисленные ключи — если поле пишется в
 * serializeGameState, но отсутствует здесь, оно НЕ переживёт round-trip
 * (тихо ресетится в дефолт на каждый load).
 *
 * SINGLE SOURCE OF TRUTH: должен покрывать все ключи serializeGameState.
 * Тест `cloudSave.test` ("getData whitelist covers every serialized key")
 * — drift-guard: упадёт если serialize обзавёлся ключом, не добавленным сюда.
 *
 * M13 PR-6c добавил `buildings` + `hp` (preflight §5, точка 3 из 5-звенной
 * цепочки). Заодно восстановлены `unlockedSkillNodes`/`skillPoints`/
 * `progress_flags` — они писались в serialize, но отсутствовали в whitelist
 * (pre-existing дрейф: skill-tree state и unlock-флаги не переживали
 * cloud-load на реальной платформе). `?? default` в applySnapshot делает
 * это zero-regression.
 */
export const CLOUD_SAVE_KEYS: (keyof CloudSaveSnapshot)[] = [
  "version",
  "level",
  "xp",
  "perks",
  "inventory",
  "baseStash",
  "radio_trust",
  "resolvedSignals",
  "settings",
  "saved_at",
  "gas",
  "unlockedSkillNodes",
  "skillPoints",
  "baseResources",
  "injuries",
  "buildings",
  "hp",
  "progress_flags",
];

export async function loadFromCloud(): Promise<CloudSaveSnapshot | null> {
  const platform = getPlatform();
  if (!platform.available || !platform.player) return null;

  try {
    const raw = await platform.player.getData(CLOUD_SAVE_KEYS);
    if (!raw || typeof raw !== "object") return null;
    const data = raw as Record<string, unknown>;

    if (!data.saved_at || typeof data.saved_at !== "string") return null;

    return data as unknown as CloudSaveSnapshot;
  } catch {
    return null;
  }
}

function onVisibilityChange(): void {
  if (document.visibilityState === "hidden") {
    void saveToCloudImmediate();
  }
}

function onBeforeUnload(): void {
  void saveToCloudImmediate();
}

export function startCloudSave(): void {
  if (typeof document === "undefined") return;
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("beforeunload", onBeforeUnload);
}
