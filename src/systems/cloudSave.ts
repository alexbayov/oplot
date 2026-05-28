import { GameState } from "../state/GameState";
import type { InventoryStack, SettingsState } from "../state/types";
import { getPlatform } from "./platform";
import { t } from "./locale";
import { SAVE_VERSION } from "../config";
import { migrateSnapshot } from "../state/migrations";

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
  /** M11.0: version поля. v1 (legacy, no field) → v2 (M11.0a). */
  version?: number;
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
  const { player, baseStash, progress, settings } = GameState;
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

  lastSaveTime = Date.now();
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

export async function loadFromCloud(): Promise<CloudSaveSnapshot | null> {
  const platform = getPlatform();
  if (!platform.available || !platform.player) return null;

  try {
    const keys: (keyof CloudSaveSnapshot)[] = [
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
    ];
    const raw = await platform.player.getData(keys);
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
