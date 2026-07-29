/**
 * Boss System
 * Управление боссами, их фазами и способностями
 */

export interface BossStats {
  name: string;
  level: number;
  maxHealth: number;
  health: number;
  attack: number;
  defense: number;
  experience: number;
}

export interface BossAbility {
  name: string;
  damage: number;
  cooldown: number;
  lastUsed: number;
  description: string;
}

export enum BossPhase {
  PHASE_1 = 1,
  PHASE_2 = 2,
  PHASE_3 = 3
}

export class Boss {
  stats: BossStats;
  phase: BossPhase;
  abilities: BossAbility[];
  private phaseThresholds: { [key in BossPhase]: number } = {
    [BossPhase.PHASE_1]: 100,
    [BossPhase.PHASE_2]: 66,
    [BossPhase.PHASE_3]: 33
  };

  constructor(stats: BossStats, abilities: BossAbility[]) {
    this.stats = stats;
    this.phase = BossPhase.PHASE_1;
    this.abilities = abilities;
  }

  takeDamage(damage: number): number {
    const reducedDamage = Math.max(1, damage - this.stats.defense);
    this.stats.health = Math.max(0, this.stats.health - reducedDamage);
    
    this.updatePhase();
    
    return reducedDamage;
  }

  private updatePhase(): void {
    const healthPercent = (this.stats.health / this.stats.maxHealth) * 100;
    
    if (healthPercent <= this.phaseThresholds[BossPhase.PHASE_3]) {
      this.phase = BossPhase.PHASE_3;
    } else if (healthPercent <= this.phaseThresholds[BossPhase.PHASE_2]) {
      this.phase = BossPhase.PHASE_2;
    } else {
      this.phase = BossPhase.PHASE_1;
    }
  }

  getAvailableAbilities(currentTime: number): BossAbility[] {
    return this.abilities.filter(ability => 
      currentTime - ability.lastUsed >= ability.cooldown
    );
  }

  useAbility(abilityName: string, currentTime: number): BossAbility | null {
    const ability = this.abilities.find(a => a.name === abilityName);
    
    if (!ability) return null;
    if (currentTime - ability.lastUsed < ability.cooldown) return null;
    
    ability.lastUsed = currentTime;
    return ability;
  }

  isAlive(): boolean {
    return this.stats.health > 0;
  }

  getPhaseDescription(): string {
    const descriptions: { [key in BossPhase]: string } = {
      [BossPhase.PHASE_1]: "Фаза 1: Спокойствие перед бурей",
      [BossPhase.PHASE_2]: "Фаза 2: Бос активизируется",
      [BossPhase.PHASE_3]: "Фаза 3: Отчаянная последняя атака"
    };
    return descriptions[this.phase];
  }
}

export class CommandantAlpha extends Boss {
  constructor() {
    const stats: BossStats = {
      name: "Командант Альфа",
      level: 10,
      maxHealth: 150,
      health: 150,
      attack: 25,
      defense: 8,
      experience: 5000
    };

    const abilities: BossAbility[] = [
      {
        name: "Мощный удар",
        damage: 35,
        cooldown: 3000,
        lastUsed: 0,
        description: "Нанесит мощный удар, наносящий 35 урона"
      },
      {
        name: "Радиальная волна",
        damage: 20,
        cooldown: 5000,
        lastUsed: 0,
        description: "Выпускает энергетическую волну, повреждающую всё вокруг"
      },
      {
        name: "Берсерк",
        damage: 50,
        cooldown: 8000,
        lastUsed: 0,
        description: "В фазе 3: наносит огромный урон, атакуя в ярости"
      }
    ];

    super(stats, abilities);
  }

  override getAvailableAbilities(currentTime: number): BossAbility[] {
    const available = super.getAvailableAbilities(currentTime);
    
    // Берсерк доступен только в фазе 3
    if (this.phase !== BossPhase.PHASE_3) {
      return available.filter(a => a.name !== "Берсерк");
    }
    
    return available;
  }

  getPhaseSpecialAction(): string {
    const actions: { [key in BossPhase]: string } = {
      [BossPhase.PHASE_1]: "Командант готовится к бою, его атаки стандартны",
      [BossPhase.PHASE_2]: "Командант учащает свои атаки и использует способности чаще",
      [BossPhase.PHASE_3]: "Командант входит в берсерк, напрямую угрожая игроку!"
    };
    return actions[this.phase];
  }
}

export class BossFactory {
  static createBoss(bossType: 'commandant-alpha'): Boss {
    switch (bossType) {
      case 'commandant-alpha':
        return new CommandantAlpha();
      default:
        throw new Error(`Unknown boss type: ${bossType}`);
    }
  }

  static getBossTypes(): string[] {
    return ['commandant-alpha'];
  }
}

export class BossSystem {
  private currentBoss: Boss | null = null;

  spawnBoss(bossType: string): Boss {
    this.currentBoss = BossFactory.createBoss(bossType as 'commandant-alpha');
    return this.currentBoss;
  }

  getCurrentBoss(): Boss | null {
    return this.currentBoss;
  }

  defeatedBoss(): BossStats | null {
    if (!this.currentBoss || this.currentBoss.isAlive()) {
      return null;
    }
    
    const stats = this.currentBoss.stats;
    this.currentBoss = null;
    return stats;
  }

  update(deltaTime: number): void {
    // Логика обновления боя с боссом
  }
}
