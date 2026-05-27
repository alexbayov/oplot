import Phaser from "phaser";
import { playSfx } from "../systems/audio";
import { COLORS, FONTS } from "../ui/tokens";

const BUTTON_WIDTH = 220;
const BUTTON_HEIGHT = 48;
const NOISE_DOTS = [
  [-0.42, -0.28],
  [-0.22, 0.24],
  [0.08, -0.18],
  [0.32, 0.18],
  [0.44, -0.08],
] as const;

export const createTitle = (scene: Phaser.Scene, title: string): Phaser.GameObjects.Text =>
  scene.add
    .text(180, 64, title, {
      color: "#D4C5A0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "30px",
      fontStyle: "bold",
      stroke: "#1a1a1a",
      strokeThickness: 2,
    })
    .setOrigin(0.5);

export const createSubtitle = (
  scene: Phaser.Scene,
  y: number,
  text: string,
): Phaser.GameObjects.Text =>
  scene.add
    .text(180, y, text, {
      align: "center",
      color: "#C8C0B0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "14px",
      wordWrap: { width: 300 },
    })
    .setOrigin(0.5);

export const createPanel = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Container => {
  const shadow = scene.add
    .rectangle(4, 6, width, height, 0x000000, 0.38)
    .setOrigin(0.5);
  const bg = scene.add
    .rectangle(0, 0, width, height, COLORS.panelBg, 0.96)
    .setStrokeStyle(2, COLORS.panelBorder, 1);
  const topWash = scene.add
    .rectangle(0, -height / 2 + 8, width - 8, 12, COLORS.bgPanelLight, 0.32)
    .setOrigin(0.5);
  const inner = scene.add
    .rectangle(0, 0, width - 8, height - 8, 0x000000, 0)
    .setStrokeStyle(1, COLORS.panelInnerBorder, 0.18);
  const leftBracket = scene.add.rectangle(-width / 2 + 6, 0, 3, height - 18, COLORS.accent, 0.34);
  const topBolt = scene.add.circle(-width / 2 + 13, -height / 2 + 13, 2.5, COLORS.border, 0.9);
  const bottomBolt = scene.add.circle(width / 2 - 13, height / 2 - 13, 2.5, COLORS.border, 0.9);

  const panel = scene.add.container(x, y, [
    shadow,
    bg,
    topWash,
    inner,
    leftBracket,
    topBolt,
    bottomBolt,
  ]);
  panel.setSize(width, height);

  bg.on("destroy", () => {
    panel.destroy();
  });

  return panel;
};

const createButtonPlate = (
  scene: Phaser.Scene,
  width: number,
  height: number,
  accent: boolean,
  onPress: () => void,
): {
  container: Phaser.GameObjects.Container;
  plate: Phaser.GameObjects.Rectangle;
  bevel: Phaser.GameObjects.Rectangle;
  glow: Phaser.GameObjects.Rectangle;
  labelColor: string;
  normalFill: number;
} => {
  const normalFill = accent ? COLORS.accent : COLORS.buttonBg;
  const labelColor = accent ? COLORS.accentText : COLORS.textMain;
  const shadow = scene.add.rectangle(4, 5, width, height, 0x000000, 0.45);
  const underplate = scene.add
    .rectangle(-3, 3, width + 6, height - 4, accent ? 0x7a6337 : 0x191a17, 0.9)
    .setStrokeStyle(1, 0x000000, 0.5);
  const plate = scene.add.rectangle(0, 0, width, height, normalFill, accent ? 1 : 0.97).setStrokeStyle(
    2,
    accent ? 0xf0d18a : COLORS.border,
    1,
  );
  const bevel = scene.add
    .rectangle(0, -height / 2 + 7, width - 12, 8, accent ? 0xf3d891 : COLORS.bgPanelLight, accent ? 0.26 : 0.2);
  const bottomShade = scene.add
    .rectangle(0, height / 2 - 6, width - 12, 7, 0x000000, accent ? 0.16 : 0.28);
  const leftCut = scene.add.triangle(
    -width / 2 + 6,
    -height / 2 + 6,
    0,
    0,
    10,
    0,
    0,
    10,
    accent ? 0x7a6337 : 0x151612,
    0.9,
  );
  const rightCut = scene.add.triangle(
    width / 2 - 6,
    height / 2 - 6,
    0,
    0,
    -10,
    0,
    0,
    -10,
    accent ? 0x7a6337 : 0x151612,
    0.9,
  );
  const glow = scene.add
    .rectangle(0, 0, width + 8, height + 8, 0x000000, 0)
    .setStrokeStyle(3, COLORS.accent, 0);

  const pockmarks = NOISE_DOTS.map(([nx, ny]) =>
    scene.add.circle(
      nx * width,
      ny * height,
      1.2,
      accent ? 0x6f5529 : 0x8a8070,
      accent ? 0.22 : 0.16,
    ),
  );

  const container = scene.add.container(0, 0, [
    shadow,
    underplate,
    plate,
    bevel,
    bottomShade,
    leftCut,
    rightCut,
    ...pockmarks,
    glow,
  ]);
  plate.setInteractive({ useHandCursor: true });
  plate.on(Phaser.Input.Events.POINTER_UP, onPress);
  return { container, plate, bevel, glow, labelColor, normalFill };
};

