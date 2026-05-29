import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { CX, CY, W, H } from "../ui/layout";
import { createButton, createTitle } from "./sceneUi";

export class LevelUpScene extends Phaser.Scene {
  private levelBefore = 0;
  private levelAfter = 0;

  constructor() {
    super("LevelUpScene");
  }

  public init(data: { levelBefore?: number; levelAfter?: number }): void {
    this.levelBefore = data.levelBefore ?? 0;
    this.levelAfter = data.levelAfter ?? 0;
  }

  public create(): void {
    this.add.rectangle(CX, CY, W, H, 0x0a0806, 0.85).setOrigin(0.5);
    createTitle(this, "ПОВЫШЕНИЕ УРОВНЯ");

    this.add
      .text(CX, 130, `Уровень ${this.levelBefore} → ${this.levelAfter}`, {
        color: "#d4c5a0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "20px",
      })
      .setOrigin(0.5);

    const player = GameState.player;
    const pts = player.skillPoints ?? 0;

    this.add
      .text(CX, 200, "+1 очко навыков", {
        color: "#c5a267",
        fontFamily: "Oswald, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(CX, 250, `Всего нераспределённых очков: ${pts}`, {
        color: "#a89968",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "16px",
      })
      .setOrigin(0.5);

    this.add
      .text(CX, 320, "Распределить очки в Дереве навыков\n(вкладка на лежанке в Оплоте)", {
        color: "#8b6f4b",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
        align: "center",
      })
      .setOrigin(0.5);

    createButton(this, H - 120, "Открыть Дерево", () => {
      this.scene.start("SkillTreeScene");
    }, true);

    createButton(this, H - 50, "Продолжить", () => {
      this.scene.stop();
    });
  }
}
