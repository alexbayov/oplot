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

const BAR_X = 30;
const BAR_Y = 118;
const BAR_WIDTH = 300;
const BAR_HEIGHT = 16;
const BAR_FILL_COLOR = 0x6f8a4d;

export class ProgressionScene extends Phaser.Scene {
  public constructor() {
    super("ProgressionScene");
  }

  public create(): void {
    const { player } = GameState;
    const mods = computePerkModifiers(player.perks);

    createTitle(this, `Уровень ${player.level}`);

    this.add.rectangle(BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT, 0x2a2a2a).setStrokeStyle(1, 0x5f5a50).setOrigin(0);
    const progress = xpProgress(player.xp, player.level);
    const fillWidth = Math.max(1, BAR_WIDTH * progress);
    this.add.rectangle(BAR_X, BAR_Y, fillWidth, BAR_HEIGHT, BAR_FILL_COLOR).setOrigin(0);

    const currentThreshold = player.level > 1 ? xpToNext(player.level - 1) : 0;
    const nextThreshold = xpToNext(player.level);
    createSubtitle(this, BAR_Y + BAR_HEIGHT + 14, `${player.xp} / ${player.xp + nextThreshold - currentThreshold} XP до след. уровня`);

    const perkY = 200;
    createPanel(this, 180, perkY + player.perks.length * 40, 320, Math.max(80, player.perks.length * 40 + 20));

    if (player.perks.length === 0) {
      createSubtitle(this, perkY, "Перков пока нет.");
    } else {
      player.perks.forEach((perk, idx) => {
        const y = perkY - player.perks.length * 20 + idx * 40 + 10;
        this.add.text(30, y, perk.name, {
          color: "#F5F1E8",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "14px",
          fontStyle: "bold",
        });
        this.add.text(30, y + 18, perk.description, {
          color: "#C8C0B0",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "12px",
        });
      });
    }

    const statsY = perkY + player.perks.length * 40 + 60;
    createPanel(this, 180, statsY + 40, 320, 110);
    const statLines: string[] = [];
    if (mods.hp_max_additive !== 0) statLines.push(`+${mods.hp_max_additive} HP макс`);
    if (mods.damage_multiplier !== 1.0) statLines.push(`×${mods.damage_multiplier.toFixed(2)} урон`);
    if (mods.crit_chance_additive !== 0) statLines.push(`+${(mods.crit_chance_additive * 100).toFixed(0)}% крит`);
    if (mods.armor_efficiency_multiplier !== 1.0) statLines.push(`×${mods.armor_efficiency_multiplier.toFixed(2)} броня`);
    if (mods.weight_penalty_multiplier !== 1.0) statLines.push(`×${mods.weight_penalty_multiplier.toFixed(2)} вес.штраф`);
    if (mods.loot_quantity_multiplier !== 1.0) statLines.push(`×${mods.loot_quantity_multiplier.toFixed(2)} лут`);
    if (mods.crafting_speed_multiplier !== 1.0) statLines.push(`×${mods.crafting_speed_multiplier.toFixed(2)} крафт`);
    if (mods.xp_gain_multiplier !== 1.0) statLines.push(`×${mods.xp_gain_multiplier.toFixed(2)} XP`);
    if (mods.hp_max_additive === 0 && player.perks.length === 0) {
      statLines.push("Нет активных бонусов");
    }
    statLines.forEach((line, idx) => {
      this.add.text(30, statsY + idx * 18, line, {
        color: "#C8C0B0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
      });
    });

    const veteranNote = player.hp_max > 100 + mods.hp_max_additive
      ? `\nВетеранская закалка: +${VETERAN_CONDITIONING_HP_BONUS} HP (все перки взяты)`
      : "";
    if (veteranNote) {
      createSubtitle(this, statsY + statLines.length * 18 + 16, veteranNote);
    }

    const backY = Math.max(statsY + 130, 540);
    createButton(this, backY, "Назад", () => this.scene.start("BaseScene"));
  }
}
