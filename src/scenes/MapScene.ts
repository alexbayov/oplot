import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { canEnterDailyInstance } from "../systems/dailyInstance";
import {
  describeUnlockCondition,
  evaluateUnlockCondition,
} from "../systems/zoneUnlock";
import type { Zone } from "../types";
import {
  createPanel,
  createSubtitle,
  createSmallButton,
} from "./sceneUi";
import { showRewardedVideo } from "../systems/ads";
import { showBanner } from "../systems/banner";
import { createSceneHeader } from "../ui/components/SceneHeader";

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
    createSceneHeader(this, { title: "Карта секторов", backTo: "BaseScene" });
    this.add.image(180, 320, "bg_forest").setAlpha(0.15).setScale(1.2).setDepth(-1);
    void showBanner();
    const zones = sortZonesForMap(Object.values(GameState.data.zones));
    if (zones.length === 0) {
      createPanel(this, 180, 240, 320, 120);
      createSubtitle(this, 240, "Нет доступных зон.");
      return;
    }

    const startY = 140;
    const rowHeight = 125;
    zones.forEach((zone, idx) => {
      const yCenter = startY + idx * rowHeight;
      createPanel(this, 180, yCenter, 320, rowHeight - 15);
      const unlocked = evaluateUnlockCondition(zone.unlock_condition, GameState.progress);
      
      const header = unlocked ? `${zone.name_ru} (ур. ${zone.level})` : `${zone.name_ru} (ур. ${zone.level}) 🔒`;
      const subtitle = unlocked
        ? zone.description_ru
        : `Закрыто. Требуется: ${describeUnlockCondition(zone.unlock_condition)}.`;

      // Header text
      this.add.text(35, yCenter - 38, header, {
        color: unlocked ? "#D4C5A0" : "#8A8070",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
      });

      // Risk dot
      const riskColors = [0x4682b4, 0x6f8a4d, 0xffb300, 0x8b0000];
      const riskIdx = Math.min(zone.level - 1, 3);
      this.add.rectangle(30, yCenter - 38, 8, 8, riskColors[riskIdx] ?? 0xffb300).setDepth(5);

      // Enemy count
      const mobsInZone = Object.values(GameState.data.mobs).filter((m) => m.zone === zone.id).length;

      // Subtitle with enemies
      const descExtra = unlocked
        ? `${subtitle}\nВрагов: ${mobsInZone} · Глубина: max ${zone.levels.length}`
        : subtitle;
      this.add.text(35, yCenter - 15, descExtra, {
        color: "#C8C0B0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "11px",
        wordWrap: { width: 175 },
      });

      const onClick = (): void => {
        if (!unlocked) return;
        this.scene.start("SortieScene", { zoneId: zone.id });
      };

      if (unlocked && zone.boss_id) {
        // Daily boss zone has two buttons (Enter & Daily)
        createSmallButton(this, 270, yCenter - 22, "Войти", 100, onClick, true);
        
        const canDaily = canEnterDailyInstance(GameState.progress, zone, Date.now());
        const dailyLabel = canDaily ? "Дейли" : "Кулдаун";
        const dailyBtn = createSmallButton(this, 270, yCenter + 22, dailyLabel, 100, () => {
          if (canDaily) {
            this.scene.start("SortieScene", { zoneId: zone.id, daily: true, depth: 3 });
          } else {
            showRewardedVideo("daily_reset", () => {
              GameState.progress.daily_completed[zone.id] = 0;
              this.scene.restart();
            });
          }
        }, canDaily);
        
        if (!canDaily) {
          dailyBtn.setAlpha(0.6);
        }
      } else {
        // Normal zone has one button in the center right
        const btnLabel = unlocked ? "Войти" : "Закрыто";
        const enterBtn = createSmallButton(this, 270, yCenter, btnLabel, 100, onClick, unlocked);
        if (!unlocked) {
          enterBtn.setAlpha(0.5);
        }
      }
    });
  }
}
