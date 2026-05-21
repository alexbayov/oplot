import type { RadioSignal } from "../types";

// Active signals shown in RadioScene list: not dismissed and still has time-budget.
export const activeSignals = (signals: RadioSignal[]): RadioSignal[] =>
  signals.filter((s) => !s.dismissed && s.expires_after_sorties > 0);

// GDD §10.M3.3: on every successful return, decrement expires_after_sorties on each
// non-dismissed signal and auto-dismiss when the counter reaches 0. Mutates signals.
// No rewards, no ambush, no trust — anti-scope M6.
export const tickRadioOnReturn = (signals: RadioSignal[]): void => {
  for (const sig of signals) {
    if (sig.dismissed) continue;
    if (sig.expires_after_sorties <= 0) {
      sig.dismissed = true;
      continue;
    }
    sig.expires_after_sorties -= 1;
    if (sig.expires_after_sorties <= 0) {
      sig.dismissed = true;
    }
  }
};

// GDD §10.M3.2: clicking either option flips dismissed to true. Both options behave
// identically on M3 — the semantic choice is narrative only (M6 will branch outcomes).
export const dismissSignal = (signals: RadioSignal[], id: string): void => {
  for (const sig of signals) {
    if (sig.id === id) {
      sig.dismissed = true;
      return;
    }
  }
};
