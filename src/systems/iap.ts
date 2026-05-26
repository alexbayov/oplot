import { getPlatform } from "./platform";
import { setAdsRemoved } from "./ads";

export interface IapPurchase {
  productID: string;
  purchaseToken: string;
  developerPayload?: string;
}

export interface IapProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceValue: string;
  priceCurrencyCode: string;
  imageURI: string;
}

type ConsumableHandler = (purchase: IapPurchase) => Promise<void>;

const PURCHASE_HANDLERS: Record<string, ConsumableHandler | null> = {};
let iapReady = false;
let purchasesInstance: IapPurchase[] | null = null;

let consumeFn: ((token: string) => Promise<void>) | null = null;

export function registerConsumable(productId: string, handler: ConsumableHandler): void {
  PURCHASE_HANDLERS[productId] = handler;
}

export async function initIap(): Promise<void> {
  const { available, sdk } = getPlatform();
  if (!available || !sdk?.getPayments) {
    iapReady = false;
    return;
  }

  try {
    const payments = await sdk.getPayments();
    consumeFn = payments.consumePurchase.bind(payments);
    purchasesInstance = await payments.getPurchases();
    iapReady = true;
  } catch {
    iapReady = false;
  }
}

export async function purchaseProduct(productId: string): Promise<IapPurchase | null> {
  if (!iapReady) return null;

  const { sdk } = getPlatform();
  if (!sdk?.payments) return null;

  try {
    const purchase = await sdk.payments.purchase({ id: productId });
    return {
      productID: purchase.productID,
      purchaseToken: purchase.purchaseToken,
      developerPayload: purchase.developerPayload,
    };
  } catch {
    return null;
  }
}

export function getPurchases(): IapPurchase[] {
  return purchasesInstance ?? [];
}

export async function getCatalog(): Promise<IapProduct[]> {
  if (!iapReady) return [];

  const { sdk } = getPlatform();
  if (!sdk?.payments) return [];

  try {
    const catalog = await sdk.payments.getCatalog();
    return catalog.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      priceValue: p.priceValue,
      priceCurrencyCode: p.priceCurrencyCode,
      imageURI: p.imageURI,
    }));
  } catch {
    return [];
  }
}

export async function consumePurchase(token: string): Promise<void> {
  if (!consumeFn) return;
  try {
    await consumeFn(token);
  } catch {
    // fail-soft, will retry on next boot
  }
}

export async function checkUnprocessedPurchases(): Promise<void> {
  if (!iapReady) return;

  const purchases = getPurchases();
  for (const purchase of purchases) {
    if (purchase.productID === "disable_ads") {
      setAdsRemoved(true);
    }

    const handler = PURCHASE_HANDLERS[purchase.productID];
    if (handler) {
      try {
        await handler(purchase);
        await consumePurchase(purchase.purchaseToken);
      } catch {
        // fail-soft, will retry on next boot
      }
    }
  }
}

export function isIapReady(): boolean {
  return iapReady;
}
