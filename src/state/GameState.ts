import {
  HERO_BASE_SPEED,
  HERO_HP_MAX,
  HERO_MAX_WEIGHT_KG,
  HERO_START_ARMOR_ID,
  HERO_START_BANDAGES,
  HERO_START_LEVEL,
  HERO_START_WEAPON_ID,
  HERO_START_XP,
} from "./balance";
import type {
  BaseResources,
  BuildingState,
  ContentData,
  GameProgress,
  GameStateShape,
  InventoryStack,
  PlayerState,
  SettingsState,
  SortieState,
} from "./types";
import type { BaseResourceId } from "../types/sortie";
import { loadContentItems } from "./ItemRegistry";

const createDefaultPlayer = (): PlayerState => ({
  hp: HERO_HP_MAX,
  hp_max: HERO_HP_MAX,
  level: HERO_START_LEVEL,
  xp: HERO_START_XP,
  max_weight_kg: HERO_MAX_WEIGHT_KG,
  // M13 PR-6a: discriminated equip. Стартовый knife (post-migration
  // craft_knife) — catalog kind=weapon, плюс пустой crafted_weapons.
  // Стартовая броня cloth_jacket — armor.slot=plate, в соответствующий
  // слот; helm/strap пустые.
  equipped_weapon: { kind: "catalog", id: HERO_START_WEAPON_ID },
  crafted_weapons: [],
  equipped_armor_ids: { plate: HERO_START_ARMOR_ID },
  perks: [],
  backpack: [],
  gas: 5,
  injuries: [],
});

const createEmptyContent = (): ContentData => ({
  items: {},
  mobs: {},
  recipes: {},
  zones: {},
  radioSignals: [],
  perks: {},
});

const createDefaultProgress = (): GameProgress => ({
  forest_depth_2_completed: false,
  any_warehouse_sortie_completed: false,
  any_forest_sortie_completed: false,
  suburbs_sortie_completed: false,
  warehouse_boss_defeated: false,
  factory_sortie_completed: false,
  city_boss_defeated: false,
  metro_sortie_completed: false,
  daily_completed: {},
  radio_trust: 0,
});

const createDefaultSettings = (): SettingsState => ({
  sfxMuted: false,
  sfxVolume: 1.0,
});

export const createDefaultBaseResources = (): BaseResources => ({
  water: 0,
  fuel: 0,
  metal: 0,
  food: 0,
});

/**
 * M13 PR-6c: дефолтный набор построек для новой игры. Always-on per
 * preflight §7 — никакого build/unlock UI, оба здания пред-размещены
 * с пустым буфером.
 */
export const createDefaultBuildings = (): BuildingState[] => [
  { id: "garden", accumulated_output: 0 },
  { id: "bunk", accumulated_output: 0 },
];

const state: GameStateShape = {
  player: createDefaultPlayer(),
  data: createEmptyContent(),
  currentSortie: null,
  baseStash: [{ item_id: "bandage", count: HERO_START_BANDAGES }],
  baseResources: createDefaultBaseResources(),
  buildings: createDefaultBuildings(),
  progress: createDefaultProgress(),
  settings: createDefaultSettings(),
};

export const GameState = {
  get player(): PlayerState {
    return state.player;
  },
  set player(value: PlayerState) {
    state.player = value;
  },
  get data(): ContentData {
    return state.data;
  },
  set data(value: ContentData) {
    state.data = value;
  },
  get currentSortie(): SortieState | null {
    return state.currentSortie;
  },
  set currentSortie(value: SortieState | null) {
    state.currentSortie = value;
  },
  get baseStash(): InventoryStack[] {
    return state.baseStash;
  },
  set baseStash(value: InventoryStack[]) {
    state.baseStash = value;
  },
  get baseResources(): BaseResources {
    return state.baseResources;
  },
  set baseResources(value: BaseResources) {
    state.baseResources = value;
  },
  get buildings(): BuildingState[] {
    return state.buildings;
  },
  set buildings(value: BuildingState[]) {
    state.buildings = value;
  },
  get progress(): GameProgress {
    return state.progress;
  },
  set progress(value: GameProgress) {
    state.progress = value;
  },
  get settings(): SettingsState {
    return state.settings;
  },
  set settings(value: SettingsState) {
    state.settings = value;
  },
  reset(): void {
    state.player = createDefaultPlayer();
    state.data = createEmptyContent();
    state.currentSortie = null;
    state.baseStash = [{ item_id: "bandage", count: HERO_START_BANDAGES }];
    state.baseResources = createDefaultBaseResources();
    state.buildings = createDefaultBuildings();
    state.progress = createDefaultProgress();
    state.settings = createDefaultSettings();
  },
  baseSpeed: HERO_BASE_SPEED,
};

export const setContent = (data: ContentData): void => {
  state.data = data;
  loadContentItems(data.items);
};

export const addToStack = (
  stacks: InventoryStack[],
  item_id: string,
  count: number,
): InventoryStack[] => {
  const next = stacks.map((stack) => ({ ...stack }));
  const existing = next.find((stack) => stack.item_id === item_id);
  if (existing) {
    existing.count += count;
  } else {
    next.push({ item_id, count });
  }
  return next;
};

export const removeFromStack = (
  stacks: InventoryStack[],
  item_id: string,
  count: number,
): InventoryStack[] => {
  const next: InventoryStack[] = [];
  for (const stack of stacks) {
    if (stack.item_id !== item_id) {
      next.push({ ...stack });
      continue;
    }
    const remaining = stack.count - count;
    if (remaining > 0) {
      next.push({ item_id: stack.item_id, count: remaining });
    }
  }
  return next;
};

export const countInStacks = (
  stacks: InventoryStack[],
  item_id: string,
): number => {
  let total = 0;
  for (const stack of stacks) {
    if (stack.item_id === item_id) {
      total += stack.count;
    }
  }
  return total;
};

/** M13: добавить ресурс базы. Кэп будет в PR-5. */
export const addBaseResource = (
  resources: BaseResources,
  id: BaseResourceId,
  amount: number,
): BaseResources => ({
  ...resources,
  [id]: Math.max(0, resources[id] + amount),
});

/** M13: списать ресурс базы. Не уходит ниже нуля. */
export const consumeBaseResource = (
  resources: BaseResources,
  id: BaseResourceId,
  amount: number,
): BaseResources => ({
  ...resources,
  [id]: Math.max(0, resources[id] - amount),
});

export const setSfxMute = (value: boolean): void => {
  state.settings.sfxMuted = value;
};

export const setSfxVolume = (value: number): void => {
  state.settings.sfxVolume = Math.max(0, Math.min(1, value));
};
