/**
 * ui/layout — константы экрана, safe-area, зоны действий
 * Mobile-first 360×640, scaling через Phaser.Scale.FIT
 */

import { GAME_WIDTH, GAME_HEIGHT } from "../config";

export const W = GAME_WIDTH;
export const H = GAME_HEIGHT;

/** Центр экрана по X */
export const CX = W / 2;
/** Центр экрана по Y */
export const CY = H / 2;

// ── Safe-area отступы (mobile notch / Яндекс sticky banner) ──

export const SAFE = {
  top: 8,
  bottom: 64, // запас под sticky banner
  left: 8,
  right: 8,
} as const;

/** Рабочая зона с учётом safe-area */
export const SAFE_X = SAFE.left;
export const SAFE_Y = SAFE.top;
export const SAFE_W = W - SAFE.left - SAFE.right;
export const SAFE_H = H - SAFE.top - SAFE.bottom;

// ── Зоны экрана ───────────────────────────────────────────────

/** Верхняя полоса — заголовок сцены */
export const HEADER_Y = 52;
/** Нижняя зона действий (кнопки) */
export const ACTION_ZONE_Y = H - SAFE.bottom - 24;
/** Центральная зона контента */
export const CONTENT_Y_START = 80;
export const CONTENT_Y_END = ACTION_ZONE_Y - 16;

// ── Сетка для иконок ──────────────────────────────────────────

export const GRID = {
  cols: 5,
  gap: 6,
  slot: 56,
  /** X первого слота */
  startX: 40,
  /** Y первого ряда */
  startY: 120,
} as const;

/** Вычислить позицию слота в сетке */
export const gridSlot = (index: number) => ({
  x: GRID.startX + (index % GRID.cols) * (GRID.slot + GRID.gap),
  y: GRID.startY + Math.floor(index / GRID.cols) * (GRID.slot + GRID.gap),
});

// ── Размеры кнопок ────────────────────────────────────────────

export const BTN = {
  main: { w: 220, h: 48 },
  small: { w: 90, h: 36 },
  wide: { w: 300, h: 48 },
} as const;
