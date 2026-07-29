/**
 * IMPROVED Boss System
 * Управление боссами, их фазами и способностями
 * 
 * Улучшения:
 * - Динамические способности (варианты по фазам)
 * - Паттерны атак с предсказуемостью
 * - Визуальные/звуковые эффекты при переходах
 * - Сложность уровней (easy/normal/hard)
 * - Wind-up анимации перед атаками
 * - Лут масштабирование по HP
 */

// ============================================
// ENUMS & TYPES
// ============================================

export enum BossPhase {
  PHASE_1 = 1,
  PHASE_2 = 2,
  PHASE_3 = 3
}

export enum AbilityEffectType {
  ARMOR_BUFF = "armor-buff",
  CRIT_CHANCE = "crit-chance",
  STUN = "stun",
  KNOCKBACK = "knockback",
  HEAL = "heal"
}

export enum PhaseTransitionEffect {
  SCREEN_SHAKE = "shake",
  FLASH_WHITE = "flash",
  CAMERA_ZOOM = "zoom",
  BOSS_ROAR = "roar",
  PARTICLE_BURST = "particles"
}

export enum DifficultyLevel {
  EASY = "easy",
  NORMAL = "normal",
  HARD = "hard"
}

// ============================================
// INTERFACES
// ============================================

export interface BossStats {
  name: string;
  level: number;
  maxHealth: number;
  health: number;
  attack: number;
  defense: number;
  experience: number;
}

export interface AbilityEffect {
  type: AbilityEffectType;
  duration?: number;
  value?: number;
  stackable?: boolean;
}

export interface BossAbilityPhaseVariant {
  phase: BossPhase;
  damage: number;
  cooldown: number;
  effect?: AbilityEffect;
  animation?: string;
  windUpTime?: number;
  description?: string;
}

export interface BossAbility {
  name: string;
  damage: number;
  cooldown: number;
  lastUsed: number;
  description: string;
}

export interface BossAbilityDynamic extends BossAbility {
  variants: BossAbilityPhaseVariant[];
  getVariantForPhase(phase: BossPhase): BossAbilityPhaseVariant;
  getScaledDamage(currentPhase: BossPhase): number;
}

export interface AttackPatternNode {
  action: "ability" | "pause" | "dodge" | "heal";
  value: string | number;
}

export interface AttackPattern {
  phase: BossPhase;
  sequence: AttackPatternNode[];
  probability: number;
  difficulty: DifficultyLevel;
  name?: string;
}

export interface PhaseTransitionConfig {
  effects: PhaseTransitionEffect[];
  soundCue: string;
  duration: number;
  playerCanAct: boolean;
  particleEffect?: string;
}

export interface LootTier {
  maxHealthPercent: number;
  multiplier: number;
  rarity: "common" | "rare" | "epic";
}

export interface BossDifficultyStats {
  health: number;
  attack: number;
  defense: number;
  experience: number;
}

// ============================================
// BOSS BASE CLASS
// ============================================

export abstract class Boss {
  stats: BossStats;
  phase: BossPhase;
  difficulty: DifficultyLevel;
  abilities: BossAbilityDynamic[];
  patterns: AttackPattern[];
  
  private lastPhaseTransition: number = 0;
  private isInTransition: boolean = false;
  private phaseTransitionConfig: Map<BossPhase, PhaseTransitionConfig>;
  
  // Для отслеживания фаз
  private previousPhase: BossPhase;

  constructor(
    stats: BossStats,
    abilities: BossAbilityDynamic[],
    difficulty: DifficultyLevel = DifficultyLevel.NORMAL
  ) {
    this.stats = stats;
    this.phase = BossPhase.PHASE_1;
    this.previousPhase = BossPhase.PHASE_1;
    this.difficulty = difficulty;
    this.abilities = abilities;
    this.patterns = [];
    this.phaseTransitionConfig = new Map();
  }

