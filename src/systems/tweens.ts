import Phaser from "phaser";

export interface Tweenable {
  x: number;
  y: number;
  alpha: number;
  scaleX?: number;
  scaleY?: number;
  width?: number;
  angle?: number;
  scrollX?: number;
  scrollY?: number;
}

export type TweenTarget = Tweenable;

export type TweenFactory = (
  scene: Phaser.Scene,
  target: TweenTarget,
  ...args: unknown[]
) => Phaser.Types.Tweens.TweenBuilderConfig;

export const TWEEN_REGISTRY: Record<string, TweenFactory> = {
  tween_damage_flash: (_scene, target) => ({
    targets: target,
    alpha: { from: 0, to: 0.3 },
    duration: 200,
    ease: Phaser.Math.Easing.Linear,
    yoyo: true,
  }),
  tween_hit_shake: (_scene, target) => {
    const cam = target as unknown as Phaser.Cameras.Scene2D.Camera;
    return {
      targets: target,
      scrollX: { from: cam.scrollX - 2, to: cam.scrollX + 2 },
      scrollY: { from: cam.scrollY - 2, to: cam.scrollY + 2 },
      duration: 150,
      ease: Phaser.Math.Easing.Elastic.Out,
      yoyo: true,
    };
  },
  tween_heal_pulse: (_scene, target) => ({
    targets: target,
    scaleX: { from: 1, to: 1.2 },
    scaleY: { from: 1, to: 1.2 },
    duration: 400,
    ease: Phaser.Math.Easing.Sine.Out,
    yoyo: true,
  }),
  tween_loot_bounce: (_scene, target) => ({
    targets: target,
    y: { from: target.y, to: target.y - 10 },
    duration: 300,
    ease: Phaser.Math.Easing.Back.Out,
    yoyo: true,
  }),
  tween_craft_spin: (_scene, target) => ({
    targets: target,
    angle: { from: 0, to: 360 },
    duration: 500,
    ease: Phaser.Math.Easing.Cubic.InOut,
  }),
  tween_menu_hover: (_scene, target) => ({
    targets: target,
    scaleX: { from: 1, to: 1.05 },
    scaleY: { from: 1, to: 1.05 },
    duration: 150,
    ease: Phaser.Math.Easing.Sine.Out,
    yoyo: true,
  }),
  tween_level_up_glow: (_scene, target) => ({
    targets: target,
    alpha: { from: 0, to: 1 },
    duration: 600,
    ease: Phaser.Math.Easing.Sine.InOut,
    yoyo: true,
  }),
  tween_boss_phase_red: (_scene, target) => ({
    targets: target,
    alpha: { from: 0, to: 0.5 },
    duration: 400,
    ease: Phaser.Math.Easing.Quintic.Out,
    yoyo: true,
  }),
  tween_return_walk: (_scene, target) => ({
    targets: target,
    x: { from: target.x, to: target.x + 20 },
    duration: 1000,
    ease: Phaser.Math.Easing.Linear,
  }),
  tween_xp_bar_fill: (_scene, target, ...args) => {
    const targetWidth = typeof args[0] === "number" ? args[0] : 0;
    return {
      targets: target,
      width: { from: 0, to: targetWidth },
      duration: 300,
      ease: Phaser.Math.Easing.Cubic.Out,
    };
  },
  tween_radio_static: (_scene, target) => ({
    targets: target,
    alpha: { from: 0.2, to: 0.8 },
    duration: 250,
    ease: Phaser.Math.Easing.Linear,
    yoyo: true,
  }),
  tween_gas_warning: (_scene, target) => ({
    targets: target,
    alpha: { from: 0, to: 0.5 },
    duration: 200,
    ease: Phaser.Math.Easing.Linear,
    yoyo: true,
  }),
  tween_sortie_enter: (_scene, target) => ({
    targets: target,
    alpha: { from: 1, to: 0 },
    duration: 400,
    ease: Phaser.Math.Easing.Sine.Out,
  }),
  tween_defeat_fade: (_scene, target) => ({
    targets: target,
    alpha: { from: 0, to: 1 },
    duration: 500,
    ease: Phaser.Math.Easing.Quadratic.Out,
  }),
  tween_perk_card_deal: (_scene, target) => ({
    targets: target,
    y: { from: target.y + 50, to: target.y },
    duration: 300,
    ease: Phaser.Math.Easing.Back.Out,
  }),
  tween_item_tooltip: (_scene, target) => ({
    targets: target,
    alpha: { from: 0, to: 1 },
    duration: 150,
    ease: Phaser.Math.Easing.Linear,
  }),
};

export const runTween = (
  scene: Phaser.Scene,
  eventId: string,
  target: TweenTarget,
  ...args: unknown[]
): Phaser.Tweens.Tween | null => {
  const factory = TWEEN_REGISTRY[eventId];
  if (!factory) {
    if (import.meta.env.DEV) {
      console.warn(`[tweens] Unknown tween eventId: ${eventId}`);
    }
    return null;
  }
  const config = factory(scene, target, ...args);
  return scene.tweens.add({ ...config, targets: target });
};
