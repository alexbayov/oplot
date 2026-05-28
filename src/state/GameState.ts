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
  ContentData,
  GameProgress,
  GameStateShape,
  InventoryStack,
  PlayerState,
  SettingsState,
  SortieState,
} from "./types";
import { loadContentItems } from "./ItemRegistry";

const createDefaultPlayer = (): PlayerState => ({
  hp: HERO_HP_MAX,
  hp_max: HERO_HP_MAX,
  level: HERO_START_LEVEL,
  xp: HERO_START_XP,
  max_weight_kg: HERO_MAX_WEIGHT_KG,
  equipped_weapon_id: HERO_START_WEAPON_ID,
  equipped_armor_id: HERO_START_ARMOR_ID,
  perks: [],
  backpack: [],
  gas: 5,
});

const createEmptyContent = (): ContentData => ({
  items: {},
  mobs: {},
  recipes: {},
  zones: {},
  radioSignals: [],
  perks: [],
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

const state: GameStateShape = {
  player: createDefaultPlayer(),
  data: createEmptyContent(),
  currentSortie: null,
  baseStash: [{ item_id: "bandage", count: HERO_START_BANDAGES }],
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
  // Reset to factory defaults (used by tests and after defeat smoke).
  reset(): void {
    state.player = createDefaultPlayer();
    state.data = createEmptyContent();
    state.currentSortie = null;
    state.baseStash = [{ item_id: "bandage", count: HERO_START_BANDAGES }];
    state.progress = createDefaultProgress();
    state.settings = createDefaultSettings();
  },
  // HERO_BASE_SPEED exposed for systems/combat.
  baseSpeed: HERO_BASE_SPEED,
};

// Used by tests / callers that need to seed content without going through Boot.
export const setContent = (data: ContentData): void => {
  state.data = data;
  loadContentItems(data.items);
};

// Helper used by combat/loot to mutate the backpack atomically.
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

export const setSfxMute = (value: boolean): void => {
  state.settings.sfxMuted = value;
};

export const setSfxVolume = (value: number): void => {
  state.settings.sfxVolume = Math.max(0, Math.min(1, value));
};