  /**
   * Получить результат урона с детальной информацией
   */
  takeDamage(damage: number): {
    reduced: number;
    phaseChanged: boolean;
    oldPhase: BossPhase;
    newPhase: BossPhase;
    transitionConfig?: PhaseTransitionConfig;
  } {
    const reducedDamage = Math.max(1, damage - this.stats.defense);
    const oldPhase = this.phase;

    this.stats.health = Math.max(0, this.stats.health - reducedDamage);
    this.updatePhase();

    const phaseChanged = oldPhase !== this.phase;
    const transitionConfig = phaseChanged 
      ? this.phaseTransitionConfig.get(this.phase) 
      : undefined;

    return {
      reduced: reducedDamage,
      phaseChanged,
      oldPhase,
      newPhase: this.phase,
      transitionConfig
    };
  }

  /**
   * Обновить текущую фазу на основе HP
   */
  private updatePhase(): void {
    const healthPercent = (this.stats.health / this.stats.maxHealth) * 100;

    if (healthPercent <= 33) {
      this.phase = BossPhase.PHASE_3;
    } else if (healthPercent <= 66) {
      this.phase = BossPhase.PHASE_2;
    } else {
      this.phase = BossPhase.PHASE_1;
    }

    if (this.previousPhase !== this.phase) {
      this.onPhaseTransition(this.previousPhase, this.phase);
      this.previousPhase = this.phase;
    }
  }

  /**
   * Абстрактный метод для переопределения в подклассах
   */
  abstract onPhaseTransition(oldPhase: BossPhase, newPhase: BossPhase): void;

  /**
   * Получить доступные способности
   */
  getAvailableAbilities(currentTime: number): BossAbilityDynamic[] {
    if (this.isInTransition) return [];

    return this.abilities.filter(ability =>
      currentTime - ability.lastUsed >= ability.cooldown
    );
  }

  /**
   * Использовать способность
   */
  useAbility(
    abilityName: string,
    currentTime: number
  ): { ability: BossAbilityDynamic; variant: BossAbilityPhaseVariant } | null {
    const ability = this.abilities.find(
      a => a.name === abilityName
    ) as BossAbilityDynamic;

    if (!ability) return null;
    if (currentTime - ability.lastUsed < ability.cooldown) return null;

    ability.lastUsed = currentTime;
    const variant = ability.getVariantForPhase(this.phase);

    return { ability, variant };
  }

  /**
   * Выбрать следующее действие из паттерна
   */
  selectNextAction(currentTime: number): AttackPatternNode | null {
    const availablePatterns = this.patterns.filter(
      p => p.phase === this.phase
    );

    if (availablePatterns.length === 0) return null;

    // Взвешенный рандом по probability
    const pattern = this.selectByWeightedProbability(availablePatterns);
    if (!pattern || pattern.sequence.length === 0) return null;

    return pattern.sequence[
      Math.floor(Math.random() * pattern.sequence.length)
    ];
  }

  /**
   * Взвешенный выбор по вероятности
   */
  protected selectByWeightedProbability(patterns: AttackPattern[]): AttackPattern {
    const random = Math.random();
    let accumulated = 0;

    for (const pattern of patterns) {
      accumulated += pattern.probability;
      if (random <= accumulated) {
        return pattern;
      }
    }

    return patterns[0];
  }

  /**
   * Регистрировать конфиг фазового перехода
   */
  protected registerPhaseTransition(
    phase: BossPhase,
    config: PhaseTransitionConfig
  ): void {
    this.phaseTransitionConfig.set(phase, config);
  }

  /**
   * Установить режим перехода фазы
   */
  setTransitionState(inTransition: boolean, duration?: number): void {
    this.isInTransition = inTransition;
    if (inTransition && duration) {
      this.lastPhaseTransition = Date.now();
    }
  }

  /**
   * Текущий статус переходов
   */
  isInPhaseTransition(): boolean {
    return this.isInTransition;
  }

  /**
   * Жив ли босс
   */
  isAlive(): boolean {
    return this.stats.health > 0;
  }

  /**
   * Описание текущей фазы
   */
  abstract getPhaseDescription(): string;

  /**
   * Получить множитель урона для текущей фазы
   */
  getDamageMultiplier(): number {
    switch (this.phase) {
      case BossPhase.PHASE_2:
        return 1.2;
      case BossPhase.PHASE_3:
        return 1.5;
      default:
        return 1.0;
    }
  }

