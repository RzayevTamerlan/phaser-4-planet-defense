import Phaser from 'phaser';
import { ASSET_KEYS } from '../common/assets';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  fire(angle: number, speed: number): void {
    this.setActive(true).setVisible(true).play(ASSET_KEYS.BULLET, true).setScale(1.5).enableBody();
    const velocity = this.scene.physics.velocityFromRotation(angle, speed);
    this.setVelocity(velocity.x, velocity.y);
    this.setRotation(angle + Math.PI / 2);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active) return;
    const { width, height } = this.scene.scale;
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.setActive(false).setVisible(false);
    }
  }
}
