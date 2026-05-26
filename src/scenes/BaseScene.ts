import Phaser from "phaser";
import { GameState, addToStack, setSfxMute, setSfxVolume } from "../state/GameState";
import { runTween } from "../systems/tweens";
import { computeWeight } from "../systems/weight";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";
import { saveToCloud } from "../systems/cloudSave";
import { showBanner } from "../systems/banner";

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
    this.add.image(180, 320, "bg_forest").setAlpha(0.1).setScale(1.2).setDepth(-1);
    this.add.image(280, 480, "hero").setOrigin(0.5).setScale(0.8).setAlpha(0.9).setDepth(1);
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

    const buttons = [
      createButton(this, 380, "В вылазку", () => this.scene.start("MapScene")),
      createButton(this, 436, "Мастерская", () => this.scene.start("CraftScene")),
      createButton(this, 492, "Инвентарь", () => this.scene.start("InventoryScene")),
      createButton(this, 548, "Радио", () => this.scene.start("RadioScene")),
      createButton(this, 604, "Прогрессия", () => this.scene.start("ProgressionScene")),
    ];

    for (const btn of buttons) {
      btn.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
        runTween(this, "tween_menu_hover", btn);
      });
    }

    this.addSettingsControls();

    void showBanner();

    if (import.meta.env.DEV) {
      this.setupDevCheats();
    }
  }

  private addSettingsControls(): void {
    const muteLabel = this.add
      .text(300, 20, `SFX ${GameState.settings.sfxMuted ? "OFF" : "ON"}`, {
        color: "#F5F1E8",
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
      })
      .setOrigin(0.5);
    muteLabel.setInteractive({ useHandCursor: true });
    muteLabel.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      setSfxMute(!GameState.settings.sfxMuted);
      void saveToCloud();
      this.scene.restart();
    });

    const volLabel = this.add
      .text(300, 40, `Vol ${Math.round(GameState.settings.sfxVolume * 100)}%`, {
        color: "#C8C0B0",
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
      })
      .setOrigin(0.5);
    volLabel.setInteractive({ useHandCursor: true });
    volLabel.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      let next = GameState.settings.sfxVolume - 0.25;
      if (next < 0) next = 1;
      setSfxVolume(next);
      void saveToCloud();
      this.scene.restart();
    });
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
