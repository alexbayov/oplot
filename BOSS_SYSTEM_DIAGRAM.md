# 🎮 Boss System: Визуальные Диаграммы

## 1. АРХИТЕКТУРА СИСТЕМЫ

```
┌─────────────────────────────────────────────────────────────┐
│                      BossSystem                              │
│  (главный класс управления боями с боссами)                │
└─────────────────────────────────────────────────────────────┘
           │
           ├─── spawnBoss(type, difficulty)
           │     └─→ BossFactory.createBoss()
           │
           ├─── getCurrentBoss() → Boss | null
           │
           ├─── getDefeatedBossReward() → Reward with LootTier
           │
           └─── update(deltaTime)

         ┌─────────────────────────────────────────────────────┐
         │                    Boss (Abstract)                   │
         │  ┌─────────────────────────────────────────────┐   │
         │  │ stats: BossStats                            │   │
         │  │   - health, maxHealth                       │   │
         │  │   - attack, defense                         │   │
         │  │   - experience, level, name                 │   │
         │  │                                             │   │
         │  │ phase: BossPhase (1, 2, или 3)            │   │
         │  │                                             │   │
         │  │ abilities: BossAbilityDynamic[]            │   │
         │  │   - каждая способность имеет варианты     │   │
         │  │   - для каждой фазы свой урон/кулдаун     │   │
         │  │                                             │   │
         │  │ patterns: AttackPattern[]                   │   │
         │  │   - последовательности атак                │   │
         │  │   - вероятность выбора                      │   │
         │  └─────────────────────────────────────────────┘   │
         │                                                     │
         │ takeDamage(dmg) → DamageResult                    │
         │   ├─ урон после защиты                            │
         │   ├─ изменилась ли фаза                           │
         │   └─ конфиг эффектов перехода                     │
         │                                                     │
         │ getAvailableAbilities(time) → BossAbilityDynamic[] │
         │                                                     │
         │ useAbility(name, time) → UsageResult               │
         │   └─ вариант способности для текущей фазы         │
         │                                                     │
         │ selectNextAction(time) → AttackPatternNode         │
         │   └─ выбор из паттерна боя                         │
         │                                                     │
         │ abstract onPhaseTransition(old, new)              │
         │ abstract getPhaseDescription() → string             │
         └─────────────────────────────────────────────────────┘
              △
              │ extends
              │
         ┌────────────────────┐
         │ CommandantAlpha     │
         │ (конкретный босс)   │
         └────────────────────┘
```

---

## 2. ЖИЗНЕННЫЙ ЦИКЛ СПОСОБНОСТИ

```
┌──────────────────────┐
│  BossAbilityDynamic  │
├──────────────────────┤
│ name: "Strike"       │
│ damage: 30           │
│ cooldown: 3000       │
│ lastUsed: 0          │
└──────────────────────┘
          │
          └─── variants: BossAbilityPhaseVariant[]
               │
               ├─ PHASE_1
               │  ├─ damage: 30
               │  ├─ cooldown: 4000
               │  ├─ animation: "power-strike-calm"
               │  ├─ windUpTime: 600ms
               │  └─ effect: null
               │
               ├─ PHASE_2
               │  ├─ damage: 40
               │  ├─ cooldown: 3000
               │  ├─ animation: "power-strike-intense"
               │  ├─ windUpTime: 500ms
               │  └─ effect: ARMOR_BUFF (+5 defense)
               │
               └─ PHASE_3
                  ├─ damage: 55
                  ├─ cooldown: 2000
                  ├─ animation: "power-strike-desperate"
                  ├─ windUpTime: 400ms
                  └─ effect: CRIT_CHANCE (+50%)

ИСПОЛЬЗОВАНИЕ В БОЮ:
┌──────────────────────────────────────────────────────┐
│ 1. boss.useAbility("Strike", currentTime)           │
│    └─ проверка cooldown                            │
│                                                      │
│ 2. variant = ability.getVariantForPhase(PHASE_2)    │
│    └─ получить вариант для текущей фазы            │
│       (damage=40, cooldown=3000, windUpTime=500)    │
│                                                      │
│ 3. playAnimation(variant.animation, variant.windUpTime)
│    └─ показать wind-up анимацию 500ms              │
│                                                      │
│ 4. setTimeout(() => {                              │
│      playerTakeDamage(variant.damage);              │
│      applyEffect(variant.effect);                   │
│    }, variant.windUpTime)                           │
│    └─ после wind-up нанести урон                   │
│                                                      │
│ 5. ability.lastUsed = currentTime                   │
│    └─ обновить cooldown                            │
└──────────────────────────────────────────────────────┘
```

