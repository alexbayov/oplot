import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { applyCraft, canCraft, canCraftWithBossDrop, formatMissing } from "../systems/craft";
import { runTween } from "../systems/tweens";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";
import { saveToCloud } from "../systems/cloudSave";
import { showBanner } from "../systems/banner";

interface RecipeSlot {
  label: string;
  enabled: boolean;
  onClick: () => void;
}

export class CraftScene extends Phaser.Scene {
  public constructor() {
    super("CraftScene");
  }

  public init(data?: { lastCrafted?: string }): void {
    this.lastCrafted = data?.lastCrafted ?? null;
  }

  private lastCrafted: string | null = null;
  private lastCraftedText?: Phaser.GameObjects.Text;

  public create(): void {
    createTitle(this, "Мастерская");
    void showBanner();
    if (this.lastCrafted) {
      this.lastCraftedText = createSubtitle(this, 80, `Создано: ${this.lastCrafted}`);
    }

    const recipes = Object.values(GameState.data.recipes);
    const items = GameState.data.items;
    const lines: string[] = [];
    const slots: RecipeSlot[] = [];

    for (const recipe of recipes) {
      const resultItem = items[recipe.result_id];
      const resultName = resultItem ? resultItem.name_ru : recipe.result_id;
      const check = recipe.tier === 3
        ? canCraftWithBossDrop(recipe, GameState.baseStash)
        : canCraft(recipe, GameState.baseStash);
      const ingredientsStr = recipe.ingredients
        .map((ing) => {
          const it = items[ing.item_id];
          return `${it?.name_ru ?? ing.item_id} x${ing.count}`;
        })
        .join(", ");
      lines.push(
        check.ok
          ? `${resultName} ← ${ingredientsStr}  [доступно]`
          : `${resultName} ← ${ingredientsStr}\n  нет: ${formatMissing(check.missing, items)}`,
      );
      slots.push({
        label: check.ok ? `Создать: ${resultName}` : `${resultName} — нет ингредиентов`,
        enabled: check.ok,
        onClick: () => {
          if (!check.ok) return;
          const result = applyCraft(recipe, GameState.baseStash);
          GameState.baseStash = result.inventory;
          void saveToCloud();
          if (this.lastCraftedText) {
            runTween(this, "tween_craft_spin", this.lastCraftedText);
          }
          this.scene.start("CraftScene", { lastCrafted: resultName });
        },
      });
    }

    // Recipe list panel (text top-aligned to avoid overlap with action buttons).
    createPanel(this, 180, 220, 320, 180);
    this.add
      .text(180, 138, lines.join("\n"), {
        align: "center",
        color: "#C8C0B0",
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5, 0);

    // Action buttons stacked below the panel.
    let btnY = 348;
    const step = 44;
    for (const slot of slots) {
      createButton(this, btnY, slot.label, slot.onClick);
      btnY += step;
    }
    createButton(this, btnY + 4, "Назад", () => this.scene.start("BaseScene"));
  }
}
