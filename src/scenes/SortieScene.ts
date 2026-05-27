import Phaser from "phaser";
import { GameState, addToStack } from "../state/GameState";
import { generateSortieEncounters, generateZoneLoot } from "../systems/loot";
import { runTween } from "../systems/tweens";
import type { InventoryStack, SortieState } from "../state/types";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";
import { hideBanner } from "../systems/banner";
import { CX, CY, W, H } from "../ui/layout";

interface SortieInit {
  zoneId?: string;
}

// fights_per_depth from balance.md §Зоны
const FIGHTS_PER_DEPTH: Record<1 | 2 | 3, number> = { 1: 2, 2: 3, 3: 4 };

const CONSUMABLE_PASSTHROUGH_KEEP = (itemId: string): boolean => {
  // Hero brings consumables (bandages, medkits, ammo) into the sortie automatically.
  return ["bandage", "medkit", "ammo_pistol"].includes(itemId);
};

export class SortieScene extends Phaser.Scene {
  private zoneId: string | null = null;

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
        `Зона: ${zone.name_ru}\nГлубина ${sortie.depth}: бои ${sortie.fights_total}\nБоёв осталось: ${remaining}`,
      );
      createButton(this, H - 130, "Следующий бой", () => this.scene.start("CombatScene"), true);
      createButton(this, H - 70, "Назад в Оплот", () => {
        GameState.currentSortie = null;
        this.scene.start("BaseScene");
      });
      return;
    }

    createPanel(this, CX, 220, 600, 160);
    createSubtitle(
      this,
      200,
      `Зона: ${zone.name_ru}`,
    );
    createSubtitle(this, 240, "Выбери глубину вылазки");

    const playerLevel = GameState.player.level;
    const depths: (1 | 2 | 3)[] = [1, 2, 3];
    // 3 кнопки в ряд по центру
    const btnW = 260;
    const gap = 20;
    const totalW = depths.length * btnW + (depths.length - 1) * gap;
    const startX = CX - totalW / 2 + btnW / 2;
    const btnY = 420;

    depths.forEach((depth, idx) => {
      const level = zone.levels.find((l) => l.depth === depth);
      const xPos = startX + idx * (btnW + gap);
      if (!level) {
        createButton(this, btnY, `Depth ${depth} нет`, () => undefined, false, xPos);
        return;
      }
      const fights = FIGHTS_PER_DEPTH[depth];
      const locked = playerLevel < level.min_player_level;
      const label = locked
        ? `Depth ${depth} 🔒 lvl ${level.min_player_level}`
        : `Depth ${depth} (${fights} боёв)`;
      createButton(this, btnY, label, () => {
        if (locked) return;
        this.startSortie(zone.id, depth, fights);
      }, !locked && depth === 1, xPos);
    });

    createButton(this, H - 60, "Назад", () => this.scene.start("MapScene"));
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
      const sortie: SortieState = {
        zone_id: zoneId,
        depth,
        fights_total: fights,
        fights_completed: 0,
        encounters,
        zone_loot_remaining: zoneLootPool,
        pending_loot: [],
        cover_active: false,
      };
      GameState.currentSortie = sortie;
      GameState.player.backpack = this.takeConsumables();
      this.scene.start("CombatScene");
    });
  }

  // Move consumables from baseStash into the backpack at sortie start.
  private takeConsumables(): InventoryStack[] {
    const stash = GameState.baseStash;
    const keptStash: InventoryStack[] = [];
    let backpack: InventoryStack[] = [];
    for (const stack of stash) {
      if (CONSUMABLE_PASSTHROUGH_KEEP(stack.item_id) && stack.count > 0) {
        backpack = addToStack(backpack, stack.item_id, stack.count);
      } else {
        keptStash.push({ ...stack });
      }
    }
    GameState.baseStash = keptStash;
    return backpack;
  }
}
