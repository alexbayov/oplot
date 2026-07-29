# 🎮 Boss System: Примеры Использования

## 1. БАЗОВОЕ ИСПОЛЬЗОВАНИЕ

### Спавн босса

```typescript
import { BossSystem, DifficultyLevel } from "./systems/bossSystem_improved";

const bossSystem = new BossSystem();

// Легкий уровень
const easyBoss = bossSystem.spawnBoss("commandant-alpha", DifficultyLevel.EASY);

// Нормальный уровень (по умолчанию)
const normalBoss = bossSystem.spawnBoss("commandant-alpha");

// Сложный уровень
const hardBoss = bossSystem.spawnBoss("commandant-alpha", DifficultyLevel.HARD);

console.log(easyBoss.stats);
// {
//   name: "Командант Альфа",
//   level: 10,
//   maxHealth: 120,  // EASY
//   health: 120,
//   attack: 15,
//   defense: 4,
//   experience: 3000
// }
```

---

## 2. СИСТЕМА БОЕВЫХ ФАЗ

### Отслеживание переходов фаз

```typescript
const boss = bossSystem.spawnBoss("commandant-alpha");

// Нанести урон в фазе 1
let result = boss.takeDamage(40);
console.log(result);
// {
//   reduced: 30,        // Урон после защиты (40 - 10 defense)
//   phaseChanged: false,
//   oldPhase: PHASE_1,
//   newPhase: PHASE_1,
//   transitionConfig: undefined
// }

// Нанести много урона, чтобы перейти в фазу 2 (66% HP = 99 HP для 150 max)
for (let i = 0; i < 3; i++) {
  boss.takeDamage(40);
}

result = boss.takeDamage(10);
console.log(result);
// {
//   reduced: 0,         // min 1 damage
//   phaseChanged: true,
//   oldPhase: PHASE_1,
//   newPhase: PHASE_2,
//   transitionConfig: {
//     effects: ["shake", "flash"],
//     soundCue: "commander-power-up.ogg",
//     duration: 1200,
//     playerCanAct: false,
//     particleEffect: "power-surge"
//   }
// }

// Обработка перехода фазы в игре
if (result.phaseChanged && result.transitionConfig) {
  playTransitionEffects(result.transitionConfig.effects);
  playSound(result.transitionConfig.soundCue);
  freezePlayer(result.transitionConfig.duration);
}
```

### Проверить описание текущей фазы

```typescript
const boss = bossSystem.spawnBoss("commandant-alpha");

console.log(boss.getPhaseDescription());
// "Фаза 1: Спокойствие перед бурей"

console.log(boss.getPhaseSpecialAction());
// "Командант готовится к бою, его атаки стандартны"

// После перехода в фазу 2
// ...урон...

console.log(boss.getPhaseDescription());
// "Фаза 2: Командант активизируется"

console.log(boss.getPhaseSpecialAction());
// "Командант учащает свои атаки и использует способности чаще"
```

---

## 3. СИСТЕМА ДИНАМИЧЕСКИХ СПОСОБНОСТЕЙ

### Получение способностей для текущей фазы

```typescript
const boss = bossSystem.spawnBoss("commandant-alpha") as CommandantAlpha;

// В фазе 1: получить Strike способность
const strikeAbility = boss.abilities.find(a => a.name === "Strike");
const variant = strikeAbility.getVariantForPhase(BossPhase.PHASE_1);

console.log(variant);
// {
//   phase: PHASE_1,
//   damage: 30,
//   cooldown: 4000,
//   animation: "power-strike-calm",
//   windUpTime: 600,
//   description: "Уверенный удар"
// }

// После перехода в фазу 3
// ...урон...

const variant3 = strikeAbility.getVariantForPhase(BossPhase.PHASE_3);
console.log(variant3);
// {
//   phase: PHASE_3,
//   damage: 55,
//   cooldown: 2000,
//   effect: { type: "crit-chance", value: 0.5 },
//   animation: "power-strike-desperate",
//   windUpTime: 400,
//   description: "Отчаянный удар с шансом крита"
// }
```

### Использование способности

```typescript
const currentTime = Date.now();
const boss = bossSystem.spawnBoss("commandant-alpha");

// Получить доступные способности
const available = boss.getAvailableAbilities(currentTime);
console.log(available.map(a => a.name));
// ["Strike", "Shock Wave", "Berserk Combo"]

// Использовать способность
const result = boss.useAbility("Strike", currentTime);
if (result) {
  const { ability, variant } = result;
  console.log(`${ability.name} deals ${variant.damage} damage`);
  console.log(`Wind-up: ${variant.windUpTime}ms`);
  console.log(`Next use in ${variant.cooldown}ms`);
  
  // Воспроизвести wind-up анимацию
  playAnimation(variant.animation, variant.windUpTime);
  
  // После wind-up нанести урон
  setTimeout(() => {
    playerTakeDamage(variant.damage);
    
    // Применить эффект если есть
    if (variant.effect) {
      applyEffect(variant.effect);
    }
  }, variant.windUpTime);
}
```

