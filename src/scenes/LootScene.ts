import Phaser from "phaser";
import { GameState, addToStack } from "../state/GameState";
import type { InventoryStack } from "../state/types";
import { runTween } from "../systems/tweens";
import { canAddItem, computeWeight } from "../systems/weight";
import {
  createButton,
  createPanel,
  createSubtitle,
  createTitle,
} from "./sceneUi";

export class LootScene extends Phaser.Scene {
  private weightText?: Phaser.GameObjects.Text;
  private lootListText?: Phaser.GameObjects.Text;
  private returnButton?: Phaser.GameObjects.Container;
  private nextFightButton?: Phaser.GameObjects.Container;

  public constructor() {
    super("LootScene");
  }

  public create(): void {
    createTitle(this, "Лут");
    createPanel(this, 180, 170, 320, 80);
    this.weightText = createSubtitle(this, 160, "");

    createPanel(this, 180, 320, 320, 200);
    this.lootListText = this.add
      .text(180, 320, "", {
        align: "center",
        color: "#C8C0B0",
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    this.refreshLootButtons();
    this.refreshControls();
  }

  private refreshLootButtons(): void {
    const sortie = GameState.currentSortie;
    if (!sortie) return;
    if (this.lootListText) {
      const lines = sortie.pending_loot.map((s) => {
        const item = GameState.data.items[s.item_id];
        if (!item) return `${s.item_id} x${s.count}`;
        return `${item.name_ru} x${s.count} (${(item.weight_kg * s.count).toFixed(1)} кг)`;
      });
      this.lootListText.setText(lines.length === 0 ? "Лут пуст." : lines.join("\n"));
    }
    this.updateWeight();
  }

  private updateWeight(): void {
    const player = GameState.player;
    const weight = computeWeight(player.backpack, GameState.data.items);
    if (this.weightText) {
      this.weightText.setText(
        `Вес ${weight.toFixed(1)}/${player.max_weight_kg} кг`,
      );
    }
  }

  private refreshControls(): void {
    // Destroy old controls
    this.returnButton?.destroy();
    this.nextFightButton?.destroy();
    if (this.takeAllBtn) this.takeAllBtn.destroy();

    const sortie = GameState.currentSortie;
    if (!sortie) return;
    const player = GameState.player;
    const items = GameState.data.items;
    const weight = computeWeight(player.backpack, items);

    this.takeAllBtn = createButton(this, 460, "Взять всё", () => this.takeAll());

    const hasMoreFights = sortie.fights_completed < sortie.fights_total;
    if (hasMoreFights) {
      this.nextFightButton = createButton(this, 508, "Следующий бой", () => {
        this.scene.start("CombatScene");
      });
    }
    const isOverweight = weight > player.max_weight_kg;
    const label = isOverweight ? "Перегруз — нельзя выйти" : "Возврат на базу";
    this.returnButton = createButton(this, 556, label, () => {
      if (isOverweight) return;
      this.endSortie();
    });
  }

  private takeAllBtn?: Phaser.GameObjects.Container;

  private takeAll(): void {
    if (this.lootListText) {
      runTween(this, "tween_loot_bounce", this.lootListText);
    }
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
    // Backpack merge / heal / sortie cleanup happens in ReturnScene onComplete
    // so the return tween duration enforces return_time_s.
    this.scene.start("ReturnScene");
  }

}
