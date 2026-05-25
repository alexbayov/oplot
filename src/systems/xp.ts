import { MAX_LEVEL, xpToNext, xpRequired } from "../state/balance";

export interface XPGainResult {
  xp_before: number;
  xp_gained: number;
  level_before: number;
  level_after: number;
  levelled_up: boolean;
}

export const gainXP = (
  currentXp: number,
  currentLevel: number,
  xpAmount: number,
  xpGainMultiplier = 1.0,
): XPGainResult => {
  const effectiveGain = Math.round(xpAmount * xpGainMultiplier);
  const newXp = currentXp + effectiveGain;
  let newLevel = currentLevel;
  while (newLevel < MAX_LEVEL && newXp >= xpRequired(newLevel + 1)) {
    newLevel += 1;
  }
  return {
    xp_before: currentXp,
    xp_gained: effectiveGain,
    level_before: currentLevel,
    level_after: newLevel,
    levelled_up: newLevel > currentLevel,
  };
};

export const isMaxLevel = (level: number): boolean => level >= MAX_LEVEL;

export const xpProgress = (currentXp: number, currentLevel: number): number => {
  if (currentLevel >= MAX_LEVEL) return 1;
  const currentThreshold = xpRequired(currentLevel);
  const nextThreshold = xpRequired(currentLevel + 1);
  const range = nextThreshold - currentThreshold;
  if (range <= 0) return 1;
  return Math.min(1, (currentXp - currentThreshold) / range);
};

export const canLevelUp = (currentXp: number, currentLevel: number): boolean => {
  if (currentLevel >= MAX_LEVEL) return false;
  return currentXp >= xpRequired(currentLevel + 1);
};

// M5: compute how many level-up popups are needed for overkill XP.
export const computeOverkillPopups = (
  levelBefore: number,
  levelAfter: number,
): number => {
  if (levelAfter <= levelBefore) return 0;
  return levelAfter - levelBefore;
};

export { xpToNext, xpRequired, MAX_LEVEL };
