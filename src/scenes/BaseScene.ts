import Phaser from "phaser";
import { GameState, setSfxMute, setSfxVolume, addBaseResource } from "../state/GameState";
import { computeWeight } from "../systems/weight";
import { consumePendingAccrualSummary, saveToCloud } from "../systems/cloudSave";
import { accrualHasYield } from "../systems/offlineProgression";
import { activeSignals } from "../systems/radio";
import {
  GARDEN_CAP,
  GENERATOR_CYCLE_MS,
  GENERATOR_ENERGY_PER_CYCLE,
  GENERATOR_FUEL_PER_CYCLE,
  xpToNext,
} from "../state/balance";
import { W, H } from "../ui/layout";
import { track } from "../systems/telemetry";

/**
 * BaseScene — «Оплот» как живая painted-сцена (M10.3).
 *
 * Painted-фон убежища занимает весь экран. Поверх — 6 кликабельных hotspot'ов
 * соответствующих элементам сцены (верстак, ящик, радио, костёр, лежанка, дверь).
 * Top bar содержит день и кнопку настроек.
 *
 * Координаты hotspots в game-coordinates (1280×720), привязаны к painted-фону.
 */

interface Hotspot {
  id: string;
  /** Center X в game coords */
  x: number;
  /** Center Y в game coords */
  y: number;
  /** Полу-ширина hit-area */
  hw: number;
  /** Полу-высота hit-area */
  hh: number;
  /** Подпись для hover-tooltip */
  label: string;
  /** Цвет акцента подсветки (hex) */
  glow: number;
  /** Действие по клику */
  action: (scene: BaseScene) => void;
}

/**
 * Координаты hotspots — выверены по painted assetу.
 * Painted-source 1366×768, мы рендерим на 1280×720 (scale ~0.937).
 */
const HOTSPOTS: Hotspot[] = [
  {
    id: "workbench",
    x: 195,
    y: 470,
    hw: 165,
    hh: 110,
    label: "ВЕРСТАК",
    glow: 0xc5a267,
    action: (s) => s.openSubscene("CraftScene"),
  },
  {
    id: "stash",
    x: 1010,
    y: 490,
    hw: 120,
    hh: 110,
    label: "СНАРЯЖЕНИЕ",
    glow: 0xb5a05a,
    action: (s) => s.openSubscene("InventoryScene"),
  },
  {
    id: "radio",
    x: 1045,
    y: 240,
    hw: 80,
    hh: 60,
    label: "РАДИО",
    glow: 0x6fc26f,
    action: (s) => s.openSubscene("RadioScene"),
  },
  {
    id: "kettle",
    x: 770,
    y: 580,
    hw: 80,
    hh: 80,
    label: "КОСТЁР",
    glow: 0xff8844,
    action: (s) => s.openSubscene("ProgressionScene"),
  },
  {
    id: "cot",
    x: 690,
    y: 510,
    hw: 130,
    hh: 80,
    label: "НАВЫКИ",
    glow: 0x8aa86f,
    action: (s) => s.openSubscene("SkillTreeScene"),
  },
  {
    id: "door",
    x: 1230,
    y: 440,
    hw: 70,
    hh: 280,
    label: "В ВЫЛАЗКУ",
    glow: 0xd4a04a,
    action: (s) => s.scene.start("MapScene"),
  },
  // M13 PR-6c: 2 placeholder hotspots для base sim layer. Без арта
  // (preflight §6: «без иконок и анимации»), координаты в свободных
  // зонах painted background-а — балансировка пиксель-точная — задача
  // художественного редизайна, не PR-6c.
  {
    id: "garden",
    x: 470,
    y: 220,
    hw: 80,
    hh: 40,
    label: "ГРЯДКА",
    glow: 0x6fc26f,
    action: (s) => s.collectGarden(),
  },
  {
    id: "bunk",
    x: 200,
    y: 220,
    hw: 90,
    hh: 40,
    label: "КОЙКА",
    glow: 0x8aa86f,
    action: (s) => s.showBunkStatus(),
  },
  // M13 PR-6b-3: generator (bunk-model). Координаты приближённые,
  // pixel-perfect — задача редизайна. Status-toast при тапе (D8).
  {
    id: "generator",
    x: 380,
    y: 480,
    hw: 80,
    hh: 50,
    label: "ГЕНЕРАТОР",
    glow: 0xe8b547,
    action: (s) => s.showGeneratorStatus(),
  },
];

