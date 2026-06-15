// M13 PR-6b-2 — Свободная сборка оружия (Model C).
//
// Поток: игрок выбирает семейство → видит парты этого семейства +
// универсальные `mod_*` → отмечает что взять → жмёт «Собрать» →
// `assembleFromStash` снимает парты, `assembleWeapon` валидирует и
// фризит stats → auto-equip + `saveToCloud()` → toast → BaseScene.
//
// Family-gate тут (UI-only по D2): межсемейную химеру (pm_frame +
// akm_barrel) собрать физически нельзя — выбор партов гейтится текущим
// семейством. `validateAssemblyParts` без 4-го reason — контракт
// заморожен на 3 кода.

import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { createButton, createSmallButton, createTitle } from "./sceneUi";
import { CX, H, W } from "../ui/layout";
import {
  AssemblyError,
  weaponFamily,
} from "../systems/assemblyValidation";
import { assembleFromStash } from "../systems/assemblyFlow";
import { t } from "../systems/locale";
import { saveToCloud } from "../systems/cloudSave";
import type { ComponentItem } from "../types";

interface InitData {
  family?: string;
}

const UNIVERSAL = "universal";

export class WeaponAssemblyScene extends Phaser.Scene {
  public constructor() {
    super("WeaponAssemblyScene");
  }

  private selectedFamily: string | null = null;
  private selectedPartIds = new Set<string>();
  private errorText: Phaser.GameObjects.Text | null = null;

  public init(data?: InitData): void {
    this.selectedFamily = data?.family ?? null;
    this.selectedPartIds = new Set();
    this.errorText = null;
  }

  public create(): void {
    createTitle(this, "Сборка оружия");

    const componentStash = this.collectComponentStash();

    if (this.selectedFamily === null) {
      this.renderFamilyPicker(componentStash);
    } else {
      this.renderPartSelector(componentStash);
    }

    createButton(this, H - 50, "Назад", () => {
      if (this.selectedFamily !== null) {
        this.scene.start("WeaponAssemblyScene");
      } else {
        this.scene.start("CraftScene", { filter: "assemble" });
      }
    });
  }

  /** Все component-парты в стеше, развёрнутые в один список ComponentItem'ов. */
  private collectComponentStash(): ComponentItem[] {
    const items = GameState.data.items;
    const out: ComponentItem[] = [];
    for (const stack of GameState.baseStash) {
      const item = items[stack.item_id];
      if (item?.kind !== "component") continue;
      out.push(item);
    }
    return out;
  }

  private renderFamilyPicker(stash: ComponentItem[]): void {
    const byFamily = new Map<string, ComponentItem[]>();
    for (const c of stash) {
      const fam = weaponFamily(c.id);
      if (fam === UNIVERSAL) continue;
      const list = byFamily.get(fam) ?? [];
      list.push(c);
      byFamily.set(fam, list);
    }

    const families = Array.from(byFamily.keys()).sort();
    this.add
      .text(CX, 90, "Выберите семейство", {
        color: "#D4C5A0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "16px",
      })
      .setOrigin(0.5);

    if (families.length === 0) {
      this.add
        .text(CX, 200, "Нет деталей в инвентаре.\nИщи парты в рейдах.", {
          color: "#8A8070",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "18px",
          align: "center",
        })
        .setOrigin(0.5);
      return;
    }

    const cols = 3;
    const cardW = 280;
    const cardH = 60;
    const gapX = 24;
    const gapY = 16;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const startX = (W - gridW) / 2 + cardW / 2;
    const startY = 140;

    families.forEach((fam, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      const parts = byFamily.get(fam) ?? [];
      createSmallButton(
        this,
        x,
        y,
        `${fam.toUpperCase()} (${parts.length})`,
        cardW,
        () => {
          this.scene.start("WeaponAssemblyScene", { family: fam });
        },
      );
    });
  }

