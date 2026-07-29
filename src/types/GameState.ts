/**
 * GameState.ts
 * Главное состояние игры: герой, инвентарь, база, ресурсы
 * Содержит все интерфейсы и функции для работы с игровым состоянием
 */

// ============================================================================
// БАЗОВЫЕ ТИПЫ И ПЕРЕЧИСЛЕНИЯ
// ============================================================================

export type WeaponType = 'pistol' | 'rifle' | 'shotgun' | 'smg' | 'special';
export type WeaponFamily = 'british' | 'german' | 'soviet' | 'american';
export type SceneName = 'boot' | 'base' | 'map' | 'sortie' | 'combat' | 'return';
export type ResourceType = 'water' | 'fuel' | 'metal' | 'food';

export type AffixRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type AffixType =
  | 'damage_increase'
  | 'accuracy_increase'
  | 'reload_speed'
  | 'range_increase'
  | 'critical_chance'
  | 'magazine_size'
  | 'weight_reduction'
  | 'fire_rate';

// ============================================================================
// КОМПОНЕНТЫ И МОДИФИКАЦИИ
// ============================================================================

export interface Component {
  id: string;
  name: string;
  description: string;
  slot: 'sight' | 'barrel' | 'magazine' | 'stock' | 'grip' | 'rail';
  weight: number; // кг
  rarity: AffixRarity;
  modifiers: {
    damage?: number; // процент +/-
    accuracy?: number; // +/- процент
    reload_time?: number; // процент +/-
    range?: number; // +/- метры
    magazine_size?: number; // +/- патроны
    fire_rate?: number; // выстрелы/сек
  };
}

export interface Affix {
  id: string;
  name: string;
  description: string;
  type: AffixType;
  rarity: AffixRarity;
  value: number; // величина эффекта (зависит от типа)
}

// ============================================================================
// ОРУЖИЕ И БРОНЯ
// ============================================================================

export interface Weapon {
  id: string;
  name: string;
  description?: string;
  type: WeaponType;
  family: WeaponFamily;
  base_damage: [number, number]; // [min, max] в единицах урона
  accuracy: number; // 0-100%, базовая точность
  reload_time: number; // секунды
  range: number; // метры (максимальная дистанция)
  magazine_size: number; // количество патронов
  weight: number; // кг
  rarity: AffixRarity;
  components: Component[]; // установленные модификации
  affix?: Affix; // уникальное свойство оружия
  condition: number; // 0-100%, износ оружия
  ammo?: number; // текущее количество патронов в магазине
  created_at?: number; // timestamp создания
}

export interface Armor {
  id: string;
  name: string;
  description?: string;
  defense: number; // процент поглощения урона (0-50)
  weight: number; // кг
  rarity: AffixRarity;
  affix?: Affix;
  condition: number; // 0-100%
}

// ============================================================================
// ГЕРОЙ
// ============================================================================

export interface Hero {
  id: string;
  name: string;
  level: number;
  experience: number;
  experience_next_level: number;

  // Здоровье и выносливость
  hp: number;
  hp_max: number;
  stamina: number;
  stamina_max: number;

  // Характеристики (базовые значения)
  strength: number; // влияет на урон
  dexterity: number; // влияет на точность и скорость перезарядки
  constitution: number; // влияет на макс HP
  intelligence: number; // влияет на критический шанс

  // Экипировка
  equipment: {
    primary_weapon: Weapon | null;
    secondary_weapon: Weapon | null;
    armor: Armor | null;
  };

  // Статистика боев
  total_kills: number;
  total_damage_dealt: number;
  total_damage_taken: number;
  sorties_completed: number;

  // Последний бой
  last_sortie?: {
    timestamp: number;
    enemy_type: string;
    victory: boolean;
    xp_gained: number;
  };

  created_at: number; // timestamp создания персонажа
  last_updated: number; // timestamp последнего обновления
}

// ============================================================================
// БАЗА И РЕСУРСЫ
// ============================================================================

export interface BaseResources {
  water: number; // литры
  fuel: number; // литры
  metal: number; // килограммы
  food: number; // дни питания
}

export interface BaseUpgrade {
  id: string;
  name: string;
  description: string;
  required_level: number;
  costs: Partial<BaseResources>;
  effects: {
    resource_production?: Partial<Record<ResourceType, number>>; // +% производства в день
    storage_capacity?: Partial<Record<ResourceType, number>>; // +% хранилища
    defense_bonus?: number; // +% защиты при атаке базы
  };
  upgraded_at?: number;
}

// ============================================================================
// ВРАГИ И ВСТРЕЧИ
// ============================================================================

export interface Enemy {
  id: string;
  name: string;
  type: 'soldier' | 'officer' | 'tank_crew' | 'sniper' | 'elite';
  faction: 'british' | 'german' | 'soviet' | 'american';
  level: number;
  hp: number;
  hp_max: number;
  weapon: Weapon;
  equipment: {
    armor: Armor | null;
  };
  ai_aggression: number; // 0-100
  ai_accuracy: number; // 0-100
}

// ============================================================================
// ИГРОВОЕ СОСТОЯНИЕ
// ============================================================================

export interface GameState {
  // Версия сейва (для миграций)
  save_version: number;
  last_save: number; // timestamp последнего сохранения

  // Персонаж
  hero: Hero;

  // Инвентарь (максимум 20 единиц)
  inventory: Weapon[];
  inventory_max_size: number;

