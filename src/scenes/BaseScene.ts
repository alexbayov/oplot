import Phaser from "phaser";
import { GameState, addToStack, setSfxMute, setSfxVolume } from "../state/GameState";
import { runTween } from "../systems/tweens";
import { computeWeight } from "../systems/weight";
import { createButton, createPanel, createTitle, createSmallButton, createHpBar } from "./sceneUi";
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
    this.add.image(180, 320, "bg_forest").setAlpha(0.15).setScale(1.2).setDepth(-1);
    this.add.image(75, 220, "hero").setOrigin(0.5).setScale(0.8).setAlpha(0.9).setDepth(1);
    createPanel(this, 180, 220, 320, 200);

    createHpBar(this, 135, 140, player.hp, player.hp_max, 160, 10);
    this.add.text(135, 155, `HP: ${player.hp}/${player.hp_max} · Ур. ${player.level}`, {
      color: "#C8C0B0",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
    });

    this.add.text(135, 185, `Оружие: ${weapon?.name_ru ?? "—"}\nБроня: ${armor?.name_ru ?? "—"}`, {
      color: "#C8C0B0",
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
    });

    this.add.text(135, 245, `Склад: ${stashStacks} стак. · ${stashWeight.toFixed(1)} кг`, {
      color: "#D4C5A0",
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
    });

    const sortieBtn = createButton(this, 360, "В вылазку", () => this.scene.start("MapScene"), true);
    const craftBtn = createSmallButton(this, 100, 420, "Мастерская", 140, () => this.scene.start("CraftScene"));
    const invBtn = createSmallButton(this, 260, 420, "Инвентарь", 140, () => this.scene.start("InventoryScene"));
    const radioBtn = createSmallButton(this, 100, 470, "Радио", 140, () => this.scene.start("RadioScene"));
    const progBtn = createSmallButton(this, 260, 470, "Прогрессия", 140, () => this.scene.start("ProgressionScene"));

    const buttons = [sortieBtn, craftBtn, invBtn, radioBtn, progBtn];

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