export const createButton = (
  scene: Phaser.Scene,
  y: number,
  label: string,
  onClick: () => void,
  accent = false,
): Phaser.GameObjects.Container => {
  const width = BUTTON_WIDTH;
  const height = BUTTON_HEIGHT;
  const press = (): void => {
    playSfx(scene, "ui_click");
    scene.tweens.add({
      targets: button,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 50,
      yoyo: true,
      onComplete: onClick,
    });
  };
  const plate = createButtonPlate(scene, width, height, accent, press);
  const text = scene.add
    .text(0, 0, label, {
      color: plate.labelColor,
      fontFamily: FONTS.title,
      fontSize: "16px",
      fontStyle: "bold",
      stroke: accent ? "#d9bc78" : "#111210",
      strokeThickness: accent ? 0 : 2,
    })
    .setOrigin(0.5);
  const edgeMark = scene.add.rectangle(-width / 2 + 14, 0, 3, height - 14, accent ? 0x1a1a1a : COLORS.accent, accent ? 0.34 : 0.55);

  const hitArea = scene.add.rectangle(0, 0, width, height, 0x000000, 0);
  const button = scene.add.container(180, y, [plate.container, edgeMark, text, hitArea]);
  button.setSize(width, height);
  button.setInteractive(
    new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
    Phaser.Geom.Rectangle.Contains,
  );
  if (button.input) button.input.cursor = "pointer";
  hitArea.setInteractive(
    new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
    Phaser.Geom.Rectangle.Contains,
  );
  if (hitArea.input) hitArea.input.cursor = "pointer";
  button.on(Phaser.Input.Events.POINTER_UP, press);
  hitArea.on(Phaser.Input.Events.POINTER_UP, press);

  let glowTween: Phaser.Tweens.Tween | null = null;

  hitArea.on(Phaser.Input.Events.POINTER_OVER, () => {
    plate.plate.setFillStyle(COLORS.buttonHover, 1);
    plate.bevel.setFillStyle(0xf3d891, 0.28);
    text.setColor("#1a1a1a");
    plate.glow.setStrokeStyle(3, COLORS.accent, 1);
    glowTween = scene.tweens.add({
      targets: plate.glow,
      alpha: { from: 1, to: 0.2 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  });

  hitArea.on(Phaser.Input.Events.POINTER_OUT, () => {
    plate.plate.setFillStyle(plate.normalFill, accent ? 1 : 0.97);
    plate.bevel.setFillStyle(accent ? 0xf3d891 : COLORS.bgPanelLight, accent ? 0.26 : 0.2);
    text.setColor(plate.labelColor);
    if (glowTween) {
      glowTween.stop();
      glowTween = null;
    }
    plate.glow.setStrokeStyle(3, COLORS.accent, 0);
    plate.glow.setAlpha(1);
  });

  return button;
};

export const createSmallButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  width: number,
  onClick: () => void,
  accent = false,
): Phaser.GameObjects.Container => {
  const height = 36;
  const press = (): void => {
    playSfx(scene, "ui_click");
    scene.tweens.add({
      targets: button,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 50,
      yoyo: true,
      onComplete: onClick,
    });
  };
  const plate = createButtonPlate(scene, width, height, accent, press);
  const text = scene.add
    .text(0, 0, label, {
      color: plate.labelColor,
      fontFamily: FONTS.title,
      fontSize: "14px",
      fontStyle: "bold",
      stroke: accent ? "#d9bc78" : "#111210",
      strokeThickness: accent ? 0 : 2,
    })
    .setOrigin(0.5);
  const edgeMark = scene.add.rectangle(-width / 2 + 10, 0, 2.5, height - 12, accent ? 0x1a1a1a : COLORS.accent, accent ? 0.3 : 0.46);

  const hitArea = scene.add.rectangle(0, 0, width, height, 0x000000, 0);
  const button = scene.add.container(x, y, [plate.container, edgeMark, text, hitArea]);
  button.setSize(width, height);
  button.setInteractive(
    new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
    Phaser.Geom.Rectangle.Contains,
  );
  if (button.input) button.input.cursor = "pointer";
  hitArea.setInteractive(
    new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
    Phaser.Geom.Rectangle.Contains,
  );
  if (hitArea.input) hitArea.input.cursor = "pointer";
  button.on(Phaser.Input.Events.POINTER_UP, press);
  hitArea.on(Phaser.Input.Events.POINTER_UP, press);

  let glowTween: Phaser.Tweens.Tween | null = null;

  hitArea.on(Phaser.Input.Events.POINTER_OVER, () => {
    plate.plate.setFillStyle(COLORS.buttonHover, 1);
    plate.bevel.setFillStyle(0xf3d891, 0.28);
    text.setColor("#1a1a1a");
    plate.glow.setStrokeStyle(2.5, COLORS.accent, 1);
    glowTween = scene.tweens.add({
      targets: plate.glow,
      alpha: { from: 1, to: 0.25 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  });

  hitArea.on(Phaser.Input.Events.POINTER_OUT, () => {
    plate.plate.setFillStyle(plate.normalFill, accent ? 1 : 0.97);
    plate.bevel.setFillStyle(accent ? 0xf3d891 : COLORS.bgPanelLight, accent ? 0.26 : 0.2);
    text.setColor(plate.labelColor);
    if (glowTween) {
      glowTween.stop();
      glowTween = null;
    }
    plate.glow.setStrokeStyle(2.5, COLORS.accent, 0);
    plate.glow.setAlpha(1);
  });

  return button;
};

export const createHpBar = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  cur: number,
  max: number,
  w: number,
  h: number,
  barColor = 0x8b0000,
  bgColor = 0x3a0000,
): [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Rectangle] => {
  const bg = scene.add
    .rectangle(x, y, w, h, bgColor, 1)
    .setStrokeStyle(1.5, 0x4a4a3a, 1)
    .setOrigin(0, 0.5);
  
  const pct = Math.max(0, Math.min(1, cur / max));
  const bar = scene.add
    .rectangle(x, y, w * pct, h, barColor, 1)
    .setOrigin(0, 0.5);

  // HUD divisions / ticks every 10%
  const ticks = scene.add.graphics();
  ticks.lineStyle(1.5, 0x111111, 0.45);
  const divisions = 10;
  const tickGap = w / divisions;
  for (let i = 1; i < divisions; i++) {
    const tx = x + i * tickGap;
    ticks.lineBetween(tx, y - h / 2, tx, y + h / 2);
  }

  // Bind ticks cleanup to bg destruction
  bg.on("destroy", () => {
    ticks.destroy();
  });

  return [bg, bar];
};

export const showFloatingText = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color = "#D32F2F",
): void => {
  const txt = scene.add.text(x, y, text, {
    color: color,
    fontFamily: "Share Tech Mono, monospace",
    fontSize: "18px",
    fontStyle: "bold",
    stroke: "#1a1a1a",
    strokeThickness: 3,
  }).setOrigin(0.5).setDepth(200);

  scene.tweens.add({
    targets: txt,
    y: y - 45,
    alpha: { from: 1, to: 0 },
    scale: { from: 1.3, to: 0.8 },
    duration: 650,
    ease: "Cubic.Out",
    onComplete: () => {
      txt.destroy();
    },
  });
};
