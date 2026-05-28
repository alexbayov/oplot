import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { computeWeight } from "../systems/weight";
import { createButton, createPanel, createTitle, createSmallButton, createHpBar } from "./sceneUi";
import { showBanner } from "../systems/banner";
import { H, W, LAYOUT } from "../ui/layout";
import type { Item } from "../types";

// ─── Тир → цвет рамки ──────────────────────────────────────────────
const TIER_COLOR: Record<number, number> = {
  1: 0x6b6055, // common — серо-коричневый
  2: 0x4a7a9e, // uncommon — стальной синий
  3: 0xc5a267, // rare — золотой
};
const TIER_LABEL: Record<number, string> = {
  1: "Обычный",
  2: "Редкий",
  3: "Превосходный",
};

const TYPE_LABEL_RU: Record<string, string> = {
  resource: "Ресурс",
  consumable: "Расходник",
  weapon_melee: "Оружие ближнего боя",
  weapon_ranged: "Оружие дальнего боя",
  armor: "Броня",
};

const NOISE_LABEL_RU: Record<string, string> = {
  low: "тихий",
  medium: "средний",
  high: "громкий",
};

const formatStats = (item: Item): string[] => {
  const s = (item.stats ?? {}) as Record<string, unknown>;
  const lines: string[] = [];
  if (item.type === "weapon_melee" || item.type === "weapon_ranged") {
    if (typeof s.damage_min === "number" && typeof s.damage_max === "number") {
      lines.push(`Урон: ${s.damage_min}–${s.damage_max}`);
    }
    if (typeof s.attack_speed === "number") {
      lines.push(`Скорость: ${s.attack_speed}`);
    }
    if (typeof s.noise === "string") {
      lines.push(`Шум: ${NOISE_LABEL_RU[s.noise] ?? s.noise}`);
    }
    if (typeof s.ammo_id === "string" && typeof s.ammo_per_shot === "number") {
      const ammoName = GameState.data.items[s.ammo_id]?.name_ru ?? s.ammo_id;
      lines.push(`Патрон: ${ammoName} (${s.ammo_per_shot}/выстрел)`);
    }
  } else if (item.type === "armor") {
    if (typeof s.defense === "number") lines.push(`Защита: ${s.defense}`);
    if (typeof s.vs_melee_bonus === "number" && s.vs_melee_bonus > 0) {
      lines.push(`Бонус против ближ.: +${s.vs_melee_bonus}`);
    }
    if (typeof s.vs_ranged_bonus === "number" && s.vs_ranged_bonus > 0) {
      lines.push(`Бонус против дальн.: +${s.vs_ranged_bonus}`);
    }
  } else if (item.type === "consumable") {
    if (typeof s.effect_type === "string" && typeof s.effect_value === "number") {
      const effectMap: Record<string, string> = {
        heal: `Восстанавливает ${s.effect_value} HP`,
        adrenaline: `+${s.effect_value} к скорости`,
        antidote: `Снимает яд (${s.effect_value})`,
        stun: `Оглушает (${s.effect_value} сек)`,
      };
      lines.push(effectMap[s.effect_type] ?? `${s.effect_type}: ${s.effect_value}`);
    }
    if (typeof s.charges === "number" && s.charges > 1) {
      lines.push(`Зарядов: ${s.charges}`);
    }
  }
  return lines;
};

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

    // Weight bar
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

    // ─── Rich tooltip ─────────────────────────────────────────────
    const TT_W = 280;
    const tt = this.add.container(0, 0).setDepth(2000).setAlpha(0);
    const ttBg = this.add.graphics();
    const ttName = this.add.text(0, 0, "", {
      color: "#e6d6a8",
      fontFamily: "Oswald, sans-serif",
      fontSize: "15px",
      fontStyle: "bold",
      wordWrap: { width: TT_W - 24 },
    });
    const ttMeta = this.add.text(0, 0, "", {
      color: "#8a8070",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "11px",
      fontStyle: "italic",
    });
    const ttDesc = this.add.text(0, 0, "", {
      color: "#c8c0b0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
      wordWrap: { width: TT_W - 24 },
    });
    const ttStats = this.add.text(0, 0, "", {
      color: "#d4c5a0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
      lineSpacing: 2,
    });
    const ttFlavor = this.add.text(0, 0, "", {
      color: "#8a8070",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "11px",
      fontStyle: "italic",
      wordWrap: { width: TT_W - 24 },
    });
    const ttTierDot = this.add.graphics();
    tt.add([ttBg, ttName, ttMeta, ttDesc, ttStats, ttFlavor, ttTierDot]);

    const showTooltip = (anchorX: number, anchorY: number, item: Item, stackCount: number) => {
      const tier = item.tier ?? 1;
      const tierColor = (TIER_COLOR[tier] ?? TIER_COLOR[1]) as number;
      const typeStr = TYPE_LABEL_RU[item.type] ?? item.type;
      const totalWeight = (item.weight_kg * stackCount).toFixed(1);

      ttName.setText(item.name_ru ?? item.id);
      ttMeta.setText(`${typeStr}  ·  ${TIER_LABEL[tier]}  ·  Вес: ${totalWeight} кг`);
      ttDesc.setText(item.description_ru ?? "");
      const stats = formatStats(item);
      ttStats.setText(stats.join("\n"));
      ttFlavor.setText(item.flavor_ru ? `«${item.flavor_ru.replace(/[«»]/g, "")}»` : "");

      // Compute layout
      const pad = 14;
      let y = pad;
      ttTierDot.clear();
      ttTierDot.fillStyle(tierColor, 1).fillCircle(pad + 5, y + 8, 5);
      ttTierDot.lineStyle(1, 0x080604, 1).strokeCircle(pad + 5, y + 8, 5);
      ttName.setPosition(pad + 18, y);
      y += ttName.height + 4;
      ttMeta.setPosition(pad, y);
      y += ttMeta.height + 8;
      ttDesc.setPosition(pad, y);
      if (item.description_ru) y += ttDesc.height + 8;
      ttStats.setPosition(pad, y);
      if (stats.length) y += ttStats.height + 8;
      ttFlavor.setPosition(pad, y);
      if (item.flavor_ru) y += ttFlavor.height;
      const totalH = y + pad;

      // Draw painted bg
      ttBg.clear();
      ttBg.fillStyle(0x14110d, 0.96).fillRoundedRect(0, 0, TT_W, totalH, 6);
      ttBg.lineStyle(3, 0x080604, 1).strokeRoundedRect(0, 0, TT_W, totalH, 6);
      ttBg.lineStyle(1, tierColor, 0.7).strokeRoundedRect(4, 4, TT_W - 8, totalH - 8, 4);
      // top highlight + bottom shadow
      ttBg.lineStyle(1, 0xd4c5a0, 0.18).lineBetween(8, 6, TT_W - 8, 6);
      ttBg.lineStyle(1, 0x000000, 0.4).lineBetween(8, totalH - 6, TT_W - 8, totalH - 6);

      // Position with screen clamping
      let px = anchorX - TT_W / 2;
      let py = anchorY - totalH - 16;
      px = Phaser.Math.Clamp(px, 8, W - TT_W - 8);
      py = Phaser.Math.Clamp(py, 8, H - totalH - 8);
      tt.setPosition(px, py).setAlpha(1);
    };

    const hideTooltip = () => tt.setAlpha(0);

    // Stash inventory grid
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
        const tier = item.tier ?? 1;
        const tierColor = (TIER_COLOR[tier] ?? TIER_COLOR[1]) as number;

        const col = idx % inv.cellsPerRow;
        const row = Math.floor(idx / inv.cellsPerRow);
        const x = gridStartX + col * stride;
        const y = gridStartY + row * stride;

        const slotBg = this.add.rectangle(x, y, inv.cellSize - 4, inv.cellSize - 4, 0x14110d, 0.95)
          .setStrokeStyle(2, tierColor, 0.75);

        const texKey = `item_${s.item_id}`;
        if (this.textures.exists(texKey)) {
          this.add.image(x, y - 6, texKey).setScale(0.85);
        }

        this.add.text(x, y + 22, `x${s.count}`, {
          color: "#C8C0B0",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "12px",
          fontStyle: "bold",
        }).setOrigin(0.5);

        slotBg.setInteractive({ useHandCursor: true });
        slotBg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
          slotBg.setStrokeStyle(3, tierColor, 1);
          showTooltip(x, y, item, s.count);
        });
        slotBg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
          slotBg.setStrokeStyle(2, tierColor, 0.75);
          hideTooltip();
        });
      });
    }

    // ── Equipment details panel ─────────────────────────────────
    const dp = {
      x: inv.detailsPanelX,
      y: inv.detailsPanelY,
      w: inv.detailsPanelW,
      h: inv.detailsPanelH,
    };
    createPanel(this, dp.x + dp.w / 2, dp.y + dp.h / 2, dp.w, dp.h);
    const panelCenterX = dp.x + dp.w / 2;

    this.add.text(panelCenterX, dp.y + 20, "ЭКИПИРОВКА", {
      color: "#D4C5A0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const renderEquipmentSlot = (
      label: string,
      itemId: string | null,
      yBase: number,
      btnLabel: string,
      btnAction: () => void,
    ) => {
      this.add.text(panelCenterX, yBase, label, {
        color: "#8A8070",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "12px",
        fontStyle: "italic",
      }).setOrigin(0.5);

      const item = itemId ? items[itemId] : null;
      const tier = item?.tier ?? 1;
      const tierColor = (TIER_COLOR[tier] ?? TIER_COLOR[1]) as number;

      this.add.text(panelCenterX, yBase + 18, item?.name_ru ?? "—", {
        color: item ? "#e6d6a8" : "#6b6055",
        fontFamily: "Oswald, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
      }).setOrigin(0.5);

      const stats = item ? formatStats(item) : [];
      this.add.text(panelCenterX, yBase + 130, stats.join("  ·  "), {
        color: "#c8c0b0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "11px",
      }).setOrigin(0.5);

      const iconY = yBase + 80;
      if (itemId && this.textures.exists(`item_${itemId}`)) {
        const frame = this.add.rectangle(panelCenterX, iconY, 78, 78, 0x14110d, 0.6)
          .setStrokeStyle(2, tierColor, 0.85);
        const icon = this.add.image(panelCenterX, iconY, `item_${itemId}`).setScale(1.0);
        if (item) {
          frame.setInteractive({ useHandCursor: true });
          frame.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () =>
            showTooltip(panelCenterX, iconY - 32, item, 1),
          );
          frame.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => hideTooltip());
        }
        // ESLint-quiet uses
        void icon;
      }
      createSmallButton(this, panelCenterX, yBase + 162, btnLabel, 200, btnAction);
    };

    const weaponsInStash = stash.filter(
      (s) => items[s.item_id]?.type === "weapon_melee" || items[s.item_id]?.type === "weapon_ranged",
    );
    const armorInStash = stash.filter((s) => items[s.item_id]?.type === "armor");

    renderEquipmentSlot(
      "Оружие",
      player.equipped_weapon_id,
      dp.y + 60,
      weaponsInStash.length > 0 ? "Сменить оружие" : "Нет другого",
      () => {
        if (weaponsInStash.length === 0) return;
        const idx = weaponsInStash.findIndex((s) => s.item_id === player.equipped_weapon_id);
        const next = weaponsInStash[(idx + 1) % weaponsInStash.length];
        if (next) player.equipped_weapon_id = next.item_id;
        this.scene.restart();
      },
    );
    renderEquipmentSlot(
      "Броня",
      player.equipped_armor_id,
      dp.y + 270,
      armorInStash.length > 0 ? "Сменить броню" : "Нет другой",
      () => {
        if (armorInStash.length === 0) return;
        const idx = armorInStash.findIndex((s) => s.item_id === player.equipped_armor_id);
        const next = armorInStash[(idx + 1) % armorInStash.length];
        if (next) player.equipped_armor_id = next.item_id;
        this.scene.restart();
      },
    );

    createButton(this, H - 50, "Назад", () => this.scene.start("BaseScene"));
  }
}
