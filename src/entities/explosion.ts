import Phaser from 'phaser';
import { ASSET_KEYS } from '../common/assets';

export class Explosion extends Phaser.Physics.Arcade.Sprite {
  playAt(x: number, y: number): void {
    this.setPosition(x, y).setActive(true).setVisible(true).play(ASSET_KEYS.ASTEROID_EXPLODE);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.setActive(false).setVisible(false);
    });
  }
}
