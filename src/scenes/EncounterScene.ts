import Phaser from "phaser";
import { GameState, addToStack, removeFromStack, countInStacks } from "../state/GameState";
import { computeWeight } from "../systems/weight";
import { canSelectChoice, rollOutcome, type PlayerSnapshot } from "../systems/encounters";
import type { Encounter, EncounterChoice, EncounterOutcome } from "../types/encounter";
import { CX, W, H } from "../ui/layout";
import { track } from "../systems/telemetry";

/**
 * EncounterScene (M10.2) — текстовая встреча между боями.
 *
 * Принимает `{ encounter: Encounter }` через scene data. Показывает текст,
 * варианты выбора, разруливает исход, затем возвращается в SortieScene
 * который решает что дальше: следующий бой / возврат / лут.
 */

interface EncounterSceneData {
  encounter: Encounter;
  /** Куда возвращаться после resolve. */
  return_to: "CombatScene" | "ReturnScene" | "BaseScene";
}

export class EncounterScene extends Phaser.Scene {
  private encounter!: Encounter;
  private returnTo: EncounterSceneData["return_to"] = "CombatScene";

  public constructor() {
    super("EncounterScene");
  }

  public init(data: EncounterSceneData): void {
    this.encounter = data.encounter;
    this.returnTo = data.return_to ?? "CombatScene";
  }

  public create(): void {
    if (!this.encounter) {
      console.warn("[EncounterScene] No encounter, skipping to", this.returnTo);
      this.scene.start(this.returnTo);
      return;
    }

    track("encounter_shown", {
      id: this.encounter.id,
      category: this.encounter.category,
      zone: GameState.currentSortie?.zone_id ?? "unknown",
    });

    // Background — затемнённый
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0806, 1).setDepth(-10);

    // Atmospheric vignette
    const grad = this.add.graphics().setDepth(-9);
    grad.fillStyle(0x1a1208, 0.6);
    grad.fillCircle(W / 2, H / 2, Math.max(W, H));

    // Top label — category
    const categoryLabel = this.categoryLabel(this.encounter.category);
    this.add.text(W / 2, 60, categoryLabel, {
      color: "#7a7060",
      fontFamily: "Roboto Mono, monospace",
      fontSize: "12px",
      backgroundColor: "#1a1208",
      padding: { x: 12, y: 4 },
    }).setOrigin(0.5);

    // Main encounter text — большой блок
    this.add.text(W / 2, 200, this.encounter.text_ru, {
      color: "#D4C5A0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "20px",
      align: "center",
      wordWrap: { width: W - 200 },
      lineSpacing: 6,
    }).setOrigin(0.5, 0);

    // Player snapshot для requirement checks
    const snap = this.buildPlayerSnapshot();

    // Choices
    const choices = this.encounter.choices;
    const btnW = Math.min(520, (W - 80) / Math.min(choices.length, 3));
    const btnH = 72;
    const gap = 20;
    let startY = H / 2 + 40;
    if (choices.length > 3) startY = H / 2 - 20;

