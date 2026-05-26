import { getPlatform } from "./platform";
import { isAdsRemoved } from "./ads";

let bannerVisible = false;

export async function showBanner(): Promise<void> {
  if (isAdsRemoved()) {
    if (bannerVisible) await hideBannerInternal();
    return;
  }

  const { available, sdk } = getPlatform();
  if (!available || !sdk?.adv) return;

  try {
    await sdk.adv.showBannerAdv();
    bannerVisible = true;
  } catch {
    // fail-soft
  }
}

export async function hideBanner(): Promise<void> {
  await hideBannerInternal();
}

async function hideBannerInternal(): Promise<void> {
  const { available, sdk } = getPlatform();
  if (!available || !sdk?.adv) return;

  try {
    await sdk.adv.hideBannerAdv();
    bannerVisible = false;
  } catch {
    // fail-soft
  }
}

export function isBannerVisible(): boolean {
  return bannerVisible;
}
