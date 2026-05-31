export const DEFAULT_PLAYER_AP = 3;

export type CombatActionId = "attack" | "aimed_shot" | "cover" | "heal" | "retreat" | "reload";

export type CombatActionDisabledReason = "not_enough_ap" | "no_valid_target" | "action_unavailable" | "no_medkit";

const ACTION_COSTS: Record<CombatActionId, number> = {
  attack: 1,
  aimed_shot: 2,
  cover: 1,
  heal: 1,
  retreat: 2,
  reload: 1,
};

export interface CombatApState {
  readonly current: number;
  readonly max: number;
}

export interface CombatActionAvailabilityInput {
  readonly action: CombatActionId;
  readonly currentAp: number;
  readonly hasValidTarget?: boolean;
  readonly hasMedkit?: boolean;
  readonly available?: boolean;
}

export const createCombatApState = (max = DEFAULT_PLAYER_AP): CombatApState => ({
  current: max,
  max,
});

export const resetCombatAp = (max = DEFAULT_PLAYER_AP): CombatApState => createCombatApState(max);

export const getCombatActionCost = (action: CombatActionId): number => ACTION_COSTS[action];

export const getCombatActionDisabledReason = ({
  action,
  currentAp,
  hasValidTarget = true,
  hasMedkit = true,
  available = true,
}: CombatActionAvailabilityInput): CombatActionDisabledReason | null => {
  if (!available) return "action_unavailable";
  if ((action === "attack" || action === "aimed_shot") && !hasValidTarget) return "no_valid_target";
  if (action === "heal" && !hasMedkit) return "no_medkit";
  if (currentAp < getCombatActionCost(action)) return "not_enough_ap";
  return null;
};

export const formatCombatActionDisabledReason = (reason: CombatActionDisabledReason): string => {
  switch (reason) {
    case "not_enough_ap":
      return "не хватает AP";
    case "no_valid_target":
      return "нет цели";
    case "action_unavailable":
      return "действие недоступно";
    case "no_medkit":
      return "нет аптечки";
  }
};