export class BaseScene extends Phaser.Scene {
  private radioBlink?: Phaser.GameObjects.Arc;
  private weightOverloadIcon?: Phaser.GameObjects.Text;

  public constructor() {
    super("BaseScene");
  }

  public create(): void {
    // ── Painted background ────────────────────────────────────
    this.add.image(W / 2, H / 2, "base_interior")
      .setDisplaySize(W, H)
      .setDepth(-10);

    // Тёмная виньетка по краям — фокус в центр
    const vignette = this.add.graphics().setDepth(-9);
    vignette.fillStyle(0x000000, 0.35);
    vignette.fillRect(0, 0, W, 80);
    vignette.fillRect(0, H - 80, W, 80);

    // ── Top bar — day counter + settings ──────────────────────
    this.renderTopBar();

    // ── HP/XP HUD внизу слева ────────────────────────────────
    this.renderHpHud();

    // ── Status conditions ─────────────────────────────────────
    this.renderStatusOverlays();

    // ── M13: ресурсы базы ─────────────────────────────────────
    this.renderBaseResources();

    // ── Hotspots ──────────────────────────────────────────────
    HOTSPOTS.forEach((h) => this.attachHotspot(h));

    // M13 PR-6c: always-on garden buffer counter рядом с грядка-хотспотом.
    // Обновляется через restart() сцены при collect (паттерн тот же что
    // существующий weapon-swap в InventoryScene).
    this.renderGardenCounter();
    this.renderGeneratorBadge();

    // ── Костёр: subtle animated flicker overlay ───────────────
    this.attachKettleAnimation();

    // M13 PR-6c: offline-return toast. Эксклюзивно load-путь:
    // applySnapshot → accrueOffline → захватил summary, BaseScene
    // забирает и показывает один раз. BaseScene-entry не от load
    // (например после возврата из CraftScene) не будет иметь pending
    // summary — это OK, refresh счётчика буфера идёт через renderGardenCounter.
    this.maybeShowOfflineToast();

    // ── Cleanup on shutdown ──────────────────────────────────
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.radioBlink = undefined;
      this.weightOverloadIcon = undefined;
    });
  }

  private renderTopBar(): void {
    const { player, progress, settings } = GameState;
    const dayCount = Object.keys(progress.daily_completed).length;

    // Бар-плашка над всем
    const bg = this.add.rectangle(W / 2, 22, W, 44, 0x0a0806, 0.6).setDepth(8);
    bg.setStrokeStyle(1, 0x3a2f1a, 0.5);

    // Left: день + sortie counter
    this.add.text(20, 22, `ДЕНЬ ${dayCount + 1}  ·  УР. ${player.level}`, {
      color: "#D4C5A0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
    }).setOrigin(0, 0.5).setDepth(9);

    // Center: title small
    this.add.text(W / 2, 22, "ОПЛОТ", {
      color: "#a89968",
      fontFamily: "Oswald, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(9);

    // Right: settings (mute toggle)
    const muteIcon = settings.sfxMuted ? "🔇" : "🔊";
    const mute = this.add.text(W - 80, 22, muteIcon, {
      fontSize: "20px",
    }).setOrigin(0.5).setDepth(9).setInteractive({ useHandCursor: true });
    mute.on("pointerdown", () => {
      const next = !GameState.settings.sfxMuted;
      setSfxMute(next);
      mute.setText(next ? "🔇" : "🔊");
    });

    // Save indicator (manual save)
    const save = this.add.text(W - 30, 22, "💾", {
      fontSize: "20px",
    }).setOrigin(0.5).setDepth(9).setInteractive({ useHandCursor: true });
    save.on("pointerdown", () => {
      void saveToCloud().then(() => this.showToast("Сохранено в облако"));
    });

    // Volume hint
    this.add.text(W - 130, 22, `${Math.round(settings.sfxVolume * 100)}%`, {
      color: "#8a8270",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
    }).setOrigin(1, 0.5).setDepth(9);
    void setSfxVolume; // keep import live for future use
  }

  private renderHpHud(): void {
    const { player } = GameState;
    const hudX = 30;
    const hudY = H - 60;
    const hudW = 260;

    // Background panel
    const bg = this.add.rectangle(hudX + hudW / 2, hudY, hudW, 70, 0x0a0806, 0.78)
      .setStrokeStyle(2, 0x3a2f1a, 1)
      .setDepth(8);
    void bg;

    // HP bar
    const barW = hudW - 30;
    const barH = 12;
    this.add.rectangle(hudX + 15 + barW / 2, hudY - 12, barW, barH, 0x2a1010, 1)
      .setStrokeStyle(1, 0x4a2010, 1)
      .setDepth(9);
    const hpPct = player.hp / player.hp_max;
    this.add.rectangle(hudX + 15, hudY - 12, barW * hpPct, barH, 0x9a4a4a, 1)
      .setOrigin(0, 0.5)
      .setDepth(9);
    this.add.text(hudX + 15, hudY - 36, `HP ${player.hp}/${player.hp_max}`, {
      color: "#c5a267",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
    }).setDepth(9);

    // XP bar
    const xpNext = xpToNext(player.level);
    const xpPct = xpNext > 0 ? Math.min(1, player.xp / xpNext) : 1;
    this.add.rectangle(hudX + 15 + barW / 2, hudY + 8, barW, 6, 0x1a1a0a, 1)
      .setStrokeStyle(1, 0x2a2a1a, 1)
      .setDepth(9);
    this.add.rectangle(hudX + 15, hudY + 8, barW * xpPct, 6, 0xc5a267, 1)
      .setOrigin(0, 0.5)
      .setDepth(9);

    // Weight indicator справа от HUD
    const data = GameState.data;
    const carryWeight = computeWeight(GameState.baseStash, data.items);
    const weightPct = carryWeight / GameState.player.max_weight_kg;
    const weightColor = weightPct > 0.8 ? "#ff8844" : weightPct > 0.5 ? "#d4c5a0" : "#8aa86f";
    this.add.text(hudX + 15, hudY + 22, `СКЛАД  ${carryWeight.toFixed(1)} / ${GameState.player.max_weight_kg} кг  · ${GameState.baseStash.length} предм.`, {
      color: weightColor,
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "11px",
    }).setDepth(9);
  }

  /**
   * M13: панель ресурсов базы в правом-верхнем углу.
   * PR-1 — только счётчики. PR-5 — постройки начнут их потреблять/производить.
   */
  private renderBaseResources(): void {
    const r = GameState.baseResources;
    const x = W - 230;
    const y = 60;
    const w = 200;
    const h = 110;

    this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x0a0806, 0.78)
      .setStrokeStyle(2, 0x3a2f1a, 1)
      .setDepth(8);

    this.add.text(x + 12, y + 8, "СКЛАД БАЗЫ", {
      color: "#a89968",
      fontFamily: "Oswald, sans-serif",
      fontSize: "12px",
      fontStyle: "bold",
    }).setDepth(9);

    const rows: [string, number, string][] = [
      ["Вода", r.water, "#6fbcd0"],
      ["Топливо", r.fuel, "#d4a04a"],
      ["Металл", r.metal, "#a09078"],
      ["Еда", r.food, "#8aa86f"],
    ];
    rows.forEach(([label, value, color], i) => {
      this.add.text(x + 12, y + 28 + i * 18, `${label}: ${value}`, {
        color,
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
      }).setDepth(9);
    });
  }

  private renderStatusOverlays(): void {
    // Radio blink — если есть непрочитанные сигналы
    const radioSignals = GameState.data.radioSignals ?? [];
    const signals = activeSignals(radioSignals);
    if (signals.length > 0) {
      const radio = HOTSPOTS.find((h) => h.id === "radio");
      if (radio) {
        // Красный мигающий диод над радио
        this.radioBlink = this.add.circle(radio.x + 30, radio.y - 10, 5, 0xff3030, 1)
          .setDepth(5);
        this.tweens.add({
          targets: this.radioBlink,
          alpha: { from: 1, to: 0.2 },
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: "Sine.InOut",
        });

        // Badge с количеством
        if (signals.length > 1) {
          this.add.text(radio.x + 50, radio.y - 30, `${signals.length}`, {
            color: "#ffffff",
            backgroundColor: "#aa2020",
            fontFamily: "Oswald, sans-serif",
            fontSize: "11px",
            fontStyle: "bold",
            padding: { x: 4, y: 1 },
          }).setOrigin(0.5).setDepth(6);
        }
      }
    }

    // Overweight icon — если склад переполнен (>80% от max)
    const data = GameState.data;
    const carryWeight = computeWeight(GameState.baseStash, data.items);
    if (carryWeight > GameState.player.max_weight_kg * 0.8) {
      const stash = HOTSPOTS.find((h) => h.id === "stash");
      if (stash) {
        this.weightOverloadIcon = this.add.text(stash.x, stash.y - stash.hh - 15, "⚠", {
          fontSize: "26px",
          color: "#ff8844",
          stroke: "#1a0a0a",
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(5);
        this.tweens.add({
          targets: this.weightOverloadIcon,
          y: stash.y - stash.hh - 22,
          duration: 1400,
          yoyo: true,
          repeat: -1,
          ease: "Sine.InOut",
        });
      }
    }

    // Daily completed mark — если в эту дату уже была вылазка
    const today = new Date().toISOString().slice(0, 10);
    if (GameState.progress.daily_completed[today]) {
      this.add.text(W - 100, 60, "✓ ДНЕВНАЯ ВЫЛАЗКА", {
        color: "#8aa86f",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "11px",
        backgroundColor: "#0a0806",
        padding: { x: 6, y: 2 },
      }).setOrigin(1, 0.5).setDepth(9);
    }
  }

  private attachHotspot(h: Hotspot): void {
    const hit = this.add.zone(h.x, h.y, h.hw * 2, h.hh * 2)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Тонкий outline по умолчанию невидим
    const outline = this.add.rectangle(h.x, h.y, h.hw * 2, h.hh * 2)
      .setStrokeStyle(2, h.glow, 0)
      .setDepth(4);

    // Glow (на hover/active)
    const glowRect = this.add.rectangle(h.x, h.y, h.hw * 2 + 30, h.hh * 2 + 30, h.glow, 0)
      .setDepth(3)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Label tooltip (hidden by default)
    const tooltip = this.add.text(h.x, h.y - h.hh - 18, h.label, {
      color: "#1a1208",
      backgroundColor: "#d4c5a0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      padding: { x: 8, y: 3 },
    }).setOrigin(0.5).setDepth(7).setAlpha(0);

    hit.on("pointerover", () => {
      this.tweens.add({ targets: outline, alpha: 0.9, duration: 180 });
      this.tweens.add({ targets: glowRect, alpha: 0.18, duration: 240 });
      this.tweens.add({ targets: tooltip, alpha: 1, duration: 180 });
    });
    hit.on("pointerout", () => {
      this.tweens.add({ targets: outline, alpha: 0, duration: 240 });
      this.tweens.add({ targets: glowRect, alpha: 0, duration: 300 });
      this.tweens.add({ targets: tooltip, alpha: 0, duration: 180 });
    });
    hit.on("pointerdown", () => {
      // Quick flash
      this.tweens.add({ targets: glowRect, alpha: 0.35, duration: 60, yoyo: true });
      track("hotspot_clicked", { id: h.id });
      h.action(this);
    });
  }

  private attachKettleAnimation(): void {
    const k = HOTSPOTS.find((h) => h.id === "kettle");
    if (!k) return;
    // Subtle pulsing glow — "костёр живой"
    const flame = this.add.circle(k.x, k.y + 10, 35, 0xff7728, 0.18)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(2);
    this.tweens.add({
      targets: flame,
      alpha: { from: 0.18, to: 0.32 },
      scale: { from: 1, to: 1.15 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }

  public openSubscene(key: string): void {
    this.scene.start(key);
  }

  public showRestInfo(): void {
    this.showToast("Лежанка — отдых восстанавливает HP в начале вылазки");
  }

  /**
   * M13 PR-6c: COLLECT для грядки. Перебрасывает buffer → baseResources.food
   * и обнуляет буфер. Триггерится тапом на garden-хотспот. Рестартим сцену
   * чтобы счётчик буфера и base-resources панель показали новое значение.
   */
  public collectGarden(): void {
    const garden = GameState.buildings.find((b) => b.id === "garden");
    if (!garden || garden.accumulated_output === 0) {
      this.showToast("Буфер грядки пустой");
      return;
    }
    const collected = garden.accumulated_output;
    GameState.baseResources = addBaseResource(
      GameState.baseResources,
      "food",
      collected,
    );
    GameState.buildings = GameState.buildings.map((b) =>
      b.id === "garden" ? { ...b, accumulated_output: 0 } : b,
    );
    track("garden_collect", { food: collected });
    this.showToast(`+${collected} еды собрано с грядки`);
    this.scene.restart();
  }

  /**
   * M13 PR-6c: passive статус койки. По preflight §6 «Койка: пассивный
   * статус-лейбл» — клик не действие, просто info-toast.
   */
  public showBunkStatus(): void {
    const { hp, hp_max } = GameState.player;
    const foodAvailable = GameState.baseResources.food;
    if (hp >= hp_max) {
      this.showToast(`HP: ${hp}/${hp_max} (полное здоровье)`);
    } else if (foodAvailable === 0) {
      this.showToast(`HP: ${hp}/${hp_max} (нет еды — койка спит)`);
    } else {
      this.showToast(`HP: ${hp}/${hp_max} (койка лечит +5/10 мин если есть еда)`);
    }
  }

  /**
   * M13 PR-6b-3 — Generator status toast. Без collect-кнопки (D8): energy
   * пишется НАПРЯМУЮ в baseResources.energy при accrue (bunk-model).
   * Mirror'ит `showBunkStatus` по форме.
   */
  public showGeneratorStatus(): void {
    const energy = GameState.baseResources.energy;
    const fuel = GameState.baseResources.fuel;
    const cycleMin = Math.round(GENERATOR_CYCLE_MS / 60_000);
    if (fuel === 0) {
      this.showToast(
        `⚡ ${energy} (нет топлива — генератор простаивает)`,
      );
    } else {
      this.showToast(
        `⚡ ${energy} (производит +${GENERATOR_ENERGY_PER_CYCLE}/${cycleMin}мин, ` +
          `тратит ⛽${GENERATOR_FUEL_PER_CYCLE}/${cycleMin}мин)`,
      );
    }
  }

  /**
   * Always-on счётчик буфера грядки рядом с garden-хотспотом. Не tooltip —
   * виден всегда, потому что игроку нужно знать «когда собрать».
   */
  private renderGardenCounter(): void {
    const garden = HOTSPOTS.find((h) => h.id === "garden");
    if (!garden) return;
    const buffer = GameState.buildings.find((b) => b.id === "garden")?.accumulated_output ?? 0;
    this.add
      .text(garden.x, garden.y + garden.hh + 8, `🌱 ${buffer}/${GARDEN_CAP}`, {
        color: "#d4c5a0",
        backgroundColor: "#1a120880",
        fontFamily: "Oswald, sans-serif",
        fontSize: "13px",
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(7);
  }

  /**
   * M13 PR-6b-3 — Always-on energy counter рядом с generator-хотспотом.
   * Идиома `🌱 N/CAP` грядки, но без cap (energy unbounded).
   */
  private renderGeneratorBadge(): void {
    const gen = HOTSPOTS.find((h) => h.id === "generator");
    if (!gen) return;
    const energy = GameState.baseResources.energy ?? 0;
    this.add
      .text(gen.x, gen.y + gen.hh + 8, `⚡ ${energy}`, {
        color: "#e8b547",
        backgroundColor: "#1a120880",
        fontFamily: "Oswald, sans-serif",
        fontSize: "13px",
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(7);
  }

  /**
   * Offline-return toast. Читает summary через consumePendingAccrualSummary
   * (захватываем + чистим). Показывает только если что-то реально начислилось
   * (`accrualHasYield` — экономит шум на коротких заходах с нулевыми
   * ставками).
   */
  private maybeShowOfflineToast(): void {
    const summary = consumePendingAccrualSummary();
    if (!summary || !accrualHasYield(summary)) return;
    const parts: string[] = [];
    const hours = Math.round(summary.delta_ms / (60 * 60 * 1000));
    parts.push(`Пока вас не было (${hours} ч):`);
    if (summary.garden_food_added > 0) {
      parts.push(`грядка +${summary.garden_food_added} еды`);
    }
    if (summary.bunk_hp_added > 0) {
      parts.push(`койка +${summary.bunk_hp_added} HP`);
    }
    const spent: string[] = [];
    if (summary.garden_water_spent > 0) spent.push(`${summary.garden_water_spent} воды`);
    if (summary.bunk_food_spent > 0) spent.push(`${summary.bunk_food_spent} еды`);
    if (spent.length > 0) parts.push(`Потрачено: ${spent.join(", ")}`);
    this.showToast(parts.join(". "));
  }

  private showToast(msg: string): void {
    const txt = this.add.text(W / 2, H - 130, msg, {
      color: "#1a1208",
      backgroundColor: "#d4c5a0",
      fontFamily: "Oswald, sans-serif",
      fontSize: "14px",
      padding: { x: 14, y: 6 },
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 1800,
      onComplete: () => txt.destroy(),
    });
  }
}