---

## 3. СИСТЕМА ФАЗОВЫХ ПЕРЕХОДОВ

```
100% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PHASE_1
      NORMAL COMBAT
      ├─ Strike: 30 DMG, 4s cool
      ├─ Shock Wave: 15 DMG, 6s cool
      └─ No special effects
      
 66% ━━━━━━━━━━━━┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PHASE_2 TRANSITION
      ┌──────────────────────────┐
      │ PHASE TRANSITION CONFIG  │
      ├──────────────────────────┤
      │ Effects:                 │
      │  • SCREEN_SHAKE         │
      │  • FLASH_WHITE          │
      │ Sound: "commander-roar"  │
      │ Duration: 1200ms        │
      │ playerCanAct: false      │
      └──────────────────────────┘
      
      AGGRESSIVE PHASE
      ├─ Strike: 40 DMG, 3s cool (+33% damage)
      ├─ Shock Wave: 25 DMG, 4.5s cool (+67% damage)
      ├─ Boss Armor: +20%
      └─ More complex attack patterns
      
 33% ━━━━━━━━━━━━┃━━━━━━━━━━━━━━━━━━━━━━━━┃━━━━━━━ PHASE_3 TRANSITION
      ┌──────────────────────────┐
      │ PHASE TRANSITION CONFIG  │
      ├──────────────────────────┤
      │ Effects:                 │
      │  • CAMERA_ZOOM          │
      │  • PARTICLE_BURST       │
      │  • SCREEN_SHAKE         │
      │ Sound: "desperate-roar"  │
      │ Duration: 1500ms        │
      │ Particle: "desperate-aura"
      │ playerCanAct: false      │
      └──────────────────────────┘
      
      BERSERK PHASE (FINAL)
      ├─ Strike: 55 DMG, 2s cool (+83% damage)
      ├─ Shock Wave: 40 DMG, 3s cool (+167% damage)
      ├─ Berserk Combo: 160 DMG (4 hits), 8s cool
      ├─ Boss Damage: +50%
      ├─ Boss Armor: +10%
      └─ Very aggressive, unpredictable
      
  0% ━━━━━━━━━━━━┃━━━━━━━━━━━━━━━━━━━━━━━━┃━━━━━━━ DEFEATED
      └─ Reward: Experience × multiplier
         └─ Rarity: common/rare/epic based on remaining HP
```

---

## 4. ПАТТЕРНЫ АТАК (ATTACK PATTERNS)

```
PHASE 1 - PATTERN 1A (60% вероятность)
┌─────────────────────────────────────────────────┐
│ [Attack] Strike                                  │
│   └─ 30 DMG, wind-up 600ms                      │
├─────────────────────────────────────────────────┤
│ [Wait] 1500ms (время для игрока атаковать)     │
├─────────────────────────────────────────────────┤
│ [Attack] Shock Wave                             │
│   └─ 15 DMG AOE, wind-up 800ms                  │
├─────────────────────────────────────────────────┤
│ [Wait] 2000ms                                   │
└─────────────────────────────────────────────────┘

PHASE 1 - PATTERN 1B (40% вероятность)
┌─────────────────────────────────────────────────┐
│ [Attack] Strike                                  │
│   └─ 30 DMG, wind-up 600ms                      │
├─────────────────────────────────────────────────┤
│ [Wait] 2000ms                                   │
├─────────────────────────────────────────────────┤
│ [Attack] Strike                                  │
│   └─ 30 DMG, wind-up 600ms                      │
├─────────────────────────────────────────────────┤
│ [Wait] 1500ms                                   │
└─────────────────────────────────────────────────┘

PHASE 2 - PATTERN 2A (70% вероятность)
┌─────────────────────────────────────────────────┐
│ [Attack] Strike #1                               │
│   └─ 40 DMG, wind-up 500ms, +Armor Buff        │
├─────────────────────────────────────────────────┤
│ [Attack] Strike #2 (быстро!)                    │
│   └─ 40 DMG, wind-up 500ms, +Armor Buff        │
├─────────────────────────────────────────────────┤
│ [Wait] 1000ms                                   │
├─────────────────────────────────────────────────┤
│ [Attack] Shock Wave                             │
│   └─ 25 DMG AOE, wind-up 700ms                  │
├─────────────────────────────────────────────────┤
│ [Wait] 1500ms                                   │
└─────────────────────────────────────────────────┘

PHASE 3 - BERSERK COMBO (100% вероятность)
┌─────────────────────────────────────────────────┐
│ [Attack] Frenzied Strike #1          delay: 0ms │
│   └─ 35 DMG, wind-up 400ms                      │
│                                                  │
│ [Attack] Frenzied Strike #2          delay: 400ms
│   └─ 35 DMG, wind-up 400ms                      │
│                                                  │
│ [Attack] Frenzied Strike #3          delay: 800ms
│   └─ 40 DMG, wind-up 400ms                      │
│                                                  │
│ [Attack] Slam (финиш)                delay: 1200ms
│   └─ 50 DMG AOE, wind-up 400ms                  │
│   └─ Effect: STUN (1000ms)                      │
│                                                  │
│ Total: 160 DMG за 1600ms!                      │
└─────────────────────────────────────────────────┘
```

