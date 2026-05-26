import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { computeWeight } from "../systems/weight";
import { createButton, createPanel, createTitle, createSmallButton, createHpBar } from "./sceneUi";
import { showBanner } from "../systems/banner";

export class InventoryScene extends Phaser.Scene {
  public constructor() {
    super("InventoryScene");
  }

  public create(): void {
    const player = GameState.player;
    const items = GameState.data.items;
    const stash = GameState.baseStash;
    const stashWeight = computeWeight(stash, items);

    createTitle(this, "Инвентарь");
    void showBanner();

    // Weight bar
    createHpBar(this, 30, 105, stashWeight, player.max_weight_kg, 200, 12, 0x4682B4, 0x1A2F3E);
    this.add.text(240, 99, `ВЕС: ${stashWeight.toFixed(1)}/${player.max_weight_kg} кг`, {
      color: "#C8C0B0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "11px",
      fontStyle: "bold"
    });

    // Tooltip setup
    const tooltipBg = this.add.rectangle(0, 0, 160, 36, 0x2d2d2a, 0.95).setStrokeStyle(1, 0x4a4a3a);
    const tooltipText = this.add.text(0, 0, "", {
      color: "#D4C5A0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "11px",
      align: "center",
      wordWrap: { width: 150 }
    }).setOrigin(0.5);
    const tooltip = this.add.container(180, 240, [tooltipBg, tooltipText]).setAlpha(0).setDepth(100);

    // Stash inventory grid (5 columns)
    if (stash.length === 0) {
      this.add.text(180, 220, "Склад пуст", {
        color: "#8A8070",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "16px",
      }).setOrigin(0.5);
    } else {
      stash.forEach((s, idx) => {
        const item = items[s.item_id];
        if (!item) return;

        const col = idx % 5;
        const row = Math.floor(idx / 5);
        const x = 50 + col * 65;
        const y = 160 + row * 65;

        const slotBg = this.add.rectangle(x, y, 56, 56, 0x2d2d2a, 0.95).setStrokeStyle(2, 0x4a4a3a);

        const texKey = `item_${s.item_id}`;
        if (this.textures.exists(texKey)) {
          this.add.image(x, y - 4, texKey).setScale(0.75);
        }

        this.add.text(x, y + 18, `x${s.count}`, {
          color: "#C8C0B0",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "11px",
        }).setOrigin(0.5);

        slotBg.setInteractive({ useHandCursor: true });
        slotBg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
          slotBg.setStrokeStyle(2, 0xc5a267);
          tooltipText.setText(`${item.name_ru}\nВес: ${(item.weight_kg * s.count).toFixed(1)} кг`);
          tooltip.setPosition(x, y - 48);
          tooltip.setAlpha(1);
        });
        slotBg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
          slotBg.setStrokeStyle(2, 0x4a4a3a);
          tooltip.setAlpha(0);
        });
      });
    }

    // Equip controls: cycle to next available weapon / armor in stash.
    const weaponsInStash = stash.filter(
      (s) => items[s.item_id]?.type === "weapon_melee" || items[s.item_id]?.type === "weapon_ranged",
    );
    const armorInStash = stash.filter((s) => items[s.item_id]?.type === "armor");

    // Weapon panel card
    createPanel(this, 95, 415, 150, 110);
    const weaponItem = items[player.equipped_weapon_id];
    this.add.text(95, 375, `Оружие: ${weaponItem?.name_ru ?? "—"}`, {
      color: "#C8C0B0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "11px",
      align: "center"
    }).setOrigin(0.5);
    if (player.equipped_weapon_id && this.textures.exists(`item_${player.equipped_weapon_id}`)) {
      this.add.image(95, 410, `item_${player.equipped_weapon_id}`).setScale(0.6);
    }
    createSmallButton(this, 95, 450, weaponsInStash.length > 0 ? "Сменить" : "Пусто", 110, () => {
      if (weaponsInStash.length === 0) return;
      const idx = weaponsInStash.findIndex((s) => s.item_id === player.equipped_weapon_id);
      const next = weaponsInStash[(idx + 1) % weaponsInStash.length];
      if (next) player.equipped_weapon_id = next.item_id;
      this.scene.restart();
    });

    // Armor panel card
    createPanel(this, 265, 415, 150, 110);
    const armorItem = items[player.equipped_armor_id];
    this.add.text(265, 375, `Броня: ${armorItem?.name_ru ?? "—"}`, {
      color: "#C8C0B0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "11px",
      align: "center"
    }).setOrigin(0.5);
    if (player.equipped_armor_id && this.textures.exists(`item_${player.equipped_armor_id}`)) {
      this.add.image(265, 410, `item_${player.equipped_armor_id}`).setScale(0.6);
    }
    createSmallButton(this, 265, 450, armorInStash.length > 0 ? "Сменить" : "Пусто", 110, () => {
      if (armorInStash.length === 0) return;
      const idx = armorInStash.findIndex((s) => s.item_id === player.equipped_armor_id);
      const next = armorInStash[(idx + 1) % armorInStash.length];
      if (next) player.equipped_armor_id = next.item_id;
      this.scene.restart();
    });

    createButton(this, 540, "Назад", () => this.scene.start("BaseScene"));
  }
}
