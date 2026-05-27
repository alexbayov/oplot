/**
 * SceneHeader — единый заголовок сцены с кнопкой «Назад»
 */
import type Phaser from "phaser";
import { COLORS, FONTS } from "../tokens";
import { CX, HEADER_Y } from "../layout";

interface SceneHeaderOptions {
  title: string;
  subtitle?: string;
  backTo?: string;
  /** Дополнительная кнопка справа */
  rightButton?: {
    label: string;
    onClick: () => void;
  };
}

export const createSceneHeader = (
  scene: Phaser.Scene,
  opts: SceneHeaderOptions,
): void => {
  // Фоновая полоса
  scene.add
    .rectangle(CX, HEADER_Y / 2, scene.scale.width, HEADER_Y, COLORS.bg, 1)
    .setDepth(15);

  // Заголовок
  scene.add
    .text(CX, HEADER_Y + 2, opts.title, {
      color: COLORS.textMain,
      fontFamily: FONTS.title,
      fontSize: "26px",
      fontStyle: "bold",
      stroke: "#1a1a1a",
      strokeThickness: 2,
    })
    .setOrigin(0.5)
    .setDepth(16);

  // Подзаголовок
  if (opts.subtitle) {
    scene.add
      .text(CX, HEADER_Y + 28, opts.subtitle, {
        color: COLORS.textMuted,
        fontFamily: FONTS.body,
        fontSize: "12px",
      })
      .setOrigin(0.5)
      .setDepth(16);
  }

  // Кнопка «Назад»
  if (opts.backTo) {
    const backBg = scene.add
      .rectangle(36, HEADER_Y, 50, 30, COLORS.panelBg, 0.9)
      .setStrokeStyle(1.5, COLORS.border, 1)
      .setDepth(16)
      .setInteractive({ useHandCursor: true });

    scene.add
      .text(36, HEADER_Y, "←", {
        color: COLORS.textMain,
        fontFamily: FONTS.title,
        fontSize: "18px",
      })
      .setOrigin(0.5)
      .setDepth(17);

    backBg.on("pointerup", () => {
      const target = opts.backTo;
      scene.scene.start(target);
    });
    backBg.on("pointerover", () => backBg.setFillStyle(COLORS.accent, 0.9));
    backBg.on("pointerout", () => backBg.setFillStyle(COLORS.panelBg, 0.9));
  }

  // Доп. кнопка справа
  if (opts.rightButton) {
    const rx = scene.scale.width - 50;
    const rBtn = scene.add
      .rectangle(rx, HEADER_Y, 70, 30, COLORS.panelBg, 0.9)
      .setStrokeStyle(1.5, COLORS.border, 1)
      .setDepth(16)
      .setInteractive({ useHandCursor: true });

    scene.add
      .text(rx, HEADER_Y, opts.rightButton.label, {
        color: COLORS.textMain,
        fontFamily: FONTS.body,
        fontSize: "13px",
      })
      .setOrigin(0.5)
      .setDepth(17);

    rBtn.on("pointerup", opts.rightButton.onClick);
  }
};