  /**
   * Получить множитель защиты для текущей фазы
   */
  getDefenseMultiplier(): number {
    switch (this.phase) {
      case BossPhase.PHASE_2:
        return 1.2;
      case BossPhase.PHASE_3:
        return 1.1;
      default:
        return 1.0;
    }
  }
}

// ============================================
// COMMANDANT ALPHA - УЛУЧШЕННЫЙ
// ============================================

export class CommandantAlpha extends Boss {
  private phaseTransitionConfigMap: Map<BossPhase, PhaseTransitionConfig> = new Map();

  constructor(difficulty: DifficultyLevel = DifficultyLevel.NORMAL) {
    const difficultyStats = CommandantAlpha.getDifficultyStats(difficulty);

    const stats: BossStats = {
      name: "Командант Альфа",
      level: 10,
      maxHealth: difficultyStats.health,
      health: difficultyStats.health,
      attack: difficultyStats.attack,
      defense: difficultyStats.defense,
      experience: difficultyStats.experience
    };

    // Динамические способности с вариантами
    const abilities: BossAbilityDynamic[] = [
      {
        name: "Strike",
        damage: 30,
        cooldown: 3000,
        lastUsed: 0,
        description: "Основной удар, меняется по фазам",
        variants: [
          {
            phase: BossPhase.PHASE_1,
            damage: 30,
            cooldown: 4000,
            animation: "power-strike-calm",
            windUpTime: 600,
            description: "Уверенный удар"
          },
          {
            phase: BossPhase.PHASE_2,
            damage: 40,
            cooldown: 3000,
            effect: { type: AbilityEffectType.ARMOR_BUFF, duration: 3000, value: 5 },
            animation: "power-strike-intense",
            windUpTime: 500,
            description: "Усиленный удар + броня"
          },
          {
            phase: BossPhase.PHASE_3,
            damage: 55,
            cooldown: 2000,
            effect: { type: AbilityEffectType.CRIT_CHANCE, value: 0.5 },
            animation: "power-strike-desperate",
            windUpTime: 400,
            description: "Отчаянный удар с шансом крита"
          }
        ],
        getVariantForPhase: function(phase: BossPhase) {
          return this.variants.find(v => v.phase === phase) || this.variants[0];
        },
        getScaledDamage: function(currentPhase: BossPhase) {
          const variant = this.getVariantForPhase(currentPhase);
          return variant.damage;
        }
      },
      {
        name: "Shock Wave",
        damage: 15,
        cooldown: 5000,
        lastUsed: 0,
        description: "AOE волна, меняется по фазам",
        variants: [
          {
            phase: BossPhase.PHASE_1,
            damage: 15,
            cooldown: 6000,
            animation: "shock-wave-calm",
            windUpTime: 800,
            effect: { type: AbilityEffectType.KNOCKBACK, value: 200 },
            description: "Волна отталкивает врагов"
          },
          {
            phase: BossPhase.PHASE_2,
            damage: 25,
            cooldown: 4500,
            animation: "shock-wave-intense",
            windUpTime: 700,
            effect: { type: AbilityEffectType.ARMOR_BUFF, duration: 3000, value: 8, stackable: true },
            description: "Укрепляющая волна"
          },
          {
            phase: BossPhase.PHASE_3,
            damage: 40,
            cooldown: 3000,
            animation: "shock-wave-desperate",
            windUpTime: 600,
            effect: { type: AbilityEffectType.STUN, duration: 1000 },
            description: "Хаотичная волна оглушает"
          }
        ],
        getVariantForPhase: function(phase: BossPhase) {
          return this.variants.find(v => v.phase === phase) || this.variants[0];
        },
        getScaledDamage: function(currentPhase: BossPhase) {
          const variant = this.getVariantForPhase(currentPhase);
          return variant.damage;
        }
      },
      {
        name: "Berserk Combo",
        damage: 50,
        cooldown: 10000,
        lastUsed: 0,
        description: "Комбо из 4 атак (только фаза 3)",
        variants: [
          {
            phase: BossPhase.PHASE_1,
            damage: 0,
            cooldown: 10000,
            description: "Недоступно"
          },
          {
            phase: BossPhase.PHASE_2,
            damage: 0,
            cooldown: 10000,
            description: "Недоступно"
          },
          {
            phase: BossPhase.PHASE_3,
            damage: 160, // Сумма всех ударов
            cooldown: 8000,
            animation: "berserk-combo",
            windUpTime: 400,
            effect: { type: AbilityEffectType.STUN, duration: 500 },
            description: "Безумная серия ударов + финальный слэм"
          }
        ],
        getVariantForPhase: function(phase: BossPhase) {
          return this.variants.find(v => v.phase === phase) || this.variants[0];
        },
        getScaledDamage: function(currentPhase: BossPhase) {
          const variant = this.getVariantForPhase(currentPhase);
          return variant.damage;
        }
      }
    ];

    super(stats, abilities, difficulty);

    // Паттерны атак
    this.patterns = [
      {
        phase: BossPhase.PHASE_1,
        sequence: [
          { action: "ability", value: "Strike" },
          { action: "pause", value: 1500 },
          { action: "ability", value: "Shock Wave" },
          { action: "pause", value: 2000 }
        ],
        probability: 0.6,
        difficulty: DifficultyLevel.NORMAL,
        name: "Pattern_1A"
      },
      {
        phase: BossPhase.PHASE_1,
        sequence: [
          { action: "ability", value: "Strike" },
          { action: "pause", value: 2000 },
          { action: "ability", value: "Strike" },
          { action: "pause", value: 1500 }
        ],
        probability: 0.4,
        difficulty: DifficultyLevel.NORMAL,
        name: "Pattern_1B"
      },
      {
        phase: BossPhase.PHASE_2,
        sequence: [
          { action: "ability", value: "Strike" },
          { action: "ability", value: "Strike" },
          { action: "pause", value: 1000 },
          { action: "ability", value: "Shock Wave" },
          { action: "pause", value: 1500 }
        ],
        probability: 0.7,
        difficulty: DifficultyLevel.NORMAL,
        name: "Pattern_2A"
      },
      {
        phase: BossPhase.PHASE_2,
        sequence: [
          { action: "ability", value: "Shock Wave" },
          { action: "ability", value: "Strike" },
          { action: "pause", value: 800 },
          { action: "ability", value: "Strike" }
        ],
        probability: 0.3,
        difficulty: DifficultyLevel.NORMAL,
        name: "Pattern_2B"
      },
      {
        phase: BossPhase.PHASE_3,
        sequence: [
          { action: "ability", value: "Berserk Combo" }
        ],
        probability: 1.0,
        difficulty: DifficultyLevel.NORMAL,
        name: "Pattern_3_Berserk"
      }
    ];

    this.setupPhaseTransitions();
  }

