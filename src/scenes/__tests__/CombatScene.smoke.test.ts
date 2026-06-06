/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
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
import type { CombatStatusInstance } from "../../systems/combatStatus";


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
  onHeroMoveCloser: () => void;
  onHeroMoveAway: () => void;
  setDistanceBandForTest: (band: "close" | "medium" | "far") => void;
  onHeroRetreat: () => void;
  checkEnd: () => boolean;
  updateActionPreview: () => void;
  updateDisplay: () => void;
  mobs: { state: { hp: number; fled?: boolean; cover_active?: boolean }; mob: Mob }[];
  state: string;
  logLines: string[];
  currentAp: number;
  currentNoise: number;
  distanceBand: "close" | "medium" | "far";
  currentMagazineByWeaponId: Map<string, { ammoId: string; count: number }>;
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

const heavyRangedWeapon = makeItem({
  id: "heavy_ranged",
  name_ru: "Тяжелый огнестрел",
  type: "weapon_ranged",
  tier: 3,
  zone_origin: "test",
  weight_kg: 2.0,
  description_ru: "Heavy Ranged Weapon",
  flavor_ru: "",
  recipe_id: null,
  stats: {
    damage_min: 15,
    damage_max: 20,
    attack_speed: 60,
    noise: "high",
    ammo_id: "ammo_9x18",
    ammo_per_shot: 2,
    magazine_size: 8,
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
      [heavyRangedWeapon.id]: heavyRangedWeapon,
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
      container: (x: number, y: number, children?: any[]): FakeGameObject => {
        const obj = push(new FakeGameObject(x, y));
        (obj as any).list = children || [];
        return obj;
      },
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
    expect(harness.textObjects.some((obj) => obj.text === "БЛИЖЕ")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text === "ДАЛЬШЕ")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text === "AP ●●● 3/3")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text === "Дистанция: средне")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text === "Шум: тихо")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Атака 1 AP: цель Мародёр"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Укрытие 1 AP: готово"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Отступ 2 AP: готово"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Ближе 1 AP: предпросмотр"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Дальше 1 AP: предпросмотр"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Мародёр [Намерение: атака]"))).toBe(true);
  });

  test("renders display-only default distance chip without mutating AP or inventory state", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const backpackBefore = structuredClone(GameState.player.backpack);
    const harness = createSceneHarness();

    harness.scene.create();

    expect(harness.internals.distanceBand).toBe("medium");
    expect(harness.internals.currentNoise).toBe(0);
    expect(harness.textObjects.some((obj) => obj.text === "Дистанция: средне")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text === "Шум: тихо")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text === "Укрытие")).toBe(false);
    expect(harness.internals.currentAp).toBe(3);
    expect(GameState.player.backpack).toEqual(backpackBefore);
    expect(harness.internals.currentMagazineByWeaponId.size).toBe(0);
    expect(harness.textObjects.some((obj) => obj.text === "AP ●●● 3/3")).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Магазин: 0/8"))).toBe(true);
    expect(harness.textObjects.some((obj) => obj.text.includes("Мародёр [Намерение: атака]"))).toBe(true);
  });

  test("renders display-only default noise chip without mutating preview state", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const backpackBefore = structuredClone(GameState.player.backpack);
    const harness = createSceneHarness();

    harness.scene.create();
    const apBefore = harness.internals.currentAp;
    const magazineBefore = structuredClone([...harness.internals.currentMagazineByWeaponId.entries()]);

    harness.internals.updateDisplay();
    harness.internals.updateActionPreview();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(harness.internals.currentNoise).toBe(0);
    expect(activeTexts.some((text) => text === "Шум: тихо")).toBe(true);
    expect(activeTexts.some((text) => text.includes("Шум +"))).toBe(false);
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(GameState.player.backpack).toEqual(backpackBefore);
    expect([...harness.internals.currentMagazineByWeaponId.entries()]).toEqual(magazineBefore);
  });

  test("loaded firearm attack preview shows preview-only noise delta without mutating noise", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    harness.internals.updateActionPreview();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("Атака 1 AP: цель Мародёр · Шум +2"))).toBe(true);
    expect(activeTexts.some((text) => text === "Шум: тихо")).toBe(true);
    expect(harness.internals.currentNoise).toBe(0);
    expect(harness.internals.currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 3 });
    expect(GameState.player.backpack).toEqual([]);
  });

  test("firearm noise preview does not render for disabled attack state", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();
    harness.internals.onHeroReload();
    harness.internals.state = "resolving_mobs";

    harness.internals.updateActionPreview();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("Шум +2"))).toBe(false);
    expect(activeTexts.some((text) => text.includes("Атака 1 AP: действие недоступно"))).toBe(true);
    expect(harness.internals.currentNoise).toBe(0);
    expect(harness.internals.currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 3 });
  });

  test("valid attack after noise preview still consumes magazine exactly once", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();
    harness.internals.onHeroReload();
    harness.internals.updateActionPreview();

    expect(harness.textObjects.some((obj) => !obj.destroyed && obj.text.includes("Шум +2"))).toBe(true);
    expect(harness.internals.currentNoise).toBe(0);

    harness.internals.onHeroAttack();

    expect(harness.internals.currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 2 });
    expect(GameState.player.backpack).toEqual([]);
    expect(harness.internals.currentNoise).toBe(2);
    expect(harness.internals.state).toBe("resolving_mobs");
  });

  test("empty magazine attack preview does not show firearm noise delta before fallback", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const backpackBefore = structuredClone(GameState.player.backpack);
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.updateActionPreview();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("Атака 1 AP: цель Мародёр"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Шум +2"))).toBe(false);
    expect(harness.internals.currentNoise).toBe(0);
    expect(GameState.player.backpack).toEqual(backpackBefore);
    expect(harness.internals.currentMagazineByWeaponId.size).toBe(0);
  });

  test("melee preview does not show firearm noise delta and melee attack remains unchanged", () => {
    const harness = createSceneHarness();
    harness.scene.create();
    const hpBefore = harness.internals.mobs[0]?.state.hp ?? 0;

    harness.internals.updateActionPreview();

    let activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("Атака 1 AP: цель Мародёр"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Шум +2"))).toBe(false);
    expect(harness.internals.currentNoise).toBe(0);

    harness.internals.onHeroAttack();

    activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(harness.internals.mobs[0]?.state.hp).toBeLessThan(hpBefore);
    expect(harness.internals.logLines.at(-1)).toContain("Герой бьёт");
    expect(harness.internals.currentMagazineByWeaponId.has("knife")).toBe(false);
    expect(harness.internals.currentNoise).toBe(0);
    expect(activeTexts.some((text) => text.includes("Шум +2"))).toBe(false);
  });

  test("reload preview does not attach firearm noise to reload copy", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.updateActionPreview();

    let activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("Перезарядка: готово"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Перезарядка") && text.includes("Шум +2"))).toBe(false);
    expect(activeTexts.some((text) => text.includes("Шум +2"))).toBe(false);
    expect(harness.internals.currentNoise).toBe(0);

    harness.internals.onHeroReload();
    harness.internals.updateActionPreview();

    activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("Перезарядка") && text.includes("Шум +2"))).toBe(false);
    expect(activeTexts.some((text) => text.includes("Атака 1 AP: цель Мародёр · Шум +2"))).toBe(true);
    expect(harness.internals.currentNoise).toBe(0);
  });

  test("movement and cover preview copy do not receive firearm noise delta", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();
    harness.internals.onHeroReload();
    harness.internals.updateActionPreview();

    let activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("Ближе 1 AP: предпросмотр · Шум +2"))).toBe(false);
    expect(activeTexts.some((text) => text.includes("Дальше 1 AP: предпросмотр · Шум +2"))).toBe(false);
    expect(activeTexts.some((text) => text.includes("Укрытие 1 AP: готово · Шум +2"))).toBe(false);

    harness.internals.onHeroMoveCloser();
    harness.internals.onHeroMoveAway();
    expect(harness.internals.currentNoise).toBe(0);
    expect(harness.internals.distanceBand).toBe("medium");
    expect(harness.internals.state).toBe("awaiting_hero");

    harness.internals.onHeroCover();
    harness.internals.updateActionPreview();

    activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("Шум +2"))).toBe(false);
    expect(activeTexts.some((text) => text === "Укрытие")).toBe(true);
    expect(harness.internals.currentNoise).toBe(0);
  });

  test("PR7c-b: Preview remains non-mutating", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();
    harness.internals.onHeroReload();
    const magazineBefore = structuredClone([...harness.internals.currentMagazineByWeaponId.entries()]);

    harness.internals.updateActionPreview();
    harness.internals.updateActionPreview();
    harness.internals.updateDisplay();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.filter((text) => text.includes("Атака 1 AP: цель Мародёр · Шум +2"))).toHaveLength(1);
    expect([...harness.internals.currentMagazineByWeaponId.entries()]).toEqual(magazineBefore);
    expect(harness.internals.currentNoise).toBe(0);
    expect(GameState.player.backpack).toEqual([]);
  });

  test("PR7c-b: Single valid firearm shot", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    expect(GameState.player.backpack).toEqual([]);
    expect(harness.internals.currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 3 });
    expect(harness.internals.currentNoise).toBe(0);

    harness.internals.onHeroAttack();
    harness.internals.updateDisplay();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(harness.internals.currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 2 });
    expect(harness.internals.currentNoise).toBe(2);
    expect(activeTexts.some((text) => text === "Шум: тихо")).toBe(true);
    expect(activeTexts.some((text) => text.includes("Шум +"))).toBe(false);
    expect(GameState.player.backpack).toEqual([]);
  });

  test("PR7c-b: Multiple valid firearm shots accumulate local noise", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    
    // First shot
    harness.internals.onHeroAttack();
    expect(harness.internals.currentNoise).toBe(2);
    expect(harness.internals.currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 2 });

    // Reset state to awaiting_hero using safe test seam
    harness.internals.state = "awaiting_hero";

    // Second shot
    harness.internals.onHeroAttack();
    harness.internals.updateDisplay();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(harness.internals.currentNoise).toBe(4);
    expect(activeTexts.some((text) => text === "Шум: слышно")).toBe(true);
    expect(harness.internals.currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 1 });
    expect(GameState.player.backpack).toEqual([]);
  });

  test("PR7c-b: Empty-magazine fallback", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const backpackBefore = structuredClone(GameState.player.backpack);
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroAttack();
    harness.internals.updateDisplay();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(harness.internals.logLines).toContain("Нет патронов — удар прикладом.");
    expect(GameState.player.backpack).toEqual(backpackBefore);
    expect(harness.internals.currentMagazineByWeaponId.size).toBe(0);
    expect(harness.internals.currentNoise).toBe(0);
    expect(activeTexts.some((text) => text === "Шум: тихо")).toBe(true);
    expect(activeTexts.some((text) => text.includes("Шум +"))).toBe(false);
  });

  test("PR7c-b: Melee attack does not mutate noise", () => {
    GameState.player.equipped_weapon_id = "knife";
    const harness = createSceneHarness();
    harness.scene.create();
    const hpBefore = harness.internals.mobs[0]?.state.hp ?? 0;

    harness.internals.onHeroAttack();
    harness.internals.updateDisplay();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(harness.internals.mobs[0]?.state.hp).toBeLessThan(hpBefore);
    expect(harness.internals.logLines.at(-1)).toContain("Герой бьёт");
    expect(harness.internals.currentNoise).toBe(0);
    expect(activeTexts.some((text) => text === "Шум: тихо")).toBe(true);
  });

  test("PR7c-b: Reload does not mutate noise", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    harness.internals.updateDisplay();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(harness.internals.currentNoise).toBe(0);
    expect(harness.internals.currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 3 });
    expect(activeTexts.some((text) => text === "Шум: тихо")).toBe(true);
  });

  test("PR7c-b: Movement preview does not mutate noise", () => {
    const previewMessage = "Манёвр пока в предпросмотре: перемещение не тратит AP и не меняет дистанцию.";
    const harness = createSceneHarness();
    harness.scene.create();
    const apBefore = harness.internals.currentAp;

    harness.internals.onHeroMoveCloser();
    harness.internals.onHeroMoveAway();

    expect(harness.internals.logLines.at(-1)).toBe(previewMessage);
    expect(harness.internals.distanceBand).toBe("medium");
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(harness.internals.state).toBe("awaiting_hero");
    expect(harness.internals.currentNoise).toBe(0);
  });

  test("PR7c-b: Cover does not mutate noise", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroCover();
    harness.internals.updateDisplay();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(GameState.currentSortie?.cover_active).toBe(true);
    expect(activeTexts.some((text) => text === "Укрытие")).toBe(true);
    expect(activeTexts.some((text) => text === "Шум: тихо")).toBe(true);
    expect(harness.internals.currentNoise).toBe(0);
  });

  test("PR7c-b: Heal/no-heal does not mutate noise", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    // No-medkit path
    harness.internals.onHeroHeal();
    expect(harness.internals.logLines.at(-1)).toBe("Нет аптечки.");
    expect(harness.internals.currentNoise).toBe(0);

    // Medkit path
    seedGameState([{ item_id: "bandage", count: 1 }]);
    GameState.player.hp = 50;
    harness.internals.state = "awaiting_hero";
    harness.internals.onHeroHeal();
    expect(GameState.player.hp).toBe(65);
    expect(harness.internals.currentNoise).toBe(0);
  });

  test("PR7c-b: Lifecycle/refund unchanged after noise", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    harness.internals.onHeroAttack();
    expect(harness.internals.currentNoise).toBe(2);

    harness.internals.state = "awaiting_hero";
    harness.internals.onHeroRetreat();

    expect(harness.starts).toContain("SortieScene");
    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 2 }]);
  });

  test("PR7c-b: New scene resets noise", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness1 = createSceneHarness();
    harness1.scene.create();
    harness1.internals.onHeroReload();
    harness1.internals.onHeroAttack();
    expect(harness1.internals.currentNoise).toBe(2);

    const harness2 = createSceneHarness();
    harness2.scene.create();
    expect(harness2.internals.currentNoise).toBe(0);
    const activeTexts = harness2.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text === "Шум: тихо")).toBe(true);
  });

  test("PR7c-b: Threshold labels", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    const thresholds = [
      { val: 0, expected: "Шум: тихо" },
      { val: 2, expected: "Шум: тихо" },
      { val: 3, expected: "Шум: слышно" },
      { val: 5, expected: "Шум: слышно" },
      { val: 6, expected: "Шум: опасно" },
      { val: 8, expected: "Шум: опасно" },
      { val: 9, expected: "Шум критический" },
      { val: 10, expected: "Шум критический" },
    ];

    for (const t of thresholds) {
      harness.internals.currentNoise = t.val;
      harness.internals.updateDisplay();
      const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
      expect(activeTexts.some((text) => text === t.expected)).toBe(true);
      expect(activeTexts.some((text) => text.includes("Шум: Шум"))).toBe(false);
      if (t.expected === "Шум критический") {
        expect(activeTexts.some((text) => text === "Шум: Шум критический")).toBe(false);
      }
    }
  });

  test("PR7c-b: Regression guard for core combat elements", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();
    harness.internals.onHeroReload();
    harness.internals.updateDisplay();

    // 1. All 7 action buttons remain rendered exactly once
    const expectedButtonLabels = ["АТАКА", "УКРЫТИЕ", "АПТЕЧКА", "ПЕРЕЗАРЯДКА", "БЛИЖЕ", "ДАЛЬШЕ", "ОТСТУП"];
    for (const label of expectedButtonLabels) {
      expect(
        harness.textObjects.filter((obj) => obj.text === label),
        `button label: ${label}`
      ).toHaveLength(1);
    }

    // 2. AP preview, ammo/magazine preview, distance band, cover chip, enemy intent, noise chip are all visible/correct
    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("AP"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Магазин:"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Дистанция:"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Шум:"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Намерение:"))).toBe(true);

    harness.internals.onHeroCover();
    harness.internals.updateDisplay();
    const activeTextsWithCover = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTextsWithCover.some((text) => text === "Укрытие")).toBe(true);
  });

  test("does not render hero cover chip from enemy mob cover state", () => {
    const harness = createSceneHarness();
    harness.scene.create();
    const target = harness.internals.mobs[0];
    if (!target) throw new Error("expected seeded mob");

    target.state.cover_active = true;
    harness.internals.updateDisplay();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(GameState.currentSortie?.cover_active).toBe(false);
    expect(activeTexts.some((text) => text === "Укрытие")).toBe(false);
    expect(activeTexts.some((text) => text === "Дистанция: средне")).toBe(true);
  });

  test("cover chip survives display and preview refreshes while hero cover flag is active", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroCover();
    harness.internals.updateDisplay();
    harness.internals.updateActionPreview();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(GameState.currentSortie?.cover_active).toBe(true);
    expect(activeTexts.some((text) => text === "Укрытие")).toBe(true);
    expect(activeTexts.some((text) => text === "Дистанция: средне")).toBe(true);
  });

  test("cover chip clears when existing hero cover flag clears", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroCover();
    if (GameState.currentSortie) {
      GameState.currentSortie.cover_active = false;
    }
    harness.internals.updateDisplay();
    harness.internals.updateActionPreview();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(GameState.currentSortie?.cover_active).toBe(false);
    expect(activeTexts.some((text) => text === "Укрытие")).toBe(false);
    expect(activeTexts.some((text) => text === "Дистанция: средне")).toBe(true);
  });

  test("cover chip refresh alone does not create or mutate hero cover state", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const backpackBefore = structuredClone(GameState.player.backpack);
    const harness = createSceneHarness();
    harness.scene.create();
    const apBefore = harness.internals.currentAp;

    harness.internals.updateDisplay();
    harness.internals.updateActionPreview();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(GameState.currentSortie?.cover_active).toBe(false);
    expect(activeTexts.some((text) => text === "Укрытие")).toBe(false);
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(GameState.player.backpack).toEqual(backpackBefore);
    expect(harness.internals.currentMagazineByWeaponId.size).toBe(0);
  });

  test("keeps distance chip stable across display and preview refreshes", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const backpackBefore = structuredClone(GameState.player.backpack);
    const harness = createSceneHarness();
    harness.scene.create();
    const apBefore = harness.internals.currentAp;

    harness.internals.updateDisplay();
    harness.internals.updateActionPreview();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text === "Дистанция: средне")).toBe(true);
    expect(harness.internals.distanceBand).toBe("medium");
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(GameState.player.backpack).toEqual(backpackBefore);
    expect(harness.internals.currentMagazineByWeaponId.size).toBe(0);
  });

  test("keeps attack flow unchanged while distance chip remains display-only", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    expect(harness.internals.state).toBe("awaiting_hero");
    expect(harness.internals.distanceBand).toBe("medium");

    harness.internals.onHeroAttack();

    expect(harness.internals.state).toBe("resolving_mobs");
    expect(harness.internals.distanceBand).toBe("medium");
    expect(harness.internals.currentNoise).toBe(0);
    expect(harness.textObjects.some((obj) => !obj.destroyed && obj.text === "Дистанция: средне")).toBe(true);
  });

  test("keeps reload magazine flow unchanged while distance stays medium", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();

    expect(GameState.player.backpack).toEqual([]);
    expect(harness.internals.currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 3 });
    expect(harness.internals.distanceBand).toBe("medium");
    expect(harness.internals.currentNoise).toBe(0);
    expect(harness.textObjects.some((obj) => !obj.destroyed && obj.text === "Дистанция: средне")).toBe(true);
  });

  test("renders movement affordances as preview-only labels", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text === "БЛИЖЕ")).toBe(true);
    expect(activeTexts.some((text) => text === "ДАЛЬШЕ")).toBe(true);
    expect(activeTexts.some((text) => text.includes("Ближе 1 AP: предпросмотр"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Дальше 1 AP: предпросмотр"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("перемещение готово"))).toBe(false);
  });

  test("movement preview affordances survive display and preview refreshes", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.updateDisplay();
    harness.internals.updateActionPreview();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text === "БЛИЖЕ")).toBe(true);
    expect(activeTexts.some((text) => text === "ДАЛЬШЕ")).toBe(true);
    expect(activeTexts.some((text) => text.includes("Ближе 1 AP: предпросмотр"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Дальше 1 AP: предпросмотр"))).toBe(true);
  });



  test("PR9b keeps medium default preview-only movement copy unchanged", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    expect(harness.internals.distanceBand).toBe("medium");
    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text === "Дистанция: средне")).toBe(true);
    expect(activeTexts.some((text) => text.includes("Ближе 1 AP: предпросмотр"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Дальше 1 AP: предпросмотр"))).toBe(true);
  });

  test("PR9b renders close boundary disabled copy without enabling real movement", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.setDistanceBandForTest("close");
    harness.internals.updateDisplay();
    harness.internals.updateActionPreview();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(harness.internals.distanceBand).toBe("close");
    expect(activeTexts.some((text) => text === "Дистанция: близко")).toBe(true);
    expect(activeTexts.some((text) => text.includes("Ближе 1 AP: уже близко"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Дальше 1 AP: предпросмотр"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Ближе 1 AP: готово"))).toBe(false);
  });

  test("PR9b renders far boundary disabled copy without enabling real movement", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.setDistanceBandForTest("far");
    harness.internals.updateDisplay();
    harness.internals.updateActionPreview();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(harness.internals.distanceBand).toBe("far");
    expect(activeTexts.some((text) => text === "Дистанция: далеко")).toBe(true);
    expect(activeTexts.some((text) => text.includes("Ближе 1 AP: предпросмотр"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Дальше 1 AP: уже далеко"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Дальше 1 AP: готово"))).toBe(false);
  });

  test("PR9b close boundary click logs disabled reason and does not mutate state", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();
    harness.internals.onHeroReload();
    harness.internals.setDistanceBandForTest("close");

    const apBefore = harness.internals.currentAp;
    const backpackBefore = structuredClone(GameState.player.backpack);
    const magazineBefore = structuredClone([...harness.internals.currentMagazineByWeaponId.entries()]);
    const noiseBefore = harness.internals.currentNoise;
    const statusesBefore = structuredClone([...(harness.scene as any).combatStatusesByTarget.entries()]);
    const previewsBefore = structuredClone([...(harness.scene as any).statusPreviewByAction.entries()]);

    harness.internals.onHeroMoveCloser();

    expect(harness.internals.logLines.at(-1)).toBe("Манёвр недоступен: уже близко.");
    expect(harness.internals.distanceBand).toBe("close");
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(GameState.player.backpack).toEqual(backpackBefore);
    expect([...harness.internals.currentMagazineByWeaponId.entries()]).toEqual(magazineBefore);
    expect(harness.internals.currentNoise).toBe(noiseBefore);
    expect([...(harness.scene as any).combatStatusesByTarget.entries()]).toEqual(statusesBefore);
    expect([...(harness.scene as any).statusPreviewByAction.entries()]).toEqual(previewsBefore);
    expect(harness.internals.state).toBe("awaiting_hero");
  });

  test("PR9b far boundary click logs disabled reason and does not mutate state", () => {
    const harness = createSceneHarness();
    harness.scene.create();
    harness.internals.setDistanceBandForTest("far");

    const apBefore = harness.internals.currentAp;
    const noiseBefore = harness.internals.currentNoise;

    harness.internals.onHeroMoveAway();

    expect(harness.internals.logLines.at(-1)).toBe("Манёвр недоступен: уже далеко.");
    expect(harness.internals.distanceBand).toBe("far");
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(harness.internals.currentNoise).toBe(noiseBefore);
    expect(harness.internals.state).toBe("awaiting_hero");
  });

  test("PR9b valid movement clicks remain preview-only at medium", () => {
    const harness = createSceneHarness();
    harness.scene.create();
    const previewMessage = "Манёвр пока в предпросмотре: перемещение не тратит AP и не меняет дистанцию.";
    const apBefore = harness.internals.currentAp;

    harness.internals.onHeroMoveCloser();
    expect(harness.internals.logLines.at(-1)).toBe(previewMessage);
    expect(harness.internals.distanceBand).toBe("medium");
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(harness.internals.state).toBe("awaiting_hero");

    harness.internals.onHeroMoveAway();
    expect(harness.internals.logLines.at(-1)).toBe(previewMessage);
    expect(harness.internals.distanceBand).toBe("medium");
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(harness.internals.state).toBe("awaiting_hero");
  });

  test("PR9b display and preview refreshes do not mutate boundary distance or resources", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();
    harness.internals.onHeroReload();
    (harness.scene as any).setStatusPreviewForTest("movement", { id: "suppressed", durationTurns: 1 });
    harness.internals.setDistanceBandForTest("far");

    const apBefore = harness.internals.currentAp;
    const backpackBefore = structuredClone(GameState.player.backpack);
    const magazineBefore = structuredClone([...harness.internals.currentMagazineByWeaponId.entries()]);
    const noiseBefore = harness.internals.currentNoise;
    const previewsBefore = structuredClone([...(harness.scene as any).statusPreviewByAction.entries()]);

    for (let i = 0; i < 3; i++) {
      harness.internals.updateDisplay();
      harness.internals.updateActionPreview();
    }

    expect(harness.internals.distanceBand).toBe("far");
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(GameState.player.backpack).toEqual(backpackBefore);
    expect([...harness.internals.currentMagazineByWeaponId.entries()]).toEqual(magazineBefore);
    expect(harness.internals.currentNoise).toBe(noiseBefore);
    expect([...(harness.scene as any).statusPreviewByAction.entries()]).toEqual(previewsBefore);
  });

  test("movement buttons do not replace core combat actions or previews", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const expectedButtonLabels = ["АТАКА", "УКРЫТИЕ", "АПТЕЧКА", "ПЕРЕЗАРЯДКА", "БЛИЖЕ", "ДАЛЬШЕ", "ОТСТУП"];
    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);

    for (const label of expectedButtonLabels) {
      expect(activeTexts.filter((text) => text === label)).toHaveLength(1);
    }
    expect(activeTexts.some((text) => text === "AP ●●● 3/3")).toBe(true);
    expect(activeTexts.some((text) => text === "Дистанция: средне")).toBe(true);
    expect(activeTexts.some((text) => text.includes("Магазин:"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Мародёр [Намерение: атака]"))).toBe(true);
  });

  test("movement preview copy never claims real movement happened", () => {
    const misleadingCopy = ["перемещение выполнено", "дистанция изменена", "подошли", "отошли"];
    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text.toLowerCase());

    for (const copy of misleadingCopy) {
      expect(activeTexts.some((text) => text.includes(copy))).toBe(false);
    }
    expect(activeTexts.some((text) => text.includes("ближе 1 ap: готово"))).toBe(false);
    expect(activeTexts.some((text) => text.includes("дальше 1 ap: готово"))).toBe(false);
  });

  test("movement affordance clicks are preview-only and do not mutate combat resources", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();
    harness.internals.onHeroReload();

    const previewMessage = "Манёвр пока в предпросмотре: перемещение не тратит AP и не меняет дистанцию.";
    const apBefore = harness.internals.currentAp;
    const backpackBefore = structuredClone(GameState.player.backpack);
    const magazineBefore = structuredClone([...harness.internals.currentMagazineByWeaponId.entries()]);

    harness.internals.onHeroMoveCloser();

    expect(harness.internals.logLines.at(-1)).toBe(previewMessage);
    expect(harness.internals.distanceBand).toBe("medium");
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(GameState.player.backpack).toEqual(backpackBefore);
    expect([...harness.internals.currentMagazineByWeaponId.entries()]).toEqual(magazineBefore);
    expect(harness.internals.state).toBe("awaiting_hero");

    harness.internals.onHeroMoveAway();

    expect(harness.internals.logLines.at(-1)).toBe(previewMessage);
    expect(harness.internals.distanceBand).toBe("medium");
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(GameState.player.backpack).toEqual(backpackBefore);
    expect([...harness.internals.currentMagazineByWeaponId.entries()]).toEqual(magazineBefore);
    expect(harness.internals.state).toBe("awaiting_hero");
  });

  test("movement affordance after attack state guard does not append logs or mutate state", () => {
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroAttack();

    expect(harness.internals.state).toBe("resolving_mobs");
    const logBefore = [...harness.internals.logLines];
    const apBefore = harness.internals.currentAp;
    const distanceBefore = harness.internals.distanceBand;

    harness.internals.onHeroMoveCloser();
    harness.internals.onHeroMoveAway();

    expect(harness.internals.logLines).toEqual(logBefore);
    expect(harness.internals.state).toBe("resolving_mobs");
    expect(harness.internals.distanceBand).toBe(distanceBefore);
    expect(harness.internals.currentAp).toBe(apBefore);
  });

  test("movement affordance does not log or mutate outside the hero input state", () => {
    const harness = createSceneHarness();
    harness.scene.create();
    harness.internals.state = "resolving_mobs";
    const apBefore = harness.internals.currentAp;
    const logBefore = [...harness.internals.logLines];

    harness.internals.onHeroMoveCloser();
    harness.internals.onHeroMoveAway();

    expect(harness.internals.logLines).toEqual(logBefore);
    expect(harness.internals.distanceBand).toBe("medium");
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(harness.internals.state).toBe("resolving_mobs");
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

  test("cover path sets sortie cover, renders chip, and queues turn resolution", () => {
    const harness = createSceneHarness();
    harness.scene.create();
    const apBefore = harness.internals.currentAp;

    harness.internals.onHeroCover();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(GameState.currentSortie?.cover_active).toBe(true);
    expect(activeTexts.some((text) => text === "Укрытие")).toBe(true);
    expect(activeTexts.some((text) => text === "Дистанция: средне")).toBe(true);
    expect(activeTexts.some((text) => text === "Шум: тихо")).toBe(true);
    expect(activeTexts.some((text) => text === "БЛИЖЕ")).toBe(true);
    expect(activeTexts.some((text) => text === "ДАЛЬШЕ")).toBe(true);
    expect(activeTexts.some((text) => text.includes("Магазин:")) || activeTexts.some((text) => text.includes("Перезарядка:"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Мародёр [Намерение: атака]"))).toBe(true);
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(harness.internals.logLines.at(-1)).toContain("Герой в укрытии");
    expect(harness.internals.state).toBe("resolving_mobs");
    expect(harness.delayed).toHaveLength(1);
  });

  test("cover chip visibility follows hero cover flag without affecting reload or magazine attack", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();

    expect(GameState.player.backpack).toEqual([]);
    expect(harness.internals.currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 3 });
    expect(harness.textObjects.some((obj) => !obj.destroyed && obj.text === "Укрытие")).toBe(false);

    if (GameState.currentSortie) {
      GameState.currentSortie.cover_active = true;
    }
    harness.internals.updateDisplay();

    expect(harness.textObjects.some((obj) => !obj.destroyed && obj.text === "Укрытие")).toBe(true);

    harness.internals.onHeroAttack();

    expect(GameState.player.backpack).toEqual([]);
    expect(harness.internals.currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 2 });
    expect(harness.internals.state).toBe("resolving_mobs");
  });

  test("cover chip does not affect movement preview affordances", () => {
    const previewMessage = "Манёвр пока в предпросмотре: перемещение не тратит AP и не меняет дистанцию.";
    const harness = createSceneHarness();
    harness.scene.create();
    if (GameState.currentSortie) {
      GameState.currentSortie.cover_active = true;
    }
    harness.internals.updateDisplay();
    const apBefore = harness.internals.currentAp;

    harness.internals.onHeroMoveCloser();
    harness.internals.onHeroMoveAway();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text === "Укрытие")).toBe(true);
    expect(activeTexts.some((text) => text === "БЛИЖЕ")).toBe(true);
    expect(activeTexts.some((text) => text === "ДАЛЬШЕ")).toBe(true);
    expect(harness.internals.logLines.at(-1)).toBe(previewMessage);
    expect(harness.internals.distanceBand).toBe("medium");
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(harness.internals.currentNoise).toBe(0);
    expect(harness.internals.state).toBe("awaiting_hero");
  });

  test("cover chip layout keeps core combat previews visible and future states hidden", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const expectedButtonLabels = ["АТАКА", "УКРЫТИЕ", "АПТЕЧКА", "ПЕРЕЗАРЯДКА", "БЛИЖЕ", "ДАЛЬШЕ", "ОТСТУП"];
    const forbiddenFutureStates = ["Готовность", "Открыт", "Подавлен", "Без укрытия"];
    const harness = createSceneHarness();
    harness.scene.create();
    if (GameState.currentSortie) {
      GameState.currentSortie.cover_active = true;
    }
    harness.internals.updateDisplay();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    for (const label of expectedButtonLabels) {
      expect(activeTexts.filter((text) => text === label)).toHaveLength(1);
    }
    expect(activeTexts.some((text) => text === "AP ●●● 3/3")).toBe(true);
    expect(activeTexts.some((text) => text === "Дистанция: средне")).toBe(true);
    expect(activeTexts.some((text) => text === "Шум: тихо")).toBe(true);
    expect(activeTexts.some((text) => text === "Укрытие")).toBe(true);
    expect(activeTexts.some((text) => text.includes("Магазин:"))).toBe(true);
    expect(activeTexts.some((text) => text.includes("Мародёр [Намерение: атака]"))).toBe(true);
    for (const copy of forbiddenFutureStates) {
      expect(activeTexts.some((text) => text.includes(copy))).toBe(false);
    }
    expect(activeTexts.some((text) => text.includes("Шум +"))).toBe(false);
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
    const expected = "Магазин: 0/8 · Патроны: Патроны 9x18 · Запас: 12 · Перезарядка: готово";
    expect(activeTexts.some((text) => text.includes(expected))).toBe(true);
  });

  test("renders ranged weapon with no reserve ammo preview correctly", () => {
    seedGameState([]);
    GameState.player.equipped_weapon_id = "pm";

    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    const expected = "Магазин: 0/8 · Патроны: Патроны 9x18 · Запас: 0 · Перезарядка: нет патронов в запасе";
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
    const expected = "Магазин: 0/неизвестна · Патроны: Патроны 9x18 · Запас: 0 · Перезарядка: неизвестна ёмкость магазина";
    expect(activeTexts.some((text) => text.includes(expected))).toBe(true);
  });

  test("ranged weapon with unknown ammo item name shows ammoId safely without crash", () => {
    seedGameState([]);
    GameState.player.equipped_weapon_id = "unknown_ammo_pistol";

    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    const expected = "Магазин: 0/8 · Патроны: ammo_unknown · Запас: 0 · Перезарядка: нет патронов в запасе";
    expect(activeTexts.some((text) => text.includes(expected))).toBe(true);
  });

  test("ranged weapon with fallbackReason shows (неполные данные) caution", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 12 }]);
    GameState.player.equipped_weapon_id = "aps"; // aps has no magazine_size defined

    const harness = createSceneHarness();
    harness.scene.create();

    const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    const expected = "Магазин: 0/20 · Патроны: Патроны 9x18 · Запас: 12 · Перезарядка: готово (неполные данные)";
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

  test("reload PM with backpack ammo_9x18 x3 -> backpack 0, magazine 3", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();

    expect(GameState.player.backpack).toEqual([]);
    const magazineEntry = (harness.scene as any).currentMagazineByWeaponId.get("pm");
    expect(magazineEntry).toEqual({ ammoId: "ammo_9x18", count: 3 });
  });

  test("attack after reload -> backpack remains 0, magazine 2", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    harness.internals.onHeroAttack();

    expect(GameState.player.backpack).toEqual([]);
    const magazineEntry = (harness.scene as any).currentMagazineByWeaponId.get("pm");
    expect(magazineEntry).toEqual({ ammoId: "ammo_9x18", count: 2 });
  });

  test("attack without reload -> backpack remains 3, weak fallback", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroAttack();

    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 3 }]);
    const magazineEntry = (harness.scene as any).currentMagazineByWeaponId.get("pm");
    expect(magazineEntry?.count ?? 0).toBe(0);
    expect(harness.internals.logLines).toContain("Нет патронов — удар прикладом.");
  });

  test("retreat after reload x3 -> backpack refunded to 3, magazine map cleared", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    harness.internals.onHeroRetreat();

    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 3 }]);
    expect((harness.scene as any).currentMagazineByWeaponId.size).toBe(0);
  });

  test("retreat after reload x3 + one attack -> backpack refunded to 2", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    harness.internals.onHeroAttack();
    harness.internals.state = "awaiting_hero";
    harness.internals.onHeroRetreat();

    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 2 }]);
  });

  test("direct retreat path to SortieScene refunds", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    harness.internals.onHeroRetreat();

    expect(harness.starts).toContain("SortieScene");
    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 3 }]);
  });

  test("endSortie path refunds before merge/transition", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    if (GameState.currentSortie) {
      GameState.currentSortie.fights_completed = 2;
    }
    harness.internals.state = "awaiting_hero";
    harness.internals.onHeroReload();
    harness.internals.onHeroRetreat();

    const stashEntry = GameState.baseStash.find(s => s.item_id === "ammo_9x18");
    expect(stashEntry?.count).toBe(3);
    expect(GameState.player.backpack).toEqual([]);
  });

  test("victory path refunds before transition", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    harness.internals.mobs[0]!.state.hp = 0;
    harness.internals.checkEnd();

    expect(harness.starts).toContain("LootScene");
    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 3 }]);
  });

  test("defeat/surrender path refunds if reachable in smoke harness", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    GameState.player.hp = 0;
    harness.internals.checkEnd();

    const surrenderBtn = (harness.scene as any).children.list.find((o: any) => {
      return o.events.has("pointerup") && o.list && o.list.some((child: any) => child.text === "Сдаться");
    });
    expect(surrenderBtn).toBeDefined();
    surrenderBtn.events.get("pointerup")();
    harness.delayed.forEach(cb => cb());

    const stashEntry = GameState.baseStash.find(s => s.item_id === "ammo_9x18");
    expect(stashEntry).toBeDefined();
    expect(stashEntry!.count).toBeGreaterThan(0);
  });

  test("refund idempotent: double call does not duplicate ammo", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    (harness.scene as any).refundRuntimeMagazinesToBackpack();
    (harness.scene as any).refundRuntimeMagazinesToBackpack();

    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 3 }]);
    expect((harness.scene as any).currentMagazineByWeaponId.size).toBe(0);
  });

  test("invalid reload/no reserve/full magazine does not mutate backpack/magazine", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "knife";
    const harness1 = createSceneHarness();
    harness1.scene.create();
    harness1.internals.onHeroReload();
    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 3 }]);
    expect((harness1.scene as any).currentMagazineByWeaponId.size).toBe(0);

    seedGameState([]);
    GameState.player.equipped_weapon_id = "pm";
    const harness2 = createSceneHarness();
    harness2.scene.create();
    harness2.internals.onHeroReload();
    expect(GameState.player.backpack).toEqual([]);
    expect((harness2.scene as any).currentMagazineByWeaponId.size).toBe(0);

    seedGameState([{ item_id: "ammo_9x18", count: 12 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness3 = createSceneHarness();
    harness3.scene.create();
    harness3.internals.onHeroReload();
    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 4 }]);
    expect((harness3.scene as any).currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 8 });
    harness3.internals.onHeroReload();
    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 4 }]);
    expect((harness3.scene as any).currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 8 });
  });

  test("melee attack unchanged", () => {
    seedGameState([]);
    GameState.player.equipped_weapon_id = "knife";
    const harness = createSceneHarness();
    harness.scene.create();
    const hpBefore = harness.internals.mobs[0]!.state.hp;
    harness.internals.onHeroAttack();
    expect(harness.internals.mobs[0]!.state.hp).toBeLessThan(hpBefore);
    expect(harness.internals.logLines.at(-1)).toContain("Герой бьёт");
    expect((harness.scene as any).currentMagazineByWeaponId.has("knife")).toBe(false);
  });

  test("clicking reload with invalid capacity logs invalid_capacity reason and does not mutate backpack or AP or state", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 12 }]);
    GameState.player.equipped_weapon_id = "invalid_capacity_pistol";
    const harness = createSceneHarness();
    harness.scene.create();
    const backpackBefore = JSON.stringify(GameState.player.backpack);
    const apBefore = harness.internals.currentAp;

    harness.internals.onHeroReload();

    expect(harness.internals.logLines.at(-1)).toBe("Перезарядка: неизвестна ёмкость магазина.");
    expect(JSON.stringify(GameState.player.backpack)).toBe(backpackBefore);
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(harness.internals.state).toBe("awaiting_hero");
  });

  test("magazine preview updates correctly after reload and attack", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    harness.internals.updateDisplay();

    let activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("Магазин: 3/8") && text.includes("Запас: 0"))).toBe(true);

    harness.internals.onHeroAttack();
    harness.internals.updateDisplay();

    activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
    expect(activeTexts.some((text) => text.includes("Магазин: 2/8"))).toBe(true);
  });

  test("reload after partial magazine fills correct amount without duplication or loss", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 5 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    expect(GameState.player.backpack).toEqual([]);
    let magazineEntry = (harness.scene as any).currentMagazineByWeaponId.get("pm");
    expect(magazineEntry).toEqual({ ammoId: "ammo_9x18", count: 5 });

    harness.internals.onHeroAttack();
    harness.internals.state = "awaiting_hero";
    harness.internals.onHeroAttack();
    magazineEntry = (harness.scene as any).currentMagazineByWeaponId.get("pm");
    expect(magazineEntry).toEqual({ ammoId: "ammo_9x18", count: 3 });

    GameState.player.backpack = [{ item_id: "ammo_9x18", count: 10 }];

    harness.internals.state = "awaiting_hero";
    harness.internals.onHeroReload();

    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 5 }]);
    magazineEntry = (harness.scene as any).currentMagazineByWeaponId.get("pm");
    expect(magazineEntry).toEqual({ ammoId: "ammo_9x18", count: 8 });
  });

  test("clicking reload on full magazine logs disabled reason and does not mutate backpack or magazine", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 12 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 4 }]);
    let magazineEntry = (harness.scene as any).currentMagazineByWeaponId.get("pm");
    expect(magazineEntry).toEqual({ ammoId: "ammo_9x18", count: 8 });

    harness.internals.onHeroReload();
    expect(harness.internals.logLines.at(-1)).toBe("Перезарядка: магазин полон.");
    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 4 }]);
    magazineEntry = (harness.scene as any).currentMagazineByWeaponId.get("pm");
    expect(magazineEntry).toEqual({ ammoId: "ammo_9x18", count: 8 });
  });

  test("insufficient magazine for ammo_per_shot > 1 uses weak fallback and does not consume reserve or magazine", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 10 }]);
    GameState.player.equipped_weapon_id = "heavy_ranged";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 2 }]);
    let magazineEntry = (harness.scene as any).currentMagazineByWeaponId.get("heavy_ranged");
    expect(magazineEntry).toEqual({ ammoId: "ammo_9x18", count: 8 });

    (harness.scene as any).currentMagazineByWeaponId.set("heavy_ranged", { ammoId: "ammo_9x18", count: 1 });

    harness.internals.onHeroAttack();

    expect(harness.internals.logLines).toContain("Нет патронов — удар прикладом.");
    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 2 }]);
    magazineEntry = (harness.scene as any).currentMagazineByWeaponId.get("heavy_ranged");
    expect(magazineEntry).toEqual({ ammoId: "ammo_9x18", count: 1 });
  });

  test("ranged attack does not consume backpack ammo directly", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 10 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    harness.internals.onHeroReload();
    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 2 }]);

    harness.internals.onHeroAttack();

    expect(GameState.player.backpack).toEqual([{ item_id: "ammo_9x18", count: 2 }]);
  });

  test("reload does not change AP or advance turn, but attack does", () => {
    seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
    GameState.player.equipped_weapon_id = "pm";
    const harness = createSceneHarness();
    harness.scene.create();

    const apBefore = harness.internals.currentAp;

    harness.internals.onHeroReload();
    expect(harness.internals.currentAp).toBe(apBefore);
    expect(harness.internals.state).toBe("awaiting_hero");

    harness.internals.onHeroAttack();
    expect(harness.internals.state).toBe("resolving_mobs");
  });

  describe("M12.5 PR8b — display-only combat status chips", () => {
    test("1. Initial render: no status chips by default, but existing elements visible", () => {
      const harness = createSceneHarness();
      harness.scene.create();
      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);

      expect(activeTexts.some((t) => t.includes("Кровь") || t.includes("Открыт") || t.includes("Подавлен"))).toBe(false);
      expect(activeTexts.some((t) => t.includes("AP ●●●"))).toBe(true);
      expect(activeTexts.some((t) => t.includes("Дистанция: средне"))).toBe(true);
      expect(activeTexts.some((t) => t.includes("Шум: тихо"))).toBe(true);
      expect(activeTexts.some((t) => t.includes("Мародёр [Намерение:"))).toBe(true);
    });

    test("2. Hero status chip render and safety", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const apBefore = harness.internals.currentAp;
      const noiseBefore = harness.internals.currentNoise;
      const backpackBefore = JSON.stringify(GameState.player.backpack);
      const magazineBefore = JSON.stringify(Array.from((harness.scene as any).currentMagazineByWeaponId.entries()));

      const statuses: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 2 },
        { id: "exposed", durationTurns: 1 },
        { id: "suppressed", durationTurns: 3 },
      ];
      (harness.scene as any).setCombatStatusesForTest("hero", statuses);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.some((t) => t.includes("Кровь 2") && t.includes("Открыт 1") && t.includes("Подавлен 3"))).toBe(true);

      expect(harness.internals.currentAp).toBe(apBefore);
      expect(harness.internals.currentNoise).toBe(noiseBefore);
      expect(JSON.stringify(GameState.player.backpack)).toBe(backpackBefore);
      expect(JSON.stringify(Array.from((harness.scene as any).currentMagazineByWeaponId.entries()))).toBe(magazineBefore);
    });

    test("3. Enemy status chip render", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const mobId = harness.internals.mobs[0]!.mob.id;
      const statuses: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 2 },
        { id: "exposed", durationTurns: 1 },
      ];
      (harness.scene as any).setCombatStatusesForTest(mobId, statuses);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.some((t) => t.includes("Кровь 2") && t.includes("Открыт 1"))).toBe(true);
      expect(activeTexts.some((t) => t.includes("Мародёр [Намерение:"))).toBe(true);
    });

    test("4. Status chip overflow formatting", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const statuses: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 2 },
        { id: "exposed", durationTurns: 1 },
        { id: "suppressed", durationTurns: 1 },
        { id: "suppressed", durationTurns: 2 },
      ];
      (harness.scene as any).setCombatStatusesForTest("hero", statuses);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const chipText = activeTexts.find((t) => t.includes("+2"));
      expect(chipText).toBeDefined();
      expect(chipText).toContain("Кровь 2");
      expect(chipText).toContain("Открыт 1");
      expect(chipText).toContain("+2");
      expect(chipText).not.toContain("Подавлен");

      const segments = chipText!.split(" · ");
      expect(segments).toHaveLength(3);
    });

    test("5. Status chip sorting priority", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const statuses: CombatStatusInstance[] = [
        { id: "suppressed", durationTurns: 3 },
        { id: "exposed", durationTurns: 1 },
        { id: "bleed", durationTurns: 2 },
      ];
      (harness.scene as any).setCombatStatusesForTest("hero", statuses);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const chipText = activeTexts.find((t) => t.includes("Кровь 2"));
      expect(chipText).toBeDefined();
      expect(chipText).toBe("Кровь 2 · Открыт 1 · Подавлен 3");
    });

    test("6. Non-mutation of statuses on refresh", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const initialStatuses: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 2 },
        { id: "exposed", durationTurns: 1 },
      ];
      (harness.scene as any).setCombatStatusesForTest("hero", initialStatuses);

      harness.internals.updateDisplay();
      harness.internals.updateActionPreview();
      harness.internals.updateDisplay();
      harness.internals.updateActionPreview();

      const currentStatuses = (harness.scene as any).combatStatusesByTarget.get("hero");
      expect(currentStatuses).toEqual(initialStatuses);
      expect(currentStatuses[0].durationTurns).toBe(2);
      expect(currentStatuses[1].durationTurns).toBe(1);
    });

    test("7. Gameplay actions do not mutate statuses", () => {
      seedGameState([{ item_id: "ammo_9x18", count: 10 }]);
      GameState.player.equipped_weapon_id = "pm";
      const harness = createSceneHarness();
      harness.scene.create();

      const heroStatuses: CombatStatusInstance[] = [{ id: "bleed", durationTurns: 2 }];
      const mobId = harness.internals.mobs[0]!.mob.id;
      const enemyStatuses: CombatStatusInstance[] = [{ id: "exposed", durationTurns: 1 }];

      (harness.scene as any).setCombatStatusesForTest("hero", heroStatuses);
      (harness.scene as any).setCombatStatusesForTest(mobId, enemyStatuses);

      // Reload PM
      harness.internals.onHeroReload();
      expect((harness.scene as any).combatStatusesByTarget.get("hero")).toEqual(heroStatuses);
      expect((harness.scene as any).combatStatusesByTarget.get(mobId)).toEqual(enemyStatuses);
      expect((harness.scene as any).currentMagazineByWeaponId.get("pm")).toEqual({ ammoId: "ammo_9x18", count: 8 });

      // Attack with loaded firearm
      harness.internals.onHeroAttack();
      expect((harness.scene as any).combatStatusesByTarget.get("hero")).toEqual(heroStatuses);
      expect((harness.scene as any).combatStatusesByTarget.get(mobId)).toEqual(enemyStatuses);
      expect(harness.internals.currentNoise).toBeGreaterThan(0);

      // Reset state for further moves
      harness.internals.state = "awaiting_hero";

      // Movement preview
      harness.internals.onHeroMoveCloser();
      expect((harness.scene as any).combatStatusesByTarget.get("hero")).toEqual(heroStatuses);
      expect((harness.scene as any).combatStatusesByTarget.get(mobId)).toEqual(enemyStatuses);

      // Cover
      harness.internals.onHeroCover();
      expect((harness.scene as any).combatStatusesByTarget.get("hero")).toEqual(heroStatuses);
      expect((harness.scene as any).combatStatusesByTarget.get(mobId)).toEqual(enemyStatuses);
      expect(GameState.currentSortie?.cover_active).toBe(true);
    });

    test("8. Empty magazine fallback does not mutate statuses", () => {
      seedGameState([]);
      GameState.player.equipped_weapon_id = "pm";
      const harness = createSceneHarness();
      harness.scene.create();

      const heroStatuses: CombatStatusInstance[] = [{ id: "suppressed", durationTurns: 2 }];
      (harness.scene as any).setCombatStatusesForTest("hero", heroStatuses);

      harness.internals.onHeroAttack();

      expect(harness.internals.logLines).toContain("Нет патронов — удар прикладом.");
      expect((harness.scene as any).combatStatusesByTarget.get("hero")).toEqual(heroStatuses);
    });

    test("9. Lifecycle and new scene reset", () => {
      const harness1 = createSceneHarness();
      harness1.scene.create();
      const statuses: CombatStatusInstance[] = [{ id: "bleed", durationTurns: 2 }];
      (harness1.scene as any).setCombatStatusesForTest("hero", statuses);
      expect((harness1.scene as any).combatStatusesByTarget.get("hero")).toBeDefined();

      const harness2 = createSceneHarness();
      harness2.scene.create();
      const activeTexts = harness2.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.some((t) => t.includes("Кровь"))).toBe(false);
      expect((harness2.scene as any).combatStatusesByTarget.get("hero")).toBeUndefined();
    });

    test("10. Dead/fled mob guard", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const mobId = harness.internals.mobs[0]!.mob.id;
      const statuses: CombatStatusInstance[] = [{ id: "bleed", durationTurns: 2 }];
      (harness.scene as any).setCombatStatusesForTest(mobId, statuses);

      // Verify status renders initially
      let activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.some((t) => t.includes("Мародёр"))).toBe(true);
      expect(activeTexts.some((t) => t.includes("Кровь 2"))).toBe(true);

      // Dead mob
      harness.internals.mobs[0]!.state.hp = 0;
      harness.internals.updateDisplay();

      activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.some((t) => t.includes("Мародёр"))).toBe(false);
      expect(activeTexts.some((t) => t.includes("Кровь"))).toBe(false);
    });

    test("11. Regression guard for all HUD elements", () => {
      seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
      GameState.player.equipped_weapon_id = "pm";
      const harness = createSceneHarness();
      harness.scene.create();
      harness.internals.onHeroReload();
      harness.internals.updateDisplay();

      const expectedButtonLabels = ["АТАКА", "УКРЫТИЕ", "АПТЕЧКА", "ПЕРЕЗАРЯДКА", "БЛИЖЕ", "ДАЛЬШЕ", "ОТСТУП"];
      for (const label of expectedButtonLabels) {
        expect(
          harness.textObjects.filter((obj) => obj.text === label),
          `button label: ${label}`
        ).toHaveLength(1);
      }

      const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
      expect(activeTexts.some((text) => text.includes("AP"))).toBe(true);
      expect(activeTexts.some((text) => text.includes("Магазин:"))).toBe(true);
      expect(activeTexts.some((text) => text.includes("Дистанция:"))).toBe(true);
      expect(activeTexts.some((text) => text.includes("Шум:"))).toBe(true);
      expect(activeTexts.some((text) => text.includes("Намерение:"))).toBe(true);
    });

    test("A.1. Status display does not mutate source arrays", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const initialStatuses: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 2 },
        { id: "exposed", durationTurns: 1 },
      ];
      Object.freeze(initialStatuses);
      Object.freeze(initialStatuses[0]);
      Object.freeze(initialStatuses[1]);

      (harness.scene as any).setCombatStatusesForTest("hero", initialStatuses);

      for (let i = 0; i < 5; i++) {
        harness.internals.updateDisplay();
        harness.internals.updateActionPreview();
      }

      const storedStatuses = (harness.scene as any).combatStatusesByTarget.get("hero");
      expect(storedStatuses).toEqual([
        { id: "bleed", durationTurns: 2 },
        { id: "exposed", durationTurns: 1 },
      ]);
      expect(storedStatuses[0].durationTurns).toBe(2);
      expect(storedStatuses[1].durationTurns).toBe(1);
    });

    test("A.2. Invalid statuses through seam are safely ignored/normalized", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const malformed: any[] = [
        { id: "unknown_id", durationTurns: 2 },
        { id: "bleed", durationTurns: -5 },
        { id: "exposed", durationTurns: Number.NaN },
        { id: "suppressed", durationTurns: 1.5 },
      ];

      (harness.scene as any).setCombatStatusesForTest("hero", malformed as CombatStatusInstance[]);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const chipText = activeTexts.find((t) => t.includes("Кровь"));
      expect(chipText).toBeDefined();

      expect(chipText).not.toContain("unknown_id");

      expect(chipText).toContain("Кровь");
      expect(chipText).not.toContain("Кровь -");
      expect(chipText).not.toContain("Кровь 0");

      expect(chipText).toContain("Открыт");
      expect(chipText).not.toContain("Открыт NaN");

      expect(chipText).toContain("Подавлен");
      expect(chipText).not.toContain("Подавлен 1");
      expect(chipText).not.toContain("Подавлен 2");
    });

    test("A.3. Overflow exact behavior for hero", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const s3: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 2 },
        { id: "exposed", durationTurns: 1 },
        { id: "suppressed", durationTurns: 1 },
      ];
      (harness.scene as any).setCombatStatusesForTest("hero", s3);
      let activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      let chipText = activeTexts.find((t) => t.includes("Кровь 2"));
      expect(chipText).toBe("Кровь 2 · Открыт 1 · Подавлен 1");
      expect(chipText!.split(" · ")).toHaveLength(3);

      const s4: CombatStatusInstance[] = [
        ...s3,
        { id: "suppressed", durationTurns: 2 },
      ];
      (harness.scene as any).setCombatStatusesForTest("hero", s4);
      activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      chipText = activeTexts.find((t) => t.includes("Кровь 2"));
      expect(chipText).toBe("Кровь 2 · Открыт 1 · +2");
      expect(chipText!.split(" · ")).toHaveLength(3);

      const s5: CombatStatusInstance[] = [
        ...s4,
        { id: "suppressed", durationTurns: 3 },
      ];
      (harness.scene as any).setCombatStatusesForTest("hero", s5);
      activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      chipText = activeTexts.find((t) => t.includes("Кровь 2"));
      expect(chipText).toBe("Кровь 2 · Открыт 1 · +3");
      expect(chipText!.split(" · ")).toHaveLength(3);
    });

    test("A.4. Overflow exact behavior for enemy status line", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const mobId = harness.internals.mobs[0]!.mob.id;

      const s3: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 2 },
        { id: "exposed", durationTurns: 1 },
        { id: "suppressed", durationTurns: 1 },
      ];
      (harness.scene as any).setCombatStatusesForTest(mobId, s3);
      let activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      let chipText = activeTexts.find((t) => t.includes("Кровь 2"));
      expect(chipText).toBe("Кровь 2 · Открыт 1 · Подавлен 1");
      expect(activeTexts.some((t) => t.includes("Мародёр [Намерение:"))).toBe(true);

      const s4: CombatStatusInstance[] = [
        ...s3,
        { id: "suppressed", durationTurns: 2 },
      ];
      (harness.scene as any).setCombatStatusesForTest(mobId, s4);
      activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      chipText = activeTexts.find((t) => t.includes("Кровь 2"));
      expect(chipText).toBe("Кровь 2 · Открыт 1 · +2");
      expect(activeTexts.some((t) => t.includes("Мародёр [Намерение:"))).toBe(true);

      const s5: CombatStatusInstance[] = [
        ...s4,
        { id: "suppressed", durationTurns: 3 },
      ];
      (harness.scene as any).setCombatStatusesForTest(mobId, s5);
      activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      chipText = activeTexts.find((t) => t.includes("Кровь 2"));
      expect(chipText).toBe("Кровь 2 · Открыт 1 · +3");
      expect(activeTexts.some((t) => t.includes("Мародёр [Намерение:"))).toBe(true);
    });

    test("A.5. Dead/fled status guard does not render status chips", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const mobId = harness.internals.mobs[0]!.mob.id;
      const statuses: CombatStatusInstance[] = [{ id: "bleed", durationTurns: 2 }];
      (harness.scene as any).setCombatStatusesForTest(mobId, statuses);

      let activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.some((t) => t.includes("Мародёр"))).toBe(true);
      expect(activeTexts.some((t) => t.includes("Кровь 2"))).toBe(true);

      harness.internals.mobs[0]!.state.hp = 0;
      harness.internals.updateDisplay();
      activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.some((t) => t.includes("Мародёр"))).toBe(false);
      expect(activeTexts.some((t) => t.includes("Кровь 2"))).toBe(false);

      harness.internals.mobs[0]!.state.hp = 20;
      harness.internals.mobs[0]!.state.fled = true;
      harness.internals.updateDisplay();
      activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.some((t) => t.includes("Мародёр"))).toBe(false);
      expect(activeTexts.some((t) => t.includes("Кровь 2"))).toBe(false);
    });

    test("A.6. Duplicate mob/content-id risk guard: display-only seam limitation comment and test", () => {
      if (GameState.currentSortie) {
        GameState.currentSortie.encounters = [["marauder", "marauder"]];
      }

      const harness = createSceneHarness();
      harness.scene.create();

      expect(harness.internals.mobs).toHaveLength(2);
      expect(harness.internals.mobs[0]!.mob.id).toBe("marauder");
      expect(harness.internals.mobs[1]!.mob.id).toBe("marauder");

      const statuses: CombatStatusInstance[] = [{ id: "bleed", durationTurns: 2 }];
      (harness.scene as any).setCombatStatusesForTest("marauder", statuses);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const marauderTexts = activeTexts.filter((t) => t.includes("Кровь 2"));
      expect(marauderTexts).toHaveLength(2);
    });

    test("A.7. Status chips survive existing display refresh and do not duplicate", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const mobId = harness.internals.mobs[0]!.mob.id;
      const heroStatuses: CombatStatusInstance[] = [{ id: "bleed", durationTurns: 2 }];
      const enemyStatuses: CombatStatusInstance[] = [{ id: "exposed", durationTurns: 1 }];

      (harness.scene as any).setCombatStatusesForTest("hero", heroStatuses);
      (harness.scene as any).setCombatStatusesForTest(mobId, enemyStatuses);

      for (let i = 0; i < 3; i++) {
        harness.internals.updateDisplay();
      }

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);

      const heroLines = activeTexts.filter((t) => t === "Кровь 2");
      expect(heroLines).toHaveLength(1);

      const enemyLines = activeTexts.filter((t) => t === "Открыт 1");
      expect(enemyLines).toHaveLength(1);
    });

    test("A.8. Gameplay non-mutation matrix", () => {
      seedGameState([
        { item_id: "ammo_9x18", count: 10 },
        { item_id: "bandage", count: 2 },
      ]);
      GameState.player.equipped_weapon_id = "pm";

      const harness = createSceneHarness();
      harness.scene.create();

      const heroStatuses: CombatStatusInstance[] = [{ id: "bleed", durationTurns: 2 }];
      const mobId = harness.internals.mobs[0]!.mob.id;
      const enemyStatuses: CombatStatusInstance[] = [{ id: "exposed", durationTurns: 1 }];

      (harness.scene as any).setCombatStatusesForTest("hero", heroStatuses);
      (harness.scene as any).setCombatStatusesForTest(mobId, enemyStatuses);

      const verifyUnchanged = () => {
        expect((harness.scene as any).combatStatusesByTarget.get("hero")).toEqual(heroStatuses);
        expect((harness.scene as any).combatStatusesByTarget.get(mobId)).toEqual(enemyStatuses);
      };

      harness.internals.onHeroReload();
      verifyUnchanged();

      harness.internals.onHeroAttack();
      verifyUnchanged();

      harness.internals.state = "awaiting_hero";

      harness.internals.onHeroMoveCloser();
      verifyUnchanged();

      harness.internals.onHeroCover();
      verifyUnchanged();

      harness.internals.onHeroHeal();
      verifyUnchanged();

      harness.internals.state = "awaiting_hero";
      (harness.scene as any).currentMagazineByWeaponId.clear();
      GameState.player.backpack = [];

      harness.internals.onHeroAttack();
      verifyUnchanged();

      harness.internals.onHeroRetreat();
      verifyUnchanged();
    });

    test("A.9. Lifecycle clearing on create and scene transitions", () => {
      const harness1 = createSceneHarness();
      harness1.scene.create();
      const statuses: CombatStatusInstance[] = [{ id: "bleed", durationTurns: 2 }];
      (harness1.scene as any).setCombatStatusesForTest("hero", statuses);
      expect((harness1.scene as any).combatStatusesByTarget.get("hero")).toEqual(statuses);

      const harness2 = createSceneHarness();
      harness2.scene.create();
      expect((harness2.scene as any).combatStatusesByTarget.size).toBe(0);
      const activeTexts = harness2.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.some((t) => t.includes("Кровь"))).toBe(false);
    });

    test("A.10. UI regression guard with active statuses", () => {
      seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
      GameState.player.equipped_weapon_id = "pm";
      const harness = createSceneHarness();
      harness.scene.create();

      const heroStatuses: CombatStatusInstance[] = [
        { id: "bleed", durationTurns: 2 },
        { id: "exposed", durationTurns: 1 },
      ];
      const mobId = harness.internals.mobs[0]!.mob.id;
      const enemyStatuses: CombatStatusInstance[] = [{ id: "suppressed", durationTurns: 2 }];

      (harness.scene as any).setCombatStatusesForTest("hero", heroStatuses);
      (harness.scene as any).setCombatStatusesForTest(mobId, enemyStatuses);

      harness.internals.onHeroReload();
      harness.internals.updateDisplay();

      const expectedButtonLabels = ["АТАКА", "УКРЫТИЕ", "АПТЕЧКА", "ПЕРЕЗАРЯДКА", "БЛИЖЕ", "ДАЛЬШЕ", "ОТСТУП"];
      for (const label of expectedButtonLabels) {
        expect(
          harness.textObjects.filter((obj) => obj.text === label),
          `button label: ${label}`
        ).toHaveLength(1);
      }

      const activeTexts = harness.textObjects.filter((obj) => !obj.destroyed).map((obj) => obj.text);
      expect(activeTexts.some((text) => text.includes("AP"))).toBe(true);
      expect(activeTexts.some((text) => text.includes("Магазин:"))).toBe(true);
      expect(activeTexts.some((text) => text.includes("Дистанция:"))).toBe(true);
      expect(activeTexts.some((text) => text.includes("Шум:"))).toBe(true);
      expect(activeTexts.some((text) => text.includes("Намерение:"))).toBe(true);

      expect(activeTexts.some((text) => text.includes("Кровь 2 · Открыт 1"))).toBe(true);
      expect(activeTexts.some((text) => text.includes("Подавлен 2"))).toBe(true);
    });
  });

  describe("M12.5 PR8d-a — preview-only status application copy", () => {
    test("1. No preview by default", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const attackPreview = activeTexts.find((t) => t.includes("Атака"));
      expect(attackPreview).toBeDefined();
      expect(attackPreview).not.toContain("Кровь");
      expect(attackPreview).not.toContain("Открыт");
      expect(attackPreview).not.toContain("Подавлен");
    });

    test("2. Configured attack preview", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const status: CombatStatusInstance = { id: "bleed", durationTurns: 2 };
      (harness.scene as any).setStatusPreviewForTest("attack", status);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const attackPreview = activeTexts.find((t) => t.includes("Атака"));
      expect(attackPreview).toBeDefined();
      expect(attackPreview).toContain("Кровь 2");
      expect((harness.scene as any).combatStatusesByTarget.size).toBe(0);
    });

    test("3. Loaded firearm combines noise and status", () => {
      seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
      GameState.player.equipped_weapon_id = "pm";
      const harness = createSceneHarness();
      harness.scene.create();

      harness.internals.onHeroReload();
      harness.internals.updateDisplay();

      const status: CombatStatusInstance = { id: "bleed", durationTurns: 2 };
      (harness.scene as any).setStatusPreviewForTest("attack", status);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const attackPreview = activeTexts.find((t) => t.includes("Атака"));
      expect(attackPreview).toBeDefined();
      expect(attackPreview).toContain("Шум +2 · Кровь 2");
      expect(harness.internals.currentNoise).toBe(0);
      expect((harness.scene as any).combatStatusesByTarget.size).toBe(0);
    });

    test("4. Repeated preview refresh", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const status: CombatStatusInstance = { id: "bleed", durationTurns: 2 };
      (harness.scene as any).setStatusPreviewForTest("attack", status);

      harness.internals.updateActionPreview();
      harness.internals.updateDisplay();
      harness.internals.updateActionPreview();
      harness.internals.updateDisplay();

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const attackPreview = activeTexts.find((t) => t.includes("Атака"));
      expect(attackPreview).toBeDefined();

      const matches = attackPreview!.match(/Кровь 2/g);
      expect(matches).toHaveLength(1);

      expect((harness.scene as any).statusPreviewByAction.size).toBe(1);
      expect((harness.scene as any).combatStatusesByTarget.size).toBe(0);
    });

    test("5. Attack click does not apply status", () => {
      seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
      GameState.player.equipped_weapon_id = "pm";
      const harness = createSceneHarness();
      harness.scene.create();

      harness.internals.onHeroReload();
      harness.internals.updateDisplay();

      const status: CombatStatusInstance = { id: "bleed", durationTurns: 2 };
      (harness.scene as any).setStatusPreviewForTest("attack", status);

      // Verify magazine count before shot
      expect(harness.internals.currentMagazineByWeaponId.get("pm")?.count).toBe(3);

      harness.internals.onHeroAttack();

      // Assert currentNoise increments as existing PR7 behavior
      expect(harness.internals.currentNoise).toBe(2);

      // Assert magazine decrements
      expect(harness.internals.currentMagazineByWeaponId.get("pm")?.count).toBe(2);

      // Assert combatStatusesByTarget remains empty (no status application)
      expect((harness.scene as any).combatStatusesByTarget.size).toBe(0);

      // Assert statusPreviewByAction still contains preview entry
      expect((harness.scene as any).statusPreviewByAction.get("attack")).toEqual(status);
    });

    test("6. Empty magazine fallback", () => {
      seedGameState([]);
      GameState.player.equipped_weapon_id = "pm";
      const harness = createSceneHarness();
      harness.scene.create();

      const status: CombatStatusInstance = { id: "bleed", durationTurns: 2 };
      (harness.scene as any).setStatusPreviewForTest("attack", status);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const attackPreview = activeTexts.find((t) => t.includes("Атака"));
      expect(attackPreview).toBeDefined();
      expect(attackPreview).not.toContain("Шум +2");
      expect(attackPreview).not.toContain("Кровь 2");

      harness.internals.onHeroAttack();
      expect(harness.internals.logLines).toContain("Нет патронов — удар прикладом.");
      expect((harness.scene as any).combatStatusesByTarget.size).toBe(0);
    });

    test("7. Disabled attack", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      harness.internals.state = "resolving_mobs";
      harness.internals.updateActionPreview();

      const status: CombatStatusInstance = { id: "bleed", durationTurns: 2 };
      (harness.scene as any).setStatusPreviewForTest("attack", status);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const attackPreview = activeTexts.find((t) => t.includes("Атака"));
      expect(attackPreview).toBeDefined();
      expect(attackPreview).toContain("действие недоступно");
      expect(attackPreview).not.toContain("Кровь 2");
      expect((harness.scene as any).combatStatusesByTarget.size).toBe(0);
    });

    test("8. Other actions excluded", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const status: CombatStatusInstance = { id: "bleed", durationTurns: 2 };
      (harness.scene as any).setStatusPreviewForTest("attack", status);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const previewTextObj = activeTexts.find((t) => t.includes("Атака"));
      expect(previewTextObj).toBeDefined();

      const firstLine = previewTextObj!.split("\n")[0];
      const segments = firstLine!.split(" · ");

      expect(segments.some((s) => s.includes("Атака"))).toBe(true);
      expect(segments.some((s) => s.includes("Кровь 2"))).toBe(true);

      const coverSeg = segments.find((s) => s.includes("Укрытие"));
      expect(coverSeg).toBeDefined();
      expect(coverSeg).not.toContain("Кровь 2");

      const healSeg = segments.find((s) => s.includes("Аптечка"));
      expect(healSeg).toBeDefined();
      expect(healSeg).not.toContain("Кровь 2");

      const retreatSeg = segments.find((s) => s.includes("Отступ"));
      expect(retreatSeg).toBeDefined();
      expect(retreatSeg).not.toContain("Кровь 2");
    });

    test("9. Clear preview seam", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const status: CombatStatusInstance = { id: "bleed", durationTurns: 2 };
      (harness.scene as any).setStatusPreviewForTest("attack", status);

      let activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.find((t) => t.includes("Атака"))).toContain("Кровь 2");

      (harness.scene as any).setStatusPreviewForTest("attack", null);
      activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.find((t) => t.includes("Атака"))).not.toContain("Кровь 2");
    });

    test("10. Existing active status chips unaffected", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const activeStatuses: CombatStatusInstance[] = [{ id: "exposed", durationTurns: 1 }];
      (harness.scene as any).setCombatStatusesForTest("hero", activeStatuses);

      const previewStatus: CombatStatusInstance = { id: "bleed", durationTurns: 2 };
      (harness.scene as any).setStatusPreviewForTest("attack", previewStatus);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);

      const chipText = activeTexts.find((t) => t.includes("Открыт 1"));
      expect(chipText).toBeDefined();

      const attackPreview = activeTexts.find((t) => t.includes("Атака"));
      expect(attackPreview).toContain("Кровь 2");

      expect(chipText).not.toContain("Кровь 2");
    });

    test("11. Scene-local preview map reset", () => {
      const harness1 = createSceneHarness();
      harness1.scene.create();

      const status: CombatStatusInstance = { id: "bleed", durationTurns: 2 };
      (harness1.scene as any).setStatusPreviewForTest("attack", status);

      let activeTexts = harness1.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.find((t) => t.includes("Атака"))).toContain("Кровь 2");

      const harness2 = createSceneHarness();
      harness2.scene.create();

      activeTexts = harness2.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      expect(activeTexts.find((t) => t.includes("Атака"))).not.toContain("Кровь 2");
      expect((harness2.scene as any).statusPreviewByAction.size).toBe(0);
      expect((harness2.scene as any).combatStatusesByTarget.size).toBe(0);
      expect(activeTexts.some((t) => t.includes("Открыт"))).toBe(false);
      expect(activeTexts.some((t) => t.includes("Кровь"))).toBe(false);
      expect(activeTexts.some((t) => t.includes("Подавлен"))).toBe(false);
    });

    test("12. Non-attack action keys ignored", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      (harness.scene as any).setStatusPreviewForTest("reload", { id: "bleed", durationTurns: 2 });
      (harness.scene as any).setStatusPreviewForTest("cover", { id: "exposed", durationTurns: 1 });
      (harness.scene as any).setStatusPreviewForTest("heal", { id: "suppressed", durationTurns: 1 });
      (harness.scene as any).setStatusPreviewForTest("movement", { id: "suppressed", durationTurns: 1 });
      (harness.scene as any).setStatusPreviewForTest("retreat", { id: "bleed", durationTurns: 2 });

      harness.internals.updateActionPreview();

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const previewTextObj = activeTexts.find((t) => t.includes("Атака"));
      expect(previewTextObj).toBeDefined();

      const lines = previewTextObj!.split("\n");
      const firstLine = lines[0];
      const secondLine = lines[1];

      // Assert none of those statuses appear in action preview line
      expect(firstLine).not.toContain("Кровь 2");
      expect(firstLine).not.toContain("Открыт 1");
      expect(firstLine).not.toContain("Подавлен 1");
      expect(secondLine).not.toContain("Подавлен 1");
      expect(secondLine).not.toContain("Кровь 2");

      // Assert map can contain seam entries, but UI ignores them
      expect((harness.scene as any).statusPreviewByAction.get("reload")).toEqual({ id: "bleed", durationTurns: 2 });
      expect((harness.scene as any).statusPreviewByAction.get("cover")).toEqual({ id: "exposed", durationTurns: 1 });
      expect((harness.scene as any).statusPreviewByAction.get("heal")).toEqual({ id: "suppressed", durationTurns: 1 });
      expect((harness.scene as any).statusPreviewByAction.get("movement")).toEqual({ id: "suppressed", durationTurns: 1 });
      expect((harness.scene as any).statusPreviewByAction.get("retreat")).toEqual({ id: "bleed", durationTurns: 2 });

      // Assert combatStatusesByTarget unchanged
      expect((harness.scene as any).combatStatusesByTarget.size).toBe(0);
    });

    test("13. Preview map source object non-mutation", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      const previewStatus = Object.freeze({ id: "bleed", durationTurns: 2 });
      (harness.scene as any).setStatusPreviewForTest("attack", previewStatus);

      harness.internals.updateActionPreview();
      harness.internals.updateDisplay();
      harness.internals.updateActionPreview();
      harness.internals.updateDisplay();

      // Assert original object unchanged
      expect(previewStatus.durationTurns).toBe(2);
      expect(previewStatus.id).toBe("bleed");

      // Assert statusPreviewByAction entry unchanged
      const stored = (harness.scene as any).statusPreviewByAction.get("attack");
      expect(stored).toEqual({ id: "bleed", durationTurns: 2 });

      // Assert combatStatusesByTarget remains empty
      expect((harness.scene as any).combatStatusesByTarget.size).toBe(0);
    });

    test("14. Invalid preview statuses are safe", () => {
      const harness = createSceneHarness();
      harness.scene.create();

      // Configure invalid configurations
      (harness.scene as any).setStatusPreviewForTest("attack", { id: "unknown_id", durationTurns: 2 } as unknown as CombatStatusInstance);
      harness.internals.updateActionPreview();
      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const attackPreview = activeTexts.find((t) => t.includes("Атака"));
      expect(attackPreview).toBeDefined();
      expect(attackPreview).not.toContain("unknown_id");

      (harness.scene as any).setStatusPreviewForTest("attack", { id: "bleed", durationTurns: -1 } as unknown as CombatStatusInstance);
      harness.internals.updateActionPreview();

      (harness.scene as any).setStatusPreviewForTest("attack", { id: "bleed", durationTurns: NaN } as unknown as CombatStatusInstance);
      harness.internals.updateActionPreview();

      (harness.scene as any).setStatusPreviewForTest("attack", { id: "bleed", durationTurns: 1.5 } as unknown as CombatStatusInstance);
      harness.internals.updateActionPreview();

      expect((harness.scene as any).combatStatusesByTarget.size).toBe(0);
    });

    test("15. Repeated attack preview after click does not apply status", () => {
      seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
      GameState.player.equipped_weapon_id = "pm";
      const harness = createSceneHarness();
      harness.scene.create();

      harness.internals.onHeroReload();
      harness.internals.updateDisplay();

      const status: CombatStatusInstance = { id: "bleed", durationTurns: 2 };
      (harness.scene as any).setStatusPreviewForTest("attack", status);

      harness.internals.onHeroAttack();
      expect(harness.internals.state).toBe("resolving_mobs");

      // Reset state back to awaiting_hero safely
      harness.internals.state = "awaiting_hero";
      harness.internals.updateActionPreview();
      harness.internals.updateDisplay();

      expect((harness.scene as any).combatStatusesByTarget.size).toBe(0);
      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const attackPreview = activeTexts.find((t) => t.includes("Атака"));
      expect(attackPreview).toContain("Кровь 2");
    });

    test("16. Melee configured preview", () => {
      seedGameState([]);
      GameState.player.equipped_weapon_id = "knife";
      const harness = createSceneHarness();
      harness.scene.create();

      const status: CombatStatusInstance = { id: "exposed", durationTurns: 1 };
      (harness.scene as any).setStatusPreviewForTest("attack", status);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);
      const attackPreview = activeTexts.find((t) => t.includes("Атака"));
      expect(attackPreview).toBeDefined();
      expect(attackPreview).toContain("Открыт 1");

      harness.internals.onHeroAttack();
      expect((harness.scene as any).combatStatusesByTarget.size).toBe(0);
    });

    test("17. HUD regression and layout integrity", () => {
      seedGameState([{ item_id: "ammo_9x18", count: 3 }]);
      GameState.player.equipped_weapon_id = "pm";
      const harness = createSceneHarness();
      harness.scene.create();

      harness.internals.onHeroReload();
      harness.internals.updateDisplay();

      // Configure preview
      (harness.scene as any).setStatusPreviewForTest("attack", { id: "bleed", durationTurns: 2 });

      // Configure active statuses to render chips
      (harness.scene as any).setCombatStatusesForTest("hero", [{ id: "exposed", durationTurns: 1 }]);

      const activeTexts = harness.textObjects.filter((o) => !o.destroyed).map((o) => o.text);

      // Verify all seven action buttons still render
      expect(activeTexts.some((t) => t === "АТАКА")).toBe(true);
      expect(activeTexts.some((t) => t === "УКРЫТИЕ")).toBe(true);
      expect(activeTexts.some((t) => t === "АПТЕЧКА")).toBe(true);
      expect(activeTexts.some((t) => t === "ОТСТУП")).toBe(true);
      expect(activeTexts.some((t) => t === "БЛИЖЕ")).toBe(true);
      expect(activeTexts.some((t) => t === "ДАЛЬШЕ")).toBe(true);

      // AP preview visible
      expect(activeTexts.some((t) => t === "AP ●●● 3/3")).toBe(true);

      // Ammo/magazine preview visible
      expect(activeTexts.some((t) => t.includes("Магазин: 3/8"))).toBe(true);

      // Distance chip visible
      expect(activeTexts.some((t) => t === "Дистанция: средне")).toBe(true);

      // Cover chip behavior still works/renders
      expect(activeTexts.some((t) => t === "Укрытие")).toBe(false);

      // Noise chip visible
      expect(activeTexts.some((t) => t === "Шум: тихо")).toBe(true);

      // Enemy intent visible
      expect(activeTexts.some((t) => t.includes("Мародёр [Намерение: атака]"))).toBe(true);

      // Active status chips still visible
      expect(activeTexts.some((t) => t.includes("Открыт 1"))).toBe(true);

      // Preview status copy does not erase Шум +2
      const attackPreview = activeTexts.find((t) => t.includes("Атака"));
      expect(attackPreview).toContain("Шум +2 · Кровь 2");
    });
  });
});

