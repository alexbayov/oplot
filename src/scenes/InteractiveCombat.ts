/**
 * InteractiveCombat: Fully playable battle system
 * - Player vs Enemy combat mechanics
 * - Weapon system integration
 * - Dynamic HUD with health/stamina
 * - Ready for first playtest
 */

import { CombatSystem } from '../systems/combatSystem';
import { ContentLoader } from '../utils/contentLoader';
import { HUD } from '../ui/hud';

export class InteractiveCombat {
  private combatSystem: CombatSystem;
  private contentLoader: ContentLoader;
  private hud: HUD;
  private isActive: boolean = false;

  constructor() {
    this.contentLoader = new ContentLoader();
    this.combatSystem = new CombatSystem();
    this.hud = new HUD();
  }

  public async initialize(): Promise<void> {
    await this.contentLoader.loadWeapons();
    await this.contentLoader.loadEnemies();
    this.hud.render();
    this.isActive = true;
  }

  public startBattle(): void {
    if (!this.isActive) return;
    this.combatSystem.startCombat();
    this.hud.update(this.combatSystem.getState());
  }

  public getState() {
    return this.combatSystem.getState();
  }
}
