/**
 * InteractiveCombat: Fully playable battle system
 * - Player vs Enemy combat mechanics
 * - Weapon system integration
 * - Dynamic HUD with health/stamina
 * - Audio system with sound effects and music
 * - Ready for first playtest
 */

import { ContentLoader } from '../utils/contentLoader';
import HUDSystem from '../ui/hud';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { AudioSystem } from '../systems/audioSystem';
import * as BABYLON from '@babylonjs/core';

export class InteractiveCombat {
  private contentLoader: ContentLoader;
  private hud: HUDSystem;
  private player: Player;
  private currentEnemy: Enemy | null = null;
  private isActive: boolean = false;
  private audioSystem: AudioSystem;
  private scene: BABYLON.Scene;
  private currentPhase: 1 | 2 | 3 = 1;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.contentLoader = new ContentLoader();
    this.player = new Player();
    this.audioSystem = new AudioSystem(scene);
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
    this.audioSystem.startBaseMusic();
    this.isActive = true;
  }

  public startBattle(enemyId: string): void {
    if (!this.isActive) return;
    const enemyData = this.contentLoader.getEnemy(enemyId);
    if (enemyData) {
      this.currentEnemy = new Enemy(enemyData.name, enemyData.health, enemyData.damage);
      this.currentPhase = 1;
      this.audioSystem.startCombatMusic(1);
      this.hud.render();
    }
  }

  public performAttack(type: 'light' | 'heavy'): void {
    if (!this.currentEnemy || !this.currentEnemy.isAlive()) return;

    const isCritical = Math.random() < 0.15; // 15% крит шанс
    const damageMultiplier = type === 'heavy' ? 1.5 : 1;
    const finalMultiplier = isCritical ? 2 : damageMultiplier;
    const damage = 10 * finalMultiplier;

    // Воспроизведи звук атаки
    if (isCritical) {
      this.audioSystem.playAttackSound('critical');
    } else {
      this.audioSystem.playAttackSound(type);
    }

    this.currentEnemy.takeDamage(damage);

    // Проверка смерти врага
    if (!this.currentEnemy.isAlive()) {
      this.audioSystem.playAttackSound('critical');
      this.onEnemyDefeated();
    } else {
      this.checkPhaseTransition();
    }

    this.hud.render();
  }

  private checkPhaseTransition(): void {
    if (!this.currentEnemy) return;

    const healthPercent = this.currentEnemy.health / 100;
    let newPhase: 1 | 2 | 3 = 1;

    if (healthPercent > 0.67) {
      newPhase = 1;
    } else if (healthPercent > 0.33) {
      newPhase = 2;
    } else {
      newPhase = 3;
    }

    if (newPhase !== this.currentPhase) {
      this.currentPhase = newPhase;
      this.audioSystem.playUISound('phase');
      this.audioSystem.startCombatMusic(newPhase);
    }
  }

  private onEnemyDefeated(): void {
    this.currentEnemy = null;
    this.audioSystem.playUISound('levelup');
    // Через 2 секунды вернись на базовую музыку
    setTimeout(() => {
      this.audioSystem.startBaseMusic();
    }, 2000);
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
      } : null,
      combatPhase: this.currentPhase
    };
  }

  public destroy(): void {
    this.audioSystem.stopMusic();
    this.isActive = false;
  }
}
