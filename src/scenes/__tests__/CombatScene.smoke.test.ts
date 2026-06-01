/* eslint-disable @typescript-eslint/no-unused-vars */
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("phaser", () => ({
  default: {
    Scene: class {},
    Input: {
      Events: {
        GAMEOBJECT_POINTER_OVER: "pointerover",
        GAMEOBJECT_POINTER_OUT: "pointerout",
        GAMEOBJECT_POINTER_UP: "pointerup",
      },
    },
    Math: {
      Easing: {
        Linear: "Linear",
        Elastic: { Out: "Elastic.Out" },
        Sine: { Out: "Sine.Out", InOut: "Sine.InOut" },
        Back: { Out: "Back.Out" },
        Cubic: { Out: "Cubic.Out", InOut: "Cubic.InOut" },
        Quintic: { Out: "Quintic.Out" },
        Quadratic: { Out: "Quadratic.Out" },
      },
    },
  },
}));
import { CombatScene } from "../CombatScene";
import { GameState, setContent } from "../../state/GameState";
import type { ContentData, InventoryStack } from "../../state/types";
import type { Item, Mob, Zone } from "../../types";

vi.mock("../../systems/banner", () => ({
  hideBanner: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../systems/cloudSave", () => ({
  saveToCloud: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../systems/ads", () => ({
  showRewardedVideo: vi.fn((_placement: string, onRewarded: () => void) => {
    onRewarded();
  }),
}));

vi.mock("../../systems/telemetry", () => ({
  track: vi.fn(),
}));

type EventHandler = () => void;

interface TweenConfig {
  onComplete?: () => void;
}

class FakeGameObject {
  public x: number;
  public y: number;
  public alpha = 1;
  public scaleX = 1;
  public scaleY = 1;
  public width = 0;
  public height = 0;
  public angle = 0;
  public scrollX = 0;
  public scrollY = 0;
  public destroyed = false;
  public text = "";
  public readonly data = new Map<string, unknown>();
  public readonly events = new Map<string, EventHandler>();

  public constructor(x = 0, y = 0, text = "") {
    this.x = x;
    this.y = y;
    this.text = text;
  }

  public setAlpha(value: number): this {
    this.alpha = value;
    return this;
  }

  public setDisplaySize(width: number, height: number): this {
    this.width = width;
    this.height = height;
    return this;
  }

  public setDepth(_value: number): this {
    return this;
  }

  public setOrigin(_x?: number, _y?: number): this {
    return this;
  }

  public setScale(value: number): this {
    this.scaleX = value;
    this.scaleY = value;
    return this;
  }

  public setFlipX(_value: boolean): this {
    return this;
  }

  public setData(key: string, value: unknown): this {
    this.data.set(key, value);
    return this;
  }

  public getData(key: string): unknown {
    return this.data.get(key);
  }

  public setStrokeStyle(_width: number, _color: number, _alpha?: number): this {
    return this;
  }

  public setFontSize(_value: string): this {
    return this;
  }

  public setText(value: string): this {
    this.text = value;
    return this;
  }

  public setColor(_value: string): this {
    return this;
  }

  public setStroke(_color: string, _thickness: number): this {
    return this;
  }

  public setSize(width: number, height: number): this {
    this.width = width;
    this.height = height;
    return this;
  }

  public setInteractive(_config?: unknown): this {
    return this;
  }

  public setScrollFactor(_value: number): this {
    return this;
  }

  public on(event: string, handler: EventHandler): this {
    this.events.set(event, handler);
    return this;
  }

  public destroy(): void {
    this.destroyed = true;
  }

  public clear(): this {
    return this;
  }

  public fillStyle(_color: number, _alpha?: number): this {
    return this;
  }

  public fillRect(_x: number, _y: number, _width: number, _height: number): this {
    return this;
  }

  public lineStyle(_width: number, _color: number, _alpha?: number): this {
    return this;
  }

  public strokeRect(_x: number, _y: number, _width: number, _height: number): this {
    return this;
  }

  public lineBetween(_x1: number, _y1: number, _x2: number, _y2: number): this {
    return this;
  }

  public fillCircle(_x: number, _y: number, _radius: number): this {
    return this;
  }

