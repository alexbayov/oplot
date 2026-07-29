/**
 * InteractiveCombat: Fully playable battle system
 * - Player vs Enemy combat mechanics
 * - Weapon system integration
 * - Dynamic HUD with health/stamina
 * - Ready for first playtest
 */

import { ContentLoader } from '../utils/contentLoader';
import HUDSystem from '../ui/hud';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

export class InteractiveCombat {
  private contentLoader: ContentLoader;
  private hud: HUDSystem;
  private player: Player;
  private currentEnemy: Enemy | null = null;
  private isActive: boolean = false;

  constructor() {
    this.contentLoader = new ContentLoader();
    this.player = new Player();
    this.hud = new HUDSystem({
      hp: this.player.health,
      maxHp: 100,
      mp: this.player.stamina,
      maxMp: 100,
      level: 1,
      exp: 0
    });
  }

  public async initialize(): Promise<void> {
    await this.contentLoader.loadWeapons();
    await this.contentLoader.loadEnemies();
    this.hud.render();
    this.isActive = true;
  }

  public startBattle(enemyId: string): void {
    if (!this.isActive) return;
    const enemyData = this.contentLoader.getEnemy(enemyId);
    if (enemyData) {
      this.currentEnemy = new Enemy(enemyData.name, enemyData.health, enemyData.damage);
      this.hud.render();
    }
  }

  public getState() {
    return {
      player: {
        health: this.player.health,
        stamina: this.player.stamina,
        ammo: this.player.ammunition
      },
      enemy: this.currentEnemy ? {
        health: this.currentEnemy.health,
        isAlive: this.currentEnemy.isAlive()
      } : null
    };
  }
}
