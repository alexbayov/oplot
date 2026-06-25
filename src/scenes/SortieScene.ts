import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { generateSortieEncounters, generateZoneLoot } from "../systems/loot";
import { runTween } from "../systems/tweens";
import type { InventoryStack, SortieState } from "../state/types";
import { createButton, createPanel, createSmallButton, createSubtitle, createTitle } from "./sceneUi";
import { hideBanner } from "../systems/banner";
import { CX, CY, W, H } from "../ui/layout";
import { track } from "../systems/telemetry";
import { computeWeight } from "../systems/weight";
import {
  allLoadoutPicks,
  buildLoadout,
  defaultLoadoutPicks,
  loadoutOptions,
  summarizeLoadout,
} from "../systems/loadout";
import { HERO_MAX_WEIGHT_KG } from "../state/balance";
import { formatGoalRisk } from "../systems/sortieStakes";
import type { SortieGoal } from "../types/sortie";
import { SORTIE_GOALS } from "../systems/sortieResolve";

interface SortieInit {
  zoneId?: string;
}

const FIGHTS_PER_DEPTH: Record<1 | 2 | 3, number> = { 1: 2, 2: 3, 3: 4 };

export class SortieScene extends Phaser.Scene {
  private zoneId: string | null = null;
  private selectedDepth: 1 | 2 | 3 = 1;
  private selectedGoal: SortieGoal = "quiet";
  /** M19-PR2: выбранный лоадаут (item_id → кол-во). null = ещё не открывали. */
  private selectedPicks: Record<string, number> | null = null;
  /** Объекты оверлея-пикера, чтобы снести их при закрытии/перерисовке. */
  private loadoutObjects: Phaser.GameObjects.GameObject[] = [];

  public constructor() {
    super("SortieScene");
  }

  public init(data: SortieInit): void {
    if (data?.zoneId) {
      this.zoneId = data.zoneId;
    } else if (GameState.currentSortie) {
      this.zoneId = GameState.currentSortie.zone_id;
    } else {
      const first = Object.values(GameState.data.zones)[0];
      this.zoneId = first ? first.id : null;
    }
  }

  public create(): void {
    void hideBanner();
    const zone = this.zoneId ? GameState.data.zones[this.zoneId] : null;
    createTitle(this, "Вылазка");
    if (!zone) {
      createSubtitle(this, CY, "Зона не найдена.");
      createButton(this, H - 80, "Назад", () => this.scene.start("MapScene"));
      return;
    }

    const sortie = GameState.currentSortie;
    if (sortie && sortie.zone_id === zone.id && sortie.fights_completed < sortie.fights_total) {
      const remaining = sortie.fights_total - sortie.fights_completed;
      createPanel(this, CX, CY - 40, 600, 200);
      createSubtitle(
        this,
        CY - 40,
        `Зона: ${zone.name_ru}\nГлубина ${sortie.depth}: всего ${sortie.fights_total}\nОсталось энкаунтеров: ${remaining}`,
      );
      createButton(this, H - 130, "Продолжить", () => this.scene.start("SortieRunScene"), true);
      createButton(this, H - 70, "В Оплот", () => this.returnFromActiveSortie());
      return;
    }

    createPanel(this, CX, 200, 600, 130);
    createSubtitle(this, 180, `Зона: ${zone.name_ru}`);
    createSubtitle(this, 220, "Выбери глубину и цель вылазки");

    if (this.selectedPicks === null) {
      this.selectedPicks = defaultLoadoutPicks(GameState.baseStash);
    }

    this.renderDepthRow(zone);
    this.renderGoalRow();
    this.renderLoadoutSummary();
    this.renderGoSummary(zone);

    createButton(this, H - 60, "Назад", () => this.scene.start("MapScene"));
  }

  private renderDepthRow(zone: { levels: { depth: 1 | 2 | 3; min_player_level: number }[] }): void {
    const playerLevel = GameState.player.level;
    const depths: (1 | 2 | 3)[] = [1, 2, 3];
    const btnW = 200;
    const gap = 16;
    const totalW = depths.length * btnW + (depths.length - 1) * gap;
    const startX = CX - totalW / 2 + btnW / 2;
    const btnY = 320;

    createSubtitle(this, 290, "Глубина");

    depths.forEach((depth, idx) => {
      const level = zone.levels.find((l) => l.depth === depth);
      const xPos = startX + idx * (btnW + gap);
      if (!level) return;
      const fights = FIGHTS_PER_DEPTH[depth];
      const locked = playerLevel < level.min_player_level;
      const label = locked
        ? `${depth} 🔒 lvl ${level.min_player_level}`
        : `Глубина ${depth} (${fights})`;
      createButton(
        this,
        btnY,
        label,
        () => {
          if (locked) return;
          this.selectedDepth = depth;
          this.scene.restart();
        },
        !locked && depth === this.selectedDepth,
        xPos,
      );
    });
  }

