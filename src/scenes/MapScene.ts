import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";

export class MapScene extends Phaser.Scene {
  public constructor() {
    super("MapScene");
  }

  public create(): void {
    const zones = Object.values(GameState.data.zones);
    const zone = zones[0];

    createTitle(this, "Карта");
    createPanel(this, 180, 240, 320, 200);
    createSubtitle(
      this,
      176,
      zone
        ? `Зона: ${zone.name_ru}\n${zone.description_ru}`
        : "Нет доступных зон.",
    );
    createButton(this, 380, "Войти", () => {
      if (zone) {
        this.scene.start("SortieScene", { zoneId: zone.id });
      }
    });
    createButton(this, 436, "Назад в Оплот", () => this.scene.start("BaseScene"));
  }
}
