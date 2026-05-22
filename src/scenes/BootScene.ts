import Phaser from "phaser";
import { GameState, setContent } from "../state/GameState";
import type { ContentData } from "../state/types";
import type { Item, Mob, Perk, RadioSignal, Recipe, Zone } from "../types";
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
      // M3: radio.json loaded in parallel; failure or [] is fine (UI shows "Эфир пуст").
      const [items, mobs, recipes, zones, radioSignals, perks] = await Promise.all([
        loadJson<Item[]>("content/items.json"),
        loadJson<Mob[]>("content/mobs.json"),
        loadJson<Recipe[]>("content/recipes.json"),
        loadJson<Zone[]>("content/zones.json"),
        loadJson<RadioSignal[]>("content/radio.json").catch(() => [] as RadioSignal[]),
        loadJson<Perk[]>("content/perks.json").catch(() => [] as Perk[]),
      ]);
      // Soft-warn instead of hard-fail during parallel Content+Engineer+Artist work
      // on M3 — Content PR is still in flight, so M2 (15/3/5/1) and M3 (29/8/15/3)
      // are both acceptable counts and any other shape just logs a console warning.
      const m1 = { items: 15, mobs: 3, recipes: 5, zones: 1 };
      const m3 = { items: 29, mobs: 8, recipes: 15, zones: 3 };
      const matchesShape = (t: typeof m1): boolean =>
        items.length === t.items &&
        mobs.length === t.mobs &&
        recipes.length === t.recipes &&
        zones.length === t.zones;
      if (!matchesShape(m1) && !matchesShape(m3)) {
        console.warn(
          `[BootScene] Content count mismatch (soft): items=${items.length} ` +
            `(expected ${m1.items} M2 or ${m3.items} M3), mobs=${mobs.length} ` +
            `(${m1.mobs}/${m3.mobs}), recipes=${recipes.length} ` +
            `(${m1.recipes}/${m3.recipes}), zones=${zones.length} ` +
            `(${m1.zones}/${m3.zones}).`,
        );
      }
      const data: ContentData = {
        items: indexBy(items),
        mobs: indexBy(mobs),
        recipes: indexBy(recipes),
        zones: indexBy(zones),
        radioSignals,
        perks,
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
