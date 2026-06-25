import Phaser from "phaser";
import { GameState, addToStack, countInStacks, removeFromStack } from "../state/GameState";
import { applyPerEncounterDurabilityHit } from "../systems/durability";
import {
  buildEncounterLootPool,
  computeMobThreat,
  resolveEncounter,
  setNarrative,
} from "../systems/sortieResolve";
import type {
  EncounterInput,
  EncounterResult,
  HeroSnapshot,
  SortieGoal,
} from "../types/sortie";
import { W, H } from "../ui/layout";
import { track } from "../systems/telemetry";
import { resolveEquippedCombat } from "../systems/weaponDamage";
import { resolveEquippedArmor } from "../systems/armorAffixes";
import {
  applyNarrativeChoice,
  canSelectNarrativeChoice,
  pickNarrativeEvent,
  resolveNarrativeChoice,
} from "../systems/narrativeEvents";
import { survivesKnockout } from "../systems/sortieStakes";
import type { NarrativeEvent } from "../state/types";

/**
 * SortieRunScene (M13 PR-1) — основная сцена вылазки.
 *
 * Цикл: для каждого энкаунтера → resolveEncounter → показать нарратив
 * и сводку → между энкаунтерами выбор «идти дальше / вернуться сейчас».
 * Бой больше не интерактивный (M14+), формула в systems/sortieResolve.ts.
 *
 * Лут копится в `sortie.pending_loot`, ресурсы базы — в `GameState.baseResources`
 * (применяется как часть лута, отображается отдельно).
 */
export class SortieRunScene extends Phaser.Scene {
  public constructor() {
    super("SortieRunScene");
  }

  public create(): void {
    const sortie = GameState.currentSortie;
    if (!sortie) {
      this.scene.start("BaseScene");
      return;
    }

    // Прокинуть narrative-каталог в systems/sortieResolve (на случай первого вызова).
    if (GameState.data.narrative) {
      setNarrative(GameState.data.narrative);
    }

    // Если все энкаунтеры пройдены — финал.
    if (sortie.fights_completed >= sortie.fights_total) {
      this.finishSortie("success");
      return;
    }

    // Если герой выбит — финал.
    if (GameState.player.hp <= 0) {
      this.finishSortie("knocked_out");
      return;
    }

    this.runCurrentEncounter();
  }

  private runCurrentEncounter(): void {
    const sortie = GameState.currentSortie;
    if (!sortie) return;
    const idx = sortie.fights_completed;
    const mob_ids = sortie.encounters[idx] ?? [];
    const zone = GameState.data.zones[sortie.zone_id];
    const level = zone?.levels.find((l) => l.depth === sortie.depth);

    const hero = this.snapshotHero();
    const goal = sortie.goal as SortieGoal;

    const rng: () => number = Math.random;
    const loot = level
      ? buildEncounterLootPool(level.resources, level.resource_count, rng)
      : { pool: [], base_count: 0 };

    const input: EncounterInput = {
      hero,
      zone_id: sortie.zone_id,
      depth: sortie.depth,
      goal,
      mob_ids,
      mob_total_threat: computeMobThreat(mob_ids, GameState.data.mobs),
      loot_pool: loot.pool,
      loot_base_count: loot.base_count,
      loot_profile: zone?.loot_profile,
      consumables: GameState.player.backpack.filter((s) =>
        ["bandage", "medkit"].includes(s.item_id),
      ),
    };

    const result = resolveEncounter(input, rng);
    this.applyResult(result, mob_ids);
    sortie.fights_completed += 1;
    if (sortie.resolved_log) {
      sortie.resolved_log.push(...result.narrative_lines);
    }

    track("encounter_resolved", {
      zone_id: sortie.zone_id,
      depth: sortie.depth,
      goal,
      outcome: result.outcome,
      hp_lost: result.hp_lost,
      loot_count: result.loot_rolled.reduce((sum, s) => sum + s.count, 0),
    });

    this.renderEncounterSummary(result, mob_ids);
  }

