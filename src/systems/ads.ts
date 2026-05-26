import { getPlatform } from "./platform";

export type RewardedContext = "loot_double" | "second_chance" | "daily_reset" | "gas_refill";

let adsRemoved = false;

export function setAdsRemoved(removed: boolean): void {
  adsRemoved = removed;
}

export function isAdsRemoved(): boolean {
  return adsRemoved;
}

export function isRewardedAvailable(): boolean {
  const { available, sdk } = getPlatform();
  return available && sdk?.adv?.showRewardedVideo !== undefined;
}

export function showRewardedVideo(
  _context: RewardedContext,
  onRewarded: () => void,
  onClose?: () => void,
): void {
  void _context;
  if (adsRemoved) {
    onRewarded();
    onClose?.();
    return;
  }

  const { available, sdk } = getPlatform();
  if (!available || !sdk?.adv) {
    onClose?.();
    return;
  }

  sdk.adv.showRewardedVideo({
    callbacks: {
      onOpen: () => { /* ad opened */ },
      onRewarded: () => {
        onRewarded();
      },
      onClose: () => {
        onClose?.();
      },
      onError: () => {
        onClose?.();
      },
    },
  });
}

export function showInterstitial(onClose?: () => void): void {
  if (adsRemoved) {
    onClose?.();
    return;
  }

  const { available, sdk } = getPlatform();
  if (!available || !sdk?.adv) {
    onClose?.();
    return;
  }

  sdk.adv.showFullscreenAdv({
    callbacks: {
      onOpen: () => { /* ad opened */ },
      onClose: () => {
        onClose?.();
      },
      onError: () => {
        onClose?.();
      },
    },
  });
}
