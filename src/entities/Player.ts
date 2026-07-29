/**
 * Player entity for combat system
 */

export class Player {
  public health: number = 100;
  public stamina: number = 100;
  public ammunition: number = 30;
  public currentWeapon: string = 'makarov';

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  public restore(health: number, stamina: number): void {
    this.health = Math.min(100, this.health + health);
    this.stamina = Math.min(100, this.stamina + stamina);
  }

  public shoot(): void {
    if (this.ammunition > 0) {
      this.ammunition--;
      this.stamina = Math.max(0, this.stamina - 10);
    }
  }
}
