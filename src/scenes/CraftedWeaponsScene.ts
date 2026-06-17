import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { createButton, createSmallButton, createTitle, createPanel, createHpBar } from "./sceneUi";
import { saveToCloud } from "../systems/cloudSave";
import { isBroken } from "../systems/durability";
import { sortInstancesForDisplay, canEquipInstance } from "../systems/craftedWeapons";
import { H, CX } from "../ui/layout";
import type { WeaponInstance } from "../systems/weaponAssembly";

/**
 * M14 PR-2 — «Арсенал»: менеджер собранного оружия (`crafted_weapons[]`).
 *
 * Закрывает дыру InventoryScene (weapon-слот циклит только catalog-стволы;
 * crafted-инстансы копились без UI). Даёт: список инстансов, equip-swap между
 * ними, inspect (разбор частей + статы + прочность).
 *
 * Scope этого PR (A): READ `crafted_weapons` + MUTATE только `equipped_weapon`.
 * Add/remove инстансов (disassembly) — следующим PR (B). Никаких правок
 * save-схемы: `crafted_weapons` уже в схеме и cloudSave whitelist.
 */
interface InitData {
  selectedId?: string;
}

const DETAIL = { x: 920, y: 110, w: 340, h: 540 } as const;
const LIST_CX = 450; // центр колонки карточек (левая зона)
const CARD_W = 760;
const CARD_H = 104;

export class CraftedWeaponsScene extends Phaser.Scene {
  public constructor() {
    super("CraftedWeaponsScene");
  }

  private selectedId: string | null = null;

  public init(data?: InitData): void {
    // selectedId протягивается через scene.restart — иначе init() стирает
    // выбор на каждом ре-рендере (тот же паттерн, что pickedIds в
    // WeaponAssemblyScene, PR-6b-2).
    this.selectedId = data?.selectedId ?? null;
  }

  public create(): void {
    createTitle(this, "Арсенал");

    const instances = GameState.player.crafted_weapons;

    if (instances.length === 0) {
      this.renderEmptyState();
      createButton(this, H - 50, "Назад", () => this.scene.start("InventoryScene"));
      return;
    }

    const equippedCraftedId =
      GameState.player.equipped_weapon?.kind === "crafted"
        ? GameState.player.equipped_weapon.id
        : null;

    // selectedId может указывать на уже-исчезнувший инстанс (теоретически);
    // резолвим строго против текущего списка.
    const ordered = sortInstancesForDisplay(instances, equippedCraftedId);
    const selected = ordered.find((w) => w.id === this.selectedId) ?? null;

    this.renderList(ordered, equippedCraftedId);
    this.renderDetailPanel(selected);

    createButton(this, H - 50, "Назад", () => this.scene.start("InventoryScene"));
  }

  // ── Пустое состояние ────────────────────────────────────────────
  private renderEmptyState(): void {
    this.add
      .text(CX, H / 2 - 40, "Нет собранного оружия", {
        color: "#8A8070",
        fontFamily: "Oswald, sans-serif",
        fontSize: "20px",
      })
      .setOrigin(0.5);
    this.add
      .text(CX, H / 2 - 8, "Соберите оружие на верстаке из найденных частей.", {
        color: "#6b6055",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
      })
      .setOrigin(0.5);
    createSmallButton(this, CX, H / 2 + 40, "К верстаку", 220, () =>
      this.scene.start("WeaponAssemblyScene"),
    );
  }

  // ── Список карточек ─────────────────────────────────────────────
  private renderList(ordered: WeaponInstance[], equippedCraftedId: string | null): void {
    const startY = 110;
    const gapY = 12;
    ordered.forEach((inst, idx) => {
      const y = startY + idx * (CARD_H + gapY) + CARD_H / 2;
      this.renderCard(inst, y, inst.id === equippedCraftedId);
    });
  }

