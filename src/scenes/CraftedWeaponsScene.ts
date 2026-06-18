import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { createButton, createSmallButton, createTitle, createPanel, createHpBar } from "./sceneUi";
import { saveToCloud } from "../systems/cloudSave";
import { isBroken } from "../systems/durability";
import { sortInstancesForDisplay, canEquipInstance, disassembleInstance } from "../systems/craftedWeapons";
import { attemptRepair } from "../systems/repair";
import { H, CX } from "../ui/layout";
import type { WeaponInstance } from "../systems/weaponAssembly";

/**
 * M14 PR-2 — «Арсенал»: менеджер собранного оружия (`crafted_weapons[]`).
 *
 * Закрывает дыру InventoryScene (weapon-слот циклит только catalog-стволы;
 * crafted-инстансы копились без UI). Даёт: список инстансов, equip-swap между
 * ними, inspect (разбор частей + статы + прочность).
 *
 * M14-PR3 (B): + disassembly «Разобрать» — возврат частей на склад и
 * remove инстанса. Мутирует `crafted_weapons` / `baseStash` /
 * `equipped_weapon` (всё в схеме + cloudSave whitelist, без SAVE bump).
 */
interface InitData {
  selectedId?: string;
  /**
   * D5 — confirm-state двухшагового разбора. КЛЮЧУЕТСЯ id инстанса (не
   * голый boolean): «Точно разобрать?» показывается только если
   * `confirmDisassembleId === selectedId`. Любой ре-рендер, который не
   * протянул это поле (клик по карточке, equip, возврат в Арсенал),
   * сбрасывает confirm — игрок не может «улететь» без второго клика
   * после смены выбора или ухода из detail-панели.
   */
  confirmDisassembleId?: string;
  /** Transient toast-сообщение, переживающее scene.restart (D5 execute). */
  flash?: string;
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
  private confirmDisassembleId: string | null = null;
  private flash: string | null = null;

