import type { GameProgress } from "../state/types";
import type { Zone } from "../types";

const DAILY_RESET_HOURS = 24;
const MS_PER_HOUR = 3600 * 1000;

export const canEnterDailyInstance = (
  progress: GameProgress,
  zone: Zone,
  now: number,
): boolean => {
  if (!zone.boss_id) return false;
  const lastCompleted = progress.daily_completed[zone.id];
  if (lastCompleted === undefined) return true;
  const resetHours = zone.daily_reset_hours ?? DAILY_RESET_HOURS;
  const cooldownMs = resetHours * MS_PER_HOUR;
  return now - lastCompleted >= cooldownMs;
};

export const markDailyCompleted = (
  progress: GameProgress,
  zoneId: string,
  now: number,
): void => {
  progress.daily_completed[zoneId] = now;
};
