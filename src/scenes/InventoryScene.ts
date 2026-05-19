import Phaser from "phaser";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";

export class InventoryScene extends Phaser.Scene {
  public constructor() {
    super("InventoryScene");
  }

  public create(): void {
    createTitle(this, "Инвентарь");
    createSubtitle(this, 112, "Вес: 0 / 30 кг");
    createPanel(this, 180, 258, 280, 190);
    createSubtitle(this, 230, "Список предметов появится после подключения content JSON.");
    createButton(this, 448, "Назад", () => this.scene.start("BaseScene"));
  }
}
