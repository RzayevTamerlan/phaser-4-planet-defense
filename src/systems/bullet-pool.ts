import Phaser from 'phaser';
import { ASSET_KEYS } from '../common/assets';
import { Bullet } from '../entities/bullet';
import { Player } from '../entities/player';
import { AudioSystem } from './audio-system';

const FIRE_COOLDOWN_MS = 200;
const BULLET_SPEED = 400;

export class BulletPool {
  readonly #group: Phaser.Physics.Arcade.Group;
  readonly #audio: AudioSystem;

  constructor(scene: Phaser.Scene, audio: AudioSystem) {
    this.#audio = audio;
    this.#group = scene.physics.add.group({ classType: Bullet });
  }

  get group(): Phaser.Physics.Arcade.Group {
    return this.#group;
  }

  fireFrom(player: Player, time: number): void {
    if (!player.tryFire(time, FIRE_COOLDOWN_MS)) return;
    const bullet = this.#group.getFirstDead(
      true,
      player.x,
      player.y,
      ASSET_KEYS.BULLET,
      0,
      true
    ) as Bullet | null;
    if (!bullet) return;
    bullet.fire(player.orbitAngle, BULLET_SPEED);
    this.#audio.playShot();
  }
}
