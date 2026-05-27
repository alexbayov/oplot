/**
 * ui/layout — константы экрана, safe-area, зоны действий
 * Stage 2: landscape 1280×720, scaling через Phaser.Scale.FIT
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
  bottom: 24, // landscape: sticky banner меньше мешает
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

// ── Сетка для иконок (landscape: 8 колонок вместо 5) ──────────

export const GRID = {
  cols: 8,
  gap: 6,
  slot: 56,
  /** X первого слота */
  startX: 60,
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
  main: { w: 260, h: 48 },
  small: { w: 90, h: 36 },
  wide: { w: 360, h: 48 },
} as const;

// ── Per-scene layout tokens (Stage 2) ─────────────────────────

export const LAYOUT = {
  marginX: 24,
  marginY: 16,
  gutter: 12,

  combat: {
    heroX: 280,
    heroY: 460,
    mobX: 1000,
    mobY: 460,
    spriteScale: 2.5,
    turnBarY: 40,
    actionBarY: 640,
    actionBarH: 64,
  },
  base: {
    portraitCardX: 180,
    portraitCardY: 280,
    portraitCardW: 280,
    portraitCardH: 360,
    ctaX: W / 2,
    ctaY: 400,
    ctaW: 320,
    ctaH: 80,
    menuColX: W - 180,
    menuColY: 200,
    menuBtnW: 240,
    menuBtnH: 64,
  },
  inventory: {
    gridX: 40,
    gridY: 120,
    cellSize: 72,
    cellsPerRow: 8,
    detailsPanelX: 920,
    detailsPanelY: 120,
    detailsPanelW: 340,
    detailsPanelH: 520,
  },
  topBar: {
    h: 56,
    titleX: W / 2,
    rightSlotX: W - 24,
    leftSlotX: 24,
  },
} as const;