---

## 5. ДЕРЕВО РЕШЕНИЙ: ВЫБОР СЛЕДУЮЩЕГО ДЕЙСТВИЯ

```
selectNextAction(time) 
    │
    ├─ Текущая фаза? PHASE_1
    │   │
    │   ├─ Pattern 1A (60% chance)
    │   │   ├─ Action[0]: Strike
    │   │   ├─ Action[1]: pause 1500
    │   │   ├─ Action[2]: Shock Wave
    │   │   └─ Action[3]: pause 2000
    │   │
    │   └─ Pattern 1B (40% chance)
    │       ├─ Action[0]: Strike
    │       ├─ Action[1]: pause 2000
    │       ├─ Action[2]: Strike
    │       └─ Action[3]: pause 1500
    │
    ├─ Текущая фаза? PHASE_2
    │   │
    │   ├─ Pattern 2A (70% chance)
    │   │   └─ 5 actions (Strike x2 → Shock Wave)
    │   │
    │   └─ Pattern 2B (30% chance)
    │       └─ 3 actions (Shock Wave → Strike x2)
    │
    └─ Текущая фаза? PHASE_3
        │
        └─ Berserk Combo (100% chance)
            └─ 4 frenzied strikes + slam
```

---

## 6. БАЛАНС УРОНА

```
ФАЗА 1 (100% - 66% HP)
───────────────────────────────────────
Strike:       30 DMG × (1/4s)   = 7.5 DPS
Shock Wave:   15 DMG × (1/6s)   = 2.5 DPS
                                ─────────
Общий DPS: ~10 DPS ⭐

Здоровье фазы: 30 HP (150 × 0.2)
Время убить:   30/10 = 3 сек (+ паузы)
Реальное время: ~12 сек

ФАЗА 2 (66% - 33% HP)  
───────────────────────────────────────
Strike:       40 DMG × (1/3s)   = 13.3 DPS
Shock Wave:   25 DMG × (1/4.5s) = 5.6 DPS
Множитель:    × 1.2
                                ─────────
Общий DPS: ~22.7 DPS ⚠️ (+127% vs PHASE_1)

Здоровье фазы: 50 HP (150 × 0.33)
Время убить:   50/22.7 = 2.2 сек
Реальное время: ~5 сек

ФАЗА 3 (33% - 0% HP)
───────────────────────────────────────
Strike:       55 DMG × (1/2s)   = 27.5 DPS
Shock Wave:   40 DMG × (1/3s)   = 13.3 DPS
Berserk:      160 DMG × (1/8s)  = 20 DPS
Множитель:    × 1.5
                                ─────────
Общий DPS: ~81.25 DPS 🔥 (+257% vs PHASE_1)

Здоровье фазы: 50 HP (150 × 0.33)
Время убить:   50/81.25 = 0.6 сек
Реальное время: ~2 сек

ОБЩЕЕ ВРЕМЯ БОЕВОГО ЦИКЛА:
12 сек (Ф1) + 5 сек (Ф2) + 2 сек (Ф3) + 1 сек (transitions) = ~20 сек
```

---

## 7. СИСТЕМА ЛУТА И НАГРАД

