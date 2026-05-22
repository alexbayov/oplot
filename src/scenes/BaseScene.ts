import Phaser from "phaser";
import { GameState, addToStack } from "../state/GameState";
import { computeWeight } from "../systems/weight";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";

export class BaseScene extends Phaser.Scene {
  public constructor() {
    super("BaseScene");
  }

  public create(): void {
    const { player, data, baseStash } = GameState;
    const weapon = data.items[player.equipped_weapon_id];
    const armor = data.items[player.equipped_armor_id];
    const stashWeight = computeWeight(baseStash, data.items);
    const stashStacks = baseStash.length;

    createTitle(this, "ОПЛОТ");
    createPanel(this, 180, 220, 320, 200);
    createSubtitle(
      this,
      164,
      `HP: ${player.hp}/${player.hp_max} · Уровень ${player.level}`,
    );
    createSubtitle(
      this,
      200,
      `Оружие: ${weapon?.name_ru ?? "—"}\nБроня: ${armor?.name_ru ?? "—"}`,
    );
    createSubtitle(
      this,
      256,
      `Склад: ${stashStacks} стаков · ${stashWeight.toFixed(1)} кг`,
    );

    createButton(this, 380, "В вылазку", () => this.scene.start("MapScene"));
    createButton(this, 436, "Мастерская", () => this.scene.start("CraftScene"));
    createButton(this, 492, "Инвентарь", () => this.scene.start("InventoryScene"));
    createButton(this, 548, "Радио", () => this.scene.start("RadioScene"));
    createButton(this, 604, "Прогрессия", () => this.scene.start("ProgressionScene"));

    if (import.meta.env.DEV) {
      this.setupDevCheats();
    }
  }

  private setupDevCheats(): void {
    // DEV ONLY — guarded by import.meta.env.DEV; tree-shaken in prod build.
    // `O` adds cloth × 10 to baseStash, used to stage overload tests in LootScene.
    this.input.keyboard?.on("keydown-O", () => {
      GameState.baseStash = addToStack(GameState.baseStash, "cloth", 10);
      this.scene.restart();
    });
  }
}