    choices.forEach((c, idx) => {
      const selectable = canSelectChoice(c, snap);
      const y = startY + idx * (btnH + gap);
      this.renderChoiceButton(c, CX, y, btnW, btnH, selectable);
    });
  }

  private renderChoiceButton(
    choice: EncounterChoice,
    x: number,
    y: number,
    w: number,
    h: number,
    selectable: boolean,
  ): void {
    const fill = selectable ? 0x2d2820 : 0x1a1612;
    const stroke = selectable ? 0x6a5a30 : 0x3a3026;
    const textColor = selectable ? "#d4c5a0" : "#5a5048";

    const bg = this.add.rectangle(x, y, w, h, fill, 1)
      .setStrokeStyle(2, stroke, 1)
      .setInteractive({ useHandCursor: selectable });

    const txt = this.add.text(x, y, choice.text_ru, {
      color: textColor,
      fontFamily: "Oswald, sans-serif",
      fontSize: "16px",
      align: "center",
      wordWrap: { width: w - 20 },
    }).setOrigin(0.5);

    if (!selectable) {
      // Disabled indicator: subtle lock icon
      this.add.text(x + w / 2 - 24, y, "🔒", {
        fontSize: "16px",
      }).setOrigin(0.5).setAlpha(0.6);
      return;
    }

    bg.on("pointerover", () => {
      this.tweens.add({ targets: bg, scale: 1.02, duration: 100 });
      bg.setStrokeStyle(2, 0xd4a04a, 1);
    });
    bg.on("pointerout", () => {
      this.tweens.add({ targets: bg, scale: 1, duration: 100 });
      bg.setStrokeStyle(2, stroke, 1);
    });
    bg.on("pointerdown", () => {
      track("encounter_choice", { encounter_id: this.encounter.id, choice_id: choice.id });
      const outcome = rollOutcome(choice);
      this.applyOutcome(outcome);
      this.showOutcomeAndAdvance(outcome);
      // Disable all interaction
      bg.disableInteractive();
      txt.setColor("#a89968");
    });
  }

  private applyOutcome(o: EncounterOutcome): void {
    const player = GameState.player;
    const sortie = GameState.currentSortie;

    // HP delta
    if (o.hp_delta) {
      player.hp = Math.max(0, Math.min(player.hp_max, player.hp + o.hp_delta));
    }

    // Time cost — +N ходов до возврата (увеличиваем return_time косвенно
    // через временный счётчик; реализовано через sortie.fights_completed как proxy)
    if (o.time_cost && sortie) {
      // M10.2 simplistic: добавляем синтетический "штраф к времени" в sortie state
      // Используем простой счётчик extra_return_minutes (если есть в sortie).
      // Пока просто увеличим weight slightly — это влияет на returnTime.
      // (Полноценная реализация — отдельный sortie.time_penalty в M10.5.)
    }

    // Loot
    if (o.loot) {
      for (const l of o.loot) {
        player.backpack = addToStack(player.backpack, l.id, l.n);
      }
    }

    // Consume item
    if (o.consume_item) {
      const n = o.consume_n ?? 1;
      if (countInStacks(player.backpack, o.consume_item) >= n) {
        player.backpack = removeFromStack(player.backpack, o.consume_item, n);
      } else {
        // fallback — снять со склада
        if (countInStacks(GameState.baseStash, o.consume_item) >= n) {
          GameState.baseStash = removeFromStack(GameState.baseStash, o.consume_item, n);
        }
      }
    }

    // Trust → radio_trust
    if (o.trust_delta) {
      GameState.progress.radio_trust = Math.max(0, Math.min(100, GameState.progress.radio_trust + o.trust_delta));
    }

    // Lore fragment — пишем в meta-flag (storage в radio_trust as additional integer? пока просто лог)
    if (o.lore_fragment) {
      console.info("[encounter] lore fragment collected:", o.lore_fragment);
      // Storage в save можно расширить позже — пока эфемерно.
    }

    // Next fight effects — stored on sortie state
    if (sortie) {
      if (o.next_fight_initiative_loss) {
        sortie.next_fight_initiative_loss = true;
      }
      if (o.next_mob_hp_bonus_pct) {
        sortie.next_mob_hp_bonus_pct = o.next_mob_hp_bonus_pct;
      }
      if (o.next_fight_enemy_count_delta) {
        sortie.next_fight_enemy_count_delta = o.next_fight_enemy_count_delta;
      }
    }
  }

  private showOutcomeAndAdvance(o: EncounterOutcome): void {
    const summary = this.outcomeToText(o);

    // Toast в центре
    const card = this.add.rectangle(W / 2, H - 100, 600, 80, 0x0a0806, 0.95)
      .setStrokeStyle(2, 0xd4a04a, 1)
      .setDepth(20);
    const txt = this.add.text(W / 2, H - 100, summary, {
      color: "#D4C5A0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "16px",
      align: "center",
      wordWrap: { width: 560 },
    }).setOrigin(0.5).setDepth(21);

    this.tweens.add({
      targets: [card, txt],
      alpha: { from: 0, to: 1 },
      duration: 300,
    });

    this.time.delayedCall(1800, () => this.scene.start(this.returnTo));
  }

  private outcomeToText(o: EncounterOutcome): string {
    const parts: string[] = [];
    if (o.loot && o.loot.length > 0) {
      const lootStr = o.loot.map((l) => `+${l.n} ${this.itemName(l.id)}`).join("  ");
      parts.push(lootStr);
    }
    if (o.hp_delta) {
      parts.push(`${o.hp_delta > 0 ? "+" : ""}${o.hp_delta} HP`);
    }
    if (o.consume_item) {
      parts.push(`−${o.consume_n ?? 1} ${this.itemName(o.consume_item)}`);
    }
    if (o.trust_delta) {
      parts.push(`${o.trust_delta > 0 ? "+" : ""}${o.trust_delta} ДОВЕРИЕ`);
    }
    if (o.next_fight_initiative_loss) {
      parts.push("сл. бой: −инициатива");
    }
    if (o.next_mob_hp_bonus_pct) {
      parts.push(`сл. моб: +${Math.round(o.next_mob_hp_bonus_pct * 100)}% HP`);
    }
    if (o.next_fight_enemy_count_delta) {
      parts.push(`сл. бой: ${o.next_fight_enemy_count_delta > 0 ? "+" : ""}${o.next_fight_enemy_count_delta} врагов`);
    }
    if (o.lore_fragment) {
      parts.push("+ фрагмент истории");
    }
    if (parts.length === 0) return "…";
    return parts.join("  ·  ");
  }

  private itemName(id: string): string {
    const item = GameState.data.items[id];
    return item?.name_ru ?? id;
  }

  private buildPlayerSnapshot(): PlayerSnapshot {
    const player = GameState.player;
    const items = GameState.data.items;
    const bp = new Map<string, number>();
    for (const s of player.backpack) bp.set(s.item_id, (bp.get(s.item_id) ?? 0) + s.count);
    return {
      hp: player.hp,
      hp_max: player.hp_max,
      max_weight_kg: player.max_weight_kg,
      cur_weight: computeWeight(player.backpack, items),
      backpack_items: bp,
      perks: player.perks.map((p) => p.id),
    };
  }

  private categoryLabel(cat: string): string {
    switch (cat) {
      case "resource_trade": return "СОБЫТИЕ · ОБМЕН";
      case "moral_choice": return "СОБЫТИЕ · ВЫБОР";
      case "trap": return "СОБЫТИЕ · ЛОВУШКА";
      case "lore": return "СОБЫТИЕ · ЭХО ПРОШЛОГО";
      case "skill_check": return "СОБЫТИЕ · НАВЫК";
      case "npc": return "СОБЫТИЕ · ВСТРЕЧА";
      default: return "СОБЫТИЕ";
    }
  }
}
