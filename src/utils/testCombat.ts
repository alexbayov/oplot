/**
 * testCombat.ts
 * Тестовая система боя для отладки
 */

import type { Hero, Enemy, Weapon, Armor } from '../types/GameState';
import { createNewHero } from '../types/GameState';

/**
 * Создаёт тестовое оружие
 */
function createTestWeapon(): Weapon {
  return {
    id: 'test_rifle',
    name: 'Test Rifle',
    type: 'rifle',
    family: 'british',
    base_damage: [10, 20],
    accuracy: 80,
    reload_time: 2,
    range: 300,
    magazine_size: 30,
    weight: 3.5,
    rarity: 'common',
    components: [],
    condition: 100,
    ammo: 30,
  };
}

/**
 * Создаёт тестового врага
 */
function createTestEnemy(): Enemy {
  return {
    id: 'test_enemy_1',
    name: 'Test Soldier',
    type: 'soldier',
    faction: 'german',
    level: 1,
    hp: 50,
    hp_max: 50,
    weapon: createTestWeapon(),
    equipment: {
      armor: null,
    },
    ai_aggression: 70,
    ai_accuracy: 60,
  };
}

/**
 * Симулирует один выстрел
 */
function simulateShot(attacker: { accuracy: number }, defender: { hp: number; hp_max: number }): number {
  const hitChance = Math.random() * 100;
  if (hitChance > attacker.accuracy) {
    return 0; // Промах
  }
  // Урон от 10 до 20
  const damage = Math.floor(Math.random() * 10) + 10;
  return damage;
}

/**
 * Запускает тестовый бой
 */
export function runTestCombat(): void {
  console.log('🎮 === TEST COMBAT SYSTEM ===');
  
  const hero = createNewHero('Test Hero');
  hero.equipment.primary_weapon = createTestWeapon();
  hero.hp = 100;
  hero.hp_max = 100;
  
  const enemy = createTestEnemy();
  
  console.log(`📊 Hero: ${hero.name} (HP: ${hero.hp}/${hero.hp_max})`);
  console.log(`⚔️  Enemy: ${enemy.name} (HP: ${enemy.hp}/${enemy.hp_max})`);
  console.log('');
  
  let round = 1;
  const maxRounds = 20;
  
  while (hero.hp > 0 && enemy.hp > 0 && round <= maxRounds) {
    console.log(`--- Round ${round} ---`);
    
    // Герой атакует
    const heroWeapon = hero.equipment.primary_weapon!;
    const heroDamage = simulateShot(
      { accuracy: heroWeapon.accuracy },
      { hp: enemy.hp, hp_max: enemy.hp_max }
    );
    
    if (heroDamage > 0) {
      enemy.hp -= heroDamage;
      console.log(`💥 Hero shoots: ${heroDamage} damage to enemy!`);
    } else {
      console.log('❌ Hero missed!');
    }
    
    if (enemy.hp <= 0) {
      console.log('');
      console.log('🎉 === HERO WINS ===');
      break;
    }
    
    // Враг атакует
    const enemyWeapon = enemy.weapon;
    const enemyDamage = simulateShot(
      { accuracy: enemy.ai_accuracy },
      { hp: hero.hp, hp_max: hero.hp_max }
    );
    
    if (enemyDamage > 0) {
      hero.hp -= enemyDamage;
      console.log(`💔 Enemy shoots: ${enemyDamage} damage to hero!`);
    } else {
      console.log('❌ Enemy missed!');
    }
    
    if (hero.hp <= 0) {
      console.log('');
      console.log('💀 === HERO DEFEATED ===');
      break;
    }
    
    console.log(`📊 Hero HP: ${hero.hp}/${hero.hp_max} | Enemy HP: ${enemy.hp}/${enemy.hp_max}`);
    console.log('');
    
    round++;
  }
  
  console.log('✅ TEST COMBAT COMPLETE');
}
