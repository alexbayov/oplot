import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { activeSignals, dismissSignal } from "../systems/radio";
import type { RadioSignal } from "../types";
import {
  createButton,
  createPanel,
  createSubtitle,
  createTitle,
} from "./sceneUi";

// GDD §10.M3 — Radio scene UI-stub. Two views toggled by `mode`:
//   "list"   — vertical list of active signals (filter !dismissed && expires>0).
//   "detail" — body of one signal + two buttons (Откликнуться / Игнорировать).
// Both options just flip `dismissed = true`; no rewards, no ambush, no reputation.
// Real M6 branching/outcomes will replace this scene later — do NOT extend the
// stub with side effects.
type Mode = { kind: "list" } | { kind: "detail"; signalId: string };

export class RadioScene extends Phaser.Scene {
  private mode: Mode = { kind: "list" };

  public constructor() {
    super("RadioScene");
  }

  public create(): void {
    this.renderCurrentView();
  }

  private renderCurrentView(): void {
    if (this.mode.kind === "detail") {
      this.renderDetail(this.mode.signalId);
      return;
    }
    this.renderList();
  }

  // ---------- list view ----------

  private renderList(): void {
    createTitle(this, "Радио");
    const list = activeSignals(GameState.data.radioSignals);
    if (list.length === 0) {
      createPanel(this, 180, 240, 320, 200);
      createSubtitle(this, 240, "Эфир пуст.");
      createButton(this, 460, "Назад в Оплот", () =>
        this.scene.start("BaseScene"),
      );
      return;
    }

    const startY = 150;
    const rowHeight = 96;
    list.forEach((sig, idx) => {
      const yCenter = startY + idx * rowHeight;
      createPanel(this, 180, yCenter, 320, rowHeight - 12);
      createSubtitle(this, yCenter - 22, `${sig.from} — ${sig.subject}`);
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

    const backY = startY + list.length * rowHeight + 8;
    createButton(this, backY, "Назад в Оплот", () => this.scene.start("BaseScene"));
  }

  // ---------- detail view ----------

  private renderDetail(signalId: string): void {
    createTitle(this, "Радио");
    const sig = GameState.data.radioSignals.find(
      (s) => s.id === signalId && !s.dismissed,
    );
    if (!sig) {
      // Edge: signal vanished between list click and detail render (e.g., expired
      // during a sortie tick). Fall back to list.
      this.mode = { kind: "list" };
      this.scene.restart();
      return;
    }

    createPanel(this, 180, 220, 320, 180);
    createSubtitle(this, 156, `${sig.from} — ${sig.subject}`);
    this.add
      .text(180, 220, sig.body_ru, {
        align: "center",
        color: "#C8C0B0",
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    this.renderDetailOptions(sig);
    createButton(this, 540, "Назад к списку", () => this.returnToList());
  }

  private renderDetailOptions(sig: RadioSignal): void {
    const buttonYs = [400, 460];
    // Render the two options as buttons. Both close the signal (M3 stub semantics).
    sig.options.slice(0, 2).forEach((opt, idx) => {
      const y = buttonYs[idx] ?? 400 + idx * 60;
      createButton(this, y, opt.label_ru, () => {
        dismissSignal(GameState.data.radioSignals, sig.id);
        this.returnToList();
      });
    });
  }

  private returnToList(): void {
    this.mode = { kind: "list" };
    this.scene.restart();
  }
}
