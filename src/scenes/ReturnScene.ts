import Phaser from "phaser";
import { GameState, addToStack } from "../state/GameState";
import type { InventoryStack } from "../state/types";
import { computeWeight, computeReturnTime } from "../systems/weight";
import { computePerkModifiers } from "../systems/perks";
import { applySortieCompletion } from "../systems/zoneUnlock";
import { tickRadioOnReturn } from "../systems/radio";
import { markDailyCompleted } from "../systems/dailyInstance";
import { saveToCloud } from "../systems/cloudSave";
import { showRewardedVideo, showInterstitial } from "../systems/ads";
import { checkUnprocessedPurchases } from "../systems/iap";
import { W, H } from "../ui/layout";
import { track } from "../systems/telemetry";

/**
 * ReturnScene (M10.4) — Return Ritual.
 *
 * Painted-cinematic длиной ~4 секунды:
 *  - Full-screen painted landscape (sunset, hero walks home toward city)
 *  - Slow parallax pan camera вправо (к огням города)
 *  - Fade-in поэтических заголовков: zone, дистанция, лут count
 *  - Progress bar внизу (gameplay return time — может быть 30-60s, но
 *    кинематик 4s крутится в петле scale/pan для эмоции)
 *  - В конце — summary card + кнопка(и) "На базу"
 *
 * Игровая логика (perks, loot transfer, daily marker, ads) сохранена
 * без изменений — только визуальная подача переписана.
 */

export class ReturnScene extends Phaser.Scene {
  private progressFill?: Phaser.GameObjects.Rectangle;
  private bgImage?: Phaser.GameObjects.Image;
  private summaryShown = false;

  public constructor() {
    super("ReturnScene");
  }

  public create(): void {
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

    this.renderCinematic(zone?.name_ru ?? "Зона X", curWeight, player.backpack.length, returnTimeS);
  }

