import Phaser from "phaser";

const BUTTON_WIDTH = 220;
const BUTTON_HEIGHT = 42;

export const createTitle = (scene: Phaser.Scene, title: string): Phaser.GameObjects.Text =>
  scene.add
    .text(180, 64, title, {
      color: "#F5F1E8",
      fontFamily: "Arial, sans-serif",
      fontSize: "32px",
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
      fontSize: "16px",
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
    .rectangle(x, y, width, height, 0x2a2a2a, 1)
    .setStrokeStyle(1, 0x5f5a50, 1);

export const createButton = (
  scene: Phaser.Scene,
  y: number,
  label: string,
  onClick: () => void,
): Phaser.GameObjects.Container => {
  const background = scene.add
    .rectangle(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, 0x3f493d, 1)
    .setStrokeStyle(1, 0xa5a58d, 1);
  const text = scene.add
    .text(0, 0, label, {
      color: "#F5F1E8",
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
    })
    .setOrigin(0.5);

  const button = scene.add.container(180, y, [background, text]);
  button.setSize(BUTTON_WIDTH, BUTTON_HEIGHT);
  button.setInteractive({ useHandCursor: true });
  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, onClick);

  return button;
};
