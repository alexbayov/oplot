import Phaser from "phaser";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";

export class SortieScene extends Phaser.Scene {
  public constructor() {
    super("SortieScene");
  }

  public create(): void {
    createTitle(this, "Вылазка");
    createSubtitle(this, 112, "Лес: выбор глубины будет подключён в M2.");
    createPanel(this, 180, 254, 280, 184);
    createSubtitle(this, 224, "Глубина 1\n2 боя, базовый риск, стартовые ресурсы.");
    createButton(this, 398, "Бой", () => this.scene.start("CombatScene"));
    createButton(this, 454, "Карта", () => this.scene.start("MapScene"));
  }
}
