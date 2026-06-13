import Phaser from "phaser";
import { GameState, addToStack } from "../state/GameState";
import { generateSortieEncounters, generateZoneLoot } from "../systems/loot";
import { runTween } from "../systems/tweens";
import type { InventoryStack, SortieState } from "../state/types";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";
import { hideBanner } from "../systems/banner";
import { CX, CY, W, H } from "../ui/layout";
import { track } from "../systems/telemetry";
import { computeWeight } from "../systems/weight";
import type { SortieGoal } from "../types/sortie";
import { SORTIE_GOALS } from "../systems/sortieResolve";

interface SortieInit {
  zoneId?: string;
}

const FIGHTS_PER_DEPTH: Record<1 | 2 | 3, number> = { 1: 2, 2: 3, 3: 4 };

const CONSUMABLE_PASSTHROUGH = (itemId: string): boolean => {
  // M13: герой берёт расходники в вылазку автоматом. UI выбора — PR-1.5.
  return ["bandage", "medkit", "ammo_pistol", "canned_food", "water"].includes(itemId);
};

export class SortieScene extends Phaser.Scene {
  private zoneId: string | null = null;
  private selectedDepth: 1 | 2 | 3 = 1;
  private selectedGoal: SortieGoal = "quiet";

  public constructor() {
    super("SortieScene");
  }

  public init(data: SortieInit): void {
    if (data?.zoneId) {
      this.zoneId = data.zoneId;
    } else if (GameState.currentSortie) {
      this.zoneId = GameState.currentSortie.zone_id;
    } else {
      const first = Object.values(GameState.data.zones)[0];
      this.zoneId = first ? first.id : null;
    }
  }

  public create(): void {
    void hideBanner();
    const zone = this.zoneId ? GameState.data.zones[this.zoneId] : null;
    createTitle(this, "Вылазка");
    if (!zone) {
      createSubtitle(this, CY, "Зона не найдена.");
      createButton(this, H - 80, "Назад", () => this.scene.start("MapScene"));
      return;
    }

    const sortie = GameState.currentSortie;
    if (sortie && sortie.zone_id === zone.id && sortie.fights_completed < sortie.fights_total) {
      const remaining = sortie.fights_total - sortie.fights_completed;
      createPanel(this, CX, CY - 40, 600, 200);
      createSubtitle(
        this,
        CY - 40,
        `Зона: ${zone.name_ru}\nГлубина ${sortie.depth}: всего ${sortie.fights_total}\nОсталось энкаунтеров: ${remaining}`,
      );
      createButton(this, H - 130, "Продолжить", () => this.scene.start("SortieRunScene"), true);
      createButton(this, H - 70, "В Оплот", () => this.returnFromActiveSortie());
      return;
    }

    createPanel(this, CX, 200, 600, 130);
    createSubtitle(this, 180, `Зона: ${zone.name_ru}`);
    createSubtitle(this, 220, "Выбери глубину и цель вылазки");

    this.renderDepthRow(zone);
    this.renderGoalRow();
    this.renderGoSummary(zone);

    createButton(this, H - 60, "Назад", () => this.scene.start("MapScene"));
  }

  private renderDepthRow(zone: { levels: { depth: 1 | 2 | 3; min_player_level: number }[] }): void {
    const playerLevel = GameState.player.level;
    const depths: (1 | 2 | 3)[] = [1, 2, 3];
    const btnW = 200;
    const gap = 16;
    const totalW = depths.length * btnW + (depths.length - 1) * gap;
    const startX = CX - totalW / 2 + btnW / 2;
    const btnY = 320;

    createSubtitle(this, 290, "Глубина");

    depths.forEach((depth, idx) => {
      const level = zone.levels.find((l) => l.depth === depth);
      const xPos = startX + idx * (btnW + gap);
      if (!level) return;
      const fights = FIGHTS_PER_DEPTH[depth];
      const locked = playerLevel < level.min_player_level;
      const label = locked
        ? `${depth} 🔒 lvl ${level.min_player_level}`
        : `Глубина ${depth} (${fights})`;
      createButton(
        this,
        btnY,
        label,
        () => {
          if (locked) return;
          this.selectedDepth = depth;
          this.scene.restart();
        },
        !locked && depth === this.selectedDepth,
        xPos,
      );
    });
  }

