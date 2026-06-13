import type { Item, Mob, Perk, RadioSignal, Recipe, Zone } from "../types";
import type { Encounter } from "../types/encounter";
import type { SkillNode } from "../types/skillNode";

export interface InventoryStack {
  item_id: string;
  count: number;
}

// GDD §6.4.M3.3 — minimal progress flags driving Zone.unlock_condition.
// Additive: M1/M2 path (forest "start") doesn't read these fields.
export interface GameProgress {
  forest_depth_2_completed: boolean;
  any_warehouse_sortie_completed: boolean;
  any_forest_sortie_completed: boolean;
  suburbs_sortie_completed: boolean;
  warehouse_boss_defeated: boolean;
  factory_sortie_completed: boolean;
  city_boss_defeated: boolean;
  metro_sortie_completed: boolean;
  daily_completed: Record<string, number>;
  radio_trust: number;
}

export interface SettingsState {
  sfxMuted: boolean;
  sfxVolume: number;
}

/**
 * M13: ресурсы базы. PR-1 — счётчики. PR-5 — будут потребляться/производиться
 * постройками (грядка, верстак, генератор, койка) с офлайн-прогрессией.
 */
export interface BaseResources {
  water: number;
  fuel: number;
  metal: number;
  food: number;
}

/** M13: травма героя, влияет на формулу resolveEncounter. */
export interface PlayerInjury {
  kind: "arm" | "leg" | "head";
  /** Игровых дней до выздоровления. Уменьшается по концу каждой вылазки. */
  days_left: number;
}

export interface PlayerState {
  hp: number;
  hp_max: number;
  level: number;
  xp: number;
  max_weight_kg: number;
  equipped_weapon_id: string;
  equipped_armor_id: string;
  perks: Perk[];
  /** M11.4: ID открытых узлов skill tree (заменяет flat perks). */
  unlockedSkillNodes?: string[];
  /** M11.4: непотраченные очки навыков (1 на уровень). */
  skillPoints?: number;
  backpack: InventoryStack[];
  gas: number;
  /** M13: активные травмы. Накапливаются от resolveEncounter, тикают со временем. */
  injuries?: PlayerInjury[];
}

/**
 * M13: вылазка — интерактивный авторесолв.
 *
 * Между энкаунтерами игрок выбирает «идти дальше / вернуться». Каждый бой —
 * один вызов resolveEncounter. Лут копится в pending_loot, в LootScene
 * игрок распределяет его в рюкзак/склад.
 */
export interface SortieState {
  zone_id: string;
  depth: 1 | 2 | 3;
  /** Цель вылазки. Один из SortieGoal из types/sortie.ts. */
  goal: string;
  fights_total: number;
  fights_completed: number;
  /** Пред-роллнутые наборы мобов на каждый энкаунтер. */
  encounters: string[][];
  /** Пред-роллнутые ресурсы зоны, дренятся per encounter. */
  zone_loot_remaining: InventoryStack[];
  /** Лут, накопленный за вылазку. */
  pending_loot: InventoryStack[];
  /** Расходники, которые герой взял с собой. */
  taken_consumables: InventoryStack[];
  /** Лог завершённых энкаунтеров для итоговой сводки (нарративные строки). */
  resolved_log?: string[];
  /** Итоговый исход. Заполняется в LootScene/ReturnScene. */
  final_outcome?: "success" | "retreat" | "knocked_out";
}

export interface ContentData {
  items: Record<string, Item>;
  mobs: Record<string, Mob>;
  recipes: Record<string, Recipe>;
  zones: Record<string, Zone>;
  // M3 GDD §10.M3: radio signals loaded from content/radio.json at boot.
  radioSignals: RadioSignal[];
  perks: Record<string, Perk>;
  // M10.2: encounters between fights — loaded from content/encounters.json.
  encounters?: Encounter[];
  skillNodes?: SkillNode[];
  /** M13: nar-каталог для resolveSortie. См. content/narrative.json. */
  narrative?: NarrativeBundle;
  /** M13: event-выборы между энкаунтерами. См. content/narrative_events.json. */
  narrativeEvents?: NarrativeEvent[];
}

export interface NarrativeBundle {
  encounters: { tags: string[]; lines: string[] }[];
  goal_intros: Record<string, string[]>;
  return_intros: Record<string, string[]>;
}

export interface NarrativeEventOutcome {
  loot?: { id: string; n: number }[];
  hp_delta?: number;
  consume_item?: string;
  consume_n?: number;
  trust_delta?: number;
}

export interface NarrativeEvent {
  id: string;
  zones: string[];
  text: string;
  choices: {
    id: string;
    text: string;
    outcome: NarrativeEventOutcome;
  }[];
}

export interface GameStateShape {
  player: PlayerState;
  data: ContentData;
  currentSortie: SortieState | null;
  baseStash: InventoryStack[];
  /** M13: ресурсы базы. */
  baseResources: BaseResources;
  // M3 GDD §6.4.M3.3 — unlock flags driving MapScene visibility.
  progress: GameProgress;
  settings: SettingsState;
}
