import Phaser from 'phaser';
import { ASSET_KEYS } from '../common/assets';

const MAX_HEALTH = 3;
const BODY_RADIUS = 30;
const BODY_OFFSET = 18;

export class Planet extends Phaser.Physics.Arcade.Sprite {
  #health = MAX_HEALTH;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSET_KEYS.PLANET, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.play(ASSET_KEYS.PLANET);
    (this.body as Phaser.Physics.Arcade.Body).setCircle(BODY_RADIUS, BODY_OFFSET, BODY_OFFSET);
  }

  get health(): number {
    return this.#health;
  }

  get maxHealth(): number {
    return MAX_HEALTH;
  }

  get outOfHealth(): boolean {
    return this.#health <= 0;
  }

  takeHit(): void {
    this.#health -= 1;
    if (this.#health > 0) {
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.1,
        scaleY: 0.9,
        duration: 200,
        ease: Phaser.Math.Easing.Quadratic.InOut,
        yoyo: true,
      });
    }
  }

  hide(): void {
    this.disableBody(true, true);
  }
}
