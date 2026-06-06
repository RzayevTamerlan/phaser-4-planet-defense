import Phaser from 'phaser';
import { ASSET_KEYS } from '../common/assets';

const HEART_SPACING = 18;

export class HealthDisplay extends Phaser.GameObjects.Container {
  readonly #hearts: Phaser.GameObjects.Sprite[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, maxHealth: number) {
    super(scene, x, y);
    const startX = -((maxHealth - 1) / 2) * HEART_SPACING;
    for (let i = 0; i < maxHealth; i += 1) {
      const heart = scene.add
        .sprite(startX + i * HEART_SPACING, 0, ASSET_KEYS.HEART, 0)
        .play(ASSET_KEYS.HEART);
      this.#hearts.push(heart);
      this.add(heart);
    }
    scene.add.existing(this);
  }

  loseOne(): void {
    this.#hearts.pop()?.destroy();
  }
}
