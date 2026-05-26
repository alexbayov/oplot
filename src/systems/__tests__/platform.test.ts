import { describe, expect, test, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("platform", () => {
  test("fail-soft when YaGames undefined", async () => {
    vi.stubGlobal("YaGames", undefined);
    const { initPlatform, getPlatform } = await import("../platform");
    const result = await initPlatform();
    expect(result.available).toBe(false);
    expect(result.sdk).toBeNull();
    expect(result.player).toBeNull();
    expect(getPlatform()).toBe(result);
  });

  test("fail-soft when YaGames.init() rejects", async () => {
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockRejectedValue(new Error("init failed")),
    });
    const { initPlatform, getPlatform } = await import("../platform");
    const result = await initPlatform();
    expect(result.available).toBe(false);
    expect(result.sdk).toBeNull();
    expect(result.player).toBeNull();
    expect(getPlatform()).toBe(result);
  });

  test("successful init with player", async () => {
    const mockPlayer = {
      setData: vi.fn(),
      getData: vi.fn(),
    };
    const mockSdk = {
      features: { LoadingAPI: { ready: vi.fn() } },
      getPlayer: vi.fn().mockResolvedValue(mockPlayer),
      screen: { orientation: { lock: vi.fn() } },
      environment: { i18n: { lang: "ru" } },
    };
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue(mockSdk),
    });
    const { initPlatform, getPlatform } = await import("../platform");
    const result = await initPlatform();
    expect(result.available).toBe(true);
    expect(result.sdk).toBe(mockSdk);
    expect(result.player).toBe(mockPlayer);
    expect(getPlatform()).toBe(result);
  });

  test("init succeeds but getPlayer() rejects", async () => {
    const mockSdk = {
      features: {},
      getPlayer: vi.fn().mockRejectedValue(new Error("no player")),
    };
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue(mockSdk),
    });
    const { initPlatform, getPlatform } = await import("../platform");
    const result = await initPlatform();
    expect(result.available).toBe(true);
    expect(result.sdk).toBe(mockSdk);
    expect(result.player).toBeNull();
    expect(getPlatform()).toBe(result);
  });
});
