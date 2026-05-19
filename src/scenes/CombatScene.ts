import Phaser from "phaser";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";

export class CombatScene extends Phaser.Scene {
  public constructor() {
    super("CombatScene");
  }

  public create(): void {
    createTitle(this, "Бой");
    createSubtitle(this, 112, "Пошаговая система будет реализована после M1.");
    createPanel(this, 180, 244, 280, 160);
    createSubtitle(this, 210, "Герой HP: 100\nПротивник: заглушка");
    createButton(this, 364, "Атака", () => undefined);
    createButton(this, 420, "Укрытие", () => undefined);
    createButton(this, 476, "Аптечка", () => undefined);
    createButton(this, 552, "Вернуться на базу", () => this.scene.start("BaseScene"));
  }
}
