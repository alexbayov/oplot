/**
 * HUD System for Battle UI
 * Handles battle heads-up display rendering and updates
 */

export interface HUDElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  exp: number;
}

export class HUDSystem {
  private elements: Map<string, HUDElement> = new Map();
  private playerStats: PlayerStats;

  constructor(initialStats: PlayerStats) {
    this.playerStats = initialStats;
    this.initializeHUD();
  }

  private initializeHUD(): void {
    // Initialize HUD elements
    this.elements.set('healthBar', {
      id: 'healthBar',
      x: 10,
      y: 10,
      width: 200,
      height: 20,
      visible: true
    });

    this.elements.set('manaBar', {
      id: 'manaBar',
      x: 10,
      y: 40,
      width: 200,
      height: 20,
      visible: true
    });

    this.elements.set('levelDisplay', {
      id: 'levelDisplay',
      x: 10,
      y: 70,
      width: 100,
      height: 20,
      visible: true
    });
  }

  updatePlayerStats(stats: Partial<PlayerStats>): void {
    this.playerStats = { ...this.playerStats, ...stats };
  }

  getHUDElement(id: string): HUDElement | undefined {
    return this.elements.get(id);
  }

  render(): void {
    // Render all visible HUD elements
    for (const [, element] of this.elements) {
      if (element.visible) {
        this.renderElement(element);
      }
    }
  }

  private renderElement(element: HUDElement): void {
    // Placeholder for rendering logic
    console.log(`Rendering HUD element: ${element.id} at (${element.x}, ${element.y})`);
  }

  getPlayerStats(): PlayerStats {
    return { ...this.playerStats };
  }
}

export default HUDSystem;
