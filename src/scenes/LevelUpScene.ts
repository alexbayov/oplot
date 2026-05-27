import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { VETERAN_CONDITIONING_HP_BONUS } from "../state/balance";
import { computePerkModifiers } from "../systems/perks";
import { runTween } from "../systems/tweens";
import { computeOverkillPopups, xpProgress } from "../systems/xp";
import type { Perk } from "../types";
import { createPanel, createTitle, createHpBar } from "./sceneUi";
import { saveToCloud } from "../systems/cloudSave";
import { CX, CY, W, H } from "../ui/layout";

const CARD_WIDTH = 360;
const CARD_HEIGHT = 280;
const CARD_GAP = 28;
const CARD_FILL = 0x2d2d2a;
const CARD_STROKE = 0x4a4a3a;
const CARD_HOVER = 0xc5a267;
const TEXT_COLOR = "#D4C5A0";
const SUB_COLOR = "#C8C0B0";

export class LevelUpScene extends Phaser.Scene {
  private candidatePerks: Perk[] = [];
  private popupQueue = 1;
  private levelBefore = 0;

  public constructor() {
    super("LevelUpScene");
  }

  public init(data: { perks?: Perk[]; levelBefore?: number; levelAfter?: number }): void {
    this.candidatePerks = data.perks ?? [];
    const before = data.levelBefore ?? 0;
    const after = data.levelAfter ?? 0;
    this.popupQueue = computeOverkillPopups(before, after) || 1;
    this.levelBefore = before;
  }

  public create(): void {
    // Полупрозрачный фон (это launch'нутая поверх сцена)
    this.add.rectangle(CX, CY, W, H, 0x000000, 0.7).setDepth(-1);

    const { player } = GameState;
    createTitle(this, `Новый уровень! Уровень ${player.level}`);

    const glow = this.add.rectangle(CX, 36, 400, 48, 0xffd700, 0).setAlpha(0).setDepth(-1);
    runTween(this, "tween_level_up_glow", glow);

    const barWidth = 600;
    const barX = CX - barWidth / 2;
    const barY = 100;
    const [, barFill] = createHpBar(this, barX, barY, 0, 100, barWidth, 14, 0xc5a267, 0x2d2d2a);
    const targetWidth = barWidth * xpProgress(player.xp, player.level);
    runTween(this, "tween_xp_bar_fill", barFill, targetWidth);

    if (this.candidatePerks.length === 0) {
      this.renderVeteranFallback();
      return;
    }

    // Карточки перков — в ряд по горизонтали (landscape)
    const total = this.candidatePerks.length;
    const totalW = total * CARD_WIDTH + (total - 1) * CARD_GAP;
    const startX = CX - totalW / 2 + CARD_WIDTH / 2;
    const cardY = CY + 20;

    this.candidatePerks.forEach((perk, idx) => {
      const x = startX + idx * (CARD_WIDTH + CARD_GAP);
      this.renderPerkCard(perk, x, cardY);
    });
  }

  private renderPerkCard(perk: Perk, x: number, y: number): void {
    const bg = this.add.rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, CARD_FILL).setStrokeStyle(2, CARD_STROKE);
    runTween(this, "tween_perk_card_deal", bg);

    // Draw perk icon (центр сверху)
    const texKey = `perk_${perk.id}`;
    if (this.textures.exists(texKey)) {
      this.add.image(x, y - 80, texKey).setScale(1.2);
    }

    this.add.text(x, y - 10, perk.name, {
      color: TEXT_COLOR,
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(x, y + 30, perk.description, {
      color: SUB_COLOR,
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "13px",
      wordWrap: { width: CARD_WIDTH - 40 },
      align: "center",
    }).setOrigin(0.5);

    this.add.text(x, y + 100, `[${perk.type === "additive" ? "+" : "×"} ${perk.stat}]`, {
      color: "#8A8070",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      bg.setStrokeStyle(3, CARD_HOVER);
    });
    hitArea.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      bg.setStrokeStyle(2, CARD_STROKE);
    });
    hitArea.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      this.selectPerk(perk);
    });
  }

  private selectPerk(perk: Perk): void {
    const { player } = GameState;
    player.perks = [...player.perks, perk];
    const mods = computePerkModifiers(player.perks);
    player.hp_max = 100 + mods.hp_max_additive;
    player.hp = Math.min(player.hp, player.hp_max);
    void saveToCloud();
    this.popupQueue -= 1;
    if (this.popupQueue > 0) {
      this.candidatePerks = [];
      this.scene.restart({ perks: [], levelBefore: this.levelBefore, levelAfter: this.levelBefore });
      return;
    }
    this.scene.stop("LevelUpScene");
  }

  private renderVeteranFallback(): void {
    const { player } = GameState;
    createPanel(this, CX, CY, 600, 180);
    this.add.text(CX, CY - 40, "Все перки уже взяты!", {
      color: TEXT_COLOR,
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.add.text(CX, CY, `Ветеранская закалка: +${VETERAN_CONDITIONING_HP_BONUS} HP макс`, {
      color: SUB_COLOR,
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "15px",
    }).setOrigin(0.5);

    this.add.rectangle(CX, CY + 60, 240, 46, 0x3f493d).setStrokeStyle(1, 0xa5a58d);
    const btn = this.add.rectangle(CX, CY + 60, 240, 46, 0x000000, 0);
    btn.setInteractive({ useHandCursor: true });
    btn.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      player.hp_max += VETERAN_CONDITIONING_HP_BONUS;
      player.hp = Math.min(player.hp, player.hp_max);
      this.scene.stop("LevelUpScene");
    });
    this.add.text(CX, CY + 60, "Принять", {
      color: TEXT_COLOR,
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "18px",
    }).setOrigin(0.5);
  }
}
