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

export function initPlatform(): Promise<PlatformResult> {
  if (initPromise) return initPromise;

  initPromise = (async (): Promise<PlatformResult> => {
    const yaGames = (
      globalThis as { YaGames?: { init: () => Promise<unknown> } }
    ).YaGames;

    if (!yaGames) {
      console.warn("[platform] YaGames not available");
      cachedResult = { available: false, sdk: null, player: null };
      return cachedResult;
    }

    try {
      const raw = await yaGames.init();
      const sdk = raw as YaGamesSDK;
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
