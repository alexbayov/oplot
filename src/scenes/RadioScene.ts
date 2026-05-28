import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { radioSenderName, zoneName } from "../systems/locale";
import { activeSignals, resolveRadioChoice } from "../systems/radio";
import { runTween } from "../systems/tweens";
import type { RadioSignalOptionId } from "../types";
import {
  createButton,
  createPanel,
  createSubtitle,
  createTitle,
} from "./sceneUi";
import { CX, CY, W, H } from "../ui/layout";

type Mode =
  | { kind: "list" }
  | { kind: "detail"; signalId: string }
  | { kind: "outcome"; signalId: string; option: RadioSignalOptionId };

export class RadioScene extends Phaser.Scene {
  private mode: Mode = { kind: "list" };

  public constructor() {
    super("RadioScene");
  }

  public create(): void {
    this.renderCurrentView();
  }

  private renderCurrentView(): void {
    if (this.mode.kind === "outcome") {
      this.renderOutcome(this.mode.signalId, this.mode.option);
      return;
    }
    if (this.mode.kind === "detail") {
      this.renderDetail(this.mode.signalId);
      return;
    }
    this.renderList();
  }

  private renderList(): void {
    createTitle(this, "Радио");
    const staticOverlay = this.add.rectangle(CX, CY, W, H, 0xaaaaaa, 0).setAlpha(0).setDepth(-1);
    runTween(this, "tween_radio_static", staticOverlay);

    const trust = GameState.progress.radio_trust;
    this.add
      .text(CX, 80, `Доверие: ${trust}`, {
        color: trust >= 0 ? "#8a8a70" : "#FF6644",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
      })
      .setOrigin(0.5);

    const list = activeSignals(GameState.data.radioSignals);
    if (list.length === 0) {
      createPanel(this, CX, CY, 600, 200);
      createSubtitle(this, CY, "Эфир пуст.");
      createButton(this, H - 60, "Назад в Оплот", () =>
        this.scene.start("BaseScene"),
      );
      return;
    }

    // Сигналы — 2 колонки
    const cols = 2;
    const cardW = 560;
    const cardH = 130;
    const gapX = 30;
    const gapY = 18;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const startX = (W - gridW) / 2 + cardW / 2;
    const startY = 150;

    list.forEach((sig, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const xCenter = startX + col * (cardW + gapX);
      const yCenter = startY + row * (cardH + gapY);

      createPanel(this, xCenter, yCenter, cardW, cardH);
      createSubtitle(this, yCenter - 36, `${radioSenderName(sig.from)} — ${sig.subject}`, xCenter);
      this.add
        .text(xCenter + cardW / 2 - 20, yCenter - 50, `в зоне ${zoneName(sig.zone_id)}`, {
          color: "#8a8a70",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "12px",
        })
        .setOrigin(1, 0);
      createSubtitle(
        this,
        yCenter - 8,
        `Истекает через ${sig.expires_after_sorties} вылазок`,
        xCenter,
      );
      createButton(this, yCenter + 28, "Открыть", () => {
        this.mode = { kind: "detail", signalId: sig.id };
        this.scene.restart();
      }, false, xCenter);
    });

    createButton(this, H - 50, "Назад в Оплот", () =>
      this.scene.start("BaseScene"),
    );
  }

  private renderDetail(signalId: string): void {
    createTitle(this, "Радио");
    const sig = GameState.data.radioSignals.find(
      (s) => s.id === signalId && !s.resolved,
    );
    if (!sig) {
      this.mode = { kind: "list" };
      this.scene.restart();
      return;
    }

    createPanel(this, CX, 260, 800, 280);
    createSubtitle(this, 150, `${radioSenderName(sig.from)} — ${sig.subject}`);
    this.add
      .text(CX, 260, sig.body_ru, {
        align: "center",
        color: "#C8C0B0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
        wordWrap: { width: 720 },
      })
      .setOrigin(0.5);

    createSubtitle(this, 380, `Истекает через ${sig.expires_after_sorties} вылазок`);

    // Опции в ряд
    const opts = sig.options.slice(0, 2);
    const btnW = 320;
    const gap = 40;
    const totalW = opts.length * btnW + (opts.length - 1) * gap;
    const startX = CX - totalW / 2 + btnW / 2;
    const btnY = 470;

    opts.forEach((opt, idx) => {
      createButton(this, btnY, opt.label_ru, () => {
        this.mode = { kind: "outcome", signalId: sig.id, option: opt.id };
        this.scene.restart();
      }, idx === 0, startX + idx * (btnW + gap));
    });

    createButton(this, H - 50, "Назад к списку", () => this.returnToList());
  }

  private renderOutcome(signalId: string, option: RadioSignalOptionId): void {
    createTitle(this, "Радио");

    const validItemIds = new Set(Object.keys(GameState.data.items));
    const validMobIds = new Set(Object.keys(GameState.data.mobs));
    const result = resolveRadioChoice(
      GameState.data.radioSignals,
      signalId,
      option,
      GameState.progress.radio_trust,
      GameState.baseStash,
      validItemIds,
      validMobIds,
    );

    GameState.progress.radio_trust = result.trustAfter;

    createPanel(this, CX, 260, 700, 220);

    if (option === "respond" && result.rewardAdded) {
      const item = GameState.data.items[result.rewardAdded.item_id];
      const name = item?.name_ru ?? result.rewardAdded.item_id;
      createSubtitle(this, 200, `Получено: ${name} ×${result.rewardAdded.count}`);
    }

    if (result.ambushMobId) {
      const mob = GameState.data.mobs[result.ambushMobId];
      const name = mob?.name_ru ?? result.ambushMobId;
      createSubtitle(this, 260, `Засада! ${name} атакует!`);
      const signal = GameState.data.radioSignals.find((s) => s.id === signalId);
      this.time.delayedCall(1200, () => {
        GameState.currentSortie = {
          zone_id: signal?.zone_id ?? "forest",
          depth: 1,
          fights_total: 1,
          fights_completed: 0,
          encounters: [[result.ambushMobId as string]],
          zone_loot_remaining: [],
          pending_loot: [],
          cover_active: false,
        };
        this.scene.start("CombatScene");
      });
      return;
    }

    if (option === "ignore") {
      createSubtitle(this, 260, "Сигнал проигнорирован.");
    }

    createSubtitle(this, 320, `Доверие: ${result.trustBefore} → ${result.trustAfter}`);
    createButton(this, H - 60, "Назад", () => this.returnToList());
  }

  private returnToList(): void {
    this.mode = { kind: "list" };
    this.scene.restart();
  }
}