  public generateTexture(_key: string, _width: number, _height: number): this {
    return this;
  }
}

interface CombatSceneInternals {
  create: () => void;
  onHeroAttack: () => void;
  onHeroCover: () => void;
  onHeroHeal: () => void;
  onHeroReload: () => void;
  onHeroRetreat: () => void;
  checkEnd: () => boolean;
  updateActionPreview: () => void;
  updateDisplay: () => void;
  mobs: { state: { hp: number; fled?: boolean }; mob: Mob }[];
  state: string;
  logLines: string[];
  currentAp: number;
}

interface SceneHarness {
  scene: CombatScene;
  internals: CombatSceneInternals;
  starts: string[];
  launches: string[];
  textObjects: FakeGameObject[];
  delayed: EventHandler[];
}

const makeItem = (item: Item): Item => item;

const knife = makeItem({
  id: "knife",
  name_ru: "Нож",
  type: "weapon_melee",
  tier: 1,
  zone_origin: "test",
  weight_kg: 0.5,
  description_ru: "Test knife",
  flavor_ru: "",
  recipe_id: null,
  stats: {
    damage_min: 100,
    damage_max: 100,
    attack_speed: 100,
    noise: "low",
  },
});

const pmPistol = makeItem({
  id: "pm",
  name_ru: "Пистолет ПМ",
  type: "weapon_ranged",
  tier: 2,
  zone_origin: "test",
  weight_kg: 0.8,
  description_ru: "Пистолет Макарова",
  flavor_ru: "",
  recipe_id: null,
  stats: {
    damage_min: 5,
    damage_max: 7,
    attack_speed: 80,
    noise: "high",
    ammo_id: "ammo_9x18",
    ammo_per_shot: 1,
    magazine_size: 8,
  },
} as unknown as Item);

const ammo9x18 = makeItem({
  id: "ammo_9x18",
  name_ru: "Патроны 9x18",
  type: "resource",
  tier: 1,
  zone_origin: "test",
  weight_kg: 0.01,
  description_ru: "Патроны 9x18мм",
  flavor_ru: "",
  recipe_id: null,
  stats: {},
});

const brokenRangedPistol = makeItem({
  id: "broken_ranged_pistol",
  name_ru: "Сломанный огнестрел",
  type: "weapon_ranged",
  tier: 2,
  zone_origin: "test",
  weight_kg: 0.8,
  description_ru: "Сломанный огнестрел",
  flavor_ru: "",
  recipe_id: null,
  stats: {},
} as unknown as Item);

const invalidCapacityPistol = makeItem({
  id: "invalid_capacity_pistol",
  name_ru: "Пистолет без магазина",
  type: "weapon_ranged",
  tier: 2,
  zone_origin: "test",
  weight_kg: 0.8,
  description_ru: "Пистолет с дефектом магазина",
  flavor_ru: "",
  recipe_id: null,
  stats: {
    damage_min: 5,
    damage_max: 7,
    attack_speed: 80,
    noise: "high",
    ammo_id: "ammo_9x18",
    ammo_per_shot: 1,
    magazine_size: 0,
  },
} as unknown as Item);

const unknownAmmoPistol = makeItem({
  id: "unknown_ammo_pistol",
  name_ru: "Странный пистолет",
  type: "weapon_ranged",
  tier: 2,
  zone_origin: "test",
  weight_kg: 0.8,
  description_ru: "Странный пистолет",
  flavor_ru: "",
  recipe_id: null,
  stats: {
    damage_min: 5,
    damage_max: 7,
    attack_speed: 80,
    noise: "high",
    ammo_id: "ammo_unknown",
    ammo_per_shot: 1,
    magazine_size: 8,
  },
} as unknown as Item);

const apsFallbackPistol = makeItem({
  id: "aps",
  name_ru: "Стечкин АПС",
  type: "weapon_ranged",
  tier: 3,
  zone_origin: "test",
  weight_kg: 1.0,
  description_ru: "Пистолет Стечкина",
  flavor_ru: "",
  recipe_id: null,
  stats: {
    damage_min: 6,
    damage_max: 8,
    attack_speed: 90,
    noise: "high",
    ammo_id: "ammo_9x18",
    ammo_per_shot: 1,
  },
} as unknown as Item);

