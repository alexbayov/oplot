export type DistanceBand = "close" | "medium" | "far";
export type DistanceMoveDirection = "closer" | "away";
export type DistanceBandLabel = "близко" | "средне" | "далеко";

export const DEFAULT_DISTANCE_BAND: DistanceBand = "medium";

const DISTANCE_BAND_LABELS: Record<DistanceBand, DistanceBandLabel> = {
  close: "близко",
  medium: "средне",
  far: "далеко",
};

const CLOSER_BAND: Record<DistanceBand, DistanceBand> = {
  close: "close",
  medium: "close",
  far: "medium",
};

const AWAY_BAND: Record<DistanceBand, DistanceBand> = {
  close: "medium",
  medium: "far",
  far: "far",
};

export const getDistanceBandLabel = (band: DistanceBand): DistanceBandLabel => DISTANCE_BAND_LABELS[band];

export const formatDistanceChip = (band: DistanceBand): string => `Дистанция: ${getDistanceBandLabel(band)}`;

export const canMoveDistance = (band: DistanceBand, direction: DistanceMoveDirection): boolean => {
  if (direction === "closer") return band !== "close";
  return band !== "far";
};

export const getNextDistanceBand = (band: DistanceBand, direction: DistanceMoveDirection): DistanceBand => {
  if (direction === "closer") return CLOSER_BAND[band];
  return AWAY_BAND[band];
};
