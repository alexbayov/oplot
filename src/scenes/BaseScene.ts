import Phaser from "phaser";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";

export class BaseScene extends Phaser.Scene {
  public constructor() {
    super("BaseScene");
  }

  public create(): void {
    createTitle(this, "ОПЛОТ");
    createSubtitle(this, 112, "База выжившего. Технический каркас M1.");
    createPanel(this, 180, 250, 280, 160);
    createSubtitle(this, 222, "Здесь будут состояние героя, ресурсы и прогресс базы.");
    createButton(this, 390, "В вылазку", () => this.scene.start("MapScene"));
    createButton(this, 446, "Крафт", () => this.scene.start("CraftScene"));
    createButton(this, 502, "Инвентарь", () => this.scene.start("InventoryScene"));
  }
}
