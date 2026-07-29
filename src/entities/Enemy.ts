/**
 * Enemy entity for combat system
 */

export class Enemy {
  public health: number;
  public damage: number;
  public name: string;

  constructor(name: string, health: number, damage: number) {
    this.name = name;
    this.health = health;
    this.damage = damage;
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  public isAlive(): boolean {
    return this.health > 0;
  }

  public attack(): number {
    return this.damage;
  }
}
