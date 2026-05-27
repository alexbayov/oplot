import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { canEnterDailyInstance } from "../systems/dailyInstance";
import {
  describeUnlockCondition,
  evaluateUnlockCondition,
} from "../systems/zoneUnlock";
import type { Zone } from "../types";
import {
  createButton,
  createPanel,
  createSubtitle,
  createTitle,
  createSmallButton,
  addVignette,
  addDustParticles,
} from "./sceneUi";
import { showRewardedVideo } from "../systems/ads";
import { showBanner } from "../systems/banner";
import { CX, CY, W, H } from "../ui/layout";

const ZONE_ORDER: readonly string[] = ["forest", "warehouse", "city"];

const sortZonesForMap = (zones: Zone[]): Zone[] => {
  const orderOf = (z: Zone): number => {
    const idx = ZONE_ORDER.indexOf(z.id);
    return idx === -1 ? ZONE_ORDER.length : idx;
  };
  return [...zones].sort((a, b) => orderOf(a) - orderOf(b));
};

export class MapScene extends Phaser.Scene {
  public constructor() {
    super("MapScene");
  }

  public create(): void {
    this.add.image(CX, CY, "bg_forest").setAlpha(0.15).setDisplaySize(W, H).setDepth(-10);
    createTitle(this, "Карта");
    addVignette(this);
    addDustParticles(this);
    void showBanner();
    const zones = sortZonesForMap(Object.values(GameState.data.zones));
    if (zones.length === 0) {
      createPanel(this, CX, CY, 600, 120);
      createSubtitle(this, CY, "Нет доступных зон.");
      createButton(this, H - 60, "Назад в Оплот", () =>
        this.scene.start("BaseScene"),
      );
      return;
    }

    // Зоны раскладываем в 3 колонки (landscape позволяет)
    const cols = 3;
    const cardW = 400;
    const cardH = 140;
    const gapX = 16;
    const gapY = 14;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const startX = (W - gridW) / 2 + cardW / 2;
    const startY = 130;

    zones.forEach((zone, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const xCenter = startX + col * (cardW + gapX);
      const yCenter = startY + row * (cardH + gapY);

      createPanel(this, xCenter, yCenter, cardW, cardH);
      const unlocked = evaluateUnlockCondition(zone.unlock_condition, GameState.progress);
      
      const header = unlocked ? `${zone.name_ru} (ур. ${zone.level})` : `${zone.name_ru} (ур. ${zone.level}) 🔒`;
      const subtitle = unlocked
        ? zone.description_ru
        : `Закрыто. Требуется: ${describeUnlockCondition(zone.unlock_condition)}.`;

      const leftX = xCenter - cardW / 2 + 20;
      // Header text
      this.add.text(leftX + 16, yCenter - 54, header, {
        color: unlocked ? "#D4C5A0" : "#8A8070",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
      });

      // Risk dot
      const riskColors = [0x4682b4, 0x6f8a4d, 0xffb300, 0x8b0000];
      const riskIdx = Math.min(zone.level - 1, 3);
      this.add.rectangle(leftX, yCenter - 48, 9, 9, riskColors[riskIdx] ?? 0xffb300).setDepth(5);

      const mobsInZone = Object.values(GameState.data.mobs).filter((m) => m.zone === zone.id).length;
      const descExtra = unlocked
        ? `${subtitle}\nВрагов: ${mobsInZone} · Глубина: max ${zone.levels.length}`
        : subtitle;
      this.add.text(leftX, yCenter - 28, descExtra, {
        color: "#C8C0B0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "11px",
        wordWrap: { width: cardW - 140 },
      });

      const onClick = (): void => {
        if (!unlocked) return;
        this.scene.start("SortieScene", { zoneId: zone.id });
      };

      const btnRightX = xCenter + cardW / 2 - 60;
      if (unlocked && zone.boss_id) {
        createSmallButton(this, btnRightX, yCenter - 22, "Войти", 100, onClick, true);
        const canDaily = canEnterDailyInstance(GameState.progress, zone, Date.now());
        const dailyLabel = canDaily ? "Дейли" : "Кулдаун";
        const dailyBtn = createSmallButton(this, btnRightX, yCenter + 18, dailyLabel, 100, () => {
          if (canDaily) {
            this.scene.start("SortieScene", { zoneId: zone.id, daily: true, depth: 3 });
          } else {
            showRewardedVideo("daily_reset", () => {
              GameState.progress.daily_completed[zone.id] = 0;
              this.scene.restart();
            });
          }
        }, canDaily);
        if (!canDaily) dailyBtn.setAlpha(0.6);
      } else {
        const btnLabel = unlocked ? "Войти" : "Закрыто";
        const enterBtn = createSmallButton(this, btnRightX, yCenter, btnLabel, 100, onClick, unlocked);
        if (!unlocked) enterBtn.setAlpha(0.5);
      }
    });

    createButton(this, H - 40, "Назад в Оплот", () => this.scene.start("BaseScene"));
  }
}
