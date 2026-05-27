/**
 * Badge — индикатор (новые сигналы, daily ready, уровень)
 * Маленький цветной кружок/прямоугольник с числом.
 */
import type Phaser from "phaser";
import { COLORS } from "../tokens";
import { runTween } from "../../systems/tweens";

export type BadgeVariant = "danger" | "warning" | "accent" | "info";

const VARIANT_COLORS: Record<BadgeVariant, { fill: number; text: string }> = {
  danger: { fill: COLORS.danger, text: "#f0e0d0" },
  warning: { fill: COLORS.warning, text: "#1a1a1a" },
  accent: { fill: COLORS.accent, text: "#1a1a1a" },
  info: { fill: COLORS.stamina, text: "#e0e8f0" },
};

export const createBadge = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  variant: BadgeVariant = "accent",
  pulse = false,
): Phaser.GameObjects.Container => {
  const { fill, text: textColor } = VARIANT_COLORS[variant];
  const w = Math.max(24, text.length * 10 + 8);

  const bg = scene.add
    .rectangle(0, 0, w, 22, fill, 0.95)
    .setStrokeStyle(1.5, 0x000000, 0.6);

  const label = scene.add
    .text(0, 0, text, {
      color: textColor,
      fontFamily: "Share Tech Mono, monospace",
      fontSize: "12px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  const badge = scene.add.container(x, y, [bg, label]);
  badge.setDepth(20);

  if (pulse) {
    runTween(scene, "tween_menu_hover", badge);
  }

  return badge;
};