  private renderCinematic(zoneName: string, weight: number, lootStacks: number, returnTimeS: number): void {
    // ── Painted landscape full-screen, slightly oversized для параллакс-пана ──
    this.bgImage = this.add.image(W / 2, H / 2, "return_landscape")
      .setDepth(-10);
    // Стартовая позиция: картина чуть шире экрана, начинаем с x-offset влево
    const baseScale = Math.max(W / this.bgImage.width, H / this.bgImage.height) * 1.12;
    this.bgImage.setScale(baseScale);

    // Параллакс-пан: 12s slow drift вправо (к городу), затем стоп
    const startX = W / 2 - 40;
    const endX = W / 2 + 40;
    this.bgImage.setX(startX);
    this.tweens.add({
      targets: this.bgImage,
      x: endX,
      duration: Math.max(8000, returnTimeS * 1000),
      ease: "Sine.InOut",
    });

    // ── Top vignette + bottom dim для текста ──
    const grad = this.add.graphics().setDepth(-9);
    grad.fillStyle(0x000000, 0.5);
    grad.fillRect(0, 0, W, 100);
    grad.fillStyle(0x000000, 0.55);
    grad.fillRect(0, H - 160, W, 160);

    // ── Top title: "ВОЗВРАЩЕНИЕ" ──
    const ritualTitle = this.add.text(W / 2, 50, "ВОЗВРАЩЕНИЕ", {
      color: "#D4C5A0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "28px",
      fontStyle: "bold",
      stroke: "#0a0806",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5).setAlpha(0);
    this.tweens.add({ targets: ritualTitle, alpha: 1, duration: 800, delay: 200 });

    // ── Subtitle: zone + weight ──
    const subtitle = this.add.text(W / 2, 85, `${zoneName.toUpperCase()}  ·  ВЕС ${weight.toFixed(1)} КГ  ·  ${lootStacks} ТРОФЕЕВ`, {
      color: "#c5a267",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "14px",
      stroke: "#0a0806",
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(5).setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 800, delay: 600 });

    // ── Poetic line — fades through 3 messages ──
    const lines = [
      "Дорога обратно длиннее, чем туда…",
      "Огни города уже видны.",
      "Ещё несколько шагов до дома.",
    ];
    const poetic = this.add.text(W / 2, H - 110, "", {
      color: "#a89968",
      fontFamily: "Oswald, sans-serif",
      fontSize: "20px",
      fontStyle: "italic",
      stroke: "#0a0806",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5).setAlpha(0);

    const cycleLine = (idx: number): void => {
      if (this.summaryShown || idx >= lines.length) return;
      poetic.setText(lines[idx] ?? "");
      this.tweens.add({
        targets: poetic,
        alpha: { from: 0, to: 1 },
        duration: 600,
        hold: Math.min(2500, (returnTimeS * 1000 - 1800) / lines.length),
        yoyo: true,
        onComplete: () => cycleLine(idx + 1),
      });
    };
    this.time.delayedCall(1200, () => cycleLine(0));

    // ── Progress bar bottom ──
    const barWidth = 600;
    const barHeight = 8;
    const barX = W / 2 - barWidth / 2;
    const barY = H - 50;
    this.add.rectangle(W / 2, barY, barWidth, barHeight, 0x1a1208, 0.85)
      .setStrokeStyle(1, 0x3a2f1a, 1)
      .setDepth(5);
    this.progressFill = this.add.rectangle(barX, barY, 0, barHeight, 0xd4a04a, 1)
      .setOrigin(0, 0.5)
      .setDepth(6);
    this.tweens.add({
      targets: this.progressFill,
      width: barWidth,
      duration: returnTimeS * 1000,
      ease: "Linear",
      onComplete: () => this.completeReturn(),
    });

    // ── Time hint ──
    const timeHint = this.add.text(W / 2, H - 30, `≈ ${returnTimeS.toFixed(0)}с`, {
      color: "#7a7060",
      fontFamily: "Roboto Mono, monospace",
      fontSize: "11px",
    }).setOrigin(0.5).setDepth(5).setAlpha(0.6);
    void timeHint;
  }

  private completeReturn(): void {
    if (this.summaryShown) return;
    this.summaryShown = true;
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
    const lootStacks = player.backpack.length;

    // ── Summary card — fades in at end of cinematic ──
    const card = this.add.rectangle(W / 2, H / 2, 720, 220, 0x0a0806, 0.92)
      .setStrokeStyle(2, 0xd4a04a, 1)
      .setDepth(10)
      .setAlpha(0);
    const cardTitle = this.add.text(W / 2, H / 2 - 80, "ВЫЛАЗКА ЗАВЕРШЕНА", {
      color: "#D4C5A0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "26px",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    const stats = this.add.text(W / 2, H / 2 - 30,
      `${lootStacks} стак(ов) лута  ·  HP ${player.hp}/${player.hp_max}`, {
      color: "#c5a267",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "16px",
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    this.tweens.add({
      targets: [card, cardTitle, stats],
      alpha: 1,
      duration: 600,
      ease: "Sine.Out",
    });

    // ── Кнопки — две варианта ──
    const btnW = 280;
    const btnH = 52;
    const gap = 28;
    const btnY = H / 2 + 60;

    this.makeButton(W / 2 - btnW / 2 - gap / 2, btnY, btnW, btnH, "×2 ЛУТ (реклама)", false, () => {
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
    });

    this.makeButton(W / 2 + btnW / 2 + gap / 2, btnY, btnW, btnH, "НА БАЗУ", true, () => {
      this.finishReturn();
    });
  }

  private makeButton(x: number, y: number, w: number, h: number, label: string, accent: boolean, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, w, h, accent ? 0xd4a04a : 0x2d2820, 1)
      .setStrokeStyle(2, accent ? 0xffd070 : 0x4a3f30, 1)
      .setDepth(12)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      color: accent ? "#1a1208" : "#d4c5a0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(13).setAlpha(0);

    this.tweens.add({ targets: [bg, txt], alpha: 1, duration: 400, delay: 300 });

    bg.on("pointerover", () => {
      this.tweens.add({ targets: bg, scale: 1.03, duration: 100 });
    });
    bg.on("pointerout", () => {
      this.tweens.add({ targets: bg, scale: 1, duration: 100 });
    });
    bg.on("pointerdown", onClick);
  }

  private finishReturn(): void {
    const player = GameState.player;
    GameState.progress.radio_trust = tickRadioOnReturn(
      GameState.data.radioSignals,
      GameState.progress.radio_trust,
    );
    // M13: лут переезжает на склад, а распознанные ресурсы базы
    // (water/fuel/metal/food) идут отдельным потоком в baseResources.
    let stash = GameState.baseStash;
    let baseResources = GameState.baseResources;
    for (const stack of player.backpack) {
      const baseTarget = routeToBaseResource(stack.item_id);
      if (baseTarget) {
        baseResources = { ...baseResources, [baseTarget]: baseResources[baseTarget] + stack.count };
      } else {
        stash = addToStack(stash, stack.item_id, stack.count);
      }
    }
    GameState.baseStash = stash;
    GameState.baseResources = baseResources;
    player.backpack = [];
    // Полное восстановление HP убрано: лечение должно быть осмысленным.
    // Возвращаем минимум 25% HP за возврат, чтобы не клинить игрока.
    player.hp = Math.max(player.hp, Math.round(player.hp_max * 0.25));
    // Тик травм на 1 день.
    player.injuries = (player.injuries ?? [])
      .map((i) => ({ ...i, days_left: i.days_left - 1 }))
      .filter((i) => i.days_left > 0);
    GameState.currentSortie = null;
    void saveToCloud();
    showInterstitial(() => {
      void checkUnprocessedPurchases();
      this.scene.start("BaseScene");
    });
  }
}

const BASE_RESOURCE_ROUTE: Record<string, "water" | "fuel" | "metal" | "food"> = {
  water: "water",
  fuel: "fuel",
  oil: "fuel",
  machine_oil: "fuel",
  scrap: "metal",
  scrap_metal: "metal",
  metal: "metal",
  electronics: "metal",
  circuitry: "metal",
  industrial_cable: "metal",
  canned_food: "food",
  food: "food",
  ration_bar: "food",
};

const routeToBaseResource = (
  item_id: string,
): "water" | "fuel" | "metal" | "food" | null => {
  return BASE_RESOURCE_ROUTE[item_id] ?? null;
};
