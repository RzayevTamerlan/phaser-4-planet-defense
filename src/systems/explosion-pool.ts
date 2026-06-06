import Phaser from 'phaser';
import { ASSET_KEYS } from '../common/assets';
import { Explosion } from '../entities/explosion';
import { AudioSystem } from './audio-system';

export class ExplosionPool {
  readonly #group: Phaser.Physics.Arcade.Group;
  readonly #audio: AudioSystem;

  constructor(scene: Phaser.Scene, audio: AudioSystem) {
    this.#audio = audio;
    this.#group = scene.physics.add.group({ classType: Explosion });
  }

  play(x: number, y: number): void {
    const explosion = this.#group.getFirstDead(
      true,
      x,
      y,
      ASSET_KEYS.ASTEROID_EXPLODE,
      0,
      true
    ) as Explosion | null;
    if (!explosion) return;
    explosion.playAt(x, y);
    this.#audio.playExplosion();
  }
}
