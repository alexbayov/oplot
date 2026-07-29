/**
 * Combat Scenarios
 * 4 unique encounter types with different mechanics and challenges
 */

interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'boss';
  enemyCount: number;
  mechanics: string[];
  rewards: {
    xp: number;
    gold: number;
    loot?: string[];
  };
}

class CombatScenarios {
  /**
   * AMBUSH: Surprise encounter with multiple weak enemies
   * - Player is outnumbered but enemies are weaker
   * - Focus on positioning and crowd control
   */
  static readonly AMBUSH: Scenario = {
    id: 'scenario_ambush',
    name: 'Ambush',
    description:
      'You are surrounded by a gang of bandits who catch you off guard. They are individually weak but numerous.',
    difficulty: 'normal',
    enemyCount: 4,
    mechanics: [
      'Multiple weak enemies (HP: 30 each)',
      'Positioning advantage (enemies start surrounding player)',
      'Chain attacks reward (defeat multiple in succession)',
      'Loot drop (gold from defeated bandits)',
    ],
    rewards: {
      xp: 150,
      gold: 75,
      loot: ['Bandit Dagger', 'Gold Pouch'],
    },
  };

  /**
   * DUEL: One-on-one combat with a skilled opponent
   * - Single powerful enemy with advanced tactics
   * - Tests player skill and stamina management
   */
  static readonly DUEL: Scenario = {
    id: 'scenario_duel',
    name: 'Duel',
    description:
      'Face a skilled swordmaster in honorable combat. They are experienced and will exploit any weakness.',
    difficulty: 'hard',
    enemyCount: 1,
    mechanics: [
      'Single skilled opponent (HP: 100, high AI)',
      'Tactical decision-making required',
      'Counter-attack system (parry and riposte)',
      'Stamina drain on dodge (increased pressure)',
      'Prestige reward (honor system)',
    ],
    rewards: {
      xp: 250,
      gold: 100,
      loot: ['Swordmaster Blade', 'Champion Belt'],
    },
  };

  /**
   * PATROL: Encounter with guards during patrol
   * - Mixed group of weak and moderately strong enemies
   * - Environmental awareness (use cover and positioning)
   */
  static readonly PATROL: Scenario = {
    id: 'scenario_patrol',
    name: 'Patrol',
    description:
      'A guard patrol spots you. Officers and soldiers approach with formation tactics and coordination.',
    difficulty: 'normal',
    enemyCount: 3,
    mechanics: [
      'Mixed group (1 Officer HP:80, 2 Soldiers HP:50)',
      'Formation tactics (coordinate attacks)',
      'Guard reinforcement (time pressure)',
      'Stealth option (avoid or delay encounter)',
      'Environmental hazards available',
    ],
    rewards: {
      xp: 180,
      gold: 120,
      loot: ['Officer Insignia', 'Guard Armor Piece'],
    },
  };

  /**
   * STRONGHOLD: Epic battle against a powerful warlord and their army
   * - Multiple rounds with boss mechanics
   * - Requires both offense and defense strategy
   */
  static readonly STRONGHOLD: Scenario = {
    id: 'scenario_stronghold',
    name: 'Stronghold',
    description:
      'Assault the warlord stronghold. You must defeat their elite guards and the warlord herself. This is the ultimate combat challenge.',
    difficulty: 'boss',
    enemyCount: 6,
    mechanics: [
      'Boss enemy with special abilities (Warlord HP: 200)',
      'Multi-round battle (Guards Phase, then Boss Phase)',
      'Environmental damage (falling debris, fire)',
      'Boss special attacks (Area damage, healing)',
      'Destructible environment (interact to gain advantage)',
      'Victory condition: Defeat warlord and survive',
    ],
    rewards: {
      xp: 500,
      gold: 300,
      loot: [
        'Warlord Crown',
        'Ancient Sword',
        'Legendary Shield',
        'Treasure Chest Key',
      ],
    },
  };

  /**
   * Get all available scenarios
   */
  static getAllScenarios(): Scenario[] {
    return [
      CombatScenarios.AMBUSH,
      CombatScenarios.DUEL,
      CombatScenarios.PATROL,
      CombatScenarios.STRONGHOLD,
    ];
  }

  /**
   * Get scenario by ID
   */
  static getScenario(id: string): Scenario | undefined {
    return this.getAllScenarios().find(s => s.id === id);
  }

  /**
   * Get scenarios by difficulty
   */
  static getScenariosByDifficulty(
    difficulty: 'easy' | 'normal' | 'hard' | 'boss'
  ): Scenario[] {
    return this.getAllScenarios().filter(s => s.difficulty === difficulty);
  }

  /**
   * Generate dynamic scenario (random modifiers)
   */
  static generateDynamicScenario(baseScenario: Scenario): Scenario {
    const multiplier = 0.8 + Math.random() * 0.4; // ±20% variation
    return {
      ...baseScenario,
      rewards: {
        ...baseScenario.rewards,
        xp: Math.floor(baseScenario.rewards.xp * multiplier),
        gold: Math.floor(baseScenario.rewards.gold * multiplier),
      },
    };
  }

  /**
   * Calculate total difficulty score
   */
  static calculateDifficultyScore(scenario: Scenario): number {
    const difficultyMap = { easy: 1, normal: 2, hard: 3, boss: 5 };
    const baseDifficulty = difficultyMap[scenario.difficulty];
    const mechanicBonus = scenario.mechanics.length * 0.5;
    return baseDifficulty + mechanicBonus;
  }
}

export { CombatScenarios };
export type { Scenario };
