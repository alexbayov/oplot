import Phaser from "phaser";
import {
  GameState,
  addToStack,
  countInStacks,
  removeFromStack,
} from "../state/GameState";
import type { InventoryStack } from "../state/types";
import {
  applyAttack,
  calcDefenseAgainst,
  calcHeroInitiative,
  chooseMobAction,
  getArmorStats,
  getMeleeWeaponStats,
  getRangedWeaponStats,
} from "../systems/combat";
import { generateMobLoot } from "../systems/loot";
import { applyLootLoss, computeWeight } from "../systems/weight";
import type { ConsumableItem, Mob } from "../types";
import {
  createButton,
  createPanel,
  createSubtitle,
  createTitle,
} from "./sceneUi";

interface MobInstance {
  mob: Mob;
  hp: number;
  fled: boolean;
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
  private heroPanel?: Phaser.GameObjects.Text;
  private enemyPanel?: Phaser.GameObjects.Text;
  private buttonsContainer: Phaser.GameObjects.Container[] = [];

  public constructor() {
    super("CombatScene");
  }

  public create(): void {
    const sortie = GameState.currentSortie;
    if (!sortie) {
      createTitle(this, "Бой");
      createSubtitle(this, 200, "Вылазка не активна.");
      createButton(this, 400, "В Оплот", () => this.scene.start("BaseScene"));
      return;
    }
    const enemyIds = sortie.encounters[sortie.fights_completed] ?? [];
    this.mobs = enemyIds
      .map((id) => GameState.data.mobs[id])
      .filter((m): m is Mob => Boolean(m))
      .map((mob) => ({ mob, hp: mob.hp, fled: false }));
    sortie.cover_active = false;

    createTitle(this, "Бой");
    createPanel(this, 180, 170, 320, 130);
    this.heroPanel = createSubtitle(this, 150, "");
    this.enemyPanel = createSubtitle(this, 200, "");

    createPanel(this, 180, 290, 320, 90);
    this.logText = this.add
      .text(180, 290, "", {
        align: "center",
        color: "#C8C0B0",
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    this.buttonsContainer.push(
      createButton(this, 384, "Атака", () => this.onHeroAttack()),
      createButton(this, 432, "Укрытие", () => this.onHeroCover()),
      createButton(this, 480, "Аптечка", () => this.onHeroHeal()),
      createButton(this, 528, "Отступить", () => this.onHeroRetreat()),
    );

    this.updateDisplay();
    this.startRound();
  }

  // ---------- turn loop ----------

  private startRound(): void {
    if (this.checkEnd()) return;
    this.turnQueue = this.computeTurnOrder();
    this.advanceTurn();
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
      if (inst.hp <= 0 || inst.fled) return;
      order.push({ kind: "mob", mobIndex: idx, initiative: inst.mob.base_speed });
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
      // Cover expires on hero's own next turn.
      const sortie = GameState.currentSortie;
      if (sortie) sortie.cover_active = false;
      this.state = "awaiting_hero";
      this.updateDisplay();
      return;
    }
    if (entry.mobIndex !== undefined) {
      this.runMobTurn(entry.mobIndex);
    }
  }

  private runMobTurn(mobIndex: number): void {
    const inst = this.mobs[mobIndex];
    if (!inst || inst.hp <= 0 || inst.fled) {
      this.advanceTurn();
      return;
    }
    const action = chooseMobAction(inst.mob, inst.hp);
    if (action.type === "flee") {
      inst.fled = true;
      this.log(`${inst.mob.name_ru} убегает.`);
      this.updateDisplay();
      this.time.delayedCall(250, () => this.advanceTurn());
      return;
    }
    // Mob attacks hero.
    const player = GameState.player;
    const armorItem = GameState.data.items[player.equipped_armor_id];
    const armorStats = armorItem ? getArmorStats(armorItem) : null;
    const sortie = GameState.currentSortie;
    const cover = sortie?.cover_active ?? false;
    const defense = calcDefenseAgainst(armorStats, inst.mob.type, cover);
    const result = applyAttack(
      { damage_min: inst.mob.damage_min, damage_max: inst.mob.damage_max },
      defense,
      player.hp,
    );
    player.hp = result.defender_hp_after;
    this.log(
      `${inst.mob.name_ru} бьёт на ${result.damage_dealt.toFixed(1)} (HP: ${player.hp.toFixed(0)})`,
    );
    this.updateDisplay();
    this.time.delayedCall(250, () => this.advanceTurn());
  }

  // ---------- hero actions ----------

  private onHeroAttack(): void {
    if (this.state !== "awaiting_hero") return;
    const aliveIdx = this.mobs.findIndex((m) => m.hp > 0 && !m.fled);
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
      // Consume ammo if available; otherwise fall back to 1 dmg jab.
      const ammoHave = countInStacks(player.backpack, ranged.ammo_id);
      if (ammoHave >= ranged.ammo_per_shot) {
        player.backpack = removeFromStack(player.backpack, ranged.ammo_id, ranged.ammo_per_shot);
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
    const result = applyAttack(weaponStats, target.mob.defense, target.hp);
    target.hp = result.defender_hp_after;
    this.log(
      `Герой бьёт ${target.mob.name_ru} на ${result.damage_dealt.toFixed(1)} (HP: ${target.hp.toFixed(0)})`,
    );
    this.updateDisplay();
    this.state = "resolving_mobs";
    this.time.delayedCall(250, () => this.advanceTurn());
  }

  private onHeroCover(): void {
    if (this.state !== "awaiting_hero") return;
    const sortie = GameState.currentSortie;
    if (sortie) sortie.cover_active = true;
    this.log("Герой в укрытии (+50% защиты).");
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
    // Prefer lower-value heal first to save medkit for emergencies.
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
    this.updateDisplay();
    this.state = "resolving_mobs";
    this.time.delayedCall(250, () => this.advanceTurn());
  }

  private onHeroRetreat(): void {
    if (this.state !== "awaiting_hero") return;
    this.state = "ended";
    const sortie = GameState.currentSortie;
    // Retreat abandons the current fight without ending the sortie:
    // hero returns to SortieScene if any fights remain, otherwise to BaseScene.
    if (sortie && sortie.fights_completed < sortie.fights_total) {
      sortie.cover_active = false;
      this.scene.start("SortieScene");
      return;
    }
    this.endSortie("retreat");
  }

  // ---------- end conditions ----------

  private checkEnd(): boolean {
    if (this.state === "ended") return true;
    const player = GameState.player;
    if (player.hp <= 0) {
      this.endCombatDefeat();
      return true;
    }
    const allDownOrFled = this.mobs.every((m) => m.hp <= 0 || m.fled);
    if (allDownOrFled) {
      this.endCombatVictory();
      return true;
    }
    return false;
  }

  private endCombatVictory(): void {
    this.state = "ended";
    const sortie = GameState.currentSortie;
    if (!sortie) {
      this.scene.start("BaseScene");
      return;
    }
    // Award XP per defeated (non-fled) mob.
    let xpGain = 0;
    let mobLoot: InventoryStack[] = [];
    for (const inst of this.mobs) {
      if (inst.fled) continue;
      xpGain += inst.mob.xp_reward;
      const drops = generateMobLoot(inst.mob);
      for (const stack of drops) {
        mobLoot = addToStack(mobLoot, stack.item_id, stack.count);
      }
    }
    GameState.player.xp += xpGain;
    // Drain zone loot proportionally.
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
    this.scene.start("LootScene");
  }

  private endCombatDefeat(): void {
    this.state = "ended";
    this.endSortie("defeat");
  }

  private endSortie(reason: "retreat" | "defeat"): void {
    const player = GameState.player;
    const items = GameState.data.items;
    if (reason === "defeat") {
      player.backpack = applyLootLoss(player.backpack, items);
    }
    this.mergeBackpackToStash();
    player.hp = player.hp_max;
    GameState.currentSortie = null;
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

  private updateDisplay(): void {
    const player = GameState.player;
    const items = GameState.data.items;
    const weight = computeWeight(player.backpack, items);
    if (this.heroPanel) {
      this.heroPanel.setText(
        `Герой HP: ${player.hp.toFixed(0)}/${player.hp_max} · Вес ${weight.toFixed(1)}/${player.max_weight_kg} кг`,
      );
    }
    if (this.enemyPanel) {
      const lines = this.mobs.map((inst) => {
        if (inst.fled) return `${inst.mob.name_ru}: убежал`;
        if (inst.hp <= 0) return `${inst.mob.name_ru}: повержен`;
        return `${inst.mob.name_ru}: ${inst.hp.toFixed(0)}/${inst.mob.hp}`;
      });
      this.enemyPanel.setText(lines.join("\n"));
    }
    if (this.logText) {
      this.logText.setText(this.logLines.slice(-3).join("\n"));
    }
  }

  private log(message: string): void {
    this.logLines.push(message);
    if (this.logText) {
      this.logText.setText(this.logLines.slice(-3).join("\n"));
    }
  }
}
