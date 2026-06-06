import Phaser from 'phaser';
import { ASSET_KEYS } from '../common/assets';

const OFFSCREEN_MARGIN = 50;
const MIN_SCALE = 0.75;
const MAX_SCALE = 1.25;
const MIN_ROTATION_SPEED = -0.04;
const MAX_ROTATION_SPEED = 0.04;
const BODY_SIZE_RATIO = 0.3;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  #rotationSpeed = 0;

  spawn(targetX: number, targetY: number, speed: number): void {
    this.setActive(true)
      .setVisible(true)
      .enableBody()
      .play(ASSET_KEYS.ASTEROID, true)
      .setScale(Phaser.Math.FloatBetween(MIN_SCALE, MAX_SCALE));
    this.#rotationSpeed = Phaser.Math.FloatBetween(MIN_ROTATION_SPEED, MAX_ROTATION_SPEED);
    this.scene.physics.moveTo(this, targetX, targetY, speed);
    this.body?.setSize(
      this.displayWidth * BODY_SIZE_RATIO,
      this.displayHeight * BODY_SIZE_RATIO,
      true
    );
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active) return;
    const { width, height } = this.scene.scale;
    if (
      this.x < -OFFSCREEN_MARGIN ||
      this.x > width + OFFSCREEN_MARGIN ||
      this.y < -OFFSCREEN_MARGIN ||
      this.y > height + OFFSCREEN_MARGIN
    ) {
      this.setActive(false).setVisible(false);
      return;
    }
    this.rotation += this.#rotationSpeed;
  }
}
