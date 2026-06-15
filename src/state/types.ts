import type { Item, Mob, Perk, RadioSignal, Recipe, Zone } from "../types";
import type { Encounter } from "../types/encounter";
import type { SkillNode } from "../types/skillNode";
import type { WeaponInstance } from "../systems/weaponAssembly";

/**
 * M13 PR-6a: эквипнутое оружие. Discriminated union по `kind`:
 * - "catalog" — id из items.json (одно из 32 цельных оружий, kind=weapon,
 *   slot=action). Stats читаются из каталога, durability не применима.
 * - "crafted" — id экземпляра из `crafted_weapons[]`. Stats заморожены
 *   при сборке (`assembleWeapon`), durability мутируется через
 *   `applyDurabilityHit`. Сломанный (`isBroken`) автоматически unequip-
 *   ается snapshotHero-логикой и падает в bare-hands fallback (4/7).
 *
 * До PR-6a жил один `equipped_weapon_id: string` — неоднозначный, не
 * различал «id шаблона» от «id инстанса». Новая discriminated форма
 * делает невалидное состояние «оба установлены» непредставимым (C2).
 */
export type EquippedWeapon =
  | { kind: "catalog"; id: string }
  | { kind: "crafted"; id: string };

/**
 * M13 PR-6a: эквипнутая броня в три слота. helm | plate | strap по
 * armorSchema. До PR-6a жил один `equipped_armor_id: string` —
 * single-slot, что не отражало geometry брони (маска + жилет + щит
 * одновременно). Сейчас три independent слота, snapshotHero суммирует
 * armor_value по слотам, `computeArmorReduction` применяет
 * floor/clamp на агрегате (C8: floor защищает от worse-than-naked
 * именно на итоге, а не на каждом слоте).
 */
export interface EquippedArmor {
  helm?: string;
  plate?: string;
  strap?: string;
}

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
 * M13: ресурсы базы. PR-1 — счётчики. PR-6c — потребляются постройками
 * (грядка, койка) с офлайн-прогрессией. Дренинг через `consumeBaseResource`,
 * который существовал с PR-1 но не вызывался — PR-6c наконец-то дёргает.
 */
export interface BaseResources {
  water: number;
  fuel: number;
  metal: number;
  food: number;
  /**
   * M13 PR-6b-3: energy для Verstak-gate. Производится `generator` building
   * (bunk-model: fuel→energy напрямую в baseResources, без buffer).
   * Потребляется `assembleFromStash` через UI-gate в `WeaponAssemblyScene`.
   * Unbounded (как все baseResources).
   */
  energy: number;
}

/**
 * M13 PR-6c: постройки базы. До PR-6c base loop был открыт (baseResources
 * только аккумулирует от вылазок, sink-а нет). Грядка дренит water →
 * генерит food в свой буфер; койка дренит food → лечит hp игрока живьём.
 *
 * Дизайн-разрез (preflight §1 Option B): только 2 здания на этот PR —
 * минимально-достаточный набор чтобы закрыть петлю water→food→HP.
 * Генератор/верстак — 6b вместе с краф-UI (без живого consumer-а они
 * пустые placeholders).
 */
export type BuildingId = "garden" | "bunk" | "generator";

/**
 * Per-building runtime state.
 *
 * - garden: `accumulated_output` = food в буфере грядки (cap 20, тап в
 *   BaseScene собирает в `baseResources.food`).
 * - bunk: `accumulated_output` всегда 0 — койка лечит hp напрямую в
 *   PlayerState.hp при accrue (не имеет буфера, нечего собирать).
 *   Поле сохранено для shape-uniform-ности (могут быть buffered здания
 *   в будущем).
 */
export interface BuildingState {
  id: BuildingId;
  accumulated_output: number;
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
  /**
   * M13 PR-6a: discriminated catalog|crafted. До PR-6a (save v4) —
   * `equipped_weapon_id: string`. Migration v4→v5 заворачивает старый
   * id в `{kind:"catalog", id}`.
   */
  equipped_weapon: EquippedWeapon | null;
  /**
   * M13 PR-6a: owned crafted instances. До PR-6a не существовало.
   * Migration v4→v5 инициализирует пустым массивом.
   */
  crafted_weapons: WeaponInstance[];
  /**
   * M13 PR-6a: three-slot armor. До PR-6a (save v4) — одиночный
   * `equipped_armor_id: string`. Migration v4→v5 ставит старый id
   * в соответствующий слот по `armor.slot` из каталога (helm/plate/strap).
   */
  equipped_armor_ids: EquippedArmor;
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
  /**
   * M13 PR-6c: runtime-state построек базы. Always-on (предразмещены,
   * не требуют unlock/build UI per preflight §7 anti-scope). На новой
   * игре — оба здания с `accumulated_output: 0`.
   */
  buildings: BuildingState[];
  // M3 GDD §6.4.M3.3 — unlock flags driving MapScene visibility.
  progress: GameProgress;
  settings: SettingsState;
}
