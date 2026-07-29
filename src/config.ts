export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const BACKGROUND_COLOR = "#111210";
export const MAX_WEIGHT_KG = 30;

/**
 * R-series redesign flag.
 * true  → boot into Babylon.js isometric prototype (R0+)
 * false → legacy Phaser shelter loop
 * Override at runtime: ?mode=3d | ?mode=2d
 */
export const USE_3D_DEFAULT = true;

export function resolveUse3D(): boolean {
  if (typeof window === "undefined") return USE_3D_DEFAULT;
  const q = new URLSearchParams(window.location.search).get("mode");
  if (q === "3d") return true;
  if (q === "2d") return false;
  return USE_3D_DEFAULT;
}

/**
 * Save version.
 * v9 = last pre-redesign (M16 craft depth).
 * v10 = R-series stub (3D combat fields arrive R2+; migration v9→v10 is stamp-only).
 */
export const SAVE_VERSION = 10 as const;