  private renderPartSelector(stash: ComponentItem[]): void {
    const fam = this.selectedFamily;
    if (fam === null) return;
    const familyParts = stash.filter((c) => weaponFamily(c.id) === fam);
    const universalParts = stash.filter(
      (c) => weaponFamily(c.id) === UNIVERSAL,
    );

    this.add
      .text(CX, 90, `Семейство: ${fam.toUpperCase()}`, {
        color: "#E8B547",
        fontFamily: "Oswald, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.renderPartGrid("Детали семейства", 120, familyParts);
    this.renderPartGrid(
      "Универсальные модификаторы",
      350,
      universalParts,
    );

    createSmallButton(this, CX, H - 100, "Собрать", 280, () => {
      this.tryAssemble(familyParts.concat(universalParts));
    }, true);

    this.errorText = this.add
      .text(CX, H - 140, "", {
        color: "#E25C4C",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "15px",
        align: "center",
      })
      .setOrigin(0.5);
  }

  private renderPartGrid(
    label: string,
    yStart: number,
    parts: ComponentItem[],
  ): void {
    this.add
      .text(60, yStart, label, {
        color: "#8A8070",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
      })
      .setOrigin(0, 0.5);

    if (parts.length === 0) {
      this.add
        .text(60, yStart + 30, "—", {
          color: "#5a5045",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "14px",
        })
        .setOrigin(0, 0.5);
      return;
    }

    const cols = 4;
    const cardW = 270;
    const cardH = 44;
    const gapX = 16;
    const gapY = 10;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const startX = (W - gridW) / 2 + cardW / 2;
    const startY = yStart + 38;

    parts.forEach((part, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      const isPicked = this.selectedPartIds.has(part.id);
      const bg = this.add.rectangle(
        x,
        y,
        cardW,
        cardH,
        isPicked ? 0x3a2e1a : 0x1f1c17,
        1,
      );
      bg.setStrokeStyle(2, isPicked ? 0xc5a267 : 0x4a4035);
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerup", () => {
        if (this.selectedPartIds.has(part.id)) {
          this.selectedPartIds.delete(part.id);
        } else {
          this.selectedPartIds.add(part.id);
        }
        this.scene.restart({ family: this.selectedFamily });
      });
      this.add
        .text(x, y, part.name_ru, {
          color: isPicked ? "#E8B547" : "#D4C5A0",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "13px",
          fontStyle: isPicked ? "bold" : "normal",
        })
        .setOrigin(0.5);
    });
  }

  private tryAssemble(visibleParts: ComponentItem[]): void {
    const picked = visibleParts.filter((p) => this.selectedPartIds.has(p.id));
    try {
      const { instance, nextStash } = assembleFromStash(
        picked,
        GameState.baseStash,
        Math.random,
      );
      // Авто-equip + persist (D5).
      GameState.baseStash = nextStash;
      GameState.player.crafted_weapons = [
        ...GameState.player.crafted_weapons,
        instance,
      ];
      GameState.player.equipped_weapon = { kind: "crafted", id: instance.id };
      void saveToCloud();
      this.showToast(`Собрано: ${instance.name_ru}`);
      this.time.delayedCall(900, () => {
        this.scene.start("BaseScene");
      });
    } catch (e) {
      if (e instanceof AssemblyError) {
        this.showError(t(`assembly_invalid_${e.reason}`));
        return;
      }
      // Defensive integrity (missing part в стеше) — не должно достигать
      // UI, т.к. picked фильтруется из стеша. Но если достигло —
      // показываем нейтральное «попробуйте ещё раз», не сырое сообщение.
      this.showError("Не удалось собрать. Проверьте детали в инвентаре.");
    }
  }

  private showError(message: string): void {
    if (this.errorText) this.errorText.setText(message);
  }

  private showToast(text: string): void {
    const toast = this.add
      .text(CX, 60, text, {
        color: "#4CAF50",
        fontFamily: "Oswald, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        stroke: "#1a1a1a",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(200);
    this.tweens.add({
      targets: toast,
      y: 40,
      alpha: { from: 1, to: 0 },
      duration: 900,
      onComplete: () => toast.destroy(),
    });
  }
}

