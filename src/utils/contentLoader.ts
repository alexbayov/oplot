/**
 * ContentLoader: Manage weapons and enemies
 * - Weapons: Makarov, Lee-Enfield
 * - Enemies: Looter, Soldier
 * - Dynamic content management
 */

interface Weapon {
  id: string;
  name: string;
  damage: number;
  ammo: number;
}

interface Enemy {
  id: string;
  name: string;
  health: number;
  damage: number;
  loot: string[];
}

export class ContentLoader {
  private weapons: Map<string, Weapon> = new Map();
  private enemies: Map<string, Enemy> = new Map();

  public async loadWeapons(): Promise<void> {
    this.weapons.set('makarov', {
      id: 'makarov',
      name: 'Makarov PM',
      damage: 12,
      ammo: 8
    });
    
    this.weapons.set('lee-enfield', {
      id: 'lee-enfield',
      name: 'Lee-Enfield',
      damage: 35,
      ammo: 10
    });
  }

  public async loadEnemies(): Promise<void> {
    this.enemies.set('looter', {
      id: 'looter',
      name: 'Looter',
      health: 30,
      damage: 8,
      loot: ['ammo', 'medical']
    });

    this.enemies.set('soldier', {
      id: 'soldier',
      name: 'Soldier',
      health: 60,
      damage: 15,
      loot: ['rifle', 'supplies']
    });
  }

  public getWeapon(id: string): Weapon | undefined {
    return this.weapons.get(id);
  }

  public getEnemy(id: string): Enemy | undefined {
    return this.enemies.get(id);
  }

  public getAllWeapons(): Weapon[] {
    return Array.from(this.weapons.values());
  }

  public getAllEnemies(): Enemy[] {
    return Array.from(this.enemies.values());
  }
}
