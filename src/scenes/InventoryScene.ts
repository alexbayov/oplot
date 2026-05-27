import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { computeWeight } from "../systems/weight";
import { createPanel, createSmallButton, createHpBar } from "./sceneUi";
import { showBanner } from "../systems/banner";
import { createSceneHeader } from "../ui/components/SceneHeader";
import { createItemSlot, showItemDetail } from "../ui/components/ItemCard";

export class InventoryScene extends Phaser.Scene {
  public constructor() {
    super("InventoryScene");
  }

  public create(): void {
    const player = GameState.player;
    const items = GameState.data.items;
    const stash = GameState.baseStash;
    const stashWeight = computeWeight(stash, items);

    createSceneHeader(this, { title: "Склад", backTo: "BaseScene" });
    void showBanner();

    // Weight bar
    createHpBar(this, 30, 105, stashWeight, player.max_weight_kg, 200, 12, 0x4682B4, 0x1A2F3E);
    this.add.text(240, 99, `ВЕС: ${stashWeight.toFixed(1)}/${player.max_weight_kg} кг`, {
      color: "#C8C0B0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "11px",
      fontStyle: "bold"
    });

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

        createItemSlot(this, x, y, {
          item,
          count: s.count,
          tier: item.tier ?? 2,
        }, () => {
          showItemDetail(this, x, y, item, s.count);
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

  }
}
