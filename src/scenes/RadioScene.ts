import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { activeSignals, resolveRadioChoice } from "../systems/radio";
import { runTween } from "../systems/tweens";
import type { RadioSignalOptionId } from "../types";
import {
  createButton,
  createPanel,
  createSubtitle,
} from "./sceneUi";
import { createSceneHeader } from "../ui/components/SceneHeader";


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
    createSceneHeader(this, { title: "Радиосвязь", backTo: "BaseScene" });
    const staticOverlay = this.add.rectangle(180, 320, 360, 640, 0xaaaaaa, 0).setAlpha(0).setDepth(-1);
    runTween(this, "tween_radio_static", staticOverlay);

    const trust = GameState.progress.radio_trust;
    this.add
      .text(180, 50, `Доверие: ${trust}`, {
        color: trust >= 0 ? "#8a8a70" : "#FF6644",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
      })
      .setOrigin(0.5);

    const list = activeSignals(GameState.data.radioSignals);
    if (list.length === 0) {
      createPanel(this, 180, 240, 320, 200);
      createSubtitle(this, 240, "Эфир пуст.");
      return;
    }

    const startY = 150;
    const rowHeight = 120;
    list.forEach((sig, idx) => {
      const yCenter = startY + idx * rowHeight;
      createPanel(this, 180, yCenter, 320, rowHeight - 12);
      createSubtitle(this, yCenter - 22, `${sig.from} — ${sig.subject}`);
      this.add
        .text(330, yCenter + 4, sig.zone_id, {
          color: "#8a8a70",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "12px",
        })
        .setOrigin(1, 0);
      createSubtitle(
        this,
        yCenter + 4,
        `Истекает через ${sig.expires_after_sorties} вылазок`,
      );
      createButton(this, yCenter + 30, "Открыть", () => {
        this.mode = { kind: "detail", signalId: sig.id };
        this.scene.restart();
      });
    });
  }

  private renderDetail(signalId: string): void {
    createSceneHeader(this, { title: "Радиосвязь", backTo: () => this.returnToList() });
    const sig = GameState.data.radioSignals.find(
      (s) => s.id === signalId && !s.resolved,
    );
    if (!sig) {
      this.mode = { kind: "list" };
      this.scene.restart();
      return;
    }

    createPanel(this, 180, 220, 320, 180);
    createSubtitle(this, 156, `${sig.from} — ${sig.subject}`);
    this.add.text(330, 170, sig.zone_id, {
      color: "#8a8a70",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
    });
    this.add
      .text(180, 220, sig.body_ru, {
        align: "center",
        color: "#C8C0B0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    createSubtitle(
      this,
      340,
      `Истекает через ${sig.expires_after_sorties} вылазок`,
    );

    const buttonYs = [400, 460];
    sig.options.slice(0, 2).forEach((opt, idx) => {
      const y = buttonYs[idx] ?? 400 + idx * 60;
      createButton(this, y, opt.label_ru, () => {
        this.mode = { kind: "outcome", signalId: sig.id, option: opt.id };
        this.scene.restart();
      });
    });
  }

  private renderOutcome(signalId: string, option: RadioSignalOptionId): void {
    createSceneHeader(this, { title: "Радиосвязь", backTo: () => this.returnToList() });

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

    createPanel(this, 180, 240, 320, 200);

    if (option === "respond" && result.rewardAdded) {
      const item = GameState.data.items[result.rewardAdded.item_id];
      const name = item?.name_ru ?? result.rewardAdded.item_id;
      createSubtitle(this, 200, `Получено: ${name} ×${result.rewardAdded.count}`);
    }

    if (result.ambushMobId) {
      const mob = GameState.data.mobs[result.ambushMobId];
      const name = mob?.name_ru ?? result.ambushMobId;
      createSubtitle(this, 240, `Засада! ${name} атакует!`);
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
      createSubtitle(this, 240, "Сигнал проигнорирован.");
    }

    createSubtitle(
      this,
      300,
      `Доверие: ${result.trustBefore} → ${result.trustAfter}`,
    );
  }

  private returnToList(): void {
    this.mode = { kind: "list" };
    this.scene.restart();
  }
}
