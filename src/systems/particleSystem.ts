/**
 * Particle System
 * Generates visual effects for bullets, explosions, and impacts
 */

interface ParticleConfig {
  type: 'bullet_impact' | 'critical_explosion' | 'blood_spray' | 'dust';
  position: { x: number; y: number };
  velocity?: { x: number; y: number };
  duration: number;
  color?: string;
  size?: number;
}

interface Particle extends ParticleConfig {
  id: string;
  startTime: number;
  alpha: number;
  scale: number;
}

class ParticleSystem {
  private particles: Map<string, Particle> = new Map();
  private particleId = 0;

  /**
   * Predefined particle effects
   */
  static readonly BULLET_IMPACT = {
    count: 8,
    config: {
      type: 'bullet_impact' as const,
      duration: 600,
      size: 4,
      color: '#FFD700',
    },
  };

  static readonly CRITICAL_EXPLOSION = {
    count: 16,
    config: {
      type: 'critical_explosion' as const,
      duration: 800,
      size: 8,
      color: '#FF4500',
    },
  };

  static readonly BLOOD_SPRAY = {
    count: 10,
    config: {
      type: 'blood_spray' as const,
      duration: 1000,
      size: 5,
      color: '#8B0000',
    },
  };

  /**
   * Emit particles
   */
  emit(baseConfig: ParticleConfig, count: number = 1): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 100 + Math.random() * 150;

      const particle: Particle = {
        ...baseConfig,
        id: `particle_${++this.particleId}`,
        startTime: Date.now(),
        alpha: 1,
        scale: baseConfig.size || 4,
        velocity: baseConfig.velocity || {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
      };

      this.particles.set(particle.id, particle);
    }
  }

  /**
   * Emit predefined effects
   */
  emitBulletImpact(x: number, y: number): void {
    this.emit(
      {
        type: 'bullet_impact',
        position: { x, y },
        duration: 600,
        color: '#FFD700',
        size: 4,
      },
      ParticleSystem.BULLET_IMPACT.count
    );
  }

  emitCriticalExplosion(x: number, y: number): void {
    this.emit(
      {
        type: 'critical_explosion',
        position: { x, y },
        duration: 800,
        color: '#FF4500',
        size: 8,
      },
      ParticleSystem.CRITICAL_EXPLOSION.count
    );
  }

  emitBloodSpray(x: number, y: number): void {
    this.emit(
      {
        type: 'blood_spray',
        position: { x, y },
        duration: 1000,
        color: '#8B0000',
        size: 5,
      },
      ParticleSystem.BLOOD_SPRAY.count
    );
  }

  /**
   * Update particles each frame
   */
  update(deltaTime: number = 1): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, particle] of this.particles.entries()) {
      const elapsed = now - particle.startTime;
      const progress = elapsed / particle.duration;

      if (progress >= 1) {
        toDelete.push(id);
        continue;
      }

      // Update position based on velocity
      if (particle.velocity) {
        particle.position.x += particle.velocity.x * deltaTime * 0.016;
        particle.position.y += particle.velocity.y * deltaTime * 0.016;

        // Apply gravity
        particle.velocity.y += 200 * deltaTime * 0.016;
      }

      // Fade out and shrink
      particle.alpha = 1 - progress;
      particle.scale = (particle.size || 4) * (1 - progress);
    }

    toDelete.forEach(id => this.particles.delete(id));
  }

  /**
   * Get all active particles
   */
  getParticles(): Particle[] {
    return Array.from(this.particles.values());
  }

  /**
   * Get particle count
   */
  getParticleCount(): number {
    return this.particles.size;
  }

  /**
   * Clear all particles
   */
  clearAll(): void {
    this.particles.clear();
  }
}

export { ParticleSystem };
export type { ParticleConfig, Particle };