  private snapshotHero(): HeroSnapshot {
    const p = GameState.player;
    const items = GameState.data.items;

    // M13 PR-6a: discriminated weapon resolve. Catalog → читаем из
    // items.json. Crafted → читаем замороженные stats из инстанса в
    // crafted_weapons (источник истины — `stats` инстанса, НЕ parts;
    // re-assemble на load запрещён, C4). Сломанный crafted падает
    // в bare-hands fallback 4/7, как было до PR-6a (OP3 default).
    //
    // M15-PR3: switch вынесен в резолвер (systems/weaponDamage), тот же
    // хелпер зовёт арсенальная stat-delta — паритет «дельта == бой»
    // структурно гарантирован (R1). Менять baseline 4/7 / путь резолва — ТАМ.
    // M16-PR1: `resolveEquippedCombat` отдаёт ещё accuracy + combat-вес,
    // которые входят в computeHeroPower (offense множители).
    const {
      damage_min: damageMin,
      damage_max: damageMax,
      accuracy: weaponAccuracy,
      weight: weaponWeight,
    } = resolveEquippedCombat(p.equipped_weapon, items, p.crafted_weapons);

    const armorReduction = resolveEquippedArmor(p.equipped_armor_ids, items).armor_reduction;

    return {
      hp: p.hp,
      hp_max: p.hp_max,
      level: p.level,
      weapon_damage_avg: (damageMin + damageMax) / 2,
      weapon_accuracy: weaponAccuracy,
      weapon_weight: weaponWeight,
      armor_reduction: armorReduction,
      skill_combat: Math.floor(p.level / 2),
      injuries: (p.injuries ?? []).map((i) => ({ kind: i.kind, duration_days: i.days_left })),
    };
  }

  private applyResult(result: EncounterResult, _mob_ids: string[]): void {
    const player = GameState.player;
    const sortie = GameState.currentSortie;
    void _mob_ids;
    if (!sortie) return;

    player.hp = Math.max(0, player.hp - result.hp_lost);
    for (const used of result.consumables_used) {
      if (countInStacks(player.backpack, used.item_id) >= used.count) {
        player.backpack = removeFromStack(player.backpack, used.item_id, used.count);
      }
    }
    let pending = sortie.pending_loot;
    for (const stack of result.loot_rolled) {
      pending = addToStack(pending, stack.item_id, stack.count);
    }
    sortie.pending_loot = pending;
    if (result.injury) {
      player.injuries = [
        ...(player.injuries ?? []),
        { kind: result.injury.kind, days_left: result.injury.duration_days },
      ];
    }

    // M13 PR-6b-1: durability-hit + breakage. Только на won, crafted-only
    // (catalog/null → no-op). При breakage инстанс остаётся в
    // crafted_weapons (repair-долг C6), equipped_weapon падает в дефолт
    // craft_knife (тот же что у createDefaultPlayer). Тост показывается
    // в renderEncounterSummary через breakageMsg-флаг.
    if (result.outcome === "won") {
      const hit = applyPerEncounterDurabilityHit(
        player.equipped_weapon,
        player.crafted_weapons,
      );
      player.equipped_weapon = hit.equipped_weapon;
      player.crafted_weapons = hit.crafted_weapons;
      this.breakageMsg = hit.broken ? "Оружие сломалось" : null;
    } else {
      this.breakageMsg = null;
    }
  }

  /**
   * M13 PR-6b-1: одноразовый флаг для рендера тоста о поломке оружия в
   * `renderEncounterSummary`. Set-нут в applyResult, прочитан в
   * renderEncounterSummary, сбрасывается в null между энкаунтерами.
   */
  private breakageMsg: string | null = null;

  private renderEncounterSummary(result: EncounterResult, mob_ids: string[]): void {
    const sortie = GameState.currentSortie;
    if (!sortie) return;

    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0806, 1).setDepth(-10);

    const mobName = mob_ids
      .map((id) => GameState.data.mobs[id]?.name_ru ?? id)
      .join(", ");

    this.add
      .text(W / 2, 70, "ЭНКАУНТЕР", {
        color: "#a89968",
        fontFamily: "Roboto Mono, monospace",
        fontSize: "13px",
        backgroundColor: "#1a1208",
        padding: { x: 12, y: 4 },
      })
      .setOrigin(0.5);

