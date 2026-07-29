/**
 * Base Management System
 * Управление базой, зданиями и ресурсами
 */

export interface BuildingConfig {
  type: 'Farm' | 'Generator' | 'Workbench' | 'Storage';
  name: string;
  description: string;
  cost: number;
  productionRate: number;
  productionType: string;
  maxCapacity: number;
  level: number;
}

export interface Resource {
  type: string;
  amount: number;
  capacity: number;
}

export class Building {
  config: BuildingConfig;
  currentProduction: number = 0;
  productionTimer: number = 0;
  isUpgrading: boolean = false;
  upgradeProgress: number = 0;

  constructor(config: BuildingConfig) {
    this.config = config;
  }

  update(deltaTime: number): number {
    if (this.isUpgrading) {
      this.upgradeProgress += deltaTime;
      return 0;
    }

    this.productionTimer += deltaTime;
    let produced = 0;

    while (this.productionTimer >= 1000) {
      produced += Math.floor(this.config.productionRate * (this.config.level / 10));
      this.productionTimer -= 1000;
    }

    this.currentProduction += produced;
    return Math.floor(this.currentProduction);
  }

  upgrade(): boolean {
    if (this.isUpgrading) return false;
    
    this.isUpgrading = true;
    this.upgradeProgress = 0;
    
    return true;
  }

  completeUpgrade(): boolean {
    if (!this.isUpgrading) return false;
    
    this.config.level += 1;
    this.config.productionRate *= 1.2; // Увеличиваем производство на 20%
    this.isUpgrading = false;
    this.upgradeProgress = 0;
    
    return true;
  }

  getUpgradeCost(): number {
    return Math.floor(this.config.cost * Math.pow(1.5, this.config.level - 1));
  }

  getProductionPerSecond(): number {
    return this.config.productionRate * (this.config.level / 10);
  }

  reset(): void {
    this.currentProduction = 0;
    this.productionTimer = 0;
    this.isUpgrading = false;
    this.upgradeProgress = 0;
  }
}

export class BaseManagement {
  buildings: Map<string, Building> = new Map();
  resources: Map<string, Resource> = new Map();
  updateInterval: number = 0;

  constructor() {
    this.initializeBuildings();
    this.initializeResources();
  }

  private initializeBuildings(): void {
    const buildingConfigs: BuildingConfig[] = [
      {
        type: 'Farm',
        name: 'Ферма',
        description: 'Производит пищу для повышения здоровья',
        cost: 100,
        productionRate: 5,
        productionType: 'food',
        maxCapacity: 500,
        level: 1
      },
      {
        type: 'Generator',
        name: 'Генератор энергии',
        description: 'Производит энергию для активации способностей',
        cost: 200,
        productionRate: 8,
        productionType: 'energy',
        maxCapacity: 1000,
        level: 1
      },
      {
        type: 'Workbench',
        name: 'Верстак',
        description: 'Крафтит улучшенное оружие и броню',
        cost: 300,
        productionRate: 3,
        productionType: 'crafted-items',
        maxCapacity: 100,
        level: 1
      },
      {
        type: 'Storage',
        name: 'Хранилище',
        description: 'Увеличивает вместимость всех ресурсов',
        cost: 150,
        productionRate: 0,
        productionType: 'capacity',
        maxCapacity: 5000,
        level: 1
      }
    ];

    for (const config of buildingConfigs) {
      this.buildings.set(config.type, new Building(config));
    }
  }

  private initializeResources(): void {
    this.resources.set('food', {
      type: 'food',
      amount: 0,
      capacity: 500
    });

    this.resources.set('energy', {
      type: 'energy',
      amount: 0,
      capacity: 1000
    });

    this.resources.set('crafted-items', {
      type: 'crafted-items',
      amount: 0,
      capacity: 100
    });

    this.resources.set('gold', {
      type: 'gold',
      amount: 0,
      capacity: 10000
    });
  }

  addResource(resourceType: string, amount: number): number {
    const resource = this.resources.get(resourceType);
    
    if (!resource) {
      return 0;
    }

    const addableAmount = Math.min(amount, resource.capacity - resource.amount);
    resource.amount += addableAmount;
    
    return addableAmount;
  }

  removeResource(resourceType: string, amount: number): boolean {
    const resource = this.resources.get(resourceType);
    
    if (!resource || resource.amount < amount) {
      return false;
    }

    resource.amount -= amount;
    return true;
  }

  getResource(resourceType: string): Resource | null {
    return this.resources.get(resourceType) || null;
  }

  getAllResources(): Resource[] {
    return Array.from(this.resources.values());
  }

  upgradeBuilding(buildingType: string): boolean {
    const building = this.buildings.get(buildingType);
    
    if (!building) return false;
    if (building.isUpgrading) return false;

    const cost = building.getUpgradeCost();
    
    if (!this.removeResource('gold', cost)) {
      return false;
    }

    return building.upgrade();
  }

  getBuilding(buildingType: string): Building | null {
    return this.buildings.get(buildingType) || null;
  }

  getAllBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  update(deltaTime: number): void {
    this.updateInterval += deltaTime;

    // Обновляем все здания
    for (const building of this.buildings.values()) {
      if (building.isUpgrading && building.upgradeProgress >= 5000) {
        building.completeUpgrade();
      }

      const produced = building.update(deltaTime);
      
      if (produced > 0) {
        this.addResource(building.config.productionType, produced);
      }
    }

    // Проверяем перепроизводство
    for (const resource of this.resources.values()) {
      if (resource.amount > resource.capacity) {
        resource.amount = resource.capacity;
      }
    }
  }

  getProductionStats(): {
    buildingType: string;
    productionPerSecond: number;
    currentProduction: number;
  }[] {
    return Array.from(this.buildings.values()).map(building => ({
      buildingType: building.config.type,
      productionPerSecond: building.getProductionPerSecond(),
      currentProduction: building.currentProduction
    }));
  }

  getTotalStorageCapacity(): number {
    let totalCapacity = 0;
    
    for (const resource of this.resources.values()) {
      totalCapacity += resource.capacity;
    }
    
    return totalCapacity;
  }

  getTotalResourcesAmount(): number {
    let total = 0;
    
    for (const resource of this.resources.values()) {
      total += resource.amount;
    }
    
    return total;
  }

  reset(): void {
    for (const building of this.buildings.values()) {
      building.reset();
    }

    for (const resource of this.resources.values()) {
      resource.amount = 0;
    }
  }
}