const armor = makeItem({
  id: "jacket",
  name_ru: "Куртка",
  type: "armor",
  tier: 1,
  zone_origin: "test",
  weight_kg: 1,
  description_ru: "Test armor",
  flavor_ru: "",
  recipe_id: null,
  stats: { defense: 1 },
});

const bandage = makeItem({
  id: "bandage",
  name_ru: "Бинт",
  type: "consumable",
  tier: 1,
  zone_origin: "test",
  weight_kg: 0.1,
  description_ru: "Test bandage",
  flavor_ru: "",
  recipe_id: null,
  stats: { effect_type: "heal", effect_value: 15, charges: 1 },
});

const testMob = (overrides: Partial<Mob> = {}): Mob => ({
  id: "marauder",
  name_ru: "Мародёр",
  type: "human",
  role: "regular",
  zone: "forest",
  level: 1,
  hp: 20,
  damage_min: 1,
  damage_max: 1,
  defense: 0,
  base_speed: 10,
  xp_reward: 1,
  behavior: "aggressive",
  description_ru: "Test mob",
  flavor_ru: "",
  drop_table: [],
  drops: [],
  ...overrides,
});

const zone: Zone = {
  id: "forest",
  name_ru: "Лес",
  level: 1,
  description_ru: "Test zone",
  resources: [],
  mobs: ["marauder"],
  boss_id: null,
  unique_resources: [],
  unlock_condition: "start",
  levels: [
    {
      depth: 1,
      enemies: ["marauder"],
      enemy_count: [1, 1],
      resources: [],
      resource_count: [0, 0],
      min_player_level: 1,
    },
  ],
};

const seedGameState = (backpack: InventoryStack[] = []): void => {
  GameState.reset();
  setContent({
    items: {
      [knife.id]: knife,
      [armor.id]: armor,
      [bandage.id]: bandage,
      [pmPistol.id]: pmPistol,
      [ammo9x18.id]: ammo9x18,
      [brokenRangedPistol.id]: brokenRangedPistol,
      [invalidCapacityPistol.id]: invalidCapacityPistol,
      [unknownAmmoPistol.id]: unknownAmmoPistol,
      [apsFallbackPistol.id]: apsFallbackPistol,
    },
    mobs: { marauder: testMob() },
    zones: { forest: zone },
    recipes: {},
    radioSignals: [],
    perks: {},
  } satisfies ContentData);
  GameState.player = {
    ...GameState.player,
    hp: 80,
    hp_max: 100,
    equipped_weapon_id: "knife",
    equipped_armor_id: "jacket",
    backpack,
    gas: 0,
  };
  GameState.currentSortie = {
    zone_id: "forest",
    depth: 1,
    fights_total: 2,
    fights_completed: 0,
    encounters: [["marauder"]],
    zone_loot_remaining: [],
    pending_loot: [],
    cover_active: false,
  };
};

const createSceneHarness = (): SceneHarness => {
  const scene = new CombatScene();
  const internals = scene as unknown as CombatSceneInternals;
  const objects: FakeGameObject[] = [];
  const textObjects: FakeGameObject[] = [];
  const delayed: EventHandler[] = [];
  const starts: string[] = [];
  const launches: string[] = [];

  const push = (obj: FakeGameObject): FakeGameObject => {
    objects.push(obj);
    return obj;
  };

  Object.assign(scene, {
    add: {
      image: (x: number, y: number): FakeGameObject => push(new FakeGameObject(x, y)),
      text: (x: number, y: number, text: string): FakeGameObject => {
        const obj = push(new FakeGameObject(x, y, text));
        textObjects.push(obj);
        return obj;
      },
      rectangle: (x: number, y: number, width = 0, height = 0): FakeGameObject => {
        const obj = push(new FakeGameObject(x, y));
        obj.width = width;
        obj.height = height;
        return obj;
      },
      graphics: (): FakeGameObject => push(new FakeGameObject()),
      container: (x: number, y: number): FakeGameObject => push(new FakeGameObject(x, y)),
      particles: (): FakeGameObject => push(new FakeGameObject()),
    },
    children: { list: objects },
    textures: { exists: () => false },
    tweens: {
      add: (config: TweenConfig): { once: (event: string, handler: EventHandler) => void; stop: () => void } => {
        config.onComplete?.();
        return {
          once: (_event: string, _handler: EventHandler): void => undefined,
          stop: (): void => undefined,
        };
      },
    },
    time: {
      delayedCall: (_delay: number, callback: EventHandler): void => {
        delayed.push(callback);
      },
    },
    cameras: { main: { scrollX: 0, scrollY: 0 } },
    scene: {
      start: (key: string): void => {
        starts.push(key);
      },
      launch: (key: string): void => {
        launches.push(key);
      },
    },
  });

  return { scene, internals, starts, launches, textObjects, delayed };
};

