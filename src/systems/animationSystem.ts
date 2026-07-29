/**
 * Animation System
 * Manages character animations for attacks, movement, and effects
 */

interface AnimationConfig {
  duration: number;
  easing: (t: number) => number;
  from: Record<string, number>;
  to: Record<string, number>;
}

interface ActiveAnimation {
  target: any;
  config: AnimationConfig;
  startTime: number;
  onComplete?: () => void;
}

class AnimationSystem {
  private animations: Map<string, ActiveAnimation> = new Map();
  private animationId = 0;

  /**
   * Easing functions for smooth animations
   */
  private easingFunctions = {
    linear: (t: number) => t,
    easeInQuad: (t: number) => t * t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOutCubic: (t: number) => --t * t * t + 1,
  };

  /**
   * Predefined animation configs
   */
  static readonly LIGHT_ATTACK = {
    duration: 300,
    easing: 'easeOutQuad' as const,
    from: { scale: 1, rotation: 0 },
    to: { scale: 1.2, rotation: 15 },
  };

  static readonly HEAVY_ATTACK = {
    duration: 500,
    easing: 'easeInOutQuad' as const,
    from: { scale: 0.8, rotation: -30 },
    to: { scale: 1.3, rotation: 30 },
  };

  static readonly DODGE = {
    duration: 200,
    easing: 'easeInOutQuad' as const,
    from: { opacity: 1, offsetX: 0 },
    to: { opacity: 0.7, offsetX: 50 },
  };

  static readonly HIT = {
    duration: 150,
    easing: 'easeOutQuad' as const,
    from: { shake: 0 },
    to: { shake: 10 },
  };

  /**
   * Play animation on target
   */
  playAnimation(
    target: any,
    config: Record<string, any>,
    onComplete?: () => void
  ): string {
    const id = `anim_${++this.animationId}`;
    const easingFn = this.easingFunctions[config.easing as keyof typeof this.easingFunctions] || 
                     this.easingFunctions.linear;

    this.animations.set(id, {
      target,
      config: { 
        duration: config.duration,
        from: config.from,
        to: config.to,
        easing: easingFn,
      },
      startTime: Date.now(),
      onComplete,
    });

    return id;
  }

  /**
   * Update animations each frame
   */
  update(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, anim] of this.animations.entries()) {
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.config.duration, 1);
      const easedProgress = (anim.config.easing as (t: number) => number)(progress);

      // Apply interpolation
      for (const key in anim.config.from) {
        const from = anim.config.from[key];
        const to = anim.config.to[key];
        anim.target[key] = from + (to - from) * easedProgress;
      }

      if (progress >= 1) {
        toDelete.push(id);
        if (anim.onComplete) {
          anim.onComplete();
        }
      }
    }

    toDelete.forEach(id => this.animations.delete(id));
  }

  /**
   * Cancel animation by ID
   */
  cancelAnimation(id: string): void {
    this.animations.delete(id);
  }

  /**
   * Clear all animations
   */
  clearAll(): void {
    this.animations.clear();
  }

  /**
   * Get animation count
   */
  getActiveAnimationCount(): number {
    return this.animations.size;
  }
}

export { AnimationSystem };
export type { AnimationConfig, ActiveAnimation };
