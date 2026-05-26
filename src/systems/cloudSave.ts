import { GameState } from "../state/GameState";
import type { InventoryStack, SettingsState } from "../state/types";
import { getPlatform } from "./platform";
import { t } from "./locale";

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
}

let lastSaveTime = 0;

export function serializeGameState(): CloudSaveSnapshot {
  const { player, baseStash, progress, settings } = GameState;
  return {
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
  const { level, xp, backpack, baseStash, settings, radio_trust } =
    deserializeSnapshot(snapshot);

  GameState.player.level = level;
  GameState.player.xp = xp;
  GameState.player.backpack = backpack;
  GameState.baseStash = baseStash;
  GameState.settings = settings;
  GameState.progress.radio_trust = radio_trust;

  for (const signal of GameState.data.radioSignals) {
    if (snapshot.resolvedSignals.includes(signal.id)) {
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
