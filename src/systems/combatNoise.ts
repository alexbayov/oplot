export type NoiseLevelLabel = "тихо" | "слышно" | "опасно" | "шум критический";

export type NoisePreviewAction =
  | "valid_firearm_shot"
  | "empty_magazine_fallback"
  | "melee"
  | "reload"
  | "cover"
  | "movement_preview"
  | "retreat"
  | "medkit";

const VALID_FIREARM_SHOT_NOISE_DELTA = 2;

const normalizeNoiseValue = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (!Number.isInteger(value)) return 0;
  if (value < 0) return 0;
  return value;
};

export const getNoiseLevelLabel = (noise: number): NoiseLevelLabel => {
  const normalizedNoise = normalizeNoiseValue(noise);

  if (normalizedNoise >= 9) return "шум критический";
  if (normalizedNoise >= 6) return "опасно";
  if (normalizedNoise >= 3) return "слышно";
  return "тихо";
};

export const getNoiseDeltaForAction = (action: NoisePreviewAction): number => {
  if (action === "valid_firearm_shot") return VALID_FIREARM_SHOT_NOISE_DELTA;
  return 0;
};

export const formatNoiseDelta = (delta: number): string => `Шум +${normalizeNoiseValue(delta)}`;
