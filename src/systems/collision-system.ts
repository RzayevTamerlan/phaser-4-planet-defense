import Phaser from 'phaser';
import { PhaserBody } from '../types/phaser-body.type';
import { Bullet } from '../entities/bullet';
import { Enemy } from '../entities/enemy';
import { Planet } from '../entities/planet';
import { HealthDisplay } from '../ui/health-display';
import { AudioSystem } from './audio-system';
import { BulletPool } from './bullet-pool';
import { EnemySpawner } from './enemy-spawner';
import { ExplosionPool } from './explosion-pool';
import { ScoreSystem } from './score-system';

const SHAKE_DURATION_MS = 200;
const SHAKE_INTENSITY = 0.03;

export interface CollisionDependencies {
  planet: Planet;
  bullets: BulletPool;
  enemies: EnemySpawner;
  explosions: ExplosionPool;
  score: ScoreSystem;
  audio: AudioSystem;
  health: HealthDisplay;
  onPlanetDestroyed: () => void;
}

export class CollisionSystem {
  readonly #scene: Phaser.Scene;
  readonly #deps: CollisionDependencies;

  constructor(scene: Phaser.Scene, deps: CollisionDependencies) {
    this.#scene = scene;
    this.#deps = deps;

    scene.physics.add.overlap(
      deps.bullets.group,
      deps.enemies.group,
      this.#onBulletEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    scene.physics.add.overlap(
      deps.planet,
      deps.enemies.group,
      this.#onPlanetEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  #onBulletEnemy = (bullet: PhaserBody, enemy: PhaserBody): void => {
    const b = bullet as Bullet;
    const e = enemy as Enemy;
    b.disableBody(true, true);
    e.disableBody(true, true);
    this.#deps.score.add(1);
    this.#deps.explosions.play(e.x, e.y);
  };

  #onPlanetEnemy = (_planet: PhaserBody, enemy: PhaserBody): void => {
    const e = enemy as Enemy;
    e.disableBody(true, true);
    this.#deps.explosions.play(e.x, e.y);
    this.#deps.audio.playHit();
    this.#deps.health.loseOne();
    this.#deps.planet.takeHit();
    if (this.#deps.planet.outOfHealth) {
      this.#deps.onPlanetDestroyed();
    } else {
      this.#scene.cameras.main.shake(SHAKE_DURATION_MS, SHAKE_INTENSITY);
    }
  };
}
