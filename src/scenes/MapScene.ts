import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { canEnterDailyInstance } from "../systems/dailyInstance";
import {
  describeUnlockCondition,
  evaluateUnlockCondition,
} from "../systems/zoneUnlock";
import type { Zone } from "../types";
import { W, H } from "../ui/layout";
import { track } from "../systems/telemetry";
import { renderZoneTierPlate } from "../ui/tierBadge";

/**
 * MapScene (M10.1, M13 PR-2) — painted world map с пинами для 3 зон M13.
 *
 * До M13 на карте было 9 локаций. M13 PR-2 ужал до 3: Лес (start), Склад
 * (player_level_2), Промзона (player_level_4). Координаты остальных 6
 * сохранены в docs/redesign/archive/m14-zones.md для будущего восстановления.
 *
 * Locked зоны отображаются полупрозрачно, с замком. Hover показывает tooltip
 * с описанием и условиями разблокировки.
 */

interface PinDef {
  zone_id: string;
  /** Game-coord center over painted map */
  x: number;
  y: number;
}

const PINS: PinDef[] = [
  { zone_id: "forest", x: 262, y: 122 },
  { zone_id: "warehouse", x: 211, y: 356 },
  { zone_id: "factory", x: 1068, y: 403 },
];

export class MapScene extends Phaser.Scene {
  public constructor() {
    super("MapScene");
  }