  // Ресурсы базы
  base: BaseResources;
  base_level: number;
  base_upgrades: BaseUpgrade[];

  // Текущая сцена
  current_scene: SceneName;

  // Статистика игры
  total_playtime: number; // секунды
  total_sessions: number;
  current_session_start: number; // timestamp начала сессии

  // Флаги достижений / событий
  flags: Record<string, boolean | number | string>;
}

// ============================================================================
// КОНСТАНТЫ И ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ
// ============================================================================

export const DEFAULT_HERO_STATS = {
  level: 1,
  hp_max: 100,
  stamina_max: 100,
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  experience_next_level: 1000,
};

export const DEFAULT_BASE_RESOURCES: BaseResources = {
  water: 1000,
  fuel: 500,
  metal: 200,
  food: 30,
};

export const SAVE_VERSION = 1;
export const INVENTORY_MAX_SIZE = 20;

// ============================================================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С СОСТОЯНИЕМ
// ============================================================================

/**
 * Создаёт нового героя с дефолтными значениями
 */
export function createNewHero(name: string = 'Commander'): Hero {
  const now = Date.now();
  return {
    id: `hero_${now}`,
    name,
    level: DEFAULT_HERO_STATS.level,
    experience: 0,
    experience_next_level: DEFAULT_HERO_STATS.experience_next_level,
    hp: DEFAULT_HERO_STATS.hp_max,
    hp_max: DEFAULT_HERO_STATS.hp_max,
    stamina: DEFAULT_HERO_STATS.stamina_max,
    stamina_max: DEFAULT_HERO_STATS.stamina_max,
    strength: DEFAULT_HERO_STATS.strength,
    dexterity: DEFAULT_HERO_STATS.dexterity,
    constitution: DEFAULT_HERO_STATS.constitution,
    intelligence: DEFAULT_HERO_STATS.intelligence,
    equipment: {
      primary_weapon: null,
      secondary_weapon: null,
      armor: null,
    },
    total_kills: 0,
    total_damage_dealt: 0,
    total_damage_taken: 0,
    sorties_completed: 0,
    created_at: now,
    last_updated: now,
  };
}

/**
 * Создаёт новое игровое состояние
 */
export function createNewGameState(heroName?: string): GameState {
  const now = Date.now();
  return {
    save_version: SAVE_VERSION,
    last_save: now,
    hero: createNewHero(heroName),
    inventory: [],
    inventory_max_size: INVENTORY_MAX_SIZE,
    base: { ...DEFAULT_BASE_RESOURCES },
    base_level: 1,
    base_upgrades: [],
    current_scene: 'boot',
    total_playtime: 0,
    total_sessions: 0,
    current_session_start: now,
    flags: {},
  };
}

/**
 * Валидирует состояние игры (проверяет целостность данных)
 * @throws Error если состояние невалидно
 */
export function validateGameState(state: any): asserts state is GameState {
  if (!state || typeof state !== 'object') {
    throw new Error('Invalid GameState: not an object');
  }

  if (typeof state.save_version !== 'number') {
    throw new Error('Invalid GameState: missing save_version');
  }

  if (!state.hero || typeof state.hero !== 'object') {
    throw new Error('Invalid GameState: missing hero');
  }

  if (!Array.isArray(state.inventory)) {
    throw new Error('Invalid GameState: inventory is not an array');
  }

  if (typeof state.base !== 'object' || state.base === null) {
    throw new Error('Invalid GameState: invalid base resources');
  }

  if (!['boot', 'base', 'map', 'sortie', 'combat', 'return'].includes(state.current_scene)) {
    throw new Error('Invalid GameState: invalid current_scene');
  }

  // Проверить границы значений
  if (state.hero.hp < 0 || state.hero.hp > state.hero.hp_max) {
    throw new Error('Invalid GameState: hero hp out of bounds');
  }

  if (state.inventory.length > state.inventory_max_size) {
    throw new Error('Invalid GameState: inventory overflow');
  }
}

/**
 * Сериализует состояние для сохранения
 */
export function serializeGameState(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Десериализует состояние из строки
 */
export function deserializeGameState(json: string): GameState {
  const state = JSON.parse(json) as unknown;
  validateGameState(state);
  return state;
}

/**
 * Проверяет, может ли герой уровень up
 */
export function canHeroLevelUp(hero: Hero): boolean {
  return hero.experience >= hero.experience_next_level;
}

/**
 * Возвращает процент здоровья героя (0-100)
 */
export function getHeroHealthPercent(hero: Hero): number {
  return Math.round((hero.hp / hero.hp_max) * 100);
}

/**
 * Возвращает процент выносливости героя (0-100)
 */
export function getHeroStaminaPercent(hero: Hero): number {
  return Math.round((hero.stamina / hero.stamina_max) * 100);
}

/**
 * Проверяет, может ли герой выполнить действие, требующее выносливости
 */
export function canHeroPerformAction(hero: Hero, stamina_cost: number): boolean {
  return hero.stamina >= stamina_cost;
}

/**
 * Вычисляет общий вес инвентаря
 */
export function calculateInventoryWeight(weapons: Weapon[]): number {
  return weapons.reduce((total, weapon) => total + weapon.weight, 0);
}

/**
 * Проверяет, может ли быть добавлено оружие в инвентарь
 */
export function canAddToInventory(
  currentInventory: Weapon[],
  newWeapon: Weapon,
  maxSize: number
): boolean {
  return currentInventory.length < maxSize;
}