    this.add
      .text(W / 2, 110, mobName || "Тишина", {
        color: "#D4C5A0",
        fontFamily: "Oswald, sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const narrative = result.narrative_lines.join("\n");
    this.add
      .text(W / 2, 200, narrative || "—", {
        color: "#c5b894",
        fontFamily: "Oswald, sans-serif",
        fontSize: "18px",
        align: "center",
        wordWrap: { width: W - 200 },
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0);

    const stats: string[] = [];
    if (result.hp_lost > 0) stats.push(`HP −${result.hp_lost}`);
    const lootSum = result.loot_rolled.reduce((s, e) => s + e.count, 0);
    if (lootSum > 0) {
      const named = result.loot_rolled
        .map((s) => `${this.itemName(s.item_id)} ×${s.count}`)
        .join("  ·  ");
      stats.push(named);
    }
    if (result.consumables_used.length > 0) {
      const named = result.consumables_used
        .map((s) => `${this.itemName(s.item_id)} использовано`)
        .join("  ·  ");
      stats.push(named);
    }
    if (result.injury) {
      const kind =
        result.injury.kind === "arm"
          ? "ушиб руки"
          : result.injury.kind === "leg"
            ? "повреждена нога"
            : "ушиб головы";
      stats.push(`травма: ${kind} (${result.injury.duration_days} дн.)`);
    }
    if (this.breakageMsg) {
      stats.push(this.breakageMsg);
    }

    this.add
      .text(W / 2, H / 2 + 30, stats.join("\n"), {
        color: "#a89968",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "16px",
        align: "center",
      })
      .setOrigin(0.5, 0);

    const player = GameState.player;
    const hpLine = `HP: ${player.hp}/${player.hp_max}`;
    this.add
      .text(40, H - 40, hpLine, {
        color: "#9a4a4a",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "14px",
      })
      .setOrigin(0, 0.5);

    const isLast = sortie.fights_completed >= sortie.fights_total;
    const isOut = result.outcome === "knocked_out" || player.hp <= 0;
    const fled = result.outcome === "fled";

    if (isOut) {
      this.makeButton(W / 2, H - 70, 300, 52, "Возвращаться", true, () => this.finishSortie("knocked_out"));
      return;
    }
    if (fled) {
      this.makeButton(W / 2, H - 70, 300, 52, "Уходим", true, () => this.finishSortie("retreat"));
      return;
    }
    if (isLast) {
      this.makeButton(W / 2, H - 70, 300, 52, "На базу", true, () => this.finishSortie("success"));
      return;
    }

    this.makeButton(W / 2 - 170, H - 70, 300, 52, "Вернуться сейчас", false, () => this.finishSortie("success"));
    this.makeButton(W / 2 + 170, H - 70, 300, 52, "Идти дальше", true, () => {
      this.advanceOrEvent();
    });
  }

  /**
   * M18-PR2: между энкаунтерами катим narrative-событие. Если выпало —
   * показываем модалку выбора; иначе сразу следующий энкаунтер (как было).
   */
  private advanceOrEvent(): void {
    const sortie = GameState.currentSortie;
    if (!sortie) {
      this.scene.restart();
      return;
    }
    const event = pickNarrativeEvent(
      GameState.data.narrativeEvents ?? [],
      sortie.zone_id,
      Math.random,
    );
    if (!event) {
      this.scene.restart();
      return;
    }
    this.renderNarrativeEvent(event);
  }

  private renderNarrativeEvent(event: NarrativeEvent): void {
    // Полноэкранный оверлей поверх сводки энкаунтера. Делаем интерактивным,
    // чтобы он перехватывал клики и кнопки сводки под ним (depth 12) не
    // ловили pointer сквозь оверлей.
    this.add
      .rectangle(W / 2, H / 2, W, H, 0x0a0806, 1)
      .setDepth(20)
      .setInteractive();

    this.add
      .text(W / 2, 70, "СОБЫТИЕ", {
        color: "#a89968",
        fontFamily: "Roboto Mono, monospace",
        fontSize: "13px",
        backgroundColor: "#1a1208",
        padding: { x: 12, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.add
      .text(W / 2, 170, event.text, {
        color: "#D4C5A0",
        fontFamily: "Oswald, sans-serif",
        fontSize: "19px",
        align: "center",
        wordWrap: { width: W - 200 },
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0)
      .setDepth(21);

    const backpack = GameState.player.backpack;
    const baseY = H - 60 - (event.choices.length - 1) * 64;
    event.choices.forEach((choice, i) => {
      const enabled = canSelectNarrativeChoice(choice, (id) =>
        countInStacks(backpack, id),
      );
      this.makeButton(
        W / 2,
        baseY + i * 64,
        420,
        52,
        choice.text,
        i === 0 && enabled,
        () => this.resolveNarrativeAndAdvance(event, choice.id),
        enabled,
        22,
      );
    });
  }

  private resolveNarrativeAndAdvance(event: NarrativeEvent, choiceId: string): void {
    const sortie = GameState.currentSortie;
    const player = GameState.player;
    const result = resolveNarrativeChoice(event, choiceId);

    const applied = applyNarrativeChoice(
      {
        hp: player.hp,
        hp_max: player.hp_max,
        backpack: player.backpack,
        pending_loot: sortie?.pending_loot ?? [],
      },
      result,
    );
    player.hp = applied.hp;
    player.backpack = applied.backpack;
    if (sortie) sortie.pending_loot = applied.pending_loot;

    track("narrative_event_resolved", {
      event_id: event.id,
      choice_id: choiceId,
      hp_delta: result.hp_delta,
      loot_count: result.loot.reduce((s, l) => s + l.count, 0),
      consumed: result.consume?.item_id ?? "",
    });

    // Следующий энкаунтер. create() сам уведёт в финал, если hp<=0.
    this.scene.restart();
  }

  private itemName(id: string): string {
    return GameState.data.items[id]?.name_ru ?? id;
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    accent: boolean,
    onClick: () => void,
    enabled = true,
    depthBase = 12,
  ): void {
    // Disabled (например, narrative-выбор без нужного предмета) — приглушённый
    // фон, без интерактива и hover-твинов.
    const fill = !enabled ? 0x231f18 : accent ? 0xd4a04a : 0x2d2820;
    const stroke = !enabled ? 0x3a3326 : accent ? 0xffd070 : 0x4a3f30;
    const strokeAlpha = enabled ? 1 : 0.5;
    const textColor = !enabled ? "#6b6354" : accent ? "#1a1208" : "#d4c5a0";

    const bg = this.add
      .rectangle(x, y, w, h, fill, 1)
      .setStrokeStyle(2, stroke, strokeAlpha)
      .setDepth(depthBase);
    this.add
      .text(x, y, label, {
        color: textColor,
        fontFamily: "Oswald, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(depthBase + 1);

    if (!enabled) return;
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => this.tweens.add({ targets: bg, scale: 1.03, duration: 100 }));
    bg.on("pointerout", () => this.tweens.add({ targets: bg, scale: 1, duration: 100 }));
    bg.on("pointerdown", onClick);
  }

  private finishSortie(outcome: "success" | "retreat" | "knocked_out"): void {
    const sortie = GameState.currentSortie;
    if (sortie) {
      sortie.final_outcome = outcome;
      if (outcome === "knocked_out") {
        // M19-PR3: нокаут стоит доли и лута, И несомого снаряжения — иначе
        // «взять весь стеш» было бы без риска. Одно правило на оба (системный
        // survivesKnockout через LOOT_LOSS_ON_DEFEAT).
        sortie.pending_loot = survivesKnockout(sortie.pending_loot);
        GameState.player.backpack = survivesKnockout(GameState.player.backpack);
      }
    }
    track("sortie_finished", {
      zone_id: sortie?.zone_id ?? "unknown",
      depth: sortie?.depth ?? 0,
      outcome,
      encounters_done: sortie?.fights_completed ?? 0,
    });
    this.scene.start(outcome === "knocked_out" ? "ReturnScene" : "LootScene");
  }
}
