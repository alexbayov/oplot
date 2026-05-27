import Phaser from "phaser";
import { GameState, addToStack } from "../state/GameState";
import type { InventoryStack } from "../state/types";
import { canAddItem, computeWeight } from "../systems/weight";
import {
  createButton,
  createPanel,
  createHpBar,
  showFloatingText,
} from "./sceneUi";
import { createSceneHeader } from "../ui/components/SceneHeader";
import { createItemSlot } from "../ui/components/ItemCard";

export class LootScene extends Phaser.Scene {
  private weightText?: Phaser.GameObjects.Text;
  private returnButton?: Phaser.GameObjects.Container;
  private nextFightButton?: Phaser.GameObjects.Container;
  private takeAllBtn?: Phaser.GameObjects.Container;

  public constructor() {
    super("LootScene");
  }

  public create(): void {
    createSceneHeader(this, { title: "Сбор добычи" });
    
    // Weight panel with bar
    createPanel(this, 180, 135, 320, 50);
    this.weightText = this.add.text(180, 120, "", {
      color: "#C8C0B0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Pending loot panel
    createPanel(this, 180, 310, 320, 200);

    this.refreshLootButtons();
    this.refreshControls();
  }

  private refreshLootButtons(): void {
    const sortie = GameState.currentSortie;
    if (!sortie) return;

    // Destroy old grid items
    for (const c of this.children.list.filter((c) => c.getData("lootGridItem") === true)) {
      c.destroy();
    }

    if (sortie.pending_loot.length === 0) {
      this.add.text(180, 310, "Лут пуст.", {
        color: "#8A8070",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
      }).setOrigin(0.5).setData("lootGridItem", true);
    } else {
      sortie.pending_loot.forEach((s, idx) => {
        const item = GameState.data.items[s.item_id];
        if (!item) return;

        const col = idx % 5;
        const row = Math.floor(idx / 5);
        const x = 50 + col * 65;
        const y = 250 + row * 65;

        const slot = createItemSlot(this, x, y, {
          item,
          count: s.count,
          tier: item.tier ?? 2,
        }, () => {
          const player = GameState.player;
          const backpackWeight = computeWeight(player.backpack, GameState.data.items);
          if (canAddItem(backpackWeight, s.item_id, 1, player.max_weight_kg, GameState.data.items)) {
            player.backpack = addToStack(player.backpack, s.item_id, 1);
            s.count -= 1;
            if (s.count <= 0) {
              sortie.pending_loot.splice(idx, 1);
            }
            this.refreshLootButtons();
            this.refreshControls();
          } else {
            showFloatingText(this, x, y, "Перегруз!", "#FF3333");
          }
        });
        slot.setData("lootGridItem", true);
      });
    }

    this.updateWeight();
  }

  private updateWeight(): void {
    const player = GameState.player;
    const weight = computeWeight(player.backpack, GameState.data.items);
    
    // Clear old HP bar
    for (const c of this.children.list.filter((c) => c.getData("weightBar") === true)) {
      c.destroy();
    }

    const [bg, bar] = createHpBar(this, 40, 150, weight, player.max_weight_kg, 150, 10, 0x4682B4, 0x1A2F3E);
    bg.setData("weightBar", true);
    bar.setData("weightBar", true);

    if (this.weightText) {
      this.weightText.setText(`ВЕС: ${weight.toFixed(1)}/${player.max_weight_kg} кг`);
    }
  }

  private refreshControls(): void {
    this.returnButton?.destroy();
    this.nextFightButton?.destroy();
    this.takeAllBtn?.destroy();

    const sortie = GameState.currentSortie;
    if (!sortie) return;
    const player = GameState.player;
    const items = GameState.data.items;
    const weight = computeWeight(player.backpack, items);

    this.takeAllBtn = createButton(this, 450, "Взять всё", () => this.takeAll(), true);

    const hasMoreFights = sortie.fights_completed < sortie.fights_total;
    if (hasMoreFights) {
      this.nextFightButton = createButton(this, 502, "Следующий бой", () => {
        this.scene.start("CombatScene");
      });
    }
    
    const isOverweight = weight > player.max_weight_kg;
    const label = isOverweight ? "Перегруз — нельзя выйти" : "Возврат на базу";
    const nextY = hasMoreFights ? 554 : 502;
    
    this.returnButton = createButton(this, nextY, label, () => {
      if (isOverweight) return;
      this.endSortie();
    });
  }

  private takeAll(): void {
    const sortie = GameState.currentSortie;
    if (!sortie) return;
    const player = GameState.player;
    const items = GameState.data.items;
    let weight = computeWeight(player.backpack, items);
    const remaining: InventoryStack[] = [];
    
    for (const stack of sortie.pending_loot) {
      let leftToTake = stack.count;
      while (leftToTake > 0 && canAddItem(weight, stack.item_id, 1, player.max_weight_kg, items)) {
        player.backpack = addToStack(player.backpack, stack.item_id, 1);
        const itemWeight = items[stack.item_id]?.weight_kg ?? 0;
        weight += itemWeight;
        leftToTake -= 1;
      }
      if (leftToTake > 0) {
        remaining.push({ item_id: stack.item_id, count: leftToTake });
      }
    }
    
    sortie.pending_loot = remaining;
    this.refreshLootButtons();
    this.refreshControls();
  }

  private endSortie(): void {
    if (!GameState.currentSortie) return;
    this.scene.start("ReturnScene");
  }
}