  private renderGoalRow(): void {
    createSubtitle(this, 390, "Цель");

    const goals: SortieGoal[] = [
      "quiet",
      "greedy",
      "targeted_fuel",
      "targeted_metal",
      "targeted_food",
      "targeted_water",
    ];
    const btnW = 195;
    const gap = 10;
    const perRow = 3;
    const totalW = perRow * btnW + (perRow - 1) * gap;
    const startX = CX - totalW / 2 + btnW / 2;
    const baseY = 430;

    goals.forEach((g, idx) => {
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      const x = startX + col * (btnW + gap);
      const y = baseY + row * 60;
      const def = SORTIE_GOALS[g];
      createButton(
        this,
        y,
        def.name_ru,
        () => {
          this.selectedGoal = g;
          this.scene.restart();
        },
        g === this.selectedGoal,
        x,
      );
    });
  }

  /** Сводка выбранного лоадаута на главном экране вылазки + кнопка открытия. */
  private renderLoadoutSummary(): void {
    const picks = this.selectedPicks ?? {};
    const items = GameState.data.items;
    const line = summarizeLoadout(GameState.baseStash, picks, items);
    const { weightKg } = buildLoadout(GameState.baseStash, picks, items, HERO_MAX_WEIGHT_KG);
    createSubtitle(this, 520, `Снаряжение: ${line}  ·  ${weightKg.toFixed(1)} кг`);
    createSmallButton(this, CX, 552, "Снаряжение", 220, () => this.openLoadout(), false);
  }

  /** Помечает объект оверлея глубиной и регистрирует на снос. */
  private trackOverlay<T extends Phaser.GameObjects.GameObject>(obj: T, depth: number): T {
    (obj as unknown as { setDepth: (d: number) => void }).setDepth(depth);
    this.loadoutObjects.push(obj);
    return obj;
  }

  private clearLoadout(): void {
    for (const o of this.loadoutObjects) o.destroy();
    this.loadoutObjects = [];
  }

  /** Закрыть пикер и обновить главный экран (сводку лоадаута). */
  private finishLoadout(): void {
    this.clearLoadout();
    this.scene.restart();
  }

  private bumpPick(itemId: string, delta: number, have: number): void {
    const picks: Record<string, number> = { ...(this.selectedPicks ?? {}) };
    // 0 = «не берём»; buildLoadout это и так трактует как take-nothing, поэтому
    // ключ не удаляем (eslint no-dynamic-delete), просто обнуляем.
    picks[itemId] = Math.max(0, Math.min(have, (picks[itemId] ?? 0) + delta));
    this.selectedPicks = picks;
    this.openLoadout();
  }