```
Условие: Здоровье при победе

                 100%
                  │
    HEALTH 50% ───┼─────────────────────────── (Лут тир 1)
                  │
                  ├─ getReward()
                  │  ├─ multiplier: 1.0
                  │  ├─ rarity: "common"
                  │  └─ experience: 5000
                  │
    HEALTH 30% ───┼─────────────────────────── (Лут тир 2)
                  │
                  ├─ getReward()
                  │  ├─ multiplier: 1.5
                  │  ├─ rarity: "rare"
                  │  └─ experience: 7500
                  │
    HEALTH 10% ───┼─────────────────────────── (Лют тир 3)
                  │
                  ├─ getReward()
                  │  ├─ multiplier: 2.0
                  │  ├─ rarity: "epic"
                  │  └─ experience: 10000
                  │
                  0%

ПРИМЕРЫ:
┌──────────────────────────────────────────────────┐
│ Сценарий 1: Трудный бой, победа на 60% HP      │
├──────────────────────────────────────────────────┤
│ Лут: COMMON                                      │
│ Опыт: 5000                                       │
│ Причина: Над боссом было много работы            │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ Сценарий 2: Хороший бой, победа на 35% HP      │
├──────────────────────────────────────────────────┤
│ Лют: RARE ✓                                      │
│ Опыт: 7500                                       │
│ Причина: Крепкая победа, отличный боевой навык  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ Сценарий 3: Мастерский бой, победа на 5% HP    │
├──────────────────────────────────────────────────┤
│ Лют: EPIC ⭐                                     │
│ Опыт: 10000                                      │
│ Причина: Идеальное выполнение боевых паттернов  │
└──────────────────────────────────────────────────┘
```

---

## 8. СОСТОЯНИЕ ФАЗОВЫХ ПЕРЕХОДОВ

```
┌─────────────────────────────────────────────────┐
│ НОРМАЛЬНЫЙ БОЙ (isInTransition = false)         │
├─────────────────────────────────────────────────┤
│ ✅ Игрок может атаковать                        │
│ ✅ Босс может атаковать                         │
│ ✅ Выполняются паттерны атак                    │
└─────────────────────────────────────────────────┘
                      │
              takeDamage() → phase changed
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ ПЕРЕХОД ФАЗЫ (isInTransition = true)            │
├─────────────────────────────────────────────────┤
│ ❌ Игрок НЕ может атаковать (frozen)            │
│ ❌ Босс НЕ может атаковать (animation)          │
│                                                  │
│ Воспроизводятся:                               │
│ • Visual Effects (shake, flash, zoom)           │
│ • Sound Cues (roar, power-surge)                │
│ • Particle Effects (burst, aura)                │
│                                                  │
│ Длительность: 1200-1500ms (зависит от фазы)   │
└─────────────────────────────────────────────────┘
                      │
                   setTimeout(duration)
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ НОВАЯ ФАЗА (isInTransition = false)             │
├─────────────────────────────────────────────────┤
│ ✅ Игрок может атаковать                        │
│ ✅ Босс может атаковать (с новыми параметрами)  │
│ ✅ Новые паттерны атак                          │
│ ✅ Новые способности                            │
└─────────────────────────────────────────────────┘
```

---

## 9. ГРАФИК СЛОЖНОСТИ

```
ЛЕГКИЙ (EASY)
   Attack: 15 (━━━━━━━━)
   Defense: 4 (━━)
   Health: 120 (━━━━━━━━━━━━━━━━━)
   
НОРМАЛЬНЫЙ (NORMAL)
   Attack: 25 (━━━━━━━━━━━━━)
   Defense: 10 (━━━━━━)
   Health: 150 (━━━━━━━━━━━━━━━━━━━━)
   
СЛОЖНЫЙ (HARD)
   Attack: 35 (━━━━━━━━━━━━━━━━━━)
   Defense: 15 (━━━━━━━━━)
   Health: 200 (━━━━━━━━━━━━━━━━━━━━━━━━━)

EXP REWARDS:
Easy:     3000 exp (━━━━━━━━━━━━━━━━━━)
Normal:   5000 exp (━━━━━━━━━━━━━━━━━━━━━━━━━━━━━)
Hard:     8000 exp (━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━)
```

---

## 10. ПОЛНЫЙ ЦИКЛ БОЕВОГО РАУНДА

