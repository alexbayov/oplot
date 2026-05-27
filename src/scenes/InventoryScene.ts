import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { computeWeight } from "../systems/weight";
import { createButton, createPanel, createTitle, createSmallButton, createHpBar } from "./sceneUi";
import { showBanner } from "../systems/banner";
import { CX, H, LAYOUT } from "../ui/layout";

export class InventoryScene extends Phaser.Scene {
  public constructor() {
    super("InventoryScene");
  }

  public create(): void {
    const player = GameState.player;
    const items = GameState.data.items;
    const stash = GameState.baseStash;
    const stashWeight = computeWeight(stash, items);
    const inv = LAYOUT.inventory;

    createTitle(this, "Инвентарь");
    void showBanner();

    // Weight bar в верхней панели
    const barX = inv.gridX;
    const barY = 84;
    const barW = inv.cellsPerRow * (inv.cellSize - 2) + (inv.cellsPerRow - 1) * 6;
    createHpBar(this, barX, barY, stashWeight, player.max_weight_kg, barW, 14, 0x4682B4, 0x1A2F3E);
    this.add.text(barX + barW + 16, barY - 8, `ВЕС: ${stashWeight.toFixed(1)}/${player.max_weight_kg} кг`, {
      color: "#C8C0B0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "13px",
      fontStyle: "bold"
    });

    // Tooltip setup
    const tooltipBg = this.add.rectangle(0, 0, 200, 50, 0x2d2d2a, 0.95).setStrokeStyle(1, 0xc5a267);
    const tooltipText = this.add.text(0, 0, "", {
      color: "#D4C5A0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
      align: "center",
      wordWrap: { width: 180 }
    }).setOrigin(0.5);
    const tooltip = this.add.container(CX, 240, [tooltipBg, tooltipText]).setAlpha(0).setDepth(100);

    // Stash inventory grid (8 columns по LAYOUT)
    const gridStartX = inv.gridX + inv.cellSize / 2;
    const gridStartY = inv.gridY + inv.cellSize / 2;
    const gap = 8;
    const stride = inv.cellSize + gap;

    if (stash.length === 0) {
      this.add.text(inv.gridX + 200, gridStartY + 80, "Склад пуст", {
        color: "#8A8070",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "16px",
      });
    } else {
      stash.forEach((s, idx) => {
        const item = items[s.item_id];
        if (!item) return;

        const col = idx % inv.cellsPerRow;
        const row = Math.floor(idx / inv.cellsPerRow);
        const x = gridStartX + col * stride;
        const y = gridStartY + row * stride;

        const slotBg = this.add.rectangle(x, y, inv.cellSize - 4, inv.cellSize - 4, 0x2d2d2a, 0.95)
          .setStrokeStyle(2, 0x4a4a3a);

        const texKey = `item_${s.item_id}`;
        if (this.textures.exists(texKey)) {
          this.add.image(x, y - 6, texKey).setScale(0.85);
        }

        this.add.text(x, y + 22, `x${s.count}`, {
          color: "#C8C0B0",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "12px",
        }).setOrigin(0.5);

        slotBg.setInteractive({ useHandCursor: true });
        slotBg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
          slotBg.setStrokeStyle(2, 0xc5a267);
          tooltipText.setText(`${item.name_ru}\nВес: ${(item.weight_kg * s.count).toFixed(1)} кг`);
          tooltip.setPosition(x, y - inv.cellSize / 2 - 32);
          tooltip.setAlpha(1);
        });
        slotBg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
          slotBg.setStrokeStyle(2, 0x4a4a3a);
          tooltip.setAlpha(0);
        });
      });
    }

    // ── Details panel справа: equip controls ────────────────────
    const dp = {
      x: inv.detailsPanelX,
      y: inv.detailsPanelY,
      w: inv.detailsPanelW,
      h: inv.detailsPanelH,
    };
    createPanel(this, dp.x + dp.w / 2, dp.y + dp.h / 2, dp.w, dp.h);

    const weaponsInStash = stash.filter(
      (s) => items[s.item_id]?.type === "weapon_melee" || items[s.item_id]?.type === "weapon_ranged",
    );
    const armorInStash = stash.filter((s) => items[s.item_id]?.type === "armor");

    const panelCenterX = dp.x + dp.w / 2;

    // Header
    this.add.text(panelCenterX, dp.y + 20, "ЭКИПИРОВКА", {
      color: "#D4C5A0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Weapon card
    const weaponItem = items[player.equipped_weapon_id];
    this.add.text(panelCenterX, dp.y + 60, `Оружие`, {
      color: "#8A8070",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
    }).setOrigin(0.5);
    this.add.text(panelCenterX, dp.y + 78, `${weaponItem?.name_ru ?? "—"}`, {
      color: "#C8C0B0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
    }).setOrigin(0.5);
    if (player.equipped_weapon_id && this.textures.exists(`item_${player.equipped_weapon_id}`)) {
      this.add.image(panelCenterX, dp.y + 130, `item_${player.equipped_weapon_id}`).setScale(1.0);
    }
    createSmallButton(this, panelCenterX, dp.y + 190, weaponsInStash.length > 0 ? "Сменить оружие" : "Нет другого", 200, () => {
      if (weaponsInStash.length === 0) return;
      const idx = weaponsInStash.findIndex((s) => s.item_id === player.equipped_weapon_id);
      const next = weaponsInStash[(idx + 1) % weaponsInStash.length];
      if (next) player.equipped_weapon_id = next.item_id;
      this.scene.restart();
    });

    // Armor card
    this.add.text(panelCenterX, dp.y + 240, `Броня`, {
      color: "#8A8070",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
    }).setOrigin(0.5);
    const armorItem = items[player.equipped_armor_id];
    this.add.text(panelCenterX, dp.y + 258, `${armorItem?.name_ru ?? "—"}`, {
      color: "#C8C0B0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
    }).setOrigin(0.5);
    if (player.equipped_armor_id && this.textures.exists(`item_${player.equipped_armor_id}`)) {
      this.add.image(panelCenterX, dp.y + 310, `item_${player.equipped_armor_id}`).setScale(1.0);
    }
    createSmallButton(this, panelCenterX, dp.y + 370, armorInStash.length > 0 ? "Сменить броню" : "Нет другой", 200, () => {
      if (armorInStash.length === 0) return;
      const idx = armorInStash.findIndex((s) => s.item_id === player.equipped_armor_id);
      const next = armorInStash[(idx + 1) % armorInStash.length];
      if (next) player.equipped_armor_id = next.item_id;
      this.scene.restart();
    });

    createButton(this, H - 50, "Назад", () => this.scene.start("BaseScene"));
  }
}
