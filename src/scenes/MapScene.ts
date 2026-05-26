import Phaser from "phaser";
import { GAME_HEIGHT } from "../config";
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
} from "./sceneUi";
import { showRewardedVideo } from "../systems/ads";
import { showBanner } from "../systems/banner";

// GDD §6.4.M3.3: MapScene lists every zone with its unlock_condition evaluated
// against GameState.progress. Locked zones render as a disabled label so the player
// can see what's coming next. M2 forest path is unchanged ("start" → always unlocked).
//
// Zone ordering: explicit array first (forest → warehouse → city) so the player
// reads the progression top-to-bottom; unknown ids fall to the tail of the list.
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
    createTitle(this, "Карта");
    this.add.image(180, 320, "bg_forest").setAlpha(0.15).setScale(1.2).setDepth(-1);
    void showBanner();
    const zones = sortZonesForMap(Object.values(GameState.data.zones));
    if (zones.length === 0) {
      createPanel(this, 180, 240, 320, 120);
      createSubtitle(this, 240, "Нет доступных зон.");
      createButton(this, 460, "Назад в Оплот", () =>
        this.scene.start("BaseScene"),
      );
      return;
    }

    // Stack zone cards top-to-bottom. Each card has enough room for two-line wrapped
    // descriptions plus the entry button without overlap (GAME_HEIGHT 640px budget).
    const startY = 140;
    const rowHeight = 150;
    zones.forEach((zone, idx) => {
      const yCenter = startY + idx * rowHeight;
      createPanel(this, 180, yCenter, 320, rowHeight - 18);
      const unlocked = evaluateUnlockCondition(zone.unlock_condition, GameState.progress);
      const header = `${zone.name_ru} (ур. ${zone.level})`;
      const subtitle = unlocked
        ? zone.description_ru
        : `Закрыто. Откроется после: ${describeUnlockCondition(zone.unlock_condition)}.`;
      createSubtitle(this, yCenter - 50, header);
      createSubtitle(this, yCenter - 12, subtitle);
      const buttonLabel = unlocked ? `Войти: ${zone.name_ru}` : `Закрыто: ${zone.name_ru}`;
      const onClick = (): void => {
        if (!unlocked) return;
        this.scene.start("SortieScene", { zoneId: zone.id });
      };
      const btn = createButton(this, yCenter + 42, buttonLabel, onClick);
      if (!unlocked) {
        btn.setAlpha(0.5);
      }
      // M5 daily instance button per zone with boss_id.
      if (unlocked && zone.boss_id) {
        const canDaily = canEnterDailyInstance(GameState.progress, zone, Date.now());
        const dailyLabel = canDaily ? `Дейли: ${zone.name_ru}` : `Дейли: перезарядка`;
        const dailyBtn = createButton(this, yCenter + 86, dailyLabel, () => {
          if (canDaily) {
            this.scene.start("SortieScene", { zoneId: zone.id, daily: true, depth: 3 });
          } else {
            showRewardedVideo("daily_reset", () => {
              GameState.progress.daily_completed[zone.id] = 0;
              this.scene.restart();
            });
          }
        });
        if (!canDaily) {
          dailyBtn.setAlpha(0.5);
        }
      }
    });

    const backY = Math.min(
      startY + zones.length * rowHeight + 6,
      GAME_HEIGHT - 24,
    );
    createButton(this, backY, "Назад в Оплот", () => this.scene.start("BaseScene"));
  }
}
