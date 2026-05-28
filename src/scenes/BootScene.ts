import Phaser from "phaser";
import { GameState, setContent } from "../state/GameState";
import type { ContentData } from "../state/types";
import type { Item, Mob, Perk, RadioSignal, Recipe, Zone } from "../types";
import { setSfxRegistry, preloadSfx, loadSfxRegistry } from "../systems/audio";
import { softWarnCounts, validateRecipeRefs } from "../systems/dataValidation";
import { loadJson } from "../utils/loader";
import { createSubtitle, createTitle } from "./sceneUi";
import { initPlatform } from "../systems/platform";
import { loadFromCloud, applySnapshot } from "../systems/cloudSave";
import { sessionStart } from "../systems/telemetry";
import { CY } from "../ui/layout";

const ITEM_ICON_IDS = [
  "wood", "scrap", "cloth", "food", "water", "gunpowder", "leather", "rope",
  "knife", "makeshift_pistol", "cloth_jacket", "leather_vest", "bandage", "medkit", "ammo_pistol", "electronics",
  "oil", "medical_supplies", "circuitry", "pipe_rifle", "crowbar", "tactical_vest", "helmet", "gas_mask",
  "large_medkit", "energy_drink", "emp_grenade", "smoke_bomb", "ammo_rifle", "mutated_gland", "prime_circuit", "captain_insignia",
  "composite_blade", "prime_shotgun", "captain_armor", "suburban_scrap", "garden_seed", "school_book", "broken_tablet", "machine_part",
  "industrial_cable", "hospital_supply", "sterile_wrap", "metro_token", "rail_shard", "reactor_ash", "copper_coil", "shiv",
  "machete", "sledgehammer", "spear", "cleaver", "crossbow", "hunting_rifle", "flare_pistol", "sawed_off",
  "riot_shield", "scout_mask", "padded_coat", "ballistic_vest", "medical_gown", "insulated_vest", "metal_helm", "reinforced_gloves",
  "tactical_pants", "heal_salve", "stimpack", "adrenaline_shot", "tear_gas", "ammo_bolt", "ammo_flare", "electrolyte",
  "speed_drug", "decoy_flare", "pulse_grenade", "smoke_grenade", "energy_gel", "ration_bar", "healing_patch", "makeshift_grenade",
];

const MOB_SPRITE_IDS = [
  "marauder",
  "wild_dog",
  "mutant",
  "looter_sniper",
  "armored_guard",
  "fanatic_berserker",
  "pack_rat",
  "relic_drone",
];

const ZONE_BG_IDS = [
  "forest", "warehouse", "city",
  "suburbs", "school", "factory", "hospital", "metro", "power_plant",
];

const indexBy = <T extends { id: string }>(arr: T[]): Record<string, T> => {
  const out: Record<string, T> = {};
  for (const item of arr) out[item.id] = item;
  return out;
};

export class BootScene extends Phaser.Scene {
  private status?: Phaser.GameObjects.Text;

  public constructor() {
    super("BootScene");
  }

  public preload(): void {
    this.load.image("hero", "assets/sprites/hero.png");
    this.load.image("base_interior", "assets/backgrounds/base_interior_painted.jpg");
    this.load.image("world_map", "assets/backgrounds/world_map_painted.jpg");
    for (const id of ZONE_BG_IDS) {
      this.load.image(`bg_${id}`, `assets/backgrounds/${id}.png`);
    }
    for (const id of ITEM_ICON_IDS) {
      this.load.image(`item_${id}`, `assets/sprites/items/${id}.png`);
    }
    for (const id of MOB_SPRITE_IDS) {
      this.load.image(`mob_${id}`, `assets/sprites/mobs/${id}.png`);
    }
    const PERK_IDS = [
      "tough_skin", "sharp_blade", "lean_pack", "lucky_scavenger",
      "keen_eye", "reinforced_plates", "quick_hands", "fast_learner"
    ];
    for (const id of PERK_IDS) {
      this.load.image(`perk_${id}`, `assets/sprites/perks/perk_${id}.png`);
    }
  }

  public create(): void {
    createTitle(this, "ОПЛОТ");
    this.status = createSubtitle(this, CY, "Загрузка контента...");
    void this.loadContent();
  }

  private async loadContent(): Promise<void> {
    try {
      // M3: radio.json loaded in parallel; failure or [] is fine (UI shows "Эфир пуст").
      const [items, mobs, recipes, zones, radioSignals, perks] = await Promise.all([
        loadJson<Item[]>("content/items.json"),
        loadJson<Mob[]>("content/mobs.json"),
        loadJson<Recipe[]>("content/recipes.json"),
        loadJson<Zone[]>("content/zones.json"),
        loadJson<RadioSignal[]>("content/radio.json").catch(() => [] as RadioSignal[]),
        loadJson<Perk[]>("content/perks.json").catch(() => [] as Perk[]),
      ]);
      const data: ContentData = {
        items: indexBy(items),
        mobs: indexBy(mobs),
        recipes: indexBy(recipes),
        zones: indexBy(zones),
        radioSignals,
        perks,
      };
      softWarnCounts(data);
      const recipeIssues = validateRecipeRefs(data);
      if (recipeIssues.length > 0) {
        console.warn(
          `[BootScene] Recipe reference mismatch (soft): ${recipeIssues.join("; ")}`,
        );
      }

      const sfxReg = await loadSfxRegistry();
      if (sfxReg) {
        setSfxRegistry(sfxReg);
        preloadSfx(this);
        this.load.start();
      }

      GameState.reset();
      setContent(data);

      const platform = await initPlatform();
      platform.sdk?.features?.LoadingAPI?.ready();

      const snapshot = await loadFromCloud();
      if (snapshot) {
        applySnapshot(snapshot);
      }

      sessionStart({
        level: GameState.player.level,
        is_returning: snapshot !== null,
        sorties_completed: Object.keys(GameState.progress.daily_completed).length,
      });

      this.scene.start("BaseScene");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.fail(`Ошибка загрузки: ${message}`);
    }
  }

  private fail(message: string): void {
    if (this.status) {
      this.status.setText(message).setColor("#FF6B6B");
    }
  }
}
