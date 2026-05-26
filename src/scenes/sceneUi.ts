import Phaser from "phaser";

const BUTTON_WIDTH = 220;
const BUTTON_HEIGHT = 48;

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
): Phaser.GameObjects.Rectangle => {
  const bg = scene.add
    .rectangle(x, y, width, height, 0x2d2d2a, 0.94)
    .setStrokeStyle(2, 0x4a4a3a, 1);
  
  // Tactical inner border glow
  const inner = scene.add
    .rectangle(x, y, width - 6, height - 6, 0x000000, 0)
    .setStrokeStyle(1, 0xd4c5a0, 0.22);

  // Link inner border to bg so it gets cleaned up if bg is destroyed
  bg.on("destroy", () => {
    inner.destroy();
  });

  return bg;
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
  const bgColor = accent ? 0xc5a267 : 0x2d2d2a;
  const strokeColor = 0x4a4a3a;
  const textColor = accent ? "#1a1a1a" : "#d4c5a0";

  const background = scene.add
    .rectangle(0, 0, width, height, bgColor, 0.95)
    .setStrokeStyle(2, strokeColor, 1);
  const text = scene.add
    .text(0, 0, label, {
      color: textColor,
      fontFamily: "Oswald, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  const glow = scene.add
    .rectangle(0, 0, width, height, 0x000000, 0)
    .setStrokeStyle(3, 0xc5a267, 0);

  const button = scene.add.container(180, y, [background, glow, text]);
  button.setSize(width, height);
  button.setInteractive({ useHandCursor: true });
  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
    scene.tweens.add({
      targets: button,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 50,
      yoyo: true,
      onComplete: onClick,
    });
  });

  let glowTween: Phaser.Tweens.Tween | null = null;

  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
    background.setFillStyle(0xc5a267);
    text.setColor("#1a1a1a");
    glow.setStrokeStyle(3, 0xc5a267, 1);
    glowTween = scene.tweens.add({
      targets: glow,
      alpha: { from: 1, to: 0.2 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  });

  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
    background.setFillStyle(bgColor);
    text.setColor(textColor);
    if (glowTween) {
      glowTween.stop();
      glowTween = null;
    }
    glow.setStrokeStyle(3, 0xc5a267, 0);
    glow.setAlpha(1);
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
  const bgColor = accent ? 0xc5a267 : 0x2d2d2a;
  const strokeColor = 0x4a4a3a;
  const textColor = accent ? "#1a1a1a" : "#d4c5a0";

  const background = scene.add
    .rectangle(0, 0, width, height, bgColor, 0.95)
    .setStrokeStyle(2, strokeColor, 1);
  const text = scene.add
    .text(0, 0, label, {
      color: textColor,
      fontFamily: "Oswald, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  const glow = scene.add
    .rectangle(0, 0, width, height, 0x000000, 0)
    .setStrokeStyle(2.5, 0xc5a267, 0);

  const button = scene.add.container(x, y, [background, glow, text]);
  button.setSize(width, height);
  button.setInteractive({ useHandCursor: true });
  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
    scene.tweens.add({
      targets: button,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 50,
      yoyo: true,
      onComplete: onClick,
    });
  });

  let glowTween: Phaser.Tweens.Tween | null = null;

  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
    background.setFillStyle(0xc5a267);
    text.setColor("#1a1a1a");
    glow.setStrokeStyle(2.5, 0xc5a267, 1);
    glowTween = scene.tweens.add({
      targets: glow,
      alpha: { from: 1, to: 0.25 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  });

  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
    background.setFillStyle(bgColor);
    text.setColor(textColor);
    if (glowTween) {
      glowTween.stop();
      glowTween = null;
    }
    glow.setStrokeStyle(2.5, 0xc5a267, 0);
    glow.setAlpha(1);
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