beforeEach(() => {
  vi.clearAllMocks();
  seedGameState();
});

describe("CombatScene M12.5 safety harness", () => {
  test("boots and renders initial seeded combat state", () => {
    const harness = createSceneHarness();

    expect(() => harness.scene.create()).not.toThrow();

    expect(harness.internals.state).toBe("awaiting_hero");
    expect(harness.internals.mobs).toHaveLength(1);
    expect(harness.internals.mobs[0]?.mob.id).toBe("marauder");
    expect(harness.textObjects.some((obj) => obj.text === "БОЙ")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text === "АТАКА")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text === "УКРЫТИЕ")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text === "АПТЕЧКА")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text === "ОТСТУП")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text === "AP ●●● 3/3")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Атака 1 AP: цель Мародёр"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Укрытие 1 AP: готово"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Отступ 2 AP: готово"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Мародёр [Намерение: атака]"))).toBe(true);
  });


  test("does not render enemy intent for dead mobs skipped by current scene", () => {
    GameState.data.mobs.marauder = testMob({ hp: 0 });
    const harness = createSceneHarness();

    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("Намерение"))).toBe(false);
  });

  test("does not keep active enemy intent for fled mobs skipped by current scene", () => {
    const harness = createSceneHarness();
    harness.scene.create();
    const target = harness.internals.mobs[0];
    if (!target) throw new Error("expected seeded mob");

    target.state.fled = true;
    harness.internals.updateDisplay();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("Намерение"))).toBe(false);
  });

  test("renders AP preview shell without changing seeded combat state", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    expect(GameState.player.hp).toBe(80);
    expect(GameState.player.backpack).toEqual([]);
    expect(GameState.currentSortie?.cover_active).toBe(false);
    expect(harness.internals.mobs[0]?.state.hp).toBe(20);
    expect(harness.internals.logLines).toEqual([]);
    expect(harness.textObjects.some((obj) => obj.text === "AP ●●● 3/3")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Укрытие 1 AP: готово"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Аптечка 1 AP: нет аптечки"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Аптечка 1 AP: готово"))).toBe(false);
    expect(harness.textObjects.some((obj) => obj.text.includes("Отступ 2 AP: готово"))).toBe(true);
  });

  test("marks preview actions unavailable outside the hero input state", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.state = "resolving_mobs";
    harness.internals.updateActionPreview();

    expect(harness.textObjects.some((obj) => obj.text.includes("Атака 1 AP: действие недоступно"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Укрытие 1 AP: действие недоступно"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Аптечка 1 AP: действие недоступно"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Отступ 2 AP: действие недоступно"))).toBe(true);
  });

  test("hero attack path damages the current target and queues turn resolution", () => {
    const harness = createSceneHarness();
    harness.scene.create();
    const hpBefore = harness.internals.mobs[0]?.state.hp ?? 0;

    harness.internals.onHeroAttack();

    expect(harness.internals.mobs[0]?.state.hp).toBeLessThan(hpBefore);
    expect(harness.internals.logLines.at(-1)).toContain("Герой бьёт");
    expect(harness.internals.state).toBe("resolving_mobs");
    expect(harness.delayed).toHaveLength(1);
  });

  test("cover path sets sortie cover and queues turn resolution", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroCover();

    expect(GameState.currentSortie?.cover_active).toBe(true);
    expect(harness.internals.logLines.at(-1)).toContain("Герой в укрытии");
    expect(harness.internals.state).toBe("resolving_mobs");
    expect(harness.delayed).toHaveLength(1);
  });

  test("heal path reports missing medkit without advancing turn", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroHeal();

    expect(harness.internals.logLines.at(-1)).toBe("Нет аптечки.");
    expect(harness.internals.state).toBe("awaiting_hero");
    expect(harness.delayed).toHaveLength(0);
  });

  test("heal path consumes a medkit and queues turn resolution when available", () => {
    seedGameState([{ item_id: "bandage", count: 1 }]);
    GameState.player.hp = 50;
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroHeal();

    expect(GameState.player.hp).toBe(65);
    expect(GameState.player.backpack).toEqual([]);
    expect(harness.internals.logLines.at(-1)).toContain("Использован Бинт");
    expect(harness.internals.state).toBe("resolving_mobs");
    expect(harness.delayed).toHaveLength(1);
  });

  test("retreat path returns to existing sortie flow while sortie is still active", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroRetreat();

    expect(harness.internals.state).toBe("ended");
    expect(harness.starts).toEqual(["SortieScene"]);
    expect(GameState.currentSortie).not.toBeNull();
  });

  test("victory path reaches existing loot flow and records pending loot", () => {
    const harness = createSceneHarness();
    harness.scene.create();
    const fightsCompletedBefore = GameState.currentSortie?.fights_completed ?? 0;
    const target = harness.internals.mobs[0];
    if (!target) throw new Error("expected seeded mob");
    target.state.hp = 0;

    expect(harness.internals.checkEnd()).toBe(true);

    expect(harness.starts).toContain("LootScene");
    expect(GameState.currentSortie?.fights_completed).toBe(fightsCompletedBefore + 1);
    expect(GameState.currentSortie?.pending_loot).toEqual([]);
    expect(GameState.player.xp).toBeGreaterThanOrEqual(1);
  });

  test("defeat path exposes second-chance and surrender actions without platform changes", () => {
    const harness = createSceneHarness();
    harness.scene.create();
    GameState.player.hp = 0;

    expect(harness.internals.checkEnd()).toBe(true);

    expect(harness.internals.state).toBe("ended");
    expect(harness.textObjects.some((obj) => obj.text === "Второй шанс (реклама)")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text === "Сдаться")).toBe(true);
    expect(harness.starts).toEqual([]);
  });

  test("renders melee weapon ammo preview and reload status correctly", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    const expected = "Оружие ближнего боя · Перезарядка: не огнестрельное оружие";
    expect(activeTexts.some((text) => text.includes(expected))).toBe(true);
  });

  test("renders ranged weapon with reserve ammo preview correctly", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 12 }]);
    GameState.player.equipped_weapon_id = "pm";

    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    const expected = "Магазин: не подключён · Ёмкость: 8 · Патроны: Патроны 9x18 · Запас: 12 · Перезарядка: предпросмотр";
    expect(activeTexts.some((text) => text.includes(expected))).toBe(true);
  });

  test("renders ranged weapon with no reserve ammo preview correctly", () => {
    seedGameState([]);
    GameState.player.equipped_weapon_id = "pm";

    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    const expected = "Магазин: не подключён · Ёмкость: 8 · Патроны: Патроны 9x18 · Запас: 0 · Перезарядка: нет патронов в запасе";
    expect(activeTexts.some((text) => text.includes(expected))).toBe(true);
  });

  test("no equipped weapon does not crash and renders default not_ranged_weapon message", () => {
    seedGameState([]);
    GameState.player.equipped_weapon_id = ""; // Empty string

    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    const expected = "Оружие ближнего боя · Перезарядка: не огнестрельное оружие";
    expect(activeTexts.some((text) => text.includes(expected))).toBe(true);
  });

  test("ranged weapon with no ammo_id and no usable caliber shows нет данных о патроне", () => {
    seedGameState([]);
    GameState.player.equipped_weapon_id = "broken_ranged_pistol";

    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    const expected = "Магазин: не подключён · Перезарядка: нет данных о патроне";
    expect(activeTexts.some((text) => text.includes(expected))).toBe(true);
  });

  test("ranged weapon with unknown capacity shows неизвестна ёмкость магазина", () => {
    seedGameState([]);
    GameState.player.equipped_weapon_id = "invalid_capacity_pistol";

    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    const expected = "Магазин: не подключён · Ёмкость: неизвестна · Патроны: Патроны 9x18 · Запас: 0 · Перезарядка: неизвестна ёмкость магазина";
    expect(activeTexts.some((text) => text.includes(expected))).toBe(true);
  });

  test("ranged weapon with unknown ammo item name shows ammoId safely without crash", () => {
    seedGameState([]);
    GameState.player.equipped_weapon_id = "unknown_ammo_pistol";

    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    const expected = "Магазин: не подключён · Ёмкость: 8 · Патроны: ammo_unknown · Запас: 0 · Перезарядка: нет патронов в запасе";
    expect(activeTexts.some((text) => text.includes(expected))).toBe(true);
  });

  test("ranged weapon with fallbackReason shows (неполные данные) caution", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 12 }]);
    GameState.player.equipped_weapon_id = "aps"; // aps has no magazine_size defined

    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    const expected = "Магазин: не подключён · Ёмкость: 20 · Патроны: Патроны 9x18 · Запас: 12 · Перезарядка: предпросмотр (неполные данные)";
    expect(activeTexts.some((text) => text.includes(expected))).toBe(true);
  });

  test("reload button renders in the action bar", () => {
    const harness = createSceneHarness();
    harness.scene.create();
    expect(harness.textObjects.some((obj) => obj.text === "ПЕРЕЗАРЯДКА")).toBe(true);
  });

  test("clicking reload with melee weapon logs non-ranged reason and does not mutate backpack or AP or state", () => {
    seedGameState([]);
    GameState.player.equipped_weapon_id = "knife";
    const harness = createSceneHarness();
    harness.scene.create();
    const backpackBefore = JSON.stringify(GameState.player.backpack);
    const apBefore = harness.internals.currentAp;

    harness.internals.onHeroReload();

    expect(harness.internals.logLines.at(-1)).toBe("Перезарядка: не огнестрельное оружие.");
    expect(JSON.stringify(GameState.player.backpack)).toBe(backpackBefore);
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(harness.internals.state).toBe("awaiting_hero");
  });

  test("clicking reload with no reserve ammo logs no reserve and does not mutate backpack or AP or state", () => {
    seedGameState([]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();
    const backpackBefore = JSON.stringify(GameState.player.backpack);
    const apBefore = harness.internals.currentAp;

    harness.internals.onHeroReload();

    expect(harness.internals.logLines.at(-1)).toBe("Перезарядка: нет патронов в запасе.");
    expect(JSON.stringify(GameState.player.backpack)).toBe(backpackBefore);
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(harness.internals.state).toBe("awaiting_hero");
  });

  test("clicking reload with reserve ammo logs preview-only message and does not mutate backpack or AP or state", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 12 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();
    const backpackBefore = JSON.stringify(GameState.player.backpack);
    const apBefore = harness.internals.currentAp;

    harness.internals.onHeroReload();

    expect(harness.internals.logLines.at(-1)).toBe("Перезарядка пока в предпросмотре: выстрелы ещё используют старую модель патронов.");
    expect(JSON.stringify(GameState.player.backpack)).toBe(backpackBefore);
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(harness.internals.state).toBe("awaiting_hero");
  });

  test("after reload click, ranged attack behavior remains legacy and consumes backpack ammo directly", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 1 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    // Click reload first
    harness.internals.onHeroReload();
    expect(harness.internals.logLines.at(-1)).toBe("Перезарядка пока в предпросмотре: выстрелы ещё используют старую модель патронов.");
    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 1 }]);

    // Now trigger ranged attack which consumes the 1 ammo directly from backpack, leaving it empty
    harness.internals.onHeroAttack();

    expect(GameState.player.backpack).toEqual([]); // Zero-count stack removed
    expect(harness.internals.logLines.at(-1)).toContain("Герой бьёт");
    expect(harness.internals.state).toBe("resolving_mobs");
  });
});
