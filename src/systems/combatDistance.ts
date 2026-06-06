export type DistanceBand = "close" | "medium" | "far";
export type DistanceMoveDirection = "closer" | "away";
export type DistanceMoveDisabledReason = "already_close" | "already_far" | "invalid_distance" | "invalid_direction";

export interface DistanceMovePlanOk {
  ok: true;
  from: DistanceBand;
  to: DistanceBand;
  direction: DistanceMoveDirection;
  apCost: number;
}

export interface DistanceMovePlanBlocked {
  ok: false;
  from: DistanceBand | null;
  direction: DistanceMoveDirection | null;
  reason: DistanceMoveDisabledReason;
  apCost: number;
}

export type DistanceMovePlan = DistanceMovePlanOk | DistanceMovePlanBlocked;
export type DistanceBandLabel = "близко" | "средне" | "далеко";

export const DEFAULT_DISTANCE_BAND: DistanceBand = "medium";
export const DEFAULT_DISTANCE_MOVE_AP_COST = 1;

const DISTANCE_BAND_LABELS: Record<DistanceBand, DistanceBandLabel> = {
  close: "близко",
  medium: "средне",
  far: "далеко",
};

const DISTANCE_MOVE_BUTTON_LABELS: Record<DistanceMoveDirection, string> = {
  closer: "БЛИЖЕ",
  away: "ДАЛЬШЕ",
};

const DISTANCE_MOVE_PREVIEW_LABELS: Record<DistanceMoveDirection, string> = {
  closer: "Ближе",
  away: "Дальше",
};

const DISTANCE_MOVE_DISABLED_REASON_LABELS: Record<DistanceMoveDisabledReason, string> = {
  already_close: "уже близко",
  already_far: "уже далеко",
  invalid_distance: "неизвестная дистанция",
  invalid_direction: "неизвестное направление",
};

const normalizeApCost = (apCost: number | undefined): number => {
  if (apCost === undefined) return DEFAULT_DISTANCE_MOVE_AP_COST;
  if (!Number.isFinite(apCost) || !Number.isInteger(apCost) || apCost < 0) return DEFAULT_DISTANCE_MOVE_AP_COST;
  return apCost;
};

export const normalizeDistanceBand = (value: unknown): DistanceBand | null => {
  if (value === "close" || value === "medium" || value === "far") return value;
  return null;
};

export const getDistanceBandLabelRu = (band: DistanceBand): string => DISTANCE_BAND_LABELS[band];

export const getDistanceChipText = (band: DistanceBand): string => `Дистанция: ${getDistanceBandLabelRu(band)}`;

export const normalizeDistanceMoveDirection = (value: unknown): DistanceMoveDirection | null => {
  if (value === "closer" || value === "away") return value;
  return null;
};

export const getNextDistanceBand = (
  current: DistanceBand,
  direction: DistanceMoveDirection,
): DistanceBand | null => {
  if (direction === "closer") {
    if (current === "close") return null;
    if (current === "medium") return "close";
    return "medium";
  }

  if (current === "far") return null;
  if (current === "medium") return "far";
  return "medium";
};

export const getDistanceMoveDisabledReason = (
  current: unknown,
  direction: unknown,
): DistanceMoveDisabledReason | null => {
  const normalizedCurrent = normalizeDistanceBand(current);
  if (normalizedCurrent === null) return "invalid_distance";

  const normalizedDirection = normalizeDistanceMoveDirection(direction);
  if (normalizedDirection === null) return "invalid_direction";

  if (normalizedCurrent === "close" && normalizedDirection === "closer") return "already_close";
  if (normalizedCurrent === "far" && normalizedDirection === "away") return "already_far";
  return null;
};

export const getDistanceMoveDisabledReasonLabel = (reason: DistanceMoveDisabledReason): string =>
  DISTANCE_MOVE_DISABLED_REASON_LABELS[reason];

export const computeDistanceMovePlan = ({
  current,
  direction,
  apCost,
}: {
  current: unknown;
  direction: unknown;
  apCost?: number;
}): DistanceMovePlan => {
  const normalizedApCost = normalizeApCost(apCost);
  const normalizedCurrent = normalizeDistanceBand(current);
  const normalizedDirection = normalizeDistanceMoveDirection(direction);

  if (normalizedCurrent === null) {
    return {
      ok: false,
      from: null,
      direction: normalizedDirection,
      reason: "invalid_distance",
      apCost: normalizedApCost,
    };
  }

  if (normalizedDirection === null) {
    return {
      ok: false,
      from: normalizedCurrent,
      direction: null,
      reason: "invalid_direction",
      apCost: normalizedApCost,
    };
  }

  const disabledReason = getDistanceMoveDisabledReason(normalizedCurrent, normalizedDirection);
  if (disabledReason !== null) {
    return {
      ok: false,
      from: normalizedCurrent,
      direction: normalizedDirection,
      reason: disabledReason,
      apCost: normalizedApCost,
    };
  }

  const nextBand = getNextDistanceBand(normalizedCurrent, normalizedDirection);
  if (nextBand === null) {
    return {
      ok: false,
      from: normalizedCurrent,
      direction: normalizedDirection,
      reason: normalizedDirection === "closer" ? "already_close" : "already_far",
      apCost: normalizedApCost,
    };
  }

  return {
    ok: true,
    from: normalizedCurrent,
    to: nextBand,
    direction: normalizedDirection,
    apCost: normalizedApCost,
  };
};

export const formatDistanceMovePreview = (
  direction: DistanceMoveDirection,
  plan: DistanceMovePlan,
): string => {
  const actionLabel = DISTANCE_MOVE_PREVIEW_LABELS[direction];
  if (plan.ok) return `${actionLabel} ${plan.apCost} AP: готово`;
  return `${actionLabel} ${plan.apCost} AP: ${getDistanceMoveDisabledReasonLabel(plan.reason)}`;
};

export const getDistanceMoveButtonLabel = (direction: DistanceMoveDirection): string =>
  DISTANCE_MOVE_BUTTON_LABELS[direction];

export const getDistanceBandLabel = getDistanceBandLabelRu;

export const formatDistanceChip = getDistanceChipText;

export const canMoveDistance = (band: DistanceBand, direction: DistanceMoveDirection): boolean =>
  getDistanceMoveDisabledReason(band, direction) === null;
