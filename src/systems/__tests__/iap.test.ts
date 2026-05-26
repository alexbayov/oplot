import { describe, expect, test, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

const makePlatform = (overrides: Record<string, unknown> = {}) => {
  const payments = {
    purchase: vi.fn(),
    getPurchases: vi.fn().mockResolvedValue([]),
    getCatalog: vi.fn(),
    consumePurchase: vi.fn(),
    ...overrides,
  };
  return {
    init: vi.fn().mockResolvedValue({
      getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
      getPayments: vi.fn().mockResolvedValue(payments),
      payments,
      adv: {
        showRewardedVideo: vi.fn(),
        showFullscreenAdv: vi.fn(),
        showBannerAdv: vi.fn(),
        hideBannerAdv: vi.fn(),
        getBannerAdvStatus: vi.fn(),
      },
    }),
  };
};

describe("iap — init", () => {
  test("initializes payments successfully", async () => {
    vi.stubGlobal("YaGames", makePlatform());
    const { initPlatform } = await import("../platform");
    const { initIap, isIapReady } = await import("../iap");
    await initPlatform();
    await initIap();

    expect(isIapReady()).toBe(true);
  });

  test("iapReady=false when platform unavailable", async () => {
    vi.stubGlobal("YaGames", undefined);
    const { initPlatform } = await import("../platform");
    const { initIap, isIapReady } = await import("../iap");
    await initPlatform();
    await initIap();

    expect(isIapReady()).toBe(false);
  });

  test("iapReady=false when getPayments fails", async () => {
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue({
        getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
        getPayments: vi.fn().mockRejectedValue(new Error("fail")),
        adv: { showRewardedVideo: vi.fn(), showFullscreenAdv: vi.fn() },
      }),
    });
    const { initPlatform } = await import("../platform");
    const { initIap, isIapReady } = await import("../iap");
    await initPlatform();
    await initIap();

    expect(isIapReady()).toBe(false);
  });
});

describe("iap — purchase", () => {
  test("returns purchase on success", async () => {
    const payments = {
      purchase: vi.fn().mockResolvedValue({ productID: "starter_pack", purchaseToken: "tok" }),
      getPurchases: vi.fn().mockResolvedValue([]),
      getCatalog: vi.fn(),
      consumePurchase: vi.fn(),
    };
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue({
        getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
        getPayments: vi.fn().mockResolvedValue(payments),
        payments,
        adv: { showRewardedVideo: vi.fn(), showFullscreenAdv: vi.fn() },
      }),
    });
    const { initPlatform } = await import("../platform");
    const { initIap, purchaseProduct } = await import("../iap");
    await initPlatform();
    await initIap();

    const result = await purchaseProduct("starter_pack");
    expect(result).toEqual({ productID: "starter_pack", purchaseToken: "tok" });
  });

  test("returns null on purchase failure", async () => {
    const payments = {
      purchase: vi.fn().mockRejectedValue(new Error("cancelled")),
      getPurchases: vi.fn().mockResolvedValue([]),
      getCatalog: vi.fn(),
      consumePurchase: vi.fn(),
    };
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue({
        getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
        getPayments: vi.fn().mockResolvedValue(payments),
        payments,
        adv: { showRewardedVideo: vi.fn(), showFullscreenAdv: vi.fn() },
      }),
    });
    const { initPlatform } = await import("../platform");
    const { initIap, purchaseProduct } = await import("../iap");
    await initPlatform();
    await initIap();

    const result = await purchaseProduct("starter_pack");
    expect(result).toBeNull();
  });

  test("returns null when iap not ready", async () => {
    vi.stubGlobal("YaGames", undefined);
    const { initPlatform } = await import("../platform");
    const { purchaseProduct } = await import("../iap");
    await initPlatform();

    const result = await purchaseProduct("starter_pack");
    expect(result).toBeNull();
  });
});

describe("iap — unprocessed purchases", () => {
  test("processes consumable and sets ads_removed flag", async () => {
    const payments = {
      purchase: vi.fn(),
      getPurchases: vi.fn().mockResolvedValue([
        { productID: "disable_ads", purchaseToken: "t1" },
        { productID: "starter_pack", purchaseToken: "t2" },
      ]),
      getCatalog: vi.fn(),
      consumePurchase: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue({
        getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
        getPayments: vi.fn().mockResolvedValue(payments),
        payments,
        adv: { showRewardedVideo: vi.fn(), showFullscreenAdv: vi.fn() },
      }),
    });
    const { initPlatform } = await import("../platform");
    const { initIap, checkUnprocessedPurchases, registerConsumable } =
      await import("../iap");
    const { isAdsRemoved } = await import("../ads");
    await initPlatform();
    await initIap();

    let consumed = false;
    registerConsumable("starter_pack", async () => {
      consumed = true;
    });

    expect(isAdsRemoved()).toBe(false);
    await checkUnprocessedPurchases();
    expect(isAdsRemoved()).toBe(true);
    expect(consumed).toBe(true);
  });

  test("does nothing when iap not ready", async () => {
    vi.stubGlobal("YaGames", undefined);
    const { initPlatform } = await import("../platform");
    const { checkUnprocessedPurchases } = await import("../iap");
    await initPlatform();

    await expect(checkUnprocessedPurchases()).resolves.toBeUndefined();
  });
});

describe("iap — getCatalog", () => {
  test("returns catalog array", async () => {
    const payments = {
      purchase: vi.fn(),
      getPurchases: vi.fn().mockResolvedValue([]),
      getCatalog: vi.fn().mockResolvedValue([{
        id: "starter_pack", title: "Стартовый набор", description: "desc",
        imageURI: "", price: "49", priceValue: "49", priceCurrencyCode: "RUB",
        getPriceCurrencyImage: () => "",
      }]),
      consumePurchase: vi.fn(),
    };
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue({
        getPlayer: vi.fn().mockResolvedValue({ setData: vi.fn(), getData: vi.fn() }),
        getPayments: vi.fn().mockResolvedValue(payments),
        payments,
        adv: { showRewardedVideo: vi.fn(), showFullscreenAdv: vi.fn() },
      }),
    });
    const { initPlatform } = await import("../platform");
    const { initIap, getCatalog } = await import("../iap");
    await initPlatform();
    await initIap();

    const catalog = await getCatalog();
    expect(catalog).toHaveLength(1);
    if (!catalog[0]) throw new Error("empty catalog");
    expect(catalog[0].id).toBe("starter_pack");
  });

  test("returns empty array when iap not ready", async () => {
    vi.stubGlobal("YaGames", undefined);
    const { initPlatform } = await import("../platform");
    const { getCatalog } = await import("../iap");
    await initPlatform();

    const catalog = await getCatalog();
    expect(catalog).toEqual([]);
  });
});
