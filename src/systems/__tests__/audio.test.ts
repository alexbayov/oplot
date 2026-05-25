import { describe, expect, test, vi } from "vitest";

vi.mock("phaser", async () => {
  const { vi } = await import("vitest");
  return {
    default: {
      Scene: class Scene {
        cache = { audio: { has: vi.fn(() => false) } };
        sound = { play: vi.fn() };
        load = { audio: vi.fn() };
      },
    },
  };
});

import Phaser from "phaser";
import {
  loadSfxRegistry,
  playSfx,
  getSfxRegistry,
  setSfxRegistry,
} from "../audio";
import { GameState, setSfxMute, setSfxVolume } from "../../state/GameState";

describe("audio", () => {
  test("loadSfxRegistry fail-soft when file missing", async () => {
    const reg = await loadSfxRegistry();
    expect(reg).toBeNull();
    expect(getSfxRegistry()).toBeNull();
  });

  test("playSfx plays by trigger when asset cached", () => {
    const reg = { sfx_hit: { asset: "assets/audio/hit.wav", volume: 0.8 } };
    setSfxRegistry(reg);
    setSfxMute(false);
    setSfxVolume(1.0);
    GameState.reset();

    const scene = new Phaser.Scene({ key: "test" });
    const hasSpy = vi.spyOn(scene.cache.audio, "has").mockReturnValue(true);
    const playSpy = vi.spyOn(scene.sound, "play");

    playSfx(scene, "sfx_hit");
    expect(playSpy).toHaveBeenCalledWith(
      "sfx_hit",
      expect.objectContaining({ volume: 0.8 }),
    );

    hasSpy.mockRestore();
    playSpy.mockRestore();
  });

  test("mute silences play and volume scales", () => {
    const reg = { sfx_hit: { asset: "hit.wav", volume: 1.0 } };
    setSfxRegistry(reg);
    GameState.reset();
    const scene = new Phaser.Scene({ key: "test" });
    vi.spyOn(scene.cache.audio, "has").mockReturnValue(true);
    const playSpy = vi.spyOn(scene.sound, "play");

    setSfxMute(true);
    playSfx(scene, "sfx_hit");
    expect(playSpy).not.toHaveBeenCalled();

    setSfxMute(false);
    setSfxVolume(0.5);
    playSfx(scene, "sfx_hit", 0.8);
    expect(playSpy).toHaveBeenLastCalledWith(
      "sfx_hit",
      expect.objectContaining({ volume: 0.4 }),
    );

    playSpy.mockRestore();
  });
});
