import Phaser from "phaser";
import { CX, BTN, SAFE_W, W, H } from "../ui/layout";

const BUTTON_WIDTH = BTN.main.w;
const BUTTON_HEIGHT = BTN.main.h;

// ─── painted palette ──────────────────────────────────────────────
const C = {
  dark_deep: 0x14110d,
  dark_base: 0x1d1a14,
  dark_top: 0x2a261d,
  ink: 0x080604,
  amber_deep: 0x8a6e3a,
  amber_base: 0xc5a267,
  amber_top: 0xd9be8a,
  highlight: 0xe6d6a8,
};

// Draw painted background into Graphics. Origin = container center, so use (-w/2, -h/2).
const drawPaintedSurface = (
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
  accent: boolean,
  ornaments = true,
): void => {
  g.clear();
  const x = -w / 2;
  const y = -h / 2;

  // Layer 1: subtle vertical gradient via 3 stacked fills
  const base = accent ? C.amber_base : C.dark_base;
  const top = accent ? C.amber_top : C.dark_top;
  const bottom = accent ? C.amber_deep : C.dark_deep;
  g.fillStyle(bottom, 1).fillRect(x, y, w, h);
  g.fillStyle(base, 0.9).fillRect(x, y, w, h - 4);
  g.fillStyle(top, 0.55).fillRect(x, y, w, Math.max(6, h / 3));

  // Layer 2: thick ink outline
  g.lineStyle(3, C.ink, 1).strokeRect(x, y, w, h);

  // Layer 3: inner amber thin frame inset 4 px
  const innerColor = accent ? C.highlight : C.amber_base;
  const innerAlpha = accent ? 0.75 : 0.55;
  g.lineStyle(1, innerColor, innerAlpha).strokeRect(x + 4, y + 4, w - 8, h - 8);

  // Layer 4: top edge highlight + bottom shadow (1 px)
  g.lineStyle(1, C.highlight, accent ? 0.5 : 0.25)
    .lineBetween(x + 6, y + 5, x + w - 6, y + 5);
  g.lineStyle(1, C.ink, 0.5)
    .lineBetween(x + 6, y + h - 5, x + w - 6, y + h - 5);

  // Layer 5: corner ornaments — small L-strokes on 4 corners
  if (ornaments && w >= 90 && h >= 28) {
    const cl = Math.min(10, h / 3);
    g.lineStyle(1, innerColor, accent ? 0.9 : 0.7);
    for (const [cx, cy, dx, dy] of [
      [x + 6, y + 6, 1, 1],
      [x + w - 6, y + 6, -1, 1],
      [x + 6, y + h - 6, 1, -1],
      [x + w - 6, y + h - 6, -1, -1],
    ] as [number, number, number, number][]) {
      g.lineBetween(cx, cy, cx + cl * dx, cy);
      g.lineBetween(cx, cy, cx, cy + cl * dy);
    }
  }
};

export const createTitle = (scene: Phaser.Scene, title: string): Phaser.GameObjects.Text =>
  scene.add
    .text(CX, 36, title, {
      color: "#D4C5A0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "30px",
      fontStyle: "bold",
      stroke: "#0a0806",
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 2, color: "#000", blur: 6, fill: true },
    })
    .setOrigin(0.5);

export const createSubtitle = (
  scene: Phaser.Scene,
  y: number,
  text: string,
  x: number = CX,
): Phaser.GameObjects.Text =>
  scene.add
    .text(x, y, text, {
      align: "center",
      color: "#C8C0B0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "14px",
      wordWrap: { width: Math.min(640, SAFE_W) },
    })
    .setOrigin(0.5);

export const createPanel = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Rectangle => {
  // Painted background drawn via Graphics. The returned Rectangle is invisible
  // but holds the position/size for callers that read .x/.y/.width/.height.
  const g = scene.add.graphics({ x, y });
  drawPaintedSurface(g, width, height, false, true);

  const bg = scene.add.rectangle(x, y, width, height, 0x000000, 0);

  bg.on("destroy", () => g.destroy());
  return bg;
};

const buildPaintedButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  fontSize: string,
  onClick: () => void,
  accent: boolean,
): Phaser.GameObjects.Container => {
  const surface = scene.add.graphics();
  drawPaintedSurface(surface, width, height, accent, true);

  // Hover overlay (idle invisible). Brighter amber inner shimmer.
  const hover = scene.add.graphics();
  drawPaintedSurface(hover, width, height, true, true);
  hover.setAlpha(0);

  const text = scene.add
    .text(0, 0, label, {
      color: accent ? "#1a1208" : "#d4c5a0",
      fontFamily: "Oswald, sans-serif",
      fontSize,
      fontStyle: "bold",
      stroke: accent ? "#3a2a08" : "#0a0806",
      strokeThickness: 1,
    })
    .setOrigin(0.5);

  const button = scene.add.container(x, y, [surface, hover, text]);
  button.setSize(width, height);
  button.setInteractive({ useHandCursor: true });

  let hoverTween: Phaser.Tweens.Tween | null = null;

  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
    if (!accent) {
      text.setColor("#1a1208");
      text.setStroke("#3a2a08", 1);
    }
    hoverTween?.stop();
    hoverTween = scene.tweens.add({
      targets: hover,
      alpha: accent ? { from: 0, to: 0.35 } : { from: 0, to: 1 },
      duration: 180,
      ease: "Sine.Out",
    });
  });

  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
    if (!accent) {
      text.setColor("#d4c5a0");
      text.setStroke("#0a0806", 1);
    }
    hoverTween?.stop();
    hoverTween = scene.tweens.add({
      targets: hover,
      alpha: 0,
      duration: 180,
      ease: "Sine.Out",
    });
  });

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

  return button;
};

export const createButton = (
  scene: Phaser.Scene,
  y: number,
  label: string,
  onClick: () => void,
  accent = false,
  x: number = CX,
): Phaser.GameObjects.Container =>
  buildPaintedButton(scene, x, y, BUTTON_WIDTH, BUTTON_HEIGHT, label, "16px", onClick, accent);

export const createSmallButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  width: number,
  onClick: () => void,
  accent = false,
): Phaser.GameObjects.Container =>
  buildPaintedButton(scene, x, y, width, 36, label, "14px", onClick, accent);

// ─── atmospheric helpers ──────────────────────────────────────────
export const addVignette = (scene: Phaser.Scene): Phaser.GameObjects.Graphics => {
  const g = scene.add.graphics();
  g.setDepth(900);
  g.setScrollFactor(0);

  // Four edge gradients via stepped rectangles
  const steps = 24;
  const maxAlpha = 0.55;
  const edge = 140;
  for (let i = 0; i < steps; i++) {
    const a = (maxAlpha * (steps - i)) / steps;
    g.fillStyle(0x000000, a / steps);
    // top
    g.fillRect(0, (i * edge) / steps, W, edge / steps);
    // bottom
    g.fillRect(0, H - edge + (i * edge) / steps, W, edge / steps);
    // left
    g.fillRect((i * edge) / steps, 0, edge / steps, H);
    // right
    g.fillRect(W - edge + (i * edge) / steps, 0, edge / steps, H);
  }
  return g;
};

export const addDustParticles = (scene: Phaser.Scene): void => {
  // Tiny soft white dot texture, cached
  const key = "__dust_dot";
  if (!scene.textures.exists(key)) {
    const dot = scene.add.graphics();
    dot.fillStyle(0xffffff, 1);
    dot.fillCircle(2, 2, 2);
    dot.generateTexture(key, 4, 4);
    dot.destroy();
  }
  const emitter = scene.add.particles(0, 0, key, {
    x: { min: 0, max: W },
    y: { min: 0, max: H },
    lifespan: 9000,
    speedX: { min: -8, max: 8 },
    speedY: { min: -4, max: 4 },
    scale: { min: 0.3, max: 0.9 },
    alpha: { start: 0.35, end: 0 },
    quantity: 1,
    frequency: 400,
    blendMode: "ADD",
  });
  emitter.setDepth(850);
  // Custom alpha curve: fade in 25%, hold 50%, fade out 25%
};

// ─── HP bar (unchanged behavior, just promoted from inline) ───────
export const createHpBar = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  cur: number,
  max: number,
  w: number,
  h: number,
  barColor = 0xe25d3a,
  bgColor = 0x1a1612,
): [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Rectangle] => {
  const bg = scene.add
    .rectangle(x, y, w, h, bgColor, 1)
    .setStrokeStyle(2, C.ink, 1)
    .setOrigin(0, 0.5);
  const pct = Math.max(0, Math.min(1, cur / max));
  const bar = scene.add
    .rectangle(x + 2, y, (w - 4) * pct, h - 4, barColor, 1)
    .setOrigin(0, 0.5);
  // Tick marks every 25%
  const ticks = scene.add.graphics();
  ticks.lineStyle(1, 0x0a0806, 0.5);
  for (let i = 1; i < 4; i++) {
    const tx = x + (w * i) / 4;
    ticks.lineBetween(tx, y - h / 2 + 2, tx, y + h / 2 - 2);
  }
  bg.on('destroy', () => { ticks.destroy(); });
  return [bg, bar];
};

export const showFloatingText = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
  color = "#f5a623",
): void => {
  const txt = scene.add
    .text(x, y, message, {
      color,
      fontFamily: "Oswald, sans-serif",
      fontSize: "22px",
      fontStyle: "bold",
      stroke: "#0a0806",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
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
