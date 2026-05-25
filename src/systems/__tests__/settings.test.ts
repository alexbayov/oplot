import { describe, expect, test } from "vitest";
import { GameState, setSfxMute, setSfxVolume } from "../../state/GameState";

describe("settings", () => {
  test("mute toggle flips value", () => {
    const before = GameState.settings.sfxMuted;
    setSfxMute(!before);
    expect(GameState.settings.sfxMuted).toBe(!before);
    setSfxMute(before);
  });

  test("volume clamps high", () => {
    setSfxVolume(5);
    expect(GameState.settings.sfxVolume).toBe(1);
  });

  test("volume clamps low and normal", () => {
    setSfxVolume(-0.5);
    expect(GameState.settings.sfxVolume).toBe(0);
    setSfxVolume(0.75);
    expect(GameState.settings.sfxVolume).toBe(0.75);
  });
});