  /**
   * Получить статы в зависимости от сложности
   */
  private static getDifficultyStats(
    difficulty: DifficultyLevel
  ): BossDifficultyStats {
    const statsMap: Record<DifficultyLevel, BossDifficultyStats> = {
      [DifficultyLevel.EASY]: {
        health: 120,
        attack: 15,
        defense: 4,
        experience: 3000
      },
      [DifficultyLevel.NORMAL]: {
        health: 150,
        attack: 25,
        defense: 10,
        experience: 5000
      },
      [DifficultyLevel.HARD]: {
        health: 200,
        attack: 35,
        defense: 15,
        experience: 8000
      }
    };

    return statsMap[difficulty];
  }

  /**
   * Настроить визуальные эффекты переходов фаз
   */
  private setupPhaseTransitions(): void {
    this.registerPhaseTransition(BossPhase.PHASE_2, {
      effects: [
        PhaseTransitionEffect.SCREEN_SHAKE,
        PhaseTransitionEffect.FLASH_WHITE
      ],
      soundCue: "commander-power-up.ogg",
      duration: 1200,
      playerCanAct: false,
      particleEffect: "power-surge"
    });

    this.registerPhaseTransition(BossPhase.PHASE_3, {
      effects: [
        PhaseTransitionEffect.CAMERA_ZOOM,
        PhaseTransitionEffect.PARTICLE_BURST,
        PhaseTransitionEffect.SCREEN_SHAKE
      ],
      soundCue: "desperate-roar.ogg",
      duration: 1500,
      playerCanAct: false,
      particleEffect: "desperate-aura"
    });
  }

