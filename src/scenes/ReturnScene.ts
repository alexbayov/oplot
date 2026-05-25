import Phaser from "phaser";
import { GameState, addToStack } from "../state/GameState";
import { markDailyCompleted } from "../systems/dailyInstance";
import { tickRadioOnReturn } from "../systems/radio";
import { computePerkModifiers } from "../systems/perks";
import { computeReturnTime, computeWeight } from "../systems/weight";
import { applySortieCompletion } from "../systems/zoneUnlock";
import {
  createPanel,
  createSubtitle,
  createTitle,
} from "./sceneUi";

// GDD §1 «Core Loop»: LootScene → ReturnScene → BaseScene.
// Duration = return_time_s from balance.md §Формулы; heavy pack = longer trip.
// No skip — weight = time = risk is the whole point of the mechanic.
// M3 (§6.4.M3.4): zone-specific return_time_multiplier scales the base trip duration;
// M3 (§6.4.M3.3): on successful return we flip the appropriate unlock_condition flag;
// M3 (§10.M3.3): every return decrements radioSignal.expires_after_sorties by 1.
export class ReturnScene extends Phaser.Scene {
  private progressFill?: Phaser.GameObjects.Rectangle;

  public constructor() {
    super("ReturnScene");
  }

  public create(): void {
    createTitle(this, "Возврат на базу");

    const player = GameState.player;
    const sortie = GameState.currentSortie;
    const zone = sortie ? GameState.data.zones[sortie.zone_id] : null;
    const zoneMultiplier = zone?.return_time_multiplier ?? 1.0;
    const curWeight = computeWeight(player.backpack, GameState.data.items);
    const mods = computePerkModifiers(player.perks);
    const returnTimeS = computeReturnTime(
      curWeight,
      player.max_weight_kg,
      zoneMultiplier,
      mods.weight_penalty_multiplier,
    );

    createPanel(this, 180, 200, 320, 80);
    createSubtitle(this, 180, `Вес ${curWeight.toFixed(1)}/${player.max_weight_kg} кг`);
    const zoneLabel = zone ? ` · ${zone.name_ru}` : "";
    createSubtitle(this, 220, `Время возврата: ${returnTimeS.toFixed(0)}с${zoneLabel}`);

    // Progress bar: filled rect grows from 0 → barWidth over returnTimeS seconds.
    const barWidth = 280;
    const barHeight = 20;
    const barX = 180 - barWidth / 2;
    const barY = 320;
    this.add
      .rectangle(barX, barY, barWidth, barHeight, 0x2a2a2a, 1)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x5f5a50, 1);
    this.progressFill = this.add
      .rectangle(barX, barY, 0, barHeight, 0x6f8a4d, 1)
      .setOrigin(0, 0.5);

    this.tweens.add({
      targets: this.progressFill,
      width: barWidth,
      duration: returnTimeS * 1000,
      ease: "Linear",
      onComplete: () => this.completeReturn(),
    });
  }

  private completeReturn(): void {
    const player = GameState.player;
    const sortie = GameState.currentSortie;
    const zone = sortie ? GameState.data.zones[sortie.zone_id] : null;
    // Successful return: flip unlock flags BEFORE clearing the sortie. fights_completed > 0
    // guards against marking "completed" if the hero immediately retreated.
    if (sortie && zone && sortie.fights_completed > 0) {
      GameState.progress = applySortieCompletion(
        GameState.progress,
        zone,
        sortie.depth,
        true,
      );
      // M5: mark daily instance cooldown after successful return from boss zone.
      if (zone.boss_id) {
        markDailyCompleted(GameState.progress, zone.id, Date.now());
      }
    }
    // M3 radio tick — anti-scope: state only, no rewards/ambush.
    tickRadioOnReturn(GameState.data.radioSignals);
    // Merge backpack into stash (logic moved from LootScene.endSortie).
    let stash = GameState.baseStash;
    for (const stack of player.backpack) {
      stash = addToStack(stash, stack.item_id, stack.count);
    }
    GameState.baseStash = stash;
    player.backpack = [];
    player.hp = player.hp_max;
    GameState.currentSortie = null;
    this.scene.start("BaseScene");
  }
}
