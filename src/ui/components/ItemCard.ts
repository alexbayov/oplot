/**
 * ItemCard / ItemSlot — карточка предмета с иконкой, тиром, названием, весом.
 * Используется в LootScene, InventoryScene, CraftScene.
 */
import type Phaser from "phaser";
import { COLORS, FONTS } from "../tokens";
import type { Item } from "../../types";

const SLOT_SIZE = 56;

export interface ItemCardData {
  item: Item;
  count: number;
  tier?: number;
  selected?: boolean;
  disabled?: boolean;
}

export const createItemSlot = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  data: ItemCardData,
  onClick?: () => void,
): Phaser.GameObjects.Container => {
  const { item, count, tier = 2, selected = false, disabled = false } = data;
  const borderColor = COLORS.tier[tier as keyof typeof COLORS.tier] ?? COLORS.tier[2];

  // Фон слота
  const bg = scene.add
    .rectangle(0, 0, SLOT_SIZE, SLOT_SIZE, COLORS.panelBg, 0.95)
    .setStrokeStyle(selected ? 2.5 : 1.5, selected ? COLORS.accent : borderColor, 1);

  // Иконка предмета
  const iconKey = `item_${item.id}`;
  let icon: Phaser.GameObjects.Image;
  if (scene.textures.exists(iconKey)) {
    icon = scene.add.image(0, -4, iconKey).setScale(0.7);
  } else {
    icon = scene.add.image(0, -4, "item_scrap").setScale(0.7);
  }

  // Количество (правый нижний угол)
  const countText = scene.add
    .text(SLOT_SIZE / 2 - 4, SLOT_SIZE / 2 - 12, `x${count}`, {
      color: COLORS.textMain,
      fontFamily: FONTS.mono,
      fontSize: "11px",
      fontStyle: "bold",
      stroke: "#1a1a1a",
      strokeThickness: 2,
    })
    .setOrigin(1, 0);

  // Рамка редкости — внешняя обводка
  const rarityFrame = scene.add
    .rectangle(0, 0, SLOT_SIZE + 2, SLOT_SIZE + 2, 0x000000, 0)
    .setStrokeStyle(1.5, borderColor, 0.7);

  const container = scene.add.container(x, y, [rarityFrame, bg, icon, countText]);
  container.setSize(SLOT_SIZE, SLOT_SIZE);
  container.setDepth(10);

  if (onClick && !disabled) {
    container.setInteractive({ useHandCursor: true });
    container.on("pointerup", onClick);
    container.on("pointerover", () => bg.setFillStyle(COLORS.buttonHover, 0.9));
    container.on("pointerout", () => bg.setFillStyle(COLORS.panelBg, 0.95));
  }

  if (disabled) {
    container.setAlpha(0.4);
  }

  return container;
};

/**
 * ItemDetailModal — модальное окно с детальной информацией о предмете.
 * Перекрывает экран, закрывается по тапу на фон.
 */
export const showItemDetail = (
  scene: Phaser.Scene,
  _x: number,
  _y: number,
  item: Item,
  count: number,
  onClose?: () => void,
): void => {
  const overlay = scene.add
    .rectangle(scene.scale.width / 2, scene.scale.height / 2, scene.scale.width, scene.scale.height, 0x000000, 0.75)
    .setDepth(100)
    .setInteractive();

  const panelW = 280;
  const panelH = 200;
  const px = scene.scale.width / 2;
  const py = scene.scale.height / 2;

  const panel = scene.add
    .rectangle(px, py, panelW, panelH, COLORS.panelBg, 0.97)
    .setStrokeStyle(2, COLORS.border, 1)
    .setDepth(101);

  // Иконка
  const iconKey = `item_${item.id}`;
  if (scene.textures.exists(iconKey)) {
    scene.add.image(px - 100, py - 40, iconKey).setScale(1.2).setDepth(102);
  }

  // Название
  scene.add
    .text(px - 20, py - 70, item.name_ru, {
      color: COLORS.textMain,
      fontFamily: FONTS.title,
      fontSize: "18px",
    })
    .setDepth(102);

  // Описание
  scene.add
    .text(px - 20, py - 40, item.description_ru ?? "", {
      color: COLORS.textMuted,
      fontFamily: FONTS.body,
      fontSize: "12px",
      wordWrap: { width: 170 },
    })
    .setDepth(102);

  // Вес
  scene.add
    .text(px - 20, py + 20, `Вес: ${item.weight_kg.toFixed(1)} кг`, {
      color: COLORS.textMuted,
      fontFamily: FONTS.mono,
      fontSize: "13px",
    })
    .setDepth(102);

  // Количество
  if (count > 0) {
    scene.add
      .text(px - 20, py + 45, `В наличии: ${count}`, {
        color: COLORS.textMain,
        fontFamily: FONTS.body,
        fontSize: "14px",
      })
      .setDepth(102);
  }

  // Закрытие
  const closeBtn = scene.add
    .text(px + panelW / 2 - 20, py - panelH / 2 + 10, "✕", {
      color: COLORS.textMain,
      fontFamily: FONTS.title,
      fontSize: "18px",
    })
    .setOrigin(0.5)
    .setDepth(102)
    .setInteractive({ useHandCursor: true });

  const closeAll = () => {
    overlay.destroy();
    panel.destroy();
    closeBtn.destroy();
    onClose?.();
  };

  closeBtn.on("pointerup", closeAll);
  overlay.on("pointerup", closeAll);
};
