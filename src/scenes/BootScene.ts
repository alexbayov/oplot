import Phaser from "phaser";
import { GameState, setContent } from "../state/GameState";
import type { ContentData } from "../state/types";
import type { Item, Mob, Perk, RadioSignal, Recipe, Zone } from "../types";
import { setSfxRegistry, preloadSfx, loadSfxRegistry, type SfxRegistry } from "../systems/audio";
import { softWarnCounts, validateRecipeRefs } from "../systems/dataValidation";
import { loadJson } from "../utils/loader";
import { createSubtitle, createTitle } from "./sceneUi";
import { initPlatform } from "../systems/platform";
import { loadFromCloud, applySnapshot } from "../systems/cloudSave";

const ITEM_ICON_IDS = [
  "wood",
  "scrap",
  "cloth",
  "food",
  "water",
  "gunpowder",
  "leather",
  "rope",
  "ammo_rifle",
  "circuitry",
  "electronics",
  "oil",
  "medical_supplies",
  "crowbar",
  "pipe_rifle",
  "tactical_vest",
  "helmet",
  "gas_mask",
  "large_medkit",
  "energy_drink",
  "smoke_bomb",
  "emp_grenade",
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

const ZONE_BG_IDS = ["forest", "warehouse", "city"];

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
    for (const id of ZONE_BG_IDS) {
      this.load.image(`bg_${id}`, `assets/backgrounds/${id}.png`);
    }
    for (const id of ITEM_ICON_IDS) {
      this.load.image(`item_${id}`, `assets/sprites/items/${id}.png`);
    }
    for (const id of MOB_SPRITE_IDS) {
      this.load.image(`mob_${id}`, `assets/sprites/mobs/${id}.png`);
    }
    this.load.json("sfx_registry", "content/sfx.json");
  }

  public create(): void {
    createTitle(this, "ОПЛОТ");
    this.status = createSubtitle(this, 200, "Загрузка контента...");
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

      const sfxReg = this.cache.json.get("sfx_registry") as SfxRegistry | undefined;
      if (sfxReg) {
        setSfxRegistry(sfxReg);
        preloadSfx(this);
        this.load.start();
      } else {
        await loadSfxRegistry();
      }

      GameState.reset();
      setContent(data);

      const platform = await initPlatform();
      platform.sdk?.features?.LoadingAPI?.ready();

      const snapshot = await loadFromCloud();
      if (snapshot) {
        applySnapshot(snapshot);
      }

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
