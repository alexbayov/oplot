import Phaser from "phaser";
import {
  GameState,
  addToStack,
  removeFromStack,
} from "../state/GameState";
import { COVER_DEFENSE_BONUS_PCT } from "../state/balance";
import type { InventoryStack } from "../state/types";
import {
  applyAttack,
  calcDefenseAgainst,
  calcHeroInitiative,
  getArmorStats,
  getMeleeWeaponStats,
  getRangedWeaponStats,
} from "../systems/combat";
import { computePerkModifiers } from "../systems/perks";
import { generateMobLoot } from "../systems/loot";
import { computeGasDamage } from "../systems/gasZone";
import {
  DEFAULT_PLAYER_AP,
  formatCombatActionDisabledReason,
  getCombatActionCost,
  getCombatActionDisabledReason,
} from "../systems/combatAp";
import { gainXP } from "../systems/xp";
import { tickRadioOnReturn } from "../systems/radio";
import { track } from "../systems/telemetry";
import {
  chooseMobActionV2,
  type MobRuntimeState,
} from "../systems/mobAI";
import { deriveVisibleEnemyIntent } from "../systems/combatIntents";
import { formatNoiseDelta, getNoiseDeltaForAction } from "../systems/combatNoise";
import {
  DEFAULT_DISTANCE_BAND,
  computeDistanceMovePlan,
  getDistanceChipText,
  getDistanceMoveDisabledReasonLabel,
  type DistanceBand,
  type DistanceMoveDirection,
} from "../systems/combatDistance";
import { initBossFight, getBossGuaranteedDrops } from "../systems/mobRole";
import { runTween } from "../systems/tweens";
import { applyLootLoss, computeWeight } from "../systems/weight";
import { saveToCloud } from "../systems/cloudSave";
import { showRewardedVideo } from "../systems/ads";
import { hideBanner } from "../systems/banner";
import {
  getWeaponAmmoSpec,
  getReserveAmmoCount,
  computeAmmoDisabledReason,
  getAmmoDisabledReasonLabel,
  computeMagazineShotPlan,
  computeReloadPlan,
  type AmmoWeaponLike,
} from "../systems/combatAmmo";
import type { ConsumableItem, Mob } from "../types";
import {
  formatCombatStatusChip,
  formatStatusOverflowChip,
  limitCombatStatusesForDisplay,
  type CombatStatusInstance,
} from "../systems/combatStatus";
import {
  createButton,
  createPanel,
  createSubtitle,
  createTitle,
  createSmallButton,
  createHpBar,
  showFloatingText,
  addVignette,
  addDustParticles,
} from "./sceneUi";
import { CX, CY, W, H, LAYOUT } from "../ui/layout";

interface MobInstance {
  mob: Mob;
  state: MobRuntimeState;
  isBoss: boolean;
  _phase2PopupShown?: boolean;
}

type CombatState = "awaiting_hero" | "resolving_mobs" | "ended";
interface TurnOrderEntry {
  kind: "hero" | "mob";
  mobIndex?: number;
  initiative: number;
}

const ZONE_LOOT_DRAIN_PORTION = (totalCount: number, fightsRemaining: number): number =>
  fightsRemaining <= 1
    ? totalCount
    : Math.max(1, Math.floor(totalCount / fightsRemaining));

export class CombatScene extends Phaser.Scene {
  private mobs: MobInstance[] = [];
  private turnQueue: TurnOrderEntry[] = [];
  private state: CombatState = "awaiting_hero";
  private logLines: string[] = [];
  private logText?: Phaser.GameObjects.Text;
  private secondChanceUsed = false;
  private heroPanel?: Phaser.GameObjects.Text;
  private enemyPanel?: Phaser.GameObjects.Text;
  private buttonsContainer: Phaser.GameObjects.Container[] = [];
  private phaseLabel?: Phaser.GameObjects.Text;
  private currentAp = DEFAULT_PLAYER_AP;
  private apLabel?: Phaser.GameObjects.Text;
  private actionPreviewLabel?: Phaser.GameObjects.Text;
  private ammoPreviewLabel?: Phaser.GameObjects.Text;
  private distanceLabel?: Phaser.GameObjects.Text;
  private coverStatusLabel?: Phaser.GameObjects.Text;
  private noiseLabel?: Phaser.GameObjects.Text;
  private distanceBand: DistanceBand = DEFAULT_DISTANCE_BAND;
  private currentNoise = 0;
  private currentMagazineByWeaponId = new Map<string, { ammoId: string; count: number }>();
  private combatStatusesByTarget = new Map<string, CombatStatusInstance[]>();
  private heroStatusLabel?: Phaser.GameObjects.Text;
  private statusPreviewByAction = new Map<string, CombatStatusInstance>();

  public constructor() {
    super("CombatScene");
  }