  public init(data?: InitData): void {
    // selectedId протягивается через scene.restart — иначе init() стирает
    // выбор на каждом ре-рендере (тот же паттерн, что pickedIds в
    // WeaponAssemblyScene, PR-6b-2).
    this.selectedId = data?.selectedId ?? null;
    this.confirmDisassembleId = data?.confirmDisassembleId ?? null;
    this.flash = data?.flash ?? null;
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
    if (selected) {
      const confirming = this.confirmDisassembleId === selected.id;
      // M15-PR1: top-up изношенного (D2) при осмотре. Скрыт во время
      // disassemble-confirm, чтобы не размывать destructive-фокус.
      if (!confirming) this.renderRepairControl(selected);
      // D5: confirm honored ТОЛЬКО если ключ совпал с текущим выбором —
      // belt-and-suspenders к сбросу через init (смена выбора не тянет
      // confirmDisassembleId).
      this.renderDisassembleFooter(selected, confirming);
    }

    createButton(this, H - 50, "Назад", () => this.scene.start("InventoryScene"));

    if (this.flash) this.showToast(this.flash);
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
      // M15-PR1: сломанное больше не тупик (C6). Заменяем мёртвый текст
      // «Нельзя (сломано)» на repair-аффорданс. Решение по affordability /
      // терминальности берём из `attemptRepair` — единый источник gate'а,
      // UI не дублирует логику.
      this.renderCardRepair(inst, left + CARD_W - 100, cy + CARD_H / 2 - 24);
    }
  }

  /**
   * Repair-аффорданс на сломанной карточке (слот бывшего «Экипировать»).
   * Три состояния по `attemptRepair`:
   *  - ok        → интерактивная кнопка «Починить (N)».
   *  - no_resource → серый текст «Починить: N металла» (не хватает).
   *  - beyond_repair → «Не подлежит ремонту» (лом — только разобрать).
   */
  private renderCardRepair(inst: WeaponInstance, x: number, y: number): void {
    const metal = GameState.baseResources.metal ?? 0;
    const result = attemptRepair(inst, metal);

    if (result.kind === "ok") {
      createSmallButton(this, x, y, `Починить (${result.metal_spent})`, 168, () =>
        this.repairInstance(inst.id),
        true,
      );
      return;
    }

    const label =
      result.kind === "no_resource"
        ? `Починить: ${result.required} металла`
        : "Не подлежит ремонту";
    this.add
      .text(x, y, label, {
        color: result.kind === "no_resource" ? "#a08c5a" : "#6b6055",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "12px",
        fontStyle: "italic",
      })
      .setOrigin(0.5);
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

  // ── Disassembly footer (D5/D6) ──────────────────────────────────
  // Кнопка живёт в detail-панели (inspect-then-act), на фиксированной y у
  // дна панели — независимо от длины списка частей. Доступна и для
  // сломанных инстансов (D3): recovery частей — главный кейс B.
  private renderDisassembleFooter(selected: WeaponInstance, confirming: boolean): void {
    const px = DETAIL.x + DETAIL.w / 2;
    const footerY = DETAIL.y + DETAIL.h - 44;

    if (!confirming) {
      createSmallButton(this, px, footerY, "Разобрать", 240, () =>
        this.scene.restart({ selectedId: selected.id, confirmDisassembleId: selected.id }),
      );
      this.add
        .text(px, footerY - 28, "Части вернутся на склад", {
          color: "#8A8070",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "12px",
        })
        .setOrigin(0.5);
      return;
    }

    // Confirm-state: destructive emphasis через красное предупреждение +
    // два шага. Разбор только по «Да, разобрать».
    this.add
      .text(px, footerY - 30, "Точно разобрать? Инстанс исчезнет.", {
        color: "#e8896b",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);
    createSmallButton(this, px - 64, footerY, "Да, разобрать", 120, () =>
      this.disassemble(selected.id), true,
    );
    createSmallButton(this, px + 64, footerY, "Отмена", 120, () =>
      this.scene.restart({ selectedId: selected.id }),
    );
  }

  // ── Repair control (detail-панель: top-up изношенного) ──────────
  // Сломанное чинится с карточки (`renderCardRepair`). Здесь — top-up
  // изношенного-не-сломанного при осмотре (D2: repair при current < max).
  // Кнопка пинится над disassemble-footer. Изношенное-не-сломанное всегда
  // имеет durability_max ≥ 2 ⇒ ветка beyond_repair недостижима.
  private renderRepairControl(selected: WeaponInstance): void {
    if (isBroken(selected) || selected.durability_current >= selected.durability_max) {
      return; // сломанное → карточка; целое → нечего чинить
    }
    const metal = GameState.baseResources.metal ?? 0;
    const result = attemptRepair(selected, metal);
    const px = DETAIL.x + DETAIL.w / 2;
    const ry = DETAIL.y + DETAIL.h - 116;

    if (result.kind === "ok") {
      createSmallButton(this, px, ry, `Починить (${result.metal_spent} металла)`, 220, () =>
        this.repairInstance(selected.id),
        true,
      );
      return;
    }
    const label =
      result.kind === "no_resource"
        ? `Починить: нужно ${result.required} металла`
        : "Починить недоступно";
    this.add
      .text(px, ry, label, {
        color: "#a08c5a",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
        fontStyle: "italic",
      })
      .setOrigin(0.5);
  }

  // ── Repair (execute) ────────────────────────────────────────────
  private repairInstance(id: string): void {
    const instances = GameState.player.crafted_weapons;
    const idx = instances.findIndex((w) => w.id === id);
    const before = instances[idx];
    const result = attemptRepair(before, GameState.baseResources.metal ?? 0);

    if (result.kind !== "ok") {
      // Gate провалился между рендером и кликом (race / двойной клик):
      // не мутируем, показываем причину. metal_spent инвариант сохранён —
      // металл не тронут ни на одной не-ok ветке.
      const msg =
        result.kind === "no_resource"
          ? `Не хватает металла: нужно ${result.required}, есть ${result.available}`
          : result.kind === "beyond_repair"
            ? "Не подлежит ремонту — только разобрать"
            : result.kind === "already_full"
              ? "Оружие уже целое"
              : "Инстанс не найден";
      this.scene.restart({ selectedId: id, flash: msg });
      return;
    }

    // G1: применяем РОВНО нужные поля state (инстанс + металл), ничего больше.
    const next = instances.slice();
    next[idx] = result.instance;
    GameState.player.crafted_weapons = next;
    GameState.baseResources.metal = (GameState.baseResources.metal ?? 0) - result.metal_spent;
    // G4: персист как в equip/disassemble-флоу.
    void saveToCloud();

    const after = result.instance;
    const decay = (before?.durability_max ?? after.durability_max) - after.durability_max;
    let msg = `Починено: ${after.durability_current}/${after.durability_max} · −${result.metal_spent} металла`;
    if (decay > 0) msg += ` · потолок −${decay} (усталость)`;
    this.scene.restart({ selectedId: id, flash: msg });
  }

  // ── Disassemble (execute) ───────────────────────────────────────
  private disassemble(id: string): void {
    const result = disassembleInstance(
      id,
      GameState.player.crafted_weapons,
      GameState.baseStash,
      GameState.player.equipped_weapon,
    );
    // G1: применяем РОВНО три поля state, ничего больше.
    GameState.player.crafted_weapons = result.crafted_weapons;
    GameState.baseStash = result.baseStash;
    GameState.player.equipped_weapon = result.equipped_weapon;
    // G4: персист как в equip/assemble-флоу.
    void saveToCloud();

    // D4: при авто-снятии — уведомить, что экипирован дефолтный нож.
    const n = result.returned_parts.length;
    let msg = `Разобрано. Частей на склад: ${n}`;
    if (result.was_equipped) msg += " · оружие снято, экипирован нож";

    // Сброс выбора (инстанс исчез) + confirm-state; toast переживает restart.
    this.scene.restart({ flash: msg });
  }

  // ── Toast (fade) ────────────────────────────────────────────────
  private showToast(msg: string): void {
    const toast = this.add
      .text(CX, 92, msg, {
        color: "#9cd17f",
        fontFamily: "Oswald, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        align: "center",
        stroke: "#1a1a1a",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(200);
    this.tweens.add({
      targets: toast,
      y: 72,
      alpha: { from: 1, to: 0 },
      duration: 1600,
      onComplete: () => toast.destroy(),
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
