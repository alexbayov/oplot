import * as BABYLON from '@babylonjs/core';

export class AudioSystem {
  private scene: BABYLON.Scene;
  private soundCache: Map<string, BABYLON.Sound> = new Map();
  private musicTrack: BABYLON.Sound | null = null;
  
  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }
  
  // Боевые звуки
  playAttackSound(type: 'light' | 'heavy' | 'critical'): void {
    const soundPath = this.getAttackSoundPath(type);
    this.playSound(soundPath);
  }
  
  private getAttackSoundPath(type: string): string {
    const paths: Record<string, string> = {
      light: '/sounds/attack-light.mp3',
      heavy: '/sounds/attack-heavy.mp3',
      critical: '/sounds/critical-hit.mp3',
      miss: '/sounds/miss.mp3',
      death: '/sounds/enemy-death.mp3',
    };
    return paths[type] || paths.light;
  }
  
  // UI звуки
  playUISound(type: 'click' | 'levelup' | 'phase'): void {
    const soundPath = this.getUISoundPath(type);
    this.playSound(soundPath);
  }
  
  private getUISoundPath(type: string): string {
    const paths: Record<string, string> = {
      click: '/sounds/ui-click.mp3',
      levelup: '/sounds/levelup.mp3',
      phase: '/sounds/phase-transition.mp3',
    };
    return paths[type] || paths.click;
  }
  
  // Музыка
  startCombatMusic(phase: 1 | 2 | 3 = 1): void {
    const musicPath = `/sounds/music-combat-phase${phase}.mp3`;
    this.playMusic(musicPath, true);
  }
  
  startBaseMusic(): void {
    this.playMusic('/sounds/music-base.mp3', true);
  }
  
  private playMusic(path: string, loop: boolean): void {
    if (this.musicTrack) {
      this.musicTrack.stop();
    }
    
    this.musicTrack = new BABYLON.Sound('music', path, this.scene, () => {
      this.musicTrack!.loop = loop;
      this.musicTrack!.setVolume(0.5);
      this.musicTrack!.play();
    });
  }
  
  private playSound(path: string): void {
    if (!this.soundCache.has(path)) {
      const sound = new BABYLON.Sound(path, path, this.scene);
      sound.setVolume(0.8);
      this.soundCache.set(path, sound);
    }
    
    const sound = this.soundCache.get(path)!;
    sound.stop();
    sound.play();
  }
  
  stopMusic(): void {
    if (this.musicTrack) {
      this.musicTrack.stop();
      this.musicTrack = null;
    }
  }
}