  public create(): void {
    // ── Painted background — растягиваем на весь экран ────────
    this.add.image(W / 2, H / 2, "world_map")
      .setDisplaySize(W, H)
      .setDepth(-10);

    // Лёгкая виньетка
    const v = this.add.graphics().setDepth(-9);
    v.fillStyle(0x000000, 0.3);
    v.fillRect(0, 0, W, 60);
    v.fillRect(0, H - 80, W, 80);

    // ── Top bar ───────────────────────────────────────────────
    this.add.rectangle(W / 2, 22, W, 44, 0x0a0806, 0.7).setDepth(8)
      .setStrokeStyle(1, 0x3a2f1a, 0.5);
    this.add.text(W / 2, 22, "ВЫБОР ЗОНЫ", {
      color: "#D4C5A0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(9);

    // Back to base
    const backTxt = this.add.text(30, 22, "← НАЗАД В ОПЛОТ", {
      color: "#a89968",
      fontFamily: "Oswald, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
    }).setOrigin(0, 0.5).setDepth(9).setInteractive({ useHandCursor: true });
    backTxt.on("pointerover", () => backTxt.setColor("#D4C5A0"));
    backTxt.on("pointerout", () => backTxt.setColor("#a89968"));
    backTxt.on("pointerdown", () => this.scene.start("BaseScene"));

    // ── Pins ──────────────────────────────────────────────────
    const now = Date.now();
    PINS.forEach((p) => {
      const zone = GameState.data.zones[p.zone_id];
      if (!zone) return;
      const unlockOk = evaluateUnlockCondition(
        zone.unlock_condition,
        GameState.progress,
        GameState.player.level,
      );
      const dailyAvailable = zone.boss_id
        ? canEnterDailyInstance(GameState.progress, zone, now)
        : true;
      this.renderPin(p, zone, unlockOk, dailyAvailable);
    });

    // ── Legend / status ──────────────────────────────────────
    this.add.text(W / 2, H - 24, "💡 ПОДВЕДИ К ПИНУ — ИНФА ПО ЗОНЕ · ❶❷❸ = РИСК", {
      color: "#a89968",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
      backgroundColor: "#0a0806",
      padding: { x: 12, y: 4 },
    }).setOrigin(0.5).setDepth(9);
  }

  private renderPin(
    p: PinDef,
    zone: Zone,
    unlocked: boolean,
    dailyAllowed: boolean,
  ): void {
    const fillColor = unlocked ? 0xd4a04a : 0x4a4a3a;
    const strokeColor = unlocked ? 0xffd070 : 0x6a6a5a;

    // Pin halo — pulsing если доступно
    if (unlocked) {
      const halo = this.add.circle(p.x, p.y, 28, fillColor, 0.25)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(4);
      this.tweens.add({
        targets: halo,
        scale: { from: 1, to: 1.8 },
        alpha: { from: 0.35, to: 0 },
        duration: 1800,
        repeat: -1,
        ease: "Sine.Out",
      });
    }

    // Pin marker
    const pin = this.add.circle(p.x, p.y, 16, fillColor, 1)
      .setStrokeStyle(3, strokeColor, 1)
      .setDepth(5);

    // Pin inner — icon area
    if (unlocked) {
      this.add.circle(p.x, p.y, 6, 0x1a1208, 1).setDepth(6);
    } else {
      // Lock icon
      this.add.text(p.x, p.y, "🔒", {
        fontSize: "14px",
      }).setOrigin(0.5).setDepth(6);
    }

    // Risk indicator (3 точки) под пином — по zone.level (1=зелёная, 5=красная)
    const dotsY = p.y + 26;
    const dotSpacing = 6;
    const startX = p.x - dotSpacing;
    const riskCount = Math.min(3, Math.ceil(zone.level / 2));
    for (let i = 0; i < 3; i++) {
      const filled = i < riskCount;
      this.add.circle(startX + i * dotSpacing, dotsY, 2,
        filled ? 0xff6b6b : 0x4a3a30, 1).setDepth(5);
    }

    // M11.1 — плашка тиров зоны (T1-2 / T3-4 / T4-5...)
    renderZoneTierPlate(this, p.x + 30, p.y - 16, zone.zone_tier_range);

    // Zone name под рисками
    const label = this.add.text(p.x, dotsY + 12, zone.name_ru, {
      color: unlocked ? "#f0e6cd" : "#7a7060",
      fontFamily: "Oswald, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      backgroundColor: "#0a0806cc",
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setDepth(5);

    // Tooltip большая на hover
    const tooltipBg = this.add.rectangle(p.x, p.y - 80, 280, 110, 0x0a0806, 0.95)
      .setStrokeStyle(2, 0xd4a04a, 1)
      .setDepth(15)
      .setAlpha(0)
      .setVisible(false);
    const tooltipText = this.add.text(p.x, p.y - 80, "", {
      color: "#D4C5A0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
      align: "center",
      wordWrap: { width: 260 },
    }).setOrigin(0.5).setDepth(16).setAlpha(0).setVisible(false);

    pin.setInteractive({ useHandCursor: true });
    label.setInteractive({ useHandCursor: true });

    const showTooltip = () => {
      const desc = zone.description_ru ?? "Постапокалиптическая зона.";
      const status = unlocked
        ? (dailyAllowed
          ? "ДОСТУПНА · можно зайти сегодня"
          : "ДОСТУПНА · ежедневная вылазка уже использована")
        : `ЗАБЛОКИРОВАНА · нужно: ${describeUnlockCondition(zone.unlock_condition)}`;
      const tip = `${zone.name_ru.toUpperCase()}\n${desc}\n\n${status}`;
      tooltipText.setText(tip);

      // Положение: выше pin'а, кроме верхнего ряда
      const tipY = p.y < 200 ? p.y + 100 : p.y - 80;
      tooltipBg.setPosition(p.x, tipY).setVisible(true);
      tooltipText.setPosition(p.x, tipY).setVisible(true);
      this.tweens.add({ targets: [tooltipBg, tooltipText], alpha: 1, duration: 180 });
    };
    const hideTooltip = () => {
      this.tweens.add({
        targets: [tooltipBg, tooltipText],
        alpha: 0,
        duration: 180,
        onComplete: () => {
          tooltipBg.setVisible(false);
          tooltipText.setVisible(false);
        },
      });
    };

    pin.on("pointerover", showTooltip);
    pin.on("pointerout", hideTooltip);
    label.on("pointerover", showTooltip);
    label.on("pointerout", hideTooltip);

    const onClick = () => {
      if (!unlocked) {
        // Кратко мигнуть и показать tooltip
        showTooltip();
        this.tweens.add({
          targets: pin,
          scale: { from: 1, to: 1.2 },
          duration: 120,
          yoyo: true,
        });
        return;
      }
      if (!dailyAllowed && zone.boss_id) {
        // Боссовые зоны без daily — показать tooltip
        showTooltip();
        return;
      }
      track("zone_selected", { zone_id: zone.id });
      this.scene.start("SortieScene", { zoneId: zone.id });
    };
    pin.on("pointerdown", onClick);
    label.on("pointerdown", onClick);
  }
}
