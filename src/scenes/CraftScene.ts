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
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
      });

      // Ingredient icons in a row
      recipe.ingredients.forEach((ing, iIdx) => {
        const ix = 80 + iIdx * 42;
        const ingTex = `item_${ing.item_id}`;
        if (this.textures.exists(ingTex)) {
          this.add.image(ix, cardY + 18, ingTex).setScale(0.4);
        }
        const have = GameState.baseStash.find((s) => s.item_id === ing.item_id)?.count ?? 0;
        const ok = have >= ing.count;
        this.add.text(ix, cardY + 28, `x${ing.count}`, {
          color: ok ? "#C8C0B0" : "#FF6644",
          fontFamily: "Share Tech Mono, monospace",
          fontSize: "8px",
        }).setOrigin(0.5);
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
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "11px",
    }).setOrigin(0.5);

    createButton(this, 535, "Назад", () => this.scene.start("BaseScene"));
  }

  private showToast(itemName: string): void {
    const toast = this.add.text(180, 95, `Создано: ${itemName}`, {
      color: "#4CAF50",
      fontFamily: "Oswald, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      align: "center",
      stroke: "#1a1a1a",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);
    
    this.tweens.add({
      targets: toast,
      y: 75,
      alpha: { from: 1, to: 0 },
      duration: 1000,
      onComplete: () => toast.destroy(),
    });

    // Radial flash gold particles
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const dist = 36;
      const px = 180 + Math.cos(angle) * dist;
      const py = 95 + Math.sin(angle) * dist;

      const circle = this.add.circle(180, 95, 3.5, 0xc5a267).setDepth(150);
      this.tweens.add({
        targets: circle,
        x: px,
        y: py,
        alpha: { from: 1, to: 0 },
        scale: { from: 1.5, to: 0.2 },
        duration: 550,
        ease: "Cubic.Out",
        onComplete: () => circle.destroy(),
      });
    }
  }
}
