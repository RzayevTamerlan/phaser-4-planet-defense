import Phaser from 'phaser';
import { ASSET_KEYS } from '../common/assets';
import { Enemy } from '../entities/enemy';

const INITIAL_SPAWN_DELAY = 1250;
const INITIAL_ENEMY_SPEED = 40;
const MIN_SPAWN_DELAY = 500;
const MAX_ENEMY_SPEED = 200;
const DIFFICULTY_RAMP_INTERVAL = 12000;
const SPAWN_DELAY_DECREMENT = 25;
const ENEMY_SPEED_INCREMENT = 5;

export class EnemySpawner {
  readonly #scene: Phaser.Scene;
  readonly #group: Phaser.Physics.Arcade.Group;
  readonly #targetX: number;
  readonly #targetY: number;
  #spawnDelay = INITIAL_SPAWN_DELAY;
  #enemySpeed = INITIAL_ENEMY_SPEED;
  #spawnTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, targetX: number, targetY: number) {
    this.#scene = scene;
    this.#targetX = targetX;
    this.#targetY = targetY;
    this.#group = scene.physics.add.group({ classType: Enemy });
  }

  get group(): Phaser.Physics.Arcade.Group {
    return this.#group;
  }

  start(): void {
    this.#scheduleNextSpawn();
    this.#scene.time.addEvent({
      delay: DIFFICULTY_RAMP_INTERVAL,
      callback: this.#increaseDifficulty,
      callbackScope: this,
      loop: true,
    });
  }

  #scheduleNextSpawn(): void {
    this.#spawnTimer?.destroy();
    this.#spawnTimer = this.#scene.time.addEvent({
      delay: this.#spawnDelay,
      callback: this.#spawnEnemy,
      callbackScope: this,
      loop: true,
    });
  }

  #spawnEnemy(): void {
    const [x, y] = this.#randomEdgePosition();
    const enemy = this.#group.getFirstDead(
      true,
      x,
      y,
      ASSET_KEYS.ASTEROID,
      0,
      true
    ) as Enemy | null;
    if (!enemy) return;
    enemy.spawn(this.#targetX, this.#targetY, this.#enemySpeed);
  }

  #randomEdgePosition(): [number, number] {
    const { width, height } = this.#scene.scale;
    const edge = Phaser.Math.Between(0, 3);
    if (edge === 0) return [0, Phaser.Math.Between(0, height)];
    if (edge === 1) return [width, Phaser.Math.Between(0, height)];
    if (edge === 2) return [Phaser.Math.Between(0, width), 0];
    return [Phaser.Math.Between(0, width), height];
  }

  #increaseDifficulty(): void {
    if (this.#spawnDelay > MIN_SPAWN_DELAY) {
      this.#spawnDelay -= SPAWN_DELAY_DECREMENT;
      this.#scheduleNextSpawn();
    }
    if (this.#enemySpeed < MAX_ENEMY_SPEED) {
      this.#enemySpeed += ENEMY_SPEED_INCREMENT;
    }
  }
}
