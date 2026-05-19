import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { applyCraft, canCraft, formatMissing } from "../systems/craft";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";

export class CraftScene extends Phaser.Scene {
  public constructor() {
    super("CraftScene");
  }

  public create(): void {
    createTitle(this, "Мастерская");
    createPanel(this, 180, 140, 320, 50);
    createSubtitle(this, 132, "Рецепты:");

    const recipes = Object.values(GameState.data.recipes);
    const items = GameState.data.items;
    const lines: string[] = [];
    interface RecipeSlot { y: number; label: string; onClick: () => void; enabled: boolean }
    const slots: RecipeSlot[] = [];
    let y = 180;
    for (const recipe of recipes) {
      const resultItem = items[recipe.result_id];
      const resultName = resultItem ? resultItem.name_ru : recipe.result_id;
      const check = canCraft(recipe, GameState.baseStash);
      const ingredientsStr = recipe.ingredients
        .map((ing) => {
          const it = items[ing.item_id];
          return `${it?.name_ru ?? ing.item_id} x${ing.count}`;
        })
        .join(", ");
      lines.push(
        check.ok
          ? `${resultName} ← ${ingredientsStr}`
          : `${resultName} ← ${ingredientsStr} (не хватает: ${formatMissing(check.missing, items)})`,
      );
      slots.push({
        y: y + 60,
        label: check.ok ? `Создать ${resultName}` : `Нужно: ${formatMissing(check.missing, items)}`,
        enabled: check.ok,
        onClick: () => {
          if (!check.ok) return;
          const result = applyCraft(recipe, GameState.baseStash);
          GameState.baseStash = result.inventory;
          this.scene.restart();
        },
      });
      y += 80;
    }
    createPanel(this, 180, 280, 320, 200);
    this.add
      .text(180, 280, lines.join("\n"), {
        align: "center",
        color: "#C8C0B0",
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    // Place buttons in a fixed-height list at bottom.
    let btnY = 408;
    for (const slot of slots) {
      if (btnY > 580) break;
      createButton(this, btnY, slot.label, slot.onClick);
      btnY += 36;
    }
    createButton(this, 596, "Назад", () => this.scene.start("BaseScene"));
  }
}
