/**
 * Loot System
 * Управление добычей и таблицами лута
 */

export interface LootDrop {
  itemId: string;
  itemName: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  weight: number; // Вероятность появления
}

export interface LootTable {
  enemyType: string;
  minGold: number;
  maxGold: number;
  items: LootDrop[];
}

export const LOOT_TABLES: { [key: string]: LootTable } = {
  goblin: {
    enemyType: 'goblin',
    minGold: 10,
    maxGold: 30,
    items: [
      {
        itemId: 'iron-ore',
        itemName: 'Железная руда',
        rarity: 'common',
        quantity: 1,
        weight: 0.5
      },
      {
        itemId: 'copper-coin',
        itemName: 'Медная монета',
        rarity: 'common',
        quantity: 2,
        weight: 0.3
      },
      {
        itemId: 'torn-cloth',
        itemName: 'Порванная ткань',
        rarity: 'common',
        quantity: 1,
        weight: 0.2
      }
    ]
  },

  orc: {
    enemyType: 'orc',
    minGold: 30,
    maxGold: 60,
    items: [
      {
        itemId: 'iron-ore',
        itemName: 'Железная руда',
        rarity: 'uncommon',
        quantity: 2,
        weight: 0.4
      },
      {
        itemId: 'steel-bar',
        itemName: 'Стальной слиток',
        rarity: 'uncommon',
        quantity: 1,
        weight: 0.3
      },
      {
        itemId: 'orc-tusk',
        itemName: 'Клык Орка',
        rarity: 'rare',
        quantity: 1,
        weight: 0.2
      },
      {
        itemId: 'leather-armor',
        itemName: 'Кожаная броня',
        rarity: 'uncommon',
        quantity: 1,
        weight: 0.1
      }
    ]
  },

  troll: {
    enemyType: 'troll',
    minGold: 50,
    maxGold: 100,
    items: [
      {
        itemId: 'mithril-ore',
        itemName: 'Мифрилевая руда',
        rarity: 'rare',
        quantity: 1,
        weight: 0.35
      },
      {
        itemId: 'troll-heart',
        itemName: 'Сердце тролля',
        rarity: 'epic',
        quantity: 1,
        weight: 0.15
      },
      {
        itemId: 'iron-ore',
        itemName: 'Железная руда',
        rarity: 'uncommon',
        quantity: 3,
        weight: 0.3
      },
      {
        itemId: 'health-potion',
        itemName: 'Зелье здоровья',
        rarity: 'uncommon',
        quantity: 2,
        weight: 0.2
      }
    ]
  },

  dragon: {
    enemyType: 'dragon',
    minGold: 200,
    maxGold: 500,
    items: [
      {
        itemId: 'dragon-scale',
        itemName: 'Драконья чешуя',
        rarity: 'epic',
        quantity: 5,
        weight: 0.5
      },
      {
        itemId: 'ancient-gem',
        itemName: 'Древний самоцвет',
        rarity: 'legendary',
        quantity: 1,
        weight: 0.2
      },
      {
        itemId: 'mithril-ore',
        itemName: 'Мифрилевая руда',
        rarity: 'rare',
        quantity: 3,
        weight: 0.3
      }
    ]
  }
};

export class LootSystem {
  static generateLoot(enemyType: string, level: number = 1): { gold: number; items: LootDrop[] } {
    const lootTable = LOOT_TABLES[enemyType];
    
    if (!lootTable) {
      return { gold: 0, items: [] };
    }

    // Генерируем золото
    const goldVariation = 1 + (level - 1) * 0.2;
    const minGold = Math.floor(lootTable.minGold * goldVariation);
    const maxGold = Math.floor(lootTable.maxGold * goldVariation);
    const gold = Math.floor(Math.random() * (maxGold - minGold + 1) + minGold);

    // Генерируем предметы на основе вероятностей
    const items: LootDrop[] = [];
    
    for (const lootDrop of lootTable.items) {
      if (Math.random() < lootDrop.weight) {
        items.push({
          ...lootDrop,
          quantity: Math.max(1, Math.floor(lootDrop.quantity * (1 + (level - 1) * 0.1)))
        });
      }
    }

    return { gold, items };
  }

  static generateBossLoot(bossName: string, level: number = 10): { gold: number; items: LootDrop[] } {
    const baseLoot = this.generateLoot('dragon', level); // Используем драконий лут как основу
    
    // Боссы дают больше лута и лучшие предметы
    const goldMultiplier = 2;
    const extraItems: LootDrop[] = [
      {
        itemId: 'boss-essence',
        itemName: `Сущность ${bossName}`,
        rarity: 'legendary',
        quantity: 1,
        weight: 1.0
      }
    ];

    return {
      gold: baseLoot.gold * goldMultiplier,
      items: [...baseLoot.items, ...extraItems]
    };
  }

  static getRarityColor(rarity: string): string {
    const colors: { [key: string]: string } = {
      common: '#FFFFFF',
      uncommon: '#00FF00',
      rare: '#0070DD',
      epic: '#A335EE',
      legendary: '#FF8000'
    };
    return colors[rarity] || '#FFFFFF';
  }

  static getRarityMultiplier(rarity: string): number {
    const multipliers: { [key: string]: number } = {
      common: 1,
      uncommon: 1.5,
      rare: 2.5,
      epic: 4,
      legendary: 8
    };
    return multipliers[rarity] || 1;
  }
}
