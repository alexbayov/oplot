import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { applyCraft, canCraft, canCraftWithBossDrop } from "../systems/craft";
import { createButton, createPanel, createTitle, createSmallButton } from "./sceneUi";
import { saveToCloud } from "../systems/cloudSave";
import { showBanner } from "../systems/banner";
import { CX, H } from "../ui/layout";

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

    // Pagination: 2 колонки × 5 строк = 10 на страницу (landscape)
    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(recipes.length / itemsPerPage));
    const startIdx = this.page * itemsPerPage;
    const pageRecipes = recipes.slice(startIdx, startIdx + itemsPerPage);

    const cols = 2;
    const cardW = 560;
    const cardH = 90;
    const gapX = 24;
    const gapY = 12;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const startX = (1280 - gridW) / 2 + cardW / 2;
    const startY = 140;

    pageRecipes.forEach((recipe, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cardX = startX + col * (cardW + gapX);
      const cardY = startY + row * (cardH + gapY);
      const resultItem = items[recipe.result_id];
      const resultName = resultItem ? resultItem.name_ru : recipe.result_id;
      
      const check = recipe.tier === 3
        ? canCraftWithBossDrop(recipe, GameState.baseStash)
        : canCraft(recipe, GameState.baseStash);

      createPanel(this, cardX, cardY, cardW, cardH);

      const leftX = cardX - cardW / 2 + 20;

      // Icon
      const texKey = `item_${recipe.result_id}`;
      if (this.textures.exists(texKey)) {
        this.add.image(leftX + 20, cardY, texKey).setScale(0.9);
      }

      // Title Text
      this.add.text(leftX + 60, cardY - 28, resultName, {
        color: "#D4C5A0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
      });

      // Ingredient icons in a row
      recipe.ingredients.forEach((ing, iIdx) => {
        const ix = leftX + 60 + iIdx * 50;
        const ingTex = `item_${ing.item_id}`;
        if (this.textures.exists(ingTex)) {
          this.add.image(ix, cardY + 14, ingTex).setScale(0.5);
        }
        const have = GameState.baseStash.find((s) => s.item_id === ing.item_id)?.count ?? 0;
        const ok = have >= ing.count;
        this.add.text(ix, cardY + 32, `x${ing.count}`, {
          color: ok ? "#C8C0B0" : "#FF6644",
          fontFamily: "Share Tech Mono, monospace",
          fontSize: "9px",
        }).setOrigin(0.5);
      });

      // Action button (right side of card)
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

      const craftBtn = createSmallButton(this, cardX + cardW / 2 - 65, cardY, check.ok ? "Создать" : "Нехватка", 110, onClick, check.ok);
      if (!check.ok) craftBtn.setAlpha(0.5);
    });

    // Pagination controls (внизу)
    const navY = H - 110;
    const prevBtn = createSmallButton(this, CX - 200, navY, "◀ Пред.", 130, () => {
      if (this.page > 0) this.scene.start("CraftScene", { page: this.page - 1 });
    }, this.page > 0);
    if (this.page === 0) prevBtn.setAlpha(0.4);

    const nextBtn = createSmallButton(this, CX + 200, navY, "След. ▶", 130, () => {
      if (this.page < totalPages - 1) this.scene.start("CraftScene", { page: this.page + 1 });
    }, this.page < totalPages - 1);
    if (this.page >= totalPages - 1) nextBtn.setAlpha(0.4);

    this.add.text(CX, navY, `${this.page + 1}/${totalPages}`, {
      color: "#8A8070",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "13px",
    }).setOrigin(0.5);

    createButton(this, H - 50, "Назад", () => this.scene.start("BaseScene"));
  }

  private showToast(itemName: string): void {
    const toast = this.add.text(CX, 95, `Создано: ${itemName}`, {
      color: "#4CAF50",
      fontFamily: "Oswald, sans-serif",
      fontSize: "16px",
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
      const px = CX + Math.cos(angle) * dist;
      const py = 95 + Math.sin(angle) * dist;

      const circle = this.add.circle(CX, 95, 3.5, 0xc5a267).setDepth(150);
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
