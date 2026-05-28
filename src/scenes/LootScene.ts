import Phaser from "phaser";
import { GameState, addToStack } from "../state/GameState";
import type { InventoryStack } from "../state/types";
import { canAddItem, computeWeight } from "../systems/weight";
import { pickEncounter } from "../systems/encounters";
import {
  createButton,
  createPanel,
  createTitle,
  createHpBar,
} from "./sceneUi";
import { CX, H } from "../ui/layout";

export class LootScene extends Phaser.Scene {
  private weightText?: Phaser.GameObjects.Text;
  private returnButton?: Phaser.GameObjects.Container;
  private nextFightButton?: Phaser.GameObjects.Container;
  private takeAllBtn?: Phaser.GameObjects.Container;

  public constructor() {
    super("LootScene");
  }

  public create(): void {
    createTitle(this, "Лут");
    
    // Weight panel with bar (полная ширина в верху)
    createPanel(this, CX, 110, 800, 50);
    this.weightText = this.add.text(CX, 96, "", {
      color: "#C8C0B0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Pending loot panel (большая, центрированная)
    createPanel(this, CX, 360, 1100, 360);

    this.refreshLootButtons();
    this.refreshControls();
  }

  private refreshLootButtons(): void {
    const sortie = GameState.currentSortie;
    if (!sortie) return;

    for (const c of this.children.list.filter((c) => c.getData("lootGridItem") === true)) {
      c.destroy();
    }

    if (sortie.pending_loot.length === 0) {
      this.add.text(CX, 360, "Лут пуст.", {
        color: "#8A8070",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "16px",
      }).setOrigin(0.5).setData("lootGridItem", true);
    } else {
      const cellsPerRow = 12;
      const cellSize = 80;
      const gap = 6;
      const gridW = cellsPerRow * cellSize + (cellsPerRow - 1) * gap;
      const startX = CX - gridW / 2 + cellSize / 2;
      const startY = 240;

      sortie.pending_loot.forEach((s, idx) => {
        const item = GameState.data.items[s.item_id];
        if (!item) return;

        const col = idx % cellsPerRow;
        const row = Math.floor(idx / cellsPerRow);
        const x = startX + col * (cellSize + gap);
        const y = startY + row * (cellSize + gap);

        this.add.rectangle(x, y, cellSize - 6, cellSize - 6, 0x2d2d2a, 0.95)
          .setStrokeStyle(2, 0x4a4a3a)
          .setData("lootGridItem", true);

        const texKey = `item_${s.item_id}`;
        if (this.textures.exists(texKey)) {
          this.add.image(x, y - 6, texKey).setScale(1.0).setData("lootGridItem", true);
        }

        this.add.text(x, y + 24, `x${s.count}`, {
          color: "#C8C0B0",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "12px",
        }).setOrigin(0.5).setData("lootGridItem", true);
      });
    }

    this.updateWeight();
  }

  private updateWeight(): void {
    const player = GameState.player;
    const weight = computeWeight(player.backpack, GameState.data.items);
    
    for (const c of this.children.list.filter((c) => c.getData("weightBar") === true)) {
      c.destroy();
    }

    const barW = 600;
    const barX = CX - barW / 2;
    const [bg, bar] = createHpBar(this, barX, 124, weight, player.max_weight_kg, barW, 12, 0x4682B4, 0x1A2F3E);
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

    const hasMoreFights = sortie.fights_completed < sortie.fights_total;
    const isOverweight = weight > player.max_weight_kg;

    // 3 кнопки в ряд внизу
    const btnY = H - 50;
    const btnW = 260;
    const gap = 28;
    const numBtns = hasMoreFights ? 3 : 2;
    const totalW = numBtns * btnW + (numBtns - 1) * gap;
    const startX = CX - totalW / 2 + btnW / 2;

    this.takeAllBtn = createButton(this, btnY, "Взять всё", () => this.takeAll(), true, startX);

    if (hasMoreFights) {
      this.nextFightButton = createButton(this, btnY, "След. бой", () => {
        this.proceedToNextFight();
      }, false, startX + (btnW + gap));
    }

    const label = isOverweight ? "Перегруз" : "На базу";
    const returnX = hasMoreFights ? startX + (btnW + gap) * 2 : startX + (btnW + gap);
    this.returnButton = createButton(this, btnY, label, () => {
      if (isOverweight) return;
      this.endSortie();
    }, false, returnX);
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

  private proceedToNextFight(): void {
    const sortie = GameState.currentSortie;
    if (!sortie) {
      this.scene.start("CombatScene");
      return;
    }
    const allEncounters = GameState.data.encounters ?? [];
    // 50% шанс на encounter между боями
    if (allEncounters.length > 0 && Math.random() < 0.5) {
      const enc = pickEncounter(allEncounters, sortie.zone_id);
      if (enc) {
        this.scene.start("EncounterScene", { encounter: enc, return_to: "CombatScene" });
        return;
      }
    }
    this.scene.start("CombatScene");
  }
}