  /** Оверлей-пикер: степлеры на каждый расходник + вес-бар vs cap. */
  private openLoadout(): void {
    this.clearLoadout();
    const items = GameState.data.items;
    const picks = this.selectedPicks ?? {};
    const options = loadoutOptions(GameState.baseStash);

    this.trackOverlay(this.add.rectangle(CX, CY, W, H, 0x0a0806, 0.93).setInteractive(), 50);
    this.trackOverlay(createSubtitle(this, 116, "Что взять в вылазку"), 52);

    const { weightKg, overCap } = buildLoadout(GameState.baseStash, picks, items, HERO_MAX_WEIGHT_KG);
    this.trackOverlay(
      this.add
        .text(CX, 150, `Вес: ${weightKg.toFixed(1)} / ${HERO_MAX_WEIGHT_KG} кг`, {
          color: overCap ? "#d36b5a" : "#C8C0B0",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "16px",
        })
        .setOrigin(0.5),
      52,
    );

    if (options.length === 0) {
      this.trackOverlay(createSubtitle(this, 230, "В стеше нет расходников."), 52);
    }

    const rowH = 56;
    const baseY = 210;
    options.forEach((opt, i) => {
      const y = baseY + i * rowH;
      const have = opt.count;
      const n = Math.min(picks[opt.item_id] ?? 0, have);
      const name = items[opt.item_id]?.name_ru ?? opt.item_id;
      const wKg = items[opt.item_id]?.weight_kg ?? 0;
      this.trackOverlay(createSubtitle(this, y, `${name}  (есть ${have}, ${wKg} кг)`, CX - 190), 52);
      this.trackOverlay(
        createSmallButton(this, CX + 40, y, "−", 44, () => this.bumpPick(opt.item_id, -1, have), false),
        52,
      );
      this.trackOverlay(
        this.add
          .text(CX + 110, y, `${n}`, {
            color: "#D4C5A0",
            fontFamily: "Oswald, sans-serif",
            fontSize: "18px",
            fontStyle: "bold",
          })
          .setOrigin(0.5),
        52,
      );
      this.trackOverlay(
        createSmallButton(this, CX + 180, y, "+", 44, () => this.bumpPick(opt.item_id, +1, have), false),
        52,
      );
    });

    this.trackOverlay(
      createSmallButton(this, CX - 200, H - 80, "Очистить", 150, () => {
        this.selectedPicks = {};
        this.openLoadout();
      }, false),
      52,
    );
    this.trackOverlay(
      createSmallButton(this, CX, H - 80, "Взять всё", 150, () => {
        this.selectedPicks = allLoadoutPicks(GameState.baseStash);
        this.openLoadout();
      }, false),
      52,
    );
    this.trackOverlay(
      createSmallButton(this, CX + 200, H - 80, "Готово", 150, () => this.finishLoadout(), true),
      52,
    );
  }

  private renderGoSummary(zone: { id: string; name_ru: string }): void {
    const def = SORTIE_GOALS[this.selectedGoal];
    createSubtitle(this, H - 135, `${def.description_ru}\n${formatGoalRisk(def)}`);
    createButton(
      this,
      H - 90,
      `В вылазку: ${def.name_ru} · глубина ${this.selectedDepth}`,
      () => this.startSortie(zone.id, this.selectedDepth, FIGHTS_PER_DEPTH[this.selectedDepth]),
      true,
    );
  }

  private startSortie(zoneId: string, depth: 1 | 2 | 3, fights: number): void {
    const zone = GameState.data.zones[zoneId];
    if (!zone) return;
    const overlay = this.add.rectangle(CX, CY, W, H, 0x000000).setAlpha(1).setDepth(100);
    runTween(this, "tween_sortie_enter", overlay);
    this.time.delayedCall(400, () => {
      overlay.destroy();
      const encounters = generateSortieEncounters(zone, depth, fights);
      const zoneLootPool = generateZoneLoot(zone, depth);
      const taken = this.takeConsumables();
      const sortie: SortieState = {
        zone_id: zoneId,
        depth,
        goal: this.selectedGoal,
        fights_total: fights,
        fights_completed: 0,
        encounters,
        zone_loot_remaining: zoneLootPool,
        pending_loot: [],
        taken_consumables: taken,
        resolved_log: [],
      };
      GameState.currentSortie = sortie;
      GameState.player.backpack = taken;

      track("sortie_started", {
        zone_id: sortie.zone_id,
        depth: sortie.depth,
        goal: sortie.goal,
        weight: computeWeight(GameState.player.backpack, GameState.data.items),
        hp_pct: Math.round((GameState.player.hp / GameState.player.hp_max) * 100),
      });

      this.scene.start("SortieRunScene");
    });
  }

  private takeConsumables(): InventoryStack[] {
    // M19-PR2: несём выбранный игроком набор (selectedPicks). Если пикер не
    // открывали — безопасный дефолт (до 2 бинтов), а не авто-свип всего стеша.
    const picks = this.selectedPicks ?? defaultLoadoutPicks(GameState.baseStash);
    const { backpack, keptStash } = buildLoadout(
      GameState.baseStash,
      picks,
      GameState.data.items,
      HERO_MAX_WEIGHT_KG,
    );
    GameState.baseStash = keptStash;
    return backpack;
  }

  private returnFromActiveSortie(): void {
    const sortie = GameState.currentSortie;
    if (!sortie) {
      this.scene.start("BaseScene");
      return;
    }
    sortie.final_outcome = "retreat";
    track("sortie_finished", {
      zone_id: sortie.zone_id,
      depth: sortie.depth,
      outcome: sortie.final_outcome,
      encounters_done: sortie.fights_completed,
      source: "resume_screen",
    });
    this.scene.start("LootScene");
  }
}
