import type { InventoryStack } from "../state/types";
import type { RadioSignal, RadioSignalOptionId } from "../types";

export type ResolveStatus =
  | "OK"
  | "ALREADY_RESOLVED"
  | "REWARD_SKIPPED"
  | "AMBUSH_SKIPPED";

export interface RadioResolveResult {
  status: ResolveStatus;
  trustBefore: number;
  trustAfter: number;
  rewardAdded: InventoryStack | null;
  ambushMobId: string | null;
}

const TRUST_MIN = -5;
const TRUST_MAX = 5;

const clampTrust = (value: number): number =>
  Math.max(TRUST_MIN, Math.min(TRUST_MAX, value));

export const activeSignals = (signals: RadioSignal[]): RadioSignal[] =>
  signals.filter((s) => !s.resolved && s.expires_after_sorties > 0);

export const tickRadioOnReturn = (
  signals: RadioSignal[],
  trust: number,
): number => {
  for (const sig of signals) {
    if (sig.resolved) continue;
    if (sig.expires_after_sorties <= 0) {
      sig.resolved = true;
      sig.chosen_option = null;
      trust = clampTrust(trust + sig.trust_impact.ignore);
      continue;
    }
    sig.expires_after_sorties -= 1;
    if (sig.expires_after_sorties <= 0) {
      sig.resolved = true;
      sig.chosen_option = null;
      trust = clampTrust(trust + sig.trust_impact.ignore);
    }
  }
  return trust;
};

export const resolveRadioChoice = (
  signals: RadioSignal[],
  signalId: string,
  option: RadioSignalOptionId,
  trust: number,
  _baseStash: InventoryStack[],
  validItemIds: Set<string>,
  validMobIds: Set<string>,
): RadioResolveResult => {
  const sig = signals.find((s) => s.id === signalId);
  if (!sig || sig.resolved) {
    return {
      status: "ALREADY_RESOLVED",
      trustBefore: trust,
      trustAfter: trust,
      rewardAdded: null,
      ambushMobId: null,
    };
  }

  const trustBefore = trust;
  const impact =
    option === "respond" ? sig.trust_impact.respond : sig.trust_impact.ignore;
  const trustAfter = clampTrust(trustBefore + impact);

  sig.chosen_option = option;
  sig.resolved = true;

  let rewardAdded: InventoryStack | null = null;
  let ambushMobId: string | null = null;
  let status: ResolveStatus = "OK";

  if (option === "respond") {
    if (sig.reward !== null) {
      if (validItemIds.has(sig.reward.item_id)) {
        rewardAdded = { item_id: sig.reward.item_id, count: sig.reward.count };
      } else {
        status = "REWARD_SKIPPED";
      }
    }

    if (sig.trap_mob_id !== null) {
      if (validMobIds.has(sig.trap_mob_id)) {
        ambushMobId = sig.trap_mob_id;
      } else {
        status =
          status === "REWARD_SKIPPED"
            ? "REWARD_SKIPPED"
            : "AMBUSH_SKIPPED";
      }
    }
  }

  return { status, trustBefore, trustAfter, rewardAdded, ambushMobId };
};
