import Phaser from "phaser";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";

export class MapScene extends Phaser.Scene {
  public constructor() {
    super("MapScene");
  }

  public create(): void {
    createTitle(this, "Карта");
    createSubtitle(this, 112, "MVP-зона: Лес");
    createPanel(this, 180, 250, 280, 180);
    createSubtitle(this, 232, "ЛЕС\nРесурсы, мародёры, дикие псы и мутанты.");
    createButton(this, 398, "Войти", () => this.scene.start("SortieScene"));
    createButton(this, 454, "Назад в Оплот", () => this.scene.start("BaseScene"));
  }
}
