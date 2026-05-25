import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { runTween } from "../systems/tweens";
import { computeWeight } from "../systems/weight";
import { createButton, createPanel, createSubtitle, createTitle } from "./sceneUi";

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
    createPanel(this, 180, 150, 320, 70);
    createSubtitle(
      this,
      136,
      `Оружие: ${items[player.equipped_weapon_id]?.name_ru ?? "—"}\nБроня: ${items[player.equipped_armor_id]?.name_ru ?? "—"}`,
    );

    createPanel(this, 180, 330, 320, 240);
    const lines = stash.length === 0
      ? ["Склад пуст."]
      : stash.map((s) => {
          const item = items[s.item_id];
          if (!item) return `${s.item_id} x${s.count}`;
          return `${item.name_ru} x${s.count} (${(item.weight_kg * s.count).toFixed(1)} кг)`;
        });
    this.add
      .text(180, 330, lines.join("\n"), {
        align: "center",
        color: "#C8C0B0",
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);
    createSubtitle(this, 460, `Итого склад: ${stashWeight.toFixed(1)} кг`);

    const tooltipBg = this.add.rectangle(0, 0, 120, 24, 0x2a2a2a).setStrokeStyle(1, 0x5f5a50);
    const tooltipText = this.add.text(0, 0, "Предмет", {
      color: "#F5F1E8",
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
    }).setOrigin(0.5);
    const tooltip = this.add.container(180, 240, [tooltipBg, tooltipText]).setAlpha(0);

    const panelHit = this.add.rectangle(180, 330, 320, 240, 0x000000, 0).setInteractive({ useHandCursor: true });
    panelHit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      tooltip.setPosition(180, 290);
      tooltip.setAlpha(0);
      runTween(this, "tween_item_tooltip", tooltip);
    });
    panelHit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      tooltip.setAlpha(0);
    });

    // Equip controls: cycle to next available weapon / armor in stash.
    const weaponsInStash = stash.filter(
      (s) => items[s.item_id]?.type === "weapon_melee" || items[s.item_id]?.type === "weapon_ranged",
    );
    const armorInStash = stash.filter((s) => items[s.item_id]?.type === "armor");

    createButton(this, 504, weaponsInStash.length > 0 ? "Сменить оружие" : "Нет оружия", () => {
      if (weaponsInStash.length === 0) return;
      const idx = weaponsInStash.findIndex(
        (s) => s.item_id === player.equipped_weapon_id,
      );
      const next = weaponsInStash[(idx + 1) % weaponsInStash.length];
      if (next) player.equipped_weapon_id = next.item_id;
      this.scene.restart();
    });
    createButton(this, 548, armorInStash.length > 0 ? "Сменить броню" : "Нет брони", () => {
      if (armorInStash.length === 0) return;
      const idx = armorInStash.findIndex((s) => s.item_id === player.equipped_armor_id);
      const next = armorInStash[(idx + 1) % armorInStash.length];
      if (next) player.equipped_armor_id = next.item_id;
      this.scene.restart();
    });
    createButton(this, 596, "Назад", () => this.scene.start("BaseScene"));
  }
}
