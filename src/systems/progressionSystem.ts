/**
 * Progression System
 * Управление уровнями, перками и прогрессией персонажа
 */

export interface Perk {
  id: string;
  name: string;
  description: string;
  level: number; // Минимальный уровень для получения
  category: 'combat' | 'defense' | 'utility' | 'economy';
  effect: {
    statName: string;
    modifier: number; // Может быть процент или абсолютное значение
  };
  icon: string;
}

export const PERKS: Perk[] = [
  {
    id: 'iron-skin',
    name: 'Железная кожа',
    description: 'Увеличивает защиту на 20%',
    level: 1,
    category: 'defense',
    effect: {
      statName: 'defense',
      modifier: 0.2
    },
    icon: '🛡️'
  },

  {
    id: 'blade-master',
    name: 'Мастер клинка',
    description: 'Увеличивает атаку на 25%',
    level: 5,
    category: 'combat',
    effect: {
      statName: 'attack',
      modifier: 0.25
    },
    icon: '⚔️'
  },

  {
    id: 'lifesteal',
    name: 'Жизненный вампиризм',
    description: '20% урона восстанавливает здоровье',
    level: 10,
    category: 'combat',
    effect: {
      statName: 'lifesteal',
      modifier: 0.2
    },
    icon: '🩸'
  },

  {
    id: 'gold-finder',
    name: 'Ищущий золота',
    description: 'Получай на 30% больше золота от врагов',
    level: 3,
    category: 'economy',
    effect: {
      statName: 'goldMultiplier',
      modifier: 0.3
    },
    icon: '💰'
  },

  {
    id: 'berserker',
    name: 'Берсеркер',
    description: 'При низком здоровье атака увеличивается на 50%',
    level: 15,
    category: 'combat',
    effect: {
      statName: 'berserkAttackBonus',
      modifier: 0.5
    },
    icon: '😤'
  }
];

export interface CharacterStats {
  level: number;
  experience: number;
  nextLevelExp: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  mana: number;
  maxMana: number;
}

export class ProgressionSystem {
  private stats: CharacterStats;
  private selectedPerks: Perk[] = [];
  private experienceMultiplier: number = 1.0;

  constructor() {
    this.stats = {
      level: 1,
      experience: 0,
      nextLevelExp: 100,
      health: 100,
      maxHealth: 100,
      attack: 10,
      defense: 5,
      mana: 50,
      maxMana: 50
    };
  }

  addExperience(amount: number): boolean {
    const adjustedExp = Math.floor(amount * this.experienceMultiplier);
    this.stats.experience += adjustedExp;

    let leveledUp = false;
    
    while (this.stats.experience >= this.stats.nextLevelExp) {
      this.levelUp();
      leveledUp = true;
    }

    return leveledUp;
  }

  private levelUp(): void {
    this.stats.experience -= this.stats.nextLevelExp;
    this.stats.level += 1;

    // Увеличиваем требуемый опыт для следующего уровня
    this.stats.nextLevelExp = Math.floor(100 * Math.pow(1.1, this.stats.level - 1));

    // Увеличиваем статы
    this.stats.maxHealth += 20;
    this.stats.health = this.stats.maxHealth;
    this.stats.attack += 3;
    this.stats.defense += 2;
    this.stats.maxMana += 10;
    this.stats.mana = this.stats.maxMana;
  }

  getAvailablePerks(): Perk[] {
    return PERKS.filter(perk => 
      perk.level <= this.stats.level &&
      !this.selectedPerks.some(p => p.id === perk.id)
    );
  }

  selectPerk(perkId: string): boolean {
    const perk = PERKS.find(p => p.id === perkId);
    
    if (!perk) return false;
    if (perk.level > this.stats.level) return false;
    if (this.selectedPerks.some(p => p.id === perkId)) return false;

    this.selectedPerks.push(perk);
    this.applyPerkEffect(perk);
    
    return true;
  }

  private applyPerkEffect(perk: Perk): void {
    switch (perk.effect.statName) {
      case 'defense':
        this.stats.defense += Math.floor(this.stats.defense * perk.effect.modifier);
        break;
      case 'attack':
        this.stats.attack += Math.floor(this.stats.attack * perk.effect.modifier);
        break;
      case 'lifesteal':
        // Это может быть сохранено как специальная статистика
        break;
      case 'goldMultiplier':
        this.experienceMultiplier += perk.effect.modifier;
        break;
      case 'berserkAttackBonus':
        // Это может быть сохранено как специальная статистика
        break;
    }
  }

  removePerk(perkId: string): boolean {
    const index = this.selectedPerks.findIndex(p => p.id === perkId);
    
    if (index === -1) return false;
    
    const perk = this.selectedPerks[index];
    this.selectedPerks.splice(index, 1);
    this.reapplyPerks();
    
    return true;
  }

  private reapplyPerks(): void {
    // Сбрасываем модификаторы
    this.stats.attack = 10;
    this.stats.defense = 5;
    this.experienceMultiplier = 1.0;
    
    // Переприменяем все выбранные перки
    for (const perk of this.selectedPerks) {
      this.applyPerkEffect(perk);
    }
  }

  getStats(): CharacterStats {
    return { ...this.stats };
  }

  getSelectedPerks(): Perk[] {
    return [...this.selectedPerks];
  }

  getCurrentLevel(): number {
    return this.stats.level;
  }

  getExperienceProgress(): number {
    return this.stats.experience / this.stats.nextLevelExp;
  }

  getExpToNextLevel(): number {
    return this.stats.nextLevelExp - this.stats.experience;
  }

  healFull(): void {
    this.stats.health = this.stats.maxHealth;
  }

  restoreMana(): void {
    this.stats.mana = this.stats.maxMana;
  }

  takeDamage(damage: number): number {
    const mitigatedDamage = Math.max(1, damage - Math.floor(this.stats.defense / 2));
    this.stats.health = Math.max(0, this.stats.health - mitigatedDamage);
    
    return mitigatedDamage;
  }

  isDead(): boolean {
    return this.stats.health <= 0;
  }
}
