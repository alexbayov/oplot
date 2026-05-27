import Phaser from "phaser";
import { GameState, addToStack } from "../state/GameState";
import { generateSortieEncounters, generateZoneLoot } from "../systems/loot";
import { runTween } from "../systems/tweens";
import type { InventoryStack, SortieState } from "../state/types";
import { createButton, createPanel, createSubtitle } from "./sceneUi";
import { hideBanner } from "../systems/banner";
import { createSceneHeader } from "../ui/components/SceneHeader";

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
    createSceneHeader(this, { title: "Вылазка", backTo: "MapScene" });
    if (!zone) {
      createSubtitle(this, 180, "Зона не найдена.");
      return;
    }

    const sortie = GameState.currentSortie;
    if (sortie && sortie.zone_id === zone.id && sortie.fights_completed < sortie.fights_total) {
      const remaining = sortie.fights_total - sortie.fights_completed;
      createPanel(this, 180, 240, 320, 200);
      createSubtitle(
        this,
        180,
        `Зона: ${zone.name_ru}\nГлубина ${sortie.depth}: бои ${sortie.fights_total}\nБоёв осталось: ${remaining}`,
      );
      createButton(this, 380, "Следующий бой", () => this.scene.start("CombatScene"));
      createButton(this, 436, "Назад в Оплот", () => {
        GameState.currentSortie = null;
        this.scene.start("BaseScene");
      });
      return;
    }

    createPanel(this, 180, 240, 320, 200);
    createSubtitle(
      this,
      176,
      `Зона: ${zone.name_ru}\nВыбери глубину`,
    );

    const playerLevel = GameState.player.level;
    const buttonYs = [340, 396, 452];
    const depths: (1 | 2 | 3)[] = [1, 2, 3];
    depths.forEach((depth, idx) => {
      const level = zone.levels.find((l) => l.depth === depth);
      const yPos = buttonYs[idx] ?? 340 + idx * 56;
      if (!level) {
        createButton(this, yPos, `Depth ${depth} нет`, () => undefined);
        return;
      }
      const fights = FIGHTS_PER_DEPTH[depth];
      const locked = playerLevel < level.min_player_level;
      const label = locked
        ? `Depth ${depth} закрыт (need lvl ${level.min_player_level})`
        : `Старт depth ${depth} (${fights} боёв)`;
      createButton(this, yPos, label, () => {
        if (locked) return;
        this.startSortie(zone.id, depth, fights);
      });
    });
  }

  private startSortie(zoneId: string, depth: 1 | 2 | 3, fights: number): void {
    const zone = GameState.data.zones[zoneId];
    if (!zone) return;
    const overlay = this.add.rectangle(180, 320, 360, 640, 0x000000).setAlpha(1).setDepth(100);
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