### Получить масштабированный урон для фазы

```typescript
const boss = bossSystem.spawnBoss("commandant-alpha") as CommandantAlpha;
const strike = boss.abilities.find(a => a.name === "Strike");

// Фаза 1
let damage = strike.getScaledDamage(BossPhase.PHASE_1);
console.log(damage); // 30

// Фаза 3
damage = strike.getScaledDamage(BossPhase.PHASE_3);
console.log(damage); // 55

// С учетом множителей
const baseDamage = strike.getScaledDamage(boss.phase);
const withMultiplier = baseDamage * boss.getDamageMultiplier();
console.log(`Base: ${baseDamage}, With multiplier: ${withMultiplier}`);
// Base: 40, With multiplier: 48 (for PHASE_2)
```

---

## 4. СИСТЕМА ПАТТЕРНОВ АТАК

### Выбрать следующее действие

```typescript
const boss = bossSystem.spawnBoss("commandant-alpha");

// Получить доступные паттерны для текущей фазы
const availablePatterns = boss.patterns.filter(p => p.phase === boss.phase);
console.log(availablePatterns);
// [
//   { phase: PHASE_1, sequence: [...], probability: 0.6, name: "Pattern_1A" },
//   { phase: PHASE_1, sequence: [...], probability: 0.4, name: "Pattern_1B" }
// ]

// Выбрать следующее действие в цикле боя
const nextAction = boss.selectNextAction(Date.now());
console.log(nextAction);
// { action: "ability", value: "Strike" }

// или

// { action: "pause", value: 1500 }
```

### Реализовать AI цикл босса

```typescript
class BossAI {
  private boss: Boss;
  private currentPatternIndex: number = 0;
  private currentPattern: AttackPattern | null = null;

  constructor(boss: Boss) {
    this.boss = boss;
  }

  update(deltaTime: number): void {
    // Если босс в переходе фазы - не действует
    if (this.boss.isInPhaseTransition()) {
      return;
    }

    // Выбрать паттерн если его нет
    if (!this.currentPattern) {
      const patterns = this.boss.patterns.filter(
        p => p.phase === this.boss.phase
      );
      this.currentPattern = patterns[
        Math.floor(Math.random() * patterns.length)
      ];
      this.currentPatternIndex = 0;
    }

    // Выполнить следующее действие в паттерне
    const node = this.currentPattern.sequence[this.currentPatternIndex];

    if (node.action === "ability") {
      const abilityResult = this.boss.useAbility(node.value as string, Date.now());
      if (abilityResult) {
        const { variant } = abilityResult;
        console.log(`Boss uses ${node.value}, deals ${variant.damage} damage`);
        this.executeAbility(variant);
      }
    } else if (node.action === "pause") {
      console.log(`Boss pauses for ${node.value}ms`);
    }

    this.currentPatternIndex++;

    // Если паттерн закончился, выбрать новый
    if (this.currentPatternIndex >= this.currentPattern.sequence.length) {
      this.currentPattern = null;
      this.currentPatternIndex = 0;
    }
  }

  private executeAbility(variant: BossAbilityPhaseVariant): void {
    // Воспроизвести анимацию
    if (variant.animation) {
      console.log(`Playing animation: ${variant.animation}`);
    }

    // Применить эффекты
    if (variant.effect) {
      console.log(`Applying effect: ${variant.effect.type}`);
    }
  }
}

// Использование
const bossAI = new BossAI(boss);
gameLoop.on("update", (deltaTime) => bossAI.update(deltaTime));
```

---

## 5. СИСТЕМА ЛУТА

### Получить награду при победе

```typescript
const bossSystem = new BossSystem();
const boss = bossSystem.spawnBoss("commandant-alpha");

// Нанести урон и убить босса
// ...боевой цикл...

// После победы над боссом
const reward = bossSystem.getDefeatedBossReward();

if (reward) {
  console.log(reward);
  // {
  //   stats: { name: "Командант Альфа", ... },
  //   experience: 5000,          // базовая сумма
  //   lootTier: {
  //     maxHealthPercent: 50,
  //     multiplier: 1.0,
  //     rarity: "common"
  //   }
  // }

  // Применить награду
  player.addExperience(reward.experience);
  inventory.addLoot(reward.lootTier.rarity, reward.stats.level);
}
```

