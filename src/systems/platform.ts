interface YaGamesSDK {
  features?: {
    LoadingAPI?: {
      ready: () => void;
    };
  };
  getPlayer: () => Promise<Player>;
  getPayments?: (opts?: { signed?: boolean }) => Promise<PaymentsAPI>;
  screen?: {
    orientation?: {
      lock: (orientation: string) => Promise<void>;
    };
  };
  environment?: {
    i18n?: {
      lang: string;
    };
  };
  adv?: AdvAPI;
  payments?: PaymentsAPI;
}

interface AdvCallbacks {
  onOpen?: () => void;
  onClose?: (wasShown: boolean) => void;
  onError?: (error: unknown) => void;
  onRewarded?: () => void;
}

interface AdvAPI {
  showFullscreenAdv: (callbacks?: { callbacks?: AdvCallbacks }) => void;
  showRewardedVideo: (callbacks?: { callbacks?: AdvCallbacks }) => void;
  showBannerAdv: () => Promise<{ stickyAdvIsShowing: boolean; reason?: string }>;
  hideBannerAdv: () => Promise<{ stickyAdvIsShowing: boolean }>;
  getBannerAdvStatus: () => Promise<{ stickyAdvIsShowing: boolean; reason?: string }>;
}

interface IapPurchase {
  productID: string;
  purchaseToken: string;
  developerPayload?: string;
}

interface IapProduct {
  id: string;
  title: string;
  description: string;
  imageURI: string;
  price: string;
  priceValue: string;
  priceCurrencyCode: string;
  getPriceCurrencyImage: (size: 'small' | 'medium' | 'svg') => string;
}

interface PaymentsAPI {
  purchase: (data: { id: string; developerPayload?: string }) => Promise<IapPurchase>;
  getPurchases: () => Promise<IapPurchase[]>;
  getCatalog: () => Promise<IapProduct[]>;
  consumePurchase: (purchaseToken: string) => Promise<void>;
}

interface Player {
  setData: (data: Record<string, unknown>, flush?: boolean) => Promise<void>;
  getData: (keys: string[]) => Promise<Record<string, unknown>>;
}

export interface PlatformResult {
  available: boolean;
  sdk: YaGamesSDK | null;
  player: Player | null;
}

let cachedResult: PlatformResult = {
  available: false,
  sdk: null,
  player: null,
};

let initPromise: Promise<PlatformResult> | null = null;

interface InitPlatformOptions {
  /**
   * How long to wait for the async Yandex Games SDK script to define
   * globalThis.YaGames before falling back to off-platform mode.
   */
  sdkWaitMs?: number;
  pollIntervalMs?: number;
}

interface YaGamesGlobal {
  init: () => Promise<unknown>;
}

const getYaGames = (): YaGamesGlobal | undefined => {
  return (globalThis as { YaGames?: YaGamesGlobal }).YaGames;
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForYaGames(
  timeoutMs: number,
  pollIntervalMs: number,
): Promise<YaGamesGlobal | undefined> {
  const immediate = getYaGames();
  if (immediate || timeoutMs <= 0) return immediate;

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    await delay(pollIntervalMs);
    const yaGames = getYaGames();
    if (yaGames) return yaGames;
  }

  return getYaGames();
}

export function initPlatform(options: InitPlatformOptions = {}): Promise<PlatformResult> {
  if (initPromise) return initPromise;

  const defaultSdkWaitMs = import.meta.env?.MODE === "test" ? 0 : 1500;
  const { sdkWaitMs = defaultSdkWaitMs, pollIntervalMs = 50 } = options;

  initPromise = (async (): Promise<PlatformResult> => {
    const yaGames = await waitForYaGames(sdkWaitMs, pollIntervalMs);

    if (!yaGames) {
      console.warn("[platform] YaGames not available");
      cachedResult = { available: false, sdk: null, player: null };
      return cachedResult;
    }

    try {
      const raw = await yaGames.init();
      const sdk = raw as YaGamesSDK;
      try {
        await sdk.screen?.orientation?.lock?.("landscape");
      } catch {
        // не критично — fallback на CSS rotate prompt
      }
      let player: Player | null = null;
      try {
        player = await sdk.getPlayer();
      } catch {
        console.warn("[platform] getPlayer() failed");
      }
      cachedResult = { available: true, sdk, player };
      return cachedResult;
    } catch {
      console.warn("[platform] YaGames.init() rejected");
      cachedResult = { available: false, sdk: null, player: null };
      return cachedResult;
    }
  })();

  return initPromise;
}

export function getPlatform(): PlatformResult {
  return cachedResult;
}
