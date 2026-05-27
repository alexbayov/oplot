import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { xpProgress, xpToNext } from "../systems/xp";
import { computePerkModifiers } from "../systems/perks";
import { VETERAN_CONDITIONING_HP_BONUS } from "../state/balance";
import {
  createButton,
  createPanel,
  createSubtitle,
  createTitle,
} from "./sceneUi";
import { CX, H } from "../ui/layout";

const BAR_Y = 110;
const BAR_WIDTH = 600;
const BAR_HEIGHT = 18;
const BAR_FILL_COLOR = 0x6f8a4d;

export class ProgressionScene extends Phaser.Scene {
  public constructor() {
    super("ProgressionScene");
  }

  public create(): void {
    const { player } = GameState;
    const mods = computePerkModifiers(player.perks);

    createTitle(this, `Уровень ${player.level}`);

    // XP bar centered
    const barX = CX - BAR_WIDTH / 2;
    this.add.rectangle(barX, BAR_Y, BAR_WIDTH, BAR_HEIGHT, 0x2a2a2a).setStrokeStyle(1, 0x5f5a50).setOrigin(0);
    const progress = xpProgress(player.xp, player.level);
    const fillWidth = Math.max(1, BAR_WIDTH * progress);
    this.add.rectangle(barX, BAR_Y, fillWidth, BAR_HEIGHT, BAR_FILL_COLOR).setOrigin(0);

    const currentThreshold = player.level > 1 ? xpToNext(player.level - 1) : 0;
    const nextThreshold = xpToNext(player.level);
    createSubtitle(this, BAR_Y + BAR_HEIGHT + 18, `${player.xp} / ${player.xp + nextThreshold - currentThreshold} XP до след. уровня`);

    // Две колонки: перки слева, статы справа
    const colW = 540;
    const colH = 420;
    const gap = 40;
    const leftX = CX - colW - gap / 2;
    const rightX = CX + gap / 2;
    const colY = 180;

    // Левая колонка — перки
    createPanel(this, leftX + colW / 2, colY + colH / 2, colW, colH);
    this.add.text(leftX + colW / 2, colY + 20, "ПЕРКИ", {
      color: "#D4C5A0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
    }).setOrigin(0.5);

    if (player.perks.length === 0) {
      this.add.text(leftX + colW / 2, colY + 80, "Перков пока нет.", {
        color: "#8A8070",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
      }).setOrigin(0.5);
    } else {
      player.perks.forEach((perk, idx) => {
        const y = colY + 60 + idx * 50;
        this.add.text(leftX + 24, y, perk.name, {
          color: "#F5F1E8",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "14px",
          fontStyle: "bold",
        });
        this.add.text(leftX + 24, y + 20, perk.description, {
          color: "#C8C0B0",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "12px",
          wordWrap: { width: colW - 48 },
        });
      });
    }

    // Правая колонка — статы
    createPanel(this, rightX + colW / 2, colY + colH / 2, colW, colH);
    this.add.text(rightX + colW / 2, colY + 20, "СТАТИСТИКА", {
      color: "#D4C5A0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const statLines: string[] = [];
    if (mods.hp_max_additive !== 0) statLines.push(`+${mods.hp_max_additive} HP макс`);
    if (mods.damage_multiplier !== 1.0) statLines.push(`×${mods.damage_multiplier.toFixed(2)} урон`);
    if (mods.crit_chance_additive !== 0) statLines.push(`+${(mods.crit_chance_additive * 100).toFixed(0)}% крит`);
    if (mods.armor_efficiency_multiplier !== 1.0) statLines.push(`×${mods.armor_efficiency_multiplier.toFixed(2)} броня`);
    if (mods.weight_penalty_multiplier !== 1.0) statLines.push(`×${mods.weight_penalty_multiplier.toFixed(2)} вес.штраф`);
    if (mods.loot_quantity_multiplier !== 1.0) statLines.push(`×${mods.loot_quantity_multiplier.toFixed(2)} лут`);
    if (mods.crafting_speed_multiplier !== 1.0) statLines.push(`×${mods.crafting_speed_multiplier.toFixed(2)} крафт`);
    if (mods.xp_gain_multiplier !== 1.0) statLines.push(`×${mods.xp_gain_multiplier.toFixed(2)} XP`);
    if (statLines.length === 0) {
      statLines.push("Нет активных бонусов");
    }
    statLines.forEach((line, idx) => {
      this.add.text(rightX + 24, colY + 60 + idx * 22, line, {
        color: "#C8C0B0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
      });
    });

    const veteranNote = player.hp_max > 100 + mods.hp_max_additive
      ? `Ветеранская закалка: +${VETERAN_CONDITIONING_HP_BONUS} HP (все перки взяты)`
      : "";
    if (veteranNote) {
      this.add.text(rightX + 24, colY + 60 + statLines.length * 22 + 16, veteranNote, {
        color: "#C5A267",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
        fontStyle: "italic",
        wordWrap: { width: colW - 48 },
      });
    }

    createButton(this, H - 50, "Назад", () => this.scene.start("BaseScene"));
  }
}
