import { describe, expect, test, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("ads — rewarded video", () => {
  test("calls showRewardedVideo with correct callbacks", async () => {
    const mockShowRewarded = vi.fn();
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue({
        getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
        adv: { showRewardedVideo: mockShowRewarded, showFullscreenAdv: vi.fn() },
      }),
    });
    const { initPlatform } = await import("../platform");
    const { showRewardedVideo } = await import("../ads");
    await initPlatform();

    const onRewarded = vi.fn();
    const onClose = vi.fn();
    showRewardedVideo("loot_double", onRewarded, onClose);

    expect(mockShowRewarded).toHaveBeenCalledOnce();
    const firstCall = mockShowRewarded.mock.calls[0];
    if (!firstCall) throw new Error("no calls");
    const callbacks = firstCall[0]?.callbacks;
    callbacks?.onRewarded?.();
    expect(onRewarded).toHaveBeenCalled();
    callbacks?.onClose?.(true);
    expect(onClose).toHaveBeenCalled();
  });

  test("skips ad and calls onRewarded immediately when ads removed", async () => {
    const mockShowRewarded = vi.fn();
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue({
        getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
        adv: { showRewardedVideo: mockShowRewarded, showFullscreenAdv: vi.fn() },
      }),
    });
    const { initPlatform } = await import("../platform");
    const { showRewardedVideo, setAdsRemoved } = await import("../ads");
    await initPlatform();
    setAdsRemoved(true);

    const onRewarded = vi.fn();
    const onClose = vi.fn();
    showRewardedVideo("second_chance", onRewarded, onClose);

    expect(mockShowRewarded).not.toHaveBeenCalled();
    expect(onRewarded).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test("does not crash when YaGames undefined (fail-soft)", async () => {
    vi.stubGlobal("YaGames", undefined);
    const { initPlatform } = await import("../platform");
    const { showRewardedVideo } = await import("../ads");
    await initPlatform();

    const onRewarded = vi.fn();
    const onClose = vi.fn();
    showRewardedVideo("daily_reset", onRewarded, onClose);

    expect(onRewarded).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test("calls onClose on ad error", async () => {
    const mockShowRewarded = vi.fn();
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue({
        getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
        adv: { showRewardedVideo: mockShowRewarded, showFullscreenAdv: vi.fn() },
      }),
    });
    const { initPlatform } = await import("../platform");
    const { showRewardedVideo } = await import("../ads");
    await initPlatform();

    const onRewarded = vi.fn();
    const onClose = vi.fn();
    showRewardedVideo("gas_refill", onRewarded, onClose);

    const rwCall = mockShowRewarded.mock.calls[0];
    if (!rwCall) throw new Error("no calls");
    const callbacks = rwCall[0]?.callbacks;
    callbacks?.onError?.({});
    expect(onClose).toHaveBeenCalled();
    expect(onRewarded).not.toHaveBeenCalled();
  });
});

describe("ads — interstitial", () => {
  test("calls showFullscreenAdv and onClose", async () => {
    const mockFullscreen = vi.fn();
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue({
        getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
        adv: { showRewardedVideo: vi.fn(), showFullscreenAdv: mockFullscreen },
      }),
    });
    const { initPlatform } = await import("../platform");
    const { showInterstitial } = await import("../ads");
    await initPlatform();

    const onClose = vi.fn();
    showInterstitial(onClose);

    expect(mockFullscreen).toHaveBeenCalledOnce();
    const fsCall = mockFullscreen.mock.calls[0];
    if (!fsCall) throw new Error("no calls");
    const callbacks = fsCall[0]?.callbacks;
    callbacks?.onClose?.(true);
    expect(onClose).toHaveBeenCalled();
  });

  test("skips ads when ads removed", async () => {
    const mockFullscreen = vi.fn();
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue({
        getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
        adv: { showRewardedVideo: vi.fn(), showFullscreenAdv: mockFullscreen },
      }),
    });
    const { initPlatform } = await import("../platform");
    const { showInterstitial, setAdsRemoved } = await import("../ads");
    await initPlatform();
    setAdsRemoved(true);

    const onClose = vi.fn();
    showInterstitial(onClose);

    expect(mockFullscreen).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test("fail-soft when platform unavailable", async () => {
    vi.stubGlobal("YaGames", undefined);
    const { initPlatform } = await import("../platform");
    const { showInterstitial } = await import("../ads");
    await initPlatform();

    const onClose = vi.fn();
    showInterstitial(onClose);

    expect(onClose).toHaveBeenCalled();
  });

  test("calls onClose on ad error", async () => {
    const mockFullscreen = vi.fn();
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue({
        getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
        adv: { showRewardedVideo: vi.fn(), showFullscreenAdv: mockFullscreen },
      }),
    });
    const { initPlatform } = await import("../platform");
    const { showInterstitial } = await import("../ads");
    await initPlatform();

    const onClose = vi.fn();
    showInterstitial(onClose);

    const fsCall2 = mockFullscreen.mock.calls[0];
    if (!fsCall2) throw new Error("no calls");
    const callbacks = fsCall2[0]?.callbacks;
    callbacks?.onError?.({});
    expect(onClose).toHaveBeenCalled();
  });
});

describe("isRewardedAvailable", () => {
  test("returns true when platform available", async () => {
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue({
        getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
        adv: { showRewardedVideo: vi.fn(), showFullscreenAdv: vi.fn() },
      }),
    });
    const { initPlatform } = await import("../platform");
    const { isRewardedAvailable } = await import("../ads");
    await initPlatform();

    expect(isRewardedAvailable()).toBe(true);
  });

  test("returns false when platform unavailable", async () => {
    vi.stubGlobal("YaGames", undefined);
    const { initPlatform } = await import("../platform");
    const { isRewardedAvailable } = await import("../ads");
    await initPlatform();

    expect(isRewardedAvailable()).toBe(false);
  });
});
