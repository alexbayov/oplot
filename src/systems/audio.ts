import type Phaser from "phaser";
import { GameState } from "../state/GameState";
import { loadJson } from "../utils/loader";

export interface SfxEntry {
  asset: string;
  volume: number;
}

export type SfxRegistry = Record<string, SfxEntry>;

let sfxRegistry: SfxRegistry | null = null;

export const getSfxRegistry = (): SfxRegistry | null => sfxRegistry;

export const setSfxRegistry = (reg: SfxRegistry | null): void => {
  sfxRegistry = reg;
};

export const loadSfxRegistry = async (): Promise<SfxRegistry | null> => {
  try {
    const data = await loadJson<SfxRegistry>("content/sfx.json");
    sfxRegistry = data;
    return data;
  } catch {
    sfxRegistry = null;
    return null;
  }
};

export const preloadSfx = (scene: Phaser.Scene): void => {
  if (!sfxRegistry) return;
  for (const [key, entry] of Object.entries(sfxRegistry)) {
    scene.load.audio(key, [entry.asset]);
  }
};

export const playSfx = (
  scene: Phaser.Scene,
  triggerId: string,
  volumeOverride?: number,
): void => {
  const entry = sfxRegistry?.[triggerId];
  if (!entry) {
    if (import.meta.env.DEV) {
      console.warn(`[audio] No registry entry for trigger ${triggerId}`);
    }
    return;
  }
  if (!scene.cache.audio.has(triggerId)) {
    if (import.meta.env.DEV) {
      console.warn(`[audio] Missing audio asset for trigger ${triggerId}`);
    }
    return;
  }
  const { settings } = GameState;
  if (settings.sfxMuted) return;
  const baseVolume = volumeOverride !== undefined ? volumeOverride : entry.volume;
  const finalVolume = Math.max(0, Math.min(1, baseVolume * settings.sfxVolume));
  scene.sound.play(triggerId, { volume: finalVolume });
};
