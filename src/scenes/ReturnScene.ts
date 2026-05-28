import Phaser from "phaser";
import { GameState, addToStack } from "../state/GameState";
import type { InventoryStack } from "../state/types";
import { computeWeight, computeReturnTime } from "../systems/weight";
import { computePerkModifiers } from "../systems/perks";
import {
  applySortieCompletion,
} from "../systems/zoneUnlock";
import { tickRadioOnReturn } from "../systems/radio";
import { runTween } from "../systems/tweens";
import { markDailyCompleted } from "../systems/dailyInstance";
import { saveToCloud } from "../systems/cloudSave";
import { showRewardedVideo, showInterstitial } from "../systems/ads";
import { checkUnprocessedPurchases } from "../systems/iap";
import {
  createButton,
  createPanel,
  createSubtitle,
  createTitle,
  createHpBar,
} from "./sceneUi";
import { CX, CY, H } from "../ui/layout";
import { track } from "../systems/telemetry";

export class ReturnScene extends Phaser.Scene {
  private progressFill?: Phaser.GameObjects.Rectangle;

  public constructor() {
    super("ReturnScene");
  }

  public create(): void {
    createTitle(this, "Возврат на базу");

    const player = GameState.player;
    const sortie = GameState.currentSortie;
    const zone = sortie ? GameState.data.zones[sortie.zone_id] : null;
    const zoneMultiplier = zone?.return_time_multiplier ?? 1.0;
    const curWeight = computeWeight(player.backpack, GameState.data.items);
    const mods = computePerkModifiers(player.perks);
    const returnTimeS = computeReturnTime(
      curWeight,
      player.max_weight_kg,
      zoneMultiplier,
      mods.weight_penalty_multiplier,
    );

    track("sortie_completed", {
      zone_id: sortie?.zone_id ?? "unknown",
      depth: sortie?.depth ?? 0,
      loot_count: player.backpack.reduce((sum, s) => sum + s.count, 0),
      hp_remaining: player.hp,
      hp_pct: Math.round((player.hp / player.hp_max) * 100),
      return_time_sec: Math.round(returnTimeS),
    });

    createPanel(this, CX, 200, 600, 100);
    createSubtitle(this, 180, `Вес ${curWeight.toFixed(1)}/${player.max_weight_kg} кг`);
    const zoneLabel = zone ? ` · ${zone.name_ru}` : "";
    createSubtitle(this, 220, `Время возврата: ${returnTimeS.toFixed(0)}с${zoneLabel}`);

    // Walking hero animation across screen
    const hero = this.add.rectangle(50, CY, 20, 20, 0x6f8a4d);
    runTween(this, "tween_return_walk", hero);

    // Progress bar centered
    const barWidth = 800;
    const barHeight = 18;
    const barX = CX - barWidth / 2;
    const barY = 380;

    const [, fillBar] = createHpBar(this, barX, barY, 0, 100, barWidth, barHeight, 0x4682B4, 0x1A2F3E);
    this.progressFill = fillBar;

    this.tweens.add({
      targets: this.progressFill,
      width: barWidth,
      duration: returnTimeS * 1000,
      ease: "Linear",
      onComplete: () => this.completeReturn(),
    });
  }

  private completeReturn(): void {
    const sortie = GameState.currentSortie;
    const zone = sortie ? GameState.data.zones[sortie.zone_id] : null;
    if (sortie && zone && sortie.fights_completed > 0) {
      GameState.progress = applySortieCompletion(
        GameState.progress, zone, sortie.depth, true,
      );
      if (zone.boss_id) {
        markDailyCompleted(GameState.progress, zone.id, Date.now());
      }
      this.showReturnOptions();
    } else {
      this.finishReturn();
    }
  }

  private showReturnOptions(): void {
    const player = GameState.player;
    // Две кнопки в ряд
    const btnW = 300;
    const gap = 40;
    const totalW = 2 * btnW + gap;
    const startX = CX - totalW / 2 + btnW / 2;
    const btnY = H - 70;

    createButton(this, btnY, "×2 лут (реклама)", () => {
      showRewardedVideo("loot_double", () => {
        const doubled: InventoryStack[] = [];
        for (const stack of player.backpack) {
          const item = GameState.data.items[stack.item_id];
          if (item && item.type === "resource") {
            doubled.push({ item_id: stack.item_id, count: stack.count });
          }
        }
        for (const stack of doubled) {
          player.backpack.push({ ...stack });
        }
      }, () => { this.finishReturn(); });
    }, false, startX);

    createButton(this, btnY, "На базу", () => {
      this.finishReturn();
    }, true, startX + btnW + gap);
  }

  private finishReturn(): void {
    const player = GameState.player;
    GameState.progress.radio_trust = tickRadioOnReturn(
      GameState.data.radioSignals,
      GameState.progress.radio_trust,
    );
    let stash = GameState.baseStash;
    for (const stack of player.backpack) {
      stash = addToStack(stash, stack.item_id, stack.count);
    }
    GameState.baseStash = stash;
    player.backpack = [];
    player.hp = player.hp_max;
    GameState.currentSortie = null;
    void saveToCloud();
    showInterstitial(() => {
      void checkUnprocessedPurchases();
      this.scene.start("BaseScene");
    });
  }
}
