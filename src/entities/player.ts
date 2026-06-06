import Phaser from 'phaser';
import { ASSET_KEYS } from '../common/assets';

export class Player extends Phaser.GameObjects.Image {
  readonly #orbitCenterX: number;
  readonly #orbitCenterY: number;
  readonly #orbitRadius: number;
  #orbitAngle = 0;
  #lastFireTime = 0;

  constructor(
    scene: Phaser.Scene,
    orbitCenterX: number,
    orbitCenterY: number,
    orbitRadius: number
  ) {
    super(scene, 0, 0, ASSET_KEYS.SHIP, 0);
    this.#orbitCenterX = orbitCenterX;
    this.#orbitCenterY = orbitCenterY;
    this.#orbitRadius = orbitRadius;
    scene.add.existing(this);
    this.#updatePosition();
  }

  get orbitAngle(): number {
    return this.#orbitAngle;
  }

  rotateBy(delta: number): void {
    this.#orbitAngle += delta;
    this.#updatePosition();
  }

  tryFire(time: number, cooldownMs: number): boolean {
    if (time <= this.#lastFireTime + cooldownMs) return false;
    this.#lastFireTime = time;
    return true;
  }

  #updatePosition(): void {
    this.setPosition(
      this.#orbitCenterX + this.#orbitRadius * Math.cos(this.#orbitAngle),
      this.#orbitCenterY + this.#orbitRadius * Math.sin(this.#orbitAngle)
    );
    this.rotation = this.#orbitAngle + Math.PI / 2;
  }
}