  onPhaseTransition(oldPhase: BossPhase, newPhase: BossPhase): void {
    console.log(
      `[CommandantAlpha] Phase Transition: ${oldPhase} -> ${newPhase}`
    );
    console.log(`[CommandantAlpha] HP: ${this.stats.health}/${this.stats.maxHealth}`);
  }

  getPhaseDescription(): string {
    const descriptions: Record<BossPhase, string> = {
      [BossPhase.PHASE_1]: "Фаза 1: Спокойствие перед бурей",
      [BossPhase.PHASE_2]: "Фаза 2: Командант активизируется",
      [BossPhase.PHASE_3]: "Фаза 3: Отчаянная последняя атака"
    };
    return descriptions[this.phase];
  }

  /**
   * Получить специальное действие для текущей фазы
   */
  getPhaseSpecialAction(): string {
    const actions: Record<BossPhase, string> = {
      [BossPhase.PHASE_1]: "Командант готовится к бою, его атаки стандартны",
      [BossPhase.PHASE_2]: "Командант учащает свои атаки и использует способности чаще",
      [BossPhase.PHASE_3]: "Командант входит в берсерк, напрямую угрожая игроку!"
    };
    return actions[this.phase];
  }
}

// ============================================
// BOSS FACTORY
// ============================================

export class BossFactory {
  static createBoss(
    bossType: "commandant-alpha",
    difficulty: DifficultyLevel = DifficultyLevel.NORMAL
  ): Boss {
    switch (bossType) {
      case "commandant-alpha":
        return new CommandantAlpha(difficulty);
      default:
        throw new Error(`Unknown boss type: ${bossType}`);
    }
  }

  static getBossTypes(): string[] {
    return ["commandant-alpha"];
  }
}

// ============================================
// BOSS SYSTEM
// ============================================

export class BossSystem {
  private currentBoss: Boss | null = null;
  private lootTiers: LootTier[] = [
    { maxHealthPercent: 50, multiplier: 1.0, rarity: "common" },
    { maxHealthPercent: 30, multiplier: 1.5, rarity: "rare" },
    { maxHealthPercent: 10, multiplier: 2.0, rarity: "epic" }
  ];

  /**
   * Спавнить босса
   */
  spawnBoss(bossType: string, difficulty: DifficultyLevel = DifficultyLevel.NORMAL): Boss {
    this.currentBoss = BossFactory.createBoss(
      bossType as "commandant-alpha",
      difficulty
    );
    return this.currentBoss;
  }

  /**
   * Получить текущего босса
   */
  getCurrentBoss(): Boss | null {
    return this.currentBoss;
  }

  /**
   * Получить лут при победе
   */
  getDefeatedBossReward(): {
    stats: BossStats;
    experience: number;
    lootTier: LootTier;
  } | null {
    if (!this.currentBoss || this.currentBoss.isAlive()) {
      return null;
    }

    const stats = this.currentBoss.stats;
    const healthPercent =
      (this.currentBoss.stats.health / this.currentBoss.stats.maxHealth) * 100;

    let lootTier = this.lootTiers[0];
    for (const tier of this.lootTiers) {
      if (healthPercent <= tier.maxHealthPercent) {
        lootTier = tier;
      }
    }

    const reward = {
      stats,
      experience: Math.floor(stats.experience * lootTier.multiplier),
      lootTier
    };

    this.currentBoss = null;
    return reward;
  }

  /**
   * Окончен ли босс
   */
  defeatedBoss(): BossStats | null {
    if (!this.currentBoss || this.currentBoss.isAlive()) {
      return null;
    }

    const stats = this.currentBoss.stats;
    this.currentBoss = null;
    return stats;
  }

  /**
   * Обновление системы
   */
  update(deltaTime: number): void {
    if (this.currentBoss) {
      // Логика обновления боя с боссом
    }
  }
}
