import { describe, expect, test, vi, beforeEach } from "vitest";
import { openOverlay, closeOverlay, isOverlayOpen } from "../sceneStack";

/**
 * Минимальный mock Phaser.Scene с тем подмножеством API, что мы используем.
 */
const makeMockScene = (key: string, activeOverlays = new Set<string>()): {
  scene: ReturnType<typeof makeSceneManager>;
  registry: Map<string, unknown> & {
    set: (k: string, v: unknown) => void;
    get: (k: string) => unknown;
    remove: (k: string) => void;
  };
} => {
  const registry = new Map<string, unknown>() as Map<string, unknown> & {
    set: (k: string, v: unknown) => void;
    get: (k: string) => unknown;
    remove: (k: string) => void;
  };
  // Map.set уже возвращает Map, но нам не критично. Map.get тоже подходит.
  registry.remove = (k: string): void => {
    registry.delete(k);
  };
  return {
    scene: makeSceneManager(key, activeOverlays),
    registry,
  };
};

const makeSceneManager = (
  selfKey: string,
  active: Set<string>,
  paused: Set<string> = new Set<string>(),
): {
  key: string;
  isActive: (k: string) => boolean;
  isPaused: (k: string) => boolean;
  launch: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
} => ({
  key: selfKey,
  isActive: (k: string) => active.has(k),
  isPaused: (k: string) => paused.has(k),
  launch: vi.fn((k: string) => {
    active.add(k);
  }),
  pause: vi.fn((k: string) => {
    paused.add(k);
  }),
  resume: vi.fn((k: string) => {
    paused.delete(k);
  }),
  stop: vi.fn((k: string) => {
    active.delete(k);
  }),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sceneStack", () => {
  test("openOverlay launches overlay and pauses current", () => {
    const baseScene = makeMockScene("BaseScene");
    openOverlay(baseScene as unknown as Parameters<typeof openOverlay>[0], "CraftScene");

    expect(baseScene.scene.launch).toHaveBeenCalledWith("CraftScene", undefined);
    expect(baseScene.scene.pause).toHaveBeenCalledWith("BaseScene");
    expect(baseScene.registry.get("__overlayParent:CraftScene")).toBe("BaseScene");
  });

  test("openOverlay passes data to overlay scene", () => {
    const baseScene = makeMockScene("BaseScene");
    openOverlay(
      baseScene as unknown as Parameters<typeof openOverlay>[0],
      "InventoryScene",
      { focusItem: "scrap" },
    );

    expect(baseScene.scene.launch).toHaveBeenCalledWith("InventoryScene", {
      focusItem: "scrap",
    });
  });

  test("openOverlay is idempotent (no double-launch)", () => {
    const baseScene = makeMockScene("BaseScene", new Set(["CraftScene"]));
    openOverlay(baseScene as unknown as Parameters<typeof openOverlay>[0], "CraftScene");

    expect(baseScene.scene.launch).not.toHaveBeenCalled();
    expect(baseScene.scene.pause).not.toHaveBeenCalled();
  });

  test("closeOverlay stops overlay and resumes parent", () => {
    const overlay = makeMockScene("CraftScene");
    overlay.registry.set("__overlayParent:CraftScene", "BaseScene");
    // Симулируем что BaseScene на паузе
    overlay.scene = makeSceneManager(
      "CraftScene",
      new Set(["CraftScene"]),
      new Set(["BaseScene"]),
    );

    closeOverlay(overlay as unknown as Parameters<typeof closeOverlay>[0]);

    expect(overlay.scene.resume).toHaveBeenCalledWith("BaseScene");
    expect(overlay.scene.stop).toHaveBeenCalledWith("CraftScene");
    expect(overlay.registry.get("__overlayParent:CraftScene")).toBeUndefined();
  });

  test("closeOverlay does not call resume if parent not paused", () => {
    const overlay = makeMockScene("CraftScene");
    overlay.registry.set("__overlayParent:CraftScene", "BaseScene");
    // Симулируем что BaseScene НЕ на паузе (нештатный сценарий)
    overlay.scene = makeSceneManager(
      "CraftScene",
      new Set(["CraftScene"]),
      new Set<string>(),
    );

    closeOverlay(overlay as unknown as Parameters<typeof closeOverlay>[0]);

    expect(overlay.scene.resume).not.toHaveBeenCalled();
    expect(overlay.scene.stop).toHaveBeenCalledWith("CraftScene");
  });

  test("isOverlayOpen reflects active state", () => {
    const baseScene = makeMockScene("BaseScene", new Set(["CraftScene"]));
    expect(
      isOverlayOpen(
        baseScene as unknown as Parameters<typeof isOverlayOpen>[0],
        "CraftScene",
      ),
    ).toBe(true);
    expect(
      isOverlayOpen(
        baseScene as unknown as Parameters<typeof isOverlayOpen>[0],
        "InventoryScene",
      ),
    ).toBe(false);
  });
});