```
┌──────────────────────────────────────────────────────┐
│ БОЕВОЙ ЦИКЛ: 1 ход босса (босс атакует)              │
└──────────────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  ┌──────────────┐         ┌──────────────┐
  │   ШАГИ БОГ  │         │ ПАТТЕРНЫ АТК │
  └──────────────┘         └──────────────┘
        │                         │
        ├─ selectNextAction()     │ Выбрать паттерн
        │  ├─ фильтр по фазе      │ для текущей фазы
        │  └─ выбор по вероятност │ по вероятности
        │                         │
        ▼                         │
  ┌──────────────────┐            │
  │ AttackPatternNode            │
  │ {                             │
  │   action: "ability",         │
  │   value: "Strike"            │
  │ }                             │
  └──────────────────┘            │
        │                          │
        ▼                          │
  ┌──────────────────────────┐     │
  │ boss.useAbility()        │◀────┘
  │ • check cooldown         │
  │ • get variant for phase  │
  │ • update lastUsed        │
  │ return {ability, variant}│
  └──────────────────────────┘
        │
        ▼
  ┌──────────────────────────┐
  │ Получить ВАРИАНТ        │
  │ {                        │
  │   damage: 40             │
  │   cooldown: 3000         │
  │   animation: "intense"   │
  │   windUpTime: 500        │
  │   effect: ARMOR_BUFF     │
  │ }                        │
  └──────────────────────────┘
        │
        ▼
  ┌──────────────────────────┐
  │ playAnimation()          │
  │ + WIND-UP (500ms)        │ ← Игрок может увернуться!
  └──────────────────────────┘
        │
        └─→ setTimeout(500ms)
            │
            ▼
  ┌──────────────────────────┐
  │ Нанести УРОН            │
  │ playerHealth -= 40       │
  └──────────────────────────┘
            │
            ▼
  ┌──────────────────────────┐
  │ Применить ЭФФЕКТ        │
  │ boss.armor += 5          │ ← ARMOR_BUFF
  └──────────────────────────┘

РЕЗУЛЬТАТ:
Игрок получил 40 урона
Босс получил +5 броню на 3 сек
Следующая способность: через 3000ms
```

---

## 11. СРАВНЕНИЕ ВЕРСИЙ

```
╔═══════════════════╦════════════════════╦════════════════════╗
║ Функция           ║ СТАРАЯ ВЕРСИЯ      ║ НОВАЯ ВЕРСИЯ       ║
╠═══════════════════╬════════════════════╬════════════════════╣
║ Фазовые переходы  ║ ❌ Нет сигналов   ║ ✅ Effects + Sound  ║
║ Способности       ║ ❌ 1 вариант       ║ ✅ 3 варианта      ║
║ Паттерны          ║ ❌ Полный рандом  ║ ✅ Взвешенные      ║
║ Wind-up           ║ ❌ Нет             ║ ✅ 400-800ms       ║
║ Сложность         ║ ❌ Фиксированная  ║ ✅ Easy/N/Hard    ║
║ Лут               ║ ❌ Постоянный      ║ ✅ Зависит от HP   ║
║ Комбо             ║ ❌ 1 удар          ║ ✅ 4 удара         ║
║ Эффекты           ║ ❌ Нет             ║ ✅ Баффы/дебаффы   ║
║ Баланс            ║ 3/10 (слишком легко)║ 8/10 (стратегично) ║
╚═══════════════════╩════════════════════╩════════════════════╝
```

---

## 12. ПОТОК ДАННЫХ: takeDamage()

```
boss.takeDamage(40)
│
├─ reducedDamage = max(1, 40 - 10) = 30
│
├─ health -= 30
│  └─ health: 150 → 120
│
├─ updatePhase()
│  ├─ healthPercent = (120/150) × 100 = 80%
│  ├─ Фаза: 80% > 66% → остаемся в PHASE_1
│  └─ phaseChanged = false
│
└─ return {
     reduced: 30,
     phaseChanged: false,
     oldPhase: PHASE_1,
     newPhase: PHASE_1,
     transitionConfig: undefined
   }

──────────────────────────────────────────────

boss.takeDamage(30) ← второй удар
│
├─ reducedDamage = max(1, 30 - 10) = 20
│
├─ health -= 20
│  └─ health: 120 → 100
│
├─ updatePhase()
│  ├─ healthPercent = (100/150) × 100 = 67%
│  ├─ Фаза: 67% > 66% → остаемся в PHASE_1
│  └─ phaseChanged = false
│
└─ return {
     reduced: 20,
     phaseChanged: false,
     ...
   }

──────────────────────────────────────────────

boss.takeDamage(35) ← третий удар ⚠️
│
├─ reducedDamage = max(1, 35 - 10) = 25
│
├─ health -= 25
│  └─ health: 100 → 75
│
├─ updatePhase()
│  ├─ healthPercent = (75/150) × 100 = 50%
│  ├─ Фаза: 50% ≤ 66% → переходим в PHASE_2! 🎉
│  └─ phaseChanged = true
│
├─ onPhaseTransition(PHASE_1, PHASE_2)
│  └─ console.log("PHASE TRANSITION!")
│
└─ return {
     reduced: 25,
     phaseChanged: true,
     oldPhase: PHASE_1,
     newPhase: PHASE_2,
     transitionConfig: {
       effects: ["shake", "flash"],
       soundCue: "commander-roar.ogg",
       duration: 1200,
       playerCanAct: false
     }
   }

// В игре:
// playTransitionEffects(["shake", "flash"])
// playSound("commander-roar.ogg")
// freezePlayer(1200)
// setTimeout(() => { unfreezePlayer() }, 1200)
```