  public create(): void {
    void hideBanner();

    // Reset instance state
    this.state = "awaiting_hero";
    this.mobs = [];
    this.turnQueue = [];
    this.logLines = [];
    this.secondChanceUsed = false;
    this.buttonsContainer = [];
    this.phaseLabel = undefined;
    this.heroPanel = undefined;
    this.enemyPanel = undefined;
    this.logText = undefined;
    this.currentAp = DEFAULT_PLAYER_AP;
    this.apLabel = undefined;
    this.actionPreviewLabel = undefined;
    this.ammoPreviewLabel = undefined;
    this.distanceLabel = undefined;
    this.coverStatusLabel = undefined;
    this.noiseLabel = undefined;
    this.distanceBand = DEFAULT_DISTANCE_BAND;
    this.currentNoise = 0;
    this.currentMagazineByWeaponId.clear();
    this.heroStatusLabel = undefined;
    this.combatStatusesByTarget.clear();
    this.statusPreviewByAction.clear();

    const sortie = GameState.currentSortie;
    if (!sortie) {
      createTitle(this, "Бой");
    addVignette(this);
    addDustParticles(this);
      createSubtitle(this, CY, "Вылазка не активна.");
      createButton(this, H - 80, "В Оплот", () => {
        this.refundRuntimeMagazinesToBackpack();
        this.scene.start("BaseScene");
      });
      return;
    }
    const enemyIds = sortie.encounters[sortie.fights_completed] ?? [];
    this.mobs = enemyIds
      .map((id) => GameState.data.mobs[id])
      .filter((m): m is Mob => Boolean(m))
      .map((mob) => {
        const init = initBossFight(mob);
        return { mob, state: init.runtimeState, isBoss: init.isBoss };
      });
    sortie.cover_active = false;

    // Background — растянутый painted-фон зоны
    const zone = GameState.data.zones[sortie.zone_id];
    const bgKey = zone ? `bg_${zone.id}` : "bg_forest";
    this.add.image(CX, CY, bgKey).setAlpha(0.55).setDisplaySize(W, H).setDepth(-10);

    createTitle(this, "БОЙ");

    const combat = LAYOUT.combat;

    // ── Boss HUD overlay (top) ──────────────────────────────────
    const bossInst = this.mobs.find((m) => m.isBoss);
    if (bossInst) {
      this.add
        .text(CX, 80, `Босс: ${bossInst.mob.name_ru}`, {
          color: "#FF4444",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "20px",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.phaseLabel = this.add
        .text(CX, 108, `Фаза ${bossInst.state.phase}`, {
          color: "#FFAA44",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "14px",
        })
        .setOrigin(0.5);
    }

    // ── Hero portrait + HP/XP card (bottom-left HUD) ────────────
    createPanel(this, 180, 620, 320, 80);

    // Big hero sprite in main combat area (mirrors mob position)
    this.add.image(combat.heroX, combat.heroY, "hero")
      .setOrigin(0.5)
      .setScale(combat.spriteScale)
      .setAlpha(0.95)
      .setFlipX(true)
      .setDepth(1);

    // ── Combat log (center, between hero and mob) ───────────────
    createPanel(this, CX, 300, 500, 100);
    this.logText = this.add
      .text(CX, 300, "", {
        align: "center",
        color: "#C8C0B0",
        fontFamily: "Share Tech Mono, monospace",
        fontSize: "13px",
        wordWrap: { width: 480 },
      })
      .setOrigin(0.5);

    const actionY = combat.actionBarY;

    // Static panels for hero/enemy info (heroPanel uses createSubtitle, so created with text only)
    this.heroPanel = createSubtitle(this, 600, "", 180);
    this.enemyPanel = createSubtitle(this, 600, "", W - 180);
    this.apLabel = this.add
      .text(CX, actionY - 52, "", {
        align: "center",
        color: "#E8D8A8",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.actionPreviewLabel = this.add
      .text(CX, actionY - 28, "", {
        align: "center",
        color: "#C8C0B0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
      })
      .setOrigin(0.5);
    this.ammoPreviewLabel = this.add
      .text(CX, actionY - 70, "", {
        align: "center",
        color: "#A8B8C8",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
      })
      .setOrigin(0.5);
    this.distanceLabel = this.add
      .text(CX, actionY - 90, "", {
        align: "center",
        color: "#C5A267",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.coverStatusLabel = this.add
      .text(CX - 190, actionY - 90, "", {
        align: "center",
        color: "#8FD18F",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.noiseLabel = this.add
      .text(CX + 190, actionY - 90, "", {
        align: "center",
        color: "#D6B56D",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.heroStatusLabel = this.add
      .text(CX, actionY - 110, "", {
        align: "center",
        color: "#FFAAAA",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // ── Action bar (bottom, 7 compact buttons in row) ─────────────
    const btnW = 132;
    const gap = 8;
    const actions = 7;
    const totalW = actions * btnW + (actions - 1) * gap;
    const startX = CX - totalW / 2 + btnW / 2;

    this.buttonsContainer.push(
      createSmallButton(this, startX, actionY, "АТАКА", btnW, () => this.onHeroAttack(), true),
      createSmallButton(this, startX + (btnW + gap), actionY, "УКРЫТИЕ", btnW, () => this.onHeroCover()),
      createSmallButton(this, startX + (btnW + gap) * 2, actionY, "АПТЕЧКА", btnW, () => this.onHeroHeal()),
      createSmallButton(this, startX + (btnW + gap) * 3, actionY, "ПЕРЕЗАРЯДКА", btnW, () => this.onHeroReload()),
      createSmallButton(this, startX + (btnW + gap) * 4, actionY, "БЛИЖЕ", btnW, () => this.onHeroMoveCloser()),
      createSmallButton(this, startX + (btnW + gap) * 5, actionY, "ДАЛЬШЕ", btnW, () => this.onHeroMoveAway()),
      createSmallButton(this, startX + (btnW + gap) * 6, actionY, "ОТСТУП", btnW, () => this.onHeroRetreat()),
    );

    this.updateDisplay();
    this.startRound();
  }

  // ---------- turn loop ----------

  private startRound(): void {
    if (this.checkEnd()) return;
    this.applyGasDamage();
    if (this.checkEnd()) return;
    this.turnQueue = this.computeTurnOrder();
    this.advanceTurn();
  }

  private applyGasDamage(): void {
    const sortie = GameState.currentSortie;
    if (!sortie) return;
    const zone = GameState.data.zones[sortie.zone_id];
    if (!zone) return;
    const player = GameState.player;
    const gasDamage = computeGasDamage(zone, sortie.depth, player);
    if (gasDamage > 0) {
      player.hp = Math.max(0, player.hp - gasDamage);
      this.log(`Газ: -${gasDamage} HP`);
      const overlay = this.add.rectangle(CX, CY, W, H, 0xffff00, 0).setAlpha(0);
      const tween = runTween(this, "tween_gas_warning", overlay);
      tween?.once("complete", () => overlay.destroy());
    }
  }

  private computeTurnOrder(): TurnOrderEntry[] {
    const order: TurnOrderEntry[] = [];
    const player = GameState.player;
    const weight = computeWeight(player.backpack, GameState.data.items);
    order.push({
      kind: "hero",
      initiative: calcHeroInitiative(GameState.baseSpeed, weight, player.max_weight_kg),
    });
    this.mobs.forEach((inst, idx) => {
      if (inst.state.hp <= 0 || inst.state.fled) return;
      order.push({ kind: "mob", mobIndex: idx, initiative: inst.state.base_speed });
    });
    order.sort((a, b) => b.initiative - a.initiative);
    return order;
  }

  private advanceTurn(): void {
    if (this.checkEnd()) return;
    const entry = this.turnQueue.shift();
    if (!entry) {
      this.startRound();
      return;
    }
    if (entry.kind === "hero") {
      const sortie = GameState.currentSortie;
      if (sortie) sortie.cover_active = false;
      this.state = "awaiting_hero";
      this.currentAp = DEFAULT_PLAYER_AP;
      this.updateDisplay();
      return;
    }
    if (entry.mobIndex !== undefined) {
      this.runMobTurn(entry.mobIndex);
    }
  }

  private runMobTurn(mobIndex: number): void {
    const inst = this.mobs[mobIndex];
    if (!inst || inst.state.hp <= 0 || inst.state.fled) {
      this.advanceTurn();
      return;
    }
    const player = GameState.player;
    const heroWeapon = GameState.data.items[player.equipped_weapon_id] ?? null;
    const action = chooseMobActionV2({
      mob: inst.mob,
      state: inst.state,
      allies: this.mobs.map((m) => ({ mob: m.mob, state: m.state })),
      heroEquippedWeapon: heroWeapon,
    });
    if (inst.isBoss && inst.state.phase_transition_done && inst.state.phase === 2 && !inst._phase2PopupShown) {
      this.log(`${inst.mob.name_ru} переходит в фазу 2!`);
      inst._phase2PopupShown = true;
      const overlay = this.add.rectangle(CX, 80, W, 50, 0xff0000, 0).setAlpha(0).setDepth(50);
      const tween = runTween(this, "tween_boss_phase_red", overlay);
      tween?.once("complete", () => overlay.destroy());
    }
    if (action.kind === "flee") {
      inst.state.fled = true;
      this.log(`${inst.mob.name_ru} убегает.`);
      this.updateDisplay();
      this.time.delayedCall(250, () => this.advanceTurn());
      return;
    }
    if (action.kind === "cover") {
      this.log(`${inst.mob.name_ru} прячется в укрытие.`);
      this.updateDisplay();
      this.time.delayedCall(250, () => this.advanceTurn());
      return;
    }
    const armorItem = GameState.data.items[player.equipped_armor_id];
    const armorStats =
      action.ignore_armor_defense || !armorItem ? null : getArmorStats(armorItem);
    const sortie = GameState.currentSortie;
    const cover = sortie?.cover_active ?? false;
    const mods = computePerkModifiers(player.perks);
    const defense = calcDefenseAgainst(armorStats, inst.mob.type, cover, mods.armor_efficiency_multiplier);
    const result = applyAttack(
      {
        damage_min: inst.state.damage_min * action.damage_multiplier,
        damage_max: inst.state.damage_max * action.damage_multiplier,
      },
      defense,
      player.hp,
    );
    player.hp = result.defender_hp_after;
    this.log(
      `${inst.mob.name_ru} бьёт на ${result.damage_dealt.toFixed(1)} (HP: ${player.hp.toFixed(0)})`,
    );
    runTween(this, "tween_hit_shake", this.cameras.main);
    this.flashDamage();
    showFloatingText(this, LAYOUT.combat.heroX, LAYOUT.combat.heroY - 80, `-${result.damage_dealt.toFixed(0)}`, "#D32F2F");
    this.updateDisplay();
    this.time.delayedCall(250, () => this.advanceTurn());
  }

  // ---------- hero actions ----------

  private onHeroAttack(): void {
    if (this.state !== "awaiting_hero") return;
    const aliveIdx = this.mobs.findIndex((m) => m.state.hp > 0 && !m.state.fled);
    if (aliveIdx === -1) {
      this.advanceTurn();
      return;
    }
    const player = GameState.player;
    const weaponItem = GameState.data.items[player.equipped_weapon_id];
    if (!weaponItem) return;
    const melee = getMeleeWeaponStats(weaponItem);
    const ranged = getRangedWeaponStats(weaponItem);
    let weaponStats: { damage_min: number; damage_max: number } | null = null;
    if (melee) {
      weaponStats = melee;
    } else if (ranged) {
      const existingEntry = this.getCurrentMagazineEntryForEquippedWeapon();
      const currentMagazine = existingEntry?.count ?? 0;
      const plan = computeMagazineShotPlan({
        weapon: weaponItem as unknown as AmmoWeaponLike,
        currentMagazine,
      });
      if (plan.ok) {
        let ammoId = existingEntry?.ammoId;
        if (!ammoId) {
          const specResult = getWeaponAmmoSpec(weaponItem as unknown as AmmoWeaponLike);
          ammoId = specResult.ok ? specResult.spec.ammoId : "unknown";
        }
        this.currentMagazineByWeaponId.set(player.equipped_weapon_id, {
          ammoId,
          count: plan.resultingMagazine,
        });
        this.currentNoise += getNoiseDeltaForAction("valid_firearm_shot");
        weaponStats = ranged;
      } else {
        this.log("Нет патронов — удар прикладом.");
        weaponStats = { damage_min: 1, damage_max: 2 };
      }
    } else {
      weaponStats = { damage_min: 1, damage_max: 2 };
    }
    const target = this.mobs[aliveIdx];
    if (!target) {
      this.advanceTurn();
      return;
    }
    const coverActive = target.state.cover_active;
    const targetDefense = coverActive
      ? target.mob.defense * (1 + COVER_DEFENSE_BONUS_PCT)
      : target.mob.defense;
    const heroMods = computePerkModifiers(player.perks);
    const result = applyAttack(weaponStats, targetDefense, target.state.hp, undefined, heroMods.damage_multiplier);
    target.state.hp = result.defender_hp_after;
    if (coverActive) target.state.cover_active = false;
    this.log(
      `Герой бьёт ${target.mob.name_ru} на ${result.damage_dealt.toFixed(1)} (HP: ${target.state.hp.toFixed(0)})`,
    );
    runTween(this, "tween_hit_shake", this.cameras.main);

    // Scale pulse mob sprite at landscape mob position
    const mobScreenX = LAYOUT.combat.mobX + aliveIdx * 40;
    const spr = this.children.list.find((c) => {
      const transform = c as unknown as Phaser.GameObjects.Components.Transform;
      return c.getData("mobSprite") === true && transform.x === mobScreenX;
    });
    if (spr) {
      this.tweens.add({
        targets: spr,
        scaleX: LAYOUT.combat.spriteScale * 0.95,
        scaleY: LAYOUT.combat.spriteScale * 0.95,
        duration: 100,
        yoyo: true,
      });
    }

    showFloatingText(this, mobScreenX, LAYOUT.combat.mobY - 80, `-${result.damage_dealt.toFixed(0)}`, "#D32F2F");

    this.updateDisplay();
    this.state = "resolving_mobs";
    this.time.delayedCall(250, () => this.advanceTurn());
  }

  private onHeroCover(): void {
    if (this.state !== "awaiting_hero") return;
    const sortie = GameState.currentSortie;
    if (sortie) sortie.cover_active = true;
    this.log("Герой в укрытии (+50% защиты).");
    this.updateActionPreview();
    this.state = "resolving_mobs";
    this.time.delayedCall(250, () => this.advanceTurn());
  }

  private onHeroHeal(): void {
    if (this.state !== "awaiting_hero") return;
    const player = GameState.player;
    const items = GameState.data.items;
    interface HealOption { stack: InventoryStack; item: ConsumableItem; value: number }
    const heals: HealOption[] = [];
    for (const stack of player.backpack) {
      const item = items[stack.item_id];
      if (!item || item.type !== "consumable") continue;
      if (item.stats.effect_type !== "heal") continue;
      heals.push({ stack, item, value: item.stats.effect_value });
    }
    heals.sort((a, b) => a.value - b.value);
    const pick = heals[0];
    if (!pick) {
      this.log("Нет аптечки.");
      return;
    }
    player.backpack = removeFromStack(player.backpack, pick.stack.item_id, 1);
    const healed = Math.min(player.hp_max, player.hp + pick.value);
    const delta = healed - player.hp;
    player.hp = healed;
    this.log(`Использован ${pick.item.name_ru}: +${delta} HP.`);
    if (this.heroPanel) {
      runTween(this, "tween_heal_pulse", this.heroPanel);
    }
    showFloatingText(this, LAYOUT.combat.heroX, LAYOUT.combat.heroY - 80, `+${delta.toFixed(0)} HP`, "#4CAF50");
    this.updateDisplay();
    this.state = "resolving_mobs";
    this.time.delayedCall(250, () => this.advanceTurn());
  }

  private onHeroMoveCloser(): void {
    this.onHeroMovePreview("closer");
  }

  private onHeroMoveAway(): void {
    this.onHeroMovePreview("away");
  }

  private onHeroMovePreview(direction: DistanceMoveDirection): void {
    if (this.state !== "awaiting_hero") return;
    const plan = computeDistanceMovePlan({ current: this.distanceBand, direction });
    if (!plan.ok) {
      this.log(`Манёвр недоступен: ${getDistanceMoveDisabledReasonLabel(plan.reason)}.`);
      return;
    }
    this.log("Манёвр пока в предпросмотре: перемещение не тратит AP и не меняет дистанцию.");
  }

  private onHeroRetreat(): void {
    if (this.state !== "awaiting_hero") return;
    this.refundRuntimeMagazinesToBackpack();
    this.state = "ended";
    const sortie = GameState.currentSortie;
    if (sortie && sortie.fights_completed < sortie.fights_total) {
      sortie.cover_active = false;
      this.scene.start("SortieScene");
      return;
    }
    this.endSortie("retreat");
  }

  private onHeroReload(): void {
    if (this.state !== "awaiting_hero") return;
    const player = GameState.player;
    const weaponItem = GameState.data.items[player.equipped_weapon_id];
    
    if (!weaponItem) {
      this.log("Перезарядка: не огнестрельное оружие.");
      return;
    }

    const specResult = getWeaponAmmoSpec(weaponItem as unknown as AmmoWeaponLike);
    if (!specResult.ok) {
      if (specResult.reason === "not_ranged_weapon") {
        this.log("Перезарядка: не огнестрельное оружие.");
      } else {
        const reasonLabel = getAmmoDisabledReasonLabel(specResult.reason);
        this.log(`Перезарядка: ${reasonLabel}.`);
      }
      return;
    }

    const spec = specResult.spec;
    const currentMagazine = this.currentMagazineByWeaponId.get(player.equipped_weapon_id)?.count ?? 0;
    const plan = computeReloadPlan({
      weapon: weaponItem as unknown as AmmoWeaponLike,
      backpack: player.backpack,
      currentMagazine,
      magazineCapacity: spec.magazineCapacity,
    });

    if (!plan.ok) {
      const reasonLabel = getAmmoDisabledReasonLabel(plan.disabledReason);
      this.log(`Перезарядка: ${reasonLabel}.`);
      return;
    }

    player.backpack = removeFromStack(player.backpack, plan.ammoId, plan.reserveAmmoConsumed);
    this.currentMagazineByWeaponId.set(player.equipped_weapon_id, {
      ammoId: plan.ammoId,
      count: plan.resultingMagazine,
    });
    this.log(`Перезарядка: +${plan.reloadAmount} патр.`);
    this.updateDisplay();
  }

  private refundRuntimeMagazinesToBackpack(): void {
    const player = GameState.player;
    for (const [, entry] of this.currentMagazineByWeaponId.entries()) {
      if (entry.count > 0) {
        player.backpack = addToStack(player.backpack, entry.ammoId, entry.count);
      }
    }
    this.currentMagazineByWeaponId.clear();
  }

  private getCurrentMagazineEntryForEquippedWeapon(): { ammoId: string; count: number } | undefined {
    const player = GameState.player;
    return this.currentMagazineByWeaponId.get(player.equipped_weapon_id);
  }

  // ---------- end conditions ----------

  private checkEnd(): boolean {
    if (this.state === "ended") return true;
    const player = GameState.player;
    if (player.hp <= 0) {
      this.endCombatDefeat();
      return true;
    }
    const allDownOrFled = this.mobs.every((m) => m.state.hp <= 0 || m.state.fled);
    if (allDownOrFled) {
      this.endCombatVictory();
      return true;
    }
    return false;
  }

  private endCombatVictory(): void {
    this.refundRuntimeMagazinesToBackpack();
    this.state = "ended";
    const sortie = GameState.currentSortie;
    track("combat_resolved", {
      outcome: "won",
      zone_id: sortie?.zone_id ?? "unknown",
      depth: sortie?.depth ?? 0,
      hp_pct: Math.round((GameState.player.hp / GameState.player.hp_max) * 100),
    });
    if (!sortie) {
      this.scene.start("BaseScene");
      return;
    }
    const player = GameState.player;
    const mods = computePerkModifiers(player.perks);
    let mobLoot: InventoryStack[] = [];
    for (const inst of this.mobs) {
      if (inst.state.fled) continue;
      const drops = generateMobLoot(inst.mob, undefined, mods.loot_quantity_multiplier);
      for (const stack of drops) {
        mobLoot = addToStack(mobLoot, stack.item_id, stack.count);
      }
      if (inst.isBoss) {
        const guaranteed = getBossGuaranteedDrops(inst.mob);
        for (const stack of guaranteed) {
          mobLoot = addToStack(mobLoot, stack.item_id, stack.count);
        }
      }
    }
    let totalXpGain = 0;
    for (const inst of this.mobs) {
      if (inst.state.fled) continue;
      totalXpGain += inst.mob.xp_reward;
    }
    const xpResult = gainXP(player.xp, player.level, totalXpGain, mods.xp_gain_multiplier);
    player.xp += xpResult.xp_gained;
    if (xpResult.levelled_up) {
      player.level = xpResult.level_after;
      const modsAfter = computePerkModifiers(player.perks);
      player.hp_max = 100 + modsAfter.hp_max_additive;
      player.hp = Math.min(player.hp, player.hp_max);
    }
    const fightsRemaining = sortie.fights_total - sortie.fights_completed;
    const drainedZone: InventoryStack[] = [];
    const newPool: InventoryStack[] = [];
    for (const stack of sortie.zone_loot_remaining) {
      const take = ZONE_LOOT_DRAIN_PORTION(stack.count, fightsRemaining);
      if (take > 0) drainedZone.push({ item_id: stack.item_id, count: take });
      const rest = stack.count - take;
      if (rest > 0) newPool.push({ item_id: stack.item_id, count: rest });
    }
    sortie.zone_loot_remaining = newPool;
    let combined: InventoryStack[] = [];
    for (const s of [...mobLoot, ...drainedZone]) {
      combined = addToStack(combined, s.item_id, s.count);
    }
    sortie.pending_loot = combined;
    sortie.fights_completed += 1;

    if (xpResult.levelled_up) {
      // M11.4: вместо случайных перков — +1 skill point и приглашение в дерево.
      player.skillPoints = (player.skillPoints ?? 0) + 1;
      this.scene.start("LootScene");
      this.scene.launch("LevelUpScene", {
        levelBefore: xpResult.level_before,
        levelAfter: xpResult.level_after,
      });
    } else {
      this.scene.start("LootScene");
    }
  }

  private endCombatDefeat(): void {
    this.state = "ended";
    if (!this.secondChanceUsed) {
      createButton(this, H - 110, "Второй шанс (реклама)", () => {
        this.secondChanceUsed = true;
        showRewardedVideo("second_chance", () => {
          const player = GameState.player;
          player.hp = player.hp_max * 0.5;
          this.state = "awaiting_hero";
          this.updateDisplay();
          this.advanceTurn();
        }, () => {
          this.proceedToDefeatEnd();
        });
      });
      createButton(this, H - 50, "Сдаться", () => {
        this.proceedToDefeatEnd();
      });
    } else {
      this.proceedToDefeatEnd();
    }
  }

  private proceedToDefeatEnd(): void {
    this.refundRuntimeMagazinesToBackpack();
    const overlay = this.add.rectangle(CX, CY, W, H, 0x000000, 0).setAlpha(0).setDepth(200);
    runTween(this, "tween_defeat_fade", overlay);
    this.time.delayedCall(500, () => {
      overlay.destroy();
      this.endSortie("defeat");
    });
  }

  private endSortie(reason: "retreat" | "defeat"): void {
    this.refundRuntimeMagazinesToBackpack();
    track("combat_resolved", {
      outcome: reason === "defeat" ? "died" : "fled",
      zone_id: GameState.currentSortie?.zone_id ?? "unknown",
      depth: GameState.currentSortie?.depth ?? 0,
      hp_pct: Math.round((GameState.player.hp / GameState.player.hp_max) * 100),
    });
    const player = GameState.player;
    const items = GameState.data.items;
    if (reason === "defeat") {
      player.backpack = applyLootLoss(player.backpack, items);
    }
    this.mergeBackpackToStash();
    player.hp = player.hp_max;
    GameState.progress.radio_trust = tickRadioOnReturn(
      GameState.data.radioSignals,
      GameState.progress.radio_trust,
    );
    GameState.currentSortie = null;
    void saveToCloud();
    this.scene.start("BaseScene");
  }

  private mergeBackpackToStash(): void {
    const player = GameState.player;
    let stash = GameState.baseStash;
    for (const stack of player.backpack) {
      stash = addToStack(stash, stack.item_id, stack.count);
    }
    GameState.baseStash = stash;
    player.backpack = [];
  }

  // ---------- UI ----------

  public setCombatStatusesForTest(targetKey: string, statuses: CombatStatusInstance[]): void {
    this.combatStatusesByTarget.set(targetKey, statuses);
    this.updateDisplay();
  }

  public setDistanceBandForTest(band: DistanceBand): void {
    this.distanceBand = band;
    this.updateDisplay();
  }

  public setStatusPreviewForTest(actionKey: string, status: CombatStatusInstance | null): void {
    if (status === null) {
      this.statusPreviewByAction.delete(actionKey);
    } else {
      this.statusPreviewByAction.set(actionKey, status);
    }
    this.updateActionPreview();
  }

  private updateDisplay(): void {
    const player = GameState.player;
    const items = GameState.data.items;
    const weight = computeWeight(player.backpack, items);
    const combat = LAYOUT.combat;

    // Destroy old HP bars
    for (const c of this.children.list.filter((c) => c.getData("hpBar") === true)) {
      c.destroy();
    }

    // Hero HP bar (bottom-left card)
    const heroBarX = 50;
    const heroBarY = 580;
    const [bgHero, barHero] = createHpBar(this, heroBarX, heroBarY, player.hp, player.hp_max, 240, 12);
    bgHero.setData("hpBar", true);
    barHero.setData("hpBar", true);
    this.add.text(heroBarX, heroBarY + 14, `HP ${player.hp.toFixed(0)}/${player.hp_max}`, {
      color: "#C8C0B0",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "12px",
    }).setData("hpBar", true);

    if (this.heroPanel) {
      this.heroPanel.setText(
        `Ур. ${player.level} · Вес ${weight.toFixed(1)}/${player.max_weight_kg} кг`,
      );
      this.heroPanel.setFontSize("13px");
    }

    if (this.enemyPanel) {
      this.enemyPanel.setText("");
    }

    // Enemy HP bars (top-right HUD, выше моба чтобы не перекрывались)
    const enemyBarX = W - 290;
    let enemyY = 150;
    this.mobs.forEach((inst) => {
      if (inst.state.fled || inst.state.hp <= 0) return;

      const intent = deriveVisibleEnemyIntent(inst.mob, inst.state);
      this.add.text(enemyBarX, enemyY, `${inst.mob.name_ru} [Намерение: ${intent.labelRu}]`, {
        color: "#C8C0B0",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
      }).setData("hpBar", true);

      const [bgE, barE] = createHpBar(this, enemyBarX, enemyY + 18, inst.state.hp, inst.state.hp_max, 240, 10);
      bgE.setData("hpBar", true);
      barE.setData("hpBar", true);

      if (inst.state.cover_active) {
        this.add.text(enemyBarX + 250, enemyY + 18, "🛡️", { fontSize: "12px" })
          .setOrigin(0.5).setData("hpBar", true);
      }

      // Render status chips if any
      const mobStatuses = this.combatStatusesByTarget.get(inst.mob.id) ?? [];
      const { visible: visMob, overflowCount: overMob } = limitCombatStatusesForDisplay(mobStatuses, 3);
      const mobChips = visMob.map(formatCombatStatusChip);
      const mobOverflow = formatStatusOverflowChip(overMob);
      if (mobOverflow) {
        mobChips.push(mobOverflow);
      }
      if (mobChips.length > 0) {
        this.add.text(enemyBarX, enemyY + 32, mobChips.join(" · "), {
          color: "#FFAAAA",
          fontFamily: "Roboto Condensed, sans-serif",
          fontSize: "11px",
          fontStyle: "bold",
        }).setData("hpBar", true);
        enemyY += 52;
      } else {
        enemyY += 40;
      }
    });

    if (this.logText) {
      this.logText.setText(this.logLines.slice(-3).join("\n"));
    }

    // M9: render mob sprites (landscape positions from LAYOUT.combat)
    for (const c of this.children.list.filter((c) => c.getData("mobSprite") === true)) {
      c.destroy();
    }
    const firstAlive = this.mobs.find((m) => m.state.hp > 0 && !m.state.fled);
    this.mobs.forEach((inst, idx) => {
      const alive = inst.state.hp > 0 && !inst.state.fled;
      if (!alive) return;
      const x = combat.mobX + idx * 40;
      const y = combat.mobY;
      const isTarget = inst === firstAlive;
      if (isTarget) {
        // Target highlight ring (size matches sprite at scale 2.5)
        this.add.rectangle(x, y, 340, 340, 0x000000, 0)
          .setStrokeStyle(3, 0xc5a267, 0.8).setData("mobSprite", true);
      }
      const texKey = `mob_${inst.mob.id}`;
      if (this.textures.exists(texKey)) {
        const spr = this.add.image(x, y, texKey);
        spr.setScale(combat.spriteScale).setAlpha(0.95).setData("mobSprite", true);
      }
    });
    const bossInst = this.mobs.find((m) => m.isBoss);
    if (bossInst && this.phaseLabel) {
      this.phaseLabel.setText(`Фаза ${bossInst.state.phase}`);
    }

    this.updateActionPreview();
  }

  private noiseLevelLabel(): string {
    if (this.currentNoise >= 9) return "шум критический";
    if (this.currentNoise >= 6) return "опасно";
    if (this.currentNoise >= 3) return "слышно";
    return "тихо";
  }

  private updateActionPreview(): void {
    if (!this.apLabel || !this.actionPreviewLabel) return;
    const apPips = "●".repeat(this.currentAp).padEnd(DEFAULT_PLAYER_AP, "○");
    this.apLabel.setText(`AP ${apPips} ${this.currentAp}/${DEFAULT_PLAYER_AP}`);
    this.distanceLabel?.setText(getDistanceChipText(this.distanceBand));
    this.coverStatusLabel?.setText(GameState.currentSortie?.cover_active ? "Укрытие" : "");
    const levelLabel = this.noiseLevelLabel();
    if (levelLabel === "шум критический") {
      this.noiseLabel?.setText("Шум критический");
    } else {
      this.noiseLabel?.setText(`Шум: ${levelLabel}`);
    }

    if (this.heroStatusLabel) {
      const statuses = this.combatStatusesByTarget.get("hero") ?? [];
      const { visible, overflowCount } = limitCombatStatusesForDisplay(statuses, 3);
      const chips = visible.map(formatCombatStatusChip);
      const overflow = formatStatusOverflowChip(overflowCount);
      if (overflow) {
        chips.push(overflow);
      }
      this.heroStatusLabel.setText(chips.length > 0 ? chips.join(" · ") : "");
    }

    const firstAlive = this.mobs.find((m) => m.state.hp > 0 && !m.state.fled);
    const player = GameState.player;
    const items = GameState.data.items;
    const weaponItem = items[player.equipped_weapon_id];
    const isHeroAwaiting = this.state === "awaiting_hero";
    const hasMedkit = player.backpack.some((stack) => {
      const item = items[stack.item_id];
      return Boolean(item && item.type === "consumable" && item.stats.effect_type === "heal" && stack.count > 0);
    });

    const previewAction = (
      label: string,
      action: "attack" | "cover" | "heal" | "retreat",
      reason = getCombatActionDisabledReason({ action, currentAp: this.currentAp, available: isHeroAwaiting }),
      readyText = "готово",
    ): string => {
      const cost = getCombatActionCost(action);
      const suffix = reason ? formatCombatActionDisabledReason(reason) : readyText;
      return `${label} ${cost} AP: ${suffix}`;
    };

    const attackReason = getCombatActionDisabledReason({
      action: "attack",
      currentAp: this.currentAp,
      hasValidTarget: Boolean(firstAlive),
      available: isHeroAwaiting && Boolean(weaponItem),
    });
    const healReason = getCombatActionDisabledReason({
      action: "heal",
      currentAp: this.currentAp,
      hasMedkit,
      available: isHeroAwaiting,
    });
    const attackNoiseDeltaPreview = (() => {
      if (attackReason || !weaponItem) return "";
      const currentMagazine = this.currentMagazineByWeaponId.get(player.equipped_weapon_id)?.count ?? 0;
      const shotPlan = computeMagazineShotPlan({
        weapon: weaponItem as unknown as AmmoWeaponLike,
        currentMagazine,
      });
      if (!shotPlan.ok) return "";

      return ` · ${formatNoiseDelta(getNoiseDeltaForAction("valid_firearm_shot"))}`;
    })();

    const isRanged = Boolean(weaponItem && getRangedWeaponStats(weaponItem));
    let isFallback = false;
    if (isRanged && weaponItem) {
      const currentMagazine = this.currentMagazineByWeaponId.get(player.equipped_weapon_id)?.count ?? 0;
      const shotPlan = computeMagazineShotPlan({
        weapon: weaponItem as unknown as AmmoWeaponLike,
        currentMagazine,
      });
      if (!shotPlan.ok) {
        isFallback = true;
      }
    }
    const showStatusPreview = !attackReason && !isFallback;

    const attackStatusPreview = (() => {
      if (!showStatusPreview) return "";
      const previewStatus = this.statusPreviewByAction.get("attack");
      if (!previewStatus) return "";
      try {
        return ` · ${formatCombatStatusChip(previewStatus)}`;
      } catch {
        return "";
      }
    })();

    const attackReady = `цель ${firstAlive?.mob.name_ru ?? "—"}${attackNoiseDeltaPreview}${attackStatusPreview}`;

    this.actionPreviewLabel.setText(
      [
        [
          previewAction("Атака", "attack", attackReason, attackReady),
          previewAction("Укрытие", "cover"),
          previewAction("Аптечка", "heal", healReason),
          previewAction("Отступ", "retreat"),
        ].join(" · "),
        [
          this.formatDistanceMovePreview("closer"),
          this.formatDistanceMovePreview("away"),
        ].join(" · "),
      ].join("\n"),
    );

    if (this.ammoPreviewLabel) {
      if (!weaponItem) {
        this.ammoPreviewLabel.setText("Оружие ближнего боя · Перезарядка: не огнестрельное оружие");
      } else {
        const specResult = getWeaponAmmoSpec(weaponItem as unknown as AmmoWeaponLike);
        if (!specResult.ok) {
          const reasonLabel = getAmmoDisabledReasonLabel(specResult.reason);
          if (specResult.reason === "not_ranged_weapon") {
            this.ammoPreviewLabel.setText(`Оружие ближнего боя · Перезарядка: ${reasonLabel}`);
          } else {
            this.ammoPreviewLabel.setText(`Магазин: не подключён · Перезарядка: ${reasonLabel}`);
          }
        } else {
          const spec = specResult.spec;
          const ammoItem = items[spec.ammoId];
          const ammoName = ammoItem?.name_ru ?? spec.ammoId;
          const reserve = getReserveAmmoCount(player.backpack, spec.ammoId);
          
          const currentMagazine = this.currentMagazineByWeaponId.get(player.equipped_weapon_id)?.count ?? 0;
          const disabledReason = computeAmmoDisabledReason({
            weapon: weaponItem as unknown as AmmoWeaponLike,
            backpack: player.backpack,
            currentMagazine,
            magazineCapacity: spec.magazineCapacity,
          });

          const capacityStr = spec.magazineCapacity !== null ? String(spec.magazineCapacity) : "неизвестна";
          const magazinePreview = `Магазин: ${currentMagazine}/${capacityStr}`;
          
          let reloadStatus: string;
          if (disabledReason) {
            reloadStatus = getAmmoDisabledReasonLabel(disabledReason);
          } else {
            reloadStatus = "готово";
          }
          if (spec.fallbackReason === "unsupported_weapon_metadata") {
            reloadStatus += " (неполные данные)";
          }

          this.ammoPreviewLabel.setText(
            `${magazinePreview} · Патроны: ${ammoName} · Запас: ${reserve} · Перезарядка: ${reloadStatus}`
          );
        }
      }
    }
  }

  private formatDistanceMovePreview(direction: DistanceMoveDirection): string {
    const plan = computeDistanceMovePlan({ current: this.distanceBand, direction });
    const label = direction === "closer" ? "Ближе" : "Дальше";
    if (!plan.ok) {
      return `${label} ${plan.apCost} AP: ${getDistanceMoveDisabledReasonLabel(plan.reason)}`;
    }
    return `${label} ${plan.apCost} AP: предпросмотр`;
  }

  private log(message: string): void {
    this.logLines.push(message);
    if (this.logText) {
      this.logText.setText(this.logLines.slice(-3).join("\n"));
    }
  }

  private flashDamage(): void {
    const overlay = this.add.rectangle(CX, CY, W, H, 0xff0000, 0).setAlpha(0);
    const tween = runTween(this, "tween_damage_flash", overlay);
    tween?.once("complete", () => overlay.destroy());
  }
}