### Демонстрация масштабирования лута

```typescript
const bossSystem = new BossSystem();

// Сценарий 1: Честный бой, HP > 50%
let boss = bossSystem.spawnBoss("commandant-alpha");
// ...урон 50% HP...
let reward = bossSystem.getDefeatedBossReward();
console.log(reward?.lootTier);
// { maxHealthPercent: 50, multiplier: 1.0, rarity: "common" }
// experience: 5000

// Сценарий 2: Узкая победа, HP 30-50%
boss = bossSystem.spawnBoss("commandant-alpha");
// ...урон до 30% HP...
reward = bossSystem.getDefeatedBossReward();
console.log(reward?.lootTier);
// { maxHealthPercent: 30, multiplier: 1.5, rarity: "rare" }
// experience: 7500

// Сценарий 3: Ониум-на-ониум победа, HP < 10%
boss = bossSystem.spawnBoss("commandant-alpha");
// ...урон до 5% HP...
reward = bossSystem.getDefeatedBossReward();
console.log(reward?.lootTier);
// { maxHealthPercent: 10, multiplier: 2.0, rarity: "epic" }
// experience: 10000
```

---

## 6. ПОЛНЫЙ БОЙ: СИМУЛЯЦИЯ

```typescript
class BattleSimulator {
  private bossSystem: BossSystem;
  private bossAI: BossAI;
  private playerHealth: number = 100;
  private battleLog: string[] = [];

  constructor() {
    this.bossSystem = new BossSystem();
    const boss = this.bossSystem.spawnBoss("commandant-alpha", DifficultyLevel.NORMAL);
    this.bossAI = new BossAI(boss);
  }

  simulateTurn(): void {
    const boss = this.bossSystem.getCurrentBoss();
    if (!boss || !boss.isAlive() || this.playerHealth <= 0) {
      return;
    }

    // Ход игрока
    const playerDamage = Math.floor(Math.random() * 20) + 10;
    const result = boss.takeDamage(playerDamage);

    this.battleLog.push(
      `[Player] Deals ${result.reduced} damage ` +
      `(${boss.stats.health}/${boss.stats.maxHealth} HP)`
    );

    if (result.phaseChanged) {
      this.battleLog.push(`⚡ [Phase Transition] ${boss.getPhaseDescription()}`);
      if (result.transitionConfig) {
        this.battleLog.push(
          `   Effects: ${result.transitionConfig.effects.join(", ")}`
        );
      }
    }

    if (!boss.isAlive()) {
      this.battleLog.push(`🎉 [Victory] Boss defeated!`);
      const reward = this.bossSystem.getDefeatedBossReward();
      if (reward) {
        this.battleLog.push(
          `💰 Experience: ${reward.experience} (${reward.lootTier.rarity})`
        );
      }
      return;
    }

    // Ход босса
    this.bossAI.update(16);
    const bossDamage = boss.stats.attack + Math.floor(Math.random() * 10);
    this.playerHealth = Math.max(0, this.playerHealth - bossDamage);

    this.battleLog.push(
      `[Boss] Deals ${bossDamage} damage ` +
      `(Player: ${this.playerHealth}/100 HP)`
    );
  }

  runBattle(): void {
    let turns = 0;
    const maxTurns = 100;

    while (turns < maxTurns) {
      this.simulateTurn();
      const boss = this.bossSystem.getCurrentBoss();

      if (!boss || !boss.isAlive() || this.playerHealth <= 0) {
        break;
      }

      turns++;
    }

    console.log("=== BATTLE LOG ===");
    this.battleLog.forEach(log => console.log(log));
  }
}

// Симуляция боя
const simulator = new BattleSimulator();
simulator.runBattle();

// === BATTLE LOG ===
// [Player] Deals 18 damage (132/150 HP)
// [Boss] Deals 27 damage (Player: 73/100 HP)
// ...
// ⚡ [Phase Transition] Фаза 2: Командант активизируется
//    Effects: shake, flash
// [Player] Deals 17 damage (68/150 HP)
// [Boss] Deals 31 damage (Player: 42/100 HP)
// ...
// 🎉 [Victory] Boss defeated!
// 💰 Experience: 7500 (rare)
```

---

## 7. ВИЗУАЛИЗАЦИЯ ФАЗОВЫХ ПЕРЕХОДОВ

### React компонент

