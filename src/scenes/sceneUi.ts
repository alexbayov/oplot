import Phaser from "phaser";

const BUTTON_WIDTH = 220;
const BUTTON_HEIGHT = 48;

export const createTitle = (scene: Phaser.Scene, title: string): Phaser.GameObjects.Text =>
  scene.add
    .text(180, 64, title, {
      color: "#D4C5A0",
      fontFamily: "Impact, sans-serif",
      fontSize: "28px",
      fontStyle: "bold",
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
      fontFamily: "Arial, sans-serif",
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
): Phaser.GameObjects.Rectangle =>
  scene.add
    .rectangle(x, y, width, height, 0x2d2d2a, 0.92)
    .setStrokeStyle(2, 0x4a4a3a, 1);

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
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  const button = scene.add.container(180, y, [background, text]);
  button.setSize(width, height);
  button.setInteractive({ useHandCursor: true });
  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
    scene.tweens.add({
      targets: button,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 50,
      yoyo: true,
      onComplete: onClick,
    });
  });

  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
    background.setFillStyle(0xc5a267);
    text.setColor("#1a1a1a");
  });

  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
    background.setFillStyle(bgColor);
    text.setColor(textColor);
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
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  const button = scene.add.container(x, y, [background, text]);
  button.setSize(width, height);
  button.setInteractive({ useHandCursor: true });
  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
    scene.tweens.add({
      targets: button,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 50,
      yoyo: true,
      onComplete: onClick,
    });
  });

  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
    background.setFillStyle(0xc5a267);
    text.setColor("#1a1a1a");
  });

  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
    background.setFillStyle(bgColor);
    text.setColor(textColor);
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
    .setStrokeStyle(1, 0x4a4a3a, 1)
    .setOrigin(0, 0.5);
  
  const pct = Math.max(0, Math.min(1, cur / max));
  const bar = scene.add
    .rectangle(x, y, w * pct, h, barColor, 1)
    .setOrigin(0, 0.5);

  return [bg, bar];
};
