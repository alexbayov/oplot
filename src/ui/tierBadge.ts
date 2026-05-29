/**
 * M11.1 — Tier UI helpers.
 *
 * Римские цифры для тиров, бэйджи для иконок предметов и пинов карты.
 * Цвета берутся из COLORS.tier (T1 серый → T5 оранжевый).
 *
 * Используется в InventoryScene, CraftScene, MapScene.
 */
import type Phaser from "phaser";
import { COLORS } from "./tokens";

export type Tier = 1 | 2 | 3 | 4 | 5;

const ROMAN: Record<Tier, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
};

/** Римская цифра для тира. */
export const toRoman = (tier: number): string => {
  const safeTier = (Math.max(1, Math.min(5, Math.round(tier))) as Tier);
  return ROMAN[safeTier];
};

/** Цвет тира (hex int) из tokens. */
export const tierColor = (tier: number): number => {
  const safeTier = (Math.max(1, Math.min(5, Math.round(tier))) as Tier);
  return COLORS.tier[safeTier];
};

/**
 * Форматирует диапазон тиров для подписи зоны: [1,2] → "I-II", [3,3] → "III".
 * Используется в MapScene для zone_tier_range.
 */
export const formatTierRange = (range: [number, number] | undefined): string => {
  if (!range) return "";
  const [lo, hi] = range;
  if (lo === hi) return toRoman(lo);
  return `${toRoman(lo)}-${toRoman(hi)}`;
};

/**
 * Рендерит маленький бэйдж "I" / "II" / ... в углу slot'а инвентаря.
 *
 * x, y — центр бэйджа. Возвращает группу для возможной чистки.
 */
export const renderTierBadge = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  tier: number,
  opts: { size?: number; depth?: number } = {},
): Phaser.GameObjects.GameObject[] => {
  const size = opts.size ?? 14;
  const depth = opts.depth ?? 100;
  const color = tierColor(tier);

  const bg = scene.add
    .rectangle(x, y, size, size, color, 0.95)
    .setStrokeStyle(1, 0x1a1208, 1)
    .setDepth(depth);

  const text = scene.add
    .text(x, y, toRoman(tier), {
      color: "#1a1208",
      fontFamily: "Oswald, sans-serif",
      fontSize: `${Math.round(size * 0.72)}px`,
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setDepth(depth + 1);

  return [bg, text];
};

/**
 * Рендерит "плашку" тира для пина зоны: фон цвета тира + римская цифра/диапазон.
 *
 * Возвращает массив объектов (фон + текст) для управления depth/visibility.
 */
export const renderZoneTierPlate = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  range: [number, number] | undefined,
  opts: { depth?: number } = {},
): Phaser.GameObjects.GameObject[] => {
  if (!range) return [];
  const depth = opts.depth ?? 6;
  const label = formatTierRange(range);
  // Цвет берём по верхней границе диапазона (худший случай).
  const color = tierColor(range[1]);

  const w = label.length > 3 ? 38 : 28;
  const h = 16;

  const bg = scene.add
    .rectangle(x, y, w, h, color, 0.92)
    .setStrokeStyle(1, 0x1a1208, 1)
    .setDepth(depth);

  const text = scene.add
    .text(x, y, label, {
      color: "#1a1208",
      fontFamily: "Oswald, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setDepth(depth + 1);

  return [bg, text];
};
