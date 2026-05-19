import Phaser from "phaser";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";

export class CraftScene extends Phaser.Scene {
  public constructor() {
    super("CraftScene");
  }

  public create(): void {
    createTitle(this, "Мастерская");
    createSubtitle(this, 112, "5 MVP-рецептов будут подключены из content JSON.");
    createPanel(this, 180, 258, 280, 190);
    createSubtitle(this, 230, "Пистолет\nЖилет\nБинт\nАптечка\nПатроны");
    createButton(this, 448, "Назад", () => this.scene.start("BaseScene"));
  }
}