  private renderGoalRow(): void {
    createSubtitle(this, 390, "Цель");

    const goals: SortieGoal[] = [
      "quiet",
      "greedy",
      "targeted_fuel",
      "targeted_metal",
      "targeted_food",
      "targeted_water",
    ];
    const btnW = 195;
    const gap = 10;
    const perRow = 3;
    const totalW = perRow * btnW + (perRow - 1) * gap;
    const startX = CX - totalW / 2 + btnW / 2;
    const baseY = 430;

    goals.forEach((g, idx) => {
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      const x = startX + col * (btnW + gap);
      const y = baseY + row * 60;
      const def = SORTIE_GOALS[g];
      createButton(
        this,
        y,
        def.name_ru,
        () => {
          this.selectedGoal = g;
          this.scene.restart();
        },
        g === this.selectedGoal,
        x,
      );
    });
  }

  private renderGoSummary(zone: { id: string; name_ru: string }): void {
    const def = SORTIE_GOALS[this.selectedGoal];
    createSubtitle(this, H - 130, def.description_ru);
    createButton(
      this,
      H - 90,
      `В вылазку: ${def.name_ru} · глубина ${this.selectedDepth}`,
      () => this.startSortie(zone.id, this.selectedDepth, FIGHTS_PER_DEPTH[this.selectedDepth]),
      true,
    );
  }

  private startSortie(zoneId: string, depth: 1 | 2 | 3, fights: number): void {
    const zone = GameState.data.zones[zoneId];
    if (!zone) return;
    const overlay = this.add.rectangle(CX, CY, W, H, 0x000000).setAlpha(1).setDepth(100);
    runTween(this, "tween_sortie_enter", overlay);
    this.time.delayedCall(400, () => {
      overlay.destroy();
      const encounters = generateSortieEncounters(zone, depth, fights);
      const zoneLootPool = generateZoneLoot(zone, depth);
      const taken = this.takeConsumables();
      const sortie: SortieState = {
        zone_id: zoneId,
        depth,
        goal: this.selectedGoal,
        fights_total: fights,
        fights_completed: 0,
        encounters,
        zone_loot_remaining: zoneLootPool,
        pending_loot: [],
        taken_consumables: taken,
        resolved_log: [],
      };
      GameState.currentSortie = sortie;
      GameState.player.backpack = taken;

      track("sortie_started", {
        zone_id: sortie.zone_id,
        depth: sortie.depth,
        goal: sortie.goal,
        weight: computeWeight(GameState.player.backpack, GameState.data.items),
        hp_pct: Math.round((GameState.player.hp / GameState.player.hp_max) * 100),
      });

      this.scene.start("SortieRunScene");
    });
  }

  private takeConsumables(): InventoryStack[] {
    const stash = GameState.baseStash;
    const keptStash: InventoryStack[] = [];
    let backpack: InventoryStack[] = [];
    for (const stack of stash) {
      if (CONSUMABLE_PASSTHROUGH(stack.item_id) && stack.count > 0) {
        backpack = addToStack(backpack, stack.item_id, stack.count);
      } else {
        keptStash.push({ ...stack });
      }
    }
    GameState.baseStash = keptStash;
    return backpack;
  }

  private returnFromActiveSortie(): void {
    const sortie = GameState.currentSortie;
    if (!sortie) {
      this.scene.start("BaseScene");
      return;
    }
    sortie.final_outcome = "retreat";
    track("sortie_finished", {
      zone_id: sortie.zone_id,
      depth: sortie.depth,
      outcome: sortie.final_outcome,
      encounters_done: sortie.fights_completed,
      source: "resume_screen",
    });
    this.scene.start("LootScene");
  }
}
