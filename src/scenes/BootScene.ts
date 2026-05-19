import Phaser from "phaser";
import { GameState, setContent } from "../state/GameState";
import type { ContentData } from "../state/types";
import type { Item, Mob, Recipe, Zone } from "../types";
import { loadJson } from "../utils/loader";
import { createSubtitle, createTitle } from "./sceneUi";

const ITEM_ICON_IDS = [
  "wood",
  "scrap",
  "cloth",
  "food",
  "water",
  "gunpowder",
  "leather",
  "rope",
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
    this.load.image("forest", "assets/backgrounds/forest.png");
    for (const id of ITEM_ICON_IDS) {
      this.load.image(`item_${id}`, `assets/sprites/items/${id}.png`);
    }
  }

  public create(): void {
    createTitle(this, "ОПЛОТ");
    this.status = createSubtitle(this, 200, "Загрузка контента...");
    void this.loadContent();
  }

  private async loadContent(): Promise<void> {
    try {
      const [items, mobs, recipes, zones] = await Promise.all([
        loadJson<Item[]>("content/items.json"),
        loadJson<Mob[]>("content/mobs.json"),
        loadJson<Recipe[]>("content/recipes.json"),
        loadJson<Zone[]>("content/zones.json"),
      ]);
      const expected = { items: 15, mobs: 3, recipes: 5, zones: 1 } as const;
      if (
        items.length !== expected.items ||
        mobs.length !== expected.mobs ||
        recipes.length !== expected.recipes ||
        zones.length !== expected.zones
      ) {
        this.fail(
          `Несоответствие контента: items=${items.length}/15, mobs=${mobs.length}/3, recipes=${recipes.length}/5, zones=${zones.length}/1`,
        );
        return;
      }
      const data: ContentData = {
        items: indexBy(items),
        mobs: indexBy(mobs),
        recipes: indexBy(recipes),
        zones: indexBy(zones),
      };
      GameState.reset();
      setContent(data);
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