  private renderCard(inst: WeaponInstance, cy: number, isEquipped: boolean): void {
    const left = LIST_CX - CARD_W / 2;
    const broken = isBroken(inst);
    const isSelected = inst.id === this.selectedId;

    const bg = this.add
      .rectangle(LIST_CX, cy, CARD_W, CARD_H, isSelected ? 0x2a2218 : 0x1f1c17, 1)
      .setStrokeStyle(2, isSelected ? 0xc5a267 : 0x4a4035);
    bg.setInteractive({ useHandCursor: true });
    // Клик по карточке = осмотреть (toggle: повторный клик снимает выбор).
    bg.on("pointerup", () => {
      this.scene.restart({ selectedId: isSelected ? undefined : inst.id });
    });

    // Имя
    this.add.text(left + 18, cy - CARD_H / 2 + 14, inst.name_ru, {
      color: "#e6d6a8",
      fontFamily: "Oswald, sans-serif",
      fontSize: "17px",
      fontStyle: "bold",
    });

    // Статы + кол-во частей
    this.add.text(
      left + 18,
      cy - CARD_H / 2 + 42,
      `Урон: ${inst.stats.damage_min}–${inst.stats.damage_max}   ·   Частей: ${inst.parts.length}`,
      {
        color: "#c8c0b0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
      },
    );

    // Прочность: бар + текст
    const barColor = broken ? 0xe25d3a : 0x6fae5e;
    createHpBar(this, left + 18, cy + CARD_H / 2 - 22, inst.durability_current, inst.durability_max, 220, 12, barColor);
    this.add.text(left + 250, cy + CARD_H / 2 - 28, `Прочность: ${inst.durability_current}/${inst.durability_max}`, {
      color: broken ? "#e25d3a" : "#8A8070",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
    });

    // Бейджи (справа сверху)
    const badgeX = left + CARD_W - 18;
    if (isEquipped) {
      this.renderBadge(badgeX, cy - CARD_H / 2 + 20, "ЭКИПИРОВАН", "#9cd17f", 0x2e3a24);
    } else if (broken) {
      this.renderBadge(badgeX, cy - CARD_H / 2 + 20, "СЛОМАНО", "#e8896b", 0x3a241f);
    }

    // Кнопка «Экипировать»: только не-экипированный и не-сломанный.
    if (!isEquipped && canEquipInstance(inst)) {
      createSmallButton(this, left + CARD_W - 100, cy + CARD_H / 2 - 24, "Экипировать", 168, () =>
        this.equipInstance(inst.id),
        true,
      );
    } else if (!isEquipped && broken) {
      // Сломанное — экипировать нельзя (две тихие подмены, см. craftedWeapons.ts).
      this.add
        .text(left + CARD_W - 100, cy + CARD_H / 2 - 24, "Нельзя (сломано)", {
          color: "#6b6055",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "12px",
          fontStyle: "italic",
        })
        .setOrigin(0.5);
    }
  }

  private renderBadge(rightX: number, cy: number, label: string, textColor: string, bgColor: number): void {
    const t = this.add
      .text(0, 0, label, {
        color: textColor,
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5);
    const padX = 8;
    const bw = t.width + padX * 2;
    this.add.rectangle(rightX - bw / 2, cy, bw, 22, bgColor, 1).setStrokeStyle(1, bgColor);
    t.setPosition(rightX - padX, cy);
    t.setDepth(1);
  }

  // ── Detail-панель (inspect) ─────────────────────────────────────
  private renderDetailPanel(selected: WeaponInstance | null): void {
    const px = DETAIL.x + DETAIL.w / 2;
    createPanel(this, px, DETAIL.y + DETAIL.h / 2, DETAIL.w, DETAIL.h);

    this.add
      .text(px, DETAIL.y + 22, "ДЕТАЛИ", {
        color: "#D4C5A0",
        fontFamily: "Oswald, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    if (!selected) {
      this.add
        .text(px, DETAIL.y + DETAIL.h / 2, "Нажми на оружие,\nчтобы увидеть детали", {
          color: "#6b6055",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "14px",
          align: "center",
        })
        .setOrigin(0.5);
      return;
    }

    const leftX = DETAIL.x + 22;
    let y = DETAIL.y + 56;

    this.add.text(leftX, y, selected.name_ru, {
      color: "#e6d6a8",
      fontFamily: "Oswald, sans-serif",
      fontSize: "17px",
      fontStyle: "bold",
      wordWrap: { width: DETAIL.w - 44 },
    });
    y += 40;

    this.add.text(leftX, y, `Урон: ${selected.stats.damage_min}–${selected.stats.damage_max}`, {
      color: "#c8c0b0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "14px",
    });
    y += 26;

    const broken = isBroken(selected);
    this.add.text(leftX, y, `Прочность: ${selected.durability_current}/${selected.durability_max}`, {
      color: broken ? "#e25d3a" : "#c8c0b0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "14px",
    });
    y += 22;
    createHpBar(this, leftX, y, selected.durability_current, selected.durability_max, DETAIL.w - 44, 12, broken ? 0xe25d3a : 0x6fae5e);
    y += 34;

    this.add.text(leftX, y, `Части (${selected.parts.length}):`, {
      color: "#8A8070",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "13px",
      fontStyle: "italic",
    });
    y += 24;

    const items = GameState.data.items;
    selected.parts.forEach((partId) => {
      const name = items[partId]?.name_ru ?? partId;
      this.add.text(leftX + 8, y, `• ${name}`, {
        color: "#c8c0b0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
        wordWrap: { width: DETAIL.w - 60 },
      });
      y += 22;
    });
  }

  // ── Equip ───────────────────────────────────────────────────────
  private equipInstance(id: string): void {
    // G1: мутируем ТОЛЬКО equipped_weapon, всегда discriminated crafted.
    GameState.player.equipped_weapon = { kind: "crafted", id };
    // G4: персистентность как в assemble-флоу.
    void saveToCloud();
    // Сохраняем текущий inspect-выбор при ре-рендере.
    this.scene.restart({ selectedId: this.selectedId ?? undefined });
  }
}
