import Phaser from 'phaser';
import { ASSET_KEYS } from '../common/assets';

const SHOT_VOLUME = 0.3;
const HIT_VOLUME = 0.4;
const EXPLOSION_VOLUME = 0.3;

export class AudioSystem {
  readonly #scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.#scene = scene;
  }

  playShot(): void {
    this.#scene.sound.play(ASSET_KEYS.FX_SHOT, { volume: SHOT_VOLUME });
  }

  playHit(): void {
    this.#scene.sound.play(ASSET_KEYS.FX_HIT, { volume: HIT_VOLUME });
  }

  playExplosion(): void {
    this.#scene.sound.play(ASSET_KEYS.FX_EXPLOSION, { volume: EXPLOSION_VOLUME });
  }
}