```typescript
interface BossHealthBarProps {
  boss: Boss | null;
}

export const BossHealthBar: React.FC<BossHealthBarProps> = ({ boss }) => {
  if (!boss) return null;

  const healthPercent = (boss.stats.health / boss.stats.maxHealth) * 100;
  const phaseColor = {
    [BossPhase.PHASE_1]: "#3B82F6",
    [BossPhase.PHASE_2]: "#F59E0B",
    [BossPhase.PHASE_3]: "#EF4444"
  };

  return (
    <div className="boss-health-container">
      <h2>{boss.stats.name}</h2>
      <div className="health-bar-wrapper">
        <div
          className="health-bar"
          style={{
            width: `${healthPercent}%`,
            backgroundColor: phaseColor[boss.phase],
            transition: "width 0.3s ease"
          }}
        />
      </div>
      <p className="health-text">
        {boss.stats.health} / {boss.stats.maxHealth}
      </p>
      <p className="phase-text">{boss.getPhaseDescription()}</p>

      {/* Visual indicators для фазовых переходов */}
      {healthPercent <= 66 && healthPercent > 33 && (
        <div className="phase-indicator phase-2">Phase 2 Active</div>
      )}
      {healthPercent <= 33 && (
        <div className="phase-indicator phase-3">Phase 3 - BERSERK!</div>
      )}
    </div>
  );
};
```

### CSS анимации

```css
.boss-health-container {
  position: relative;
  padding: 20px;
  border: 2px solid #333;
  background: #222;
  border-radius: 8px;
}

.health-bar-wrapper {
  width: 100%;
  height: 30px;
  background: #444;
  border-radius: 4px;
  overflow: hidden;
}

.health-bar {
  height: 100%;
  background: linear-gradient(to right, #3B82F6, #60A5FA);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

.phase-indicator {
  position: absolute;
  top: -30px;
  right: 20px;
  padding: 5px 15px;
  border-radius: 4px;
  font-weight: bold;
  animation: pulse 1s infinite;
}

.phase-2 {
  background: #F59E0B;
  color: #000;
}

.phase-3 {
  background: #EF4444;
  color: #fff;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Phase transition effects */
@keyframes screen-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes flash-white {
  0% { opacity: 0; }
  50% { opacity: 1; background: white; }
  100% { opacity: 0; }
}

.transition-active {
  animation: screen-shake 0.5s;
}

.transition-flash {
  animation: flash-white 0.8s;
}
```

---

## 8. ТЕСТИРОВАНИЕ

```typescript
describe("CommandantAlpha", () => {
  it("should transition to phase 2 at 66% HP", () => {
    const boss = new CommandantAlpha(DifficultyLevel.NORMAL);
    const damageToPhase2 = boss.stats.maxHealth * 0.34 + 1;

    boss.takeDamage(damageToPhase2);

    expect(boss.phase).toBe(BossPhase.PHASE_2);
  });

  it("should have different ability damage in each phase", () => {
    const boss = new CommandantAlpha(DifficultyLevel.NORMAL);
    const strike = boss.abilities.find(a => a.name === "Strike");

    const phase1Damage = strike.getScaledDamage(BossPhase.PHASE_1);
    const phase2Damage = strike.getScaledDamage(BossPhase.PHASE_2);
    const phase3Damage = strike.getScaledDamage(BossPhase.PHASE_3);

    expect(phase1Damage).toBe(30);
    expect(phase2Damage).toBe(40);
    expect(phase3Damage).toBe(55);
  });

  it("should not allow berserk combo outside phase 3", () => {
    const boss = new CommandantAlpha(DifficultyLevel.NORMAL);

    const berserk = boss.abilities.find(a => a.name === "Berserk Combo");
    const available = boss.getAvailableAbilities(Date.now());

    // Berserк недоступен в фазе 1
    expect(available).not.toContain(berserk);
  });

  it("should have correct loot multiplier based on remaining HP", () => {
    const bossSystem = new BossSystem();
    const boss = bossSystem.spawnBoss("commandant-alpha");

    // Убить босса с 15% HP
    while (boss.stats.health > boss.stats.maxHealth * 0.15) {
      boss.takeDamage(10);
    }

    const reward = bossSystem.getDefeatedBossReward();
    expect(reward?.lootTier.multiplier).toBe(1.5);
    expect(reward?.lootTier.rarity).toBe("rare");
  });
});
```

---

## 📋 ЧЕКЛИСТ РЕАЛИЗАЦИИ

- [x] Базовая спавн система с уровнями сложности
- [x] Динамические способности по фазам
- [x] Паттерны атак с вероятностями
- [x] Визуальные конфиги переходов фаз
- [x] Wind-up анимации
- [x] Масштабирование лута
- [ ] Звуковые эффекты в BossSystem
- [ ] Интеграция с графическим движком
- [ ] Система эффектов (баффы/дебаффы)
- [ ] Дополнительные боссы (Paladin Guard, Elite Executor)
