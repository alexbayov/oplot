/**
 * Enemy AI System
 * Tactical decision making for enemies based on combat state
 */

interface AIDecision {
  action: 'attack_light' | 'attack_heavy' | 'dodge' | 'charge' | 'heal' | 'wait';
  confidence: number;
  reason: string;
}

interface CombatMetrics {
  playerHealth: number;
  playerStamina: number;
  playerDistance: number;
  enemyHealth: number;
  enemyStamina: number;
  lastPlayerAction?: string;
  turnCount: number;
}

class EnemyAI {
  private difficulty: 'easy' | 'normal' | 'hard' | 'boss' = 'normal';

  constructor(difficulty?: 'easy' | 'normal' | 'hard' | 'boss') {
    if (difficulty) {
      this.difficulty = difficulty;
    }
  }

  /**
   * Determine best action based on combat state
   */
  decidAction(metrics: CombatMetrics): AIDecision {
    const decisions: AIDecision[] = [];

    // Health-based decisions
    if (metrics.enemyHealth < metrics.enemyStamina * 0.3) {
      // Critical health - prioritize healing or running
      if (metrics.enemyHealth > 0) {
        decisions.push({
          action: 'heal',
          confidence: 0.95,
          reason: 'Critical health status - need to restore',
        });
      }
    }

    // Stamina-aware decisions
    if (metrics.enemyStamina > 60) {
      // Heavy stamina - can do heavy attacks
      if (metrics.playerHealth < 30) {
        decisions.push({
          action: 'attack_heavy',
          confidence: 0.85,
          reason: 'Player weakened - go for heavy attack',
        });
      } else if (metrics.playerDistance < 50) {
        decisions.push({
          action: 'attack_heavy',
          confidence: 0.7,
          reason: 'Close range - heavy attack available',
        });
      }
    } else if (metrics.enemyStamina > 30) {
      // Medium stamina - light attack is safe
      decisions.push({
        action: 'attack_light',
        confidence: 0.75,
        reason: 'Adequate stamina for light attack',
      });
    } else {
      // Low stamina - recover
      decisions.push({
        action: 'wait',
        confidence: 0.8,
        reason: 'Low stamina - wait to recover',
      });
    }

    // Distance-based decisions
    if (metrics.playerDistance > 100) {
      decisions.push({
        action: 'charge',
        confidence: 0.6,
        reason: 'Player is far - charge to close distance',
      });
    }

    // Dodge if player is strong and close
    if (
      metrics.playerHealth > 70 &&
      metrics.playerDistance < 40 &&
      metrics.lastPlayerAction?.includes('attack')
    ) {
      decisions.push({
        action: 'dodge',
        confidence: 0.8,
        reason: 'Dangerous player nearby - dodge incoming attack',
      });
    }

    // Apply difficulty modifier
    let bestDecision = this.selectDecision(decisions, metrics);
    bestDecision = this.applyDifficultyModifier(bestDecision, metrics);

    return bestDecision;
  }

  /**
   * Select best decision from candidates
   */
  private selectDecision(
    decisions: AIDecision[],
    metrics: CombatMetrics
  ): AIDecision {
    if (decisions.length === 0) {
      return {
        action: 'wait',
        confidence: 0.5,
        reason: 'No decisions available',
      };
    }

    // Sort by confidence descending
    decisions.sort((a, b) => b.confidence - a.confidence);

    // Add some randomness for variety
    const topChoices = decisions.slice(0, 2);
    const random = Math.random();

    if (random < 0.7 || topChoices.length < 2) {
      return topChoices[0];
    } else {
      return topChoices[1];
    }
  }

  /**
   * Apply difficulty modifiers to decision
   */
  private applyDifficultyModifier(
    decision: AIDecision,
    metrics: CombatMetrics
  ): AIDecision {
    const modifiers = {
      easy: { confidence: (d: number) => d * 0.7, aggressive: false },
      normal: { confidence: (d: number) => d, aggressive: false },
      hard: { confidence: (d: number) => d * 1.1, aggressive: true },
      boss: { confidence: (d: number) => Math.min(d * 1.3, 1), aggressive: true },
    };

    const mod = modifiers[this.difficulty];
    decision.confidence = mod.confidence(decision.confidence);

    // Hard and boss modes make more aggressive choices
    if (mod.aggressive && decision.action === 'wait') {
      decision.action = 'attack_light';
      decision.reason = `[${this.difficulty}] Attacking instead of waiting`;
    }

    return decision;
  }

  /**
   * Predict player next action
   */
  predictPlayerAction(history: string[]): string {
    if (history.length < 2) return 'unknown';

    // Simple pattern recognition
    const lastTwo = history.slice(-2);
    if (lastTwo[0] === lastTwo[1]) {
      return lastTwo[0]; // Player is repeating
    }

    return 'adaptive'; // Player is mixing it up
  }

  /**
   * Set difficulty level
   */
  setDifficulty(difficulty: 'easy' | 'normal' | 'hard' | 'boss'): void {
    this.difficulty = difficulty;
  }

  /**
   * Get current difficulty
   */
  getDifficulty(): string {
    return this.difficulty;
  }
}

export { EnemyAI };
export type { AIDecision, CombatMetrics };
