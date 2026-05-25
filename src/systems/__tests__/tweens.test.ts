import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("phaser", async () => {
  const { vi } = await import("vitest");
  return {
    default: {
      Math: {
        Easing: {
          Linear: { Linear: vi.fn((v: number) => v) },
          Sine: {
            Out: vi.fn((v: number) => v),
            InOut: vi.fn((v: number) => v),
          },
          Elastic: { Out: vi.fn((v: number) => v) },
          Back: { Out: vi.fn((v: number) => v) },
          Cubic: {
            Out: vi.fn((v: number) => v),
            InOut: vi.fn((v: number) => v),
          },
          Quintic: { Out: vi.fn((v: number) => v) },
          Quadratic: { Out: vi.fn((v: number) => v) },
        },
      },
      Scene: class Scene {},
      GameObjects: { GameObject: class GameObject {} },
    },
  };
});

import type { Tweenable } from "../tweens";
import { runTween, TWEEN_REGISTRY } from "../tweens";
import { GameState } from "../../state/GameState";

const createMockScene = () => {
  const tweensAdd = vi.fn(() => ({ once: vi.fn() }));
  return {
    tweens: { add: tweensAdd },
  } as unknown as Phaser.Scene;
};

const createMockTarget = (x = 180, y = 100) => {
  return {
    x,
    y,
    alpha: 1,
    scaleX: 1,
    scaleY: 1,
    width: 100,
    angle: 0,
  } as unknown as Tweenable;
};

describe("tweens", () => {
  beforeEach(() => {
    GameState.reset();
  });

  test("registry contains 16 event IDs", () => {
    expect(Object.keys(TWEEN_REGISTRY).length).toBe(16);
  });

  test("runTween returns tween for each known ID", () => {
    const scene = createMockScene();
    const target = createMockTarget();
    for (const id of Object.keys(TWEEN_REGISTRY)) {
      const result = runTween(scene, id, target);
      expect(result).not.toBeNull();
    }
    expect(scene.tweens.add).toHaveBeenCalledTimes(16);
  });

  test("runTween warns and returns null for unknown id", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const scene = createMockScene();
    const result = runTween(scene, "unknown_id", createMockTarget());
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown tween"),
    );
    warnSpy.mockRestore();
  });
});
