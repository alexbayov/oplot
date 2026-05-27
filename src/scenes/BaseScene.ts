import Phaser from "phaser";
import { GameState, addToStack, setSfxMute, setSfxVolume } from "../state/GameState";
import { runTween } from "../systems/tweens";
import { computeWeight } from "../systems/weight";
import { createButton, createPanel, createTitle, createSmallButton, createHpBar } from "./sceneUi";
import { saveToCloud } from "../systems/cloudSave";
import { showBanner } from "../systems/banner";
import { createBadge } from "../ui/components/Badge";
import { COLORS, FONTS } from "../ui/tokens";
import { activeSignals } from "../systems/radio";
import { canEnterDailyInstance } from "../systems/dailyInstance";
import { xpToNext, xpRequired } from "../state/balance";
import { CX, CY, W, H, LAYOUT } from "../ui/layout";

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

    // Background — растянутый painted-фон
    this.add.image(CX, CY, "bg_forest").setAlpha(0.15).setDisplaySize(W, H).setDepth(-10);

    createTitle(this, "ОПЛОТ");

    // ── Portrait card (слева, как в мокапе) ──────────────────────
    const card = LAYOUT.base;
    createPanel(this, card.portraitCardX, card.portraitCardY, card.portraitCardW, card.portraitCardH);
    this.add.image(card.portraitCardX, card.portraitCardY - 80, "hero")
      .setOrigin(0.5)
      .setScale(1.2)
      .setAlpha(0.95)
      .setDepth(1);

    // HP bar внутри карточки
    const cardLeft = card.portraitCardX - card.portraitCardW / 2 + 20;
    const barY = card.portraitCardY + 60;
    createHpBar(this, cardLeft, barY, player.hp, player.hp_max, card.portraitCardW - 40, 12);
    this.add.text(cardLeft, barY + 16, `HP ${player.hp}/${player.hp_max}  ·  Ур. ${player.level}`, {
      color: "#C8C0B0",
      fontFamily: FONTS.body,
      fontSize: "13px",
    });

    // XP bar
    const xpForNext = xpToNext(player.level);
    const xpInLevel = player.xp - xpRequired(player.level);
    createHpBar(this, cardLeft, barY + 40, xpInLevel, xpForNext, card.portraitCardW - 40, 8, COLORS.accent, 0x2a2a20);
    this.add.text(cardLeft, barY + 52, `XP ${xpInLevel}/${xpForNext}`, {
      color: COLORS.textMuted,
      fontFamily: FONTS.body,
      fontSize: "11px",
    });

    this.add.text(cardLeft, barY + 78, `${weapon?.name_ru ?? "—"}`, {
      color: "#C8C0B0",
      fontFamily: FONTS.body,
      fontSize: "13px",
    });
    this.add.text(cardLeft, barY + 98, `${armor?.name_ru ?? "—"}`, {
      color: "#C8C0B0",
      fontFamily: FONTS.body,
      fontSize: "13px",
    });

    this.add.text(cardLeft, barY + 124, `Склад: ${stashStacks} ст. · ${stashWeight.toFixed(1)} кг`, {
      color: COLORS.textMain,
      fontFamily: FONTS.body,
      fontSize: "13px",
      fontStyle: "bold",
    });

    // ── Status badges (top-right) ───────────────────────────────
    const signals = activeSignals(GameState.data.radioSignals);
    if (signals.length > 0) {
      createBadge(this, W - 80, 80, `${signals.length}`, "warning", true);
    }
    const zones = Object.values(GameState.data.zones);
    const hasDaily = zones.some((z) => z.boss_id && canEnterDailyInstance(GameState.progress, z, Date.now()));
    if (hasDaily) {
      createBadge(this, W - 40, 80, "D", "accent", true);
    }

    // ── Главный CTA (центр) ──────────────────────────────────────
    createPanel(this, card.ctaX, card.ctaY - 30, 380, 100);
    this.add.text(card.ctaX, card.ctaY - 60, "Готов к вылазке?", {
      color: "#D4C5A0",
      fontFamily: FONTS.title,
      fontSize: "16px",
    }).setOrigin(0.5);

    createButton(this, card.ctaY, "В ВЫЛАЗКУ", () => this.scene.start("MapScene"), true, card.ctaX);

    // ── Меню справа (вертикальная колонка) ───────────────────────
    const menuX = card.menuColX;
    const menuY = card.menuColY;
    const menuStep = 64;
    const menuBtnW = card.menuBtnW;

    const craftBtn = createSmallButton(this, menuX, menuY, "МАСТЕРСКАЯ", menuBtnW, () => this.scene.start("CraftScene"));
    const invBtn = createSmallButton(this, menuX, menuY + menuStep, "ИНВЕНТАРЬ", menuBtnW, () => this.scene.start("InventoryScene"));
    const radioBtn = createSmallButton(this, menuX, menuY + menuStep * 2, "РАДИО", menuBtnW, () => this.scene.start("RadioScene"));
    const progBtn = createSmallButton(this, menuX, menuY + menuStep * 3, "ГЕРОЙ", menuBtnW, () => this.scene.start("ProgressionScene"));

    const sortieBtnArr: Phaser.GameObjects.Container[] = [craftBtn, invBtn, radioBtn, progBtn];
    for (const btn of sortieBtnArr) {
      btn.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
        runTween(this, "tween_menu_hover", btn);
      });
    }

    // ── Scanlines tactical overlay (полный экран) ────────────────
    const scanlines = this.add.graphics().setDepth(100).setAlpha(0.06);
    scanlines.lineStyle(1.5, 0x000000, 1);
    for (let sy = 0; sy < H; sy += 4) {
      scanlines.lineBetween(0, sy, W, sy);
    }

    this.addSettingsControls();

    void showBanner();

    if (import.meta.env.DEV) {
      this.setupDevCheats();
    }
  }

  private addSettingsControls(): void {
    const muteLabel = this.add
      .text(W - 24, 20, `SFX ${GameState.settings.sfxMuted ? "OFF" : "ON"}`, {
        color: "#F5F1E8",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "12px",
      })
      .setOrigin(1, 0);
    muteLabel.setInteractive({ useHandCursor: true });
    muteLabel.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      setSfxMute(!GameState.settings.sfxMuted);
      void saveToCloud();
      this.scene.restart();
    });

    const volLabel = this.add
      .text(W - 24, 40, `Vol ${Math.round(GameState.settings.sfxVolume * 100)}%`, {
        color: "#C8C0B0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "12px",
      })
      .setOrigin(1, 0);
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
    this.input.keyboard?.on("keydown-O", () => {
      GameState.baseStash = addToStack(GameState.baseStash, "cloth", 10);
      this.scene.restart();
    });
  }
}
