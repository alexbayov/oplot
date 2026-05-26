import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { applyCraft, canCraft, canCraftWithBossDrop } from "../systems/craft";
import { createButton, createPanel, createTitle, createSmallButton } from "./sceneUi";
import { saveToCloud } from "../systems/cloudSave";
import { showBanner } from "../systems/banner";

export class CraftScene extends Phaser.Scene {
  public constructor() {
    super("CraftScene");
  }

  public init(data?: { lastCrafted?: string; page?: number }): void {
    this.lastCrafted = data?.lastCrafted ?? null;
    this.page = data?.page ?? 0;
  }

  private lastCrafted: string | null = null;
  private page = 0;

  public create(): void {
    createTitle(this, "Мастерская");
    void showBanner();

    if (this.lastCrafted) {
      this.showToast(this.lastCrafted);
    }

    const recipes = Object.values(GameState.data.recipes);
    const items = GameState.data.items;

    // Pagination setup
    const itemsPerPage = 5;
    const totalPages = Math.ceil(recipes.length / itemsPerPage);
    const startIdx = this.page * itemsPerPage;
    const pageRecipes = recipes.slice(startIdx, startIdx + itemsPerPage);

    let cardY = 145;
    const cardStep = 65;

    pageRecipes.forEach((recipe) => {
      const resultItem = items[recipe.result_id];
      const resultName = resultItem ? resultItem.name_ru : recipe.result_id;
      
      const check = recipe.tier === 3
        ? canCraftWithBossDrop(recipe, GameState.baseStash)
        : canCraft(recipe, GameState.baseStash);

      createPanel(this, 180, cardY, 320, 58);

      // Icon
      const texKey = `item_${recipe.result_id}`;
      if (this.textures.exists(texKey)) {
        this.add.image(42, cardY, texKey).setScale(0.65);
      }

      // Title Text
      this.add.text(75, cardY - 18, resultName, {
        color: "#D4C5A0",
        fontFamily: "Arial",
        fontSize: "12px",
        fontStyle: "bold",
      });

      // Ingredients list
      const ingText = recipe.ingredients
        .map((ing) => {
          const it = items[ing.item_id];
          return `${it?.name_ru ?? ing.item_id} (x${ing.count})`;
        })
        .join(", ");

      this.add.text(75, cardY + 2, ingText, {
        color: check.ok ? "#C8C0B0" : "#8A8070",
        fontFamily: "Arial",
        fontSize: "9px",
        wordWrap: { width: 140 },
      });

      // Action button
      const onClick = () => {
        if (!check.ok) return;
        const result = applyCraft(recipe, GameState.baseStash);
        GameState.baseStash = result.inventory;
        void saveToCloud();
        
        this.showToast(resultName);
        
        this.time.delayedCall(400, () => {
          this.scene.start("CraftScene", { lastCrafted: resultName, page: this.page });
        });
      };

      const craftBtn = createSmallButton(this, 275, cardY, check.ok ? "Создать" : "Нехватка", 80, onClick, check.ok);
      if (!check.ok) {
        craftBtn.setAlpha(0.5);
      }

      cardY += cardStep;
    });

    // Pagination controls
    const prevBtn = createSmallButton(this, 95, 475, "◀ Пред.", 110, () => {
      if (this.page > 0) {
        this.scene.start("CraftScene", { page: this.page - 1 });
      }
    }, this.page > 0);
    if (this.page === 0) prevBtn.setAlpha(0.4);

    const nextBtn = createSmallButton(this, 265, 475, "След. ▶", 110, () => {
      if (this.page < totalPages - 1) {
        this.scene.start("CraftScene", { page: this.page + 1 });
      }
    }, this.page < totalPages - 1);
    if (this.page >= totalPages - 1) nextBtn.setAlpha(0.4);

    // Page number text
    this.add.text(180, 475, `${this.page + 1}/${totalPages}`, {
      color: "#8A8070",
      fontFamily: "Arial",
      fontSize: "11px",
    }).setOrigin(0.5);

    createButton(this, 535, "Назад", () => this.scene.start("BaseScene"));
  }

  private showToast(itemName: string): void {
    const toast = this.add.text(180, 95, `Создано: ${itemName}`, {
      color: "#4CAF50",
      fontFamily: "Arial",
      fontSize: "13px",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5).setDepth(200);
    
    this.tweens.add({
      targets: toast,
      y: 75,
      alpha: { from: 1, to: 0 },
      duration: 1000,
      onComplete: () => toast.destroy(),
    });
  }
}
